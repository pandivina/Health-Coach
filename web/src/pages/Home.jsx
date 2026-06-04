import { useEffect, useState } from 'react'
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
import { Plus, Minus as MinusIcon, Droplets } from 'lucide-react'

// --- CONFIGURACIÓN DE ESTADOS ---
const STATE_CONFIG = {
  GREEN: { bg: '/panda/sanctuary_green.png', glow: 'rgba(46,196,182,0.4)', dot: '#2EC4B6', frames: ['/panda/panda_base.png', '/panda/panda_happy.png'] },
  YELLOW: { bg: '/panda/sanctuary_yellow.png', glow: 'rgba(245,158,11,0.4)', dot: '#F59E0B', frames: ['/panda/panda_base.png', '/panda/avatar_thinking.png'] },
  RED: { bg: '/panda/sanctuary_red.png', glow: 'rgba(255,143,163,0.4)', dot: '#FF8FA3', frames: ['/panda/panda_base.png', '/panda/avatar_sleep.png'] },
}

export default function Home() {
  const { profile, user } = useStore()
  const { theme, loaded } = useTheme()
  const { recoveryLight = 'GREEN' } = usePandiState()
  const cfg = STATE_CONFIG[recoveryLight]

  const [todayMeals, setTodayMeals] = useState([])
  const [todayWorkout, setTodayWorkout] = useState(null)
  const [goals, setGoals] = useState({ calories: 2000, protein_g: 150 })
  const [weightLogs, setWeightLogs] = useState([])
  const [todaySleep, setTodaySleep] = useState(null)
  const [todayMood, setTodayMood] = useState(null)
  const [waterGlasses, setWaterGlasses] = useState(0)

  useTour('home')

  useEffect(() => {
    if (!user) return
    const today = new Date().toISOString().split('T')[0]
    Promise.all([
      supabase.from('meal_logs').select('calories,protein_g').eq('user_id', user.id).eq('date', today),
      supabase.from('workout_sessions').select('calories_burned').eq('user_id', user.id).eq('status', 'completed').gte('created_at', today + 'T00:00:00').limit(1),
      supabase.from('nutrition_goals').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('weight_logs').select('weight_kg,date').eq('user_id', user.id).order('date', { ascending: false }).limit(5),
      supabase.from('sleep_logs').select('hours,quality').eq('user_id', user.id).eq('date', today).maybeSingle(),
      supabase.from('mood_logs').select('mood').eq('user_id', user.id).eq('date', today).maybeSingle(),
      supabase.from('hydration_logs').select('glasses').eq('user_id', user.id).eq('date', today).maybeSingle(),
    ]).then(([m, w, g, weight, s, mood, water]) => {
      setTodayMeals(m.data || [])
      setTodayWorkout(w.data?.[0] || null)
      if (g.data) setGoals(g.data)
      setWeightLogs(weight.data || [])
      setTodaySleep(s.data || null)
      setTodayMood(mood.data || null)
      setWaterGlasses(water.data?.glasses || 0)
    })
  }, [user])

  const cals = todayMeals.reduce((s, m) => s + (m.calories || 0), 0)
  const protein = todayMeals.reduce((s, m) => s + (m.protein_g || 0), 0)
  const burned = todayWorkout?.calories_burned || 0
  const hour = new Date().getHours()
  const greeting = hour < 12 ? '¡Buenos días' : hour < 20 ? '¡Buenas tardes' : '¡Buenas noches'
  const name = profile?.name?.split(' ')[0] || 'Compi'
  const doneTodayCount = [cals > 0, !!todayWorkout, !!todaySleep, !!todayMood, waterGlasses > 0].filter(Boolean).length

  const tasks = [
    { to: '/nutrition', icon: '🍎', label: 'Nutrición', sublabel: cals > 0 ? `${Math.round(cals)} / ${goals.calories} kcal` : 'Sin registro hoy', color: '#F97316', done: cals > 0 },
    { to: '/workout', icon: '💪', label: 'Entrenamiento', sublabel: todayWorkout ? `${burned} kcal quemadas` : 'Sin entreno hoy', color: '#6366F1', done: !!todayWorkout },
    { to: '/sleep', icon: '😴', label: 'Sueño', sublabel: todaySleep ? `${todaySleep.hours}h · Calidad ${todaySleep.quality}/5` : 'Sin registro', color: '#818CF8', done: !!todaySleep },
    { to: '/mood', icon: todayMood ? {1:'😩',2:'😞',3:'😐',4:'😊',5:'🤩'}[todayMood.mood] : '🧘', label: 'Bienestar', sublabel: todayMood ? `Check-in realizado` : 'Check-in pendiente', color: '#2EC4B6', done: !!todayMood },
    { to: '/health', icon: '⚖️', label: 'Seguimiento', sublabel: weightLogs[0] ? `${weightLogs[0].weight_kg} kg actual` : 'Peso y medidas', color: '#EC4899', done: !!weightLogs[0] },
  ]

  if (!loaded) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🐾</div>

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafa', paddingBottom: 100 }}>
      
      {/* --- ESCENARIO SANTUARIO --- */}
      <div style={{ position: 'relative', height: 420, overflow: 'hidden' }}>
        <AnimatePresence mode="wait">
          <motion.img key={recoveryLight} src={cfg.bg} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        </AnimatePresence>

        <div style={{ position: 'absolute', top: 40, left: 20, zIndex: 10 }}>
          <p style={{ color: 'white', opacity: 0.8, fontSize: 12 }}>{greeting},</p>
          <h1 style={{ color: 'white', fontSize: 28, fontWeight: 900, margin: 0 }}>{name}</h1>
        </div>

        <div style={{ position: 'absolute', bottom: '15%', left: 0, right: 0, zIndex: 5, display: 'flex', justifyContent: 'center' }}>
          <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            style={{ filter: `drop-shadow(0 20px 30px ${cfg.glow})` }}>
            <img src={cfg.frames[1]} alt="Pandi" style={{ width: 200, height: 200 }} />
          </motion.div>
        </div>
      </div>

      {/* --- CONTENIDO --- */}
      <div style={{ padding: '0 16px', marginTop: -40, position: 'relative', zIndex: 10 }}>
        <div style={{ background: 'white', borderRadius: 24, padding: 20, boxShadow: '0 8px 30px rgba(0,0,0,0.08)', marginBottom: 20 }}>
          <p style={{ fontWeight: 800, marginBottom: 10 }}>Tu plan de hoy ({doneTodayCount}/{tasks.length})</p>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            <MiniRing value={cals} max={goals.calories} color="#F97316" label="Calorías" />
            <MiniRing value={protein} max={goals.protein_g} color={theme.primary} label="Proteína" />
            <MiniRing value={burned} max={400} color="#22C55E" label="Quemadas" />
          </div>
        </div>

        {tasks.map(t => <DayTask key={t.to} {...t} />)}
        <WaterWidget userId={user?.id} />
        <PandiInsights />
        <TourHelpButton tourKey="home" />
      </div>
    </div>
  )
}

