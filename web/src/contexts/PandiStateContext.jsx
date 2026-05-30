// src/contexts/PandiStateContext.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Contexto global de Pandi V2.
// Expone: pandiState, recoveryScore, refreshRecovery, updatePandiMood
// Se recalcula automáticamente al montar y cada 6 horas.
// ─────────────────────────────────────────────────────────────────────────────

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useStore } from '../store/useStore'
import { calculateRecoveryScore, recoveryToPandiState } from '../lib/RecoveryEngine'

// ── ESTADO INICIAL DE PANDI (antes de calcular) ───────────────────────────────
const INITIAL_PANDI_STATE = {
  mood:          'curious',
  energyLevel:   65,
  fatigueBlend:  0.2,
  glowIntensity: 0.5,
  coachTone:     'ENCOURAGING',
  sanctuary: {
    weather:        'SUNNY',
    lightingColor:  '#FFF3C4',
    particleEffect: 'FIREFLIES',
    ambientTrack:   'forest_morning',
  },
}

const INITIAL_RECOVERY = {
  score:       65,
  light:       'GREEN',
  components:  {},
  restriction: { allowIntenseTraining: true, mandatoryRestMinutes: 0, suggestedAlternatives: [], message: null },
  missingData: [],
  confidence:  0,
  calculatedAt: null,
}

// ── CONTEXTO ──────────────────────────────────────────────────────────────────
const PandiStateContext = createContext(null)

