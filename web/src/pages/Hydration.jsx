import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Droplets, Plus, Minus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useStore } from '../store/useStore'

export default function Hydration() {
  const { user, addXP } = useStore()
  const [glasses, setGlasses] = useState(0)
  const [goal, setGoal] = useState(8)
  const today = new Date().toISOString().split('T')[0]

  async function load() {
    const { data } = await supabase.from('hydration_logs').select('*').eq('user_id', user.id).eq('date', today).single()
    if (data) { setGlasses(data.glasses); setGoal(data.goal) }
  }
  useEffect(() => { if (user) load() }, [user])

  async function updateGlasses(newVal) {
    const val = Math.max(0, newVal)
    setGlasses(val)
    await supabase.from('hydration_logs').upsert({ user_id: user.id, date: today, glasses: val, goal }, { onConflict: 'user_id,date' })
    if (val === goal) addXP(20)
  }

  const pct = Math.min((glasses / goal) * 100, 100)
  const remaining = Math.max(goal - glasses, 0)

  return (
    <div className="page flex flex-col items-center">
      <h1 className="text-2xl font-extrabold mb-6 self-start">Hidratación 💧</h1>

      {/* Big visual */}
      <div className="relative w-48 h-48 mb-6">
        <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
          <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="16" />
          <motion.circle cx="100" cy="100" r="80" fill="none" stroke="#06b6d4" strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 80}
            initial={{ strokeDashoffset: 2 * Math.PI * 80 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 80 * (1 - pct / 100) }}
            transition={{ duration: 0.5 }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Droplets size={24} className="text-cyan-400 mb-1" />
          <p className="text-4xl font-extrabold">{glasses}</p>
          <p className="text-white/40 text-sm">de {goal} vasos</p>
        </div>
      </div>

      {glasses >= goal ? (
        <motion.p initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          className="text-accent-green font-bold mb-6">🎉 ¡Meta de hidratación alcanzada!</motion.p>
      ) : (
        <p className="text-white/50 mb-6">{remaining} vaso{remaining !== 1 ? 's' : ''} más para tu meta</p>
      )}

      {/* Controls */}
      <div className="flex items-center gap-6 mb-8">
        <button onClick={() => updateGlasses(glasses - 1)}
          className="w-14 h-14 rounded-2xl bg-surface-2 border border-white/10 flex items-center justify-center active:scale-90 transition-all">
          <Minus size={20} />
        </button>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => updateGlasses(glasses + 1)}
          className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex flex-col items-center justify-center gap-1 shadow-lg shadow-cyan-500/20">
          <Plus size={24} className="text-white" />
          <span className="text-white text-xs font-semibold">+1 vaso</span>
        </motion.button>
        <div className="w-14" />
      </div>

      {/* Goal setting */}
      <div className="w-full card">
        <label className="label">Meta diaria (vasos)</label>
        <div className="flex gap-2">
          {[6,7,8,10,12].map(g => (
            <button key={g} onClick={() => setGoal(g)}
              className={`flex-1 py-2 rounded-xl border text-sm transition-all ${
                goal === g ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400' : 'border-white/10 text-white/40'
              }`}>{g}</button>
          ))}
        </div>
      </div>
    </div>
  )
}
