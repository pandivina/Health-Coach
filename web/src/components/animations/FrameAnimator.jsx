import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * FrameAnimator — Motor de animación frame-by-frame
 *
 * Props:
 *  frames      — array de rutas de imagen, ej: ['/assets/pets/panda/idle/001.png', ...]
 *  fps         — fotogramas por segundo (default: 12)
 *  loop        — repetir animación (default: true)
 *  autoPlay    — iniciar automáticamente (default: true)
 *  width/height — dimensiones del contenedor
 *  onComplete  — callback al terminar (si loop=false)
 *  fallback    — JSX o emoji a mostrar si las imágenes no cargan
 *  crossfade   — aplicar crossfade entre frames (default: false, mejor rendimiento sin él)
 *  style       — estilos extra del contenedor
 */
export default function FrameAnimator({
  frames = [],
  fps = 12,
  loop = true,
  autoPlay = true,
  width = 120,
  height = 120,
  onComplete,
  fallback = null,
  crossfade = false,
  style = {},
  className = '',
}) {
  const [currentFrame, setCurrentFrame] = useState(0)
  const [isPlaying, setIsPlaying]       = useState(autoPlay)
  const [imagesLoaded, setImagesLoaded] = useState(false)
  const [loadError, setLoadError]       = useState(false)
  const intervalRef = useRef(null)
  const loadedCount = useRef(0)

  // Precargar todas las imágenes
  useEffect(() => {
    if (!frames.length) { setLoadError(true); return }
    loadedCount.current = 0
    let errored = false

    frames.forEach(src => {
      const img = new Image()
      img.onload = () => {
        loadedCount.current++
        if (loadedCount.current === frames.length) setImagesLoaded(true)
      }
      img.onerror = () => {
        if (!errored) { errored = true; setLoadError(true) }
      }
      img.src = src
    })
  }, [frames.join(',')])

  // Control del intervalo de animación
  useEffect(() => {
    if (!isPlaying || !imagesLoaded || loadError) return

    intervalRef.current = setInterval(() => {
      setCurrentFrame(prev => {
        const next = prev + 1
        if (next >= frames.length) {
          if (loop) return 0
          clearInterval(intervalRef.current)
          setIsPlaying(false)
          onComplete?.()
          return prev
        }
        return next
      })
    }, 1000 / fps)

    return () => clearInterval(intervalRef.current)
  }, [isPlaying, imagesLoaded, loadError, fps, loop, frames.length])

  const play  = useCallback(() => setIsPlaying(true), [])
  const pause = useCallback(() => setIsPlaying(false), [])
  const reset = useCallback(() => { setCurrentFrame(0); setIsPlaying(autoPlay) }, [autoPlay])
  const goTo  = useCallback((frame) => setCurrentFrame(Math.min(frame, frames.length - 1)), [frames.length])

  // Si hay error o no hay frames, mostrar fallback
  if (loadError || !frames.length) {
    return (
      <div style={{ width, height, ...style }} className={`flex items-center justify-center ${className}`}>
        {fallback}
      </div>
    )
  }

  // Mientras cargan las imágenes
  if (!imagesLoaded) {
    return (
      <div style={{ width, height, ...style }} className={`flex items-center justify-center ${className}`}>
        <div className="animate-pulse rounded-full bg-gray-200" style={{ width: width * 0.8, height: height * 0.8 }} />
      </div>
    )
  }

  return (
    <div style={{ width, height, position: 'relative', overflow: 'hidden', ...style }} className={className}>
      {crossfade ? (
        <AnimatePresence mode="wait">
          <motion.img
            key={currentFrame}
            src={frames[currentFrame]}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.05 }}
            style={{ width: '100%', height: '100%', objectFit: 'contain', position: 'absolute', inset: 0 }}
          />
        </AnimatePresence>
      ) : (
        <img
          src={frames[currentFrame]}
          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
          alt={`frame-${currentFrame}`}
        />
      )}
    </div>
  )
}

// ── UTILIDAD: generar array de frames numerados ──────────────
// Ejemplo: generateFrames('/assets/pets/panda/idle', 8, 'png')
// → ['/assets/pets/panda/idle/001.png', ..., '/assets/pets/panda/idle/008.png']
export function generateFrames(basePath, count, ext = 'png', start = 1) {
  return Array.from({ length: count }, (_, i) => {
    const n = String(i + start).padStart(3, '0')
    return `${basePath}/${n}.${ext}`
  })
}

