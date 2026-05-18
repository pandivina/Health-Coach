import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader, RefreshCw, Apple, Dumbbell, Moon, Droplets, Smile, Scale, Trophy, ChevronRight } from 'lucide-react'
import { api } from '../lib/api'
import { supabase } from '../lib/supabase'
import { useStore } from '../store/useStore'

function StatBlock({ emoji, label, value, sub, to, color = 'bg-surface-2' }) {
  const content = (
    <motion.div whileTap={{ scale: 0.97 }} className={`${color} rounded-2xl p-4 border border-white/5`}>
      <p className="text-xl mb-1">{emoji}</p>
      <p className="font-bold text-lg leading-tight">{value}</p>
      <p className="text-white/40 text-xs">{label}</p>
      {sub && <p className="text-white/25 text-[10px] mt-0.5">{sub}</p>}
    </motion.div>
  )
  return to ? <Link to={to}>{content}</Link> : content
}

function ModuleStatus({ icon: Icon, label, value, status, to }) {
  const colors = { done: 'text-accent-green', partial: 'text-yellow-400', empty: 'text-white/20' }
  const dots = { done: '●', partial: '◐', empty: '○' }
  return (
    <Link to={to} className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0 active:bg-surface-3 rounded-xl px-2 transition-all">
      <div className="w-8 h-8 rounded-xl bg-surface-3 flex items-center justify-center flex-shrink-0">
        <Icon size={15} className="text-white/60" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-white/40 text-xs">{value}</p>
      </div>
      <span className={`text-lg ${colors[status]}`}>{dots[status]}</span>
      <ChevronRight size={12} className="text-white/20" />
    </Link>
  )
}

function WeeklyBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div>
      <div className="flex justify-between text-xs text-white/40 mb-1">
        <span>{label}</span><span>{Math.round(value)}/{max}</span>
      </div>
      <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6 }}
          className="h-full rounded-full" style={{ background: color }} />
      </div>
    </div>
  )
}

