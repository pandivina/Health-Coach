import { supabase } from './supabase'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const REQUEST_TIMEOUT_MS = 7000 // 7 segundos máx para no congelar la UI en el gym
const OFFLINE_QUEUE_KEY = 'pandi_offline_workout_queue'

// Helper para obtener token de sesión
async function getHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

// 📦 GESTOR DE COLA OFFLINE PARA ENTRENAMIENTOS CRÍTICOS
function enqueueOfflineRequest(method, path, body) {
  // Solo encolamos acciones mutables del módulo workouts para evitar saturar memoria
  if (!path.includes('/api/workouts/')) return false

  try {
    const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]')
    
    // Evitar duplicar peticiones idénticas seguidas si el usuario pulsa muchas veces
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
    console.warn(`[Offline Queue] Petición encolada con éxito para ${path}`)
    return true
  } catch (e) {
    console.error("Error al guardar en cola offline", e)
    return false
  }
}

// 🔄 PROCESADOR AUTOMÁTICO DE COLA CUANDO VUELVE EL INTERNET
export async function processOfflineQueue() {
  if (!navigator.onLine) return
  
  const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]')
  if (queue.length === 0) return

  console.log(`[Offline Queue] Detectada conexión. Procesando ${queue.length} peticiones pendientes...`)
  
  // Procesamos en orden secuencial estricto (FIFO) para mantener coherencia (ej: add-exercise antes de complete-set)
  const remainingQueue = []
  
  for (const item of queue) {
    try {
      // Llamamos de forma directa pasándole un flag para que no vuelva a encolar en caso de fallo crítico
      await request(item.method, item.path, item.body, { bypassQueue: true, retries: 1 })
      console.log(`[Offline Queue] Sincronizado con éxito: ${item.path}`)
    } catch (err) {
      // Si vuelve a fallar por red, la mantenemos en la cola para el siguiente ciclo
      if (err.message === 'network_error' || err.message === 'timeout') {
        remainingQueue.push(item)
      } else {
        // Si es un error de código o validación (400, 500, etc), se descarta para no trabar la cola
        console.error(`[Offline Queue] Error fatal en petición encolada, descartando:`, err)
      }
    }
  }

  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remainingQueue))
}

// Escuchar eventos globales del navegador para disparar la sincronización nativa en segundo plano
if (typeof window !== 'undefined') {
  window.addEventListener('online', processOfflineQueue)
  // Intentar vaciar cola en la carga inicial de la app por si quedaron cosas ayer
  setTimeout(processOfflineQueue, 3000)
}


// 🚀 PETICIÓN CENTRALIZADA ULTRA RESILIENTE (CON RETRIES, TIMEOUT Y CAPA OFFLINE)
async function request(method, path, body, options = {}) {
  const { bypassQueue = false, retries = 3, delay = 1500 } = options
  
  const headers = await getHeaders()
  
  // Mecanismo de AbortController para forzar el Timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: controller.signal
    })

    clearTimeout(timeoutId) // Limpiar timeout si el servidor respondió a tiempo

    if (res.status === 403) throw new Error('premium_required')
    
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Request failed')
    
    return data

  } catch (err) {
    clearTimeout(timeoutId)

    const isTimeout = err.name === 'AbortError'
    const isNetworkError = err.name === 'TypeError' || err.message.includes('Failed to fetch')

    if (isTimeout || isNetworkError) {
      // Caso A: Si aún nos quedan reintentos inmediatos, los consumimos con retroceso exponencial
      if (retries > 1) {
        console.warn(`[API] Fallo de red en ${path}. Reintentando en ${delay}ms... (Quedan ${retries - 1})`)
        await new Promise(res => setTimeout(res, delay))
        return request(method, path, body, { ...options, retries: retries - 1, delay: delay * 2 })
      }

      // Caso B: Si no quedan reintentos y es una mutación crítica de entrenamiento, se guarda en LocalStorage
      if (!bypassQueue && method !== 'GET') {
        const enqueued = enqueueOfflineRequest(method, path, body)
        if (enqueued) {
          // Retornamos un objeto de éxito simulado (Mock Optimista) 
          // Así tu ActiveWorkoutView cree que todo fue bien, limpia inputs, pita y sigue el cronómetro
          return { _offline: true, success: true, is_pr: false }
        }
      }
      
      throw new Error(isTimeout ? 'timeout' : 'network_error')
    }

    // Errores de lógica de negocio tradicionales (400, 404, 500) pasan directo hacia arriba
    throw err
  }
}
