import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useStore } from '../../store/useStore' // Asegúrate de importar tu store
import NightlyPlanner from './NightlyPlanner' // Asegúrate de importar el componente

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DAYS   = ['L','M','X','J','V','S','D']

const MOODS = {
  1: { emoji: '😩', color: '#EF4444', label: 'Hundido'  },
  2: { emoji: '😞', color: '#F97316', label: 'Bajo'     },
  3: { emoji: '😐', color: '#EAB308', label: 'Normal'   },
  4: { emoji: '😊', color: '#22C55E', label: 'Bien'     },
  5: { emoji: '🤩', color: '#2EC4B6', label: 'Genial'   },
}

function getDaysInMonth(y, m) { return new Date(y, m + 1, 0).getDate() }
function getFirstDay(y, m) { const d = new Date(y, m, 1).getDay(); return d === 0 ? 6 : d - 1 }

export default function WellnessCalendar({ theme, userId }) {
  const { saveDailyGoals } = useStore() // Traemos la función del store
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth())
  const [logs, setLogs] = useState({})
  const [selected, setSelected] = useState(null)
  const [showNightly, setShowNightly] = useState(false) // Estado local para el modal
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    // Proactividad: mostrar modal a las 22:00
    const hour = new Date().getHours()
    if (hour === 22) setShowNightly(true)

    if (!userId) return
    // Cargar últimos 90 días de mood + sueño + agua
    const from = new Date(); from.setDate(from.getDate() - 90)
    const fromStr = from.toISOString().split('T')[0]

    Promise.all([
      supabase.from('mood_logs').select('date,mood').eq('user_id', userId).gte('date', fromStr),
      supabase.from('sleep_logs').select('date,hours,quality').eq('user_id', userId).gte('date', fromStr),
      supabase.from('hydration_logs').select('date,glasses,goal').eq('user_id', userId).gte('date', fromStr),
    ]).then(([moodR, sleepR, waterR]) => {
      const map = {}
      ;(moodR.data || []).forEach(l => {
        if (!map[l.date]) map[l.date] = {}
        map[l.date].mood = l.mood
      })
      ;(sleepR.data || []).forEach(l => {
        if (!map[l.date]) map[l.date] = {}
        map[l.date].sleep = l.hours
        map[l.date].sleepQuality = l.quality
      })
      ;(waterR.data || []).forEach(l => {
        if (!map[l.date]) map[l.date] = {}
        map[l.date].water  = l.glasses
        map[l.date].waterGoal = l.goal || 8
      })
      setLogs(map)
    })
  }, [userId])

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay    = getFirstDay(year, month)

  // Estadísticas del mes
  const monthLogs = Object.entries(logs).filter(([d]) => {
    return d.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)
  }).map(([, v]) => v)

  const avgMood  = monthLogs.filter(l => l.mood).length
    ? (monthLogs.filter(l => l.mood).reduce((s, l) => s + l.mood, 0) / monthLogs.filter(l => l.mood).length).toFixed(1)
    : null
  const avgSleep = monthLogs.filter(l => l.sleep).length
    ? (monthLogs.filter(l => l.sleep).reduce((s, l) => s + l.sleep, 0) / monthLogs.filter(l => l.sleep).length).toFixed(1)
    : null
  const waterDays = monthLogs.filter(l => l.water >= (l.waterGoal || 8)).length

  const selectedLog = selected ? logs[selected] : null

  return (
    <div className="space-y-4">

      {/* Estadísticas del mes */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { val: avgMood ? `${avgMood}/5` : '–',  label: 'Ánimo medio',  icon: avgMood ? MOODS[Math.round(avgMood)]?.emoji : '😐' },
          { val: avgSleep ? `${avgSleep}h` : '–', label: 'Sueño medio',  icon: '😴' },
          { val: waterDays,                        label: 'Días con agua', icon: '💧' },
        ].map((s, i) => (
          <div key={i} className="card text-center py-3">
            <p className="text-xl mb-1">{s.icon}</p>
            <p className="font-extrabold text-lg" style={{ color: theme.primary }}>{s.val}</p>
            <p className="text-[10px]" style={{ color: theme.textMuted }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Calendario */}
      <div className="card">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-xl"
            style={{ background: theme.surface2 }}>
            <ChevronLeft size={16} style={{ color: theme.text }} />
          </button>
          <p className="font-extrabold text-sm" style={{ color: theme.text }}>
            {MONTHS[month]} {year}
          </p>
          <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-xl"
            style={{ background: theme.surface2 }}>
            <ChevronRight size={16} style={{ color: theme.text }} />
          </button>
        </div>

        {/* Días semana */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map(d => (
            <div key={d} className="text-center text-[10px] font-bold py-1"
              style={{ color: theme.textMuted }}>{d}</div>
          ))}
        </div>

        {/* Días */}
        <div className="grid grid-cols-7 gap-0.5">
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day     = i + 1
            const dateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
            const log     = logs[dateStr]
            const moodData = log?.mood ? MOODS[log.mood] : null
            const isToday    = dateStr === today
            const isSelected = dateStr === selected
            const isFuture   = dateStr > today

            return (
              <motion.button key={day} whileTap={{ scale: 0.85 }}
                onClick={() => !isFuture && setSelected(selected === dateStr ? null : dateStr)}
                disabled={isFuture}
                className="aspect-square rounded-xl flex flex-col items-center justify-center relative"
                style={{
                  background: moodData ? `${moodData.color}18` : isToday ? `${theme.primary}10` : 'transparent',
                  border: `2px solid ${isSelected ? theme.text : isToday ? theme.primary : 'transparent'}`,
                  opacity: isFuture ? 0.25 : 1,
                }}>
                <span className="text-[10px] font-bold" style={{
                  color: moodData ? moodData.color : isToday ? theme.primary : theme.textMuted
                }}>
                  {day}
                </span>
                {moodData && (
                  <span style={{ fontSize: 9, lineHeight: 1 }}>{moodData.emoji}</span>
                )}
                {/* Punto sueño */}
                {log?.sleep && (
                  <div className="absolute bottom-0.5 right-0.5 w-1 h-1 rounded-full"
                    style={{ background: '#818CF8' }} />
                )}
                {/* Punto agua */}
                {log?.water >= (log?.waterGoal || 8) && (
                  <div className="absolute bottom-0.5 left-0.5 w-1 h-1 rounded-full"
                    style={{ background: '#3B82F6' }} />
                )}
              </motion.button>
            )
          })}
        </div>

        {/* Leyenda */}
        <div className="flex gap-3 mt-3 pt-3 flex-wrap" style={{ borderTop: `1px solid ${theme.border}` }}>
          {[
            { color: '#818CF8', label: 'Sueño' },
            { color: '#3B82F6', label: 'Agua ✓' },
          ].map((l, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ background: l.color }} />
              <span className="text-[10px]" style={{ color: theme.textMuted }}>{l.label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1">
            <span style={{ fontSize: 10 }}>😊</span>
            <span className="text-[10px]" style={{ color: theme.textMuted }}>Ánimo</span>
          </div>
        </div>
      </div>

     {/* Detalle día seleccionado */}
      {selected && selectedLog && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="card" style={{ border: `1px solid ${theme.border}` }}>
          {/* ... contenido del detalle ... */}
        </motion.div>
      )}

      {selected && !selectedLog && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="card text-center py-4" style={{ border: `1px solid ${theme.border}` }}>
          <p className="text-sm" style={{ color: theme.textMuted }}>
            Sin registros para este día
          </p>
        </motion.div>
      )}

      {/* MODAL: Ahora está DENTRO del div principal y ANTES del cierre del return */}
      {showNightly && (
        <NightlyPlanner 
          theme={theme} 
          onClose={() => setShowNightly(false)}
          onSave={async (goals) => {
            const { error } = await saveDailyGoals(goals)
            if (!error) {
              setShowNightly(false)
            }
          }} 
        />
      )}
      
    </div>
