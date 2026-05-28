import { create } from 'zustand'

export const useWorkoutStore = create((set, get) => ({
  // ─── Estado activo ────────────────────────────────────────────────────────
  activeWorkout: null,
  history: [], // entrenamientos completados

  // ─── Acciones ─────────────────────────────────────────────────────────────
  startWorkout: ({ name, senda, exercises, sessionId }) => {
    // Preparar los ejercicios inyectándoles un array vacío de series completadas localmente
    const preparedExercises = (exercises || []).map(ex => ({
      ...ex,
      completedSetsList: [] // Almacenará { peso, reps, timestamp }
    }))

    set({
      activeWorkout: {
        id:                   `workout_${Date.now()}`,
        name,
        senda,
        startedAt:            new Date(),
        exercises:            preparedExercises,
        currentExerciseIndex: 0,
        currentSetIndex:      1, // Representa la serie que SE VA A REALIZAR
        sessionId,
        elapsed:              0,
      }
    })
  },

  logSerie: ({ exerciseId, peso, reps }) => {
    const { activeWorkout } = get()
    if (!activeWorkout) return

    const nuevaSerie = { peso, reps, timestamp: new Date() }

    // Mapeamos los ejercicios para añadir la serie al ejercicio correspondiente
    const updatedExercises = activeWorkout.exercises.map(ex => {
      if (ex.id === exerciseId) {
        return {
          ...ex,
          completedSetsList: [...ex.completedSetsList, nuevaSerie]
        }
      }
      return ex
    })

    set({
      activeWorkout: {
        ...activeWorkout,
        exercises:       updatedExercises,
        currentSetIndex: activeWorkout.currentSetIndex + 1, // Siguiente set
      }
    })
  },

  advanceExercise: () => {
    const { activeWorkout } = get()
    if (!activeWorkout) return
    const nextIndex = activeWorkout.currentExerciseIndex + 1
    if (nextIndex >= activeWorkout.exercises.length) return 
    
    set({
      activeWorkout: {
        ...activeWorkout,
        currentExerciseIndex: nextIndex,
        currentSetIndex:      1, // Resetea al set 1 del nuevo ejercicio
      }
    })
  },

  goToExercise: (index) => {
    const { activeWorkout } = get()
    if (!activeWorkout) return
    if (index < 0 || index >= activeWorkout.exercises.length) return

    set({
      activeWorkout: {
        ...activeWorkout,
        currentExerciseIndex: index,
        currentSetIndex:      activeWorkout.exercises[index].completedSetsList.length + 1,
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

  // Helper reactivo — Esto es lo que consumirá en tiempo real tu "HealthCoach.jsx"
  getCoachContext: () => {
    const { activeWorkout } = get()
    if (!activeWorkout) return { isActive: false }
    
    const currentEx = activeWorkout.exercises[activeWorkout.currentExerciseIndex]
    const lastSet = currentEx?.completedSetsList[currentEx.completedSetsList.length - 1] || null

    return {
      isActive:               true,
      name:                   activeWorkout.name,
      senda:                  activeWorkout.senda,
      elapsed:                activeWorkout.elapsed,
      currentExerciseName:    currentEx?.name || '',
      currentExerciseEmoji:   currentEx?.emoji || '💪',
      seriesCompletedInEx:    currentEx?.completedSetsList.length || 0,
      totalSetsRequired:      currentEx?.sets || 3,
      lastSetRegistered:      lastSet ? { peso: lastSet.peso, reps: lastSet.reps } : null,
      progressPercent:        Math.round((activeWorkout.currentExerciseIndex / activeWorkout.exercises.length) * 100)
    }
  },
}))
