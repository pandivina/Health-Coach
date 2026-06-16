// ─── components/workout/ExerciseProgressChart.jsx ────────────────────────────
// Muestra la evolución de peso máximo levantado por ejercicio a lo largo del tiempo
// Se usa dentro de WorkoutStats o como modal desde ExerciseBlock

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, X, Search, ChevronRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useStore } from '../../store/useStore'
import { useTheme } from '../../contexts/ThemeProvider'

// ─── GRÁFICO DE LÍNEA SIMPLE (SVG nativo, sin librerías) ─────────────────────
function LineChart({ data, color, height = 140 }) {
  if (!data.length) return null
  const maxV = Math.max(...data.map(d => d.value), 1)
  const minV = Math.min(...data.map(d => d.value), 0)
  const range = maxV - minV || 1
  const w = 100 // viewBox width %
  const padding = 8

  const points = data.map((d, i) => {
    const x = data.length === 1 ? 50 : (i / (data.length - 1)) * (w - padding*2) + padding
    const y = height - padding - ((d.value - minV) / range) * (height - padding*2)
    return { x, y, ...d }
  })

  const pathD = points.map((p, i) => `${i===0?'M':'L'} ${p.x} ${p.y}`).join(' ')
  const areaD = `${pathD} L ${points[points.length-1].x} ${height} L ${points[0].x} ${height} Z`

  return (
    <div style={{ position:'relative', width:'100%', height }}>
      <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none"
        style={{ width:'100%', height:'100%', overflow:'visible' }}>
        {/* Área bajo la curva */}
        <defs>
          <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#progressGradient)" />
        {/* Línea */}
        <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          vectorEffect="non-scaling-stroke" />
        {/* Puntos */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="white" stroke={color} strokeWidth="2"
            vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      {/* Etiquetas de valores en los extremos */}
      <div style={{ position:'absolute', top:0, left:0, fontSize:11, fontWeight:800, color }}>
        {Math.max(...data.map(d=>d.value))}kg
      </div>
    </div>
  )
}

// ─── MODAL DE PROGRESIÓN ──────────────────────────────────────────────────────
export function ExerciseProgressModal({ exerciseName, onClose }) {
  const { user }  = useStore()
  const { theme } = useTheme()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [range,   setRange]   = useState('3m') // 1m | 3m | all

  useEffect(() => {
    if (!user?.id || !exerciseName) return
    load()
  }, [user?.id, exerciseName, range])

  async function load() {
    setLoading(true)
    try {
      const monthsBack = range === '1m' ? 1 : range === '3m' ? 3 : 24
      const from = new Date()
      from.setMonth(from.getMonth() - monthsBack)

      // Buscar todas las series de este ejercicio agrupadas por sesión
      const { data: workoutExercises } = await supabase
        .from('workout_exercises')
        .select('id, created_at, workout_sessions!inner(created_at, status)')
        .eq('exercise_name', exerciseName)
        .eq('workout_sessions.status', 'completed')
        .gte('workout_sessions.created_at', from.toISOString())

      if (!workoutExercises?.length) { setHistory([]); setLoading(false); return }

      const exerciseIds = workoutExercises.map(e => e.id)

      const { data: sets } = await supabase
        .from('set_logs')
        .select('workout_exercise_id, weight_kg, reps, is_warmup, created_at')
        .in('workout_exercise_id', exerciseIds)
        .eq('is_warmup', false)
        .order('created_at')

      // Agrupar por fecha — el peso máximo de cada sesión
      const byDate = {}
      ;(sets || []).forEach(s => {
        const we = workoutExercises.find(w => w.id === s.workout_exercise_id)
        const date = we?.workout_sessions?.created_at?.split('T')[0]
        if (!date) return
        if (!byDate[date] || s.weight_kg > byDate[date].weight) {
          byDate[date] = { weight: s.weight_kg, reps: s.reps }
        }
      })

      const built = Object.entries(byDate)
        .map(([date, d]) => ({ date, value: d.weight, reps: d.reps }))
        .sort((a, b) => a.date.localeCompare(b.date))

      setHistory(built)
    } catch (err) {
      console.error('Progress load error:', err.message)
      setHistory([])
    } finally {
      setLoading(false)
    }
  }

  const maxWeight   = history.length ? Math.max(...history.map(h=>h.value)) : 0
  const firstWeight = history[0]?.value || 0
  const lastWeight  = history[history.length-1]?.value || 0
  const improvement = firstWeight > 0 ? Math.round(((lastWeight-firstWeight)/firstWeight)*100) : 0

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background:'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <motion.div initial={{ y:'100%' }} animate={{ y:0 }} exit={{ y:'100%' }}
        transition={{ type:'spring', damping:30, stiffness:300 }}
        className="w-full max-w-lg rounded-t-3xl max-h-[80vh] flex flex-col"
        style={{ background: theme.bg }} onClick={e => e.stopPropagation()}>

        <div className="overflow-y-auto flex-1 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-extrabold text-base" style={{ color: theme.text }}>{exerciseName}</p>
              <p className="text-xs" style={{ color: theme.textMuted }}>Progresión de peso</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: theme.surface2 }}>
              <X size={16} style={{ color: theme.textMuted }} />
            </button>
          </div>

          {/* Selector rango */}
          <div className="flex gap-1 p-1 rounded-2xl mb-4" style={{ background: theme.surface2 }}>
            {[['1m','1 mes'],['3m','3 meses'],['all','Todo']].map(([id, label]) => (
              <button key={id} onClick={() => setRange(id)}
                className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                style={{
                  background: range === id ? theme.surface : 'transparent',
                  color:      range === id ? theme.primary : theme.textMuted,
                  boxShadow:  range === id ? '0 1px 6px rgba(0,0,0,0.08)' : 'none',
                }}>{label}</button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div style={{ width:24, height:24, border:`2px solid ${theme.primary}`,
                borderTopColor:'transparent', borderRadius:'50%',
                animation:'spin 1s linear infinite' }} />
            </div>
          ) : history.length < 2 ? (
            <div className="text-center py-12">
              <p style={{ fontSize:40 }}>📊</p>
              <p className="font-semibold text-sm mt-2" style={{ color: theme.text }}>
                Aún no hay suficientes datos
              </p>
              <p className="text-xs mt-1" style={{ color: theme.textMuted }}>
                Completa al menos 2 sesiones con este ejercicio para ver tu progresión
              </p>
            </div>
          ) : (
            <>
              {/* Stats resumen */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="rounded-2xl p-3 text-center" style={{ background: theme.surface2 }}>
                  <p className="font-extrabold text-lg" style={{ color: theme.primary }}>{maxWeight}kg</p>
                  <p className="text-[10px]" style={{ color: theme.textMuted }}>Máximo</p>
                </div>
                <div className="rounded-2xl p-3 text-center" style={{ background: theme.surface2 }}>
                  <p className="font-extrabold text-lg" style={{ color: theme.text }}>{lastWeight}kg</p>
                  <p className="text-[10px]" style={{ color: theme.textMuted }}>Último</p>
                </div>
                <div className="rounded-2xl p-3 text-center"
                  style={{ background: improvement >= 0 ? '#ECFDF5' : '#FEF2F2' }}>
                  <p className="font-extrabold text-lg" style={{ color: improvement >= 0 ? '#16A34A' : '#DC2626' }}>
                    {improvement >= 0 ? '+' : ''}{improvement}%
                  </p>
                  <p className="text-[10px]" style={{ color: theme.textMuted }}>Progreso</p>
                </div>
              </div>

              {/* Gráfico */}
              <div className="rounded-2xl p-4 mb-4" style={{ background: theme.surface2 }}>
                <LineChart data={history} color={theme.primary} />
              </div>

              {/* Lista de sesiones */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: theme.textMuted }}>
                  Historial de sesiones
                </p>
                {history.slice().reverse().map((h, i) => (
                  <div key={h.date} className="flex items-center justify-between px-3 py-2 rounded-xl"
                    style={{ background: theme.surface2 }}>
                    <span className="text-xs" style={{ color: theme.textMuted }}>
                      {new Date(h.date+'T12:00:00').toLocaleDateString('es-ES', { day:'numeric', month:'short' })}
                    </span>
                    <span className="text-sm font-bold" style={{ color: theme.text }}>
                      {h.value}kg × {h.reps}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── SELECTOR DE EJERCICIO PARA VER PROGRESO ─────────────────────────────────
// Lista todos los ejercicios que el usuario ha hecho al menos una vez
export function ExerciseProgressList() {
  const { user }  = useStore()
  const { theme } = useTheme()
  const [exercises, setExercises] = useState([])
  const [loading,    setLoading]   = useState(true)
  const [selected,   setSelected]  = useState(null)
  const [search,     setSearch]    = useState('')

  useEffect(() => {
    if (!user?.id) return
    loadExercises()
  }, [user?.id])

  async function loadExercises() {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('workout_exercises')
        .select('exercise_name, workout_sessions!inner(status, user_id)')
        .eq('workout_sessions.status', 'completed')
        .eq('workout_sessions.user_id', user.id)

      const unique = [...new Set((data||[]).map(d => d.exercise_name))].sort()
      setExercises(unique)
    } catch (err) {
      console.error('Exercise list error:', err.message)
    } finally {
      setLoading(false)
    }
  }

  const filtered = exercises.filter(e => e.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: theme.textMuted }} />
        <input className="input pl-9" placeholder="Buscar ejercicio…"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div style={{ width:20, height:20, border:`2px solid ${theme.primary}`,
            borderTopColor:'transparent', borderRadius:'50%', animation:'spin 1s linear infinite' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8">
          <p style={{ fontSize:32 }}>🏋️</p>
          <p className="text-sm mt-2" style={{ color: theme.textMuted }}>
            {exercises.length === 0 ? 'Completa entrenos para ver tu progresión aquí' : 'Sin resultados'}
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map(name => (
            <button key={name} onClick={() => setSelected(name)}
              className="w-full flex items-center justify-between p-3 rounded-2xl text-left"
              style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>
              <div className="flex items-center gap-2.5">
                <TrendingUp size={16} style={{ color: theme.primary }} />
                <span className="text-sm font-semibold" style={{ color: theme.text }}>{name}</span>
              </div>
              <ChevronRight size={14} style={{ color: theme.textLight }} />
            </button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selected && (
          <ExerciseProgressModal exerciseName={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
