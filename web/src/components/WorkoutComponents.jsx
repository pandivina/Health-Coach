import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Play, Trophy, Clock, Dumbbell, TrendingUp } from 'lucide-react'
import { api } from '../../lib/api'
import { useStore } from '../../store/useStore'
import { useTheme } from '../../contexts/ThemeProvider'

// ─── ROUTINE GENERATOR ────────────────────────────────────────

export function RoutineGenerator({ onStartSession }) {
  const { theme } = useTheme()
  const [form, setForm] = useState({
    goal: 'fuerza', days: '3', duration: '45',
    equipment: 'gimnasio completo', level: 'intermedio',
  })
  const [generating, setGenerating] = useState(false)
  const [result,     setResult]     = useState(null)

  async function generate() {
    setGenerating(true)
    try {
      const data = await api.workouts.generate(form)
      setResult(data)
    } catch (err) { alert('Error generando rutina: ' + err.message) }
    finally { setGenerating(false) }
  }

  async function startNow() {
    if (!result) return
    const session = await api.workouts.start({
      name: result.name, template_id: result.id, exercises: result.exercises || [],
    })
    onStartSession(session)
  }

  return (
    <div className="space-y-4">
      <div className="card space-y-4">
        <p className="font-semibold flex items-center gap-2" style={{ color: theme.text }}>
          <Sparkles size={16} style={{ color: theme.primary }} /> Genera tu rutina perfecta
        </p>

        <div>
          <label className="label">Objetivo</label>
          <select className="input" value={form.goal}
            onChange={e => setForm(f => ({ ...f, goal: e.target.value }))}>
            {[['fuerza','💪 Fuerza'],['hipertrofia','🏋️ Hipertrofia'],
              ['resistencia','🏃 Resistencia'],['pérdida de grasa','🔥 Pérdida de grasa'],
              ['fitness general','⚡ Fitness general']].map(([v,l]) =>
              <option key={v} value={v}>{l}</option>
            )}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Días/semana</label>
            <select className="input" value={form.days}
              onChange={e => setForm(f => ({ ...f, days: e.target.value }))}>
              {['2','3','4','5','6'].map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Duración (min)</label>
            <select className="input" value={form.duration}
              onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}>
              {['30','45','60','75','90'].map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Equipamiento</label>
          <select className="input" value={form.equipment}
            onChange={e => setForm(f => ({ ...f, equipment: e.target.value }))}>
            {[['gimnasio completo','🏋️ Gimnasio completo'],
              ['mancuernas','🏠 Mancuernas en casa'],
              ['peso corporal','🤸 Peso corporal'],
              ['bandas elásticas','🔴 Bandas elásticas']].map(([v,l]) =>
              <option key={v} value={v}>{l}</option>
            )}
          </select>
        </div>

        <div>
          <label className="label">Nivel</label>
          <div className="flex gap-2">
            {['principiante','intermedio','avanzado'].map(l => (
              <button key={l} onClick={() => setForm(f => ({ ...f, level: l }))}
                className="flex-1 py-2 rounded-xl border text-xs font-medium transition-all capitalize"
                style={{
                  borderColor:  form.level === l ? theme.primary : theme.border,
                  background:   form.level === l ? `${theme.primary}20` : 'transparent',
                  color:        form.level === l ? theme.primary : theme.textMuted,
                }}>{l}</button>
            ))}
          </div>
        </div>

        <button onClick={generate} disabled={generating}
          className="btn-primary flex items-center justify-center gap-2">
          <Sparkles size={14} /> {generating ? 'Generando con IA…' : 'Generar rutina'}
        </button>
      </div>

      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="card space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-bold text-lg" style={{ color: theme.text }}>{result.name}</p>
              <p className="text-sm" style={{ color: theme.textMuted }}>{result.description}</p>
              <div className="flex gap-2 mt-1 text-xs" style={{ color: theme.textMuted }}>
                <span>⏱ {result.estimated_duration} min</span>
                <span>· {result.difficulty}</span>
                <span>· {(result.exercises||[]).length} ejercicios</span>
              </div>
            </div>
            <span className="text-[10px] px-2 py-1 rounded-full font-semibold"
              style={{ background: `${theme.primary}20`, color: theme.primary }}>IA</span>
          </div>

          <div className="space-y-2">
            {(result.exercises || []).map((ex, i) => (
              <div key={i} className="flex items-center gap-3 py-2"
                style={{ borderBottom: `1px solid ${theme.border}` }}>
                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold"
                  style={{ background: `${theme.primary}20`, color: theme.primary }}>{i+1}</div>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: theme.text }}>
                    {ex.exercise_name}
                  </p>
                  <p className="text-xs" style={{ color: theme.textMuted }}>
                    {ex.sets} × {ex.reps} · {ex.rest_seconds}s descanso
                  </p>
                </div>
              </div>
            ))}
          </div>

          <button onClick={startNow} className="btn-primary flex items-center justify-center gap-2">
            <Play size={14} /> Empezar ahora
          </button>
        </motion.div>
      )}
    </div>
  )
}

