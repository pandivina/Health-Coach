import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Play, Zap, Clock, Flame, TrendingUp } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { api } from '../../lib/api'
import { useStore } from '../../store/useStore'
import { useTheme } from '../../contexts/ThemeProvider'

export default function WorkoutDashboard({ onStartSession }) {
  const { user }  = useStore()
  const { theme } = useTheme()
  const [templates,      setTemplates]      = useState([])
  const [recentSession,  setRecentSession]  = useState(null)
  const [stats,          setStats]          = useState(null)
  const [loading,        setLoading]        = useState(false)

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
    } catch (err) { alert('Error iniciando entreno: ' + err.message) }
    finally { setLoading(false) }
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
            { icon: Zap,        label: 'Sesiones', value: stats.total_sessions,                            color: '#EAB308' },
            { icon: TrendingUp, label: 'Volumen',  value: `${(stats.total_volume_kg/1000).toFixed(1)}t`,  color: '#6366F1' },
            { icon: Flame,      label: 'Kcal',     value: stats.total_calories,                           color: '#F97316' },
          ].map(s => (
            <div key={s.label} className="card text-center py-3">
              <s.icon size={16} style={{ color: s.color }} className="mx-auto mb-1" />
              <p className="font-bold text-sm" style={{ color: theme.text }}>{s.value}</p>
              <p className="text-[10px]" style={{ color: theme.text }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Último entreno */}
      {recentSession && (
        <div className="card" style={{
          background: `${theme.primary}10`,
          border: `1px solid ${theme.primary}20`,
        }}>
          <p className="text-xs mb-1" style={{ color: theme.textMuted }}>Último entreno</p>
          <p className="font-semibold" style={{ color: theme.text }}>{recentSession.name}</p>
          <div className="flex gap-3 mt-1 text-xs" style={{ color: theme.textMuted }}>
            <span className="flex items-center gap-1">
              <Clock size={10} /> {Math.round((recentSession.duration_seconds||0)/60)} min
            </span>
            <span>💪 {recentSession.total_sets} series</span>
            <span>📦 {recentSession.total_volume_kg} kg</span>
          </div>
        </div>
      )}

      {/* Botón entreno libre */}
      <motion.button whileTap={{ scale: 0.97 }} onClick={startEmpty} disabled={loading}
        className="w-full rounded-2xl p-4 flex items-center justify-between disabled:opacity-50"
        style={{ background: `linear-gradient(135deg, ${theme.primary}, #FF8FA3)` }}>
        <div className="text-left">
          <p className="font-bold text-lg text-white">Empezar ahora</p>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>Entreno libre sin plantilla</p>
        </div>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.2)' }}>
          <Play size={22} color="#fff" />
        </div>
      </motion.button>

      {/* Plantillas */}
      {templates.length > 0 && (
        <>
          <p className="section-title">Mis rutinas</p>
          <div className="space-y-2">
            {templates.map(t => (
              <motion.div key={t.id} whileTap={{ scale: 0.98 }}
                className="card flex items-center justify-between cursor-pointer"
                style={{ background: theme.surface, border: `1px solid ${theme.border}` }}
                onClick={() => startFromTemplate(t)}>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold" style={{ color: theme.text }}>{t.name}</p>
                    {t.is_ai_generated && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: `${theme.primary}20`, color: theme.primary }}>
                        IA
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: theme.text }}>
                    {t.estimated_duration} min · {t.difficulty} · {(t.exercises||[]).length} ejercicios
                  </p>
                </div>
                <Play size={16} style={{ color: theme.primary, flexShrink: 0 }} />
              </motion.div>
            ))}
          </div>
        </>
      )}

      {templates.length === 0 && (
        <div className="text-center py-6">
          <p className="text-3xl mb-2">🤖</p>
          <p className="text-sm" style={{ color: theme.text }}>
            Usa la pestaña IA para generar tu primera rutina
          </p>
        </div>
      )}
    </div>
  )
}
