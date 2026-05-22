import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/useStore'
import { useTheme } from '../contexts/ThemeProvider'
import { supabase } from '../lib/supabase'
import { useTour } from '../hooks/useTour'
import TourHelpButton from '../components/tour/TourHelpButton'
import WeeklySummary from '../components/WeeklySummary'
import PandiInsights from '../components/PandiInsights'
import {
  MessageCircle, TrendingUp, TrendingDown, Minus,
  ChevronRight, Plus, Minus as MinusIcon, Droplets
} from 'lucide-react'

const PET_EMOJI = { panda:'🐼', cat:'🐱', dog:'🐶', fox:'🦊', rabbit:'🐰' }

// ─── TARJETA DE MÓDULO ────────────────────────────────────────────────────────

function ModuleCard({ to, icon, label, value, sublabel, color, done, theme }) {
  return (
    <Link to={to}>
      <motion.div whileTap={{ scale: 0.96 }}
        className="rounded-2xl p-3 flex flex-col gap-2 transition-all"
        style={{
          background: done ? `${color}12` : theme.surface,
          border: `1.5px solid ${done ? color + '40' : theme.border}`,
        }}>
        <div className="flex items-center justify-between">
          <span style={{ fontSize: 22 }}>{icon}</span>
          {done && (
            <div className="w-4 h-4 rounded-full flex items-center justify-center"
              style={{ background: color }}>
              <span style={{ fontSize: 8, color: '#fff' }}>✓</span>
            </div>
          )}
        </div>
        <div>
          <p className="font-extrabold text-sm leading-none" style={{ color: done ? color : theme.text }}>
            {value}
          </p>
          {sublabel && (
            <p className="text-[10px] mt-0.5 leading-tight" style={{ color: theme.textMuted }}>
              {sublabel}
            </p>
          )}
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: theme.textLight }}>
          {label}
        </p>
      </motion.div>
    </Link>
  )
}

// ─── RUTINA MATUTINA ──────────────────────────────────────────────────────────

const MORNING_STEPS = [
  { emoji: '💧', text: 'Bebe un vaso de agua al levantarte' },
  { emoji: '🌤️', text: 'Abre las persianas — la luz regula tu ritmo circadiano' },
  { emoji: '🧘', text: '5 respiraciones profundas antes de mirar el móvil' },
  { emoji: '🍳', text: 'Desayuno con proteína — empieza el día con energía' },
]
function MorningCard({ petEmoji, petName, theme }) {
  const { addXP } = useStore()
  const [dismissed, setDismissed] = useState(false)
  const todayKey = `pandi_morning_${new Date().toISOString().split('T')[0]}`
  const [checked, setChecked] = useState(() => {
    const saved = localStorage.getItem(todayKey)
    return saved ? JSON.parse(saved) : {}
  })

  if (dismissed) return null

  async function toggle(i) {
    if (checked[i]) return // no desmarcar
    const next = { ...checked, [i]: true }
    setChecked(next)
    localStorage.setItem(todayKey, JSON.stringify(next))
    await addXP(5)
  }

  const doneCount = Object.keys(checked).length

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="card mb-4"
        style={{ background: 'linear-gradient(135deg,#f0fffe,#fff5f7)', border:'1px solid rgba(46,196,182,0.2)' }}>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <motion.span
              animate={{ rotate: [0,10,-10,10,0] }}
              transition={{ duration:1.5, repeat:Infinity, repeatDelay:3 }}
              style={{ fontSize: 26 }}>
              {petEmoji}
            </motion.span>
            <div>
              <p className="font-extrabold text-sm" style={{ color:'#1F2937' }}>
                ¡Buenos días! 🌅
              </p>
              <p className="text-xs" style={{ color:'#6B7280' }}>
                {doneCount}/{MORNING_STEPS.length} · +{doneCount * 5} XP ganados
              </p>
            </div>
          </div>
          <button onClick={() => setDismissed(true)}
            className="text-xs px-2 py-1 rounded-lg"
            style={{ color:'#9CA3AF', background:'rgba(0,0,0,0.04)' }}>
            ✕
          </button>
        </div>

        <div className="space-y-2">
          {MORNING_STEPS.map((s, i) => (
            <motion.button key={i} onClick={() => toggle(i)}
              whileTap={!checked[i] ? { scale: 0.97 } : {}}
              className="w-full flex items-center gap-3 px-2 py-2 rounded-xl text-left transition-all"
              style={{ background: checked[i] ? 'rgba(46,196,182,0.1)' : 'rgba(255,255,255,0.7)' }}>
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: checked[i] ? '#2EC4B6' : 'rgba(0,0,0,0.06)',
                  border: checked[i] ? 'none' : '1.5px solid rgba(0,0,0,0.12)',
                }}>
                {checked[i] && <span style={{ fontSize: 10, color:'#fff' }}>✓</span>}
              </div>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{s.emoji}</span>
              <p className="text-xs font-medium flex-1"
                style={{
                  color: checked[i] ? '#2EC4B6' : '#374151',
                  textDecoration: checked[i] ? 'line-through' : 'none',
                  opacity: checked[i] ? 0.7 : 1,
                }}>
                {s.text}
              </p>
              {!checked[i] && (
                <span className="text-[10px] font-bold flex-shrink-0" style={{ color:'#9CA3AF' }}>
                  +5 XP
                </span>
              )}
            </motion.button>
          ))}
        </div>

        {doneCount === MORNING_STEPS.length && (
          <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }}
            className="text-xs text-center mt-3 font-semibold" style={{ color:'#2EC4B6' }}>
            🎉 ¡Rutina matutina completada! +{doneCount * 5} XP
          </motion.p>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
