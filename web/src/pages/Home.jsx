import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/useStore'
import { useTheme } from '../contexts/ThemeProvider'
import { supabase } from '../lib/supabase'
import { useTour } from '../hooks/useTour'
import TourHelpButton from '../components/tour/TourHelpButton'
import WeeklySummary from '../components/WeeklySummary'
import PandiInsights from '../components/PandiInsights'
import PandiTips from '../components/PandiTips'
import { ChevronRight, Plus, Minus as MinusIcon, Droplets } from 'lucide-react'

const PET_EMOJI = { panda:'🐼', cat:'🐱', dog:'🐶', fox:'🦊', rabbit:'🐰' }

// ─── MODULE CARD ──────────────────────────────────────────────────────────────
function ModuleCard({ to, icon, label, value, sublabel, color, done, theme }) {
  return (
    <Link to={to}>
      <motion.div whileTap={{ scale: 0.96 }}
        className="rounded-2xl p-3 flex flex-col gap-2 transition-all"
        style={{
          background: done ? `${color}12` : theme.surface,
          border: `1.5px solid ${done ? color + '40' : theme.border}`,
        }}>
        <div className="flex items-center justify-between">
          <span style={{ fontSize: 22 }}>{icon}</span>
          {done && (
            <div className="w-4 h-4 rounded-full flex items-center justify-center"
              style={{ background: color }}>
              <span style={{ fontSize: 8, color: '#fff' }}>✓</span>
            </div>
          )}
        </div>
        <div>
          <p className="font-extrabold text-sm leading-none" style={{ color: done ? color : theme.text }}>
            {value}
          </p>
          {sublabel && (
            <p className="text-[10px] mt-1 leading-tight" style={{ color: theme.textMuted }}>
              {sublabel}
            </p>
          )}
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: theme.textLight }}>
          {label}
        </p>
      </motion.div>
    </Link>
  )
}

// ─── MORNING CARD ─────────────────────────────────────────────────────────────
const MORNING_STEPS = [
  { emoji: '💧', text: 'Bebe un vaso de agua al levantarte' },
  { emoji: '🌤️', text: 'Abre las persianas — la luz regula tu ritmo circadiano' },
  { emoji: '🧘', text: '5 respiraciones profundas antes de mirar el móvil' },
  { emoji: '🍳', text: 'Desayuno con proteína — empieza el día con energía' },
]