// ─── EXERCISE CARD ────────────────────────────────────────────

function ExerciseCard({ ex }) {
  const { theme } = useTheme()
  const [open, setOpen] = useState(false)

  return (
    <div className="card cursor-pointer" onClick={() => setOpen(o => !o)}
      style={{ border: `1px solid ${theme.border}` }}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${theme.primary}15` }}>
          <Dumbbell size={16} style={{ color: theme.primary }} />
        </div>
        <div className="flex-1">
          <p className="font-medium text-sm" style={{ color: theme.text }}>{ex.name}</p>
          <p className="text-xs capitalize" style={{ color: theme.textMuted }}>{ex.equipment}</p>
        </div>
        <span className="text-xs" style={{ color: theme.textMuted }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && ex.instructions && (
        <p className="text-xs leading-relaxed mt-3 pl-12" style={{ color: theme.textMuted }}>
          {ex.instructions}
        </p>
      )}
      {open && ex.secondary_muscles?.length > 0 && (
        <p className="text-xs mt-2 pl-12" style={{ color: theme.textLight }}>
          También trabaja: {ex.secondary_muscles.join(', ')}
        </p>
      )}
    </div>
  )
}

// ─── EXERCISE LIBRARY ─────────────────────────────────────────

export function ExerciseLibrary() {
  const { theme }    = useTheme()
  const [exercises,  setExercises]  = useState([])
  const [search,     setSearch]     = useState('')
  const [muscle,     setMuscle]     = useState('')

  const MUSCLES = ['','pecho','espalda','hombros','piernas','bíceps','tríceps','core','cardio']
  const MUSCLE_EMOJIS = {
    pecho:'🫁', espalda:'🔙', hombros:'💪', piernas:'🦵',
    bíceps:'💪', tríceps:'💪', core:'🎯', cardio:'🏃',
  }

  useEffect(() => {
    api.workouts.getExercises()
      .then(data => setExercises(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  const filtered = exercises.filter(ex => {
    const matchSearch = !search || ex.name.toLowerCase().includes(search.toLowerCase())
    const matchMuscle = !muscle || ex.muscle_group === muscle
    return matchSearch && matchMuscle
  })

  const grouped = MUSCLES.slice(1).reduce((acc, m) => {
    const items = filtered.filter(ex => ex.muscle_group === m)
    if (items.length) acc[m] = items
    return acc
  }, {})

  return (
    <div className="space-y-4">
      <input className="input" placeholder="Buscar ejercicio…"
        value={search} onChange={e => setSearch(e.target.value)} />

      <div className="flex gap-2 overflow-x-auto pb-1">
        {MUSCLES.map(m => (
          <button key={m} onClick={() => setMuscle(m)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all capitalize"
            style={{
              background: muscle === m ? theme.primary : theme.surface2,
              color:      muscle === m ? '#fff' : theme.textMuted,
            }}>
            {m || 'Todos'}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center py-8" style={{ color: theme.textMuted }}>Sin resultados</p>
      )}

      {Object.entries(grouped).map(([group, items]) => (
        <div key={group}>
          <p className="text-xs uppercase tracking-wider font-semibold mb-2 flex items-center gap-1"
            style={{ color: theme.textMuted }}>
            <span>{MUSCLE_EMOJIS[group]}</span> {group}
          </p>
          <div className="space-y-2">
            {items.map(ex => <ExerciseCard key={ex.id} ex={ex} />)}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── WORKOUT HISTORY ──────────────────────────────────────────

export function WorkoutHistory() {
  const { theme }    = useTheme()
  const [sessions,   setSessions]  = useState([])
  const [loading,    setLoading]   = useState(true)

  useEffect(() => {
    api.workouts.history()
      .then(data => { setSessions(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center py-8">
      <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: theme.primary }} />
    </div>
  )

  return (
    <div className="space-y-3">
      {sessions.map(s => (
        <div key={s.id} className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold" style={{ color: theme.text }}>{s.name}</p>
              <p className="text-xs" style={{ color: theme.textMuted }}>
                {new Date(s.finished_at).toLocaleDateString('es-ES', {
                  weekday:'short', day:'numeric', month:'short',
                })}
              </p>
            </div>
            <span className="text-xs font-medium" style={{ color: theme.success }}>✓ Completado</span>
          </div>
          <div className="flex gap-4 mt-2 text-xs" style={{ color: theme.textMuted }}>
            <span className="flex items-center gap-1">
              <Clock size={10} /> {Math.round((s.duration_seconds||0)/60)} min
            </span>
            <span>💪 {s.total_sets} series</span>
            <span>📦 {s.total_volume_kg} kg</span>
            <span>🔥 {s.calories_burned} kcal</span>
          </div>
        </div>
      ))}
      {sessions.length === 0 && (
        <div className="text-center py-10">
          <p className="text-4xl mb-3">📋</p>
          <p style={{ color: theme.textMuted }}>Aún no hay entrenos registrados</p>
        </div>
      )}
    </div>
  )
}

// ─── WORKOUT STATS ────────────────────────────────────────────

export function WorkoutStats() {
  const { theme } = useTheme()
  const [stats,   setStats] = useState(null)

  useEffect(() => {
    api.workouts.stats().then(setStats).catch(() => {})
  }, [])

  if (!stats) return (
    <div className="flex items-center justify-center py-8">
      <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: theme.primary }} />
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {[
          ['🏋️', 'Sesiones totales', stats.total_sessions],
          ['📦', 'Volumen total',    `${(stats.total_volume_kg/1000).toFixed(1)}t`],
          ['⏱',  'Tiempo total',    `${Math.round(stats.total_time_minutes/60)}h`],
          ['🔥', 'Calorías totales', stats.total_calories],
        ].map(([e,l,v]) => (
          <div key={l} className="card text-center">
            <p className="text-2xl mb-1">{e}</p>
            <p className="font-bold" style={{ color: theme.text }}>{v}</p>
            <p className="text-xs" style={{ color: theme.textMuted }}>{l}</p>
          </div>
        ))}
      </div>

      {stats.personal_records?.length > 0 && (
        <>
          <p className="section-title flex items-center gap-2">
            <Trophy size={16} style={{ color: '#EAB308' }} /> Récords personales
          </p>
          <div className="space-y-2">
            {stats.personal_records.map((pr, i) => (
              <div key={i} className="card flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm" style={{ color: theme.text }}>
                    {pr.exercise_name}
                  </p>
                  <p className="text-xs" style={{ color: theme.textMuted }}>
                    {new Date(pr.achieved_at).toLocaleDateString('es-ES')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold" style={{ color: '#EAB308' }}>
                    {pr.weight_kg}kg × {pr.reps}
                  </p>
                  <p className="text-xs" style={{ color: theme.textMuted }}>
                    1RM: ~{pr.one_rep_max}kg
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {stats.top_exercises?.length > 0 && (
        <>
          <p className="section-title flex items-center gap-2">
            <TrendingUp size={16} style={{ color: theme.primary }} /> Ejercicios favoritos
          </p>
          <div className="space-y-2">
            {stats.top_exercises.map((ex, i) => (
              <div key={i} className="card flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                  style={{ background: `${theme.primary}20`, color: theme.primary }}>{i+1}</div>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: theme.text }}>
                    {ex.exercise_name}
                  </p>
                  <p className="text-xs" style={{ color: theme.textMuted }}>
                    {ex.total_sessions} sesiones · {ex.best_weight_kg}kg máx
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default { RoutineGenerator, ExerciseLibrary, WorkoutHistory, WorkoutStats }
