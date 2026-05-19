import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { getTourSteps } from '../lib/tours'

const TourContext = createContext(null)

export function GuidedTourProvider({ children }) {
  const [activeTour, setActiveTour]   = useState(null)   // tour key
  const [steps, setSteps]             = useState([])
  const [currentStep, setCurrentStep] = useState(0)
  const [targetRect, setTargetRect]   = useState(null)
  const [completedTours, setCompletedTours] = useState({})
  const [userInfo, setUserInfo]       = useState({})
  const rafRef = useRef(null)

  // Cargar tours completados + info de usuario
  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const [toursRes, profileRes, petRes] = await Promise.all([
        supabase.from('user_tours').select('*').eq('user_id', session.user.id),
        supabase.from('user_profiles').select('name, pet_type, pet_name').eq('id', session.user.id).single(),
        supabase.from('user_profiles').select('pet_type, pet_name').eq('id', session.user.id).single(),
      ])

      const completed = {}
      for (const t of toursRes.data || []) {
        completed[t.tour_key] = { completed: t.completed, skipped: t.skipped }
      }
      setCompletedTours(completed)

      const profile = profileRes.data || {}
      setUserInfo({
        userName: profile.name || 'campeón',
        petName:  profile.pet_name || 'Pandi',
        petType:  profile.pet_type || 'panda',
      })
    }
    load()
  }, [])

  // Actualizar posición del target element
  const updateTargetRect = useCallback((selector) => {
    if (!selector) { setTargetRect(null); return }

    function measure() {
      const el = document.querySelector(selector)
      if (!el) { setTargetRect(null); return }

      const rect = el.getBoundingClientRect()
      const padding = 8
      setTargetRect({
        top:    rect.top - padding,
        left:   rect.left - padding,
        width:  rect.width + padding * 2,
        height: rect.height + padding * 2,
        bottom: rect.bottom + padding,
        right:  rect.right + padding,
      })

      // Scroll automático si está fuera de la pantalla
      if (rect.top < 80 || rect.bottom > window.innerHeight - 100) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }

    measure()
    // Re-measure after scroll
    setTimeout(measure, 400)
  }, [])

  // Iniciar un tour
  const startTour = useCallback((tourKey) => {
    const tourSteps = getTourSteps(tourKey, userInfo)
    if (!tourSteps.length) return

    setActiveTour(tourKey)
    setSteps(tourSteps)
    setCurrentStep(0)
    updateTargetRect(tourSteps[0]?.target)
  }, [userInfo, updateTargetRect])

  // Siguiente paso
  const nextStep = useCallback(() => {
    setCurrentStep(prev => {
      const next = prev + 1
      if (next >= steps.length) {
        finishTour(false)
        return prev
      }
      updateTargetRect(steps[next]?.target)
      return next
    })
  }, [steps, updateTargetRect])

  // Paso anterior
  const prevStep = useCallback(() => {
    setCurrentStep(prev => {
      const p = prev - 1
      if (p < 0) return 0
      updateTargetRect(steps[p]?.target)
      return p
    })
  }, [steps, updateTargetRect])

  // Finalizar tour
  const finishTour = useCallback(async (skipped = false) => {
    if (!activeTour) return
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      await supabase.from('user_tours').upsert({
        user_id: activeTour ? session.user.id : null,
        tour_key: activeTour,
        completed: !skipped,
        skipped,
        last_step: currentStep,
        completed_at: skipped ? null : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,tour_key' })
      setCompletedTours(prev => ({ ...prev, [activeTour]: { completed: !skipped, skipped } }))
    }
    setActiveTour(null)
    setSteps([])
    setCurrentStep(0)
    setTargetRect(null)
  }, [activeTour, currentStep])

  // Verificar si un tour debe iniciarse automáticamente
  const checkAutoStart = useCallback((tourKey) => {
    const tourInfo = completedTours[tourKey]
    if (!tourInfo || (!tourInfo.completed && !tourInfo.skipped)) {
      return true // No ha visto este tour
    }
    return false
  }, [completedTours])

  return (
    <TourContext.Provider value={{
      activeTour,
      steps,
      currentStep,
      targetRect,
      userInfo,
      completedTours,
      startTour,
      nextStep,
      prevStep,
      finishTour,
      checkAutoStart,
      isActive: !!activeTour,
    }}>
      {children}
    </TourContext.Provider>
  )
}

export function useTourContext() {
  const ctx = useContext(TourContext)
  if (!ctx) throw new Error('useTourContext must be used inside GuidedTourProvider')
  return ctx
}
