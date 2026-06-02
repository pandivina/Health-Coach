// src/components/xp/XPSystem.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Sistema de XP y Niveles V2 de Pandi
// - 10 especialidades independientes
// - Animación de subida de nivel
// - Logros desbloqueables
// - Integrado con el semáforo de recuperación
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../../store/useStore'
import { supabase } from '../../lib/supabase'

// ─── CONFIGURACIÓN DE ESPECIALIDADES ─────────────────────────────────────────
export const SPECIALIZATIONS = {
  nutrition:  { label: 'Nutrición',     emoji: '🍎', color: '#F97316', xpPerLevel: 200 },
  workout:    { label: 'Entrenamiento', emoji: '💪', color: '#6366F1', xpPerLevel: 250 },
  sleep:      { label: 'Sueño',         emoji: '😴', color: '#818CF8', xpPerLevel: 150 },
  hydration:  { label: 'Hidratación',   emoji: '💧', color: '#3B82F6', xpPerLevel: 100 },
  mood:       { label: 'Bienestar',     emoji: '🧘', color: '#2EC4B6', xpPerLevel: 150 },
  health:     { label: 'Salud',         emoji: '⚕️', color: '#EC4899', xpPerLevel: 200 },
  streak:     { label: 'Constancia',    emoji: '🔥', color: '#EF4444', xpPerLevel: 300 },
  coach:      { label: 'Coach IA',      emoji: '🤖', color: '#8B5CF6', xpPerLevel: 200 },
  sanctuary:  { label: 'Santuario',     emoji: '🏠', color: '#10B981', xpPerLevel: 250 },
  recovery:   { label: 'Recuperación',  emoji: '⚡', color: '#F59E0B', xpPerLevel: 200 },
}

// XP que da cada acción
export const XP_REWARDS = {
  // Nutrición
  log_meal:           { xp: 10, spec: 'nutrition',  label: 'Comida registrada'     },
  complete_macros:    { xp: 25, spec: 'nutrition',  label: 'Macros completados'    },
  scan_food:          { xp: 15, spec: 'nutrition',  label: 'Alimento escaneado'    },
  photo_meal:         { xp: 20, spec: 'nutrition',  label: 'Foto de comida'        },
  // Entrenamiento
  start_workout:      { xp: 20, spec: 'workout',    label: 'Entreno iniciado'      },
  finish_workout:     { xp: 50, spec: 'workout',    label: 'Entreno completado'    },
  new_pr:             { xp: 75, spec: 'workout',    label: '¡Nuevo récord!'        },
  // Sueño
  log_sleep:          { xp: 15, spec: 'sleep',      label: 'Sueño registrado'      },
  good_sleep:         { xp: 30, spec: 'sleep',      label: 'Sueño óptimo (7-9h)'  },
  // Hidratación
  log_water:          { xp: 5,  spec: 'hydration',  label: 'Vaso registrado'       },
  water_goal:         { xp: 20, spec: 'hydration',  label: 'Meta de agua'          },
  // Bienestar
  mood_checkin:       { xp: 10, spec: 'mood',       label: 'Check-in de ánimo'    },
  meditation:         { xp: 20, spec: 'mood',       label: 'Meditación completada' },
  breathing:          { xp: 10, spec: 'mood',       label: 'Respiración completada'},
  habits_done:        { xp: 25, spec: 'mood',       label: 'Hábitos del día'       },
  // Salud
  log_weight:         { xp: 10, spec: 'health',     label: 'Peso registrado'       },
  upload_labs:        { xp: 50, spec: 'health',     label: 'Analítica subida'      },
  // Constancia
  daily_streak:       { xp: 15, spec: 'streak',     label: 'Racha mantenida'       },
  week_streak:        { xp: 50, spec: 'streak',     label: '¡7 días seguidos!'     },
  month_streak:       { xp: 200,spec: 'streak',     label: '¡30 días seguidos!'    },
  // Coach
  coach_message:      { xp: 5,  spec: 'coach',      label: 'Mensaje al Coach'      },
  // Recuperación
  rest_day_respected: { xp: 40, spec: 'recovery',   label: 'Descanso respetado'    },
  green_light_day:    { xp: 20, spec: 'recovery',   label: 'Día en verde'          },
}