function PandiGreeting({ profile, theme }) {
  const hour    = new Date().getHours()
  const name    = profile?.name?.split(' ')[0] || ''
  const petName = profile?.pet_name || 'Pandi'
  const petEmoji = PET_EMOJI[profile?.pet_type] || '🐼'
  const messages = [
    hour < 12
      ? `¡Buenos días, ${name}! 🌅 ¿Cómo llegamos hoy?`
      : hour < 20
        ? `¡Buenas tardes, ${name}! ¿Qué tal el día?`
        : `¡Buenas noches, ${name}! 🌙 ¿Todo bien?`,
  ]
  
    return (
    <Link to="/pet">
      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 p-4 rounded-2xl mb-4"
        style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>
        <motion.span
          animate={{ rotate: [0, 10, -10, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 4 }}
          style={{ fontSize: 36, flexShrink: 0 }}>
          {petEmoji}
        </motion.span>
        <div className="flex-1 min-w-0">
          <p className="font-extrabold text-sm" style={{ color: theme.text }}>{petName}</p>
          <p className="text-xs leading-relaxed mt-0.5" style={{ color: theme.textMuted }}>
            {messages[0]}
          </p>
        </div>
        <ChevronRight size={16} style={{ color: theme.textLight }} />
      </motion.div>
    </Link>
  )
}

// ─── WIDGET AGUA COMPACTO ─────────────────────────────────────────────────────

function WaterWidget({ userId, theme }) {
  const [glasses, setGlasses] = useState(0)
  const [goal,    setGoal]    = useState(8)
  const [loading, setLoading] = useState(false)
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (!userId) return
    supabase.from('hydration_logs').select('glasses,goal')
  .eq('user_id', userId).eq('date', today).maybeSingle()
  .then(({ data }) => {
        if (data) { setGlasses(data.glasses || 0); setGoal(data.goal || 8) }
      })
  }, [userId])

  async function update(delta) {
    const next = Math.max(0, Math.min(glasses + delta, goal + 4))
    setGlasses(next)
    setLoading(true)
    await supabase.from('hydration_logs').upsert(
      { user_id: userId, date: today, glasses: next, goal },
      { onConflict: 'user_id,date' }
    )
    setLoading(false)
  }

  const pct  = Math.min(glasses / goal, 1)
  const done = glasses >= goal

  return (
    <div className="card mb-4" data-tour="home-water">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: '#EFF6FF' }}>
            <Droplets size={16} style={{ color: '#3B82F6' }} />
          </div>
          <div>
            <p className="font-bold text-sm" style={{ color: theme.text }}>Hidratación</p>
            <p className="text-xs" style={{ color: theme.textMuted }}>
              {glasses * 250} ml · {glasses}/{goal} vasos
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {done && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: '#DBEAFE', color: '#1D4ED8' }}>
              ¡Meta! 🎉
            </motion.span>
          )}
          <button onClick={() => update(-1)} disabled={glasses === 0 || loading}
            className="w-8 h-8 rounded-xl flex items-center justify-center disabled:opacity-30"
            style={{ background: theme.surface2 }}>
            <MinusIcon size={14} style={{ color: theme.textMuted }} />
          </button>
          <p className="font-extrabold text-lg w-6 text-center" style={{ color: '#3B82F6' }}>
            {glasses}
          </p>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => update(1)} disabled={loading}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: '#3B82F6' }}>
            <Plus size={14} color="#fff" />
          </motion.button>
        </div>
      </div>

      {/* Vasos visuales */}
      <div className="flex gap-1 mb-2">
        {Array.from({ length: goal }).map((_, i) => (
          <motion.button key={i} whileTap={{ scale: 0.85 }}
            onClick={() => update(i < glasses ? -(glasses - i) : i + 1 - glasses)}
            style={{
              flex: 1, height: 24, borderRadius: 6,
              background: i < glasses ? 'linear-gradient(180deg,#60A5FA,#3B82F6)' : theme.surface2,
              border: `1.5px solid ${i < glasses ? '#3B82F6' : theme.border}`,
            }} />
        ))}
      </div>

      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: theme.surface2 }}>
        <motion.div className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg,#60A5FA,#3B82F6)' }}
          animate={{ width: `${pct * 100}%` }} transition={{ duration: 0.4 }} />
      </div>
    </div>
  )
}

