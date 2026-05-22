import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Bell, BellOff, Settings, X, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useStore } from '../../store/useStore'

// ─── CONSTANTES ───────────────────────────────────────────────────────────────

const DAYS = ['L','M','X','J','V','S','D']
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const SYMPTOMS_LIST = [
  { id: 'cramps',    emoji: '😣', label: 'Calambres'   },
  { id: 'headache',  emoji: '🤕', label: 'Cabeza'       },
  { id: 'bloating',  emoji: '🫃', label: 'Hinchazón'   },
  { id: 'fatigue',   emoji: '😴', label: 'Cansancio'   },
  { id: 'nausea',    emoji: '🤢', label: 'Náuseas'     },
  { id: 'backpain',  emoji: '🔙', label: 'Espalda'     },
  { id: 'acne',      emoji: '😤', label: 'Acné'        },
  { id: 'cravings',  emoji: '🍫', label: 'Antojos'     },
  { id: 'anxiety',   emoji: '😰', label: 'Ansiedad'    },
  { id: 'tender',    emoji: '💔', label: 'Sensibilidad'},
]

const FLOW_LABELS = { 1:'Spotting', 2:'Ligero', 3:'Medio', 4:'Abundante' }
const FLOW_COLORS = { 1:'#FCA5A5', 2:'#F87171', 3:'#EF4444', 4:'#B91C1C' }

const PHASE_INFO = {
  menstruation: { label:'Menstruación', color:'#EF4444', bg:'#FEE2E2', emoji:'🩸',
    tip:'Prioriza el descanso. Alimentos ricos en hierro como lentejas y espinacas.' },
  follicular:   { label:'Fase folicular', color:'#F97316', bg:'#FFF7ED', emoji:'🌱',
    tip:'Energía en aumento. Buen momento para entrenamientos de fuerza.' },
  ovulation:    { label:'Ovulación', color:'#22C55E', bg:'#F0FDF4', emoji:'✨',
    tip:'Pico de energía. Aprovecha para entrenamientos HIIT y actividades sociales.' },
  luteal:       { label:'Fase lútea', color:'#8B5CF6', bg:'#F5F3FF', emoji:'🌙',
    tip:'Puede aparecer el síndrome premenstrual. Magnesio y omega-3 pueden ayudar.' },
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function getPhase(dayOfCycle, cycleLength = 28, periodLength = 5) {
  if (dayOfCycle <= 0) return null
  if (dayOfCycle <= periodLength)        return 'menstruation'
  if (dayOfCycle <= 13)                  return 'follicular'
  if (dayOfCycle <= 16)                  return 'ovulation'
  if (dayOfCycle <= cycleLength)         return 'luteal'
  return null
}

function getDayOfCycle(date, lastPeriodStart) {
  if (!lastPeriodStart) return null
  const diff = Math.floor((new Date(date) - new Date(lastPeriodStart)) / 86400000)
  return diff + 1
}

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year, month) {
  let d = new Date(year, month, 1).getDay()
  return d === 0 ? 6 : d - 1 // Lunes = 0
}

// ─── COMPONENTE PRINCIPAL ────────────────────────────────────────────────────