// --- SUBCOMPONENTES ---
function DayTask({ to, icon, label, sublabel, color, done }) {
  return (
    <Link to={to} style={{ textDecoration: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 18, background: 'white', border: `1px solid ${done ? color+'20' : '#eee'}`, marginBottom: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: done ? `${color}15` : '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{icon}</div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#1A2332', margin: 0 }}>{label}</p>
          <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>{sublabel}</p>
        </div>
      </div>
    </Link>
  )
}

function WaterWidget({ userId }) {
  const [glasses, setGlasses] = useState(0)
  const today = new Date().toISOString().split('T')[0]
  
  useEffect(() => {
    if (!userId) return
    supabase.from('hydration_logs').select('glasses').eq('user_id', userId).eq('date', today).maybeSingle()
      .then(({ data }) => data && setGlasses(data.glasses))
  }, [userId])

  return (
    <div style={{ padding: '14px 16px', borderRadius: 18, background: 'white', border: '1px solid #eee', marginBottom: 8 }}>
      <p style={{ fontSize: 14, fontWeight: 700 }}>Hidratación: {glasses} vasos</p>
    </div>
  )
}

function MiniRing({ value, max, color, label }) {
  const pct = Math.min(value / max, 1)
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: `4px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800 }}>
        {Math.round(pct * 100)}%
      </div>
      <p style={{ fontSize: 9, marginTop: 4, color: '#666' }}>{label}</p>
    </div>
  )
}
