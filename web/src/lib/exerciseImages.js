// web/src/lib/exerciseImages.js
// ─── IMÁGENES DE EJERCICIOS — free-exercise-db ────────────────────────────────
// Fuente: https://github.com/yuhonas/free-exercise-db (873 ejercicios, MIT)
// CDN:    jsDelivr (rápido, sin CORS, sin API key)
// Actualizar: cambiar DB_VERSION abajo — recarga automáticamente el cache

const DB_VERSION   = '1'
const BASE_URL     = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main'
const EXERCISES_JSON = `${BASE_URL}/dist/exercises.json`
const CACHE_KEY    = `pandi_exercise_db_v${DB_VERSION}`
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 días

// Mapeo manual Pandi → nombre exacto en la BD
const PANDI_MAP = {
  'push up':          'Push Up',
  'pushup':           'Push Up',
  'pull up':          'Weighted Pull Ups',
  'pullup':           'Weighted Pull Ups',
  'squat':            'Barbell Full Squat',
  'deadlift':         'Axle Deadlift',
  'bench press':      'Barbell Bench Press - Medium Grip',
  'plank':            'Plank',
  'burpee':           null, // no está en la BD — usa fallback emoji
  'lunge':            'Barbell Lunge',
  'mountain climber': 'Mountain Climbers',
  'jump squat':       'Freehand Jump Squat',
  'dumbbell curl':    'Alternate Incline Dumbbell Curl',
  'tricep dip':       null, // no está — usa fallback emoji
  'shoulder press':   'Alternating Cable Shoulder Press',
  'lat pulldown':     'Close-Grip Front Lat Pulldown',
  'romanian deadlift':'Romanian Deadlift',
  'hip thrust':       'Barbell Hip Thrust',
  'crunch':           'Ab Crunch Machine',
  'russian twist':    'Russian Twist',
  'leg raise':        'Flat Bench Lying Leg Raise',
  'calf raise':       'Barbell Seated Calf Raise',
}

// ─── Cache en memoria (evita releer localStorage en cada render) ──────────────
let _db = null

async function loadDB() {
  if (_db) return _db

  // Intentar desde localStorage
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      const { data, ts } = JSON.parse(cached)
      if (Date.now() - ts < CACHE_TTL_MS) {
        _db = data
        return _db
      }
    }
  } catch {}

  // Descargar desde jsDelivr
  try {
    const res  = await fetch(EXERCISES_JSON)
    const data = await res.json()
    _db = data
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }))
    } catch {}
    return _db
  } catch (err) {
    console.warn('[ExerciseImages] No se pudo cargar la BD:', err.message)
    return []
  }
}

// ─── Buscar ejercicio por nombre ──────────────────────────────────────────────
async function findExercise(name) {
  if (!name) return null
  const db = await loadDB()
  if (!db?.length) return null

  const query = name.toLowerCase().trim()

  // 1. Mapeo manual exacto
  const mapped = PANDI_MAP[query]
  if (mapped === null) return null // sin imagen conocida
  if (mapped) {
    const found = db.find(e => e.name === mapped)
    if (found) return found
  }

  // 2. Match exacto por nombre
  const exact = db.find(e => e.name.toLowerCase() === query)
  if (exact) return exact

  // 3. Match parcial
  const partial = db.find(e =>
    e.name.toLowerCase().includes(query) || query.includes(e.name.toLowerCase().split(' ')[0])
  )
  return partial || null
}

// ─── Obtener URL de imagen (posición 0 o 1) ───────────────────────────────────
export async function getExerciseImageUrl(name, position = 0) {
  const exercise = await findExercise(name)
  if (!exercise?.images?.length) return null
  const imgPath = exercise.images[Math.min(position, exercise.images.length - 1)]
  return `${BASE_URL}/exercises/${exercise.id}/images/${imgPath.split('/').pop()}`
}

// ─── Obtener info completa del ejercicio ──────────────────────────────────────
export async function getExerciseInfo(name) {
  const exercise = await findExercise(name)
  if (!exercise) return null
  return {
    name:             exercise.name,
    category:         exercise.category,
    level:            exercise.level,
    primaryMuscles:   exercise.primaryMuscles,
    secondaryMuscles: exercise.secondaryMuscles,
    instructions:     exercise.instructions,
    imageUrl:         exercise.images?.length
      ? `${BASE_URL}/exercises/${exercise.id}/images/${exercise.images[0].split('/').pop()}`
      : null,
    imageUrl2:        exercise.images?.length > 1
      ? `${BASE_URL}/exercises/${exercise.id}/images/${exercise.images[1].split('/').pop()}`
      : null,
  }
}

// ─── Buscar ejercicios por músculo ────────────────────────────────────────────
export async function getExercisesByMuscle(muscle, limit = 10) {
  const db = await loadDB()
  if (!db?.length) return []
  return db
    .filter(e => e.primaryMuscles?.includes(muscle.toLowerCase()) && e.images?.length)
    .slice(0, limit)
    .map(e => ({
      name:    e.name,
      level:   e.level,
      imageUrl:`${BASE_URL}/exercises/${e.id}/images/${e.images[0].split('/').pop()}`,
    }))
}

// ─── Forzar actualización del cache ───────────────────────────────────────────
export async function refreshExerciseDB() {
  _db = null
  try { localStorage.removeItem(CACHE_KEY) } catch {}
  await loadDB()
  console.log('[ExerciseImages] BD actualizada ✅')
}