// Rangos globales
export const RANKS = [
  { min: 1,   max: 4,   name: 'Principiante', color: '#9CA3AF', emoji: '🌱' },
  { min: 5,   max: 9,   name: 'Aprendiz',     color: '#3B82F6', emoji: '💧' },
  { min: 10,  max: 19,  name: 'Constante',    color: '#10B981', emoji: '🌿' },
  { min: 20,  max: 34,  name: 'Dedicado',     color: '#8B5CF6', emoji: '⚡' },
  { min: 35,  max: 49,  name: 'Experto',      color: '#F59E0B', emoji: '🔥' },
  { min: 50,  max: 74,  name: 'Maestro',      color: '#EF4444', emoji: '💎' },
  { min: 75,  max: 99,  name: 'Élite',        color: '#EC4899', emoji: '👑' },
  { min: 100, max: 999, name: 'Leyenda',      color: '#2EC4B6', emoji: '🐼' },
]

export function getRank(level) {
  return RANKS.find(r => level >= r.min && level <= r.max) || RANKS[0]
}

export function xpForLevel(level) {
  return level * 500
}

export function levelFromXP(xp) {
  return Math.floor(xp / 500) + 1
}

// ─── TOAST DE XP ─────────────────────────────────────────────────────────────
// Muestra un toast animado cuando el usuario gana XP
// Uso: <XPToast xp={25} label="Comida registrada" spec="nutrition" />

export function XPToast({ xp, label, spec, onDone }) {
  const specialization = SPECIALIZATIONS[spec]

  useEffect(() => {
    const t = setTimeout(() => onDone?.(), 2500)
    return () => clearTimeout(t)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      style={{
        position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)',
        zIndex: 9999, display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 20px', borderRadius: 20,
        background: 'rgba(26,35,50,0.92)', backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
        border: `1px solid ${specialization?.color || '#2EC4B6'}40`,
        minWidth: 180,
      }}
    >
      <span style={{ fontSize: 20 }}>{specialization?.emoji || '⚡'}</span>
      <div>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', margin: 0 }}>{label}</p>
        <p style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>
          <span style={{ color: specialization?.color || '#2EC4B6' }}>+{xp} XP</span>
          {spec && <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginLeft: 6 }}>{specialization?.label}</span>}
        </p>
      </div>
    </motion.div>
  )
}

// ─── ANIMACIÓN DE SUBIDA DE NIVEL ─────────────────────────────────────────────
export function LevelUpAnimation({ level, onDone }) {
  const rank = getRank(level)

  useEffect(() => {
    const t = setTimeout(() => onDone?.(), 4000)
    return () => clearTimeout(t)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)',
      }}
      onClick={onDone}
    >
      {/* Partículas */}
      {[...Array(20)].map((_, i) => (
        <motion.div key={i}
          initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
          animate={{
            opacity: 0,
            x: (Math.random() - 0.5) * 300,
            y: (Math.random() - 0.5) * 300,
            scale: 0,
          }}
          transition={{ duration: 1.5, delay: i * 0.05 }}
          style={{
            position: 'absolute', top: '50%', left: '50%',
            width: 8, height: 8, borderRadius: '50%',
            background: rank.color,
            boxShadow: `0 0 12px ${rank.color}`,
          }}
        />
      ))}

      {/* Contenido central */}
      <motion.div
        initial={{ scale: 0.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.2 }}
        style={{ textAlign: 'center' }}
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 10, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 0.8, delay: 0.5 }}
          style={{ fontSize: 80, marginBottom: 16 }}
        >
          {rank.emoji}
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', margin: '0 0 8px', letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 700 }}
        >
          ¡Subiste de nivel!
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          style={{ fontSize: 72, fontWeight: 900, color: 'white', margin: '0 0 8px', lineHeight: 1, letterSpacing: '-.04em' }}
        >
          {level}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9 }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '8px 20px', borderRadius: 20,
            background: rank.color, color: 'white',
            fontSize: 14, fontWeight: 800, marginBottom: 24,
          }}
        >
          {rank.emoji} {rank.name}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0 }}
        >
          Toca para continuar
        </motion.p>
      </motion.div>
    </motion.div>
  )
}

