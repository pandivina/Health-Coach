import { useState } from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeProvider'
import FrameAnimator, { generateFrames, EXERCISE_ANIMATIONS } from './FrameAnimator'

// Emojis de fallback por ejercicio
const EXERCISE_EMOJI = {
  squat:       '🦵',
  pushup:      '💪',
  lunge:       '🦵',
  deadlift:    '🏋️',
  plank:       '🧘',
  burpee:      '⚡',
  pullup:      '🔝',
  shoulder:    '💪',
  bicep:       '💪',
  tricep:      '💪',
  row:         '🚣',
  crunch:      '🔥',
  jumpingjack: '⭐',
  mountain:    '🏔️',
}

// Instrucciones por ejercicio
const EXERCISE_TIPS = {
  squat:       ['Pies al ancho de hombros', 'Rodillas sobre los pies', 'Espalda recta', 'Baja hasta 90°'],
  pushup:      ['Manos al ancho de hombros', 'Cuerpo en línea recta', 'Codos a 45°', 'Baja el pecho al suelo'],
  lunge:       ['Paso largo adelante', 'Rodilla trasera casi al suelo', 'Torso erguido', 'Empuja con el talón'],
  deadlift:    ['Barra sobre los pies', 'Espalda neutral', 'Empuja el suelo', 'Caderas y hombros suben juntos'],
  plank:       ['Codos bajo hombros', 'Cuerpo rígido', 'Abdomen contraído', 'Respira constantemente'],
  burpee:      ['Posición de pie', 'Baja las manos al suelo', 'Salta a plancha', 'Flexión + salto explosivo'],
  pullup:      ['Agarre prono', 'Brazos extendidos', 'Sube hasta la barbilla', 'Baja controlado'],
  shoulder:    ['De pie, espalda recta', 'Pesos a altura de hombros', 'Empuja arriba', 'Baja controlado'],
  bicep:       ['Codos pegados al cuerpo', 'Agarre supino', 'Sube controlado', 'Pausa en la cima'],
  crunch:      ['Espalda baja en el suelo', 'Manos en la nuca', 'Sube con el abdomen', 'Exhala al subir'],
  jumpingjack: ['De pie, pies juntos', 'Salta separando piernas', 'Brazos arriba', 'Ritmo constante'],
}

export default function ExerciseAnimator({
  exerciseKey,     // clave del ejercicio, ej: 'squat'
  exerciseName,    // nombre para mostrar
  sets,
  reps,
  currentSet = 1,
  onSetComplete,
  compact = false, // modo compacto para usar dentro del workout
}) {
  const { theme } = useTheme()
  const [isPlaying, setIsPlaying] = useState(true)
  const [fps, setFps]             = useState(10)
  const [showTips, setShowTips]   = useState(false)

  const animDef = EXERCISE_ANIMATIONS[exerciseKey]
  const frames  = animDef ? generateFrames(animDef.path, animDef.frames) : null
  const emoji   = EXERCISE_EMOJI[exerciseKey] || '💪'
  const tips    = EXERCISE_TIPS[exerciseKey] || []

  if (compact) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          {frames ? (
            <FrameAnimator frames={frames} fps={isPlaying ? fps : 0} loop width={72} height={72}
              fallback={<span style={{ fontSize: 48 }}>{emoji}</span>} />
          ) : (
            <motion.span
              animate={isPlaying ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.8, repeat: Infinity }}
              style={{ fontSize: 48, display: 'block', textAlign: 'center', width: 72 }}>
              {emoji}
            </motion.span>
          )}
        </div>
        <div className="flex-1">
          <p className="font-bold text-sm" style={{ color: theme.text }}>{exerciseName}</p>
          <p className="text-xs" style={{ color: theme.textMuted }}>Serie {currentSet}/{sets} · {reps} reps</p>
        </div>
        <button onClick={() => setIsPlaying(p => !p)}
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: theme.surface2 }}>
          {isPlaying ? <Pause size={14} style={{ color: theme.text }} /> : <Play size={14} style={{ color: theme.text }} />}
        </button>
      </div>
    )
  }

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-extrabold text-lg" style={{ color: theme.text }}>{exerciseName}</h3>
          <p className="text-xs" style={{ color: theme.textMuted }}>
            Serie {currentSet} de {sets} · {reps} repeticiones
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsPlaying(p => !p)}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: theme.surface2 }}>
            {isPlaying ? <Pause size={15} style={{ color: theme.text }} /> : <Play size={15} style={{ color: theme.text }} />}
          </button>
        </div>
      </div>

      {/* Animación */}
      <div className="flex justify-center mb-4 rounded-2xl py-4"
        style={{ background: `${theme.primary}08` }}>
        {frames ? (
          <FrameAnimator frames={frames} fps={isPlaying ? fps : 0} loop width={180} height={180}
            fallback={
              <motion.span
                animate={isPlaying ? { scale: [1, 1.15, 1] } : {}}
                transition={{ duration: 60/fps/10, repeat: Infinity }}
                style={{ fontSize: 120, display: 'block' }}>
                {emoji}
              </motion.span>
            } />
        ) : (
          <motion.span
            animate={isPlaying ? { scale: [1, 1.12, 1], y: [0, -8, 0] } : {}}
            transition={{ duration: 1, repeat: Infinity }}
            style={{ fontSize: 120, display: 'block', textAlign: 'center' }}>
            {emoji}
          </motion.span>
        )}
      </div>

      {/* Control de velocidad */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs" style={{ color: theme.textMuted }}>Velocidad</span>
        <div className="flex gap-1.5 flex-1">
          {[6, 10, 14, 18].map(f => (
            <button key={f} onClick={() => setFps(f)}
              className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: fps === f ? theme.primary : theme.surface,
                color: fps === f ? '#fff' : theme.textMuted,
                border: `1px solid ${fps === f ? theme.primary : theme.border}`,
              }}>
              {f === 6 ? 'Lento' : f === 10 ? 'Normal' : f === 14 ? 'Rápido' : 'Muy rápido'}
            </button>
          ))}
        </div>
      </div>

      {/* Tips */}
      {tips.length > 0 && (
        <div>
          <button onClick={() => setShowTips(s => !s)}
            className="flex items-center justify-between w-full py-2"
            style={{ color: theme.textMuted }}>
            <span className="text-xs font-medium">Técnica correcta</span>
            {showTips ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showTips && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              className="space-y-1.5 pb-2">
              {tips.map((tip, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 font-bold"
                    style={{ background: `${theme.primary}20`, color: theme.primary }}>{i+1}</span>
                  <p className="text-xs" style={{ color: theme.text }}>{tip}</p>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      )}

      {/* CTA set completado */}
      {onSetComplete && (
        <motion.button whileTap={{ scale: 0.97 }} onClick={onSetComplete}
          className="btn-primary mt-3 flex items-center justify-center gap-2">
          ✓ Serie {currentSet} completada
        </motion.button>
      )}
    </div>
  )
}
