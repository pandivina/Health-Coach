import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Droplets, Plus, Minus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useStore } from '../store/useStore'
import { useTheme } from '../contexts/ThemeProvider'
import PandiContextualBubble from '../components/PandiContextualBubble'
import PandiTips from '../components/PandiTips'

export default function Hydration() {
  const { user, addXP } = useStore()
  const { theme } = useTheme()
  const [glasses, setGlasses] = useState(0)
  const [goal, setGoal] = useState(8)
  const today = new Date().toISOString().split('T')[0]

  async function load() {
    const { data } = await supabase.from('hydration_logs').select('*').eq('user_id', user.id).eq('date', today).single()
    if (data) { setGlasses(data.glasses); setGoal(data.goal) }
  }
  useEffect(() => { if (user) load() }, [user])

  async function update(val) {
    const v = Math.max(0, val)
    setGlasses(v)
    await supabase.from('hydration_logs').upsert({ user_id: user.id, date: today, glasses: v, goal }, { onConflict: 'user_id,date' })
    if (v === goal) addXP(20)
  }

  const pct = Math.min((glasses / goal) * 100, 100)

  return (
    <div className="page flex flex-col items-center">
      <PandiContextualBubble section="hydration" data={{ glasses: 0, goal: 8 }} />
      <h1 className="text-2xl font-extrabold mb-6 self-start" style={{ color: theme.text }}>Hidratación 💧</h1>

      {/* Ring */}
      <div className="relative w-48 h-48 mb-6">
        <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
          <circle cx="100" cy="100" r="80" fill="none" stroke={`${theme.primary}20`} strokeWidth="16" />
          <motion.circle cx="100" cy="100" r="80" fill="none" stroke={theme.primary} strokeWidth="16"
            strokeLinecap="round" strokeDasharray={2 * Math.PI * 80}
            initial={{ strokeDashoffset: 2 * Math.PI * 80 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 80 * (1 - pct / 100) }}
            transition={{ duration: 0.5 }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Droplets size={24} style={{ color: theme.primary }} className="mb-1" />
          <p className="text-4xl font-extrabold" style={{ color: theme.text }}>{glasses}</p>
          <p className="text-sm" style={{ color: theme.textMuted }}>de {goal} vasos</p>
        </div>
      </div>

      {glasses >= goal ? (
        <motion.p initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          className="font-bold mb-6" style={{ color: theme.success }}>
          🎉 ¡Meta de hidratación alcanzada!
        </motion.p>
      ) : (
        <p className="mb-6" style={{ color: theme.textMuted }}>{goal - glasses} vaso{goal - glasses !== 1 ? 's' : ''} más para tu meta</p>
      )}

      <div className="flex items-center gap-6 mb-8">
        <button onClick={() => update(glasses - 1)}
          className="w-14 h-14 rounded-2xl flex items-center justify-center active:scale-90 transition-all"
          style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>
          <Minus size={20} style={{ color: theme.text }} />
        </button>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => update(glasses + 1)}
          className="w-20 h-20 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-lg"
          style={{ background: theme.gradientBrand }}>
          <Plus size={24} color="#fff" />
          <span className="text-white text-xs font-semibold">+1 vaso</span>
        </motion.button>
        <div className="w-14" />
      </div>

      <div className="w-full card">
        <label className="label">Meta diaria (vasos)</label>
        <div className="flex gap-2">
          {[6,7,8,10,12].map(g => (
            <button key={g} onClick={() => setGoal(g)}
              className="flex-1 py-2 rounded-xl border text-sm transition-all"
              style={{
                borderColor: goal === g ? theme.primary : theme.border,
                background: goal === g ? `${theme.primary}15` : theme.surface2,
                color: goal === g ? theme.primary : theme.textMuted,
              }}>{g}</button>
          ))}
        </div>
      </div>
    </div>
  )
}