function MorningCard({ petEmoji, theme }) {
  const { addXP } = useStore()
  const [dismissed, setDismissed] = useState(false)
  const todayKey = `pandi_morning_${new Date().toISOString().split('T')[0]}`
  const [checked, setChecked] = useState(() => {
    const saved = localStorage.getItem(todayKey)
    return saved ? JSON.parse(saved) : {}
  })

  if (dismissed) return null

  async function toggle(i) {
    if (checked[i]) return
    const next = { ...checked, [i]: true }
    setChecked(next)
    localStorage.setItem(todayKey, JSON.stringify(next))
    await addXP(5)
  }

  const doneCount = Object.keys(checked).length

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }} className="card mb-4"
        style={{ background: 'linear-gradient(135deg,#f0fffe,#fff5f7)', border:'1px solid rgba(46,196,182,0.2)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <motion.span animate={{ rotate: [0,10,-10,10,0] }}
              transition={{ duration:1.5, repeat:Infinity, repeatDelay:3 }}
              style={{ fontSize: 26 }}>{petEmoji}</motion.span>
            <div>
              <p className="font-extrabold text-sm" style={{ color:'#1F2937' }}>¡Buenos días! 🌅</p>
              <p className="text-xs" style={{ color:'#6B7280' }}>
                {doneCount}/{MORNING_STEPS.length} · +{doneCount * 5} XP ganados
              </p>
            </div>
          </div>
          <button onClick={() => setDismissed(true)}
            className="text-xs px-2 py-1 rounded-lg"
            style={{ color:'#9CA3AF', background:'rgba(0,0,0,0.04)' }}>✕</button>
        </div>
        <div className="space-y-2">
          {MORNING_STEPS.map((s, i) => (
            <motion.button key={i} onClick={() => toggle(i)}
              whileTap={!checked[i] ? { scale: 0.97 } : {}}
              className="w-full flex items-center gap-3 px-2 py-2 rounded-xl text-left transition-all"
              style={{ background: checked[i] ? 'rgba(46,196,182,0.1)' : 'rgba(255,255,255,0.7)' }}>
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: checked[i] ? '#2EC4B6' : 'rgba(0,0,0,0.06)',
                  border: checked[i] ? 'none' : '1.5px solid rgba(0,0,0,0.12)',
                }}>
                {checked[i] && <span style={{ fontSize: 10, color:'#fff' }}>✓</span>}
              </div>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{s.emoji}</span>
              <p className="text-xs font-medium flex-1"
                style={{
                  color: checked[i] ? '#2EC4B6' : '#374151',
                  textDecoration: checked[i] ? 'line-through' : 'none',
                  opacity: checked[i] ? 0.7 : 1,
                }}>{s.text}</p>
              {!checked[i] && (
                <span className="text-[10px] font-bold flex-shrink-0" style={{ color:'#9CA3AF' }}>+5 XP</span>
              )}
            </motion.button>
          ))}
        </div>
        {doneCount === MORNING_STEPS.length && (
          <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }}
            className="text-xs text-center mt-3 font-semibold" style={{ color:'#2EC4B6' }}>
            🎉 ¡Rutina matutina completada! +{doneCount * 5} XP
          </motion.p>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

