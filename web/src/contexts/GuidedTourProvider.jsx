import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { getTourSteps } from '../lib/tours'

const TourContext = createContext(null)

export function GuidedTourProvider({ children }) {
  const [activeTour, setActiveTour]   = useState(null)
  const [steps, setSteps]             = useState([])
  const [currentStep, setCurrentStep] = useState(0)
  const [targetRect, setTargetRect]   = useState(null)
  const [completedTours, setCompletedTours] = useState({})
  const [userInfo, setUserInfo]       = useState({})
  const currentSelector = useRef(null)
  const rafRef = useRef(null)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const [toursRes, profileRes] = await Promise.all([
        supabase.from('user_tours').select('*').eq('user_id', session.user.id),
        supabase.from('user_profiles').select('name, pet_type, pet_name').eq('id', session.user.id).single(),
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

  function measureElement(selector) {
    if (!selector) { setTargetRect(null); return }
    const el = document.querySelector(selector)
    if (!el) { setTargetRect(null); return }
    const rect = el.getBoundingClientRect()
    const padding = 10
    setTargetRect({
      top:    rect.top - padding,
      left:   rect.left - padding,
      width:  rect.width + padding * 2,
      height: rect.height + padding * 2,
      bottom: rect.bottom + padding,
      right:  rect.right + padding,
    })
  }

  const updateTargetRect = useCallback((selector) => {
    currentSelector.current = selector
    if (!selector) { setTargetRect(null); return }
    const el = document.querySelector(selector)
    if (!el) { setTargetRect(null); return }
    const rect = el.getBoundingClientRect()
    const outOfView = rect.top < 100 || rect.bottom > window.innerHeight - 100
    if (outOfView) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setTimeout(() => measureElement(selector), 500)
    } else {
      measureElement(selector)
    }
  }, [])

  useEffect(() => {
    if (!activeTour) return
    function onScroll() {
      if (currentSelector.current) {
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
        rafRef.current = requestAnimationFrame(() => measureElement(currentSelector.current))
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    const containers = document.querySelectorAll('.page, main')
    containers.forEach(c => c.addEventListener('scroll', onScroll, { passive: true }))
    return () => {
      window.removeEventListener('scroll', onScroll)
      containers.forEach(c => c.removeEventListener('scroll', onScroll))
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [activeTour])

  useEffect(() => {
    if (!activeTour) return
    function onResize() {
      if (currentSelector.current) measureElement(currentSelector.current)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [activeTour])

  const startTour = useCallback((tourKey) => {
    const tourSteps = getTourSteps(tourKey, userInfo)
    if (!tourSteps.length) return
    setActiveTour(tourKey)
    setSteps(tourSteps)
    setCurrentStep(0)
    setTimeout(() => updateTargetRect(tourSteps[0]?.target), 100)
  }, [userInfo, updateTargetRect])

  const nextStep = useCallback(() => {
    setCurrentStep(prev => {
      const next = prev + 1
      if (next >= steps.length) { finishTour(false); return prev }
      setTimeout(() => updateTargetRect(steps[next]?.target), 50)
      return next
    })
  }, [steps, updateTargetRect])

  const prevStep = useCallback(() => {
    setCurrentStep(prev => {
      const p = Math.max(prev - 1, 0)
      setTimeout(() => updateTargetRect(steps[p]?.target), 50)
      return p
    })
  }, [steps, updateTargetRect])

  const finishTour = useCallback(async (skipped = false) => {
    if (!activeTour) return
    currentSelector.current = null
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      await supabase.from('user_tours').upsert({
        user_id: session.user.id,
        tour_key: activeTour,
        completed: !skipped,
        skipped,
        last_step: currentStep,
        completed_at: skipped ? null : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,tour_key' })
      setCompletedTours(prev => ({ ...prev, [activeTour]: { completed: !skipped, skipped } }))
    }
    setActiveTour(null); setSteps([]); setCurrentStep(0); setTargetRect(null)
  }, [activeTour, currentStep])

  const checkAutoStart = useCallback((tourKey) => {
    const tourInfo = completedTours[tourKey]
    return !tourInfo || (!tourInfo.completed && !tourInfo.skipped)
  }, [completedTours])

  return (
    <TourContext.Provider value={{
      activeTour, steps, currentStep, targetRect, userInfo,
      completedTours, startTour, nextStep, prevStep, finishTour,
      checkAutoStart, isActive: !!activeTour,
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
