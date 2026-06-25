import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '../contexts/ThemeProvider'
import { getAnimation, getAnimationByName } from '../data/exerciseAnimations'

// ─── COMPONENTE DE ANIMACIÓN SVG ──────────────────────────────────────────────
// Uso: <ExerciseAnimation exerciseId="w_jumping_jacks" size={160} />
// O:   <ExerciseAnimation exerciseName="Jumping Jacks" size={160} />

export default function ExerciseAnimation({ exerciseId, exerciseName, size = 160, accent }) {
  const { theme }    = useTheme()
  const [frameIdx,   setFrameIdx]   = useState(0)
  const [transition, setTransition] = useState(true)

  const anim = exerciseId
    ? getAnimation(exerciseId)
    : exerciseName
      ? getAnimationByName(exerciseName)
      : null

  useEffect(() => {
    if (!anim || anim.frames.length <= 1) return
    const t = setInterval(() => {
      setTransition(false)
      setTimeout(() => {
        setFrameIdx(i => (i + 1) % anim.frames.length)
        setTransition(true)
      }, 80)
    }, anim.fps)
    return () => clearInterval(t)
  }, [anim])

  // Sin animación — emoji de fallback
  if (!anim) {
    return (
      <div className="flex items-center justify-center"
        style={{ width: size, height: size }}>
        <span style={{ fontSize: size * 0.5 }}>💪</span>
      </div>
    )
  }

  const currentFrame = anim.frames[frameIdx]

  return (
    <div className="relative flex items-center justify-center"
      style={{ width: size, height: size }}>

      {/* Fondo circular sutil */}
      <div className="absolute inset-0 rounded-full"
        style={{ background: `${accent || theme.primary}08` }} />

      {/* SVG animado */}
      <motion.div
        animate={{ opacity: transition ? 1 : 0.3 }}
        transition={{ duration: 0.08 }}
        style={{ width: size * 0.85, height: size * 0.85 }}>
        <svg
          viewBox="0 0 100 200"
          width="100%"
          height="100%"
          xmlns="http://www.w3.org/2000/svg"
          dangerouslySetInnerHTML={{ __html: currentFrame }} />
      </motion.div>

      {/* Indicador de frames */}
      {anim.frames.length > 1 && (
        <div className="absolute bottom-1 flex gap-1">
          {anim.frames.map((_, i) => (
            <div key={i} className="rounded-full transition-all"
              style={{
                width:      i === frameIdx ? 8 : 4,
                height:     4,
                background: i === frameIdx
                  ? (accent || theme.primary)
                  : `${accent || theme.primary}30`,
              }} />
          ))}
        </div>
      )}
    </div>
  )
}
