// ─── contexts/CoachAwarenessContext.jsx ──────────────────────────────────────
// Contexto global que conecta todos los módulos con el Coach
// Cualquier página puede leer/escribir el estado del usuario en tiempo real
// El Coach lo consume en cada conversación via useSectionContext

import { createContext, useContext, useEffect, useReducer, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useStore } from '../store/useStore'

// ─── ESTADO INICIAL ───────────────────────────────────────────────────────────

const INITIAL_STATE = {
  // Snapshot del usuario (se sincroniza con user_snapshot de Supabase)
  snapshot: null,
  snapshotLoading: true,

  // Estado en tiempo real (actualizado por cada módulo)
  today: {
    calories:    0,
    protein:     0,
    water:       0,
    waterGoal:   8,
    sleepHours:  null,
    sleepQuality:null,
    mood:        null,
    workoutDone: false,
    workoutName: null,
  },

  // Estado de Pandi
  pandiStage: 'baby',   // 'baby'|'puppy'|'young'|'adult'|'master'
  pandiMood:  'happy',  // 'happy'|'neutral'|'sad'|'excited'|'tired'|'celebrating'

  // Plan de mañana (generado por el cron de las 22:00)
  tomorrowPlan: null,
  dayState:     null,   // 'GREEN'|'YELLOW'|'RED'

  // Contexto del módulo activo (para el Coach)
  activeModule: null,
  moduleContext: {},

  // Alertas activas
  alerts: [],
}

// ─── REDUCER ──────────────────────────────────────────────────────────────────

function reducer(state, action) {
  switch (action.type) {

    case 'SET_SNAPSHOT':
      return {
        ...state,
        snapshot: action.payload,
        snapshotLoading: false,
        pandiStage: action.payload?.pandi_stage || 'baby',
        pandiMood:  action.payload?.pandi_mood  || 'happy',
        tomorrowPlan: action.payload?.tomorrow_plan || null,
        dayState:     action.payload?.day_state     || null,
        today: {
          ...state.today,
          mood:        action.payload?.today_mood          || null,
          sleepHours:  action.payload?.today_sleep_hours   || null,
          sleepQuality:action.payload?.today_sleep_quality || null,
          water:       action.payload?.today_water_glasses || 0,
          waterGoal:   action.payload?.today_water_goal    || 8,
        },
      }

    case 'UPDATE_TODAY':
      return {
        ...state,
        today: { ...state.today, ...action.payload },
      }

    case 'SET_PANDI_MOOD':
      return { ...state, pandiMood: action.payload }

    case 'SET_PANDI_STAGE':
      return { ...state, pandiStage: action.payload }

    case 'SET_MODULE_CONTEXT':
      return {
        ...state,
        activeModule:  action.payload.module,
        moduleContext: action.payload.context,
      }

    case 'ADD_ALERT':
      return {
        ...state,
        alerts: [...state.alerts.filter(a => a.id !== action.payload.id), action.payload],
      }

    case 'CLEAR_ALERT':
      return { ...state, alerts: state.alerts.filter(a => a.id !== action.payload) }

    case 'SET_TOMORROW_PLAN':
      return { ...state, tomorrowPlan: action.payload.plan, dayState: action.payload.state }

    default:
      return state
  }
}

// ─── CONTEXTO ─────────────────────────────────────────────────────────────────

const CoachAwarenessContext = createContext(null)

