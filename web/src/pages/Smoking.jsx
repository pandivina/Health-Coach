import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useStore } from '../store/useStore'
import { useTheme } from '../contexts/ThemeProvider'

export default function Smoking() {
  const { user, addXP } = useStore()
  const { theme } = useTheme()
  const [log, setLog] = useState(null)
  const [form, setForm] = useState({ quit_date: new Date().toISOString().split('T')[0], cigarettes_per_day: '10', cost_per_pack: '5' })
  const [now, setNow] = useState(new Date())

  async function load() {
    const { data } = await supabase.from('smoking_logs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).single()
    if (data) setLog(data)
  }
  useEffect(() => { if (user) load() }, [user])
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t) }, [])

  async function start() {
    if (log) await supabase.from('smoking_logs').delete().eq('id', log.id)
    const { data } = await supabase.from('smoking_logs').insert({
      user_id: user.id, quit_date: form.quit_date,
      cigarettes_per_day: parseInt(form.cigarettes_per_day) || 10,
      cost_per_pack: parseFloat(form.cost_per_pack) || 5,
    }).select().single()
    setLog(data); addXP(100)
  }

  function getDuration(quitDate) {
    const diff = now - new Date(quitDate)
    return {
      days: Math.floor(diff / 86400000),
      hrs: Math.floor((diff % 86400000) / 3600000),
      mins: Math.floor((diff % 3600000) / 60000),
      secs: Math.floor((diff % 60000) / 1000),
      totalDays: Math.floor(diff / 86400000),
    }
  }

  let stats = null
  if (log?.quit_date) {
    const { days, hrs, mins, secs, totalDays } = getDuration(log.quit_date)
    stats = {
      days, hrs, mins, secs,
      cigs: Math.round(totalDays * log.cigarettes_per_day),
      money: ((totalDays / 20) * log.cost_per_pack).toFixed(2),
    }
  }

  return (
    <div className="page">
      <h1 className="text-2xl font-extrabold mb-5" style={{ color: theme.text }}>Dejar de fumar 🚭</h1>

      {log && stats ? (
        <div className="space-y-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="card text-center"
            style={{ background: `${theme.success}10`, border: `1px solid ${theme.success}25` }}>
            <p className="text-sm mb-3" style={{ color: theme.textMuted }}>Sin fumar desde {log.quit_date}</p>
            <div className="flex justify-center gap-4">
              {[['días', stats.days], ['h', stats.hrs], ['min', stats.mins], ['seg', stats.secs]].map(([u, v]) => (
                <div key={u} className="text-center">
                  <p className="text-3xl font-extrabold" style={{ color: theme.success }}>{String(v).padStart(2,'0')}</p>
                  <p className="text-xs" style={{ color: theme.textMuted }}>{u}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <div className="grid grid-cols-2 gap-3">
            <div className="card text-center">
              <p className="text-3xl font-bold" style={{ color: theme.error }}>{stats.cigs}</p>
              <p className="text-xs mt-1" style={{ color: theme.textMuted }}>Cigarrillos no fumados 🚬</p>
            </div>
            <div className="card text-center">
              <p className="text-3xl font-bold" style={{ color: theme.warning }}>{stats.money}€</p>
              <p className="text-xs mt-1" style={{ color: theme.textMuted }}>Dinero ahorrado 💰</p>
            </div>
          </div>

          <div className="card">
            <p className="font-semibold mb-2 text-sm" style={{ color: theme.text }}>Beneficios de salud</p>
            {[
              { days: 0, text: '20 min: tensión arterial se normaliza' },
              { days: 1, text: '1 día: riesgo de infarto disminuye' },
              { days: 3, text: '3 días: respiración mejora' },
              { days: 14, text: '2 semanas: circulación mejora' },
              { days: 30, text: '1 mes: función pulmonar +30%' },
            ].map(b => (
              <div key={b.days} className="flex items-center gap-2 py-1.5 text-sm"
                style={{ color: stats.days >= b.days ? theme.success : theme.textLight }}>
                <span>{stats.days >= b.days ? '✅' : '○'}</span> {b.text}
              </div>
            ))}
          </div>

          <button onClick={() => { if (confirm('¿Reiniciar contador?')) setLog(null) }} className="btn-secondary text-sm">
            Reiniciar contador
          </button>
        </div>
      ) : (
        <div className="card space-y-4">
          <p className="font-semibold" style={{ color: theme.text }}>Empieza tu programa</p>
          <div><label className="label">Fecha de inicio</label>
            <input className="input" type="date" value={form.quit_date} onChange={e => setForm(f => ({ ...f, quit_date: e.target.value }))} /></div>
          <div><label className="label">Cigarrillos/día fumabas</label>
            <input className="input" type="number" value={form.cigarettes_per_day} onChange={e => setForm(f => ({ ...f, cigarettes_per_day: e.target.value }))} /></div>
          <div><label className="label">Coste por cajetilla (€)</label>
            <input className="input" type="number" step="0.5" value={form.cost_per_pack} onChange={e => setForm(f => ({ ...f, cost_per_pack: e.target.value }))} /></div>
          <button onClick={start} className="btn-primary">🚭 Iniciar programa (+100 XP)</button>
        </div>
      )}
    </div>
  )
}
