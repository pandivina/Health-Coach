import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Scale, Ruler, FlaskConical, Pill, TrendingDown, TrendingUp, Minus, Upload, FileText, Trash2, Plus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'
import { useStore } from '../store/useStore'

const TABS = [
  { id: 'weight',       icon: Scale,       label: 'Peso' },
  { id: 'measures',     icon: Ruler,       label: 'Medidas' },
  { id: 'labs',         icon: FlaskConical, label: 'Analíticas' },
  { id: 'treatments',   icon: Pill,        label: 'Tratamientos' },
]

const MARKER_CATEGORIES = {
  hierro: '🩸', vitaminas: '💊', glucosa: '🍬',
  colesterol: '🫀', tiroides: '🦋', renal: '🫘', hepatico: '🟤', general: '🔬'
}

// ── WEIGHT TAB ──────────────────────────────────────────────
function WeightTab() {
  const { user } = useStore()
  const [logs, setLogs] = useState([])
  const [form, setForm] = useState({ weight_kg: '', body_fat_pct: '', notes: '' })
  const [health, setHealth] = useState(null)
  const [saving, setSaving] = useState(false)

  async function load() {
    const [logsRes, healthRes] = await Promise.all([
      supabase.from('weight_logs').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(12),
      supabase.from('health_profiles').select('weight_kg,target_weight_kg,bmi,goal').eq('user_id', user.id).single(),
    ])
    setLogs(logsRes.data || [])
    setHealth(healthRes.data || null)
  }
  useEffect(() => { if (user) load() }, [user])

  async function save() {
    if (!form.weight_kg) return
    setSaving(true)
    try {
      await api.health.logWeight({ weight_kg: parseFloat(form.weight_kg), body_fat_pct: parseFloat(form.body_fat_pct) || null, notes: form.notes })
      setForm({ weight_kg: '', body_fat_pct: '', notes: '' })
      load()
    } catch (err) { alert(err.message) }
    finally { setSaving(false) }
  }

  const current = logs[0]?.weight_kg
  const previous = logs[1]?.weight_kg
  const diff = current && previous ? (current - previous).toFixed(1) : null
  const target = health?.target_weight_kg
  const toGoal = current && target ? (current - target).toFixed(1) : null

  return (
    <div className="space-y-4">
      {/* Summary */}
      {health && (
        <div className="card bg-gradient-to-br from-indigo-500/10 to-purple-500/5 border-indigo-500/15">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-2xl font-bold">{current || health.weight_kg || '–'}</p>
              <p className="text-white/40 text-xs">kg actuales</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{target || '–'}</p>
              <p className="text-white/40 text-xs">kg objetivo</p>
            </div>
            <div>
              <p className={`text-2xl font-bold ${toGoal > 0 ? 'text-orange-400' : 'text-accent-green'}`}>
                {toGoal ? (toGoal > 0 ? `-${toGoal}` : `+${Math.abs(toGoal)}`) : '–'}
              </p>
              <p className="text-white/40 text-xs">kg para meta</p>
            </div>
          </div>
          {diff && (
            <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-center gap-2">
              {diff < 0 ? <TrendingDown size={14} className="text-accent-green" /> :
               diff > 0 ? <TrendingUp size={14} className="text-orange-400" /> :
               <Minus size={14} className="text-white/30" />}
              <span className={`text-sm font-medium ${diff < 0 ? 'text-accent-green' : diff > 0 ? 'text-orange-400' : 'text-white/30'}`}>
                {diff > 0 ? '+' : ''}{diff} kg desde el último registro
              </span>
            </div>
          )}
        </div>
      )}

      {/* Log form */}
      <div className="card space-y-3">
        <p className="font-semibold text-sm">Registrar peso</p>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="label">Peso (kg)</label>
            <input className="input" type="number" step="0.1" placeholder="70.5" value={form.weight_kg} onChange={e => setForm(f => ({ ...f, weight_kg: e.target.value }))} />
          </div>
          <div className="flex-1">
            <label className="label">% grasa (opcional)</label>
            <input className="input" type="number" step="0.1" placeholder="20" value={form.body_fat_pct} onChange={e => setForm(f => ({ ...f, body_fat_pct: e.target.value }))} />
          </div>
        </div>
        <input className="input text-sm" placeholder="Notas (opcional)" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        <button onClick={save} disabled={saving || !form.weight_kg} className="btn-primary text-sm py-2.5 disabled:opacity-40">
          {saving ? 'Guardando…' : '⚖️ Registrar peso'}
        </button>
      </div>

      {/* History */}
      <p className="section-title">Historial</p>
      <div className="space-y-2">
        {logs.map((log, i) => {
          const prev = logs[i + 1]?.weight_kg
          const d = prev ? (log.weight_kg - prev).toFixed(1) : null
          return (
            <div key={log.id} className="card flex items-center justify-between">
              <div>
                <p className="font-semibold">{log.weight_kg} kg</p>
                <p className="text-white/40 text-xs">{new Date(log.date + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</p>
              </div>
              <div className="text-right">
                {log.body_fat_pct && <p className="text-white/50 text-xs">{log.body_fat_pct}% grasa</p>}
                {d && <p className={`text-xs font-medium ${d < 0 ? 'text-accent-green' : 'text-orange-400'}`}>{d > 0 ? '+' : ''}{d}</p>}
              </div>
            </div>
          )
        })}
        {logs.length === 0 && <p className="text-white/30 text-center py-6">Sin registros de peso</p>}
      </div>
    </div>
  )
}

// ── MEASURES TAB ────────────────────────────────────────────
function MeasuresTab() {
  const { user } = useStore()
  const [logs, setLogs] = useState([])
  const [form, setForm] = useState({ waist_cm: '', hip_cm: '', chest_cm: '', left_arm_cm: '', left_thigh_cm: '', energy_level: '7', hunger_level: '5', adherence_pct: '80', notes: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) supabase.from('body_measurements').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(6).then(({ data }) => setLogs(data || []))
  }, [user])

  async function save() {
    setSaving(true)
    try {
      const payload = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v === '' ? null : isNaN(v) ? v : parseFloat(v)]))
      await supabase.from('body_measurements').insert({ ...payload, user_id: user.id })
      setForm({ waist_cm: '', hip_cm: '', chest_cm: '', left_arm_cm: '', left_thigh_cm: '', energy_level: '7', hunger_level: '5', adherence_pct: '80', notes: '' })
      const { data } = await supabase.from('body_measurements').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(6)
      setLogs(data || [])
    } catch (err) { alert(err.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-4">
      <div className="card space-y-3">
        <p className="font-semibold text-sm">Registrar medidas</p>
        <div className="grid grid-cols-2 gap-2">
          {[['waist_cm','Cintura (cm)'],['hip_cm','Cadera (cm)'],['chest_cm','Pecho (cm)'],['left_arm_cm','Brazo (cm)'],['left_thigh_cm','Muslo (cm)']].map(([k,p]) => (
            <input key={k} className="input text-sm" type="number" step="0.1" placeholder={p} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
          ))}
        </div>
        <div className="space-y-2">
          {[['energy_level','⚡ Energía','1-10'],['hunger_level','🍽️ Hambre','1-10'],['adherence_pct','✅ Adherencia dieta','%']].map(([k,l,u]) => (
            <div key={k} className="flex items-center gap-3">
              <label className="text-white/50 text-xs w-32">{l}</label>
              <input className="input flex-1 text-sm" type="number" min={u === '%' ? 0 : 1} max={u === '%' ? 100 : 10} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
              <span className="text-white/30 text-xs">{u}</span>
            </div>
          ))}
        </div>
        <input className="input text-sm" placeholder="Notas (cómo te encuentras esta semana)" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        <button onClick={save} disabled={saving} className="btn-primary text-sm py-2.5">
          {saving ? 'Guardando…' : '📏 Guardar medidas'}
        </button>
      </div>

      <p className="section-title">Historial</p>
      {logs.map(m => (
        <div key={m.id} className="card">
          <p className="text-white/40 text-xs mb-2">{new Date(m.date + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[['Cintura', m.waist_cm, 'cm'],['Cadera', m.hip_cm, 'cm'],['Pecho', m.chest_cm, 'cm']].filter(([,v]) => v).map(([l,v,u]) => (
              <div key={l} className="bg-surface-3 rounded-xl py-2">
                <p className="font-bold">{v}</p>
                <p className="text-white/30 text-[10px]">{l} {u}</p>
              </div>
            ))}
          </div>
          {m.adherence_pct && <div className="mt-2 flex items-center gap-2"><div className="flex-1 h-1.5 bg-surface-3 rounded-full"><div className="h-full bg-accent-green rounded-full" style={{ width: `${m.adherence_pct}%` }} /></div><span className="text-white/40 text-xs">{m.adherence_pct}%</span></div>}
        </div>
      ))}
    </div>
  )
}

// ── LABS TAB ────────────────────────────────────────────────
function LabsTab() {
  const { user } = useStore()
  const [reports, setReports] = useState([])
  const [analyzing, setAnalyzing] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [mode, setMode] = useState('text')
  const [rawText, setRawText] = useState('')
  const [reportTitle, setReportTitle] = useState('')
  const fileRef = useRef()

  async function load() {
    const { data } = await supabase.from('lab_reports').select('*, lab_markers(*)').eq('user_id', user.id).order('report_date', { ascending: false })
    setReports(data || [])
  }
  useEffect(() => { if (user) load() }, [user])

  async function analyze(imageBase64, mediaType) {
    setAnalyzing(true)
    try {
      await api.labs.analyze({ rawText, imageBase64, mediaType, title: reportTitle || 'Analítica' })
      setRawText(''); setReportTitle('')
      load()
    } catch (err) { alert('Error: ' + err.message) }
    finally { setAnalyzing(false) }
  }

  async function handleFile(e) {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const base64 = ev.target.result.split(',')[1]
      analyze(base64, file.type)
    }
    reader.readAsDataURL(file)
  }

  async function deleteReport(id) {
    await api.labs.deleteReport(id)
    load()
  }

  const STATUS_COLORS = { low: 'text-blue-400 bg-blue-400/10', normal: 'text-accent-green bg-accent-green/10', high: 'text-orange-400 bg-orange-400/10', critical: 'text-red-400 bg-red-400/10' }
  const STATUS_LABELS = { low: 'Bajo', normal: 'Normal', high: 'Alto', critical: 'Crítico' }

  return (
    <div className="space-y-4">
      <div className="card space-y-3">
        <p className="font-semibold">Subir analítica</p>
        <div className="flex gap-2">
          {[['text','✍️ Texto'],['image','📷 Imagen']].map(([v,l]) => (
            <button key={v} onClick={() => setMode(v)}
              className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all ${mode === v ? 'border-accent bg-accent/20' : 'border-white/10 text-white/40'}`}>{l}</button>
          ))}
        </div>
        <input className="input text-sm" placeholder="Título (ej: Analítica enero 2025)" value={reportTitle} onChange={e => setReportTitle(e.target.value)} />
        {mode === 'text' ? (
          <>
            <textarea className="input resize-none text-sm" rows={6} placeholder="Pega aquí el texto de tu analítica (valores, unidades, rangos…)" value={rawText} onChange={e => setRawText(e.target.value)} />
            <button onClick={() => analyze(null, null)} disabled={analyzing || !rawText.trim()} className="btn-primary text-sm py-2.5 disabled:opacity-40 flex items-center justify-center gap-2">
              {analyzing ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analizando…</> : '🔬 Analizar con IA'}
            </button>
          </>
        ) : (
          <>
            <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFile} />
            <button onClick={() => fileRef.current?.click()} disabled={analyzing}
              className="btn-primary text-sm py-2.5 flex items-center justify-center gap-2 disabled:opacity-40">
              {analyzing ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analizando…</> : <><Upload size={14} /> Subir imagen/PDF</>}
            </button>
          </>
        )}
      </div>

      <p className="section-title">Mis analíticas</p>
      {reports.map(report => (
        <motion.div key={report.id} className="card cursor-pointer" onClick={() => setExpanded(expanded === report.id ? null : report.id)}>
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold">{report.title}</p>
              <p className="text-white/40 text-xs">{new Date(report.report_date + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${report.status === 'analyzed' ? 'bg-accent-green/20 text-accent-green' : 'bg-yellow-500/20 text-yellow-400'}`}>
                {report.status === 'analyzed' ? '✓ Analizada' : 'Pendiente'}
              </span>
              <button onClick={e => { e.stopPropagation(); deleteReport(report.id) }} className="text-white/20 hover:text-red-400 p-1 transition-all">
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          {expanded === report.id && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 space-y-4">
              {report.ai_interpretation && (
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Interpretación</p>
                  <p className="text-white/70 text-sm leading-relaxed">{report.ai_interpretation}</p>
                </div>
              )}
              {report.lab_markers?.length > 0 && (
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Marcadores</p>
                  <div className="space-y-1.5">
                    {report.lab_markers.map(m => (
                      <div key={m.id} className="flex items-center justify-between py-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{MARKER_CATEGORIES[m.category] || '🔬'}</span>
                          <p className="text-sm">{m.marker_name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{m.value} {m.unit}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[m.status]}`}>
                            {STATUS_LABELS[m.status]}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {report.ai_recommendations && (
                <div className="card bg-gradient-to-r from-violet-500/10 to-indigo-500/5 border-violet-500/15">
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-2">💡 Recomendaciones del Coach</p>
                  <p className="text-white/70 text-sm leading-relaxed">{report.ai_recommendations}</p>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      ))}
      {reports.length === 0 && (
        <div className="text-center py-8 text-white/30">
          <FlaskConical size={36} className="mx-auto mb-3 opacity-30" />
          <p>Sin analíticas subidas</p>
        </div>
      )}
    </div>
  )
}

// ── TREATMENTS TAB ──────────────────────────────────────────
function TreatmentsTab() {
  const { user } = useStore()
  const [treatments, setTreatments] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', type: 'other', dose: '', frequency: '', notes: '', start_date: '' })

  async function load() {
    const { data } = await supabase.from('medical_treatments').select('*').eq('user_id', user.id).eq('active', true).order('created_at', { ascending: false })
    setTreatments(data || [])
  }
  useEffect(() => { if (user) load() }, [user])

  async function add() {
    if (!form.name) return
    await supabase.from('medical_treatments').insert({ ...form, user_id: user.id, affects_weight: ['glp1','thyroid','insulin','corticoid','contraceptive'].includes(form.type), affects_appetite: ['glp1','antidepressant'].includes(form.type) })
    setForm({ name: '', type: 'other', dose: '', frequency: '', notes: '', start_date: '' })
    setShowForm(false); load()
  }

  async function remove(id) {
    await supabase.from('medical_treatments').update({ active: false }).eq('id', id)
    load()
  }

  const TYPES = { glp1: '💉 GLP-1', thyroid: '🦋 Tiroides', insulin: '💉 Insulina', contraceptive: '💊 Anticonceptivo', antidepressant: '💊 Antidepresivo', corticoid: '💊 Corticoide', other: '💊 Otro' }

  return (
    <div className="space-y-4">
      <button onClick={() => setShowForm(true)} className="btn-primary flex items-center justify-center gap-2">
        <Plus size={15} /> Añadir tratamiento
      </button>

      {showForm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card space-y-3">
          <input className="input" placeholder="Nombre del tratamiento o medicamento" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
          <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
            {Object.entries(TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <div className="flex gap-2">
            <input className="input flex-1" placeholder="Dosis (ej: 0.5mg)" value={form.dose} onChange={e => setForm(f => ({ ...f, dose: e.target.value }))} />
            <input className="input flex-1" placeholder="Frecuencia (ej: semanal)" value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))} />
          </div>
          <input className="input" type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="btn-secondary text-sm py-2">Cancelar</button>
            <button onClick={add} className="btn-primary text-sm py-2">Guardar</button>
          </div>
        </motion.div>
      )}

      <div className="space-y-2">
        {treatments.map(t => (
          <div key={t.id} className="card flex items-start justify-between">
            <div>
              <p className="font-semibold text-sm">{t.name}</p>
              <p className="text-white/40 text-xs">{TYPES[t.type]} {t.dose && `· ${t.dose}`} {t.frequency && `· ${t.frequency}`}</p>
              <div className="flex gap-2 mt-1">
                {t.affects_weight && <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">Afecta al peso</span>}
                {t.affects_appetite && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">Afecta al apetito</span>}
              </div>
            </div>
            <button onClick={() => remove(t.id)} className="text-white/20 hover:text-red-400 p-2 transition-all">
              <Trash2 size={13} />
            </button>
          </div>
        ))}
        {treatments.length === 0 && (
          <div className="text-center py-8 text-white/30">
            <Pill size={36} className="mx-auto mb-3 opacity-30" />
            <p>Sin tratamientos registrados</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── MAIN PAGE ───────────────────────────────────────────────
export default function HealthTracking() {
  const [tab, setTab] = useState('weight')

  return (
    <div className="page pb-32">
      <h1 className="text-2xl font-extrabold mb-2">Seguimiento 📊</h1>
      <p className="text-white/40 text-sm mb-4">Progreso semanal y datos de salud</p>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              tab === t.id ? 'bg-accent text-white' : 'bg-surface-2 text-white/50 border border-white/5'
            }`}>
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
    </div>
  )
}
