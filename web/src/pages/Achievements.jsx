import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Star, Zap, Lock } from 'lucide-react'
import { api } from '../lib/api'
import { useStore } from '../store/useStore'
import { useTheme } from '../contexts/ThemeProvider'

const CATEGORIES = [
  { id: 'all',        label: 'Todos',        emoji: '🏆' },
  { id: 'nutrition',  label: 'Nutrición',    emoji: '🥗' },
  { id: 'workout',    label: 'Entreno',      emoji: '💪' },
  { id: 'sleep',      label: 'Sueño',        emoji: '🌙' },
  { id: 'hydration',  label: 'Hidratación',  emoji: '💧' },
  { id: 'health',     label: 'Salud',        emoji: '⚕️'  },
  { id: 'streak',     label: 'Racha',        emoji: '🔥' },
  { id: 'smoking',    label: 'Antitabaco',   emoji: '🚭' },
]

const ALL_ACHIEVEMENTS = [
  { id: 'first_meal',       title: 'Primera comida',        icon: '🍎', description: 'Registraste tu primera comida',            xp: 50,   category: 'nutrition', rarity: 'common'    },
  { id: 'calorie_goal',     title: 'Objetivo calórico',     icon: '🎯', description: 'Alcanzaste tu objetivo calórico del día',   xp: 30,   category: 'nutrition', rarity: 'common'    },
  { id: 'protein_goal',     title: 'Rey de la proteína',    icon: '💪', description: 'Alcanzaste tu objetivo de proteína',        xp: 30,   category: 'nutrition', rarity: 'common'    },
  { id: 'week_nutrition',   title: 'Semana perfecta',       icon: '📅', description: 'Registraste comidas 7 días seguidos',       xp: 100,  category: 'nutrition', rarity: 'rare'      },
  { id: 'photo_analysis',   title: 'Fotógrafo nutricional', icon: '📸', description: 'Analizaste una comida con la cámara',       xp: 25,   category: 'nutrition', rarity: 'common'    },
  { id: 'first_workout',    title: 'Primer entreno',        icon: '🏋️', description: 'Completaste tu primer entrenamiento',       xp: 75,   category: 'workout',   rarity: 'common'    },
  { id: 'workout_streak_3', title: 'Racha de 3',            icon: '🔥', description: 'Entrena 3 días consecutivos',               xp: 100,  category: 'workout',   rarity: 'rare'      },
  { id: 'workout_streak_7', title: 'Semana activa',         icon: '⚡', description: 'Entrena 7 días consecutivos',               xp: 200,  category: 'workout',   rarity: 'epic'      },
  { id: 'first_pr',         title: 'Nuevo récord',          icon: '🏆', description: 'Batiste tu primer récord personal',         xp: 150,  category: 'workout',   rarity: 'rare'      },
  { id: '10_workouts',      title: 'Veterano',              icon: '🎖️', description: 'Completaste 10 entrenamientos',             xp: 200,  category: 'workout',   rarity: 'epic'      },
  { id: 'first_sleep',      title: 'Dulces sueños',         icon: '🌙', description: 'Registraste tu primera noche de sueño',    xp: 20,   category: 'sleep',     rarity: 'common'    },
  { id: 'sleep_goal',       title: 'Descanso perfecto',     icon: '⭐', description: 'Dormiste 7+ horas con calidad 4+',          xp: 50,   category: 'sleep',     rarity: 'rare'      },
  { id: 'sleep_week',       title: 'Buen dormidor',         icon: '💤', description: 'Registraste sueño 7 días seguidos',         xp: 100,  category: 'sleep',     rarity: 'rare'      },
  { id: 'hydration_goal',   title: 'Bien hidratado',        icon: '💧', description: 'Alcanzaste tu meta de hidratación',         xp: 20,   category: 'hydration', rarity: 'common'    },
  { id: 'hydration_week',   title: 'Acuático',              icon: '🌊', description: 'Meta de hidratación 7 días seguidos',       xp: 100,  category: 'hydration', rarity: 'rare'      },
  { id: 'first_weight',     title: 'Primer pesaje',         icon: '⚖️', description: 'Registraste tu primer peso',                xp: 25,   category: 'health',    rarity: 'common'    },
  { id: 'weight_loss_1',    title: 'Primer kilo',           icon: '📉', description: 'Perdiste tu primer kilo',                   xp: 150,  category: 'health',    rarity: 'rare'      },
  { id: 'first_lab',        title: 'Analítica subida',      icon: '🔬', description: 'Subiste tu primera analítica',              xp: 100,  category: 'health',    rarity: 'rare'      },
  { id: 'streak_7',         title: 'Una semana',            icon: '📆', description: '7 días consecutivos usando la app',         xp: 150,  category: 'streak',    rarity: 'rare'      },
  { id: 'streak_30',        title: 'Un mes',                icon: '🌟', description: '30 días consecutivos usando la app',        xp: 500,  category: 'streak',    rarity: 'legendary' },
  { id: 'no_smoking_1',     title: 'Un día sin fumar',      icon: '🚭', description: 'Primer día sin fumar',                     xp: 100,  category: 'smoking',   rarity: 'common'    },
  { id: 'no_smoking_7',     title: 'Una semana libre',      icon: '🌿', description: 'Una semana sin fumar',                     xp: 300,  category: 'smoking',   rarity: 'epic'      },
  { id: 'no_smoking_30',    title: 'Un mes libre',          icon: '🏅', description: 'Un mes sin fumar',                         xp: 1000, category: 'smoking',   rarity: 'legendary' },
]

