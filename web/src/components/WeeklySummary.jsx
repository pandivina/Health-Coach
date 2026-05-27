import { useTheme } from '../../contexts/ThemeProvider'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../lib/api'


// Muestra el resumen semanal de Pandi.
// Se oculta cuando el usuario lo cierra — vuelve la semana siguiente.

function getWeekKey() {
  const d   = new Date()
  const jan = new Date(d.getFullYear(), 0, 1)
  const week = Math.ceil(((d - jan) / 86400000 + jan.getDay() + 1) / 7)
  return `pandi_weekly_dismissed_${d.getFullYear()}_${week}`
}

export default function WeeklySummary() {
  const { theme }                 = useTheme()
  const [data,      setData]      = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [error,     setError]     = useState(false)

  useEffect(() => {
    if (localStorage.getItem(getWeekKey())) { setDismissed(true); return }
    setLoading(true)
    api.report.weekly()
      .then(d  => setData(d))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  function dismiss() {
    localStorage.setItem(getWeekKey(), '1')
    setDismissed(true)
  }

  if (dismissed || error || (!loading && !data)) return null
  if (loading) return (
    <div className="card mb-4 flex items-center gap-3 py-4"
      style={{ background: theme.surface }}>
      <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-2xl animate-pulse"
        style={{ background: theme.surface2 }}>🐼</div>
      <div className="flex-1">
        <div className="h-3 rounded w-32 mb-2" style={{ background: theme.surface2 }} />
        <div className="h-2 rounded w-48"      style={{ background: theme.surface2 }} />
      </div>
    </div>
  )

  const d = data

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }} className="card mb-4"
        style={{ background: 'linear-gradient(135deg,#f0fffe,#fff5f7)',
                 border: '1px solid rgba(46,196,182,0.25)' }}>

        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          {/* Frame temporal: 🎉 | Definitivo: /panda/celebrate_1.png */}
          <motion.span
            animate={{ rotate: [0, 10, -10, 10, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 3 }}
            style={{ fontSize: 40, flexShrink: 0 }}>🎉</motion.span>
          <div className="flex-1">
            <p className="font-extrabold text-sm" style={{ color: '#1F2937' }}>
              Tu semana con Pandi 🐼
            </p>
            <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#6B7280' }}>
              {d.pandi_message}
            </p>
          </div>
          <button onClick={dismiss}
            className="text-xs px-2 py-1 rounded-lg flex-shrink-0"
            style={{ color: '#9CA3AF', background: 'rgba(0,0,0,0.05)' }}>✕</button>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { icon: '📅', val: `${d.active_days}/7`, label: 'Días activos'   },
            { icon: '😊', val: d.avg_mood ? `${d.avg_mood}/5` : '–', label: 'Ánimo medio' },
            { icon: '💧', val: `${d.best_water}v`,   label: 'Mejor día agua' },
            { icon: '😴', val: d.best_sleep ? `${d.best_sleep}h` : '–', label: 'Mejor sueño'  },
            { icon: '💪', val: d.workouts,            label: 'Entrenos'       },
            { icon: '🔥', val: d.streak ?? '–',       label: 'Racha actual'   },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl py-2 px-2 text-center"
              style={{ background: 'rgba(255,255,255,0.7)' }}>
              <p style={{ fontSize: 20 }}>{s.icon}</p>
              <p className="font-extrabold text-sm" style={{ color: '#2EC4B6' }}>{s.val}</p>
              <p className="text-[9px] leading-tight mt-0.5" style={{ color: '#9CA3AF' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Highlight + sugerencia */}
        {d.highlight && (
          <div className="rounded-2xl px-3 py-2 mb-2"
            style={{ background: 'rgba(46,196,182,0.1)' }}>
            <p className="text-xs font-semibold" style={{ color: '#2EC4B6' }}>
              ⭐ {d.highlight}
            </p>
          </div>
        )}
        {d.suggestion && (
          <p className="text-xs" style={{ color: '#6B7280' }}>
            💡 Esta semana: {d.suggestion}
          </p>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
