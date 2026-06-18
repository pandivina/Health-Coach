// ─── components/mood/JournalEntry.jsx ────────────────────────────────────────
// Diario emocional de texto libre — el Coach lo lee como contexto
// Detecta patrones simples por día de la semana ("los lunes siempre bajo")

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Check, Calendar } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

export default function JournalEntry({ theme, userId, currentMood }) {
  const [text,    setText]    = useState('')
  const [saved,   setSaved]   = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [history, setHistory] = useState([])
  const [pattern, setPattern] = useState(null)
  const [showHistory, setShowHistory] = useState(false)
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (!userId) return
    load()
  }, [userId])

  async function load() {
    try {
      const { data } = await supabase
        .from('journal_entries').select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(30)

      const entries = data || []
      setHistory(entries)

      const todayEntry = entries.find(e => e.date === today)
      if (todayEntry) { setText(todayEntry.text); setSaved(true) }

      detectPattern(entries)
    } catch {}
  }

  function detectPattern(entries) {
    if (entries.length < 6) { setPattern(null); return }

    // Agrupar mood por día de la semana
    const byWeekday = {}
    entries.forEach(e => {
      if (e.mood == null) return
      const day = new Date(e.date + 'T12:00:00').getDay()
      if (!byWeekday[day]) byWeekday[day] = []
      byWeekday[day].push(e.mood)
    })

    // Buscar el día con peor promedio (mínimo 3 registros de ese día)
    let worstDay = null, worstAvg = 5
    Object.entries(byWeekday).forEach(([day, moods]) => {
      if (moods.length < 3) return
      const avg = moods.reduce((s, m) => s + m, 0) / moods.length
      if (avg < worstAvg && avg < 2.8) {
        worstAvg = avg; worstDay = parseInt(day)
      }
    })

    setPattern(worstDay !== null ? DAY_NAMES[worstDay] : null)
  }

  async function save() {
    if (!text.trim()) return
    setSaving(true)
    try {
      await supabase.from('journal_entries').upsert({
        user_id: userId, date: today, text: text.trim(), mood: currentMood || null,
      }, { onConflict: 'user_id,date' })
      setSaved(true)
      await load()
    } catch {} finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ background:'rgba(255,255,255,0.88)', backdropFilter:'blur(16px)',
        borderRadius:24, padding:'18px 16px' }}>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <BookOpen size={15} color={theme.primary} />
            <p style={{ fontSize:13, fontWeight:800, color:'#1A2332', margin:0 }}>Diario de hoy</p>
          </div>
          {history.length > 0 && (
            <button onClick={() => setShowHistory(s => !s)}
              style={{ background:'none', border:'none', cursor:'pointer',
                display:'flex', alignItems:'center', gap:4, color:theme.primary, fontSize:11, fontWeight:700 }}>
              <Calendar size={12} /> Historial
            </button>
          )}
        </div>

        <textarea
          value={text} onChange={e => { setText(e.target.value); setSaved(false) }}
          placeholder="¿Cómo ha sido tu día? Escribe lo que quieras, Pandi lo tendrá en cuenta…"
          rows={4}
          style={{ width:'100%', padding:'12px 14px', borderRadius:16,
            border:'1.5px solid rgba(0,0,0,0.08)', background:'rgba(255,255,255,0.7)',
            fontSize:13, lineHeight:1.5, outline:'none', resize:'none',
            boxSizing:'border-box', fontFamily:'inherit', color:'#1A2332' }} />

        <motion.button whileTap={{ scale:0.97 }} onClick={save}
          disabled={!text.trim() || saving || saved}
          style={{ width:'100%', marginTop:10, padding:'12px', borderRadius:14, border:'none',
            cursor: saved ? 'default' : 'pointer', fontSize:13, fontWeight:700,
            background: saved ? 'rgba(34,197,94,0.12)' : 'linear-gradient(135deg,#2EC4B6,#FF8FA3)',
            color: saved ? '#16A34A' : 'white', opacity: !text.trim() && !saved ? 0.5 : 1 }}>
          {saving ? 'Guardando…' : saved ? '✓ Guardado' : 'Guardar entrada'}
        </motion.button>
      </div>

      {/* Patrón detectado */}
      <AnimatePresence>
        {pattern && (
          <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
            style={{ background:'rgba(254,243,199,0.9)', borderRadius:18, padding:'12px 14px',
              border:'1px solid #FCD34D', display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:20 }}>🔍</span>
            <p style={{ fontSize:12, color:'#92400E', margin:0, fontWeight:600 }}>
              Pandi ha notado un patrón: tus {pattern}s suelen ser días más bajos de ánimo
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Historial */}
      <AnimatePresence>
        {showHistory && (
          <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }}
            exit={{ opacity:0, height:0 }}
            style={{ background:'rgba(255,255,255,0.88)', backdropFilter:'blur(16px)',
              borderRadius:20, padding:'14px 16px', overflow:'hidden' }}>
            <div style={{ display:'flex', flexDirection:'column', gap:10, maxHeight:280, overflowY:'auto' }}>
              {history.filter(e => e.date !== today).map(entry => (
                <div key={entry.id} style={{ borderBottom:'1px solid rgba(0,0,0,0.05)', paddingBottom:8 }}>
                  <p style={{ fontSize:10, fontWeight:700, color:'#9CA3AF', margin:'0 0 3px' }}>
                    {new Date(entry.date + 'T12:00:00').toLocaleDateString('es-ES', { weekday:'long', day:'numeric', month:'short' })}
                  </p>
                  <p style={{ fontSize:12, color:'#1A2332', margin:0, lineHeight:1.4 }}>{entry.text}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
