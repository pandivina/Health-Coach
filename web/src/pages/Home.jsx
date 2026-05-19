import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useStore } from '../store/useStore'
import { useTheme } from '../contexts/ThemeProvider'
import { supabase } from '../lib/supabase'
import { useTour } from '../hooks/useTour'
import TourHelpButton from '../components/tour/TourHelpButton'
import { MessageCircle, Moon, Droplets, ChefHat, Smile, TrendingUp, TrendingDown, Minus, Scale } from 'lucide-react'

const QUICK_LINKS = [
  { to: '/hydration', icon: Droplets, label: 'Agua' },
  { to: '/nutrition', icon: ChefHat,  label: 'Recetas' },
  { to: '/sleep',     icon: Moon,     label: 'Sueño' },
  { to: '/mood',      icon: Smile,    label: 'Ánimo' },
]

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
          <span className="text-xs font-bold">{Math.round(value)}</span>
        </div>
      </div>
      <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
      <p className="text-[10px]" style={{ color: 'var(--color-text-light)' }}>/ {max}</p>
    </div>
  )
}

export default function Home() {
  const { profile, user } = useStore()
  const { theme } = useTheme()
  const [todayMeals, setTodayMeals] = useState([])
  const [todayWorkout, setTodayWorkout] = useState(null)
  const [goals, setGoals] = useState({ calories: 2000, protein_g: 150 })
  const [healthProfile, setHealthProfile] = useState(null)
  const [weightLogs, setWeightLogs] = useState([])

  // Tour guiado
  useTour('home')

  useEffect(() => {
    if (!user) return
    const today = new Date().toISOString().split('T')[0]
    supabase.from('meal_logs').select('calories,protein_g').eq('user_id', user.id).eq('date', today)
      .then(({ data }) => setTodayMeals(data || []))
    supabase.from('workouts').select('calories_burned').eq('user_id', user.id).eq('date', today).limit(1)
      .then(({ data }) => setTodayWorkout(data?.[0] || null))
    supabase.from('nutrition_goals').select('*').eq('user_id', user.id).single()
      .then(({ data }) => data && setGoals(data))
    supabase.from('health_profiles').select('weight_kg,target_weight_kg,goal').eq('user_id', user.id).single()
      .then(({ data }) => data && setHealthProfile(data))
    supabase.from('weight_logs').select('weight_kg,date').eq('user_id', user.id)
      .order('date', { ascending: false }).limit(5)
      .then(({ data }) => setWeightLogs(data || []))
  }, [user])

  const cals    = todayMeals.reduce((s, m) => s + (m.calories || 0), 0)
  const protein = todayMeals.reduce((s, m) => s + (m.protein_g || 0), 0)
  const burned  = todayWorkout?.calories_burned || 0
  const hour = new Date().getHours()
  const greeting = hour < 12 ? '¡Buenos días' : hour < 20 ? '¡Buenas tardes' : '¡Buenas noches'
  const PET_EMOJI = { panda:'🐼', cat:'🐱', dog:'🐶', fox:'🦊', rabbit:'🐰' }
  const petEmoji = PET_EMOJI[profile?.pet_type] || '🐼'

  const currentWeight = weightLogs[0]?.weight_kg
  const previousWeight = weightLogs[1]?.weight_kg
  const weightDiff = currentWeight && previousWeight ? (currentWeight - previousWeight).toFixed(1) : null

  return (
    <div className="page">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm" style={{ color: theme.textMuted }}>{greeting},</p>
            <h1 className="text-2xl font-extrabold" style={{ color: theme.text }}>{profile?.name || 'Campeón'} 👋</h1>
          </div>
          <Link to="/pet" data-tour="home-pet">
            <motion.div whileTap={{ scale: 0.9 }}
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
              style={{ background: theme.surface2, border: `1px solid ${theme.border}` }}>
              {petEmoji}
            </motion.div>
          </Link>
        </div>

        <div className="flex gap-3 mt-3" data-tour="home-progress-level">
          {[
            ['⚡', `Nivel ${profile?.level || 1}`, `${profile?.xp || 0} XP`],
            ['🔥', `${profile?.streak || 0} días`, null],
          ].map(([e, label, sub]) => (
            <div key={label} className="flex-1 card py-2 flex items-center justify-center gap-2">
              <span>{e}</span>
              <span className="text-sm font-semibold" style={{ color: theme.text }}>{label}</span>
              {sub && <span className="text-xs" style={{ color: theme.textMuted }}>· {sub}</span>}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Peso */}
      {currentWeight && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card mb-4"
          style={{ background: `${theme.primary}10`, border: `1px solid ${theme.primary}20` }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale size={14} style={{ color: theme.primary }} />
              <p className="text-sm font-semibold" style={{ color: theme.text }}>Peso actual</p>
            </div>
            <Link to="/health" className="text-xs font-medium" style={{ color: theme.primary }}>Ver más →</Link>
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-2xl font-bold" style={{ color: theme.text }}>
              {currentWeight} <span className="text-sm font-normal" style={{ color: theme.textMuted }}>kg</span>
            </p>
            {weightDiff && (
              <div className="flex items-center gap-1">
                {weightDiff < 0 ? <TrendingDown size={14} style={{ color: theme.success }} /> :
                 weightDiff > 0 ? <TrendingUp size={14} style={{ color: theme.warning }} /> :
                 <Minus size={14} style={{ color: theme.textMuted }} />}
                <span className="text-xs font-medium" style={{ color: weightDiff < 0 ? theme.success : theme.warning }}>
                  {weightDiff > 0 ? '+' : ''}{weightDiff} kg
                </span>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Rings */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="card mb-5" data-tour="home-progress">
        <p className="text-xs mb-3 font-medium uppercase tracking-wider" style={{ color: theme.textMuted }}>Progreso de hoy</p>
        <div className="flex justify-around">
          <RingProgress value={cals}    max={goals.calories}  color={theme.warning}  label="Calorías" />
          <RingProgress value={protein} max={goals.protein_g} color={theme.primary}  label="Proteína" />
          <RingProgress value={burned}  max={400}             color={theme.success}  label="Quemadas" />
        </div>
        <div className="mt-3 pt-3 flex justify-center" style={{ borderTop: `1px solid ${theme.border}` }}>
          <span className="text-xs" style={{ color: theme.textMuted }}>
            Balance: <span style={{ color: cals - burned > goals.calories ? theme.error : theme.success }}>
              {Math.round(cals - burned)} kcal
            </span>
          </span>
        </div>
      </motion.div>

      {/* Quick links */}
      <p className="section-title">Accesos rápidos</p>
      <div className="grid grid-cols-4 gap-3 mb-4" data-tour="home-quicklinks">
        {QUICK_LINKS.map((item, i) => (
          <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 * i }}>
            <Link to={item.to}
              className="flex flex-col items-center gap-1.5 p-3 rounded-2xl active:scale-95 transition-all"
              style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>
              <item.icon size={20} style={{ color: theme.primary }} />
              <span className="text-[10px] font-medium text-center leading-tight" style={{ color: theme.textMuted }}>{item.label}</span>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Seguimiento CTA */}
      <Link to="/health">
        <motion.div whileTap={{ scale: 0.98 }} className="card flex items-center gap-4 mb-3"
          style={{ background: `${theme.primary}10`, border: `1px solid ${theme.primary}20` }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${theme.primary}20` }}>
            <TrendingUp size={20} style={{ color: theme.primary }} />
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: theme.text }}>Seguimiento semanal</p>
            <p className="text-xs" style={{ color: theme.textMuted }}>Peso, medidas, analíticas y tratamientos</p>
          </div>
          <span className="ml-auto" style={{ color: theme.textMuted }}>›</span>
        </motion.div>
      </Link>

      {/* Coach CTA */}
      <Link to="/coach" data-tour="home-coach">
        <motion.div whileTap={{ scale: 0.98 }} className="card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${theme.primary}20` }}>
            <MessageCircle size={20} style={{ color: theme.primary }} />
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: theme.text }}>Habla con tu Coach IA</p>
            <p className="text-xs" style={{ color: theme.textMuted }}>Contextualizado con tu perfil clínico</p>
          </div>
          <span className="ml-auto" style={{ color: theme.textMuted }}>›</span>
        </motion.div>
      </Link>

      {/* Tour help button */}
      <TourHelpButton tourKey="home" />
    </div>
  )
}
