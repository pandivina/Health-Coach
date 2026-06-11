import { supabase } from './supabase'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const REQUEST_TIMEOUT_MS = 7000
const COACH_TIMEOUT_MS   = 25000 // El coach necesita más tiempo
const OFFLINE_QUEUE_KEY = 'pandi_offline_workout_queue'

// ─── HELPER DE AUTENTICACIÓN ─────────────────────────────────────────────────
async function getHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

// ─── COLA DE PETICIONES OFFLINE (RESILIENCIA EN EL GYM) ──────────────────────
function enqueueOfflineRequest(method, path, body) {
  // Solo encolamos acciones de mutación en entrenamientos para proteger el almacenamiento
  if (!path.includes('/api/workouts/')) return false

  try {
    const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]')
    
    // Evitar peticiones duplicadas idénticas consecutivas (doble tap accidental)
    const isDuplicate = queue.some(req => req.path === path && JSON.stringify(req.body) === JSON.stringify(body))
    if (isDuplicate) return true

    queue.push({
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      method,
      path,
      body,
      timestamp: new Date().toISOString()
    })
    
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue))
    console.warn(`[Offline Queue] Conexión inestable. Petición guardada localmente para ${path}`)
    return true
  } catch (e) {
    console.error("Error al escribir en la cola offline:", e)
    return false
  }
}

// ─── PROCESADOR AUTOMÁTICO DE COLA AL RECUPERAR COBERTURA ────────────────────
export async function processOfflineQueue() {
  if (!navigator.onLine) return
  
  const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]')
  if (queue.length === 0) return

  console.log(`[Offline Queue] Red restablecida. Sincronizando ${queue.length} acciones pendientes...`)
  const remainingQueue = []
  
  for (const item of queue) {
    try {
      // Forzamos bypassQueue para evitar bucles infinitos en caso de fallo persistente
      await request(item.method, item.path, item.body, { bypassQueue: true, retries: 1 })
      console.log(`[Offline Queue] Sincronizado correctamente: ${item.path}`)
    } catch (err) {
      if (err.message === 'network_error' || err.message === 'timeout') {
        remainingQueue.push(item) // Se mantiene si el problema sigue siendo de red
      } else {
        console.error(`[Offline Queue] Error crítico en datos encolados (descartando):`, err)
      }
    }
  }

  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remainingQueue))
}

// Escuchas nativas de conectividad del ecosistema web
if (typeof window !== 'undefined') {
  window.addEventListener('online', processOfflineQueue)
  setTimeout(processOfflineQueue, 3000) // Intento de vaciado al inicializar la app
}

// ─── PETICIÓN CENTRALIZADA CON CONTROL DE REINTENTOS Y TIMEOUTS ──────────────
async function request(method, path, body, options = {}) {
  const { bypassQueue = false, retries = 3, delay = 1500, timeout = REQUEST_TIMEOUT_MS } = options
  const headers = await getHeaders()
  
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (res.status === 403) throw new Error('premium_required')
    
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Request failed')
    
    return data

  } catch (err) {
    clearTimeout(timeoutId)

    const isTimeout = err.name === 'AbortError'
    const isNetworkError = err.name === 'TypeError' || err.message.includes('Failed to fetch')

    if (isTimeout || isNetworkError) {
      // Si quedan reintentos inmediatos, aplicamos retroceso exponencial backoff
      if (retries > 1) {
        console.warn(`[API Failover] Interferencia en ${path}. Reintentando en ${delay}ms...`)
        await new Promise(res => setTimeout(res, delay))
        return request(method, path, body, { ...options, retries: retries - 1, delay: delay * 2 })
      }

      // Si se agotan los reintentos en una mutación crítica de entreno, se activa la cola offline
      if (!bypassQueue && method !== 'GET') {
        const enqueued = enqueueOfflineRequest(method, path, body)
        if (enqueued) {
          // Mock optimista: la interfaz cree que se guardó y deja al usuario continuar sin bloqueos
          return { _offline: true, success: true, is_pr: false }
        }
      }
      
      throw new Error(isTimeout ? 'timeout' : 'network_error')
    }

    throw err
  }
}