export default function DailyReport() {
  const { user, profile, addXP } = useStore()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [dailyData, setDailyData] = useState(null)
  const [goals, setGoals] = useState({ calories: 2000, protein_g: 150 })
  const [achievements, setAchievements] = useState([])
  const [weekStats, setWeekStats] = useState(null)
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (!user) return
    loadDailyData()
    loadWeekStats()
    loadAchievements()
  }, [user])

  async function loadDailyData() {
    const [mealsRes, workoutRes, sleepRes, moodRes, hydrationRes, goalsRes] = await Promise.all([
      supabase.from('meal_logs').select('calories,protein_g').eq('user_id', user.id).eq('date', today),
      supabase.from('workout_sessions').select('calories_burned,name').eq('user_id', user.id).eq('date', today).eq('status','completed'),
      supabase.from('sleep_logs').select('hours,quality').eq('user_id', user.id).eq('date', today).single(),
      supabase.from('mood_logs').select('mood').eq('user_id', user.id).eq('date', today).single(),
      supabase.from('hydration_logs').select('glasses,goal').eq('user_id', user.id).eq('date', today).single(),
      supabase.from('nutrition_goals').select('*').eq('user_id', user.id).single(),
    ])
    const meals = mealsRes.data || []
    if (goalsRes.data) setGoals(goalsRes.data)
    setDailyData({
      calories: Math.round(meals.reduce((s, m) => s + m.calories, 0)),
      protein: Math.round(meals.reduce((s, m) => s + m.protein_g, 0)),
      caloriesBurned: (workoutRes.data || []).reduce((s, w) => s + w.calories_burned, 0),
      workouts: workoutRes.data || [],
      sleep: sleepRes.data || null,
      mood: moodRes.data || null,
      hydration: hydrationRes.data || null,
      mealsCount: meals.length,
    })
  }

  async function loadWeekStats() {
    const days = [...Array(7)].map((_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i))
      return d.toISOString().split('T')[0]
    })
    const [mealsRes, workoutsRes, sleepRes] = await Promise.all([
      supabase.from('meal_logs').select('date,calories').eq('user_id', user.id).in('date', days),
      supabase.from('workout_sessions').select('date').eq('user_id', user.id).eq('status','completed').in('date', days),
      supabase.from('sleep_logs').select('date,hours').eq('user_id', user.id).in('date', days),
    ])
    const meals = mealsRes.data || []
    const workouts = workoutsRes.data || []
    const sleepLogs = sleepRes.data || []
    const avgCals = meals.length ? Math.round(meals.reduce((s,m) => s + m.calories, 0) / 7) : 0
    const avgSleep = sleepLogs.length ? (sleepLogs.reduce((s,l) => s + l.hours, 0) / sleepLogs.length).toFixed(1) : 0
    setWeekStats({ avgCals, workoutDays: workouts.length, avgSleep, loggedDays: [...new Set(meals.map(m => m.date))].length })
  }

  async function loadAchievements() {
    const { data } = await supabase.from('achievements').select('*').eq('user_id', user.id).order('earned_at', { ascending: false }).limit(3)
    setAchievements(data || [])
  }

  async function generateReport() {
    setLoading(true)
    try {
      const data = await api.report.today()
      setReport(data)
      addXP(5)
    } catch (err) { alert('Error: ' + err.message) }
    finally { setLoading(false) }
  }

  const calPct = dailyData ? Math.round((dailyData.calories / goals.calories) * 100) : 0
  const MOOD_EMOJI = ['','😩','😞','😐','😊','🤩']

  // Status calculado
  const getStatus = (value, threshold) => value >= threshold ? 'done' : value > 0 ? 'partial' : 'empty'

  return (
    <div className="page">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold">Tu Día 📊</h1>
        <p className="text-white/40 text-sm">
          {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Hero — resumen del día */}
      {dailyData && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="card mb-5 bg-gradient-to-br from-surface-2 to-surface-3 border-white/8">

          {/* Calorías hero */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white/40 text-xs uppercase tracking-wider font-medium">Balance calórico</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold">{dailyData.calories}</span>
                <span className="text-white/40">/ {goals.calories} kcal</span>
              </div>
              <p className={`text-sm font-medium mt-0.5 ${calPct > 110 ? 'text-orange-400' : calPct >= 85 ? 'text-accent-green' : 'text-white/50'}`}>
                {calPct > 110 ? `+${dailyData.calories - goals.calories} kcal superadas` :
                 calPct >= 85 ? '✓ En objetivo' :
                 `${goals.calories - dailyData.calories} kcal restantes`}
              </p>
            </div>
            <div className="relative w-16 h-16">
              <svg viewBox="0 0 64 64" className="-rotate-90 w-full h-full">
                <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                <motion.circle cx="32" cy="32" r="26" fill="none"
                  stroke={calPct > 110 ? '#f97316' : '#22c55e'} strokeWidth="6"
                  strokeDasharray={2*Math.PI*26}
                  initial={{ strokeDashoffset: 2*Math.PI*26 }}
                  animate={{ strokeDashoffset: 2*Math.PI*26 * (1 - Math.min(calPct/100, 1)) }}
                  transition={{ duration: 0.8 }} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold">{calPct}%</span>
              </div>
            </div>
          </div>

          {/* Protein + burned */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-accent/10 rounded-xl p-3">
              <p className="text-xs text-white/40">Proteína</p>
              <p className="font-bold">{dailyData.protein}g <span className="text-white/30 text-xs font-normal">/ {goals.protein_g}g</span></p>
            </div>
            <div className="bg-orange-500/10 rounded-xl p-3">
              <p className="text-xs text-white/40">Quemadas</p>
              <p className="font-bold">{dailyData.caloriesBurned} <span className="text-white/30 text-xs font-normal">kcal</span></p>
            </div>
          </div>

          {/* Módulos del día */}
          <div className="border-t border-white/5 pt-3">
            <p className="text-white/30 text-xs uppercase tracking-wider mb-2">Estado de hoy</p>
            <ModuleStatus icon={Apple}   label="Nutrición"    value={dailyData.mealsCount > 0 ? `${dailyData.mealsCount} comidas · ${dailyData.calories} kcal` : 'Sin registros'} status={getStatus(dailyData.mealsCount, 3)} to="/nutrition" />
            <ModuleStatus icon={Dumbbell} label="Entrenamiento" value={dailyData.workouts.length > 0 ? dailyData.workouts.map(w=>w.name).join(', ') : 'Sin entreno'} status={getStatus(dailyData.workouts.length, 1)} to="/workout" />
            <ModuleStatus icon={Moon}    label="Sueño"        value={dailyData.sleep ? `${dailyData.sleep.hours}h · calidad ${dailyData.sleep.quality}/5` : 'No registrado'} status={dailyData.sleep ? 'done' : 'empty'} to="/sleep" />
            <ModuleStatus icon={Smile}   label="Ánimo"        value={dailyData.mood ? `${MOOD_EMOJI[dailyData.mood.mood]} ${dailyData.mood.mood}/5` : 'No registrado'} status={dailyData.mood ? 'done' : 'empty'} to="/mood" />
            <ModuleStatus icon={Droplets} label="Hidratación"  value={dailyData.hydration ? `${dailyData.hydration.glasses}/${dailyData.hydration.goal} vasos` : 'No registrado'} status={dailyData.hydration ? getStatus(dailyData.hydration.glasses, dailyData.hydration.goal) : 'empty'} to="/hydration" />
          </div>
        </motion.div>
      )}

      {/* Informe IA */}
      <div className="card mb-5">
        <div className="flex items-center justify-between mb-3">
          <p className="font-semibold">Insight del Coach IA 🤖</p>
          {report && (
            <button onClick={generateReport} disabled={loading} className="text-white/30 active:text-accent transition-all">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          )}
        </div>

        {!report ? (
          <div className="text-center py-4">
            <p className="text-white/40 text-sm mb-3">Genera tu análisis personalizado del día</p>
            <button onClick={generateReport} disabled={loading}
              className="btn-primary inline-flex items-center justify-center gap-2 w-auto px-6">
              {loading ? <><Loader size={14} className="animate-spin" /> Analizando…</> : '✨ Generar análisis'}
            </button>
          </div>
        ) : (
          <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <div className="bg-violet-500/10 rounded-xl p-3 border border-violet-500/15">
                <p className="text-white/70 text-sm leading-relaxed">{report.coach_insight}</p>
              </div>
              <div className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/15">
                <p className="text-white/50 text-xs font-medium mb-1">💡 Para mañana</p>
                <p className="text-white/70 text-sm">{report.recommendation}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Estadísticas semanales */}
      {weekStats && (
        <div className="card mb-5">
          <p className="font-semibold mb-4">Esta semana 📅</p>
          <div className="space-y-3">
            <WeeklyBar label="Calorías media" value={weekStats.avgCals} max={goals.calories} color="#f97316" />
            <WeeklyBar label="Días con registro" value={weekStats.loggedDays} max={7} color="#6366f1" />
            <WeeklyBar label="Entrenos" value={weekStats.workoutDays} max={5} color="#22c55e" />
            <WeeklyBar label="Sueño medio (h)" value={parseFloat(weekStats.avgSleep)} max={8} color="#818cf8" />
          </div>
          <Link to="/health" className="flex items-center justify-center gap-1 mt-3 text-accent text-xs font-medium">
            Ver seguimiento completo <ChevronRight size={12} />
          </Link>
        </div>
      )}

      {/* Logros recientes */}
      {achievements.length > 0 && (
        <div className="card mb-5">
          <p className="font-semibold mb-3">Logros recientes 🏆</p>
          <div className="space-y-2">
            {achievements.map(a => (
              <div key={a.id} className="flex items-center gap-3">
                <span className="text-2xl">{a.icon}</span>
                <div>
                  <p className="text-sm font-medium">{a.title}</p>
                  <p className="text-white/30 text-xs">{a.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* XP del día */}
      <div className="card bg-gradient-to-r from-yellow-500/10 to-orange-500/5 border-yellow-500/15">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
            <Trophy size={18} className="text-yellow-400" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">Nivel {profile?.level || 1}</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1.5 bg-surface-3 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }}
                  animate={{ width: `${((profile?.xp || 0) % 500) / 5}%` }}
                  className="h-full bg-gradient-brand rounded-full" />
              </div>
              <span className="text-white/30 text-xs">{profile?.xp || 0} XP</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
