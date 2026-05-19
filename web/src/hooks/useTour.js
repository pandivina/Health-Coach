import { useEffect, useRef } from 'react'
import { useTourContext } from '../contexts/GuidedTourProvider'

// Hook para iniciar automáticamente un tour en una página
export function useTour(tourKey, { autoStart = true, delay = 800 } = {}) {
  const { startTour, checkAutoStart, isActive } = useTourContext()
  const started = useRef(false)

  useEffect(() => {
    if (!autoStart || started.current || isActive) return

    const timer = setTimeout(() => {
      if (checkAutoStart(tourKey)) {
        started.current = true
        startTour(tourKey)
      }
    }, delay)

    return () => clearTimeout(timer)
  }, [tourKey, autoStart, delay, checkAutoStart, startTour, isActive])

  return { startTour: () => startTour(tourKey) }
}