// ─── HOME ─────────────────────────────────────────────────────────────────────
function RingProgress({ value, max, color, size = 80, label }) {
  const r = 30, circ = 2 * Math.PI * r
  const pct = Math.min(value / max, 1)
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={8} />
          <motion.circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={8}
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ * (1 - pct) }}
            transition={{ duration: 0.8 }} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
  <span className="text-xs font-bold" style={{ color: color }}>{Math.round(value)}</span>
</div>
      </div>
      <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
      <p className="text-[10px]" style={{ color: 'var(--color-text-light)' }}>/ {max}</p>
    </div>
  )
}
export default function Home() {
  const { profile, user } = useStore()
  const { theme }         = useTheme()

  const [todayMeals,   setTodayMeals]   = useState([])
  const [todayWorkout, setTodayWorkout] = useState(null)
  const [goals,        setGoals]        = useState({ calories: 2000, protein_g: 150 })
  const [weightLogs,   setWeightLogs]   = useState([])
  const [todaySleep,   setTodaySleep]   = useState(null)
  const [todayMood,    setTodayMood]    = useState(null)

  useTour('home')

  useEffect(() => {
    if (!user) return
    const today = new Date().toISOString().split('T')[0]
    const safe = (promise) => Promise.resolve(promise).catch(() => ({ data: null }))

Promise.all([
  safe(supabase.from('meal_logs').select('calories,protein_g').eq('user_id', user.id).eq('date', today)),
  safe(supabase.from('workout_sessions').select('calories_burned').eq('user_id', user.id).eq('status','completed').gte('created_at', today+'T00:00:00').limit(1)),
  safe(supabase.from('nutrition_goals').select('*').eq('user_id', user.id).maybeSingle()),
  safe(supabase.from('weight_logs').select('weight_kg,date').eq('user_id', user.id).order('date',{ascending:false}).limit(5)),
  safe(supabase.from('sleep_logs').select('hours,quality').eq('user_id', user.id).eq('date', today).maybeSingle()),
  safe(supabase.from('mood_logs').select('mood').eq('user_id', user.id).eq('date', today).maybeSingle()),
]).then(([mealsR, workoutR, goalsR, weightR, sleepR, moodR]) => {
      setTodayMeals(mealsR.data  || [])
      setTodayWorkout(workoutR.data?.[0] || null)
      if (goalsR.data)  setGoals(goalsR.data)
      setWeightLogs(weightR.data || [])
      setTodaySleep(sleepR.data  || null)
      setTodayMood(moodR.data    || null)
    })
  }, [user])

  const cals    = todayMeals.reduce((s, m) => s + (m.calories  || 0), 0)
  const protein = todayMeals.reduce((s, m) => s + (m.protein_g || 0), 0)
  const burned  = todayWorkout?.calories_burned || 0

  const MOODS = { 1:'😩', 2:'😞', 3:'😐', 4:'😊', 5:'🤩' }
  const MOOD_LABELS = { 1:'Muy mal', 2:'Mal', 3:'Regular', 4:'Bien', 5:'Genial' }

  const currentWeight  = weightLogs[0]?.weight_kg
  const previousWeight = weightLogs[1]?.weight_kg
  const weightDiff     = currentWeight && previousWeight
    ? (currentWeight - previousWeight).toFixed(1) : null

  const hour = new Date().getHours()

  // Módulos del día
  const modules = [
    {
      to: '/nutrition', icon: '🍎', label: 'Nutrición',
      value: cals > 0 ? `${Math.round(cals)} kcal` : 'Registrar',
      sublabel: cals > 0 ? `/ ${goals.calories} kcal` : 'Sin registro hoy',
      color: '#F97316', done: cals > 0,
    },
    {
      to: '/workout', icon: '💪', label: 'Entreno',
      value: todayWorkout ? '¡Hecho!' : 'Pendiente',
      sublabel: todayWorkout ? `${burned} kcal quemadas` : 'Sin entreno hoy',
      color: '#6366F1', done: !!todayWorkout,
    },
    {
      to: '/sleep', icon: '😴', label: 'Sueño',
      value: todaySleep ? `${todaySleep.hours}h` : 'Registrar',
      sublabel: todaySleep ? `Calidad: ${todaySleep.quality}/5` : 'Sin registro',
      color: '#818CF8', done: !!todaySleep,
    },
    {
      to: '/mood', icon: todayMood ? MOODS[todayMood.mood] : '🌡️', label: 'Bienestar',
      value: todayMood ? MOOD_LABELS[todayMood.mood] : 'Check-in',
      sublabel: todayMood ? 'Registrado hoy' : 'Sin registro',
      color: '#2EC4B6', done: !!todayMood,
    },
    {
      to: '/health', icon: '⚖️', label: 'Seguimiento',
      value: currentWeight ? `${currentWeight} kg` : 'Ver datos',
      sublabel: weightDiff
        ? `${weightDiff > 0 ? '+' : ''}${weightDiff} kg`
        : 'Peso y medidas',
      color: '#EC4899', done: !!currentWeight,
    },
    {
      to: '/report', icon: '📊', label: 'Mi día',
      value: 'Ver informe',
      sublabel: 'Resumen completo',
      color: '#F59E0B', done: false,
    },
  ]

  const doneTodayCount = modules.filter(m => m.done).length

  return (
    <div className="page">

      {/* Header compacto */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs" style={{ color: theme.textMuted }}>
              {hour < 12 ? '¡Buenos días' : hour < 20 ? '¡Buenas tardes' : '¡Buenas noches'},
            </p>
            <h1 className="text-2xl font-extrabold" style={{ color: theme.text }}>
              {profile?.name?.split(' ')[0] || 'Compi'} 👋
            </h1>
          </div>

          {/* Nivel + racha */}
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-center px-3 py-1.5 rounded-2xl"
              style={{ background: theme.surface2 }}>
              <span className="text-[10px]" style={{ color: theme.textMuted }}>Nivel</span>
              <span className="font-extrabold text-sm" style={{ color: theme.primary }}>
                {profile?.level || 1}
              </span>
            </div>
            <div className="flex flex-col items-center px-3 py-1.5 rounded-2xl"
              style={{ background: theme.surface2 }}>
              <span className="text-[10px]" style={{ color: theme.textMuted }}>Racha</span>
              <span className="font-extrabold text-sm" style={{ color: '#F97316' }}>
                🔥{profile?.streak || 0}
                {profile?.streak_shields > 0 && (
                  <span style={{ fontSize: 10, color: theme.textMuted }}> 🛡️</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Barra XP */}
        <div className="mt-3">
          <div className="flex justify-between text-[10px] mb-1" style={{ color: theme.textMuted }}>
            <span>{profile?.xp || 0} XP</span>
            <span>Nivel {(profile?.level || 1) + 1} → {((profile?.level || 1)) * 500} XP</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: theme.surface2 }}>
            <motion.div className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${theme.primary}, #FF8FA3)` }}
              initial={{ width: 0 }}
              animate={{ width: `${((profile?.xp || 0) % 500) / 5}%` }}
              transition={{ duration: 0.8 }} />
          </div>
        </div>
      </motion.div>

      {/* Pandi saludo */}
      <PandiGreeting profile={profile} theme={theme} />

      {/* Resumen semanal */}
      <WeeklySummary />

      {/* Progreso de hoy */}
      <div className="card mb-4" data-tour="home-progress">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.textMuted }}>
            Hoy
          </p>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{
              background: doneTodayCount >= 4 ? `${theme.success}20` : theme.surface2,
              color: doneTodayCount >= 4 ? theme.success : theme.textMuted,
            }}>
            {doneTodayCount}/{modules.length} completados
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {modules.map((m, i) => (
            <ModuleCard key={i} {...m} theme={theme} />
          ))}
        </div>
      </div>

      {/* Widget agua */}
      <WaterWidget userId={user?.id} theme={theme} />

    {/* Rings */}
