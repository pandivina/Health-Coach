import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useStore } from '../store/useStore'
import { supabase } from '../lib/supabase'
import { MessageCircle, Apple, Dumbbell, Moon, Droplets, ChefHat,
         BarChart2, Smile, TrendingDown, TrendingUp, Minus, Scale } from 'lucide-react'

const QUICK_LINKS = [
  { to: '/nutrition', icon: Apple,         label: 'Nutrición',  color: 'from-emerald-500/20 to-emerald-500/5' },
  { to: '/workout',   icon: Dumbbell,      label: 'Entrena',    color: 'from-orange-500/20 to-orange-500/5' },
  { to: '/sleep',     icon: Moon,          label: 'Sueño',      color: 'from-indigo-500/20 to-indigo-500/5' },
  { to: '/mood',      icon: Smile,         label: 'Ánimo',      color: 'from-yellow-500/20 to-yellow-500/5' },
  { to: '/hydration', icon: Droplets,      label: 'Agua',       color: 'from-cyan-500/20 to-cyan-500/5' },
  { to: '/nutrition', icon: ChefHat,       label: 'Recetas',    color: 'from-pink-500/20 to-pink-500/5' },
  { to: '/coach',     icon: MessageCircle, label: 'Coach',      color: 'from-violet-500/20 to-violet-500/5' },
  { to: '/report',    icon: BarChart2,     label: 'Tu Día',     color: 'from-rose-500/20 to-rose-500/5' },
]

function RingProgress({ value, max, color = '#6366f1', size = 80, label }) {
  const r = 30, circ = 2 * Math.PI * r
  const progress = Math.min(value / max, 1)
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
          <motion.circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={8}
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ * (1 - progress) }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-white">{Math.round(value)}</span>
        </div>
      </div>
      <p className="text-white/50 text-[11px]">{label}</p>
      <p className="text-white/30 text-[10px]">/ {max}</p>
    </div>
  )
}