const RARITY_COLORS = {
  common:    { bg: '#F3F4F6', border: '#E5E7EB',  color: '#6B7280',  label: 'Común'     },
  rare:      { bg: '#EFF6FF', border: '#BFDBFE',  color: '#3B82F6',  label: 'Raro'      },
  epic:      { bg: '#F5F3FF', border: '#C4B5FD',  color: '#8B5CF6',  label: 'Épico'     },
  legendary: { bg: '#FFFBEB', border: '#FDE68A',  color: '#F59E0B',  label: 'Legendario'},
}

const MONTHLY_CHALLENGES_DEF = [
  { id: 'nutrition_30',  title: 'Nutrición constante',    emoji: '🥗', description: 'Registra comidas 20 días este mes',    target: 20, category: 'nutrition', xp: 200 },
  { id: 'workout_8',     title: 'Mes activo',             emoji: '💪', description: 'Completa 8 entrenamientos este mes',   target: 8,  category: 'workout',   xp: 250 },
  { id: 'sleep_20',      title: 'Buen descanso',          emoji: '😴', description: 'Registra sueño 20 noches este mes',   target: 20, category: 'sleep',     xp: 200 },
  { id: 'hydration_15',  title: 'Hidratación perfecta',   emoji: '💧', description: 'Alcanza la meta de agua 15 días',     target: 15, category: 'hydration', xp: 150 },
  { id: 'mood_15',       title: 'Bienestar continuo',     emoji: '🧘', description: 'Haz check-in emocional 15 días',     target: 15, category: 'wellness',  xp: 150 },
]

