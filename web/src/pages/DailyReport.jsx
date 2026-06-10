import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader, RefreshCw, Apple, Dumbbell, Moon, Droplets, Smile, TrendingUp, Trophy, ChevronRight } from 'lucide-react'
import { api } from '../lib/api'
import { supabase } from '../lib/supabase'
import { useStore } from '../store/useStore'
import { useTheme } from '../contexts/ThemeProvider'
import { useTour } from '../hooks/useTour'
import TourHelpButton from '../components/tour/TourHelpButton'
import PandiContextualBubble from '../components/PandiContextualBubble'
import PandiTips from '../components/PandiTips'

function ModuleStatus({ icon: Icon, label, value, status, to }) {
  const { theme } = useTheme()
  const colors = { done: theme.success, partial: theme.warning, empty: theme.border }
  const dots   = { done: '●', partial: '◐', empty: '○' }
  return (
    <Link to={to} className="flex items-center gap-3 py-2.5 px-2 rounded-xl transition-all active:scale-99"
      style={{ borderBottom: `1px solid ${theme.border}` }}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: theme.surface2 }}>
        <Icon size={15} style={{ color: theme.textMuted }} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium" style={{ color: theme.text }}>{label}</p>
        <p className="text-xs" style={{ color: theme.textMuted }}>{value}</p>
      </div>
      <span style={{ color: colors[status] }}>{dots[status]}</span>
      <ChevronRight size={12} style={{ color: theme.textLight }} />
    </Link>
  )
}

function WeeklyBar({ label, value, max, color }) {
  const { theme } = useTheme()
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div>
      <div className="flex justify-between text-xs mb-1" style={{ color: theme.textMuted }}>
        <span>{label}</span><span>{Math.round(value)}/{max}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: theme.surface2 }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }}
          className="h-full rounded-full" style={{ background: color }} />
      </div>
    </div>
  )
}