export function CoachAwarenessProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE)
  const { user }          = useStore()
  const realtimeRef       = useRef(null)

  // ── Cargar snapshot inicial ────────────────────────────────────────────────
  const loadSnapshot = useCallback(async () => {
    if (!user?.id) return
    try {
      const { data } = await supabase
        .from('user_snapshot')
        .select('*')
        .eq('id', user.id)
        .single()
      if (data) dispatch({ type: 'SET_SNAPSHOT', payload: data })
    } catch (err) {
      console.error('CoachAwareness: snapshot error', err.message)
    }
  }, [user?.id])

  useEffect(() => {
    loadSnapshot()
  }, [loadSnapshot])

  // ── Suscripción realtime a cambios del usuario ────────────────────────────
  useEffect(() => {
    if (!user?.id) return

    // Escuchar cambios en user_profiles (level, pandi_mood, pandi_stage)
    realtimeRef.current = supabase
      .channel(`awareness:${user.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'user_profiles',
        filter: `id=eq.${user.id}`,
      }, (payload) => {
        const { new: row } = payload
        if (row?.pandi_mood)  dispatch({ type: 'SET_PANDI_MOOD',  payload: row.pandi_mood  })
        if (row?.pandi_stage) dispatch({ type: 'SET_PANDI_STAGE', payload: row.pandi_stage })
      })
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'mood_logs',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const { new: row } = payload
        if (row?.mood) dispatch({ type: 'UPDATE_TODAY', payload: { mood: row.mood } })
      })
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'hydration_logs',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const { new: row } = payload
        dispatch({ type: 'UPDATE_TODAY', payload: {
          water:     row?.glasses  || 0,
          waterGoal: row?.goal     || 8,
        }})
      })
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'workout_sessions',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const { new: row } = payload
        if (row?.status === 'completed') {
          dispatch({ type: 'UPDATE_TODAY', payload: {
            workoutDone: true, workoutName: row.name,
          }})
          dispatch({ type: 'SET_PANDI_MOOD', payload: 'celebrating' })
          // Volver a happy tras 30 segundos
          setTimeout(() => dispatch({ type: 'SET_PANDI_MOOD', payload: 'happy' }), 30000)
        }
      })
      .subscribe()

    return () => {
      realtimeRef.current?.unsubscribe()
    }
  }, [user?.id])

  // ── API pública ────────────────────────────────────────────────────────────

  // Cualquier módulo llama esto para registrar su contexto
  const setModuleContext = useCallback((module, context) => {
    dispatch({ type: 'SET_MODULE_CONTEXT', payload: { module, context } })
  }, [])

  // Actualizar datos de hoy desde cualquier módulo
  const updateToday = useCallback((data) => {
    dispatch({ type: 'UPDATE_TODAY', payload: data })
  }, [])

  // Añadir alerta (ej: 3 días de ánimo bajo, racha a punto de romperse)
  const addAlert = useCallback((alert) => {
    dispatch({ type: 'ADD_ALERT', payload: alert })
  }, [])

  const clearAlert = useCallback((id) => {
    dispatch({ type: 'CLEAR_ALERT', payload: id })
  }, [])

  // Calcular recovery light en tiempo real
  const recoveryLight = (() => {
    const { mood, sleepHours, water, waterGoal, workoutDone, calories } = state.today
    const snapshot = state.snapshot
    if (!snapshot) return 'GREEN'

    let score = 0, count = 0

    if (mood        != null) { score += mood / 5;                                     count++ }
    if (sleepHours  != null) { score += Math.min(sleepHours / 7, 1);                  count++ }
    if (waterGoal   >  0)    { score += Math.min((water || 0) / waterGoal, 1);        count++ }
    if (workoutDone)         { score += 1;                                             count++ }

    if (count === 0) return 'GREEN'
    const avg = score / count
    return avg > 0.65 ? 'GREEN' : avg > 0.35 ? 'YELLOW' : 'RED'
  })()

  // Construir contexto para el Coach (lo que ve en cada conversación)
  const buildCoachContext = useCallback(() => {
    const { today, snapshot, activeModule, moduleContext, tomorrowPlan, dayState } = state
    return {
      // Datos del día
      caloriesConsumed:  today.calories,
      caloriesGoal:      snapshot?.calorie_goal,
      proteinConsumed:   today.protein,
      proteinGoal:       snapshot?.protein_goal,
      waterGlasses:      today.water,
      waterGoal:         today.waterGoal,
      sleepHours:        today.sleepHours,
      moodToday:         today.mood,
      workedOutToday:    today.workoutDone,
      workoutName:       today.workoutName,
      // Estado
      recoveryLight,
      pandiStage:        state.pandiStage,
      pandiMood:         state.pandiMood,
      // Módulo activo
      activeModule,
      ...moduleContext,
      // Plan
      tomorrowPlan,
      dayState,
    }
  }, [state, recoveryLight])

  const value = {
    // Estado
    ...state,
    recoveryLight,
    // Métodos
    setModuleContext,
    updateToday,
    addAlert,
    clearAlert,
    buildCoachContext,
    refreshSnapshot: loadSnapshot,
  }

  return (
    <CoachAwarenessContext.Provider value={value}>
      {children}
    </CoachAwarenessContext.Provider>
  )
}

export function useCoachAwareness() {
  const ctx = useContext(CoachAwarenessContext)
  if (!ctx) throw new Error('useCoachAwareness must be used inside CoachAwarenessProvider')
  return ctx
}

// ─── HOOK DE MÓDULO ───────────────────────────────────────────────────────────
// Cada página lo usa para registrar su contexto con una sola línea
// Reemplaza useSectionContext — es más potente y reactivo

export function useModuleAwareness(moduleName, contextData) {
  const { setModuleContext } = useCoachAwareness()

  useEffect(() => {
    setModuleContext(moduleName, contextData)
  }, [moduleName, JSON.stringify(contextData)])
}
