import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Target, Zap } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useStore } from '../../store/useStore'

export default function TendenciasTab() {
  const { user } = useStore()
  const [weekData, setWeekData] = useState([])
  const [goals, setGoals] = useState({ calories: 2000, protein_g: 150 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function load() {
      const days = [...Array(7)].map((_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (6 - i))
        return d.toISOString().split('T')[0]
      })

      const [mealsRes, goalsRes] = await Promise.all([
        supabase.from('meal_logs').select('date, calories, protein_g, carbs_g, fat_g')
          .eq('user_id', user.id).in('date', days),
        supabase.from('nutrition_goals').select('*').eq('user_id', user.id).single(),
      ])

      const meals = mealsRes.data || []
      if (goalsRes.data) setGoals(goalsRes.data)

      const data = days.map(date => {
        const dayMeals = meals.filter(m => m.date === date)
        return {
          date,
          day: new Date(date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short' }),
          calories: Math.round(dayMeals.reduce((s, m) => s + m.calories, 0)),
          protein: Math.round(dayMeals.reduce((s, m) => s + m.protein_g, 0)),
          hasData: dayMeals.length > 0,
        }
      })
      setWeekData(data)
      setLoading(false)
    }
    load()
  }, [user])

  if (loading) return <div className="text-center py-10 text-white/30">Cargando tendencias…</div>

  const daysWithData = weekData.filter(d => d.hasData)
  const avgCals = daysWithData.length
    ? Math.round(daysWithData.reduce((s, d) => s + d.calories, 0) / daysWithData.length)
    : 0
  const avgProtein = daysWithData.length
    ? Math.round(daysWithData.reduce((s, d) => s + d.protein, 0) / daysWithData.length)
    : 0
  const adherence = daysWithData.length
    ? Math.round((daysWithData.filter(d => Math.abs(d.calories - goals.calories) < goals.calories * 0.15).length / 7) * 100)
    : 0
  const consistency = Math.round((daysWithData.length / 7) * 100)
  const maxCals = Math.max(...weekData.map(d => d.calories), goals.calories)

  return (
    <div className="space-y-5">
      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: Zap, label: 'Media calórica', value: `${avgCals} kcal`, sub: `Meta: ${goals.calories}`, color: 'text-orange-400' },
          { icon: Target, label: 'Adherencia', value: `${adherence}%`, sub: 'A tu objetivo', color: 'text-accent-green' },
          { icon: TrendingUp, label: 'Proteína media', value: `${avgProtein}g`, sub: `Meta: ${goals.protein_g}g`, color: 'text-accent' },
          { icon: Zap, label: 'Consistencia', value: `${consistency}%`, sub: `${daysWithData.length}/7 días`, color: 'text-yellow-400' },
        ].map(({ icon: Icon, label, value, sub, color }) => (
          <div key={label} className="card">
            <Icon size={16} className={`${color} mb-2`} />
            <p className="font-bold text-lg">{value}</p>
            <p className="text-white/40 text-xs">{label}</p>
            <p className="text-white/20 text-[10px]">{sub}</p>
          </div>
        ))}
      </div>

      {/* Calorie bars chart */}
      <div className="card">
        <p className="font-semibold text-sm mb-4">Calorías — últimos 7 días</p>
        <div className="flex items-end gap-2 h-32">
          {weekData.map((d, i) => {
            const pct = maxCals > 0 ? (d.calories / maxCals) * 100 : 0
            const isGoal = Math.abs(d.calories - goals.calories) < goals.calories * 0.15
            const isOver = d.calories > goals.calories * 1.15
            const barColor = !d.hasData ? 'bg-surface-3' : isOver ? 'bg-red-500/70' : isGoal ? 'bg-emerald-500/70' : 'bg-accent/70'
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-white/40 text-[9px]">{d.hasData ? d.calories : ''}</span>
                <div className="w-full flex items-end" style={{ height: '88px' }}>
                  <motion.div
                    initial={{ height: 0 }} animate={{ height: `${Math.max(pct, d.hasData ? 5 : 0)}%` }}
                    transition={{ delay: i * 0.05, duration: 0.4 }}
                    className={`w-full rounded-t-lg ${barColor}`}
                    style={{ minHeight: d.hasData ? '4px' : '0' }}
                  />
                </div>
                <span className="text-white/40 text-[10px] capitalize">{d.day}</span>
              </div>
            )
          })}
        </div>
        {/* Goal line indicator */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
            <span className="text-white/30 text-xs">En objetivo</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <span className="text-white/30 text-xs">Por encima</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-accent/70" />
            <span className="text-white/30 text-xs">Por debajo</span>
          </div>
        </div>
      </div>

      {/* Protein trend */}
      <div className="card">
        <p className="font-semibold text-sm mb-3">Proteína diaria</p>
        <div className="space-y-2">
          {weekData.filter(d => d.hasData).map(d => (
            <div key={d.date}>
              <div className="flex justify-between text-xs text-white/50 mb-1">
                <span className="capitalize">{d.day}</span>
                <span>{d.protein}g / {goals.protein_g}g</span>
              </div>
              <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((d.protein / goals.protein_g) * 100, 100)}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full rounded-full bg-accent"
                />
              </div>
            </div>
          ))}
          {daysWithData.length === 0 && (
            <p className="text-white/30 text-sm text-center py-4">Sin datos esta semana</p>
          )}
        </div>
      </div>
    </div>
  )
}