// ─── PANDI GREETING ──────────────────────────────────────────────────────────
function PandiGreeting({ profile, theme, todayData }) {
  const hour    = new Date().getHours()
  const name    = profile?.name?.split(' ')[0] || ''
  const petName = profile?.pet_name || 'Pandi'
  const [imgErr, setImgErr] = useState(false)
  const [msgIdx, setMsgIdx] = useState(0)

  const priorities = []
  if (!todayData?.hasMood)     priorities.push({ text: `¿Cómo estás hoy, ${name}? Cuéntamelo 🧘`, to: '/mood',      color: '#2EC4B6' })
  if (!todayData?.hasMeals)    priorities.push({ text: 'Registra tu primera comida del día 🍎',      to: '/nutrition', color: '#F97316' })
  if (!todayData?.hasWater)    priorities.push({ text: 'No te olvides del agua hoy 💧',              to: '/hydration', color: '#3B82F6' })
  if (!todayData?.hasSleep)    priorities.push({ text: '¿Cómo dormiste anoche? Registra tu sueño 😴', to: '/sleep',     color: '#818CF8' })
  if (!todayData?.hasWorkout)  priorities.push({ text: '¿Toca entrenar hoy? ¡Vamos! 💪',              to: '/workout',   color: '#6366F1' })

  const greetings = [
    hour < 12 ? `¡Buenos días, ${name}! 🌅 ¿Lista para hoy?` : hour < 20 ? `¡Buenas tardes, ${name}! ¿Qué tal va?` : `¡Buenas noches, ${name}! 🌙`,
    `Estoy aquí para ayudarte, ${name} 🐼`,
  ]

  const messages = priorities.length > 0 ? priorities.slice(0, 3) : greetings.map(t => ({ text: t, to: '/pet', color: theme.primary }))

  useEffect(() => {
    if (messages.length <= 1) return
    const t = setInterval(() => setMsgIdx(i => (i + 1) % messages.length), 10000)
    return () => clearInterval(t)
  }, [messages.length])

  const current = messages[msgIdx]

  return (
    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
      className="flex items-end gap-3 mb-4">
      <Link to="/pet" className="flex-shrink-0">
        <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
          {imgErr ? (
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
              style={{ background: theme.surface2 }}>🐼</div>
          ) : (
            <img src="/panda/talk_1.png" alt={petName} onError={() => setImgErr(true)}
              style={{ width: 110, height: 110, objectFit: 'contain' }} />
          )}
        </motion.div>
      </Link>

      <div className="flex-1 relative">
        <div style={{
          position: 'absolute', left: -8, bottom: 12, width: 0, height: 0,
          borderTop: '8px solid transparent', borderBottom: '8px solid transparent',
          borderRight: `8px solid ${theme.surface}`,
        }} />
        <AnimatePresence mode="wait">
          <motion.div key={msgIdx} initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }} transition={{ duration: 0.25 }}
            className="rounded-2xl rounded-bl-sm p-3"
            style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>
            <p className="text-[10px] font-bold mb-0.5" style={{ color: current.color }}>
              {petName}
            </p>
            <p className="text-xs leading-relaxed" style={{ color: theme.text }}>
              {current.text}
            </p>
            {messages.length > 1 && (
              <div className="flex gap-1 mt-2">
                {messages.map((_, i) => (
                  <div key={i} style={{
                    width: i === msgIdx ? 12 : 4, height: 4, borderRadius: 2,
                    background: i === msgIdx ? current.color : theme.surface2,
                    transition: 'all 0.3s',
                  }} />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// ─── WATER WIDGET ─────────────────────────────────────────────────────────────
function WaterWidget({ userId, theme }) {
  const [glasses, setGlasses] = useState(0)
  const [goal,    setGoal]    = useState(8)
  const [loading, setLoading] = useState(false)
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (!userId) return
    supabase.from('hydration_logs').select('glasses,goal')
      .eq('user_id', userId).eq('date', today).maybeSingle()
      .then(({ data }) => {
        if (data) { setGlasses(data.glasses || 0); setGoal(data.goal || 8) }
      })
  }, [userId])

  async function update(delta) {
    const next = Math.max(0, Math.min(glasses + delta, goal + 4))
    setGlasses(next); setLoading(true)
    await supabase.from('hydration_logs').upsert(
      { user_id: userId, date: today, glasses: next, goal },
      { onConflict: 'user_id,date' }
    )
    setLoading(false)
  }

  const pct  = Math.min(glasses / goal, 1)
  const done = glasses >= goal

  return (
    <div className="card mb-4" data-tour="home-water">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#EFF6FF' }}>
            <Droplets size={16} style={{ color: '#3B82F6' }} />
          </div>
          <div>
            <p className="font-bold text-sm" style={{ color: theme.text }}>Hidratación</p>
            <p className="text-xs" style={{ color: theme.textMuted }}>{glasses * 250} ml · {glasses}/{goal} vasos</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {done && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: '#DBEAFE', color: '#1D4ED8' }}>¡Meta! 🎉</motion.span>
          )}
          <button onClick={() => update(-1)} disabled={glasses === 0 || loading}
            className="w-8 h-8 rounded-xl flex items-center justify-center disabled:opacity-30"
            style={{ background: theme.surface2 }}>
            <MinusIcon size={14} style={{ color: theme.textMuted }} />
          </button>
          <p className="font-extrabold text-lg w-6 text-center" style={{ color: '#3B82F6' }}>{glasses}</p>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => update(1)} disabled={loading}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: '#3B82F6' }}>
            <Plus size={14} color="#fff" />
          </motion.button>
        </div>
      </div>
      <div className="flex gap-1 mb-2">
        {Array.from({ length: goal }).map((_, i) => (
          <motion.button key={i} whileTap={{ scale: 0.85 }}
            onClick={() => update(i < glasses ? -(glasses - i) : i + 1 - glasses)}
            style={{
              flex: 1, height: 24, borderRadius: 6,
              background: i < glasses ? 'linear-gradient(180deg,#60A5FA,#3B82F6)' : theme.surface2
