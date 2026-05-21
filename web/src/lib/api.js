import { supabase } from './supabase'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

async function getHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function request(method, path, body) {
  const headers = await getHeaders()
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

export const api = {
  coach: {
    chat: (messages) => request('POST', '/api/coach', { messages }),
  },
  notifications: {
    subscribe:   (sub) => request('POST',   '/api/notifications/subscribe',   { subscription: sub }),
    unsubscribe: ()    => request('DELETE',  '/api/notifications/unsubscribe'),
    send: (payload) => request('POST', '/api/notifications/send', payload),
  },
  nutrition: {
    analyzePhoto: (imageBase64, mediaType) => request('POST', '/api/nutrition/analyze-photo', { imageBase64, mediaType }),
    barcode: (barcode) => request('POST', '/api/nutrition/barcode', { barcode }),
  },
  pantry: {
    uploadReceipt: (imageBase64, mediaType) => request('POST', '/api/pantry/upload-receipt', { imageBase64, mediaType }),
    getItems: () => request('GET', '/api/pantry/items'),
  },
  recipes: {
    generate: () => request('POST', '/api/recipes/generate', {}),
    cook: (id) => request('POST', `/api/recipes/cook/${id}`, {}),
  },
  report: {
    today: () => request('GET', '/api/report/today'),
  },
  workouts: {
    getExercises: (params = {}) => {
      const q = new URLSearchParams(params).toString()
      return request('GET', `/api/workouts/exercises${q ? '?' + q : ''}`)
    },
    getTemplates: () => request('GET', '/api/workouts/templates'),
    generate: (data) => request('POST', '/api/workouts/generate', data),
    start: (data) => request('POST', '/api/workouts/start', data),
    addExercise: (data) => request('POST', '/api/workouts/add-exercise', data),
    completeSet: (data) => request('POST', '/api/workouts/complete-set', data),
    finish: (data) => request('POST', '/api/workouts/finish', data),
    history: () => request('GET', '/api/workouts/history'),
    stats: () => request('GET', '/api/workouts/stats'),
  },
  health: {
    getProfile: () => request('GET', '/api/health/profile'),
    updateProfile: (data) => request('PUT', '/api/health/profile', data),
    logWeight: (data) => request('POST', '/api/health/weight', data),
    getWeightLogs: () => request('GET', '/api/health/weight'),
    logMeasurements: (data) => request('POST', '/api/health/measurements', data),
    getMeasurements: () => request('GET', '/api/health/measurements'),
    getTreatments: () => request('GET', '/api/health/treatments'),
    addTreatment: (data) => request('POST', '/api/health/treatments', data),
    deleteTreatment: (id) => request('DELETE', `/api/health/treatments/${id}`),
  },
  labs: {
    analyze: (data) => request('POST', '/api/labs/analyze', data),
    getReports: () => request('GET', '/api/labs/reports'),
    deleteReport: (id) => request('DELETE', `/api/labs/reports/${id}`),
  },
  achievements: {
    check: (trigger) => request('POST', '/api/achievements/check', { trigger }),
    getAll: () => request('GET', '/api/achievements'),
  },
  email: {
    welcome: () => request('POST', '/api/email/welcome', {}),
  },
  stripe: {
    createCheckout: (priceId) => request('POST', '/api/stripe/create-checkout', { priceId }),
    portal: () => request('POST', '/api/stripe/portal', {}),
    getStatus: () => request('GET', '/api/stripe/status'),
  },
}
