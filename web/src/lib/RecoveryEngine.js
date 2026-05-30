// src/lib/RecoveryEngine.js
// ─────────────────────────────────────────────────────────────────────────────
// Calcula el RecoveryScore a partir de los datos disponibles en Pandi V2.
// Diseñado para degradarse con gracia: si faltan datos, usa defaults sensatos.
// Se enriquece automáticamente cuando se añadan sleep_logs, workout_logs, etc.
// ─────────────────────────────────────────────────────────────────────────────

// ── PESOS POR COMPONENTE ──────────────────────────────────────────────────────
const WEIGHTS = {
  sleep:      0.35,
  load:       0.25,
  energy:     0.20,
  mood:       0.10,
  nutrition:  0.10,
}

// ── DEFAULTS CUANDO NO HAY DATO ───────────────────────────────────────────────
const DEFAULTS = {
  sleepScore:    65,   // asume sueño mediocre si no hay dato
  loadScore:     80,   // asume carga normal si no hay entrenos
  energyScore:   65,   // asume energía media
  moodScore:     65,
  nutritionScore:65,
}

// ─────────────────────────────────────────────────────────────────────────────
// FUNCIÓN PRINCIPAL
// Params:
//   healthProfile : row de health_profiles (weight_kg, sleep_hours, etc.)
//   recentMeasurements : array de body_measurements ordenado desc (con energy_level)
//   workoutCache  : array de entrenos recientes (del localStorage o workout_logs)
//   moodLogs      : array de registros de mood recientes (opcional)
//   nutritionLogs : array de registros de nutrición recientes (opcional)
// ─────────────────────────────────────────────────────────────────────────────
export function calculateRecoveryScore({
  healthProfile     = null,
  recentMeasurements = [],
  workoutCache      = [],
  moodLogs          = [],
  nutritionLogs     = [],
} = {}) {

  const components = {}

  // ── 1. SUEÑO ─────────────────────────────────────────────────────────────
  // Fuente: healthProfile.sleep_hours (habitual) como proxy hasta tener sleep_logs
  const sleepHours = parseFloat(healthProfile?.sleep_hours) || null
  if (sleepHours) {
    // Óptimo: 7–9h → 100pts. Cada hora de diferencia resta ~15pts
    const optimalSleep = 8
    const sleepDiff    = Math.abs(sleepHours - optimalSleep)
    components.sleepScore = Math.max(0, Math.min(100, 100 - sleepDiff * 15))
  } else {
    components.sleepScore = DEFAULTS.sleepScore
  }

  // ── 2. CARGA DE ENTRENAMIENTO ─────────────────────────────────────────────
  // Fuente: localStorage pandi_workout_history_cache o workout_logs
  const recentWorkouts = getRecentWorkouts(workoutCache)
  if (recentWorkouts.length > 0) {
    const trainingDaysPerWeek = parseInt(healthProfile?.training_days_per_week) || 3
    const workoutsLast7d      = recentWorkouts.filter(w => daysAgo(w.date) <= 7).length
    const loadRatio           = trainingDaysPerWeek > 0
      ? workoutsLast7d / trainingDaysPerWeek
      : 1

    // loadRatio 1.0 → 100pts | 1.5 → 75pts | 2.0 → 50pts | 0.5 → 90pts (poco entreno no penaliza tanto)
    const loadScore = loadRatio <= 1
      ? Math.min(100, 90 + (1 - loadRatio) * 10)
      : Math.max(0, 100 - (loadRatio - 1) * 50)

    // RPE promedio de los últimos 7 días si está disponible
    const rpeValues = recentWorkouts
      .filter(w => daysAgo(w.date) <= 7 && w.rpe)
      .map(w => parseFloat(w.rpe))
    const avgRpe = rpeValues.length > 0
      ? rpeValues.reduce((a, b) => a + b, 0) / rpeValues.length
      : null

    const rpeScore = avgRpe
      ? Math.max(0, Math.min(100, 100 - (avgRpe - 4) * 15))
      : 75

    components.loadScore = Math.round((loadScore * 0.6 + rpeScore * 0.4))
  } else {
    components.loadScore = DEFAULTS.loadScore
  }

  // ── 3. ENERGÍA SUBJETIVA ──────────────────────────────────────────────────
  // Fuente: body_measurements.energy_level (1–10) del registro más reciente
  const latestMeasurement = recentMeasurements[0]
  if (latestMeasurement?.energy_level) {
    const energy = parseFloat(latestMeasurement.energy_level)
    components.energyScore = Math.round((energy / 10) * 100)
  } else {
    components.energyScore = DEFAULTS.energyScore
  }

  // ── 4. ESTADO DE ÁNIMO ────────────────────────────────────────────────────
  // Fuente: mood_logs si existen, sino body_measurements.hunger_level como proxy
  const recentMoods = moodLogs.filter(m => daysAgo(m.date || m.created_at) <= 3)
  if (recentMoods.length > 0) {
    const avgMood = recentMoods.reduce((sum, m) => sum + (m.score || m.value || 5), 0) / recentMoods.length
    components.moodScore = Math.round((avgMood / 10) * 100)
  } else if (latestMeasurement?.hunger_level) {
    // Hambre alta (>7) puede indicar déficit → penaliza levemente
    const hunger = parseFloat(latestMeasurement.hunger_level)
    components.moodScore = hunger > 7
      ? Math.round(60 - (hunger - 7) * 10)
      : DEFAULTS.moodScore
  } else {
    components.moodScore = DEFAULTS.moodScore
  }

  // ── 5. NUTRICIÓN ──────────────────────────────────────────────────────────
  // Fuente: nutrition_logs de los últimos 3 días (adherencia a calorías objetivo)
  const recentNutrition = nutritionLogs.filter(n => daysAgo(n.date || n.created_at) <= 3)
  if (recentNutrition.length > 0 && healthProfile?.target_calories) {
    const target = healthProfile.target_calories
    const avgCals = recentNutrition.reduce((sum, n) =>
      sum + (n.total_calories || n.calories || target), 0) / recentNutrition.length
    const ratio = avgCals / target
    // 90–110% de las calorías objetivo → 100pts. Más lejos → penaliza
    const nutritionScore = ratio >= 0.9 && ratio <= 1.1
      ? 100
      : ratio < 0.9
        ? Math.max(0, 100 - (0.9 - ratio) * 200)
        : Math.max(0, 100 - (ratio - 1.1) * 150)
    components.nutritionScore = Math.round(nutritionScore)
  } else {
    components.nutritionScore = DEFAULTS.nutritionScore
  }

  // ── SCORE COMPUESTO ───────────────────────────────────────────────────────
  const score = Math.round(
    components.sleepScore    * WEIGHTS.sleep +
    components.loadScore     * WEIGHTS.load  +
    components.energyScore   * WEIGHTS.energy +
    components.moodScore     * WEIGHTS.mood  +
    components.nutritionScore * WEIGHTS.nutrition
  )

  // ── SEMÁFORO ──────────────────────────────────────────────────────────────
  const light = score >= 70 ? 'GREEN' : score >= 45 ? 'YELLOW' : 'RED'

  // ── RESTRICCIONES ─────────────────────────────────────────────────────────
  const restriction = buildRestriction(light)

  // ── DATOS QUE FALTAN (para sugerencias de mejora del sistema) ────────────
  const missingData = []
  if (!sleepHours)                    missingData.push('sleep_logs')
  if (recentWorkouts.length === 0)    missingData.push('workout_logs')
  if (!latestMeasurement)             missingData.push('body_measurements')
  if (moodLogs.length === 0)          missingData.push('mood_logs')
  if (recentNutrition.length === 0)   missingData.push('nutrition_logs')

  return {
    score,
    light,
    components,
    restriction,
    missingData,
    calculatedAt: new Date().toISOString(),
    confidence: Math.round(((5 - missingData.length) / 5) * 100), // % de datos reales vs defaults
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function daysAgo(dateStr) {
  if (!dateStr) return 999
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

function getRecentWorkouts(workoutCache) {
  // Soporta tanto el formato del localStorage como workout_logs de Supabase
  if (!workoutCache || !Array.isArray(workoutCache)) return []
  return workoutCache
    .filter(w => daysAgo(w.date || w.created_at) <= 14)
    .sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at))
}

function buildRestriction(light) {
  if (light === 'GREEN') return {
    allowIntenseTraining:  true,
    mandatoryRestMinutes:  0,
    suggestedAlternatives: [],
    message:               null,
  }
  if (light === 'YELLOW') return {
    allowIntenseTraining:  false,
    mandatoryRestMinutes:  20,
    suggestedAlternatives: ['mobility', 'yoga', 'easy_cardio'],
    message:               'Tu cuerpo pide moderación hoy. Entrena, pero sin forzar.',
  }
  return {
    allowIntenseTraining:  false,
    mandatoryRestMinutes:  45,
    suggestedAlternatives: ['meditation', 'stretching', 'breathing'],
    message:               'Hoy el descanso activo ES el entrenamiento.',
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAPEO SEMÁFORO → ESTADO DE PANDI
// Usado por PandiStateContext para derivar mood/sanctuary
// ─────────────────────────────────────────────────────────────────────────────
export function recoveryToPandiState(recoveryScore) {
  const { light, score } = recoveryScore

  if (light === 'GREEN') return {
    mood:            score >= 85 ? 'pumped'   : 'happy',
    energyLevel:     score,
    fatigueBlend:    0.0,
    glowIntensity:   0.8,
    coachTone:       'ENCOURAGING',
    sanctuary: {
      weather:          'SUNNY',
      lightingColor:    '#FFF3C4',
      particleEffect:   'FIREFLIES',
      ambientTrack:     'forest_morning',
    },
  }

  if (light === 'YELLOW') return {
    mood:            'tired',
    energyLevel:     score,
    fatigueBlend:    0.4,
    glowIntensity:   0.3,
    coachTone:       'FIRM',
    sanctuary: {
      weather:          'CLOUDY',
      lightingColor:    '#B0C4DE',
      particleEffect:   'LEAVES',
      ambientTrack:     'light_rain',
    },
  }

  return {
    mood:            'depleted',
    energyLevel:     score,
    fatigueBlend:    0.9,
    glowIntensity:   0.0,
    coachTone:       'GENTLE',
    sanctuary: {
      weather:          'RAINY',
      lightingColor:    '#4A4A5A',
      particleEffect:   'RAIN',
      ambientTrack:     'heavy_rain',
    },
  }
}
