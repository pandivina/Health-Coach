import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useStore } from '../store/useStore'

export default function Smoking() {
  const { user, addXP } = useStore()
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
    if (log) { await supabase.from('smoking_logs').delete().eq('id', log.id) }
    const { data } = await supabase.from('smoking_logs').insert({
      user_id: user.id,
      quit_date: form.quit_date,
      cigarettes_per_day: parseInt(form.cigarettes_per_day) || 10,
      cost_per_pack: parseFloat(form.cost_per_pack) || 5,
    }).select().single()
    setLog(data)
    addXP(100)
  }

  function getDuration(quitDate) {
    const diff = now - new Date(quitDate)
    const days = Math.floor(diff / 86400000)
    const hrs = Math.floor((diff % 86400000) / 3600000)
    const mins = Math.floor((diff % 3600000) / 60000)
    const secs = Math.floor((diff % 60000) / 1000)
    return { days, hrs, mins, secs, totalDays: days }
  }

  let stats = null
  if (log?.quit_date) {
    const { days, hrs, mins, secs, totalDays } = getDuration(log.quit_date)
    const cigs = Math.round(totalDays * log.cigarettes_per_day)
    const money = ((totalDays / 20) * log.cost_per_pack).toFixed(2)
    stats = { days, hrs, mins, secs, cigs, money }
  }

  return (
    <div className="page">
      <h1 className="text-2xl font-extrabold mb-5">Dejar de fumar 🚭</h1>

      {log && stats ? (
        <div className="space-y-4">
          {/* Timer */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="card bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border-emerald-500/20 text-center">
            <p className="text-white/50 text-sm mb-3">Sin fumar desde {log.quit_date}</p>
            <div className="flex justify-center gap-4">
              {[['días', stats.days], ['h', stats.hrs], ['min', stats.mins], ['seg', stats.secs]].map(([u, v]) => (
                <div key={u} className="text-center">
                  <p className="text-3xl font-extrabold text-emerald-400">{String(v).padStart(2,'0')}</p>
                  <p className="text-white/40 text-xs">{u}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="card text-center">
              <p className="text-3xl font-bold text-red-400">{stats.cigs}</p>
              <p className="text-white/40 text-xs mt-1">Cigarrillos no fumados 🚬</p>
            </div>
            <div className="card text-center">
              <p className="text-3xl font-bold text-yellow-400">{stats.money}€</p>
              <p className="text-white/40 text-xs mt-1">Dinero ahorrado 💰</p>
            </div>
          </div>

          <div className="card">
            <p className="font-semibold mb-2 text-sm">Beneficios de salud</p>
            {[
              { days: 0, text: '20 min: tensión arterial se normaliza' },
              { days: 1, text: '1 día: riesgo de infarto disminuye' },
              { days: 3, text: '3 días: respiración mejora notablemente' },
              { days: 14, text: '2 semanas: circulación mejora' },
              { days: 30, text: '1 mes: función pulmonar +30%' },
            ].map(b => (
              <div key={b.days} className={`flex items-center gap-2 py-1.5 text-sm ${stats.days >= b.days ? 'text-emerald-400' : 'text-white/30'}`}>
                <span>{stats.days >= b.days ? '✅' : '○'}</span> {b.text}
              </div>
            ))}
          </div>

          <button onClick={() => { if (confirm('¿Reiniciar contador?')) { setLog(null) } }} className="btn-secondary text-sm">
            Reiniciar contador
          </button>
        </div>
      ) : (
        <div className="card space-y-4">
          <p className="font-semibold">Empieza tu programa</p>
          <div><label className="label">Fecha de inicio (dejar de fumar)</label>
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