export default function Achievements() {
  const { profile }   = useStore()
  const { theme }     = useTheme()
  const [earned,      setEarned]      = useState([])
  const [challenges,  setChallenges]  = useState([])
  const [filter,      setFilter]      = useState('all')
  const [loading,     setLoading]     = useState(true)
  const [tab,         setTab]         = useState('logros') // logros | retos

  useEffect(() => {
    api.achievements.getAll()
      .then(data => {
        setEarned(data.earned || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))

    // Cargar retos del mes
    const { supabase } = require('../lib/supabase')
    const { useStore: getStore } = require('../store/useStore')
    // Simplificado — en producción usar supabase directamente
  }, [])

  const earnedTitles = new Set(earned.map(e => e.title))

  const filtered = filter === 'all'
    ? ALL_ACHIEVEMENTS
    : ALL_ACHIEVEMENTS.filter(a => a.category === filter)

  const earnedCount = ALL_ACHIEVEMENTS.filter(a => earnedTitles.has(a.title)).length
  const totalXP     = earned.reduce((s, e) => s + (ALL_ACHIEVEMENTS.find(a => a.title === e.title)?.xp || 0), 0)

  if (loading) return (
    <div className="page flex items-center justify-center py-20">
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: theme.primary }} />
    </div>
  )

  return (
    <div className="page">

      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold mb-1" style={{ color: theme.text }}>
          Logros y Retos 🏆
        </h1>
        <p className="text-xs" style={{ color: theme.textMuted }}>
          Tu progreso en Pandi Health Coach
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {[
          { icon: '🏆', val: `${earnedCount}/${ALL_ACHIEVEMENTS.length}`, label: 'Desbloqueados' },
          { icon: '⚡', val: `${totalXP}`, label: 'XP ganado'   },
          { icon: '📊', val: `${Math.round((earnedCount/ALL_ACHIEVEMENTS.length)*100)}%`, label: 'Completado' },
        ].map((s, i) => (
          <div key={i} className="card text-center py-3">
            <p className="text-xl mb-1">{s.icon}</p>
            <p className="font-extrabold text-sm" style={{ color: theme.primary }}>{s.val}</p>
            <p className="text-[10px]" style={{ color: theme.textMuted }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Pandi motivación */}
      <div className="card mb-4 flex items-center gap-3"
        style={{ background: `${theme.primary}08`, border: `1px solid ${theme.primary}20` }}>
        <img src="/panda/encourage_1.png" alt="Pandi"
          style={{ width: 44, height: 44, objectFit: 'contain', flexShrink: 0 }}
          onError={e => e.target.style.display='none'} />
        <p className="text-xs leading-relaxed" style={{ color: theme.text }}>
          {earnedCount === 0
            ? '¡Empieza a usar la app para desbloquear tus primeros logros! 🐼'
            : earnedCount < 5
              ? `¡Vas bien! Ya tienes ${earnedCount} logro${earnedCount>1?'s':''}. Sigue así 💪`
              : `¡Impresionante! ${earnedCount} logros desbloqueados. Eres una leyenda 🌟`
          }
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl mb-4" style={{ background: theme.surface2 }}>
        {[['logros','🏆 Logros'],['retos','⚔️ Retos del mes']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
            style={{
              background: tab === id ? theme.surface : 'transparent',
              color:      tab === id ? theme.primary : theme.textMuted,
              boxShadow:  tab === id ? '0 1px 6px rgba(0,0,0,0.08)' : 'none',
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── LOGROS ── */}
      {tab === 'logros' && (
        <>
          {/* Filtros categoría */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
            {CATEGORIES.map(c => (
              <button key={c.id} onClick={() => setFilter(c.id)}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={{
                  background: filter === c.id ? theme.primary : theme.surface2,
                  color:      filter === c.id ? '#fff' : theme.textMuted,
                }}>
                {c.emoji} {c.label}
              </button>
            ))}
          </div>

          {/* Grid logros */}
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((a, i) => {
              const isEarned = earnedTitles.has(a.title)
              const rarity   = RARITY_COLORS[a.rarity] || RARITY_COLORS.common
              const earnedAt = earned.find(e => e.title === a.title)?.earned_at

              return (
                <motion.div key={a.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="card relative overflow-hidden"
                  style={{
                    background: isEarned ? rarity.bg : theme.surface2,
                    border:     `2px solid ${isEarned ? rarity.border : 'transparent'}`,
                    opacity:    isEarned ? 1 : 0.6,
                  }}>

                  {/* Rarity badge */}
                  {isEarned && (
                    <div className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: `${rarity.color}20`, color: rarity.color }}>
                      {rarity.label}
                    </div>
                  )}

                  <div className="flex items-start gap-2">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ background: isEarned ? `${rarity.color}15` : theme.surface, filter: isEarned ? 'none' : 'grayscale(1)' }}>
                      {a.icon}
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="font-bold text-xs leading-tight" style={{ color: isEarned ? rarity.color : theme.textMuted }}>
                        {a.title}
                      </p>
                      <p className="text-[10px] mt-0.5 leading-tight" style={{ color: theme.textMuted }}>
                        {a.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2"
                    style={{ borderTop: `1px solid ${isEarned ? rarity.border : theme.border}` }}>
                    <span className="text-[10px] font-bold" style={{ color: isEarned ? rarity.color : theme.textMuted }}>
                      +{a.xp} XP
                    </span>
                    {isEarned ? (
                      <span className="text-[9px]" style={{ color: theme.textMuted }}>
                        {earnedAt ? new Date(earnedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : '✓'}
                      </span>
                    ) : (
                      <Lock size={10} style={{ color: theme.textLight }} />
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </>
      )}

      {/* ── RETOS DEL MES ── */}
      {tab === 'retos' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold" style={{ color: theme.textMuted }}>
              {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase()}
            </p>
            <span className="text-[10px] px-2 py-1 rounded-full font-semibold"
              style={{ background: `${theme.primary}15`, color: theme.primary }}>
              {MONTHLY_CHALLENGES_DEF.length} retos activos
            </span>
          </div>

          {MONTHLY_CHALLENGES_DEF.map((c, i) => {
            // Progreso simulado — en producción cargar de monthly_challenges
            const progress = Math.min(Math.floor(Math.random() * c.target), c.target)
            const pct      = Math.round((progress / c.target) * 100)
            const done     = progress >= c.target

            return (
              <motion.div key={c.id}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="card"
                style={{
                  background: done ? `${theme.success}10` : theme.surface,
                  border: `1px solid ${done ? theme.success + '40' : theme.border}`,
                }}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: done ? `${theme.success}20` : theme.surface2 }}>
                    {c.emoji}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="font-bold text-sm" style={{ color: done ? theme.success : theme.text }}>
                        {c.title}
                      </p>
                      {done && <span className="text-xs font-bold" style={{ color: theme.success }}>✓ Completado</span>}
                    </div>
                    <p className="text-xs mb-2" style={{ color: theme.textMuted }}>{c.description}</p>

                    {/* Barra progreso */}
                    <div className="h-2 rounded-full overflow-hidden mb-1" style={{ background: theme.surface2 }}>
                      <motion.div className="h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                        style={{ background: done ? theme.success : `linear-gradient(90deg, ${theme.primary}, #FF8FA3)` }} />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[10px]" style={{ color: theme.textMuted }}>
                        {progress}/{c.target}
                      </span>
                      <span className="text-[10px] font-bold" style={{ color: theme.primary }}>
                        +{c.xp} XP
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}

          <div className="card text-center py-6"
            style={{ background: `${theme.primary}05`, border: `1px dashed ${theme.border}` }}>
            <p className="text-2xl mb-2">🎯</p>
            <p className="text-sm font-semibold" style={{ color: theme.text }}>
              Nuevos retos cada mes
            </p>
            <p className="text-xs mt-1" style={{ color: theme.textMuted }}>
              Completa todos para desbloquear recompensas especiales
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
