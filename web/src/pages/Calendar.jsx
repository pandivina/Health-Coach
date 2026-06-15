import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Plus, Bell, X, Check, Clock, Tag, BarChart2, Calendar as CalendarIcon, Moon } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useStore } from '../store/useStore'
import { useTheme } from '../contexts/ThemeProvider'
import CycleTab from '../components/mood/CycleTab'
import { toast } from '../lib/toast'

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DAYS   = ['L','M','X','J','V','S','D']

const CATEGORIES = [
  { id:'health',    emoji:'💊', label:'Salud',       color:'#EF4444' },
  { id:'workout',   emoji:'💪', label:'Entreno',     color:'#6366F1' },
  { id:'nutrition', emoji:'🥗', label:'Nutrición',   color:'#F97316' },
  { id:'sleep',     emoji:'😴', label:'Sueño',       color:'#818CF8' },
  { id:'mood',      emoji:'🧘', label:'Bienestar',   color:'#2EC4B6' },
  { id:'medical',   emoji:'🏥', label:'Médico',      color:'#EC4899' },
  { id:'general',   emoji:'📌', label:'General',     color:'#F59E0B' },
]

const REMINDERS = [
  { val:0,    label:'En el momento' },
  { val:10,   label:'10 min antes'  },
  { val:30,   label:'30 min antes'  },
  { val:60,   label:'1h antes'      },
  { val:1440, label:'1 día antes'   },
]

const PET_EMOJI = { panda:'🐼', cat:'🐱', dog:'🐶', fox:'🦊', rabbit:'🐰' }
const MOOD_EMOJIS = { 1:'😩', 2:'😞', 3:'😐', 4:'😊', 5:'🤩' }
const MOOD_COLORS = { 1:'#EF4444', 2:'#F97316', 3:'#EAB308', 4:'#22C55E', 5:'#2EC4B6' }