// ─── ESTRUCTURA DE ENDPOINTS EXPORTADOS ──────────────────────────────────────
export const api = {
  coach: {
    chat: async (messages) => {
      let activeContext = null
      try {
        // Captura del estado de Zustand en caliente desde el objeto global de ventana
        const workoutState = window.__store_workout_state__ || null 
        if (workoutState?.activeWorkout) {
          activeContext = {
            routineName:     workoutState.activeWorkout.name,
            senda:           workoutState.activeWorkout.senda,
            elapsedTime:     workoutState.activeWorkout.elapsed,
            progress:        `${workoutState.activeWorkout.currentExerciseIndex + 1}/${workoutState.activeWorkout.exercises.length}`,
            currentExercise: workoutState.activeWorkout.exercises[workoutState.activeWorkout.currentExerciseIndex]?.name
          }
        }
      } catch (e) {}

      return request('POST', '/api/coach', { 
        messages,
        context: {
          activeWorkout: activeContext,
          clientTime:    new Date().toISOString(),
          timezone:      Intl.DateTimeFormat().resolvedOptions().timeZone
         }
      }, { timeout: COACH_TIMEOUT_MS, retries: 1 })
    },
    getQuickTip: (exerciseName, senda) => 
      request('POST', '/api/coach/quick-tip', { exerciseName, senda }),
  },

  notifications: {
    subscribe:   (sub) => request('POST',   '/api/notifications/subscribe',   { subscription: sub }),
    unsubscribe: ()    => request('DELETE', '/api/notifications/unsubscribe'),
    send:        (payload) => request('POST', '/api/notifications/send', payload),
  },

  nutrition: {
    analyzePhoto: (imageBase64, mediaType) => request('POST', '/api/nutrition/analyze-photo', { imageBase64, mediaType }),
    barcode:      (barcode) => request('POST', '/api/nutrition/barcode', { barcode }),
  },

  pantry: {
    uploadReceipt: (imageBase64, mediaType) => request('POST', '/api/pantry/upload-receipt', { imageBase64, mediaType }),
    getItems:      () => request('GET', '/api/pantry/items'),
  },

  recipes: {
    generate: () => request('POST', '/api/recipes/generate', {}),
    cook:     (id) => request('POST', `/api/recipes/cook/${id}`, {}),
  },

  report: {
    today:  () => request('GET', '/api/report/today'),
    weekly: () => request('GET', '/api/report/weekly'),
  },

  insights: {
    get:      () => request('GET',  '/api/insights'),
    generate: () => request('POST', '/api/insights/generate'),
    markSeen: (id) => request('PATCH', `/api/insights/${id}/seen`),
  },

  workouts: {
    getExercises: (params = {}) => {
      const q = new URLSearchParams(params).toString()
      return request('GET', `/api/workouts/exercises${q ? '?' + q : ''}`)
    },
    getTemplates: () => request('GET', '/api/workouts/templates'),
    generate:     (data) => request('POST', '/api/workouts/generate', data),
    start:        (data) => request('POST', '/api/workouts/start', data),
    addExercise:  (data) => request('POST', '/api/workouts/add-exercise', data),
    completeSet:  (data) => request('POST', '/api/workouts/complete-set', data),
    finish:       (data) => request('POST', '/api/workouts/finish', data),
    stats:        () => request('GET', '/api/workouts/stats'),
    
    // Historial vitaminado con caché local (TTL de 5 minutos)
    history: async (forceRefresh = false) => {
      const CACHE_KEY = 'pandi_workout_history_cache'
      const TTL = 5 * 60 * 1000 

      if (!forceRefresh) {
        try {
          const cached = JSON.parse(localStorage.getItem(CACHE_KEY))
          if (cached && (Date.now() - cached.timestamp < TTL)) {
            console.log('[API Cache] Devolviendo historial desde almacenamiento local ⚡')
            return cached.data
          }
        } catch (e) {}
      }

      const data = await request('GET', '/api/workouts/history')
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }))
      } catch (e) {}
      return data
    },
  },

  health: {
    getProfile:       () => request('GET', '/api/health/profile'),
    updateProfile:    (data) => request('PUT', '/api/health/profile', data),
    logWeight:        (data) => request('POST', '/api/health/weight', data),
    getWeightLogs:    () => request('GET', '/api/health/weight'),
    logMeasurements:  (data) => request('POST', '/api/health/measurements', data),
    getMeasurements:  () => request('GET', '/api/health/measurements'),
    getTreatments:    () => request('GET', '/api/health/treatments'),
    addTreatment:     (data) => request('POST', '/api/health/treatments', data),
    deleteTreatment:  (id) => request('DELETE', `/api/health/treatments/${id}`),
  },

  labs: {
    analyze:      (data) => request('POST', '/api/labs/analyze', data),
    getReports:   () => request('GET', '/api/labs/reports'),
    deleteReport: (id) => request('DELETE', `/api/labs/reports/${id}`),
  },

  achievements: {
    check:  (trigger) => request('POST', '/api/achievements/check', { trigger }),
    getAll: () => request('GET', '/api/achievements'),
  },

  email: {
    welcome: () => request('POST', '/api/email/welcome', {}),
  },

  stripe: {
    createCheckout: (priceId) => request('POST', '/api/stripe/create-checkout', { priceId }),
    portal:         () => request('POST', '/api/stripe/portal', {}),
    getStatus:      () => request('GET', '/api/stripe/status'),
  },
}
