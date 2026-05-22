import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Plus, Bell, X, Check, Clock, Tag } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useStore } from '../store/useStore'
import { useTheme } from '../contexts/ThemeProvider'
import CycleTab from '../components/mood/CycleTab'

// ─── CONSTANTES ───────────────────────────────────────────────────────────────

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DAYS   = ['L','M','X','J','V','S','D']

const CATEGORIES = [
  { id: 'health',    emoji: '💊', label: 'Salud',       color: '#EF4444' },
  { id: 'workout',   emoji: '💪', label: 'Entreno',     color: '#6366F1' },
  { id: 'nutrition', emoji: '🥗', label: 'Nutrición',   color: '#F97316' },
  { id: 'sleep',     emoji: '😴', label: 'Sueño',       color: '#818CF8' },
  { id: 'mood',      emoji: '🧘', label: 'Bienestar',   color: '#2EC4B6' },
  { id: 'medical',   emoji: '🏥', label: 'Médico',      color: '#EC4899' },
  { id: 'general',   emoji: '📌', label: 'General',     color: '#F59E0B' },
]

const REMINDERS = [
  { val: 0,    label: 'En el momento' },
  { val: 10,   label: '10 min antes'  },
  { val: 30,   label: '30 min antes'  },
  { val: 60,   label: '1h antes'      },
  { val: 1440, label: '1 día antes'   },
]

const PET_EMOJI = { panda:'🐼', cat:'🐱', dog:'🐶', fox:'🦊', rabbit:'🐰' }

