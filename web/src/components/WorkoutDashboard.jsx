import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Play, Zap, Clock, Flame, TrendingUp, ChevronRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { api } from '../../lib/api'
import { useStore } from '../../store/useStore'
import { useTheme } from '../../contexts/ThemeProvider'

export default function WorkoutDashboard({ onStartSession, hideQuickStart }) {
  const { user, profile } = useStore()
  const { theme } = useTheme()
  const [templates,     setTemplates]     = useState([])
  const [recentSession, setRecentSession] = useState(null)
  const [stats,         setStats]         = useState(null)
  const [loading,       setLoading]       = useState(false)

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
    <div className="space-y-4">

      {/* Botón empezar — solo si no está en el padre */}
      {!hideQuickStart && (
        <motion.button whileTap={{ scale: 0.97 }} onClick={startEmpty} disabled={loading}
          className="w-full rounded-2xl p-4 flex items-center justify-between"
          style={{ background: `linear-gradient(135deg, ${theme.primary}, #FF8FA3)` }}>
          <div className="text-left">
            <p className="font-extrabold text-lg text-white">Empezar ahora</p>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>Entreno libre sin plantilla</p>
          </div>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.2)' }}>
            <Play size={22} color="#fff" />
          </div>
        </motion.button>
      )}

      {/* Racha — solo si no está en el padre */}
      {!hideQuickStart && (
        <div className="card flex items-center gap-3" style={{ background: theme.surface2 }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: '#FEF3C7' }}>🔥</div>
          <div className="flex-1">
            <p className="font-bold text-sm" style={{ color: theme.text }}>
              Racha actual: {profile?.streak || 0} días
            </p>
            <p className="text-xs" style={{ color: theme.textMuted }}>
              {profile?.streak >= 7 ? '¡Una semana seguida! Eres increíble 💪'
                : profile?.streak >= 3 ? '¡Vas muy bien! No lo dejes ahora 🚀'
                : 'Empieza tu racha entrenando hoy 🎯'}
            </p>
          </div>
          <span className="font-extrabold text-xl" style={{ color: '#F97316' }}>
            {profile?.streak || 0}
          </span>
        </div>
      )}

      {/* Plantillas */}
      {templates.length > 0 && (
        <>
          <p className="text-xs font-bold uppercase tracking-wider"
            style={{ color: theme.textMuted }}>Mis rutinas</p>
          <div className="space-y-2">
            {templates.map(t => (
              <motion.div key={t.id} whileTap={{ scale: 0.98 }}
                className="card flex items-center justify-between cursor-pointer"
                style={{ border: `1px solid ${theme.border}` }}
                onClick={() => startFromTemplate(t)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm truncate" style={{ color: theme.text }}>
                      {t.name}
                    </p>
                    {t.is_ai_generated && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: `${theme.primary}20`, color: theme.primary }}>IA</span>
                    )}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>
                    {t.estimated_duration} min · {t.difficulty} · {(t.exercises||[]).length} ejercicios
                  </p>
                </div>
                <ChevronRight size={16} style={{ color: theme.textMuted, flexShrink: 0 }} />
              </motion.div>
            ))}
          </div>
        </>
      )}

      {/* Estado vacío */}
      {templates.length === 0 && (
        <div className="card text-center py-8"
          style={{ background: `${theme.primary}05`, border: `1px dashed ${theme.border}` }}>
          <motion.div animate={{ y: [0, -6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
            <img src="/panda/talk_1.png" alt="Pandi"
              style={{ width: 64, height: 64, objectFit: 'contain', margin: '0 auto 12px' }}
              onError={e => { e.target.style.display='none' }} />
          </motion.div>
          <p className="font-bold text-sm mb-1" style={{ color: theme.text }}>
            ¡Crea tu primera rutina!
          </p>
          <p className="text-xs" style={{ color: theme.textMuted }}>
            Usa la pestaña IA para generar una rutina personalizada en segundos
          </p>
        </div>
      )}
    </div>
  )
}