// ── DEFINICIÓN DE ANIMACIONES POR MASCOTA ───────────────────
export const PET_ANIMATIONS = {
  panda: {
    idle:      { path: '/assets/pets/panda/idle',      frames: 8,  fps: 8  },
    happy:     { path: '/assets/pets/panda/happy',     frames: 12, fps: 12 },
    wave:      { path: '/assets/pets/panda/wave',      frames: 10, fps: 10 },
    breathe:   { path: '/assets/pets/panda/breathe',   frames: 16, fps: 8  },
    celebrate: { path: '/assets/pets/panda/celebrate', frames: 14, fps: 14 },
    sleep:     { path: '/assets/pets/panda/sleep',     frames: 10, fps: 6  },
    run:       { path: '/assets/pets/panda/run',       frames: 8,  fps: 16 },
    eat:       { path: '/assets/pets/panda/eat',       frames: 10, fps: 10 },
  },
  cat: {
    idle:      { path: '/assets/pets/cat/idle',      frames: 8,  fps: 8  },
    happy:     { path: '/assets/pets/cat/happy',     frames: 12, fps: 12 },
    breathe:   { path: '/assets/pets/cat/breathe',   frames: 16, fps: 8  },
    celebrate: { path: '/assets/pets/cat/celebrate', frames: 14, fps: 14 },
    sleep:     { path: '/assets/pets/cat/sleep',     frames: 10, fps: 6  },
  },
  dog: {
    idle:      { path: '/assets/pets/dog/idle',      frames: 8,  fps: 8  },
    happy:     { path: '/assets/pets/dog/happy',     frames: 12, fps: 14 },
    breathe:   { path: '/assets/pets/dog/breathe',   frames: 16, fps: 8  },
    celebrate: { path: '/assets/pets/dog/celebrate', frames: 14, fps: 14 },
    run:       { path: '/assets/pets/dog/run',       frames: 8,  fps: 18 },
  },
  fox: {
    idle:      { path: '/assets/pets/fox/idle',      frames: 8,  fps: 8  },
    happy:     { path: '/assets/pets/fox/happy',     frames: 12, fps: 12 },
    breathe:   { path: '/assets/pets/fox/breathe',   frames: 16, fps: 8  },
    celebrate: { path: '/assets/pets/fox/celebrate', frames: 14, fps: 14 },
  },
  rabbit: {
    idle:      { path: '/assets/pets/rabbit/idle',      frames: 8,  fps: 8  },
    happy:     { path: '/assets/pets/rabbit/happy',     frames: 12, fps: 12 },
    breathe:   { path: '/assets/pets/rabbit/breathe',   frames: 16, fps: 8  },
    celebrate: { path: '/assets/pets/rabbit/celebrate', frames: 14, fps: 14 },
    run:       { path: '/assets/pets/rabbit/run',       frames: 8,  fps: 20 },
  },
}

// ── DEFINICIÓN DE ANIMACIONES DE EJERCICIOS ─────────────────
export const EXERCISE_ANIMATIONS = {
  squat:       { path: '/assets/exercises/squat',       frames: 12, fps: 10 },
  pushup:      { path: '/assets/exercises/pushup',      frames: 10, fps: 10 },
  lunge:       { path: '/assets/exercises/lunge',       frames: 12, fps: 10 },
  deadlift:    { path: '/assets/exercises/deadlift',    frames: 14, fps: 8  },
  plank:       { path: '/assets/exercises/plank',       frames: 6,  fps: 4  },
  burpee:      { path: '/assets/exercises/burpee',      frames: 16, fps: 14 },
  pullup:      { path: '/assets/exercises/pullup',      frames: 12, fps: 10 },
  shoulder:    { path: '/assets/exercises/shoulder',    frames: 12, fps: 10 },
  bicep:       { path: '/assets/exercises/bicep',       frames: 10, fps: 10 },
  tricep:      { path: '/assets/exercises/tricep',      frames: 10, fps: 10 },
  row:         { path: '/assets/exercises/row',         frames: 12, fps: 10 },
  crunch:      { path: '/assets/exercises/crunch',      frames: 10, fps: 10 },
  jumpingjack: { path: '/assets/exercises/jumpingjack', frames: 8,  fps: 16 },
  mountain:    { path: '/assets/exercises/mountain',    frames: 8,  fps: 16 },
}