function getDaysInMonth(y, m) { return new Date(y, m + 1, 0).getDate() }
function getFirstDay(y, m)    { const d = new Date(y, m, 1).getDay(); return d === 0 ? 6 : d - 1 }
function toDateStr(y, m, d)   { return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}` }
function formatTime(t)        { return t ? t.slice(0,5) : '' }
function formatDateLong(ds)   {
  return new Date(ds + 'T12:00:00').toLocaleDateString('es-ES', { weekday:'long', day:'numeric', month:'long' })
}

// ─── PANDA FRAME ─────────────────────────────────────────────────────────────

function PandaGreeting({ profile, theme, eventCount }) {
  const hour     = new Date().getHours()
  const petEmoji = PET_EMOJI[profile?.pet_type] || '🐼'
  const petName  = profile?.pet_name || 'Pandi'

  const msg = eventCount > 0
    ? `Tienes ${eventCount} evento${eventCount > 1 ? 's' : ''} hoy. ¡A por ello! 💪`
    : hour < 12 ? `Buenos días, ${profile?.name?.split(' ')[0] || ''}. ¿Qué tienes planeado hoy?`
    : hour < 20 ? `¿Cómo va el día, ${profile?.name?.split(' ')[0] || ''}?`
    : `Buenas noches. Revisa lo de mañana antes de dormir 🌙`

  return (
    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 p-4 rounded-2xl mb-4"
      style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>
      <motion.span
        animate={{ rotate: [0, 10, -10, 10, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 5 }}
        style={{ fontSize: 38, flexShrink: 0 }}>
        {petEmoji}
      </motion.span>
      <div className="flex-1 min-w-0">
        <p className="font-extrabold text-sm" style={{ color: theme.text }}>{petName}</p>
        <p className="text-xs leading-relaxed mt-0.5" style={{ color: theme.textMuted }}>{msg}</p>
      </div>
    </motion.div>
  )
}

// ─── CALENDARIO PRINCIPAL ────────────────────────────────────────────────────

export default function Calendar() {
  const { user, profile } = useStore()
  const { theme }         = useTheme()

  const now   = new Date()
  const today = now.toISOString().split('T')[0]

  const [year,       setYear]       = useState(now.getFullYear())
  const [month,      setMonth]      = useState(now.getMonth())
  const [selected,   setSelected]   = useState(today)
  const [events,     setEvents]     = useState([])
  const [moodLogs,   setMoodLogs]   = useState({})
  const [sleepLogs,  setSleepLogs]  = useState({})
  const [showForm,   setShowForm]   = useState(false)
  const [editEvent,  setEditEvent]  = useState(null)
  const [view,       setView]       = useState('month') // month | agenda
  const [showCycle,  setShowCycle]  = useState(false)

  const hasCycle = profile?.menstrual_tracking_enabled

  // ─── CARGA ────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    if (!user) return
    const from = toDateStr(year, month, 1)
    const to   = toDateStr(year, month, getDaysInMonth(year, month))

    const [eventsR, moodR, sleepR] = await Promise.all([
      supabase.from('calendar_events').select('*')
        .eq('user_id', user.id).gte('date', from).lte('date', to)
        .order('date').order('time', { nullsFirst: true }),
      supabase.from('mood_logs').select('date,mood')
        .eq('user_id', user.id).gte('date', from).lte('date', to),
      supabase.from('sleep_logs').select('date,hours')
        .eq('user_id', user.id).gte('date', from).lte('date', to),
    ])

    setEvents(eventsR.data || [])
    const moodMap = {}; (moodR.data || []).forEach(l => { moodMap[l.date] = l.mood })
    const sleepMap = {}; (sleepR.data || []).forEach(l => { sleepMap[l.date] = l.hours })
    setMoodLogs(moodMap)
    setSleepLogs(sleepMap)
  }, [user, year, month])

  useEffect(() => { load() }, [load])

  // ─── EVENTOS DEL DÍA SELECCIONADO ────────────────────────────────────────

  const dayEvents = events.filter(e => e.date === selected)
  const todayEventCount = events.filter(e => e.date === today).length

  function eventsForDay(dateStr) { return events.filter(e => e.date === dateStr) }

  // ─── GUARDAR EVENTO ───────────────────────────────────────────────────────

  async function saveEvent(data) {
    if (data.id) {
      await supabase.from('calendar_events').update(data).eq('id', data.id)
    } else {
      await supabase.from('calendar_events').insert({ ...data, user_id: user.id })
    }
    await load()
    scheduleNotification(data)
  }

  async function deleteEvent(id) {
    await supabase.from('calendar_events').delete().eq('id', id)
    await load()
  }

  // ─── NOTIFICACIÓN PUSH ───────────────────────────────────────────────────

  function scheduleNotification(event) {
    if (!event.time || !event.reminder_minutes) return
    if (!('Notification' in window)) return
    if (Notification.permission !== 'granted') {
      Notification.requestPermission()
      return
    }
    const eventTime = new Date(`${event.date}T${event.time}`)
    const notifTime = new Date(eventTime.getTime() - event.reminder_minutes * 60000)
    const now       = new Date()
    const delay     = notifTime - now
    if (delay > 0) {
      setTimeout(() => {
        new Notification(`🐼 ${event.title}`, {
          body: event.description || `En ${event.reminder_minutes} minutos`,
          icon: '/icons/icon-192.png',
        })
      }, delay)
    }
  }

  // ─── NAVEGACIÓN MES ──────────────────────────────────────────────────────

  function prevMonth() {
    if (month === 0) { setYear(y => y-1); setMonth(11) }
    else setMonth(m => m-1)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y+1); setMonth(0) }
    else setMonth(m => m+1)
  }

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay    = getFirstDay(year, month)

  const MOOD_EMOJIS = { 1:'😩', 2:'😞', 3:'😐', 4:'😊', 5:'🤩' }

  return (
    <div className="page pb-32">

      {/* Panda greeting */}
      <PandaGreeting profile={profile} theme={theme} eventCount={todayEventCount} />

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-extrabold" style={{ color: theme.text }}>Organizador</h1>
        <div className="flex items-center gap-2">
          {/* Toggle ciclo si aplica */}
          {hasCycle && (
            <button onClick={() => setShowCycle(s => !s)}
              className="text-xs px-3 py-1.5 rounded-xl font-semibold"
              style={{
                background: showCycle ? '#FEE2E2' : theme.surface2,
                color: showCycle ? '#EF4444' : theme.textMuted,
              }}>
              🩸 Ciclo
            </button>
          )}
          {/* Toggle vista */}
          <button onClick={() => setView(v => v === 'month' ? 'agenda' : 'month')}
            className="text-xs px-3 py-1.5 rounded-xl font-semibold"
            style={{ background: theme.surface2, color: theme.textMuted }}>
            {view === 'month' ? '📋 Agenda' : '📅 Mes'}
          </button>
          {/* Nuevo evento */}
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setEditEvent(null); setShowForm(true) }}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: theme.primary }}>
            <Plus size={18} color="#fff" />
          </motion.button>
        </div>
      </div>

      {/* Vista ciclo */}
      {showCycle && hasCycle && (
        <div className="mb-4">
          <CycleTab theme={theme} />
        </div>
      )}

      {/* VISTA MES */}
      {view === 'month' && (
        <div className="card mb-4">
          {/* Navegación mes */}
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
              const dateStr = toDateStr(year, month, day)
              const isToday = dateStr === today
              const isSel   = dateStr === selected
              const dayEvs  = eventsForDay(dateStr)
              const mood    = moodLogs[dateStr]
              const sleep   = sleepLogs[dateStr]

              return (
                <motion.button key={day} whileTap={{ scale: 0.85 }}
                  onClick={() => setSelected(dateStr)}
                  className="rounded-xl flex flex-col items-center justify-center py-1 relative"
                  style={{
                    background: isSel ? theme.primary : isToday ? `${theme.primary}15` : 'transparent',
                    border: `2px solid ${isSel ? theme.primary : isToday ? theme.primary + '50' : 'transparent'}`,
                    minHeight: 44,
                  }}>
                  <span className="text-[11px] font-bold"
                    style={{ color: isSel ? '#fff' : isToday ? theme.primary : theme.text }}>
                    {day}
                  </span>
                  {/* Mood emoji pequeño */}
                  {mood && (
                    <span style={{ fontSize: 8, lineHeight: 1 }}>{MOOD_EMOJIS[mood]}</span>
                  )}
                  {/* Dots eventos */}
                  {dayEvs.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                      {dayEvs.slice(0,3).map((ev, j) => {
                        const cat = CATEGORIES.find(c => c.id === ev.category)
                        return (
                          <div key={j} className="w-1.5 h-1.5 rounded-full"
                            style={{ background: isSel ? '#fff' : (cat?.color || theme.primary) }} />
                        )
                      })}
                    </div>
                  )}
                  {/* Punto sueño */}
                  {sleep && !mood && !dayEvs.length && (
                    <div className="w-1.5 h-1.5 rounded-full mt-0.5"
                      style={{ background: isSel ? '#fff' : '#818CF8' }} />
                  )}
                </motion.button>
              )
            })}
          </div>
        </div>
      )}

      {/* VISTA AGENDA */}
      {view === 'agenda' && (
        <AgendaView
          events={events}
          theme={theme}
          today={today}
          onSelect={setSelected}
          onEdit={(ev) => { setEditEvent(ev); setShowForm(true) }}
          onDelete={deleteEvent}
        />
      )}

      {/* Panel día seleccionado */}
      <DayPanel
        date={selected}
        events={dayEvents}
        mood={moodLogs[selected]}
        sleep={sleepLogs[selected]}
        theme={theme}
        today={today}
        onAdd={() => { setEditEvent(null); setShowForm(true) }}
        onEdit={(ev) => { setEditEvent(ev); setShowForm(true) }}
        onDelete={deleteEvent}
      />

      {/* Modal nuevo/editar evento */}
      <AnimatePresence>
        {showForm && (
          <EventForm
            theme={theme}
            date={selected}
            event={editEvent}
            onSave={async (data) => { await saveEvent(data); setShowForm(false) }}
            onClose={() => setShowForm(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── PANEL DÍA ────────────────────────────────────────────────────────────────

function DayPanel({ date, events, mood, sleep, theme, today, onAdd, onEdit, onDelete }) {
  const isToday = date === today
  const MOOD_MAP = { 1:'😩 Hundido', 2:'😞 Bajo', 3:'😐 Normal', 4:'😊 Bien', 5:'🤩 Genial' }

  return (
    <div className="card mb-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-extrabold text-sm" style={{ color: theme.text }}>
            {isToday ? 'Hoy' : formatDateLong(date)}
          </p>
          {!isToday && (
            <p className="text-xs" style={{ color: theme.textMuted }}>
              {formatDateLong(date)}
            </p>
          )}
        </div>
        <motion.button whileTap={{ scale: 0.9 }} onClick={onAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
          style={{ background: `${theme.primary}15`, color: theme.primary }}>
          <Plus size={12} /> Añadir
        </motion.button>
      </div>

      {/* Stats del día */}
      {(mood || sleep) && (
        <div className="flex gap-2 mb-3">
          {mood && (
            <div className="px-2.5 py-1.5 rounded-xl text-xs font-semibold"
              style={{ background: theme.surface2, color: theme.text }}>
              {MOOD_MAP[mood]}
            </div>
          )}
          {sleep && (
            <div className="px-2.5 py-1.5 rounded-xl text-xs font-semibold"
              style={{ background: theme.surface2, color: theme.text }}>
              😴 {sleep}h
            </div>
          )}
        </div>
      )}

      {/* Eventos */}
      {events.length === 0 ? (
        <p className="text-xs text-center py-4" style={{ color: theme.textMuted }}>
          Sin eventos — toca + para añadir
        </p>
      ) : (
        <div className="space-y-2">
          {events.map(ev => (
            <EventCard key={ev.id} event={ev} theme={theme}
              onEdit={() => onEdit(ev)} onDelete={() => onDelete(ev.id)} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── TARJETA EVENTO ──────────────────────────────────────────────────────────

function EventCard({ event, theme, onEdit, onDelete }) {
  const cat = CATEGORIES.find(c => c.id === event.category) || CATEGORIES[6]
  return (
    <motion.div whileTap={{ scale: 0.98 }}
      className="flex items-center gap-3 p-3 rounded-2xl"
      style={{ background: `${cat.color}10`, border: `1px solid ${cat.color}30` }}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
        style={{ background: `${cat.color}20` }}>
        {cat.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm" style={{ color: theme.text }}>{event.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {event.time && (
            <span className="text-[10px] flex items-center gap-0.5" style={{ color: theme.textMuted }}>
              <Clock size={10} /> {formatTime(event.time)}
            </span>
          )}
          {event.reminder_minutes > 0 && (
            <span className="text-[10px] flex items-center gap-0.5" style={{ color: theme.textMuted }}>
              <Bell size={10} /> {REMINDERS.find(r => r.val === event.reminder_minutes)?.label || ''}
            </span>
          )}
        </div>
        {event.description && (
          <p className="text-[10px] mt-0.5 truncate" style={{ color: theme.textMuted }}>
            {event.description}
          </p>
        )}
      </div>
      <div className="flex gap-1 flex-shrink-0">
        <button onClick={onEdit} className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: theme.surface2 }}>
          <Tag size={12} style={{ color: theme.textMuted }} />
        </button>
        <button onClick={onDelete} className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: theme.surface2 }}>
          <X size={12} style={{ color: theme.textMuted }} />
        </button>
      </div>
    </motion.div>
  )
}

// ─── VISTA AGENDA ────────────────────────────────────────────────────────────

function AgendaView({ events, theme, today, onSelect, onEdit, onDelete }) {
  const upcoming = events
    .filter(e => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''))

  if (upcoming.length === 0) {
    return (
      <div className="card mb-4 text-center py-8">
        <p className="text-3xl mb-2">🗓️</p>
        <p className="text-sm font-semibold" style={{ color: theme.text }}>Sin eventos próximos</p>
        <p className="text-xs mt-1" style={{ color: theme.textMuted }}>Añade tu primera cita o recordatorio</p>
      </div>
    )
  }

  let lastDate = null
  return (
    <div className="space-y-2 mb-4">
      {upcoming.map(ev => {
        const showHeader = ev.date !== lastDate
        lastDate = ev.date
        const cat = CATEGORIES.find(c => c.id === ev.category) || CATEGORIES[6]
        return (
          <div key={ev.id}>
            {showHeader && (
              <p className="text-xs font-bold px-1 py-2" style={{ color: theme.textMuted }}>
                {ev.date === today ? 'Hoy' : formatDateLong(ev.date)}
              </p>
            )}
            <EventCard event={ev} theme={theme}
              onEdit={() => { onSelect(ev.date); onEdit(ev) }}
              onDelete={() => onDelete(ev.id)} />
          </div>
        )
      })}
    </div>
  )
}

// ─── FORMULARIO EVENTO ───────────────────────────────────────────────────────

function EventForm({ theme, date, event, onSave, onClose }) {
  const [form, setForm] = useState({
    id:               event?.id || null,
    date:             event?.date || date,
    time:             event?.time || '',
    title:            event?.title || '',
    description:      event?.description || '',
    category:         event?.category || 'general',
    reminder_minutes: event?.reminder_minutes ?? 30,
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSave() {
    if (!form.title.trim()) return
    // Pedir permisos de notificación
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission()
    }
    await onSave(form)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}>
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="w-full max-w-lg rounded-t-3xl p-5 max-h-[90vh] overflow-y-auto"
        style={{ background: theme.bg }}
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between mb-5">
          <p className="font-extrabold text-base" style={{ color: theme.text }}>
            {event ? 'Editar evento' : 'Nuevo evento'}
          </p>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: theme.surface2 }}>
            <X size={16} style={{ color: theme.textMuted }} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Título */}
          <div>
            <label className="label">Título *</label>
            <input className="input" placeholder="Ej: Cita médica, Entreno, Tomar pastilla…"
              value={form.title} onChange={e => set('title', e.target.value)} />
          </div>

          {/* Fecha y hora */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="label">Fecha</label>
              <input className="input" type="date" value={form.date}
                onChange={e => set('date', e.target.value)} />
            </div>
            <div className="flex-1">
              <label className="label">Hora</label>
              <input className="input" type="time" value={form.time}
                onChange={e => set('time', e.target.value)} />
            </div>
          </div>

          {/* Categoría */}
          <div>
            <label className="label">Categoría</label>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map(c => (
                <button key={c.id} onClick={() => set('category', c.id)}
                  className="flex flex-col items-center gap-1 py-2.5 rounded-2xl transition-all"
                  style={{
                    background: form.category === c.id ? `${c.color}20` : theme.surface2,
                    border: `2px solid ${form.category === c.id ? c.color : 'transparent'}`,
                  }}>
                  <span style={{ fontSize: 20 }}>{c.emoji}</span>
                  <span className="text-[9px] font-semibold"
                    style={{ color: form.category === c.id ? c.color : theme.textMuted }}>
                    {c.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Recordatorio */}
          <div>
            <label className="label">Recordatorio</label>
            <div className="grid grid-cols-3 gap-2">
              {REMINDERS.map(r => (
                <button key={r.val} onClick={() => set('reminder_minutes', r.val)}
                  className="py-2 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: form.reminder_minutes === r.val ? `${theme.primary}20` : theme.surface2,
                    color: form.reminder_minutes === r.val ? theme.primary : theme.textMuted,
                    border: `2px solid ${form.reminder_minutes === r.val ? theme.primary : 'transparent'}`,
                  }}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="label">Notas (opcional)</label>
            <textarea className="input resize-none" rows={2}
              placeholder="Detalles adicionales…"
              value={form.description} onChange={e => set('description', e.target.value)} />
          </div>
        </div>

        <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave}
          disabled={!form.title.trim()}
          className="w-full py-3.5 rounded-2xl font-bold text-white mt-5 disabled:opacity-40 flex items-center justify-center gap-2"
          style={{ background: `linear-gradient(135deg, ${theme.primary}, #FF8FA3)` }}>
          <Check size={16} /> {event ? 'Actualizar' : 'Guardar evento'}
        </motion.button>
      </motion.div>
    </motion.div>
  )
}