// ── PROVIDER ──────────────────────────────────────────────────────────────────
export function PandiStateProvider({ children }) {
  const { user, profile } = useStore()

  const [pandiState,   setPandiState]   = useState(INITIAL_PANDI_STATE)
  const [recoveryScore, setRecoveryScore] = useState(INITIAL_RECOVERY)
  const [healthProfile, setHealthProfile] = useState(null)
  const [loading,      setLoading]      = useState(true)

  // Ref para el intervalo de refresco (evita memory leaks)
  const refreshInterval = useRef(null)

  // ── FETCH DE DATOS PARA EL ENGINE ──────────────────────────────────────────
  const fetchRecoveryData = useCallback(async () => {
    if (!user?.id) return

    try {
      // Fetch en paralelo — si alguno falla, el engine usa defaults
      const [hpRes, measRes, moodRes] = await Promise.allSettled([
        supabase
          .from('health_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single(),
        supabase
          .from('body_measurements')
          .select('energy_level, hunger_level, adherence_pct, date')
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .limit(7),
        supabase
          .from('mood_logs')
          .select('score, value, created_at, date')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10),
      ])

      const hp           = hpRes.status === 'fulfilled'   ? hpRes.value.data   : null
      const measurements = measRes.status === 'fulfilled'  ? measRes.value.data || [] : []
      const moods        = moodRes.status === 'fulfilled'  ? moodRes.value.data || [] : []

      // Historial de entrenos del localStorage
      let workoutCache = []
      try {
        const raw = localStorage.getItem('pandi_workout_history_cache')
        if (raw) workoutCache = JSON.parse(raw)
      } catch {}

      if (hp) setHealthProfile(hp)

      // ── Calcular score ──────────────────────────────────────────────────
      const score = calculateRecoveryScore({
        healthProfile:      hp,
        recentMeasurements: measurements,
        workoutCache,
        moodLogs:           moods,
        nutritionLogs:      [], // TODO: conectar cuando nutrition_logs esté disponible
      })

      setRecoveryScore(score)

      // ── Derivar estado de Pandi del score ───────────────────────────────
      const derived = recoveryToPandiState(score)

      // Transición suave: no cambia el mood bruscamente si lleva menos de 4h en el estado actual
      setPandiState(prev => {
        const lastChange = prev._lastMoodChange
        const hoursSince = lastChange
          ? (Date.now() - new Date(lastChange).getTime()) / (1000 * 60 * 60)
          : 999

        // Si el mood cambiaría Y han pasado menos de 4h → mantener el actual
        if (prev.mood !== derived.mood && hoursSince < 4) {
          return {
            ...prev,
            energyLevel:   derived.energyLevel,
            coachTone:     derived.coachTone,
            sanctuary:     derived.sanctuary,
          }
        }

        return {
          ...derived,
          _lastMoodChange: prev.mood !== derived.mood ? new Date().toISOString() : prev._lastMoodChange,
        }
      })

    } catch (err) {
      console.warn('[PandiState] Error calculando recovery score:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // ── MOUNT: calcular al arrancar ────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    fetchRecoveryData()

    // Refresco automático cada 6 horas
    refreshInterval.current = setInterval(fetchRecoveryData, 6 * 60 * 60 * 1000)

    return () => {
      if (refreshInterval.current) clearInterval(refreshInterval.current)
    }
  }, [user?.id, fetchRecoveryData])

  // ── RECALCULAR cuando llega nuevo dato relevante ───────────────────────────
  // Escucha cambios en body_measurements en tiempo real
  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel(`pandi_recovery_${user.id}`)
      .on('postgres_changes', {
        event:  '*',
        schema: 'public',
        table:  'body_measurements',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        // Nuevo registro de medidas → recalcular con un pequeño delay
        setTimeout(fetchRecoveryData, 500)
      })
      .on('postgres_changes', {
        event:  '*',
        schema: 'public',
        table:  'weight_logs',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        setTimeout(fetchRecoveryData, 500)
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user?.id, fetchRecoveryData])

  // ── API PÚBLICA DEL CONTEXTO ───────────────────────────────────────────────

  // Forzar recálculo (útil tras registrar un entreno, sueño, etc.)
  const refreshRecovery = useCallback(() => {
    return fetchRecoveryData()
  }, [fetchRecoveryData])

  // Override manual del mood (para animaciones puntuales: celebración, etc.)
  const updatePandiMood = useCallback((mood, durationMs = 3000) => {
    setPandiState(prev => ({ ...prev, mood }))
    // Vuelve al mood calculado después de durationMs
    if (durationMs > 0) {
      setTimeout(() => {
        fetchRecoveryData()
      }, durationMs)
    }
  }, [fetchRecoveryData])

  // ── SEMÁFORO PARA EL COACH ─────────────────────────────────────────────────
  // Expone la restricción de entrenamiento directamente
  const trainingAllowed  = recoveryScore.restriction.allowIntenseTraining
  const recoveryMessage  = recoveryScore.restriction.message
  const recoveryLight    = recoveryScore.light

  return (
    <PandiStateContext.Provider value={{
      // Estado visual de Pandi
      pandiState,
      setPandiState,
      updatePandiMood,

      // Recovery
      recoveryScore,
      recoveryLight,
      trainingAllowed,
      recoveryMessage,
      healthProfile,

      // Control
      loading,
      refreshRecovery,
    }}>
      {children}
    </PandiStateContext.Provider>
  )
}

// ── HOOK DE ACCESO ────────────────────────────────────────────────────────────
export function usePandiState() {
  const ctx = useContext(PandiStateContext)
  if (!ctx) throw new Error('usePandiState debe usarse dentro de <PandiStateProvider>')
  return ctx
}

// ── HOOK ESPECÍFICO PARA EL COACH ─────────────────────────────────────────────
// Devuelve solo el contexto que necesita el system prompt del Coach
export function useCoachContext() {
  const {
    recoveryScore,
    recoveryLight,
    trainingAllowed,
    recoveryMessage,
    healthProfile,
    pandiState,
  } = usePandiState()

  const { profile } = useStore()

  return {
    recoveryScore:   recoveryScore.score,
    recoveryLight,
    trainingAllowed,
    recoveryMessage,
    coachTone:       pandiState.coachTone,
    userName:        profile?.name || 'Usuario',
    streakDays:      profile?.streak || 0,
    currentGoal:     healthProfile?.goal || profile?.goal || 'health',
    sleepHours:      healthProfile?.sleep_hours || 7,
    activityLevel:   healthProfile?.activity_level || 'moderate',
    confidence:      recoveryScore.confidence,
    missingData:     recoveryScore.missingData,
  }
}
