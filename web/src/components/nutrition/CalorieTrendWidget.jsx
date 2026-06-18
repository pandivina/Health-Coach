// ─── components/nutrition/CalorieTrendWidget.jsx ────────────────────────────
// Barra mini de los últimos 7 días — detecta si el fin de semana se descontrola

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'

export default function CalorieTrendWidget({ userId, theme, calorieGoal = 2000 }) {
  const [weekData, setWeekData] = useState([])
  const [loading,   setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    load()
  }, [userId])

  async function load() {
    setLoading(true)
    const today = new Date()
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today); d.setDate(d.getDate() - (6 - i))
      return d.toISOString().split('T')[0]
    })
    const from = days[0], to = days[6]

    try {
      const { data } = await supabase
        .from('meal_logs').select('date,calories')
        .eq('user_id', userId).gte('date', from).lte('date', to)

      const byDate = {}
      ;(data || []).forEach(m => { byDate[m.date] = (byDate[m.date] || 0) + (m.calories || 0) })

      setWeekData(days.map(date => ({
        date,
        cal: Math.round(byDate[date] || 0),
        isWeekend: [0, 6].includes(new Date(date + 'T12:00:00').getDay()),
      })))
    } catch {
      setWeekData([])
    } finally {
      setLoading(false)
    }
  }

  if (loading || !weekData.length) return null

  const maxCal = Math.max(...weekData.map(d => d.cal), calorieGoal)
  const weekdayAvg = weekData.filter(d => !d.isWeekend && d.cal > 0)
  const weekendAvg  = weekData.filter(d => d.isWeekend && d.cal > 0)
  const avgWeekday = weekdayAvg.length ? weekdayAvg.reduce((s, d) => s + d.cal, 0) / weekdayAvg.length : 0
  const avgWeekend  = weekendAvg.length ? weekendAvg.reduce((s, d) => s + d.cal, 0) / weekendAvg.length : 0
  const weekendSpike = avgWeekend > 0 && avgWeekday > 0 && avgWeekend > avgWeekday * 1.15

  const barColor = (cal) => {
    if (cal === 0) return theme.surface2 || 'rgba(0,0,0,0.06)'
    if (cal > calorieGoal * 1.15) return '#EF4444'
    if (cal > calorieGoal * 0.85) return '#2EC4B6'
    return '#F59E0B'
  }

  return (
    <div style={{ background: theme.surface || 'white', borderRadius: 20, padding: '14px 16px',
      border: `1px solid ${theme.border || 'rgba(0,0,0,0.06)'}`, marginBottom: 12 }}>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <p style={{ fontSize:13, fontWeight:800, color:theme.text || '#1A2332', margin:0 }}>
          Tendencia calórica
        </p>
        <span style={{ fontSize:10, color:theme.textMuted || '#9CA3AF', fontWeight:600 }}>7 días</span>
      </div>

      <div style={{ display:'flex', gap:6, alignItems:'flex-end', height:64, marginBottom:8 }}>
        {weekData.map((day, i) => {
          const dayName = ['D','L','M','X','J','V','S'][new Date(day.date+'T12:00:00').getDay()]
          const isToday = day.date === new Date().toISOString().split('T')[0]
          const h = day.cal > 0 ? Math.max((day.cal / maxCal) * 52, 6) : 6
          return (
            <div key={day.date} style={{ flex:1, display:'flex', flexDirection:'column',
              alignItems:'center', gap:3 }}>
              {day.cal > 0 && (
                <span style={{ fontSize:8, color:theme.textMuted || '#9CA3AF', fontWeight:700 }}>
                  {Math.round(day.cal/100)/10}k
                </span>
              )}
              <motion.div initial={{ height:0 }} animate={{ height:h }}
                transition={{ duration:0.4, delay:i*0.05 }}
                style={{ width:'100%', borderRadius:5, background: barColor(day.cal),
                  border: isToday ? `2px solid ${theme.primary || '#2EC4B6'}` : 'none' }} />
              <span style={{ fontSize:10, fontWeight:700,
                color: day.isWeekend ? '#F97316' : (theme.textMuted || '#9CA3AF') }}>
                {dayName}
              </span>
            </div>
          )
        })}
      </div>

      {weekendSpike && (
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px',
          borderRadius:12, background:'#FFF7ED', marginTop:8 }}>
          <span style={{ fontSize:14 }}>📈</span>
          <p style={{ fontSize:11, color:'#92400E', margin:0, fontWeight:600 }}>
            Los fines de semana comes ~{Math.round(((avgWeekend/avgWeekday)-1)*100)}% más que en diario
          </p>
        </div>
      )}
    </div>
  )
}
