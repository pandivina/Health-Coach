import { useState } from 'react'
import { motion } from 'framer-motion'
import { Dumbbell, Sparkles, History, BarChart2, Plus } from 'lucide-react'
import WorkoutDashboard from '../components/workout/WorkoutDashboard'
import LiveWorkoutScreen from '../components/workout/LiveWorkoutScreen'
import { RoutineGenerator, ExerciseLibrary, WorkoutHistory, WorkoutStats } from '../components/workout/WorkoutComponents'

const TABS = [
  { id: 'dashboard', icon: Dumbbell,  label: 'Inicio' },
  { id: 'generate',  icon: Sparkles,  label: 'IA' },
  { id: 'library',   icon: Plus,      label: 'Ejercicios' },
  { id: 'history',   icon: History,   label: 'Historial' },
  { id: 'stats',     icon: BarChart2, label: 'Stats' },
]

export default function Workout() {
  const [tab, setTab] = useState('dashboard')
  const [activeSession, setActiveSession] = useState(null)

  if (activeSession) {
    return <LiveWorkoutScreen session={activeSession} onFinish={() => setActiveSession(null)} />
  }

  return (
    <div className="page pb-32">
      <h1 className="text-2xl font-extrabold mb-4">Entreno 💪</h1>

      <div className="flex gap-1 bg-surface-2 rounded-2xl p-1 mb-5">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl transition-all ${
              tab === t.id ? 'bg-accent text-white' : 'text-white/40'
            }`}>
            <t.icon size={16} />
            <span className="text-[9px] font-medium">{t.label}</span>
          </button>
        ))}
      </div>

      <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        {tab === 'dashboard' && <WorkoutDashboard onStartSession={setActiveSession} />}
        {tab === 'generate'  && <RoutineGenerator onStartSession={setActiveSession} />}
        {tab === 'library'   && <ExerciseLibrary />}
        {tab === 'history'   && <WorkoutHistory />}
        {tab === 'stats'     && <WorkoutStats />}
      </motion.div>
    </div>
  )
}
