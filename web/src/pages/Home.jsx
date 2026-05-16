import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useStore } from '../store/useStore'
import { supabase } from '../lib/supabase'
import { MessageCircle, Apple, Dumbbell, Moon, Droplets, ChefHat, BarChart2, Smile } from 'lucide-react'

const QUICK_LINKS = [
  { to: '/nutrition', icon: Apple,         label: 'Nutrición',  color: 'from-emerald-500/20 to-emerald-500/5' },
  { to: '/workout',   icon: Dumbbell,      label: 'Entreno',    color: 'from-orange-500/20 to-orange-500/5' },
  { to: '/sleep',     icon: Moon,          label: 'Sueño',      color: 'from-indigo-500/20 to-indigo-500/5' },
  { to: '/mood',      icon: Smile,         label: 'Ánimo',      color: 'from-yellow-500/20 to-yellow-500/5' },
  { to: '/hydration', icon: Droplets,      label: 'Agua',       color: 'from-cyan-500/20 to-cyan-500/5' },
  { to: '/recipes',   icon: ChefHat,       label: 'Recetas',    color: 'from-pink-500/20 to-pink-500/5' },
  { to: '/coach',     icon: MessageCircle, label: 'Coach',      color: 'from-violet-500/20 to-violet-500/5' },
  { to: '/report',    icon: BarChart2,     label: 'Tu Día',     color: 'from-rose-500/20 to-rose-500/5' },
]

function RingProgress({ value, max, color = '#6366f1', size = 80, label, sublabel }) {
  const r = 30, circ = 2 * Math.PI * r
  const progress = Math.min(value / max, 1)
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" style={{ display: 'block' }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={8}
            strokeDasharray={circ} strokeDashoffset={circ * (1 - progress)} strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
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

  useEffect(() => {
    if (!user) return
    const today = new Date().toISOString().split('T')[0]
    supabase.from('meal_logs').select('calories,protein_g,carbs_g').eq('user_id', user.id).eq('date', today)
      .then(({ data }) => setTodayMeals(data || []))
    supabase.from('workouts').select('calories_burned').eq('user_id', user.id).eq('date', today).limit(1)
      .then(({ data }) => setTodayWorkout(data?.[0] || null))
    supabase.from('nutrition_goals').select('*').eq('user_id', user.id).single()
      .then(({ data }) => data && setGoals(data))
  }, [user])

  const cals = todayMeals.reduce((s, m) => s + (m.calories || 0), 0)
  const protein = todayMeals.reduce((s, m) => s + (m.protein_g || 0), 0)
  const burned = todayWorkout?.calories_burned || 0
  const hour = new Date().getHours()
  const greeting = hour < 12 ? '¡Buenos días' : hour < 20 ? '¡Buenas tardes' : '¡Buenas noches'

  const PET_EMOJI = { panda: '🐼', cat: '🐱', dog: '🐶', fox: '🦊', rabbit: '🐰' }
  const petEmoji = PET_EMOJI[profile?.pet_type] || '🐼'

  return (
    <div className="page">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
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

      {/* Rings de progreso */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="card mb-5">
        <p className="text-white/50 text-xs mb-3 font-medium uppercase tracking-wider">Progreso de hoy</p>
        <div className="flex justify-around">
          <RingProgress value={cals}    max={goals.calories}   color="#f97316" label="Calorías" />
          <RingProgress value={protein} max={goals.protein_g}  color="#6366f1" label="Proteína" sublabel="g" />
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
          <motion.div key={item.to} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
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

      {/* Coach CTA */}
      <Link to="/coach">
        <motion.div whileTap={{ scale: 0.98 }}
          className="card bg-gradient-to-r from-violet-500/20 to-indigo-500/10 border-violet-500/20 
                     flex items-center gap-4 active:scale-98 transition-all">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
            <MessageCircle size={20} className="text-violet-400" />
          </div>
          <div>
            <p className="font-semibold text-sm">Habla con tu Coach IA</p>
            <p className="text-white/40 text-xs">Personalizado con tus datos reales</p>
          </div>
          <span className="ml-auto text-white/30">›</span>
        </motion.div>
      </Link>
    </div>
  )
}