<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
  className="card mb-4" data-tour="home-progress">
  <p className="text-xs mb-3 font-medium uppercase tracking-wider" style={{ color: theme.textMuted }}>
    Progreso de hoy
  </p>
  <div className="flex justify-around">
    <RingProgress value={cals}    max={goals.calories}  color={theme.warning} label="Calorías" />
    <RingProgress value={protein} max={goals.protein_g} color={theme.primary} label="Proteína" />
    <RingProgress value={burned}  max={400}             color={theme.success} label="Quemadas" />
  </div>
  <div className="mt-3 pt-3 flex justify-center" style={{ borderTop: `1px solid ${theme.border}` }}>
    <span className="text-xs" style={{ color: theme.textMuted }}>
      Balance:{' '}
      <span style={{ color: cals - burned > goals.calories ? theme.error : theme.success }}>
        {Math.round(cals - burned)} kcal
      </span>
    </span>
  </div>
</motion.div>
  {/* Banner Mi Bienestar */}
<Link to="/mood">
  <motion.div whileTap={{ scale: 0.98 }} className="card mb-4 flex items-center gap-3"
    style={{ background: 'linear-gradient(135deg,#f0fffe,#fff5f7)', border: '1px solid rgba(46,196,182,0.2)' }}>
    <motion.span
      animate={{ rotate: [0, 10, -10, 10, 0] }}
      transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 4 }}
      style={{ fontSize: 32, flexShrink: 0 }}>
      {todayMood ? ['😩','😞','😐','😊','🤩'][todayMood.mood - 1] : '🐼'}
    </motion.span>
    <div className="flex-1">
      <p className="font-extrabold text-sm" style={{ color: '#1F2937' }}>Mi Bienestar</p>
      <p className="text-xs" style={{ color: '#6B7280' }}>
        {todayMood
          ? `Hoy te sientes ${['muy mal','mal','regular','bien','genial'][todayMood.mood - 1]} · Respiración, meditación y más`
          : 'Check-in de ánimo · Respiración · Meditación'}
      </p>
    </div>
    <ChevronRight size={16} style={{ color: '#9CA3AF' }} />
  </motion.div>
</Link>
      {/* Pandi Insights */}
      <PandiInsights />

      <TourHelpButton tourKey="home" />
    </div>
  )
}
