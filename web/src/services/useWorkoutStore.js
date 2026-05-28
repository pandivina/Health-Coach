import { create } from 'zustand'

export const useWorkoutStore = create((set, get) => ({
  // ─── Estado activo ────────────────────────────────────────────────────────
  activeWorkout: null,
  // {
  //   id: string,
  //   name: string,
  //   senda: 'titan' | 'warrior' | 'zen',
  //   startedAt: Date,
  //   exercises: [ { id, name, emoji, sets, reps, rest, libraryData } ],
  //   currentExerciseIndex: number,
  //   currentSetIndex: number,
  //   completedSeries: [ { exerciseId, peso, reps, timestamp } ],
  //   sessionId: string, // ID de Supabase
  // }

  history: [], // entrenamientos completados

  // ─── Acciones ─────────────────────────────────────────────────────────────

  startWorkout: ({ name, senda, exercises, sessionId }) => {
    set({
      activeWorkout: {
        id:                   `workout_${Date.now()}`,
        name,
        senda,
        startedAt:            new Date(),
        exercises:            exercises || [],
        currentExerciseIndex: 0,
        currentSetIndex:      1,
        completedSeries:      [],
        sessionId,
        elapsed:              0,
      }
    })
  },

  logSerie: ({ exerciseId, peso, reps }) => {
    const { activeWorkout } = get()
    if (!activeWorkout) return
    const serie = { exerciseId, peso, reps, timestamp: new Date() }
    set({
      activeWorkout: {
        ...activeWorkout,
        completedSeries:  [...activeWorkout.completedSeries, serie],
        currentSetIndex:  activeWorkout.currentSetIndex + 1,
      }
    })
  },

  advanceExercise: () => {
    const { activeWorkout } = get()
    if (!activeWorkout) return
    const nextIndex = activeWorkout.currentExerciseIndex + 1
    if (nextIndex >= activeWorkout.exercises.length) return // ya está en el último
    set({
      activeWorkout: {
        ...activeWorkout,
        currentExerciseIndex: nextIndex,
        currentSetIndex:      1,
      }
    })
  },

  goToExercise: (index) => {
    const { activeWorkout } = get()
    if (!activeWorkout) return
    set({
      activeWorkout: {
        ...activeWorkout,
        currentExerciseIndex: index,
        currentSetIndex:      1,
      }
    })
  },

  updateElapsed: (seconds) => {
    const { activeWorkout } = get()
    if (!activeWorkout) return
    set({ activeWorkout: { ...activeWorkout, elapsed: seconds } })
  },

  endWorkout: () => {
    const { activeWorkout, history } = get()
    if (!activeWorkout) return
    set({
      activeWorkout: null,
      history: [
        {
          ...activeWorkout,
          finishedAt: new Date(),
          duration: activeWorkout.elapsed,
        },
        ...history,
      ].slice(0, 20),
    })
  },

  // Helper — contexto para el Coach IA
  getCoachContext: () => {
    const { activeWorkout } = get()
    if (!activeWorkout) return null
    const current = activeWorkout.exercises[activeWorkout.currentExerciseIndex]
    return {
      isActive:          true,
      name:              activeWorkout.name,
      senda:             activeWorkout.senda,
      elapsed:           activeWorkout.elapsed,
      currentExercise:   current?.name,
      exercisesDone:     activeWorkout.currentExerciseIndex,
      totalExercises:    activeWorkout.exercises.length,
      seriesCompleted:   activeWorkout.completedSeries.length,
    }
  },
}))