export default function DailyReport() {
  const { user, profile, addXP } = useStore()
  const { theme } = useTheme()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [dailyData, setDailyData] = useState(null)
  const [goals, setGoals] = useState({ calories: 2000, protein_g: 150 })
  const [achievements, setAchievements] = useState([])
  const [weekStats, setWeekStats] = useState(null)
  const today = new Date().toISOString().split('T')[0]

  // Tour guiado
  useTour('report')

  useEffect(() => { if (!user) return; loadDailyData(); loadWeekStats(); loadAchievements() }, [user])

  async function loadDailyData() {
    const [mealsRes, workoutRes, sleepRes, moodRes, hydrationRes, goalsRes] = await Promise.all([
      supabase.from('meal_logs').select('calories,protein_g').eq('user_id', user.id).eq('date', today),
      supabase.from('workout_sessions').select('calories_burned,name').eq('user_id', user.id).gte('created_at', today + 'T00:00:00').lt('created_at', today + 'T23:59:59').eq('status','completed'),
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
    const days = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d.toISOString().split('T')[0] })
    const [mealsRes, workoutsRes, sleepRes] = await Promise.all([
      supabase.from('meal_logs').select('date,calories').eq('user_id', user.id).in('date', days),
      supabase.from('workout_sessions').select('created_at').eq('user_id', user.id).eq('status','completed').gte('created_at', days[0] + 'T00:00:00'),
      supabase.from('sleep_logs').select('date,hours').eq('user_id', user.id).in('date', days),
    ])
    const meals = mealsRes.data || []; const workouts = workoutsRes.data || []; const sleepLogs = sleepRes.data || []
    setWeekStats({
      avgCals: meals.length ? Math.round(meals.reduce((s,m)=>s+m.calories,0)/7) : 0,
      workoutDays: workouts.length,
      avgSleep: sleepLogs.length ? parseFloat((sleepLogs.reduce((s,l)=>s+l.hours,0)/sleepLogs.length).toFixed(1)) : 0,
      loggedDays: [...new Set(meals.map(m=>m.date))].length,
    })
  }

  async function loadAchievements() {
    const { data } = await supabase.from('achievements').select('*').eq('user_id', user.id).order('earned_at', { ascending: false }).limit(3)
    setAchievements(data || [])
  }

  async function generateReport() {
    setLoading(true)
    try { const data = await api.report.today(); setReport(data); addXP(5) }
    catch (err) { toast.error('Algo salió mal. Inténtalo de nuevo.') }
    finally { setLoading(false) }
  }

  const calPct = dailyData ? Math.round((dailyData.calories / goals.calories) * 100) : 0
  const getStatus = (value, threshold) => value >= threshold ? 'done' : value > 0 ? 'partial' : 'empty'
  const MOOD_EMOJI = ['','😩','😞','😐','😊','🤩']

  return (
    <div className="page">
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold" style={{ color: theme.text }}>Tu Día 📊</h1>
        <p className="text-sm" style={{ color: theme.textMuted }}>
          {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Hero — balance calórico */}
      {dailyData && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="card mb-5" data-tour="report-calories">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs uppercase tracking-wider font-medium" style={{ color: theme.textMuted }}>Balance calórico</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold" style={{ color: theme.text }}>{dailyData.calories}</span>
                <span style={{ color: theme.textMuted }}>/ {goals.calories} kcal</span>
              </div>
              <p className="text-sm font-medium mt-0.5"
                style={{ color: calPct > 110 ? theme.error : calPct >= 85 ? theme.success : theme.textMuted }}>
                {calPct > 110 ? `+${dailyData.calories - goals.calories} kcal superadas` : calPct >= 85 ? '✓ En objetivo' : `${goals.calories - dailyData.calories} kcal restantes`}
              </p>
            </div>
            <div className="relative w-16 h-16">
              <svg viewBox="0 0 64 64" className="-rotate-90 w-full h-full">
                <circle cx="32" cy="32" r="26" fill="none" stroke={`${theme.primary}20`} strokeWidth="6" />
                <motion.circle cx="32" cy="32" r="26" fill="none" stroke={calPct > 110 ? theme.error : theme.primary} strokeWidth="6"
                  strokeDasharray={2*Math.PI*26} initial={{ strokeDashoffset: 2*Math.PI*26 }}
                  animate={{ strokeDashoffset: 2*Math.PI*26*(1-Math.min(calPct/100,1)) }} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold" style={{ color: theme.text }}>{calPct}%</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="rounded-xl p-3" style={{ background: `${theme.primary}10` }}>
              <p className="text-xs" style={{ color: theme.textMuted }}>Proteína</p>
              <p className="font-bold" style={{ color: theme.text }}>{dailyData.protein}g <span className="text-xs font-normal" style={{ color: theme.textMuted }}>/ {goals.protein_g}g</span></p>
            </div>
            <div className="rounded-xl p-3" style={{ background: `${theme.warning}10` }}>
              <p className="text-xs" style={{ color: theme.textMuted }}>Quemadas</p>
              <p className="font-bold" style={{ color: theme.text }}>{dailyData.caloriesBurned} <span className="text-xs font-normal" style={{ color: theme.textMuted }}>kcal</span></p>
            </div>
          </div>

          {/* Estado módulos */}
          <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: '0.75rem' }}
            data-tour="report-modules">
            <p className="text-xs uppercase tracking-wider mb-2" style={{ color: theme.textMuted }}>Estado de hoy</p>
            <ModuleStatus icon={Apple}    label="Nutrición"     value={dailyData.mealsCount > 0 ? `${dailyData.mealsCount} comidas · ${dailyData.calories} kcal` : 'Sin registros'} status={getStatus(dailyData.mealsCount, 3)} to="/nutrition" />
            <ModuleStatus icon={Dumbbell} label="Entrenamiento" value={dailyData.workouts.length > 0 ? dailyData.workouts.map(w=>w.name).join(', ') : 'Sin entreno'} status={getStatus(dailyData.workouts.length, 1)} to="/workout" />
            <ModuleStatus icon={Moon}     label="Sueño"         value={dailyData.sleep ? `${dailyData.sleep.hours}h` : 'No registrado'} status={dailyData.sleep ? 'done' : 'empty'} to="/sleep" />
            <ModuleStatus icon={Smile}    label="Ánimo"         value={dailyData.mood ? `${MOOD_EMOJI[dailyData.mood.mood]} ${dailyData.mood.mood}/5` : 'No registrado'} status={dailyData.mood ? 'done' : 'empty'} to="/mood" />
            <ModuleStatus icon={Droplets} label="Hidratación"   value={dailyData.hydration ? `${dailyData.hydration.glasses}/${dailyData.hydration.goal} vasos` : 'No registrado'} status={dailyData.hydration ? getStatus(dailyData.hydration.glasses, dailyData.hydration.goal) : 'empty'} to="/hydration" />
          </div>
        </motion.div>
      )}

      {/* Coach insight */}
      <div className="card mb-5" data-tour="report-coach">
        <div className="flex items-center justify-between mb-3">
          <p className="font-semibold" style={{ color: theme.text }}>Insight del Coach IA 🤖</p>
          {report && <button onClick={generateReport} disabled={loading}><RefreshCw size={14} className={loading ? 'animate-spin' : ''} style={{ color: theme.textMuted }} /></button>}
        </div>
        {!report ? (
          <div className="text-center py-4">
            <p className="text-sm mb-3" style={{ color: theme.textMuted }}>Genera tu análisis personalizado del día</p>
            <button onClick={generateReport} disabled={loading}
              className="btn-primary inline-flex items-center justify-center gap-2 w-auto px-6">
              {loading ? <><Loader size={14} className="animate-spin" /> Analizando…</> : '✨ Generar análisis'}
            </button>
          </div>
        ) : (
          <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <div className="rounded-xl p-3" style={{ background: `${theme.primary}10`, border: `1px solid ${theme.primary}20` }}>
                <p className="text-sm leading-relaxed" style={{ color: theme.text }}>{report.coach_insight}</p>
              </div>
              <div className="rounded-xl p-3" style={{ background: `${theme.success}10`, border: `1px solid ${theme.success}20` }}>
                <p className="text-xs font-medium mb-1" style={{ color: theme.textMuted }}>💡 Para mañana</p>
                <p className="text-sm" style={{ color: theme.text }}>{report.recommendation}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Weekly stats */}
      {weekStats && (
        <div className="card mb-5" data-tour="report-weekly">
          <p className="font-semibold mb-4" style={{ color: theme.text }}>Esta semana 📅</p>
          <div className="space-y-3">
            <WeeklyBar label="Calorías media" value={weekStats.avgCals} max={goals.calories} color={theme.warning} />
            <WeeklyBar label="Días con registro" value={weekStats.loggedDays} max={7} color={theme.primary} />
            <WeeklyBar label="Entrenos" value={weekStats.workoutDays} max={5} color={theme.success} />
            <WeeklyBar label="Sueño medio (h)" value={weekStats.avgSleep} max={8} color="#818cf8" />
          </div>
          <Link to="/health" className="flex items-center justify-center gap-1 mt-3 text-xs font-medium"
            style={{ color: theme.primary }}>
            Ver seguimiento completo <ChevronRight size={12} />
          </Link>
        </div>
      )}

      {/* Achievements */}
      {achievements.length > 0 && (
        <div className="card mb-5">
          <p className="font-semibold mb-3" style={{ color: theme.text }}>Logros recientes 🏆</p>
          <div className="space-y-2">
            {achievements.map(a => (
              <div key={a.id} className="flex items-center gap-3">
                <span className="text-2xl">{a.icon}</span>
                <div>
                  <p className="text-sm font-medium" style={{ color: theme.text }}>{a.title}</p>
                  <p className="text-xs" style={{ color: theme.textMuted }}>{a.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* XP */}
      <div className="card" style={{ background: `${theme.warning}10`, border: `1px solid ${theme.warning}20` }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${theme.warning}20` }}>
            <Trophy size={18} style={{ color: theme.warning }} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm" style={{ color: theme.text }}>Nivel {profile?.level || 1}</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: theme.surface2 }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${((profile?.xp || 0) % 500) / 5}%` }}
                  className="h-full rounded-full" style={{ background: theme.gradientBrand }} />
              </div>
              <span className="text-xs" style={{ color: theme.textMuted }}>{profile?.xp || 0} XP</span>
            </div>
          </div>
        </div>
      </div>

      <TourHelpButton tourKey="report" />
    </div>
  )
}