// ─── BARRA DE XP GLOBAL ───────────────────────────────────────────────────────
export function GlobalXPBar({ theme }) {
  const { profile } = useStore()
  const level   = profile?.level || 1
  const xp      = profile?.xp || 0
  const rank    = getRank(level)
  const nextXP  = xpForLevel(level)
  const pct     = ((xp % 500) / 500) * 100

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: `${rank.color}20`, border: `1.5px solid ${rank.color}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18, flexShrink: 0,
      }}>
        {rank.emoji}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: rank.color }}>
            Nivel {level} · {rank.name}
          </span>
          <span style={{ fontSize: 10, color: theme?.textMuted || '#6B7280' }}>
            {xp % 500} / 500 XP
          </span>
        </div>
        <div style={{ height: 6, borderRadius: 3, background: 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{ height: '100%', borderRadius: 3, background: rank.color }}
          />
        </div>
      </div>
    </div>
  )
}

// ─── PANEL DE ESPECIALIDADES ──────────────────────────────────────────────────
export function SpecializationsPanel({ userId, theme }) {
  const [specs, setSpecs] = useState({})

  useEffect(() => {
    if (!userId) return
    supabase.from('user_xp').select('*').eq('user_id', userId)
      .then(({ data }) => {
        const map = {}
        data?.forEach(row => { map[row.specialization] = row })
        setSpecs(map)
      })
  }, [userId])

  return (
    <div>
      <p style={{ fontSize: 13, fontWeight: 800, color: theme?.text || '#1A2332', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '.06em' }}>
        Especialidades
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
        {Object.entries(SPECIALIZATIONS).map(([key, spec]) => {
          const data  = specs[key]
          const xp    = data?.xp || 0
          const level = Math.floor(xp / spec.xpPerLevel) + 1
          const pct   = ((xp % spec.xpPerLevel) / spec.xpPerLevel) * 100

          return (
            <div key={key} style={{
              padding: '12px 14px', borderRadius: 16,
              background: 'rgba(255,255,255,0.8)',
              border: `1px solid ${spec.color}20`,
              backdropFilter: 'blur(8px)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 18 }}>{spec.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: theme?.text || '#1A2332', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{spec.label}</p>
                  <p style={{ fontSize: 10, color: spec.color, margin: 0, fontWeight: 600 }}>Nivel {level}</p>
                </div>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.07)', overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  style={{ height: '100%', borderRadius: 2, background: spec.color }}
                />
              </div>
              <p style={{ fontSize: 9, color: theme?.textMuted || '#6B7280', margin: '4px 0 0' }}>
                {xp % spec.xpPerLevel} / {spec.xpPerLevel} XP
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── HOOK PARA GANAR XP ───────────────────────────────────────────────────────
// Uso: const { gainXP } = useXP()
//      await gainXP('log_meal')

export function useXP() {
  const { user, profile, addXP } = useStore()
  const [toasts, setToasts] = useState([])
  const [levelUp, setLevelUp] = useState(null)

  async function gainXP(actionKey) {
    const reward = XP_REWARDS[actionKey]
    if (!reward || !user) return

    const { xp, spec, label } = reward
    const currentLevel = profile?.level || 1

    // 1. Sumar XP global
    const newXP = await addXP(xp)

    // 2. Sumar XP de especialidad en Supabase
    try {
      const { data: existing } = await supabase
        .from('user_xp').select('xp').eq('user_id', user.id).eq('specialization', spec).maybeSingle()
      const newSpecXP = (existing?.xp || 0) + xp
      await supabase.from('user_xp').upsert(
        { user_id: user.id, specialization: spec, xp: newSpecXP },
        { onConflict: 'user_id,specialization' }
      )
    } catch {}

    // 3. Mostrar toast
    const id = Date.now()
    setToasts(t => [...t, { id, xp, label, spec }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2500)

    // 4. Detectar subida de nivel
    const newLevel = levelFromXP(newXP || 0)
    if (newLevel > currentLevel) {
      setLevelUp(newLevel)
    }
  }

  return { gainXP, toasts, levelUp, setLevelUp }
}

// ─── PROVIDER GLOBAL DE XP ────────────────────────────────────────────────────
// Envuelve la app para mostrar toasts y level-ups globalmente
// Uso en main.jsx: <XPProvider><App /></XPProvider>

export function XPProvider({ children }) {
  const { toasts, levelUp, setLevelUp } = useXP()

  return (
    <>
      {children}
      <AnimatePresence>
        {toasts.map(t => (
          <XPToast key={t.id} xp={t.xp} label={t.label} spec={t.spec} />
        ))}
      </AnimatePresence>
      <AnimatePresence>
        {levelUp && (
          <LevelUpAnimation level={levelUp} onDone={() => setLevelUp(null)} />
        )}
      </AnimatePresence>
    </>
  )
}
