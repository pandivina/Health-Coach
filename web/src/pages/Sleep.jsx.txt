import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useStore } from '../store/useStore'

const QUALITY_LABELS = { 1:'Terrible 😫', 2:'Malo 😞', 3:'Regular 😐', 4:'Bueno 😊', 5:'Excelente 🌟' }

export default function Sleep() {
  const { user, addXP } = useStore()
  const [logs, setLogs] = useState([])
  const [form, setForm] = useState({ hours: '7', quality: 3, notes: '' })
  const [saved, setSaved] = useState(false)
  const today = new Date().toISOString().split('T')[0]

  async function load() {
    const { data } = await supabase.from('sleep_logs').select('*')
      .eq('user_id', user.id).order('date', { ascending: false }).limit(7)
    setLogs(data || [])
    const todayLog = data?.find(l => l.date === today)
    if (todayLog) { setForm({ hours: String(todayLog.hours), quality: todayLog.quality, notes: todayLog.notes || '' }); setSaved(true) }
  }
  useEffect(() => { if (user) load() }, [user])

  async function save() {
    await supabase.from('sleep_logs').upsert({
      user_id: user.id, date: today,
      hours: parseFloat(form.hours), quality: form.quality, notes: form.notes,
    }, { onConflict: 'user_id,date' })
    await addXP(15)
    setSaved(true)
    load()
  }

  const avgHours = logs.length ? (logs.reduce((s, l) => s + l.hours, 0) / logs.length).toFixed(1) : '–'

  return (
    <div className="page">
      <h1 className="text-2xl font-extrabold mb-5">Sueño 🌙</h1>

      <div className="card mb-5 flex gap-4">
        <div className="text-center flex-1">
          <p className="text-3xl font-bold text-indigo-400">{avgHours}h</p>
          <p className="text-white/40 text-xs">Media 7 días</p>
        </div>
        <div className="text-center flex-1">
          <p className="text-3xl font-bold text-yellow-400">{logs.length > 0 ? logs[0]?.quality : '–'}/5</p>
          <p className="text-white/40 text-xs">Última calidad</p>
        </div>
      </div>

      <div className="card mb-5 space-y-4">
        <p className="font-semibold">Registrar sueño de hoy</p>
        <div>
          <label className="label">Horas dormidas</label>
          <input className="input" type="number" step="0.5" min="0" max="24" value={form.hours} onChange={e => setForm(f => ({ ...f, hours: e.target.value }))} />
        </div>
        <div>
          <label className="label">Calidad — {QUALITY_LABELS[form.quality]}</label>
          <div className="flex gap-2 mt-1">
            {[1,2,3,4,5].map(q => (
              <button key={q} onClick={() => setForm(f => ({ ...f, quality: q }))}
                className={`flex-1 py-2 rounded-xl border text-sm font-bold transition-all ${
                  form.quality === q ? 'border-accent bg-accent/20 text-white' : 'border-white/10 text-white/30'
                }`}>{q}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">Notas (opcional)</label>
          <input className="input" placeholder="¿Cómo te sientes?" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </div>
        <button onClick={save} className="btn-primary flex items-center justify-center gap-2">
          {saved ? '✅ Actualizado' : '💾 Guardar (+15 XP)'}
        </button>
      </div>

      <p className="section-title">Historial</p>
      <div className="space-y-2">
        {logs.map(log => (
          <div key={log.id} className="card flex justify-between items-center">
            <div>
              <p className="font-medium">{log.date}</p>
              <p className="text-white/40 text-xs">{QUALITY_LABELS[log.quality]}</p>
            </div>
            <p className="text-xl font-bold text-indigo-400">{log.hours}h</p>
          </div>
        ))}
      </div>
    </div>
  )
}
