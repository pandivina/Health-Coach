import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Scale, Ruler, FlaskConical, Pill, TrendingDown, TrendingUp, Minus, Upload, Trash2, Plus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'
import { useStore } from '../store/useStore'
import { useTheme } from '../contexts/ThemeProvider'
import { MedicalDisclaimerBanner } from '../components/legal/MedicalDisclaimer'
import PandiContextualBubble from '../components/PandiContextualBubble'
import PandiTips from '../components/PandiTips'
import { toast } from '../lib/toast'

const TABS = [
  { id: 'weight',     icon: Scale,        label: 'Peso' },
  { id: 'measures',   icon: Ruler,        label: 'Medidas' },
  { id: 'labs',       icon: FlaskConical, label: 'Analíticas' },
  { id: 'treatments', icon: Pill,         label: 'Tratamientos' },
]
const MARKER_COLORS = { low: '#3B82F6', normal: '#10B981', high: '#F97316', critical: '#EF4444' }
const MARKER_LABELS = { low: 'Bajo', normal: 'Normal', high: 'Alto', critical: 'Crítico' }

function WeightTab() {
  const { user, addXP } = useStore()
  const { theme } = useTheme()
  const [logs,   setLogs]   = useState([])
  const [health, setHealth] = useState(null)
  const [form,   setForm]   = useState({ weight_kg: '', body_fat_pct: '', notes: '' })
  const [saving, setSaving] = useState(false)

  async function load() {
    const [lr, hr] = await Promise.all([
      supabase.from('weight_logs').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(12),
      supabase.from('health_profiles').select('weight_kg,target_weight_kg').eq('user_id', user.id).single(),
    ])
    setLogs(lr.data || [])
    if (hr.data) setHealth(hr.data)
  }

  useEffect(() => { if (user) load() }, [user])

  async function save() {
    if (!form.weight_kg) return
    setSaving(true)
    try {
      await api.health.logWeight({
        weight_kg:    parseFloat(form.weight_kg),
        body_fat_pct: parseFloat(form.body_fat_pct) || null,
        notes:        form.notes,
      })
      await addXP(10)
      setForm({ weight_kg: '', body_fat_pct: '', notes: '' })
      load()
    } catch (err) { toast.error('Algo salió mal. Inténtalo de nuevo.') }
    finally { setSaving(false) }
  }

  const current  = logs[0]?.weight_kg
  const previous = logs[1]?.weight_kg
  const diff     = current && previous ? (current - previous).toFixed(1) : null
  const toGoal   = current && health?.target_weight_kg ? Math.abs(current - health.target_weight_kg).toFixed(1) : null

  return (
    <div className="space-y-4">
      <PandiContextualBubble section="health" data={{ weight: current, target: health?.target_weight_kg, diff }} />

      {health && (
        <div className="card" style={{ background: `${theme.primary}10`, border: `1px solid ${theme.primary}20` }}>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              [current || health.weight_kg || '–', 'kg actuales'],
              [health.target_weight_kg || '–',     'kg objetivo'],
              [toGoal || '–',                       'kg restantes'],
            ].map(([v, l]) => (
              <div key={l}>
                <p className="text-2xl font-bold" style={{ color: theme.text }}>{v}</p>
                <p className="text-xs"            style={{ color: theme.textMuted }}>{l}</p>
              </div>
            ))}
          </div>
          {diff && (
            <div className="mt-3 pt-3 flex items-center justify-center gap-2" style={{ borderTop: `1px solid ${theme.border}` }}>
              {diff < 0
                ? <TrendingDown size={14} style={{ color: theme.success }} />
                : diff > 0
                ? <TrendingUp   size={14} style={{ color: theme.warning }} />
                : <Minus        size={14} style={{ color: theme.textMuted }} />}
              <span className="text-sm font-medium" style={{ color: diff < 0 ? theme.success : theme.warning }}>
                {diff > 0 ? '+' : ''}{diff} kg desde el último
              </span>
            </div>
          )}
        </div>
      )}

      <div className="card space-y-3">
        <p className="font-semibold text-sm" style={{ color: theme.text }}>Registrar peso (+10 XP)</p>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="label">Peso (kg)</label>
            <input className="input" type="number" step="0.1" placeholder="70.5"
              value={form.weight_kg} onChange={e => setForm(f => ({ ...f, weight_kg: e.target.value }))} />
          </div>
          <div className="flex-1">
            <label className="label">% grasa</label>
            <input className="input" type="number" step="0.1" placeholder="20"
              value={form.body_fat_pct} onChange={e => setForm(f => ({ ...f, body_fat_pct: e.target.value }))} />
          </div>
        </div>
        <input className="input text-sm" placeholder="Notas (opcional)"
          value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        <button onClick={save} disabled={saving || !form.weight_kg}
          className="btn-primary text-sm py-2.5 disabled:opacity-40">
          ⚖️ Registrar peso
        </button>
      </div>

      <p className="section-title">Historial</p>
      {logs.map((log, i) => {
        const prev = logs[i+1]?.weight_kg
        const d    = prev ? (log.weight_kg - prev).toFixed(1) : null
        return (
          <div key={log.id} className="card flex items-center justify-between">
            <div>
              <p className="font-semibold" style={{ color: theme.text }}>{log.weight_kg} kg</p>
              <p className="text-xs" style={{ color: theme.textMuted }}>
                {new Date(log.date + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
              </p>
            </div>
            <div className="text-right">
              {log.body_fat_pct && <p className="text-xs" style={{ color: theme.textMuted }}>{log.body_fat_pct}% grasa</p>}
              {d && <p className="text-xs font-medium" style={{ color: d < 0 ? theme.success : theme.warning }}>{d > 0 ? '+' : ''}{d}</p>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function MeasuresTab() {
  const { user } = useStore()
  const { theme } = useTheme()
  const [logs,   setLogs]   = useState([])
  const [form,   setForm]   = useState({ waist_cm:'', hip_cm:'', chest_cm:'', left_arm_cm:'', left_thigh_cm:'', energy_level:'7', hunger_level:'5', adherence_pct:'80', notes:'' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) supabase.from('body_measurements').select('*').eq('user_id', user.id)
      .order('date', { ascending: false }).limit(6)
      .then(({ data }) => setLogs(data || []))
  }, [user])

  async function save() {
    setSaving(true)
    try {
      const payload = Object.fromEntries(Object.entries(form).map(([k,v]) => [k, v === '' ? null : isNaN(v) ? v : parseFloat(v)]))
      await supabase.from('body_measurements').insert({ ...payload, user_id: user.id })
      setForm({ waist_cm:'', hip_cm:'', chest_cm:'', left_arm_cm:'', left_thigh_cm:'', energy_level:'7', hunger_level:'5', adherence_pct:'80', notes:'' })
      const { data } = await supabase.from('body_measurements').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(6)
      setLogs(data || [])
    } catch (err) { toast.error('Algo salió mal. Inténtalo de nuevo.') }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-4">
      <div className="card space-y-3">
        <p className="font-semibold text-sm" style={{ color: theme.text }}>Registrar medidas</p>
        <div className="grid grid-cols-2 gap-2">
          {[['waist_cm','Cintura (cm)'],['hip_cm','Cadera (cm)'],['chest_cm','Pecho (cm)'],['left_arm_cm','Brazo (cm)'],['left_thigh_cm','Muslo (cm)']].map(([k,p]) => (
            <input key={k} className="input text-sm" type="number" step="0.1" placeholder={p}
              value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
          ))}
        </div>
        <div className="space-y-2">
          {[['energy_level','⚡ Energía','1-10'],['hunger_level','🍽️ Hambre','1-10'],['adherence_pct','✅ Adherencia','%']].map(([k,l,u]) => (
            <div key={k} className="flex items-center gap-3">
              <label className="text-xs w-32" style={{ color: theme.textMuted }}>{l}</label>
              <input className="input flex-1 text-sm" type="number" min={u==='%'?0:1} max={u==='%'?100:10}
                value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
              <span className="text-xs" style={{ color: theme.textMuted }}>{u}</span>
            </div>
          ))}
        </div>
        <input className="input text-sm" placeholder="Notas…"
          value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        <button onClick={save} disabled={saving} className="btn-primary text-sm py-2.5">📏 Guardar medidas</button>
      </div>
      {logs.map(m => (
        <div key={m.id} className="card">
          <p className="text-xs mb-2" style={{ color: theme.textMuted }}>
            {new Date(m.date + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
          </p>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[['Cintura',m.waist_cm,'cm'],['Cadera',m.hip_cm,'cm'],['Pecho',m.chest_cm,'cm']].filter(([,v])=>v).map(([l,v,u]) => (
              <div key={l} className="rounded-xl py-2" style={{ background: theme.surface2 }}>
                <p className="font-bold" style={{ color: theme.text }}>{v}</p>
                <p className="text-[10px]" style={{ color: theme.textMuted }}>{l} {u}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function LabsTab() {
  const { user } = useStore()
  const { theme } = useTheme()
  const [reports,     setReports]     = useState([])
  const [analyzing,   setAnalyzing]   = useState(false)
  const [expanded,    setExpanded]    = useState(null)
  const [mode,        setMode]        = useState('text')
  const [rawText,     setRawText]     = useState('')
  const [reportTitle, setReportTitle] = useState('')
  const fileRef = useRef()

  async function load() {
    const { data } = await supabase.from('lab_reports').select('*, lab_markers(*)')
      .eq('user_id', user.id).order('report_date', { ascending: false })
    setReports(data || [])
  }

  useEffect(() => { if (user) load() }, [user])

  async function analyze(imageBase64, mediaType) {
    setAnalyzing(true)
    try {
      await api.labs.analyze({ rawText, imageBase64, mediaType, title: reportTitle || 'Analítica' })
      setRawText(''); setReportTitle(''); load()
    } catch (err) { toast.error('Algo salió mal. Inténtalo de nuevo.') }
    finally { setAnalyzing(false) }
  }

  async function handleFile(e) {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => { const base64 = ev.target.result.split(',')[1]; analyze(base64, file.type) }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-4">
      <MedicalDisclaimerBanner />
      <div className="card space-y-3">
        <p className="font-semibold" style={{ color: theme.text }}>Subir analítica</p>
        <div className="flex gap-2">
          {[['text','✍️ Texto'],['image','📷 Imagen']].map(([v,l]) => (
            <button key={v} onClick={() => setMode(v)}
              className="flex-1 py-2 rounded-xl border text-sm font-medium transition-all"
              style={{ borderColor: mode===v ? theme.primary : theme.border, background: mode===v ? `${theme.primary}15` : theme.surface2, color: mode===v ? theme.primary : theme.textMuted }}>
              {l}
            </button>
          ))}
        </div>
        <input className="input text-sm" placeholder="Título (ej: Analítica enero)"
          value={reportTitle} onChange={e => setReportTitle(e.target.value)} />
        {mode === 'text' ? (
          <>
            <textarea className="input resize-none text-sm" rows={6}
              placeholder="Pega aquí el texto de tu analítica…"
              value={rawText} onChange={e => setRawText(e.target.value)} />
            <button onClick={() => analyze(null, null)} disabled={analyzing || !rawText.trim()}
              className="btn-primary text-sm py-2.5 disabled:opacity-40 flex items-center justify-center gap-2">
              {analyzing
                ? <><div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> Analizando…</>
                : '🔬 Analizar con IA'}
            </button>
          </>
        ) : (
          <>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            <button onClick={() => fileRef.current?.click()} disabled={analyzing}
              className="btn-primary text-sm py-2.5 flex items-center justify-center gap-2 disabled:opacity-40">
              {analyzing
                ? <><div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> Analizando…</>
                : <><Upload size={14} /> Subir imagen</>}
            </button>
          </>
        )}
      </div>

      {reports.map(report => (
        <div key={report.id} className="card cursor-pointer"
          onClick={() => setExpanded(expanded === report.id ? null : report.id)}>
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold" style={{ color: theme.text }}>{report.title}</p>
              <p className="text-xs" style={{ color: theme.textMuted }}>
                {new Date(report.report_date + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: report.status==='analyzed' ? `${theme.success}20` : `${theme.warning}20`, color: report.status==='analyzed' ? theme.success : theme.warning }}>
                {report.status === 'analyzed' ? '✓ Analizada' : 'Pendiente'}
              </span>
              <button onClick={e => { e.stopPropagation(); api.labs.deleteReport(report.id).then(load) }}
                style={{ color: theme.textLight }}><Trash2 size={13} /></button>
            </div>
          </div>
          {expanded === report.id && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 space-y-3">
              {report.ai_interpretation && (
                <p className="text-sm leading-relaxed" style={{ color: theme.text }}>{report.ai_interpretation}</p>
              )}
              {report.lab_markers?.length > 0 && (
                <div className="space-y-1.5">
                  {report.lab_markers.map(m => (
                    <div key={m.id} className="flex items-center justify-between py-1.5">
                      <p className="text-sm" style={{ color: theme.text }}>{m.marker_name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium" style={{ color: theme.text }}>{m.value} {m.unit}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                          style={{ background: `${MARKER_COLORS[m.status]}20`, color: MARKER_COLORS[m.status] }}>
                          {MARKER_LABELS[m.status]}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {report.ai_recommendations && (
                <div className="rounded-xl p-3" style={{ background: `${theme.primary}10`, border: `1px solid ${theme.primary}20` }}>
                  <p className="text-xs font-medium mb-1" style={{ color: theme.textMuted }}>💡 Recomendaciones</p>
                  <p className="text-sm leading-relaxed" style={{ color: theme.text }}>{report.ai_recommendations}</p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      ))}

      {reports.length === 0 && (
        <div className="text-center py-8" style={{ color: theme.textMuted }}>
          <FlaskConical size={36} className="mx-auto mb-3 opacity-30" />
          <p>Sin analíticas subidas</p>
        </div>
      )}
    </div>
  )
}

function TreatmentsTab() {
  const { user } = useStore()
  const { theme } = useTheme()
  const [treatments, setTreatments] = useState([])
  const [showForm,   setShowForm]   = useState(false)
  const [form,       setForm]       = useState({ name:'', type:'other', dose:'', frequency:'', notes:'', start_date:'' })

  async function load() {
    const { data } = await supabase.from('medical_treatments').select('*')
      .eq('user_id', user.id).eq('active', true).order('created_at', { ascending: false })
    setTreatments(data || [])
  }

  useEffect(() => { if (user) load() }, [user])

  async function add() {
    if (!form.name) return
    await supabase.from('medical_treatments').insert({
      ...form, user_id: user.id,
      affects_weight:   ['glp1','thyroid','insulin','corticoid','contraceptive'].includes(form.type),
      affects_appetite: ['glp1','antidepressant'].includes(form.type),
    })
    setForm({ name:'', type:'other', dose:'', frequency:'', notes:'', start_date:'' })
    setShowForm(false); load()
  }

  const TYPES = { glp1:'💉 GLP-1', thyroid:'🦋 Tiroides', insulin:'💉 Insulina', contraceptive:'💊 Anticonceptivo', antidepressant:'💊 Antidepresivo', corticoid:'💊 Corticoide', other:'💊 Otro' }

  return (
    <div className="space-y-4">
      <button onClick={() => setShowForm(true)} className="btn-primary flex items-center justify-center gap-2">
        <Plus size={15} /> Añadir tratamiento
      </button>

      {showForm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card space-y-3">
          <input className="input" placeholder="Nombre del tratamiento"
            value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
          <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
            {Object.entries(TYPES).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <div className="flex gap-2">
            <input className="input flex-1" placeholder="Dosis (ej: 0.5mg)"
              value={form.dose} onChange={e => setForm(f => ({ ...f, dose: e.target.value }))} />
            <input className="input flex-1" placeholder="Frecuencia"
              value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))} />
          </div>
          <input className="input" type="date"
            value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="btn-secondary text-sm py-2">Cancelar</button>
            <button onClick={add} className="btn-primary text-sm py-2">Guardar</button>
          </div>
        </motion.div>
      )}

      {treatments.map(t => (
        <div key={t.id} className="card flex items-start justify-between">
          <div>
            <p className="font-semibold text-sm" style={{ color: theme.text }}>{t.name}</p>
            <p className="text-xs" style={{ color: theme.textMuted }}>{TYPES[t.type]} {t.dose && `· ${t.dose}`}</p>
            <div className="flex gap-2 mt-1">
              {t.affects_weight   && <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${theme.warning}20`, color: theme.warning }}>Afecta al peso</span>}
              {t.affects_appetite && <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${theme.primary}20`, color: theme.primary }}>Afecta al apetito</span>}
            </div>
          </div>
          <button onClick={() => supabase.from('medical_treatments').update({ active: false }).eq('id', t.id).then(load)}
            style={{ color: theme.textLight }}><Trash2 size={13} /></button>
        </div>
      ))}

      {treatments.length === 0 && (
        <div className="text-center py-8" style={{ color: theme.textMuted }}>
          <Pill size={36} className="mx-auto mb-3 opacity-30" />
          <p>Sin tratamientos registrados</p>
        </div>
      )}
    </div>
  )
}

export default function HealthTracking() {
  const { theme } = useTheme()
  const [tab, setTab] = useState('weight')

  return (
    <div className="page pb-32">
      <h1 className="text-2xl font-extrabold mb-2" style={{ color: theme.text }}>Seguimiento 📊</h1>
      <p className="text-sm mb-4" style={{ color: theme.textMuted }}>Progreso semanal y datos de salud</p>
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all"
            style={{ background: tab===t.id ? theme.primary : theme.surface, color: tab===t.id ? '#fff' : theme.textMuted, border: tab===t.id ? 'none' : `1px solid ${theme.border}` }}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          {tab === 'weight'     && <WeightTab />}
          {tab === 'measures'   && <MeasuresTab />}
          {tab === 'labs'       && <LabsTab />}
          {tab === 'treatments' && <TreatmentsTab />}
        </motion.div>
      </AnimatePresence>
      <PandiTips section="health" />
    </div>
  )
}
