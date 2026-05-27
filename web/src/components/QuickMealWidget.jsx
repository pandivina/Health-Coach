import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Hash, Plus, BookOpen, X } from 'lucide-react'
import { supabase } from '../lib/supabase'

// ─── CALCULAR VENTANAS DE COMIDA ─────────────────────────────────────────────
// Basado en wake_time y work_schedule del perfil de salud del usuario

function getMealWindows(wakeTime, workSchedule) {
  // wakeTime: "07:00" | workSchedule: "day"|"night"|"rotating"|"remote"|"other"
  const [wakeH, wakeM] = (wakeTime || '07:00').split(':').map(Number)
  const wakeMinutes = wakeH * 60 + wakeM

  let breakfast, lunch, dinner, snack

  if (workSchedule === 'night') {
  // Turno nocturno — todo relativo al despertar
  breakfast = wakeMinutes + 30
  lunch     = wakeMinutes + 5 * 60
  snack     = wakeMinutes + 8 * 60
  dinner    = wakeMinutes + 11 * 60
} else if (workSchedule === 'rotating') {
  // Rotativo — ventanas más amplias para cubrir cualquier turno
  breakfast = wakeMinutes + 30
  lunch     = wakeMinutes + 5 * 60
  snack     = wakeMinutes + 8 * 60
  dinner    = wakeMinutes + 11 * 60
} else if (workSchedule === 'remote') {
  // Remoto — horarios más flexibles, comida más tarde
  breakfast = wakeMinutes + 60
  lunch     = 14 * 60
  snack     = 17 * 60
  dinner    = 21 * 60
} else {
  // day / other — horario estándar
  breakfast = wakeMinutes + 30
  lunch     = 13 * 60
  snack     = 17 * 60
  dinner    = 20 * 60
}
  // Normalizar a 0-1440
  const norm = (m) => ((m % 1440) + 1440) % 1440

  return [
    { name: 'Desayuno', emoji: '🍳', start: norm(breakfast - 15), end: norm(breakfast + 90)  },
    { name: 'Comida',   emoji: '🥗', start: norm(lunch    - 30),  end: norm(lunch    + 120) },
    { name: 'Snack',    emoji: '🍎', start: norm(snack    - 15),  end: norm(snack    + 60)  },
    { name: 'Cena',     emoji: '🍽️', start: norm(dinner   - 30),  end: norm(dinner   + 120) },
  ]
}

function getCurrentMeal(windows) {
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  return windows.find(w => {
    if (w.start < w.end) {
      return currentMinutes >= w.start && currentMinutes <= w.end
    } else {
      // Cruza medianoche
      return currentMinutes >= w.start || currentMinutes <= w.end
    }
  }) || null
}

// ─── COMPONENTE ──────────────────────────────────────────────────────────────

export default function QuickMealWidget({ userId, theme }) {
  const [meal,      setMeal]      = useState(null)
  const [dismissed, setDismissed] = useState(false)
  const [logged,    setLogged]    = useState(false)

  useEffect(() => {
    if (!userId) return

    // Cargar wake_time y work_schedule
    supabase.from('health_profiles')
      .select('wake_time, work_schedule')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        const windows    = getMealWindows(data?.wake_time, data?.work_schedule)
        const currentMeal = getCurrentMeal(windows)
        setMeal(currentMeal)
      })

    // Verificar si ya registró comida en los últimos 90min
    const since = new Date(Date.now() - 90 * 60 * 1000).toISOString()
    supabase.from('meal_logs')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', since)
      .limit(1)
      .then(({ data }) => {
        if (data?.length > 0) setLogged(true)
      })

    // Revisar dismissal del día
    const key = `quick_meal_dismissed_${new Date().toISOString().split('T')[0]}_${new Date().getHours()}`
    if (localStorage.getItem(key)) setDismissed(true)
  }, [userId])

  function dismiss() {
    const key = `quick_meal_dismissed_${new Date().toISOString().split('T')[0]}_${new Date().getHours()}`
    localStorage.setItem(key, '1')
    setDismissed(true)
  }

  if (!meal || dismissed || logged) return null

  const ACTIONS = [
    { icon: Camera,   label: 'Foto',    to: '/nutrition?tab=escanear&mode=photo',   color: '#6366F1' },
    { icon: Hash,     label: 'Código',  to: '/nutrition?tab=escanear&mode=barcode', color: '#F97316' },
    { icon: Plus,     label: 'Añadir',  to: '/nutrition?tab=diario',                color: '#2EC4B6' },
    { icon: BookOpen, label: 'Recetas', to: '/nutrition?tab=recetas',               color: '#22C55E' },
  ]

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="card mb-4"
        style={{ border: `1px solid ${theme.border}` }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 20 }}>{meal.emoji}</span>
            <p className="font-extrabold text-sm" style={{ color: theme.text }}>
              {meal.name}
            </p>
          </div>
          <button onClick={dismiss}
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: theme.surface2 }}>
            <X size={13} style={{ color: theme.textMuted }} />
          </button>
        </div>

        {/* Sin registros */}
        <p className="text-xs mb-3" style={{ color: theme.textMuted }}>Sin registros</p>

        {/* Acciones rápidas */}
        <div className="grid grid-cols-4 gap-2">
          {ACTIONS.map((a, i) => (
            <Link key={i} to={a.to}>
              <motion.div whileTap={{ scale: 0.92 }}
                className="flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all"
                style={{ background: theme.surface2 }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: `${a.color}15` }}>
                  <a.icon size={18} style={{ color: a.color }} />
                </div>
                <span className="text-[10px] font-semibold" style={{ color: theme.textMuted }}>
                  {a.label}
                </span>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
