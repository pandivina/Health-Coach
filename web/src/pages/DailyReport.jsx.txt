import { useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart2, Loader } from 'lucide-react'
import { api } from '../lib/api'

export default function DailyReport() {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const data = await api.report.today()
      setReport(data)
    } catch (err) {
      alert('Error cargando informe: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ emoji, label, value, sub }) => (
    <div className="card text-center">
      <p className="text-2xl mb-1">{emoji}</p>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-white/40 text-xs">{label}</p>
      {sub && <p className="text-white/30 text-[11px] mt-0.5">{sub}</p>}
    </div>
  )

  return (
    <div className="page">
      <h1 className="text-2xl font-extrabold mb-2">Tu Día 📊</h1>
      <p className="text-white/40 text-sm mb-6">{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>

      {!report ? (
        <div className="text-center py-12">
          <BarChart2 size={48} className="text-white/10 mx-auto mb-4" />
          <p className="text-white/40 mb-6">Genera tu informe diario con análisis de IA</p>
          <button onClick={load} disabled={loading}
            className="btn-primary inline-flex items-center justify-center gap-2 w-auto px-8">
            {loading ? <><Loader size={16} className="animate-spin" /> Generando…</> : '📊 Ver mi informe'}
          </button>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard emoji="🍎" label="Consumidas" value={`${report.calories_consumed} kcal`} />
            <StatCard emoji="🔥" label="Quemadas" value={`${report.calories_burned} kcal`} />
            <StatCard emoji="⚖️" label="Balance" value={`${report.balance > 0 ? '+' : ''}${report.balance} kcal`}
              sub={report.balance > 200 ? 'Superávit' : report.balance < -200 ? 'Déficit' : 'En equilibrio'} />
            <StatCard emoji="🌙" label="Sueño" value={report.sleep_hours ? `${report.sleep_hours}h` : '–'} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <StatCard emoji={['','😩','😞','😐','😊','🤩'][report.mood] || '–'} label="Ánimo" value={report.mood ? `${report.mood}/5` : '–'} />
            <StatCard emoji="💧" label="Agua" value={`${report.hydration_glasses} vasos`} />
            <StatCard emoji="💪" label="Entrenos" value={report.workouts_count} />
          </div>

          {/* Coach insight */}
          <div className="card bg-gradient-to-br from-violet-500/10 to-indigo-500/5 border-violet-500/15">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🤖</span>
              <p className="font-semibold text-sm">Insight del Coach</p>
            </div>
            <p className="text-white/70 text-sm leading-relaxed">{report.coach_insight}</p>
          </div>

          <div className="card bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border-emerald-500/15">
            <div className="flex items-center gap-2 mb-2">
              <span>💡</span>
              <p className="font-semibold text-sm">Para mañana</p>
            </div>
            <p className="text-white/70 text-sm">{report.recommendation}</p>
          </div>

          <button onClick={load} className="btn-secondary text-sm flex items-center justify-center gap-2">
            {loading ? <Loader size={14} className="animate-spin" /> : null} Actualizar informe
          </button>
        </motion.div>
      )}
    </div>
  )
}
