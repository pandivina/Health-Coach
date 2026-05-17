import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Play, Zap, Clock, Flame, TrendingUp } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { api } from '../../lib/api'
import { useStore } from '../../store/useStore'

export default function WorkoutDashboard({ onStartSession }) {
  const { user } = useStore()
  const [templates, setTemplates] = useState([])
  const [recentSession, setRecentSession] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase.from('workout_templates').select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false }).limit(5)
      .then(({ data }) => setTemplates(data || []))
    supabase.from('workout_sessions').select('*').eq('user_id', user.id)
      .eq('status', 'completed').order('created_at', { ascending: false }).limit(1)
      .then(({ data }) => setRecentSession(data?.[0] || null))
    api.workouts.stats().then(setStats).catch(() => {})
  }, [user])

  async function startFromTemplate(template) {
    setLoading(true)
    try {
      const result = await api.workouts.start({
        name: template.name,
        template_id: template.id,
        exercises: template.exercises || [],
      })
      onStartSession(result)
    } catch (err) {
      alert('Error iniciando entreno: ' + err.message)
    } finally { setLoading(false) }
  }

  async function startEmpty() {
    setLoading(true)
    try {
      const result = await api.workouts.start({ name: 'Entreno libre', exercises: [] })
      onStartSession(result)
    } catch (err) { alert('Error: ' + err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-5">
      {/* Stats rápidas */}
      {stats && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Zap, label: 'Sesiones', value: stats.total_sessions, color: 'text-yellow-400' },
            { icon: TrendingUp, label: 'Volumen', value: `${(stats.total_volume_kg/1000).toFixed(1)}t`, color: 'text-indigo-400' },
            { icon: Flame, label: 'Kcal', value: stats.total_calories, color: 'text-orange-400' },
          ].map(s => (
            <div key={s.label} className="card text-center py-3">
              <s.icon size={16} className={`${s.color} mx-auto mb-1`} />
              <p className="font-bold text-sm">{s.value}</p>
              <p className="text-white/30 text-[10px]">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Último entreno */}
      {recentSession && (
        <div className="card bg-gradient-to-r from-indigo-500/10 to-purple-500/5 border-indigo-500/20">
          <p className="text-white/40 text-xs mb-1">Último entreno</p>
          <p className="font-semibold">{recentSession.name}</p>
          <div className="flex gap-3 mt-1 text-white/40 text-xs">
            <span className="flex items-center gap-1"><Clock size={10} /> {Math.round((recentSession.duration_seconds||0)/60)} min</span>
            <span>💪 {recentSession.total_sets} series</span>
            <span>📦 {recentSession.total_volume_kg} kg</span>
          </div>
        </div>
      )}

      {/* Botón entreno libre */}
      <motion.button whileTap={{ scale: 0.97 }} onClick={startEmpty} disabled={loading}
        className="w-full bg-gradient-brand rounded-2xl p-4 flex items-center justify-between">
        <div className="text-left">
          <p className="font-bold text-lg">Empezar ahora</p>
          <p className="text-white/70 text-sm">Entreno libre sin plantilla</p>
        </div>
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
          <Play size={22} className="text-white" />
        </div>
      </motion.button>

      {/* Plantillas */}
      {templates.length > 0 && (
        <>
          <p className="section-title">Mis rutinas</p>
          <div className="space-y-2">
            {templates.map(t => (
              <motion.div key={t.id} whileTap={{ scale: 0.98 }}
                className="card flex items-center justify-between cursor-pointer active:bg-surface-3"
                onClick={() => startFromTemplate(t)}>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{t.name}</p>
                    {t.is_ai_generated && <span className="text-[10px] bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded-full">IA</span>}
                  </div>
                  <p className="text-white/40 text-xs mt-0.5">
                    {t.estimated_duration} min · {t.difficulty} · {(t.exercises||[]).length} ejercicios
                  </p>
                </div>
                <Play size={16} className="text-accent flex-shrink-0" />
              </motion.div>
            ))}
          </div>
        </>
      )}

      {templates.length === 0 && (
        <div className="text-center py-6 text-white/30">
          <p className="text-3xl mb-2">🤖</p>
          <p className="text-sm">Usa la pestaña IA para generar tu primera rutina</p>
        </div>
      )}
    </div>
  )
}
