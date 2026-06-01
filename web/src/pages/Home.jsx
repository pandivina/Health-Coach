import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/useStore'
import { useTheme } from '../contexts/ThemeProvider'
import { usePandiState } from '../contexts/PandiStateContext'
import { supabase } from '../lib/supabase'
import { useTour } from '../hooks/useTour'
import { useSectionContext } from '../hooks/useSectionContext'
import TourHelpButton from '../components/tour/TourHelpButton'
import PandiInsights from '../components/PandiInsights'
import PandiTips from '../components/PandiTips'
import { ChevronRight, Plus, Minus as MinusIcon, Droplets, Bell } from 'lucide-react'

// ─── PARTÍCULAS DEL SANTUARIO ─────────────────────────────────────────────────
const SANCTUARY_PARTICLES = Array.from({ length: 8 }, (_, i) => ({
  x: 20 + (i * 37) % 80,
  y: 10 + (i * 23) % 60,
  size: 3 + (i % 3) * 2,
  delay: i * 0.4,
  duration: 4 + (i % 3),
}))

// ─── FONDO DEL SANTUARIO ──────────────────────────────────────────────────────
function SanctuaryBackground({ recoveryLight }) {
  const configs = {
    GREEN: {
      sky:     'linear-gradient(180deg, #c8f5e8 0%, #e0faf0 40%, #f0fffe 100%)',
      glow1:   'rgba(46,196,182,0.25)',
      glow2:   'rgba(100,220,180,0.15)',
      ground:  'rgba(180,240,210,0.3)',
      particle:'#2EC4B6',
    },
    YELLOW: {
      sky:     'linear-gradient(180deg, #fef3c7 0%, #fffbeb 40%, #fffff0 100%)',
      glow1:   'rgba(245,158,11,0.2)',
      glow2:   'rgba(250,200,80,0.15)',
      ground:  'rgba(240,220,150,0.25)',
      particle:'#F59E0B',
    },
    RED: {
      sky:     'linear-gradient(180deg, #ffe4ec 0%, #fff0f5 40%, #fff5f7 100%)',
      glow1:   'rgba(255,143,163,0.2)',
      glow2:   'rgba(255,180,190,0.15)',
      ground:  'rgba(255,200,210,0.2)',
      particle:'#FF8FA3',
    },
  }
  const c = configs[recoveryLight] || configs.GREEN

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0 }}>
      {/* Sky gradient */}
      <AnimatePresence mode="wait">
        <motion.div key={recoveryLight}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
          style={{ position: 'absolute', inset: 0, background: c.sky }} />
      </AnimatePresence>

      {/* Círculo de luz principal detrás de Pandi */}
      <motion.div
        animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', top: '8%', left: '50%', transform: 'translateX(-50%)',
          width: 280, height: 280, borderRadius: '50%',
          background: `radial-gradient(circle, ${c.glow1} 0%, transparent 70%)`,
          filter: 'blur(30px)',
        }} />

      {/* Círculo exterior más suave */}
      <motion.div
        animate={{ scale: [1, 1.12, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        style={{
          position: 'absolute', top: '5%', left: '50%', transform: 'translateX(-50%)',
          width: 380, height: 380, borderRadius: '50%',
          background: `radial-gradient(circle, ${c.glow2} 0%, transparent 65%)`,
          filter: 'blur(40px)',
        }} />

      {/* Portal / Arco circular decorativo */}
      <div style={{
        position: 'absolute', top: '6%', left: '50%', transform: 'translateX(-50%)',
        width: 260, height: 260, borderRadius: '50%',
        border: `2px solid ${c.glow1.replace('0.25', '0.4')}`,
        boxShadow: `0 0 40px ${c.glow1}, inset 0 0 40px ${c.glow1}`,
      }} />
      <div style={{
        position: 'absolute', top: '4%', left: '50%', transform: 'translateX(-50%)',
        width: 300, height: 300, borderRadius: '50%',
        border: `1px solid ${c.glow1.replace('0.25', '0.2')}`,
      }} />

      {/* Elementos decorativos — plantas zen SVG */}
      {/* Planta izquierda */}
      <svg style={{ position: 'absolute', bottom: '32%', left: '4%', width: 60, height: 90, opacity: 0.5 }} viewBox="0 0 60 90">
        <motion.path animate={{ rotate: [0, 2, -1, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          d="M30 90 Q30 70 20 55 Q10 40 15 25 Q20 10 30 5 Q40 10 45 25 Q50 40 40 55 Q30 70 30 90"
          fill={c.particle} opacity="0.4" style={{ transformOrigin: '30px 90px' }} />
        <motion.path animate={{ rotate: [0, -1.5, 1, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          d="M30 90 Q25 72 10 62 Q-5 52 2 38 Q8 25 20 28 Q30 31 30 45 Q30 60 30 90"
          fill={c.particle} opacity="0.3" style={{ transformOrigin: '30px 90px' }} />
      </svg>

      {/* Planta derecha */}
      <svg style={{ position: 'absolute', bottom: '32%', right: '4%', width: 60, height: 90, opacity: 0.5, transform: 'scaleX(-1)' }} viewBox="0 0 60 90">
        <motion.path animate={{ rotate: [0, 2, -1, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
          d="M30 90 Q30 70 20 55 Q10 40 15 25 Q20 10 30 5 Q40 10 45 25 Q50 40 40 55 Q30 70 30 90"
          fill={c.particle} opacity="0.4" style={{ transformOrigin: '30px 90px' }} />
      </svg>

      {/* Piedras zen */}
      <div style={{ position: 'absolute', bottom: '30%', right: '8%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, opacity: 0.4 }}>
        {[24, 18, 12].map((w, i) => (
          <div key={i} style={{ width: w, height: w * 0.5, borderRadius: '50%', background: `rgba(100,120,110,0.3)`, border: `1px solid rgba(100,120,110,0.2)` }} />
        ))}
      </div>

      {/* Suelo / plataforma */}
      <motion.div
        animate={{ opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', bottom: '28%', left: '50%', transform: 'translateX(-50%)',
          width: 180, height: 24, borderRadius: '50%',
          background: `radial-gradient(ellipse, ${c.ground} 0%, transparent 70%)`,
          filter: 'blur(8px)',
        }} />

      {/* Partículas flotantes */}
      {SANCTUARY_PARTICLES.map((p, i) => (
        <motion.div key={i}
          animate={{ y: [0, -20, 0], opacity: [0, 0.6, 0], x: [0, (i % 2 === 0 ? 8 : -8), 0] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', left: `${p.x}%`, bottom: `${p.y}%`,
            width: p.size, height: p.size, borderRadius: '50%',
            background: c.particle, opacity: 0,
            boxShadow: `0 0 ${p.size * 2}px ${c.particle}`,
          }} />
      ))}

      {/* Suelo difuminado */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '35%',
        background: 'linear-gradient(to top, rgba(255,255,255,0.95) 0%, transparent 100%)',
      }} />
    </div>
  )
}

// ─── PANDI 3D ILUSIÓN ─────────────────────────────────────────────────────────
function PandiHero({ recoveryLight, pandiState }) {
  const [imgErr, setImgErr] = useState(false)
  const avatarMap = {
    GREEN:  '/panda/avatar_happy.png',
    YELLOW: '/panda/avatar_thinking.png',
    RED:    '/panda/avatar_sleep.png',
  }
  const glowMap = {
    GREEN:  'rgba(46,196,182,0.5)',
    YELLOW: 'rgba(245,158,11,0.4)',
    RED:    'rgba(255,143,163,0.45)',
  }
  const src  = avatarMap[recoveryLight]  || avatarMap.GREEN
  const glow = glowMap[recoveryLight] || glowMap.GREEN

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Sombra proyectada en el suelo */}
      <motion.div
        animate={{ scaleX: [1, 1.08, 1], opacity: [0.2, 0.3, 0.2] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', bottom: -12, left: '50%', transform: 'translateX(-50%)',
          width: 120, height: 20, borderRadius: '50%',
          background: 'rgba(0,0,0,0.15)', filter: 'blur(8px)',
        }} />

      {/* Anillo de aura exterior */}
      <motion.div
        animate={{ scale: [1, 1.06, 1], opacity: [0.15, 0.3, 0.15] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', width: 200, height: 200, borderRadius: '50%',
          border: `2px solid ${glow}`,
        }} />

      {/* Glow de fondo */}
      <motion.div
        animate={{ scale: [1, 1.12, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', width: 180, height: 180, borderRadius: '50%',
          background: `radial-gradient(circle, ${glow} 0%, transparent 70%)`,
          filter: 'blur(20px)',
        }} />

      {/* Pandi — ilusión 3D con perspectiva y sombra */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'relative', zIndex: 2,
          filter: `drop-shadow(0 20px 30px ${glow}) drop-shadow(0 4px 8px rgba(0,0,0,0.15))`,
          transform: 'perspective(800px) rotateX(2deg)',
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div key={recoveryLight}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5 }}
          >
            {imgErr
              ? <div style={{ width: 160, height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 100 }}>🐼</div>
              : <img src={src} alt="Pandi" style={{ width: 160, height: 160, objectFit: 'contain' }}
                  onError={() => setImgErr(true)} />
            }
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

// ─── SEMÁFORO BADGE ───────────────────────────────────────────────────────────
function RecoveryBadge({ recoveryLight, msg }) {
  const config = {
    GREEN:  { color: '#2EC4B6', bg: 'rgba(46,196,182,0.12)',  dot: '#2EC4B6', label: 'En forma' },
    YELLOW: { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  dot: '#F59E0B', label: 'Moderado' },
    RED:    { color: '#FF8FA3', bg: 'rgba(255,143,163,0.12)', dot: '#FF8FA3', label: 'Descansando' },
  }
  const c = config[recoveryLight] || config.GREEN

  return (
    <AnimatePresence mode="wait">
      <motion.div key={recoveryLight}
        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '8px 16px', borderRadius: 20,
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(12px)',
          border: `1.5px solid ${c.color}30`,
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        }}
      >
        <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
          style={{ width: 8, height: 8, borderRadius: '50%', background: c.dot, boxShadow: `0 0 8px ${c.dot}`, flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: '#1A2332' }}>{msg || c.label}</span>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── TAREAS DEL DÍA ───────────────────────────────────────────────────────────
function DayTask({ to, icon, label, value, sublabel, color, done }) {
  return (
    <Link to={to}>
      <motion.div whileTap={{ scale: 0.97 }}
        style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '14px 16px', borderRadius: 18,
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(8px)',
          border: `1px solid ${done ? color + '30' : 'rgba(0,0,0,0.06)'}`,
          boxShadow: done ? `0 2px 12px ${color}15` : '0 2px 8px rgba(0,0,0,0.04)',
          marginBottom: 8,
        }}>
        <div style={{
          width: 44, height: 44, borderRadius: 14, flexShrink: 0,
          background: done ? `${color}15` : 'rgba(0,0,0,0.04)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22,
        }}>
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#1A2332', margin: 0 }}>{label}</p>
          <p style={{ fontSize: 12, color: '#6B7280', margin: '2px 0 0' }}>{sublabel}</p>
        </div>
        {done
          ? <div style={{ width: 28, height: 28, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 12, color: '#fff' }}>✓</span>
            </div>
          : <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid rgba(0,0,0,0.1)', flexShrink: 0 }} />
        }
      </motion.div>
    </Link>
  )
}

// ─── WATER WIDGET COMPACTO ────────────────────────────────────────────────────
function WaterWidget({ userId }) {
  const [glasses, setGlasses] = useState(0)
  const [goal, setGoal]       = useState(8)
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (!userId) return
    supabase.from('hydration_logs').select('glasses,goal').eq('user_id', userId).eq('date', today).maybeSingle()
      .then(({ data }) => { if (data) { setGlasses(data.glasses || 0); setGoal(data.goal || 8) } })
  }, [userId])

  async function update(delta) {
    const next = Math.max(0, Math.min(glasses + delta, goal + 4))
    setGlasses(next)
    supabase.from('hydration_logs').upsert({ user_id: userId, date: today, glasses: next, goal }, { onConflict: 'user_id,date' })
  }

  const pct = Math.min(glasses / goal, 1)

  return (
    <motion.div whileTap={{ scale: 0.98 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 18,
        background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)',
        border: '1px solid rgba(59,130,246,0.2)', marginBottom: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}>
      <div style={{ width: 44, height: 44, borderRadius: 14, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Droplets size={20} style={{ color: '#3B82F6' }} />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#1A2332', margin: 0 }}>Hidratación</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
            <motion.div animate={{ width: `${pct * 100}%` }} transition={{ duration: 0.4 }}
              style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(90deg,#60A5FA,#3B82F6)' }} />
          </div>
          <span style={{ fontSize: 11, color: '#6B7280', whiteSpace: 'nowrap' }}>{glasses * 250}ml / {goal * 250}ml</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <button onClick={() => update(-1)} disabled={glasses === 0}
          style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(0,0,0,0.06)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <MinusIcon size={12} style={{ color: '#6B7280' }} />
        </button>
        <span style={{ fontSize: 16, fontWeight: 800, color: '#3B82F6', minWidth: 16, textAlign: 'center' }}>{glasses}</span>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => update(1)}
          style={{ width: 28, height: 28, borderRadius: 8, background: '#3B82F6', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Plus size={12} style={{ color: '#fff' }} />
        </motion.button>
      </div>
    </motion.div>
  )
}

// ─── PROGRESO CIRCULAR ────────────────────────────────────────────────────────
function MiniRing({ value, max, color, label }) {
  const r = 22, circ = 2 * Math.PI * r
  const pct = Math.min(value / max, 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{ position: 'relative', width: 56, height: 56 }}>
        <svg width={56} height={56} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={28} cy={28} r={r} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth={6} />
          <motion.circle cx={28} cy={28} r={r} fill="none" stroke={color} strokeWidth={6}
            strokeDasharray={circ} initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ * (1 - pct) }} transition={{ duration: 0.8 }}
            strokeLinecap="round" />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 10, fontWeight: 800, color }}>{Math.round(pct * 100)}%</span>
        </div>
      </div>
      <span style={{ fontSize: 10, fontWeight: 600, color: '#6B7280' }}>{label}</span>
    </div>
  )
}

// ─── MAIN HOME ────────────────────────────────────────────────────────────────
export default function Home() {
  const { profile, user }     = useStore()
  const { theme, loaded }     = useTheme()

  // Recovery desde PandiStateContext (con fallback si no está disponible)
  let recoveryLight = 'GREEN'
  let recoveryMsg   = 'Hoy tienes energía para todo.'
  try {
    const ctx = usePandiState()
    recoveryLight = ctx.recoveryLight || 'GREEN'
    recoveryMsg   = ctx.recoveryScore?.restriction?.message || (
      recoveryLight === 'GREEN'  ? 'Hoy tienes energía para todo.' :
      recoveryLight === 'YELLOW' ? 'Ritmo moderado. Ajustando tu plan.' :
                                   'Hoy el descanso ES el entrenamiento.'
    )
  } catch {}

  const [todayMeals,   setTodayMeals]   = useState([])
  const [todayWorkout, setTodayWorkout] = useState(null)
  const [goals,        setGoals]        = useState({ calories: 2000, protein_g: 150 })
  const [weightLogs,   setWeightLogs]   = useState([])
  const [todaySleep,   setTodaySleep]   = useState(null)
  const [todayMood,    setTodayMood]    = useState(null)
  const [waterGlasses, setWaterGlasses] = useState(0)

  useTour('home')

  useEffect(() => {
    if (!user) return
    const today = new Date().toISOString().split('T')[0]
    const safe  = p => Promise.resolve(p).catch(() => ({ data: null }))
    Promise.all([
      safe(supabase.from('meal_logs').select('calories,protein_g').eq('user_id', user.id).eq('date', today)),
      safe(supabase.from('workout_sessions').select('calories_burned').eq('user_id', user.id).eq('status','completed').gte('created_at', today+'T00:00:00').limit(1)),
      safe(supabase.from('nutrition_goals').select('*').eq('user_id', user.id).maybeSingle()),
      safe(supabase.from('weight_logs').select('weight_kg,date').eq('user_id', user.id).order('date',{ascending:false}).limit(5)),
      safe(supabase.from('sleep_logs').select('hours,quality').eq('user_id', user.id).eq('date', today).maybeSingle()),
      safe(supabase.from('mood_logs').select('mood').eq('user_id', user.id).eq('date', today).maybeSingle()),
      safe(supabase.from('hydration_logs').select('glasses').eq('user_id', user.id).eq('date', today).maybeSingle()),
    ]).then(([mealsR, workoutR, goalsR, weightR, sleepR, moodR, waterR]) => {
      setTodayMeals(mealsR.data || [])
      setTodayWorkout(workoutR.data?.[0] || null)
      if (goalsR.data) setGoals(goalsR.data)
      setWeightLogs(weightR.data || [])
      setTodaySleep(sleepR.data || null)
      setTodayMood(moodR.data || null)
      setWaterGlasses(waterR.data?.glasses || 0)
    })
  }, [user])

  const cals    = todayMeals.reduce((s, m) => s + (m.calories  || 0), 0)
  const protein = todayMeals.reduce((s, m) => s + (m.protein_g || 0), 0)
  const burned  = todayWorkout?.calories_burned || 0

  useSectionContext('home', {
    caloriesConsumed: Math.round(cals), caloriesTarget: goals.calories,
    proteinConsumed: Math.round(protein), proteinTarget: goals.protein_g,
    caloriesBurned: burned, waterGlasses, workedOutToday: !!todayWorkout,
    sleepLastNight: todaySleep?.hours || null, moodToday: todayMood?.mood || null,
    streak: profile?.streak || 0, level: profile?.level || 1,
  })

  if (!loaded) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#f0fffe' }}>
      <motion.div animate={{ scale:[1,1.1,1] }} transition={{ duration:1.5, repeat:Infinity }}>
        <span style={{ fontSize: 48 }}>🐼</span>
      </motion.div>
    </div>
  )

  const hour         = new Date().getHours()
  const greeting     = hour < 12 ? '¡Buenos días' : hour < 20 ? '¡Buenas tardes' : '¡Buenas noches'
  const name         = profile?.name?.split(' ')[0] || 'Compi'
  const MOODS        = { 1:'😩', 2:'😞', 3:'😐', 4:'😊', 5:'🤩' }
  const MOOD_LABELS  = { 1:'Muy mal', 2:'Mal', 3:'Regular', 4:'Bien', 5:'Genial' }
  const currentWeight = weightLogs[0]?.weight_kg
  const doneTodayCount = [cals > 0, !!todayWorkout, !!todaySleep, !!todayMood, waterGlasses > 0].filter(Boolean).length

  const tasks = [
    { to:'/nutrition', icon:'🍎', label:'Nutrición', sublabel: cals > 0 ? `${Math.round(cals)} / ${goals.calories} kcal` : 'Sin registro hoy', color:'#F97316', done: cals > 0 },
    { to:'/workout',   icon:'💪', label:'Entrenamiento', sublabel: todayWorkout ? `${burned} kcal quemadas` : 'Sin entreno hoy', color:'#6366F1', done: !!todayWorkout },
    { to:'/sleep',     icon:'😴', label:'Sueño', sublabel: todaySleep ? `${todaySleep.hours}h · Calidad ${todaySleep.quality}/5` : 'Sin registro', color:'#818CF8', done: !!todaySleep },
    { to:'/mood',      icon: todayMood ? MOODS[todayMood.mood] : '🧘', label:'Bienestar', sublabel: todayMood ? `Hoy te sientes ${MOOD_LABELS[todayMood.mood].toLowerCase()}` : 'Check-in pendiente', color:'#2EC4B6', done: !!todayMood },
    { to:'/health',    icon:'⚖️', label:'Seguimiento', sublabel: currentWeight ? `${currentWeight} kg actual` : 'Peso y medidas', color:'#EC4899', done: !!currentWeight },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafa', paddingBottom: 100 }}>

      {/* ── SANTUARIO ──────────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', height: 420, overflow: 'hidden' }}>
        <SanctuaryBackground recoveryLight={recoveryLight} />

        {/* Header flotante */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 11, color: 'rgba(26,35,50,0.55)', margin: 0, fontWeight: 600 }}>{greeting},</p>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1A2332', margin: 0, letterSpacing: '-.02em' }}>{name} 👋</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ padding: '6px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)', border: '1px solid rgba(0,0,0,0.06)' }}>
              <p style={{ fontSize: 9, color: '#6B7280', margin: 0, textAlign: 'center' }}>Nivel</p>
              <p style={{ fontSize: 14, fontWeight: 900, color: theme.primary, margin: 0, textAlign: 'center' }}>{profile?.level || 1}</p>
            </div>
            <div style={{ padding: '6px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)', border: '1px solid rgba(0,0,0,0.06)' }}>
              <p style={{ fontSize: 9, color: '#6B7280', margin: 0, textAlign: 'center' }}>Racha</p>
              <p style={{ fontSize: 14, fontWeight: 900, color: '#F97316', margin: 0, textAlign: 'center' }}>🔥{profile?.streak || 0}</p>
            </div>
            <Link to="/profile">
              <div style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)', border: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>☰</div>
            </Link>
          </div>
        </div>

        {/* Pandi centrado */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -46%)', zIndex: 5 }}>
          <PandiHero recoveryLight={recoveryLight} />
        </div>

        {/* Badge de estado */}
        <div style={{ position: 'absolute', bottom: 60, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
          <RecoveryBadge recoveryLight={recoveryLight} msg={recoveryMsg} />
        </div>

        {/* XP Bar */}
        <div style={{ position: 'absolute', bottom: 20, left: 20, right: 20, zIndex: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(26,35,50,0.5)', marginBottom: 4 }}>
            <span>{profile?.xp || 0} XP</span>
            <span>Nivel {(profile?.level || 1) + 1} → {(profile?.level || 1) * 500} XP</span>
          </div>
          <div style={{ height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
            <motion.div style={{ height: '100%', borderRadius: 2, background: `linear-gradient(90deg, ${theme.primary}, #FF8FA3)` }}
              initial={{ width: 0 }} animate={{ width: `${((profile?.xp || 0) % 500) / 5}%` }} transition={{ duration: 0.8 }} />
          </div>
        </div>
      </div>

      {/* ── CONTENIDO ──────────────────────────────────────────────────────── */}
      <div style={{ padding: '0 16px', marginTop: -8 }}>

        {/* Plan del día */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ background: 'rgba(255,255,255,0.9)', borderRadius: 20, padding: '14px 16px', marginBottom: 16, border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <p style={{ fontSize: 15, fontWeight: 800, color: '#1A2332', margin: 0 }}>Tu plan de hoy</p>
              <p style={{ fontSize: 12, color: '#6B7280', margin: '2px 0 0' }}>{doneTodayCount} de {tasks.length} tareas completadas</p>
            </div>
            <div style={{ width: 52, height: 52, position: 'relative' }}>
              <svg width={52} height={52} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={26} cy={26} r={20} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth={5} />
                <motion.circle cx={26} cy={26} r={20} fill="none" stroke={theme.primary} strokeWidth={5}
                  strokeDasharray={2*Math.PI*20}
                  initial={{ strokeDashoffset: 2*Math.PI*20 }}
                  animate={{ strokeDashoffset: 2*Math.PI*20*(1-doneTodayCount/tasks.length) }}
                  transition={{ duration: 0.8 }} strokeLinecap="round" />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: theme.primary }}>{Math.round(doneTodayCount/tasks.length*100)}%</span>
              </div>
            </div>
          </div>

          {/* Mini rings */}
          <div style={{ display: 'flex', justifyContent: 'space-around', padding: '8px 0', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
            <MiniRing value={cals} max={goals.calories} color="#F97316" label="Calorías" />
            <MiniRing value={protein} max={goals.protein_g} color={theme.primary} label="Proteína" />
            <MiniRing value={burned} max={400} color="#22C55E" label="Quemadas" />
            <MiniRing value={waterGlasses} max={8} color="#3B82F6" label="Agua" />
          </div>
        </motion.div>

        {/* Tareas */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <p style={{ fontSize: 15, fontWeight: 800, color: '#1A2332', margin: 0 }}>Tareas del día</p>
            <Link to="/report" style={{ fontSize: 12, color: theme.primary, fontWeight: 600, textDecoration: 'none' }}>Ver todas →</Link>
          </div>
          {tasks.map((t, i) => (
            <motion.div key={t.to} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + i * 0.06 }}>
              <DayTask {...t} />
            </motion.div>
          ))}
        </motion.div>

        {/* Agua */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <WaterWidget userId={user?.id} />
        </motion.div>

        {/* Insights */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <PandiInsights />
        </motion.div>

        <PandiTips section="home" variant="inline" />
        <TourHelpButton tourKey="home" />
      </div>
    </div>
  )
}