function getDaysInMonth(y, m) { return new Date(y, m+1, 0).getDate() }
function getFirstDay(y, m)    { const d = new Date(y, m, 1).getDay(); return d===0 ? 6 : d-1 }
function toDateStr(y, m, d)   { return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}` }
function formatTime(t)        { return t ? t.slice(0,5) : '' }
function formatDateLong(ds)   {
  return new Date(ds+'T12:00:00').toLocaleDateString('es-ES', { weekday:'long', day:'numeric', month:'long' })
}

// ─── PANDA GREETING ──────────────────────────────────────────────────────────
function PandaGreeting({ profile, theme, eventCount }) {
  const hour     = new Date().getHours()
  const petEmoji = PET_EMOJI[profile?.pet_type] || '🐼'
  const petName  = profile?.pet_name || 'Pandi'
  const msg = eventCount > 0
    ? `Tienes ${eventCount} evento${eventCount>1?'s':''} hoy. ¡A por ello! 💪`
    : hour < 12 ? `Buenos días, ${profile?.name?.split(' ')[0]||'amigo'}. ¿Qué tienes planeado hoy?`
    : hour < 20 ? `¿Cómo va el día, ${profile?.name?.split(' ')[0]||'amigo'}?`
    : `Buenas noches. Revisa lo de mañana antes de dormir 🌙`
  return (
    <motion.div initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }}
      className="flex items-center gap-3 p-4 rounded-2xl mb-4"
      style={{ background:theme.surface, border:`1px solid ${theme.border}` }}>
      <motion.span animate={{ rotate:[0,10,-10,10,0] }}
        transition={{ duration:1.5, repeat:Infinity, repeatDelay:5 }}
        style={{ fontSize:38, flexShrink:0 }}>{petEmoji}</motion.span>
      <div className="flex-1 min-w-0">
        <p className="font-extrabold text-sm" style={{ color:theme.text }}>{petName}</p>
        <p className="text-xs leading-relaxed mt-0.5" style={{ color:theme.textMuted }}>{msg}</p>
      </div>
    </motion.div>
  )
}

// ─── WIDGET RESUMEN SEMANAL ───────────────────────────────────────────────────
function WeeklyHistory({ userId, theme }) {
  const [weekData,   setWeekData]   = useState([])
  const [monthData,  setMonthData]  = useState([])
  const [loading,    setLoading]    = useState(true)
  const [viewMode,   setViewMode]   = useState('week') // week | month

  useEffect(() => {
    if (!userId) return
    loadHistory()
  }, [userId])

  async function loadHistory() {
    setLoading(true)
    const today = new Date()
    // Últimos 30 días
    const days = Array.from({ length:30 }, (_, i) => {
      const d = new Date(today)
      d.setDate(d.getDate() - (29 - i))
      return d.toISOString().split('T')[0]
    })
    const from = days[0]
    const to   = days[days.length-1]

    const safe = async fn => { try { return await fn } catch { return { data:[] } } }
    const [mealsR, sleepR, moodR, workoutR, waterR] = await Promise.all([
      safe(supabase.from('meal_logs').select('date,calories').eq('user_id',userId).gte('date',from).lte('date',to)),
      safe(supabase.from('sleep_logs').select('date,hours').eq('user_id',userId).gte('date',from).lte('date',to)),
      safe(supabase.from('mood_logs').select('date,mood').eq('user_id',userId).gte('date',from).lte('date',to)),
      safe(supabase.from('workout_sessions').select('date:created_at,calories_burned').eq('user_id',userId).eq('status','completed').gte('created_at',from+'T00:00:00').lte('created_at',to+'T23:59:59')),
      safe(supabase.from('hydration_logs').select('date,glasses,goal').eq('user_id',userId).gte('date',from).lte('date',to)),
    ])

    // Agrupar por fecha
    const mealsByDate  = {}; (mealsR.data||[]).forEach(m => {
      if (!mealsByDate[m.date]) mealsByDate[m.date] = 0
      mealsByDate[m.date] += m.calories||0
    })
    const sleepByDate  = {}; (sleepR.data||[]).forEach(s => { sleepByDate[s.date]  = s.hours })
    const moodByDate   = {}; (moodR.data||[]).forEach(m  => { moodByDate[m.date]   = m.mood  })
    const waterByDate  = {}; (waterR.data||[]).forEach(w => { waterByDate[w.date]  = { glasses:w.glasses, goal:w.goal } })
    const workoutDates = new Set((workoutR.data||[]).map(w => w.date?.split('T')[0]))

    const built = days.map(date => {
      const cal   = mealsByDate[date]  || 0
      const sleep = sleepByDate[date]  || null
      const mood  = moodByDate[date]   || null
      const water = waterByDate[date]  || null
      const workout = workoutDates.has(date)
      // Score del día 0-1
      let score = 0, count = 0
      if (cal > 0)    { score += Math.min(cal / 2000, 1); count++ }
      if (sleep)      { score += Math.min(sleep / 7, 1);  count++ }
      if (mood)       { score += mood / 5;                count++ }
      if (water)      { score += Math.min((water.glasses||0)/(water.goal||8),1); count++ }
      if (workout)    { score += 1; count++ }
      const dayScore = count > 0 ? score/count : 0
      return { date, cal, sleep, mood, water, workout, score:dayScore, registered: count > 0 }
    })

    setMonthData(built)
    setWeekData(built.slice(-7))
    setLoading(false)
  }

  if (loading) return (
    <div style={{ padding:24, textAlign:'center' }}>
      <div style={{ width:24, height:24, border:`2px solid ${theme.primary}`,
        borderTopColor:'transparent', borderRadius:'50%', margin:'0 auto',
        animation:'spin 1s linear infinite' }} />
    </div>
  )

  const displayData = viewMode === 'week' ? weekData : monthData

  // Stats resumen
  const registered    = weekData.filter(d => d.registered).length
  const bestDay       = weekData.reduce((best, d) => d.score > (best?.score||0) ? d : best, null)
  const avgMood       = weekData.filter(d => d.mood).reduce((s,d,_,a) => s + d.mood/a.filter(x=>x.mood).length, 0)
  const workoutDays   = weekData.filter(d => d.workout).length
  const avgCal        = Math.round(weekData.filter(d=>d.cal>0).reduce((s,d,_,a) => s+d.cal/a.filter(x=>x.cal>0).length, 0))

  const scoreColor = (s) => s > 0.7 ? '#2EC4B6' : s > 0.4 ? '#F59E0B' : s > 0 ? '#EF4444' : theme.surface2

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {/* Selector semana/mes */}
      <div style={{ display:'flex', gap:6, padding:4, borderRadius:16, background:theme.surface2 }}>
        {[['week','📅 Esta semana'],['month','📊 30 días']].map(([id,label]) => (
          <button key={id} onClick={() => setViewMode(id)}
            style={{ flex:1, padding:'8px 0', borderRadius:12, border:'none', cursor:'pointer',
              fontSize:12, fontWeight:700, transition:'all 0.2s',
              background: viewMode===id ? theme.bg : 'transparent',
              color: viewMode===id ? theme.primary : theme.textMuted,
              boxShadow: viewMode===id ? '0 1px 6px rgba(0,0,0,0.08)' : 'none' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Stats resumen semanal */}
      {viewMode === 'week' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
          {[
            { label:'Días activos',   value:`${registered}/7`,       color:theme.primary },
            { label:'Entrenos',       value:workoutDays,              color:'#6366F1'    },
            { label:'Ánimo medio',    value:avgMood ? `${avgMood.toFixed(1)}/5` : '—', color:'#2EC4B6' },
            { label:'Kcal media',     value:avgCal || '—',            color:'#F97316'    },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background:theme.surface, borderRadius:16, padding:'10px 8px',
              border:`1px solid ${theme.border}`, textAlign:'center' }}>
              <p style={{ fontSize:16, fontWeight:900, color, margin:'0 0 4px' }}>{value}</p>
              <p style={{ fontSize:9, color:theme.textMuted, margin:0, fontWeight:600, lineHeight:1.2 }}>{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Heatmap / barras */}
      <div style={{ background:theme.surface, borderRadius:20, padding:16, border:`1px solid ${theme.border}` }}>
        <p style={{ fontSize:12, fontWeight:700, color:theme.text, margin:'0 0 12px' }}>
          {viewMode==='week' ? 'Actividad de la semana' : 'Actividad últimos 30 días'}
        </p>

        {viewMode === 'week' ? (
          // BARRAS SEMANALES
          <div style={{ display:'flex', gap:8, alignItems:'flex-end', height:100 }}>
            {weekData.map((day, i) => {
              const date    = new Date(day.date+'T12:00:00')
              const dayName = ['L','M','X','J','V','S','D'][date.getDay()===0?6:date.getDay()-1]
              const isToday = day.date === new Date().toISOString().split('T')[0]
              const h       = day.registered ? Math.max(day.score * 80, 8) : 8
              return (
                <div key={day.date} style={{ flex:1, display:'flex', flexDirection:'column',
                  alignItems:'center', gap:4 }}>
                  {/* Mood emoji encima */}
                  {day.mood && (
                    <span style={{ fontSize:11 }}>{MOOD_EMOJIS[day.mood]}</span>
                  )}
                  {/* Barra */}
                  <motion.div
                    initial={{ height:0 }} animate={{ height:h }}
                    transition={{ duration:0.5, delay:i*0.06 }}
                    style={{ width:'100%', borderRadius:8,
                      background: day.registered ? scoreColor(day.score) : theme.surface2,
                      boxShadow: isToday ? `0 0 8px ${theme.primary}60` : 'none',
                      border: isToday ? `2px solid ${theme.primary}` : '2px solid transparent',
                    }} />
                  {/* Día */}
                  <span style={{ fontSize:10, fontWeight:700,
                    color: isToday ? theme.primary : theme.textMuted }}>{dayName}</span>
                  {/* Punto entreno */}
                  {day.workout && (
                    <div style={{ width:5, height:5, borderRadius:'50%', background:'#6366F1' }} />
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          // HEATMAP 30 DÍAS
          <div style={{ display:'grid', gridTemplateColumns:'repeat(10,1fr)', gap:4 }}>
            {monthData.map((day) => {
              const isToday = day.date === new Date().toISOString().split('T')[0]
              return (
                <motion.div key={day.date}
                  initial={{ scale:0 }} animate={{ scale:1 }}
                  transition={{ duration:0.2 }}
                  title={`${day.date} — Score: ${Math.round(day.score*100)}%`}
                  style={{ aspectRatio:'1', borderRadius:6,
                    background: day.registered ? scoreColor(day.score) : theme.surface2,
                    border: isToday ? `2px solid ${theme.primary}` : '2px solid transparent',
                    opacity: day.registered ? 1 : 0.4,
                  }} />
              )
            })}
          </div>
        )}

        {/* Leyenda */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginTop:12, justifyContent:'center' }}>
          {[['#2EC4B6','Excelente'],['#F59E0B','Moderado'],['#EF4444','Bajo']].map(([color,label]) => (
            <div key={label} style={{ display:'flex', alignItems:'center', gap:4 }}>
              <div style={{ width:10, height:10, borderRadius:3, background:color }} />
              <span style={{ fontSize:9, color:theme.textMuted, fontWeight:600 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Mejor día de la semana */}
      {viewMode==='week' && bestDay?.registered && (
        <div style={{ background:`${theme.primary}10`, borderRadius:18, padding:'12px 16px',
          border:`1px solid ${theme.primary}25`, display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:28 }}>🏆</span>
          <div>
            <p style={{ fontSize:13, fontWeight:800, color:theme.text, margin:'0 0 2px' }}>
              Mejor día: {new Date(bestDay.date+'T12:00:00').toLocaleDateString('es-ES',{weekday:'long'})}
            </p>
            <p style={{ fontSize:11, color:theme.textMuted, margin:0 }}>
              Score {Math.round(bestDay.score*100)}% · {bestDay.workout?'Entrenaste ✓ · ':''}
              {bestDay.mood ? `Ánimo ${MOOD_EMOJIS[bestDay.mood]}` : ''}
            </p>
          </div>
        </div>
      )}

      {/* Tendencia calorías */}
      {weekData.some(d=>d.cal>0) && (
        <div style={{ background:theme.surface, borderRadius:20, padding:16, border:`1px solid ${theme.border}` }}>
          <p style={{ fontSize:12, fontWeight:700, color:theme.text, margin:'0 0 12px' }}>
            Calorías esta semana
          </p>
          <div style={{ display:'flex', gap:6, alignItems:'flex-end', height:60 }}>
            {weekData.map((day, i) => {
              const date    = new Date(day.date+'T12:00:00')
              const dayName = ['L','M','X','J','V','S','D'][date.getDay()===0?6:date.getDay()-1]
              const maxCal  = Math.max(...weekData.map(d=>d.cal), 2000)
              const h       = day.cal > 0 ? Math.max((day.cal/maxCal)*50, 4) : 4
              const color   = day.cal > 2200 ? '#EF4444' : day.cal > 1500 ? '#2EC4B6' : day.cal > 0 ? '#F59E0B' : theme.surface2
              return (
                <div key={day.date} style={{ flex:1, display:'flex', flexDirection:'column',
                  alignItems:'center', gap:3 }}>
                  {day.cal > 0 && (
                    <span style={{ fontSize:8, color:theme.textMuted, fontWeight:700 }}>
                      {Math.round(day.cal/100)/10}k
                    </span>
                  )}
                  <motion.div initial={{ height:0 }} animate={{ height:h }}
                    transition={{ duration:0.4, delay:i*0.06 }}
                    style={{ width:'100%', borderRadius:5, background:color }} />
                  <span style={{ fontSize:9, color:theme.textMuted, fontWeight:600 }}>{dayName}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function Calendar() {
  const { user, profile } = useStore()
  const { theme }         = useTheme()

  const now   = new Date()
  const today = now.toISOString().split('T')[0]

  const [year,      setYear]      = useState(now.getFullYear())
  const [month,     setMonth]     = useState(now.getMonth())
  const [selected,  setSelected]  = useState(today)
  const [events,    setEvents]    = useState([])
  const [moodLogs,  setMoodLogs]  = useState({})
  const [sleepLogs, setSleepLogs] = useState({})
  const [showForm,  setShowForm]  = useState(false)
  const [editEvent, setEditEvent] = useState(null)
  const [calView,   setCalView]   = useState('month') // month | agenda
  const [mainTab,   setMainTab]   = useState('calendar') // calendar | history | cycle

  // Ciclos solo si género femenino o no especificado
  const showCycleTab = profile?.gender !== 'male'

  const load = useCallback(async () => {
    if (!user) return
    const from = toDateStr(year, month, 1)
    const to   = toDateStr(year, month, getDaysInMonth(year, month))
    const [eventsR, moodR, sleepR] = await Promise.all([
      supabase.from('calendar_events').select('*')
        .eq('user_id',user.id).gte('date',from).lte('date',to)
        .order('date').order('time',{nullsFirst:true}),
      supabase.from('mood_logs').select('date,mood')
        .eq('user_id',user.id).gte('date',from).lte('date',to),
      supabase.from('sleep_logs').select('date,hours')
        .eq('user_id',user.id).gte('date',from).lte('date',to),
    ])
    if (eventsR.error) {
      toast.error('No se pudieron cargar los eventos: '+eventsR.error.message)
    }
    setEvents(eventsR.data||[])
    const moodMap={}; (moodR.data||[]).forEach(l=>{moodMap[l.date]=l.mood})
    const sleepMap={}; (sleepR.data||[]).forEach(l=>{sleepMap[l.date]=l.hours})
    setMoodLogs(moodMap); setSleepLogs(sleepMap)
  }, [user, year, month])

  useEffect(() => { load() }, [load])

  const dayEvents       = events.filter(e => e.date === selected)
  const todayEventCount = events.filter(e => e.date === today).length

  function eventsForDay(ds) { return events.filter(e => e.date === ds) }

  async function saveEvent(data) {
    let error
    if (data.id) {
      const res = await supabase.from('calendar_events').update(data).eq('id',data.id)
      error = res.error
    } else {
      const { id, ...insertData } = data
      const res = await supabase.from('calendar_events').insert({...insertData, user_id:user.id})
      error = res.error
    }
    if (error) { toast.error('No se pudo guardar: '+error.message); return false }
    toast.success(data.id ? 'Evento actualizado' : 'Evento guardado')
    await load(); scheduleNotification(data); return true
  }

  async function deleteEvent(id) {
    const { error } = await supabase.from('calendar_events').delete().eq('id',id)
    if (error) { toast.error('No se pudo eliminar: '+error.message); return }
    toast.success('Evento eliminado'); await load()
  }

  function scheduleNotification(event) {
    if (!event.time||!event.reminder_minutes) return
    if (!('Notification' in window)) return
    if (Notification.permission!=='granted') { Notification.requestPermission(); return }
    const eventTime = new Date(`${event.date}T${event.time}`)
    const notifTime = new Date(eventTime.getTime() - event.reminder_minutes*60000)
    const delay     = notifTime - new Date()
    if (delay>0) setTimeout(() => {
      new Notification(`🐼 ${event.title}`,{
        body:event.description||`En ${event.reminder_minutes} minutos`,
        icon:'/icons/icon-192.png',
      })
    }, delay)
  }

  function prevMonth() { if(month===0){setYear(y=>y-1);setMonth(11)}else setMonth(m=>m-1) }
  function nextMonth() { if(month===11){setYear(y=>y+1);setMonth(0)}else setMonth(m=>m+1) }

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay    = getFirstDay(year, month)

  // Tabs del organizador
  const tabs = [
    { id:'calendar', label:'Calendario', icon:CalendarIcon },
    { id:'history',  label:'Historial',  icon:BarChart2    },
    ...(showCycleTab ? [{ id:'cycle', label:'Ciclos', icon:Moon }] : []),
  ]

  return (
    <div className="page pb-32">

      <PandaGreeting profile={profile} theme={theme} eventCount={todayEventCount} />

      {/* Header + título */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-extrabold" style={{ color:theme.text }}>Organizador</h1>
        {mainTab === 'calendar' && (
          <div className="flex items-center gap-2">
            <button onClick={() => setCalView(v => v==='month'?'agenda':'month')}
              className="text-xs px-3 py-1.5 rounded-xl font-semibold"
              style={{ background:theme.surface2, color:theme.textMuted }}>
              {calView==='month' ? '📋 Agenda' : '📅 Mes'}
            </button>
            <motion.button whileTap={{ scale:0.9 }}
              onClick={() => { setEditEvent(null); setShowForm(true) }}
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background:theme.primary }}>
              <Plus size={18} color="#fff" />
            </motion.button>
          </div>
        )}
      </div>

      {/* Tabs principales */}
      <div style={{ display:'flex', gap:6, marginBottom:16, overflowX:'auto', scrollbarWidth:'none' }}>
        {tabs.map(({ id, label, icon:Icon }) => (
          <button key={id} onClick={() => setMainTab(id)}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px',
              borderRadius:20, border:'none', cursor:'pointer', flexShrink:0,
              fontSize:12, fontWeight:700, transition:'all 0.2s',
              background: mainTab===id ? theme.primary : theme.surface,
              color: mainTab===id ? 'white' : theme.textMuted,
              boxShadow: mainTab===id ? `0 4px 12px ${theme.primary}30` : 'none' }}>
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* ── TAB CALENDARIO ── */}
      {mainTab === 'calendar' && (
        <>
          {calView === 'month' && (
            <div className="card mb-4">
              <div className="flex items-center justify-between mb-4">
                <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-xl"
                  style={{ background:theme.surface2 }}>
                  <ChevronLeft size={16} style={{ color:theme.text }} />
                </button>
                <p className="font-extrabold text-sm" style={{ color:theme.text }}>
                  {MONTHS[month]} {year}
                </p>
                <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-xl"
                  style={{ background:theme.surface2 }}>
                  <ChevronRight size={16} style={{ color:theme.text }} />
                </button>
              </div>
              <div className="grid grid-cols-7 mb-1">
                {DAYS.map(d => (
                  <div key={d} className="text-center text-[10px] font-bold py-1"
                    style={{ color:theme.textMuted }}>{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {Array.from({length:firstDay}).map((_,i) => <div key={`e${i}`} />)}
                {Array.from({length:daysInMonth}).map((_,i) => {
                  const day     = i+1
                  const dateStr = toDateStr(year, month, day)
                  const isToday = dateStr===today
                  const isSel   = dateStr===selected
                  const dayEvs  = eventsForDay(dateStr)
                  const mood    = moodLogs[dateStr]
                  const sleep   = sleepLogs[dateStr]
                  return (
                    <motion.button key={day} whileTap={{ scale:0.85 }}
                      onClick={() => setSelected(dateStr)}
                      className="rounded-xl flex flex-col items-center justify-center py-1 relative"
                      style={{
                        background: isSel ? theme.primary : isToday ? `${theme.primary}15` : 'transparent',
                        border:`2px solid ${isSel ? theme.primary : isToday ? theme.primary+'50' : 'transparent'}`,
                        minHeight:44,
                      }}>
                      <span className="text-[11px] font-bold"
                        style={{ color:isSel?'#fff':isToday?theme.primary:theme.text }}>{day}</span>
                      {mood && <span style={{ fontSize:8, lineHeight:1 }}>{MOOD_EMOJIS[mood]}</span>}
                      {dayEvs.length>0 && (
                        <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                          {dayEvs.slice(0,3).map((ev,j) => {
                            const cat = CATEGORIES.find(c=>c.id===ev.category)
                            return <div key={j} className="w-1.5 h-1.5 rounded-full"
                              style={{ background:isSel?'#fff':(cat?.color||theme.primary) }} />
                          })}
                        </div>
                      )}
                      {sleep && !mood && !dayEvs.length && (
                        <div className="w-1.5 h-1.5 rounded-full mt-0.5"
                          style={{ background:isSel?'#fff':'#818CF8' }} />
                      )}
                    </motion.button>
                  )
                })}
              </div>
            </div>
          )}

          {calView === 'agenda' && (
            <AgendaView events={events} theme={theme} today={today}
              onSelect={setSelected}
              onEdit={ev => { setEditEvent(ev); setShowForm(true) }}
              onDelete={deleteEvent} />
          )}

          <DayPanel date={selected} events={dayEvents}
            mood={moodLogs[selected]} sleep={sleepLogs[selected]}
            theme={theme} today={today}
            onAdd={() => { setEditEvent(null); setShowForm(true) }}
            onEdit={ev => { setEditEvent(ev); setShowForm(true) }}
            onDelete={deleteEvent} />
        </>
      )}

      {/* ── TAB HISTORIAL ── */}
      {mainTab === 'history' && (
        <WeeklyHistory userId={user?.id} theme={theme} />
      )}

      {/* ── TAB CICLOS ── */}
      {mainTab === 'cycle' && showCycleTab && (
        <CycleTab theme={theme} userId={user?.id} />
      )}

      <AnimatePresence>
        {showForm && (
          <EventForm theme={theme} date={selected} event={editEvent}
            onSave={async data => { const ok=await saveEvent(data); if(ok) setShowForm(false) }}
            onClose={() => setShowForm(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── PANEL DÍA ────────────────────────────────────────────────────────────────
function DayPanel({ date, events, mood, sleep, theme, today, onAdd, onEdit, onDelete }) {
  const isToday = date===today
  const MOOD_MAP = {1:'😩 Hundido',2:'😞 Bajo',3:'😐 Normal',4:'😊 Bien',5:'🤩 Genial'}
  return (
    <div className="card mb-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-extrabold text-sm" style={{ color:theme.text }}>
            {isToday ? 'Hoy' : formatDateLong(date)}
          </p>
          {!isToday && (
            <p className="text-xs" style={{ color:theme.textMuted }}>{formatDateLong(date)}</p>
          )}
        </div>
        <motion.button whileTap={{ scale:0.9 }} onClick={onAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
          style={{ background:`${theme.primary}15`, color:theme.primary }}>
          <Plus size={12} /> Añadir
        </motion.button>
      </div>
      {(mood||sleep) && (
        <div className="flex gap-2 mb-3">
          {mood && <div className="px-2.5 py-1.5 rounded-xl text-xs font-semibold"
            style={{ background:theme.surface2, color:theme.text }}>{MOOD_MAP[mood]}</div>}
          {sleep && <div className="px-2.5 py-1.5 rounded-xl text-xs font-semibold"
            style={{ background:theme.surface2, color:theme.text }}>😴 {sleep}h</div>}
        </div>
      )}
      {events.length===0
        ? <p className="text-xs text-center py-4" style={{ color:theme.textMuted }}>Sin eventos — toca + para añadir</p>
        : <div className="space-y-2">{events.map(ev => (
            <EventCard key={ev.id} event={ev} theme={theme}
              onEdit={() => onEdit(ev)} onDelete={() => onDelete(ev.id)} />
          ))}</div>
      }
    </div>
  )
}

// ─── TARJETA EVENTO ──────────────────────────────────────────────────────────
function EventCard({ event, theme, onEdit, onDelete }) {
  const cat = CATEGORIES.find(c=>c.id===event.category)||CATEGORIES[6]
  return (
    <motion.div whileTap={{ scale:0.98 }}
      className="flex items-center gap-3 p-3 rounded-2xl"
      style={{ background:`${cat.color}10`, border:`1px solid ${cat.color}30` }}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
        style={{ background:`${cat.color}20` }}>{cat.emoji}</div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm" style={{ color:theme.text }}>{event.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {event.time && <span className="text-[10px] flex items-center gap-0.5" style={{ color:theme.textMuted }}>
            <Clock size={10} /> {formatTime(event.time)}</span>}
          {event.reminder_minutes>0 && <span className="text-[10px] flex items-center gap-0.5" style={{ color:theme.textMuted }}>
            <Bell size={10} /> {REMINDERS.find(r=>r.val===event.reminder_minutes)?.label||''}</span>}
        </div>
        {event.description && <p className="text-[10px] mt-0.5 truncate" style={{ color:theme.textMuted }}>{event.description}</p>}
      </div>
      <div className="flex gap-1 flex-shrink-0">
        <button onClick={onEdit} className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background:theme.surface2 }}><Tag size={12} style={{ color:theme.textMuted }} /></button>
        <button onClick={onDelete} className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background:theme.surface2 }}><X size={12} style={{ color:theme.textMuted }} /></button>
      </div>
    </motion.div>
  )
}

// ─── VISTA AGENDA ────────────────────────────────────────────────────────────
function AgendaView({ events, theme, today, onSelect, onEdit, onDelete }) {
  const upcoming = events.filter(e=>e.date>=today)
    .sort((a,b)=>a.date.localeCompare(b.date)||(a.time||'').localeCompare(b.time||''))
  if (!upcoming.length) return (
    <div className="card mb-4 text-center py-8">
      <p className="text-3xl mb-2">🗓️</p>
      <p className="text-sm font-semibold" style={{ color:theme.text }}>Sin eventos próximos</p>
      <p className="text-xs mt-1" style={{ color:theme.textMuted }}>Añade tu primera cita o recordatorio</p>
    </div>
  )
  let lastDate=null
  return (
    <div className="space-y-2 mb-4">
      {upcoming.map(ev => {
        const showHeader = ev.date!==lastDate; lastDate=ev.date
        return (
          <div key={ev.id}>
            {showHeader && <p className="text-xs font-bold px-1 py-2" style={{ color:theme.textMuted }}>
              {ev.date===today?'Hoy':formatDateLong(ev.date)}</p>}
            <EventCard event={ev} theme={theme}
              onEdit={()=>{onSelect(ev.date);onEdit(ev)}}
              onDelete={()=>onDelete(ev.id)} />
          </div>
        )
      })}
    </div>
  )
}

// ─── FORMULARIO EVENTO ───────────────────────────────────────────────────────
function EventForm({ theme, date, event, onSave, onClose }) {
  const [form, setForm] = useState({
    id:               event?.id||null,
    date:             event?.date||date,
    time:             event?.time||'',
    title:            event?.title||'',
    description:      event?.description||'',
    category:         event?.category||'general',
    reminder_minutes: event?.reminder_minutes??30,
  })
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  async function handleSave() {
    if (!form.title.trim()) return
    if ('Notification' in window && Notification.permission==='default') {
      await Notification.requestPermission()
    }
    const ok = await onSave(form)
    if (ok) onClose()
  }

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background:'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <motion.div initial={{ y:'100%' }} animate={{ y:0 }} exit={{ y:'100%' }}
        transition={{ type:'spring', damping:30, stiffness:300 }}
        className="w-full max-w-lg rounded-t-3xl max-h-[88vh] flex flex-col"
        style={{ background:theme.bg }} onClick={e=>e.stopPropagation()}>
        <div className="overflow-y-auto flex-1 p-5">
          <div className="flex items-center justify-between mb-5">
            <p className="font-extrabold text-base" style={{ color:theme.text }}>
              {event?'Editar evento':'Nuevo evento'}
            </p>
            <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background:theme.surface2 }}>
              <X size={16} style={{ color:theme.textMuted }} />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="label">Título *</label>
              <input className="input" placeholder="Ej: Cita médica, Entreno…"
                value={form.title} onChange={e=>set('title',e.target.value)} />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="label">Fecha</label>
                <input className="input" type="date" value={form.date} onChange={e=>set('date',e.target.value)} />
              </div>
              <div className="flex-1">
                <label className="label">Hora</label>
                <input className="input" type="time" value={form.time} onChange={e=>set('time',e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label">Categoría</label>
              <div className="grid grid-cols-4 gap-2">
                {CATEGORIES.map(c => (
                  <button key={c.id} onClick={()=>set('category',c.id)}
                    className="flex flex-col items-center gap-1 py-2.5 rounded-2xl transition-all"
                    style={{ background:form.category===c.id?`${c.color}20`:theme.surface2,
                      border:`2px solid ${form.category===c.id?c.color:'transparent'}` }}>
                    <span style={{ fontSize:20 }}>{c.emoji}</span>
                    <span className="text-[9px] font-semibold"
                      style={{ color:form.category===c.id?c.color:theme.textMuted }}>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Recordatorio</label>
              <div className="grid grid-cols-3 gap-2">
                {REMINDERS.map(r => (
                  <button key={r.val} onClick={()=>set('reminder_minutes',r.val)}
                    className="py-2 rounded-xl text-xs font-semibold transition-all"
                    style={{ background:form.reminder_minutes===r.val?`${theme.primary}20`:theme.surface2,
                      color:form.reminder_minutes===r.val?theme.primary:theme.textMuted,
                      border:`2px solid ${form.reminder_minutes===r.val?theme.primary:'transparent'}` }}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Notas (opcional)</label>
              <textarea className="input resize-none" rows={2} placeholder="Detalles adicionales…"
                value={form.description} onChange={e=>set('description',e.target.value)} />
            </div>
          </div>
        </div>
        <div style={{ padding:'12px 20px', paddingBottom:'calc(env(safe-area-inset-bottom) + 80px)',
          background:theme.bg, borderTop:`1px solid ${theme.border||'rgba(0,0,0,0.06)'}`, flexShrink:0 }}>
          <motion.button whileTap={{ scale:0.97 }} onClick={handleSave}
            disabled={!form.title.trim()}
            className="w-full py-3.5 rounded-2xl font-bold text-white disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ background:`linear-gradient(135deg, ${theme.primary}, #FF8FA3)` }}>
            <Check size={16} /> {event?'Actualizar':'Guardar evento'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}
