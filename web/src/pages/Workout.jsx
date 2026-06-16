import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dumbbell, Sparkles, History, BarChart2, Plus, Play, TrendingUp, Star } from 'lucide-react'
import { useTheme } from '../contexts/ThemeProvider'
import { useStore } from '../store/useStore'
import { api } from '../lib/api'
import { supabase } from '../lib/supabase'
import WorkoutDashboard from '../components/workout/WorkoutDashboard'
import LiveWorkoutScreen from '../components/workout/LiveWorkoutScreen'
import { RoutineGenerator, ExerciseLibrary, WorkoutHistory, WorkoutStats } from '../components/workout/WorkoutComponents'
import { ExerciseProgressList } from '../components/workout/ExerciseProgressChart'
import { FavoriteRoutinesList } from '../components/workout/FavoriteRoutines'
import PandiContextualBubble from '../components/PandiContextualBubble'
import PandiTips from '../components/PandiTips'

const TABS = [
  { id: 'dashboard', icon: Dumbbell,   label: 'Inicio'     },
  { id: 'favorites', icon: Star,       label: 'Favoritas'  },
  { id: 'generate',  icon: Sparkles,   label: 'IA'         },
  { id: 'library',   icon: Plus,       label: 'Ejercicios' },
  { id: 'progress',  icon: TrendingUp, label: 'Progreso'   },
  { id: 'history',   icon: History,    label: 'Historial'  },
  { id: 'stats',     icon: BarChart2,  label: 'Stats'      },
]

export default function Workout() {
  const { theme }  = useTheme()
  const { profile, user } = useStore()
  const [tab,           setTab]           = useState('dashboard')
  const [activeSession, setActiveSession] = useState(null)
  const [stats,         setStats]         = useState(null)
  const [loading,       setLoading]       = useState(false)
  const [recentSession, setRecentSession] = useState(null)

  useEffect(() => {
    if (!user) return
    api.workouts.stats().then(setStats).catch(() => {})
    supabase.from('workout_sessions').select('*')
      .eq('user_id', user.id).eq('status', 'completed')
      .order('created_at', { ascending: false }).limit(1)
      .then(({ data }) => setRecentSession(data?.[0] || null))
  }, [user])

  async function startEmpty() {
    setLoading(true)
    try {
      const result = await api.workouts.start({ name: 'Entreno libre', exercises: [] })
      setActiveSession(result)
    } catch (err) { alert('Error: ' + err.message) }
    finally { setLoading(false) }
  }

  if (activeSession) {
    return <LiveWorkoutScreen session={activeSession} onFinish={() => setActiveSession(null)} />
  }

  return (
    <div className="page pb-32" style={{ background: theme.bg }}>

      {/* 1 — Bocadillo Pandi */}
      <PandiContextualBubble section="workout"
        data={{ hasWorkout: !!recentSession, streak: profile?.streak || 0 }} />

      {/* 2 — Header */}
      <h1 className="text-2xl font-extrabold mb-4" style={{ color: theme.text }}>
        Entreno 💪
      </h1>

      {/* 3 — QuickStart + Stats Bento */}
      <div className="mb-4 space-y-2">

        {/* Botón principal arriba */}
        <motion.button whileTap={{ scale: 0.97 }} onClick={startEmpty} disabled={loading}
          className="w-full rounded-2xl p-4 flex items-center justify-between"
          style={{ background: `linear-gradient(135deg, ${theme.primary}, #FF8FA3)` }}>
          <div className="text-left">
            <p className="font-extrabold text-lg text-white">Empezar ahora</p>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>
              Entreno libre sin plantilla
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.2)' }}>
            <Play size={22} color="#fff" />
          </div>
        </motion.button>

        {/* Stats Bento unificado */}
        <div className="rounded-2xl p-3 grid grid-cols-4 gap-0"
          style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>
          {[
            { emoji: '⚡', label: 'Sesiones', value: stats?.total_sessions ?? '–',                          color: '#EAB308' },
            { emoji: '📦', label: 'Volumen',  value: stats ? `${(stats.total_volume_kg/1000).toFixed(1)}t` : '–', color: '#6366F1' },
            { emoji: '🔥', label: 'Kcal',     value: stats?.total_calories ?? '–',                          color: '#F97316' },
          ].map((s, i) => (
            <div key={s.label} className="flex flex-col items-center py-2 col-span-1"
              style={{ borderRight: `1px solid ${theme.border}` }}>
              <span className="text-base mb-0.5">{s.emoji}</span>
              <p className="font-extrabold text-sm" style={{ color: theme.text }}>{s.value}</p>
              <p className="text-[10px] font-medium mt-0.5" style={{ color: theme.textMuted }}>{s.label}</p>
            </div>
          ))}
          <div className="flex flex-col items-center py-2 col-span-1">
            <span className="text-base mb-0.5">🔥</span>
            <p className="font-extrabold text-sm" style={{ color: '#F97316' }}>
              {profile?.streak || 0}
            </p>
            <p className="text-[10px] font-medium mt-0.5" style={{ color: theme.textMuted }}>Racha</p>
          </div>
        </div>

        {/* Último entreno — solo si existe */}
        {recentSession && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="rounded-2xl px-4 py-3 flex items-center gap-3"
            style={{ background: `${theme.primary}08`, border: `1px solid ${theme.primary}20` }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${theme.primary}15` }}>
              <Dumbbell size={15} style={{ color: theme.primary }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wide"
                style={{ color: theme.textMuted }}>Último entreno</p>
              <p className="font-bold text-sm truncate" style={{ color: theme.text }}>
                {recentSession.name}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs font-semibold" style={{ color: theme.primary }}>
                {Math.round((recentSession.duration_seconds||0)/60)} min
              </p>
              <p className="text-[10px]" style={{ color: theme.textMuted }}>
                {recentSession.total_sets || 0} series
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* 4 — Tab bar refinada */}
      <div className="flex gap-1 rounded-2xl p-1 mb-5 overflow-x-auto"
        style={{ background: theme.surface2 }}>
        {TABS.map(t => {
          const active = tab === t.id
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl transition-all flex-shrink-0"
              style={{
                minWidth: 56,
                background: active ? `${theme.primary}18` : 'transparent',
                border:     active ? `1px solid ${theme.primary}30` : '1px solid transparent',
              }}>
              <t.icon size={15} style={{ color: active ? theme.primary : theme.textMuted }} />
              <span className="text-[9px] font-bold"
                style={{ color: active ? theme.primary : theme.textMuted }}>
                {t.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* 5 — Contenido dinámico */}
      <AnimatePresence mode="wait">
        <motion.div key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}>
          {tab === 'dashboard' && <WorkoutDashboard onStartSession={setActiveSession} hideQuickStart />}
          {tab === 'favorites' && <FavoriteRoutinesList onStartSession={setActiveSession} />}
          {tab === 'generate'  && <RoutineGenerator onStartSession={setActiveSession} />}
          {tab === 'library'   && <ExerciseLibrary />}
          {tab === 'progress'  && <ExerciseProgressList />}
          {tab === 'history'   && <WorkoutHistory />}
          {tab === 'stats'     && <WorkoutStats />}
        </motion.div>
      </AnimatePresence>

      <PandiTips section="workout" />
    </div>
  )
}