export default function Home() {
  const { profile, user } = useStore()
  const [todayMeals, setTodayMeals] = useState([])
  const [todayWorkout, setTodayWorkout] = useState(null)
  const [goals, setGoals] = useState({ calories: 2000, protein_g: 150 })
  const [healthProfile, setHealthProfile] = useState(null)
  const [weightLogs, setWeightLogs] = useState([])

  useEffect(() => {
    if (!user) return
    const today = new Date().toISOString().split('T')[0]

    supabase.from('meal_logs').select('calories,protein_g').eq('user_id', user.id).eq('date', today)
      .then(({ data }) => setTodayMeals(data || []))

    supabase.from('workouts').select('calories_burned').eq('user_id', user.id).eq('date', today).limit(1)
      .then(({ data }) => setTodayWorkout(data?.[0] || null))

    supabase.from('nutrition_goals').select('*').eq('user_id', user.id).single()
      .then(({ data }) => data && setGoals(data))

    supabase.from('health_profiles').select('weight_kg,target_weight_kg,bmi,goal,tdee').eq('user_id', user.id).single()
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

  // Tendencia de peso
  const currentWeight = weightLogs[0]?.weight_kg
  const previousWeight = weightLogs[1]?.weight_kg
  const weightDiff = currentWeight && previousWeight ? (currentWeight - previousWeight).toFixed(1) : null
  const targetWeight = healthProfile?.target_weight_kg
  const toGoal = currentWeight && targetWeight ? Math.abs(currentWeight - targetWeight).toFixed(1) : null

  const GOAL_LABELS = { lose_fat:'Perder grasa 🔥', gain_muscle:'Ganar músculo 💪', define:'Definición ✂️', recomp:'Recomposición 🔄', maintain:'Mantener ⚖️', health:'Salud ❤️' }

  return (
    <div className="page">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/50 text-sm">{greeting},</p>
            <h1 className="text-2xl font-extrabold">{profile?.name || 'Campeón'} 👋</h1>
          </div>
          <Link to="/pet">
            <motion.div whileTap={{ scale: 0.9 }}
              className="w-14 h-14 rounded-2xl bg-gradient-card border border-white/10 flex items-center justify-center text-3xl">
              {petEmoji}
            </motion.div>
          </Link>
        </div>

        {/* Nivel + racha */}
        <div className="flex gap-3 mt-3">
          <div className="flex-1 card py-2 flex items-center justify-center gap-2">
            <span className="text-yellow-400">⚡</span>
            <span className="text-sm font-semibold">Nivel {profile?.level || 1}</span>
            <span className="text-white/30 text-xs">· {profile?.xp || 0} XP</span>
          </div>
          <div className="flex-1 card py-2 flex items-center justify-center gap-2">
            <span>🔥</span>
            <span className="text-sm font-semibold">{profile?.streak || 0} días</span>
          </div>
        </div>
      </motion.div>

      {/* Progreso de peso */}
      {(currentWeight || healthProfile) && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}
          className="card mb-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/5 border-indigo-500/15">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Scale size={14} className="text-indigo-400" />
              <p className="text-sm font-semibold">Progreso de peso</p>
            </div>
            <Link to="/health" className="text-accent text-xs font-medium">Ver más →</Link>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">{currentWeight || healthProfile?.weight_kg || '–'} <span className="text-sm text-white/40">kg</span></p>
              {weightDiff && (
                <div className="flex items-center gap-1 mt-0.5">
                  {weightDiff < 0
                    ? <TrendingDown size={12} className="text-accent-green" />
                    : weightDiff > 0
                    ? <TrendingUp size={12} className="text-orange-400" />
                    : <Minus size={12} className="text-white/30" />}
                  <span className={`text-xs ${weightDiff < 0 ? 'text-accent-green' : weightDiff > 0 ? 'text-orange-400' : 'text-white/30'}`}>
                    {weightDiff > 0 ? '+' : ''}{weightDiff} kg
                  </span>
                </div>
              )}
            </div>
            {targetWeight && (
              <div className="text-right">
                <p className="text-white/40 text-xs">Objetivo</p>
                <p className="font-semibold">{targetWeight} kg</p>
                {toGoal && <p className="text-white/30 text-xs">{toGoal} kg restantes</p>}
              </div>
            )}
            {healthProfile?.goal && (
              <div className="text-right">
                <p className="text-white/40 text-xs">Meta</p>
                <p className="text-xs font-medium">{GOAL_LABELS[healthProfile.goal] || healthProfile.goal}</p>
              </div>
            )}
          </div>

          {/* Mini weight chart */}
          {weightLogs.length > 1 && (
            <div className="flex items-end gap-1.5 mt-3 h-8">
              {[...weightLogs].reverse().map((log, i) => {
                const allWeights = weightLogs.map(l => l.weight_kg)
                const min = Math.min(...allWeights) - 1
                const max = Math.max(...allWeights) + 1
                const pct = ((log.weight_kg - min) / (max - min)) * 100
                return (
                  <motion.div key={log.date}
                    initial={{ height: 0 }} animate={{ height: `${Math.max(pct, 10)}%` }}
                    transition={{ delay: i * 0.05, duration: 0.4 }}
                    className={`flex-1 rounded-t-sm ${i === weightLogs.length - 1 ? 'bg-indigo-400' : 'bg-white/10'}`} />
                )
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* Rings de progreso */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="card mb-5">
        <p className="text-white/50 text-xs mb-3 font-medium uppercase tracking-wider">Progreso de hoy</p>
        <div className="flex justify-around">
          <RingProgress value={cals}    max={goals.calories}   color="#f97316" label="Calorías" />
          <RingProgress value={protein} max={goals.protein_g}  color="#6366f1" label="Proteína" />
          <RingProgress value={burned}  max={400}              color="#22c55e" label="Quemadas" />
        </div>
        <div className="mt-3 pt-3 border-t border-white/5 flex justify-center">
          <span className="text-white/40 text-xs">
            Balance: <span className={cals - burned > goals.calories ? 'text-accent-red' : 'text-accent-green'}>
              {Math.round(cals - burned)} kcal
            </span>
          </span>
        </div>
      </motion.div>

      {/* Accesos rápidos */}
      <p className="section-title">Accesos rápidos</p>
      <div className="grid grid-cols-4 gap-3 mb-4">
        {QUICK_LINKS.map((item, i) => (
          <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 * i }}>
            <Link to={item.to}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-gradient-to-b ${item.color}
                border border-white/5 active:scale-95 transition-all`}>
              <item.icon size={20} className="text-white/80" />
              <span className="text-[10px] text-white/60 font-medium text-center leading-tight">{item.label}</span>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Seguimiento semanal CTA */}
      <Link to="/health">
        <motion.div whileTap={{ scale: 0.98 }}
          className="card bg-gradient-to-r from-indigo-500/20 to-purple-500/10 border-indigo-500/20
                     flex items-center gap-4 mb-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
            <TrendingUp size={20} className="text-indigo-400" />
          </div>
          <div>
            <p className="font-semibold text-sm">Seguimiento semanal</p>
            <p className="text-white/40 text-xs">Peso, medidas, analíticas y tratamientos</p>
          </div>
          <span className="ml-auto text-white/30">›</span>
        </motion.div>
      </Link>

      {/* Coach CTA */}
      <Link to="/coach">
        <motion.div whileTap={{ scale: 0.98 }}
          className="card bg-gradient-to-r from-violet-500/20 to-indigo-500/10 border-violet-500/20
                     flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
            <MessageCircle size={20} className="text-violet-400" />
          </div>
          <div>
            <p className="font-semibold text-sm">Habla con tu Coach IA</p>
            <p className="text-white/40 text-xs">Contextualizado con tu perfil clínico</p>
          </div>
          <span className="ml-auto text-white/30">›</span>
        </motion.div>
      </Link>
    </div>
  )
}