export default function CycleTab({ theme }) {
  const { user } = useStore()

  const [settings,   setSettings]   = useState({ avg_cycle_length: 28, avg_period_length: 5, last_period_start: null, notifications_enabled: true, notify_period_days_before: 2, notify_ovulation: true })
  const [cycles,     setCycles]     = useState([])
  const [symptoms,   setSymptoms]   = useState({}) // { 'YYYY-MM-DD': symptomData }
  const [calYear,    setCalYear]    = useState(new Date().getFullYear())
  const [calMonth,   setCalMonth]   = useState(new Date().getMonth())
  const [selected,   setSelected]   = useState(null) // fecha seleccionada
  const [showLog,    setShowLog]    = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [loading,    setLoading]    = useState(true)

  const today = new Date().toISOString().split('T')[0]

  // ─── CARGA DATOS ────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const [settingsR, cyclesR, symptomsR] = await Promise.all([
      supabase.from('menstrual_settings').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('menstrual_cycles').select('*').eq('user_id', user.id).order('start_date', { ascending: false }).limit(12),
      supabase.from('menstrual_symptoms').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(90),
    ])
    if (settingsR.data) setSettings(settingsR.data)
    setCycles(cyclesR.data || [])
    const sympMap = {}
    ;(symptomsR.data || []).forEach(s => { sympMap[s.date] = s })
    setSymptoms(sympMap)
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  // ─── CALCULAR PREDICCIONES ──────────────────────────────────────────────────

  function getPredictions() {
    const lps = settings.last_period_start
    if (!lps) return { periods: [], ovulations: [] }
    const cl  = settings.avg_cycle_length  || 28
    const pl  = settings.avg_period_length || 5
    const periods    = []
    const ovulations = []
    for (let i = 0; i <= 3; i++) {
      const start = addDays(lps, cl * i)
      const end   = addDays(start, pl - 1)
      const ov    = addDays(start, 13)
      periods.push({ start, end })
      ovulations.push(ov)
    }
    return { periods, ovulations }
  }

  const { periods, ovulations } = getPredictions()

  function getDayType(dateStr) {
    // ¿Tiene síntoma con flujo? → menstruación real
    const symp = symptoms[dateStr]
    if (symp?.flow) return { type: 'period_real', flow: symp.flow }

    // ¿Ciclo guardado?
    for (const c of cycles) {
      if (dateStr >= c.start_date && dateStr <= (c.end_date || c.start_date)) {
        return { type: 'period_real' }
      }
    }

    // Predicciones
    for (const p of periods) {
      if (dateStr >= p.start && dateStr <= p.end) {
        const isPast = dateStr < today
        return { type: isPast ? 'period_past_pred' : 'period_future_pred' }
      }
    }
    if (ovulations.includes(dateStr)) return { type: 'ovulation' }

    // Fase del ciclo
    if (settings.last_period_start) {
      const day   = getDayOfCycle(dateStr, settings.last_period_start)
      const phase = getPhase(day, settings.avg_cycle_length, settings.avg_period_length)
      if (phase && phase !== 'menstruation') return { type: 'phase', phase }
    }

    return { type: 'normal' }
  }

  // ─── FASE HOY ───────────────────────────────────────────────────────────────

  const todayPhase = (() => {
    if (!settings.last_period_start) return null
    const day = getDayOfCycle(today, settings.last_period_start)
    return getPhase(day, settings.avg_cycle_length, settings.avg_period_length)
  })()

  const todayDayOfCycle = settings.last_period_start
    ? getDayOfCycle(today, settings.last_period_start)
    : null

  const nextPeriod = periods.find(p => p.start >= today)
  const daysToNext = nextPeriod
    ? Math.floor((new Date(nextPeriod.start) - new Date(today)) / 86400000)
    : null

  // ─── GUARDAR MENSTRUACIÓN ────────────────────────────────────────────────────

  async function markPeriodStart(dateStr) {
    // Guardar ciclo
    const { data: lastCycle } = await supabase
      .from('menstrual_cycles')
      .select('*')
      .eq('user_id', user.id)
      .order('start_date', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Calcular duración del ciclo anterior
    let newCycleLength = settings.avg_cycle_length
    if (lastCycle?.start_date) {
      const diff = Math.floor((new Date(dateStr) - new Date(lastCycle.start_date)) / 86400000)
      if (diff > 15 && diff < 50) newCycleLength = diff
    }

    await supabase.from('menstrual_cycles').insert({
      user_id: user.id, start_date: dateStr,
    })

    // Actualizar settings con nuevo ciclo promedio
    const newAvg = lastCycle
      ? Math.round((settings.avg_cycle_length + newCycleLength) / 2)
      : settings.avg_cycle_length

    await supabase.from('menstrual_settings').upsert({
      user_id: user.id,
      last_period_start: dateStr,
      avg_cycle_length: newAvg,
      avg_period_length: settings.avg_period_length,
      notifications_enabled: settings.notifications_enabled,
      notify_period_days_before: settings.notify_period_days_before,
      notify_ovulation: settings.notify_ovulation,
    }, { onConflict: 'user_id' })

    await load()
  }

  // ─── GUARDAR SÍNTOMAS ────────────────────────────────────────────────────────

  async function saveSymptoms(dateStr, data) {
    await supabase.from('menstrual_symptoms').upsert(
      { user_id: user.id, date: dateStr, ...data },
      { onConflict: 'user_id,date' }
    )
    await load()
  }

  // ─── GUARDAR CONFIGURACIÓN ───────────────────────────────────────────────────

  async function saveSettings(newSettings) {
    await supabase.from('menstrual_settings').upsert(
      { user_id: user.id, ...newSettings },
      { onConflict: 'user_id' }
    )
    setSettings(newSettings)
  }

  // ─── NOTIFICACIONES ──────────────────────────────────────────────────────────

  async function scheduleNotifications(s) {
    if (!s.notifications_enabled || !s.last_period_start) return
    if (!('Notification' in window)) return
    if (Notification.permission === 'default') {
      await Notification.requestPermission()
    }
    if (Notification.permission !== 'granted') return

    const cl  = s.avg_cycle_length || 28
    const nextStart = addDays(s.last_period_start, cl)
    const daysUntil = Math.floor((new Date(nextStart) - new Date()) / 86400000)

    if (daysUntil === s.notify_period_days_before) {
      new Notification('🩸 Pandi — Tu período se acerca', {
        body: `Tu menstruación podría comenzar en ${daysUntil} días. ¿Cómo te encuentras?`,
        icon: '/icons/icon-192.png',
      })
    }

    if (s.notify_ovulation) {
      const ovDate = addDays(s.last_period_start, 13)
      const daysToOv = Math.floor((new Date(ovDate) - new Date()) / 86400000)
      if (daysToOv === 0) {
        new Notification('✨ Pandi — Fase de ovulación', {
          body: 'Hoy es tu día de ovulación estimado. Máxima energía y rendimiento.',
          icon: '/icons/icon-192.png',
        })
      }
    }
  }

  useEffect(() => {
    if (settings.last_period_start) scheduleNotifications(settings)
  }, [settings])

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: theme.primary }} />
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Setup inicial si no hay datos */}
      {!settings.last_period_start && (
        <SetupCard theme={theme} onSave={markPeriodStart} />
      )}

      {/* Panel de fase actual */}
      {settings.last_period_start && (
        <PhaseCard
          theme={theme}
          phase={todayPhase}
          dayOfCycle={todayDayOfCycle}
          cycleLength={settings.avg_cycle_length}
          daysToNext={daysToNext}
          nextPeriod={nextPeriod}
        />
      )}

      {/* Calendario */}
      <CalendarCard
        theme={theme}
        year={calYear}
        month={calMonth}
        today={today}
        selected={selected}
        getDayType={getDayType}
        symptoms={symptoms}
        onPrev={() => {
          if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11) }
          else setCalMonth(m => m - 1)
        }}
        onNext={() => {
          if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0) }
          else setCalMonth(m => m + 1)
        }}
        onSelect={(d) => { setSelected(d); setShowLog(true) }}
        onMarkToday={() => markPeriodStart(today)}
        hasData={!!settings.last_period_start}
      />

      {/* Leyenda */}
      <LegendCard theme={theme} />

      {/* Estadísticas */}
      {cycles.length > 1 && (
        <StatsCard theme={theme} cycles={cycles} settings={settings} />
      )}

      {/* Botón configuración + notificaciones */}
      <div className="flex gap-2">
        <button onClick={() => setShowConfig(true)}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm"
          style={{ background: theme.surface2, color: theme.text }}>
          <Settings size={15} /> Configurar
        </button>
        <button onClick={async () => {
          const next = { ...settings, notifications_enabled: !settings.notifications_enabled }
          await saveSettings(next)
        }}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm"
          style={{
            background: settings.notifications_enabled ? `${theme.primary}15` : theme.surface2,
            color: settings.notifications_enabled ? theme.primary : theme.textMuted,
          }}>
          {settings.notifications_enabled
            ? <><Bell size={15} /> Alertas activas</>
            : <><BellOff size={15} /> Alertas off</>
          }
        </button>
      </div>

      {/* Modal log síntomas */}
      <AnimatePresence>
        {showLog && selected && (
          <LogModal
            theme={theme}
            date={selected}
            existing={symptoms[selected]}
            onSave={async (data) => {
              if (data.markPeriod) await markPeriodStart(selected)
              else await saveSymptoms(selected, data)
              setShowLog(false)
            }}
            onClose={() => setShowLog(false)}
          />
        )}
      </AnimatePresence>

      {/* Modal configuración */}
      <AnimatePresence>
        {showConfig && (
          <ConfigModal
            theme={theme}
            settings={settings}
            onSave={async (s) => { await saveSettings(s); setShowConfig(false) }}
            onClose={() => setShowConfig(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── SETUP INICIAL ───────────────────────────────────────────────────────────

function SetupCard({ theme, onSave }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="card text-center"
      style={{ background: 'linear-gradient(135deg,#FFF0F3,#FFF7ED)', border: '1px solid #FECDD3' }}>
      <div className="text-4xl mb-3">🩸</div>
      <p className="font-extrabold text-base mb-1" style={{ color: '#1F2937' }}>
        Configura tu ciclo
      </p>
      <p className="text-xs mb-4" style={{ color: '#6B7280' }}>
        ¿Cuándo empezó tu última menstruación?
      </p>
      <input type="date" value={date} onChange={e => setDate(e.target.value)}
        className="input mb-3" max={new Date().toISOString().split('T')[0]} />
      <button onClick={() => onSave(date)}
        className="w-full py-3 rounded-2xl font-bold text-white"
        style={{ background: 'linear-gradient(135deg,#EF4444,#F97316)' }}>
        Guardar inicio del ciclo
      </button>
    </motion.div>
  )
}

// ─── CARD FASE ACTUAL ────────────────────────────────────────────────────────

function PhaseCard({ theme, phase, dayOfCycle, cycleLength, daysToNext, nextPeriod }) {
  const info = phase ? PHASE_INFO[phase] : null

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="card"
      style={{
        background: info ? info.bg : theme.surface,
        border: `1px solid ${info ? info.color + '30' : theme.border}`,
      }}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ background: info ? info.color + '20' : theme.surface2 }}>
          {info?.emoji || '🗓️'}
        </div>
        <div className="flex-1">
          <p className="font-extrabold text-sm" style={{ color: info?.color || theme.text }}>
            {info?.label || 'Sin datos'}
          </p>
          {dayOfCycle && (
            <p className="text-xs" style={{ color: '#6B7280' }}>
              Día {dayOfCycle} de {cycleLength}
            </p>
          )}
        </div>
        {daysToNext !== null && daysToNext >= 0 && (
          <div className="text-right">
            <p className="font-extrabold text-2xl" style={{ color: '#EF4444' }}>
              {daysToNext}
            </p>
            <p className="text-[10px]" style={{ color: '#6B7280' }}>días</p>
          </div>
        )}
      </div>

      {/* Barra de progreso del ciclo */}
      {dayOfCycle && (
        <div className="mb-3">
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.08)' }}>
            <motion.div className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((dayOfCycle / cycleLength) * 100, 100)}%` }}
              transition={{ duration: 0.8 }}
              style={{ background: info?.color || theme.primary }} />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px]" style={{ color: '#9CA3AF' }}>Día 1</span>
            <span className="text-[10px]" style={{ color: '#9CA3AF' }}>Día {cycleLength}</span>
          </div>
        </div>
      )}

      {/* Consejo de Pandi */}
      {info?.tip && (
        <div className="flex items-start gap-2 p-2.5 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.6)' }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>🐼</span>
          <p className="text-xs leading-relaxed" style={{ color: '#374151' }}>{info.tip}</p>
        </div>
      )}

      {nextPeriod && daysToNext !== null && daysToNext <= 3 && daysToNext >= 0 && (
        <div className="mt-2 p-2 rounded-xl text-center"
          style={{ background: '#FEE2E2' }}>
          <p className="text-xs font-semibold" style={{ color: '#B91C1C' }}>
            {daysToNext === 0
              ? '🩸 Tu período podría comenzar hoy'
              : `🩸 Tu período podría comenzar en ${daysToNext} día${daysToNext > 1 ? 's' : ''}`}
          </p>
        </div>
      )}
    </motion.div>
  )
}

// ─── CALENDARIO ──────────────────────────────────────────────────────────────

function CalendarCard({ theme, year, month, today, selected, getDayType, symptoms, onPrev, onNext, onSelect, onMarkToday, hasData }) {
  const daysInMonth  = getDaysInMonth(year, month)
  const firstDay     = getFirstDayOfMonth(year, month)

  function getDayStyle(dateStr, type, flow) {
    const isToday    = dateStr === today
    const isSelected = dateStr === selected
    const hasSym     = !!symptoms[dateStr]

    let bg = 'transparent', border = 'transparent', color = theme.text

    if (type === 'period_real') {
      bg = flow ? FLOW_COLORS[flow] : '#EF4444'
      color = '#fff'
    } else if (type === 'period_future_pred') {
      bg = '#FECDD3'; color = '#EF4444'
    } else if (type === 'period_past_pred') {
      bg = '#FEE2E2'; color = '#DC2626'
    } else if (type === 'ovulation') {
      bg = '#BBF7D0'; color = '#15803D'
    } else if (type === 'phase') {
      bg = 'transparent'
    }

    if (isToday) border = theme.primary
    if (isSelected) border = '#1F2937'

    return { bg, border, color, hasSym }
  }

  return (
    <div className="card">
      {/* Header mes */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={onPrev} className="w-8 h-8 flex items-center justify-center rounded-xl"
          style={{ background: theme.surface2 }}>
          <ChevronLeft size={16} style={{ color: theme.text }} />
        </button>
        <p className="font-extrabold text-sm" style={{ color: theme.text }}>
          {MONTHS[month]} {year}
        </p>
        <button onClick={onNext} className="w-8 h-8 flex items-center justify-center rounded-xl"
          style={{ background: theme.surface2 }}>
          <ChevronRight size={16} style={{ color: theme.text }} />
        </button>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-[10px] font-bold py-1"
            style={{ color: theme.textMuted }}>{d}</div>
        ))}
      </div>

      {/* Días del mes */}
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day     = i + 1
          const dateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
          const { type, flow } = getDayType(dateStr)
          const { bg, border, color, hasSym } = getDayStyle(dateStr, type, flow)
          const phaseInfo = type === 'phase' ? PHASE_INFO[getDayType(dateStr).phase] : null

          return (
            <motion.button key={day} whileTap={{ scale: 0.85 }}
              onClick={() => onSelect(dateStr)}
              className="aspect-square rounded-xl flex flex-col items-center justify-center relative"
              style={{
                background: bg,
                border: `2px solid ${border}`,
              }}>
              <span className="text-[11px] font-bold" style={{ color: bg !== 'transparent' ? color : theme.text }}>
                {day}
              </span>
              {hasSym && (
                <div className="absolute bottom-0.5 w-1 h-1 rounded-full"
                  style={{ background: '#2EC4B6' }} />
              )}
              {phaseInfo && (
                <div className="absolute bottom-0.5 w-1 h-1 rounded-full"
                  style={{ background: phaseInfo.color + '60' }} />
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Botón marcar hoy */}
      {hasData && (
        <button onClick={onMarkToday}
          className="w-full mt-4 py-2.5 rounded-2xl text-sm font-bold"
          style={{ background: '#FEE2E2', color: '#EF4444' }}>
          🩸 Marcar inicio de período hoy
        </button>
      )}
    </div>
  )
}

// ─── LEYENDA ─────────────────────────────────────────────────────────────────

function LegendCard({ theme }) {
  return (
    <div className="card">
      <p className="text-xs font-bold mb-3" style={{ color: theme.textMuted }}>Leyenda</p>
      <div className="grid grid-cols-2 gap-1.5">
        {[
          { color: '#EF4444', label: 'Menstruación real' },
          { color: '#FECDD3', label: 'Predicción período' },
          { color: '#BBF7D0', label: 'Ovulación estimada' },
          { color: '#2EC4B6', label: 'Síntomas registrados' },
        ].map((l, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: l.color }} />
            <span className="text-[10px]" style={{ color: theme.textMuted }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── ESTADÍSTICAS ────────────────────────────────────────────────────────────

function StatsCard({ theme, cycles, settings }) {
  const durations = cycles.slice(0, 6).map((c, i) => {
    if (i === cycles.length - 1) return null
    const next = cycles[i - 1]
    if (!next) return null
    return Math.floor((new Date(next.start_date) - new Date(c.start_date)) / 86400000)
  }).filter(Boolean)

  const avgCycle = durations.length
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : settings.avg_cycle_length

  return (
    <div className="card">
      <p className="text-sm font-bold mb-3" style={{ color: theme.text }}>Estadísticas</p>
      <div className="grid grid-cols-3 gap-2">
        {[
          { val: `${avgCycle}d`, label: 'Ciclo medio' },
          { val: `${settings.avg_period_length}d`, label: 'Duración media' },
          { val: cycles.length, label: 'Ciclos registrados' },
        ].map((s, i) => (
          <div key={i} className="text-center p-3 rounded-2xl" style={{ background: theme.surface2 }}>
            <p className="font-extrabold text-lg" style={{ color: '#EF4444' }}>{s.val}</p>
            <p className="text-[10px] mt-0.5" style={{ color: theme.textMuted }}>{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── MODAL LOG SÍNTOMAS ──────────────────────────────────────────────────────

function LogModal({ theme, date, existing, onSave, onClose }) {
  const [flow,     setFlow]     = useState(existing?.flow || 0)
  const [pain,     setPain]     = useState(existing?.pain || 0)
  const [mood,     setMood]     = useState(existing?.mood || 0)
  const [symps,    setSymps]    = useState(existing?.symptoms || [])
  const [notes,    setNotes]    = useState(existing?.notes || '')
  const [isPeriod, setIsPeriod] = useState(false)

  function toggleSymp(id) {
    setSymps(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}>
      <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
        className="w-full max-w-lg rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto"
        style={{ background: theme.bg }}
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between mb-4">
          <p className="font-extrabold text-base" style={{ color: theme.text }}>
            {formatDate(date)}
          </p>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: theme.surface2 }}>
            <X size={16} style={{ color: theme.textMuted }} />
          </button>
        </div>

        {/* Marcar inicio período */}
        <label className="flex items-center gap-3 p-3 rounded-2xl mb-4 cursor-pointer"
          style={{ background: isPeriod ? '#FEE2E2' : theme.surface2,
                   border: `2px solid ${isPeriod ? '#EF4444' : 'transparent'}` }}>
          <input type="checkbox" checked={isPeriod} onChange={e => setIsPeriod(e.target.checked)}
            className="w-4 h-4" />
          <p className="text-sm font-semibold" style={{ color: isPeriod ? '#EF4444' : theme.text }}>
            🩸 Marcar como inicio de período
          </p>
        </label>

        {/* Flujo */}
        <div className="mb-4">
          <p className="text-xs font-bold mb-2" style={{ color: theme.textMuted }}>Flujo</p>
          <div className="flex gap-2">
            {[0,1,2,3,4].map(f => (
              <button key={f} onClick={() => setFlow(f)}
                className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                style={{
                  background: flow === f ? (f === 0 ? theme.surface2 : FLOW_COLORS[f]) : theme.surface2,
                  color: flow === f && f > 0 ? '#fff' : theme.textMuted,
                }}>
                {f === 0 ? 'Ninguno' : FLOW_LABELS[f]}
              </button>
            ))}
          </div>
        </div>

        {/* Dolor */}
        <div className="mb-4">
          <p className="text-xs font-bold mb-2" style={{ color: theme.textMuted }}>
            Dolor {pain > 0 ? `· ${pain}/5` : ''}
          </p>
          <div className="flex gap-2">
            {[1,2,3,4,5].map(p => (
              <button key={p} onClick={() => setPain(pain === p ? 0 : p)}
                className="flex-1 py-2 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: pain >= p ? '#EF444420' : theme.surface2,
                  color: pain >= p ? '#EF4444' : theme.textMuted,
                  border: `2px solid ${pain >= p ? '#EF4444' : 'transparent'}`,
                }}>
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Estado emocional */}
        <div className="mb-4">
          <p className="text-xs font-bold mb-2" style={{ color: theme.textMuted }}>Estado emocional</p>
          <div className="flex gap-2">
            {['😩','😞','😐','😊','🤩'].map((e, i) => (
              <button key={i} onClick={() => setMood(mood === i+1 ? 0 : i+1)}
                className="flex-1 py-2 rounded-xl text-xl transition-all"
                style={{
                  background: mood === i+1 ? theme.primary + '20' : theme.surface2,
                  border: `2px solid ${mood === i+1 ? theme.primary : 'transparent'}`,
                  opacity: mood && mood !== i+1 ? 0.4 : 1,
                }}>
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Síntomas */}
        <div className="mb-4">
          <p className="text-xs font-bold mb-2" style={{ color: theme.textMuted }}>Síntomas</p>
          <div className="grid grid-cols-5 gap-1.5">
            {SYMPTOMS_LIST.map(s => (
              <button key={s.id} onClick={() => toggleSymp(s.id)}
                className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all"
                style={{
                  background: symps.includes(s.id) ? theme.primary + '20' : theme.surface2,
                  border: `2px solid ${symps.includes(s.id) ? theme.primary : 'transparent'}`,
                }}>
                <span style={{ fontSize: 18 }}>{s.emoji}</span>
                <span className="text-[9px] font-semibold text-center leading-tight"
                  style={{ color: symps.includes(s.id) ? theme.primary : theme.textMuted }}>
                  {s.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Notas */}
        <textarea className="input mb-4 resize-none" rows={2}
          placeholder="Notas del día (opcional)…"
          value={notes} onChange={e => setNotes(e.target.value)} />

        <button onClick={() => onSave({ flow, pain, mood, symptoms: symps, notes, markPeriod: isPeriod })}
          className="w-full py-3 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg,#EF4444,#F97316)' }}>
          <Check size={16} /> Guardar
        </button>
      </motion.div>
    </motion.div>
  )
}

// ─── MODAL CONFIGURACIÓN ─────────────────────────────────────────────────────

function ConfigModal({ theme, settings, onSave, onClose }) {
  const [form, setForm] = useState({ ...settings })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}>
      <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
        className="w-full max-w-lg rounded-t-3xl p-5 max-h-[80vh] overflow-y-auto"
        style={{ background: theme.bg }}
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between mb-5">
          <p className="font-extrabold text-base" style={{ color: theme.text }}>Configuración</p>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: theme.surface2 }}>
            <X size={16} style={{ color: theme.textMuted }} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">Duración media del ciclo (días)</label>
            <input className="input" type="number" min={20} max={45}
              value={form.avg_cycle_length}
              onChange={e => set('avg_cycle_length', parseInt(e.target.value))} />
          </div>
          <div>
            <label className="label">Duración media del período (días)</label>
            <input className="input" type="number" min={2} max={10}
              value={form.avg_period_length}
              onChange={e => set('avg_period_length', parseInt(e.target.value))} />
          </div>
          <div>
            <label className="label">Último inicio de período</label>
            <input className="input" type="date"
              value={form.last_period_start || ''}
              onChange={e => set('last_period_start', e.target.value)}
              max={new Date().toISOString().split('T')[0]} />
          </div>
          <div>
            <label className="label">Avisar antes del período (días)</label>
            <div className="flex gap-2">
              {[1,2,3,5].map(d => (
                <button key={d} onClick={() => set('notify_period_days_before', d)}
                  className="flex-1 py-2 rounded-xl text-sm font-bold"
                  style={{
                    background: form.notify_period_days_before === d ? theme.primary + '20' : theme.surface2,
                    color: form.notify_period_days_before === d ? theme.primary : theme.textMuted,
                    border: `2px solid ${form.notify_period_days_before === d ? theme.primary : 'transparent'}`,
                  }}>
                  {d}d
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center justify-between p-3 rounded-2xl"
            style={{ background: theme.surface2 }}>
            <span className="text-sm font-medium" style={{ color: theme.text }}>
              Aviso de ovulación
            </span>
            <button onClick={() => set('notify_ovulation', !form.notify_ovulation)}
              className="w-10 h-6 rounded-full relative transition-all"
              style={{ background: form.notify_ovulation ? theme.primary : theme.border }}>
              <motion.div
                animate={{ x: form.notify_ovulation ? 16 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm" />
            </button>
          </label>
        </div>

        <button onClick={() => onSave(form)}
          className="w-full py-3 rounded-2xl font-bold text-white mt-5"
          style={{ background: `linear-gradient(135deg, ${theme.primary}, #FF8FA3)` }}>
          Guardar configuración
        </button>
      </motion.div>
    </motion.div>
  )
}
