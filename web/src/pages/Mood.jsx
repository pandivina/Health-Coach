import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useStore } from '../store/useStore'
import { useTheme } from '../contexts/ThemeProvider'

const MOODS = [
  { v: 1, emoji: '😩', label: 'Muy mal' },
  { v: 2, emoji: '😞', label: 'Mal' },
  { v: 3, emoji: '😐', label: 'Regular' },
  { v: 4, emoji: '😊', label: 'Bien' },
  { v: 5, emoji: '🤩', label: 'Genial' },
]

export default function Mood() {
  const { user, addXP } = useStore()
  const { theme } = useTheme()
  const [logs, setLogs] = useState([])
  const [mood, setMood] = useState(null)
  const [notes, setNotes] = useState('')
  const [saved, setSaved] = useState(false)
  const today = new Date().toISOString().split('T')[0]

  async function load() {
    const { data } = await supabase.from('mood_logs').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(7)
    setLogs(data || [])
    const todayLog = data?.find(l => l.date === today)
    if (todayLog) { setMood(todayLog.mood); setNotes(todayLog.notes || ''); setSaved(true) }
  }
  useEffect(() => { if (user) load() }, [user])

  async function save() {
    if (!mood) return
    await supabase.from('mood_logs').upsert({ user_id: user.id, date: today, mood, notes }, { onConflict: 'user_id,date' })
    await addXP(10); setSaved(true); load()
  }

  return (
    <div className="page">
      <h1 className="text-2xl font-extrabold mb-5" style={{ color: theme.text }}>Estado emocional 💛</h1>

      <div className="card mb-5 space-y-5">
        <p className="font-semibold text-center" style={{ color: theme.text }}>¿Cómo te sientes hoy?</p>
        <div className="flex justify-around">
          {MOODS.map(m => (
            <motion.button key={m.v} whileTap={{ scale: 0.85 }} onClick={() => { setMood(m.v); setSaved(false) }}
              className="flex flex-col items-center gap-1 p-3 rounded-2xl transition-all"
              style={{ background: mood === m.v ? `${theme.warning}25` : 'transparent', opacity: mood && mood !== m.v ? 0.4 : 1 }}>
              <span className="text-3xl">{m.emoji}</span>
              <span className="text-[10px]" style={{ color: theme.textMuted }}>{m.label}</span>
            </motion.button>
          ))}
        </div>
        <input className="input" placeholder="Notas (opcional)…" value={notes} onChange={e => setNotes(e.target.value)} />
        <button onClick={save} disabled={!mood} className="btn-primary flex items-center justify-center gap-2 disabled:opacity-40">
          {saved ? '✅ Guardado' : '💾 Guardar (+10 XP)'}
        </button>
      </div>

      <p className="section-title">Últimos 7 días</p>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[...Array(7)].map((_, i) => {
          const d = new Date(); d.setDate(d.getDate() - (6 - i))
          const dateStr = d.toISOString().split('T')[0]
          const log = logs.find(l => l.date === dateStr)
          const moodData = MOODS.find(m => m.v === log?.mood)
          return (
            <div key={i} className="flex-shrink-0 flex flex-col items-center gap-1 w-10">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                style={{ background: log ? `${theme.warning}20` : theme.surface2 }}>
                {moodData?.emoji || '·'}
              </div>
              <span className="text-[10px]" style={{ color: theme.textLight }}>{d.getDate()}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
