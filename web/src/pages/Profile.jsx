import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, Edit2, Check, Sparkles, Palette, ChevronDown, ChevronUp } from 'lucide-react'
import { useStore } from '../store/useStore'
import { useNavigate, Link } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeProvider'
import { useTour } from '../hooks/useTour'
import TourHelpButton from '../components/tour/TourHelpButton'
import InstallPWA from '../components/InstallPWA'
import NotificationSetup from '../components/NotificationSetup'
import LanguagePicker from '../components/LanguagePicker'

// ─── LABELS ───────────────────────────────────────────────────────────────────

const GOAL_LABELS = {
  lose_fat:    'Perder grasa 🔥',
  gain_muscle: 'Ganar músculo 💪',
  maintain:    'Mantener peso ⚖️',
  recomp:      'Recomposición 🔄',
  health:      'Salud general ❤️',
  define:      'Definición ✂️',
}
const ACTIVITY_LABELS = {
  sedentary: 'Sedentario 🛋️',
  light:     'Ligero 🚶',
  moderate:  'Moderado 🏃',
  intense:   'Intenso ⚡',
  athlete:   'Atleta 🏆',
}
const DIET_LABELS = {
  omnivore:    'Omnívoro 🍗',
  vegetarian:  'Vegetariano 🥗',
  vegan:       'Vegano 🌱',
  pescatarian: 'Pescetariano 🐟',
  keto:        'Keto 🥑',
  paleo:       'Paleo 🍖',
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function calcBMI(weight, height) {
  if (!weight || !height) return null
  return Math.round((weight / ((height / 100) ** 2)) * 10) / 10
}

function bmiLabel(bmi) {
  if (!bmi) return '–'
  if (bmi < 18.5) return 'Bajo peso'
  if (bmi < 25)   return 'Normal'
  if (bmi < 30)   return 'Sobrepeso'
  return 'Obesidad'
}

function bmiColor(bmi, theme) {
  if (!bmi) return theme.textMuted
  if (bmi < 18.5) return '#60A5FA'
  if (bmi < 25)   return theme.success || '#4ADE80'
  if (bmi < 30)   return '#FBBF24'
  return theme.error || '#F87171'
}

function formatDate(iso) {
  if (!iso) return '–'
  return new Date(iso).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function daysSince(iso) {
  if (!iso) return null
  const diff = Date.now() - new Date(iso).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

// ─── DELTA BADGE ──────────────────────────────────────────────────────────────

function DeltaBadge({ delta, unit = 'kg', invertColors = false }) {
  if (delta === null || delta === undefined || isNaN(delta)) return null
  const isPositive = delta > 0
  // invertColors: para peso, bajar es bueno si el objetivo es perder
  const isGood = invertColors ? !isPositive : isPositive
  const color  = delta === 0 ? '#888' : isGood ? '#4ADE80' : '#F87171'
  const sign   = delta > 0 ? '+' : ''

  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '2px 7px',
      borderRadius: 8, background: `${color}20`, color,
      display: 'inline-flex', alignItems: 'center', gap: 2,
    }}>
      {sign}{delta} {unit}
    </span>
  )
}

// ─── CARD DE ESTADÍSTICA CON COMPARATIVA ──────────────────────────────────────

function StatComparison({ emoji, label, initial, current, unit, invertDelta = false, theme }) {
  const delta = (initial != null && current != null)
    ? Math.round((current - initial) * 10) / 10
    : null

  return (
    <div style={{
      background: theme.surface2 || theme.surface,
      borderRadius: 16,
      padding: '14px 16px',
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <p style={{ fontSize: 11, color: theme.textMuted, margin: 0, fontWeight: 600 }}>
        {emoji} {label}
      </p>

      {/* Fila inicio → actual */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* Inicio */}
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 10, color: theme.textMuted, margin: '0 0 2px' }}>Inicio</p>
          <p style={{ fontSize: 18, fontWeight: 700, color: theme.textMuted, margin: 0 }}>
            {initial != null ? `${initial}` : '–'}
            <span style={{ fontSize: 11, fontWeight: 400, marginLeft: 2 }}>{unit}</span>
          </p>
        </div>

        {/* Flecha */}
        <div style={{ color: theme.textMuted, fontSize: 16, opacity: 0.4 }}>→</div>

        {/* Actual */}
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 10, color: theme.textMuted, margin: '0 0 2px' }}>Ahora</p>
          <p style={{ fontSize: 18, fontWeight: 700, color: theme.text, margin: 0 }}>
            {current != null ? `${current}` : '–'}
            <span style={{ fontSize: 11, fontWeight: 400, marginLeft: 2 }}>{unit}</span>
          </p>
        </div>

        {/* Delta */}
        {delta !== null && delta !== 0 && (
          <DeltaBadge delta={delta} unit={unit} invertColors={invertDelta} />
        )}
        {delta === 0 && (
          <span style={{
            fontSize: 11, padding: '2px 7px', borderRadius: 8,
            background: 'rgba(128,128,128,0.12)', color: theme.textMuted,
          }}>
            Sin cambios
          </span>
        )}
      </div>
    </div>
  )
}

// ─── SECCIÓN DE ORIGEN ────────────────────────────────────────────────────────

function OriginCard({ hp, theme }) {
  const [expanded, setExpanded] = useState(false)
  const days = daysSince(hp?.onboarding_date || hp?.created_at)

  if (!hp?.onboarding_done) return null

  return (
    <motion.div
      style={{
        borderRadius: 20,
        overflow: 'hidden',
        border: `1.5px solid ${theme.border}`,
        marginBottom: 16,
      }}>

      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          gap: 12, padding: '14px 16px',
          background: theme.surface,
          border: 'none', cursor: 'pointer',
        }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, flexShrink: 0,
        }}>
          🐣
        </div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: theme.text, margin: 0 }}>
            Tu punto de partida
          </p>
          <p style={{ fontSize: 12, color: theme.textMuted, margin: '2px 0 0' }}>
            {hp?.onboarding_date || hp?.created_at
              ? `${formatDate(hp.onboarding_date || hp.created_at)}${days !== null ? ` · hace ${days} días` : ''}`
              : 'Registro inicial'}
          </p>
        </div>
        {expanded
          ? <ChevronUp size={16} style={{ color: theme.textMuted }} />
          : <ChevronDown size={16} style={{ color: theme.textMuted }} />}
      </button>

      {/* Contenido expandible */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden', background: theme.bg || theme.surface2 }}>

            <div style={{ padding: '4px 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>

              {/* Datos corporales de inicio */}
              <p style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted,
                textTransform: 'uppercase', letterSpacing: '0.06em', margin: '8px 0 4px' }}>
                Datos corporales al empezar
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  ['⚖️', 'Peso', hp?.initial_weight_kg, 'kg'],
                  ['📊', 'IMC', hp?.initial_bmi, ''],
                  ['📏', 'Altura', hp?.height_cm, 'cm'],
                  ['🎯', 'Calorías/día', hp?.initial_calories, 'kcal'],
                ].map(([e, l, v, u]) => (
                  <div key={l} style={{
                    background: theme.surface2 || theme.surface,
                    borderRadius: 12, padding: '10px 12px',
                  }}>
                    <p style={{ fontSize: 10, color: theme.textMuted, margin: '0 0 3px' }}>{e} {l}</p>
                    <p style={{ fontSize: 16, fontWeight: 700, color: theme.text, margin: 0 }}>
                      {v != null ? v : '–'}
                      <span style={{ fontSize: 11, fontWeight: 400, marginLeft: 2 }}>{u}</span>
                    </p>
                  </div>
                ))}
              </div>

              {/* Macros de inicio */}
              {hp?.initial_protein_g && (
                <>
                  <p style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted,
                    textTransform: 'uppercase', letterSpacing: '0.06em', margin: '6px 0 4px' }}>
                    Macros objetivo al empezar
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    {[
                      ['🥩', 'Proteína', hp.initial_protein_g, 'g'],
                      ['🌾', 'Carbos',   hp.initial_carbs_g,   'g'],
                      ['🥑', 'Grasa',    hp.initial_fat_g,     'g'],
                    ].map(([e, l, v, u]) => (
                      <div key={l} style={{
                        background: theme.surface2 || theme.surface,
                        borderRadius: 12, padding: '10px 10px',
                        textAlign: 'center',
                      }}>
                        <p style={{ fontSize: 10, color: theme.textMuted, margin: '0 0 3px' }}>{e} {l}</p>
                        <p style={{ fontSize: 15, fontWeight: 700, color: theme.text, margin: 0 }}>
                          {v != null ? v : '–'}<span style={{ fontSize: 10 }}>{u}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Objetivo y actividad de inicio */}
              {(hp?.initial_goal || hp?.initial_activity) && (
                <>
                  <p style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted,
                    textTransform: 'uppercase', letterSpacing: '0.06em', margin: '6px 0 4px' }}>
                    Perfil al empezar
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {hp?.initial_goal && (
                      <div style={{ display: 'flex', justifyContent: 'space-between',
                        padding: '8px 12px', borderRadius: 10,
                        background: theme.surface2 || theme.surface }}>
                        <span style={{ fontSize: 12, color: theme.textMuted }}>🎯 Objetivo</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: theme.text }}>
                          {GOAL_LABELS[hp.initial_goal] || hp.initial_goal}
                        </span>
                      </div>
                    )}
                    {hp?.initial_activity && (
                      <div style={{ display: 'flex', justifyContent: 'space-between',
                        padding: '8px 12px', borderRadius: 10,
                        background: theme.surface2 || theme.surface }}>
                        <span style={{ fontSize: 12, color: theme.textMuted }}>🏃 Actividad</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: theme.text }}>
                          {ACTIVITY_LABELS[hp.initial_activity] || hp.initial_activity}
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────

export default function Profile() {
  const { profile, healthProfile, updateProfile, logout } = useStore()
  const { theme } = useTheme()
  const [editing, setEditing]   = useState(false)
  const [form, setForm]         = useState({
    name:                 profile?.name || '',
    age:                  String(profile?.age || ''),
    weight_kg:            String(healthProfile?.weight_kg || profile?.weight_kg || ''),
    height_cm:            String(healthProfile?.height_cm || profile?.height_cm || ''),
    goal:                 healthProfile?.goal || profile?.goal || '',
    activity_level:       healthProfile?.activity_level || profile?.activity_level || '',
    physical_limitations: profile?.physical_limitations || '',
    specific_goals:       profile?.specific_goals || '',
    dietary_restrictions: profile?.dietary_restrictions || '',
  })
  const navigate = useNavigate()

  useTour('profile')

  // hp = health_profiles row (donde está el snapshot)
  // Puede venir de useStore como healthProfile, o del profile enriquecido
  const hp = healthProfile || profile

  // Métricas actuales
  const currentWeight = parseFloat(hp?.weight_kg) || null
  const currentHeight = parseFloat(hp?.height_cm) || null
  const currentBMI    = calcBMI(currentWeight, currentHeight)

  // Métricas iniciales (snapshot)
  const initWeight = parseFloat(hp?.initial_weight_kg) || null
  const initBMI    = parseFloat(hp?.initial_bmi) || null

  // Delta de peso: negativo = bajó (bueno si quiere perder)
  const weightDelta = (initWeight && currentWeight)
    ? Math.round((currentWeight - initWeight) * 10) / 10
    : null

  async function save() {
    await updateProfile({
      ...form,
      age:                  parseInt(form.age) || null,
      weight_kg:            parseFloat(form.weight_kg) || null,
      height_cm:            parseFloat(form.height_cm) || null,
      physical_limitations: form.physical_limitations || null,
      specific_goals:       form.specific_goals || null,
      dietary_restrictions: form.dietary_restrictions || null,
    })
    setEditing(false)
  }

  async function handleLogout() {
    await logout()
    navigate('/auth')
  }

  return (
    <div className="page">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 className="text-2xl font-extrabold">Perfil 👤</h1>
        <button
          onClick={() => editing ? save() : setEditing(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            borderRadius: 12, padding: '8px 16px', fontSize: 13, fontWeight: 600,
            background: theme.surface, border: `1px solid ${theme.border}`, color: theme.text,
            cursor: 'pointer',
          }}>
          {editing ? <><Check size={14} /> Guardar</> : <><Edit2 size={14} /> Editar</>}
        </button>
      </div>

      {/* ── AVATAR + NOMBRE ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
        <div style={{
          width: 72, height: 72, borderRadius: 22,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, fontWeight: 700, marginBottom: 10,
          background: theme.gradientBrand || theme.primary,
          color: 'white',
        }}>
          {profile?.name?.[0]?.toUpperCase() || '?'}
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: theme.text, margin: 0 }}>
          {profile?.name}
        </h2>
        <p style={{ fontSize: 13, color: theme.textMuted, margin: '4px 0 0' }}>
          Nivel {profile?.level || 1} · {profile?.xp || 0} XP
        </p>
        {hp?.onboarding_date || hp?.created_at ? (
          <p style={{ fontSize: 11, color: theme.textMuted, margin: '4px 0 0', opacity: 0.7 }}>
            Con Pandi desde {formatDate(hp.onboarding_date || hp.created_at)}
          </p>
        ) : null}
      </div>

      {/* ── STATS ACTUALES ─────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          ['⚖️', currentWeight ? `${currentWeight} kg` : '–', 'Peso'],
          ['📏', currentHeight ? `${currentHeight} cm` : '–', 'Altura'],
          ['📊', currentBMI || '–', bmiLabel(currentBMI)],
        ].map(([e, v, l]) => (
          <div key={l} className="card" style={{ textAlign: 'center', padding: '12px 8px' }}>
            <p style={{ fontSize: 20, margin: '0 0 4px' }}>{e}</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: theme.text, margin: 0 }}>{v}</p>
            <p style={{ fontSize: 10, color: theme.textMuted, margin: '2px 0 0' }}>{l}</p>
          </div>
        ))}
      </div>

      {/* ── PROGRESIÓN: COMPARATIVA INICIO vs AHORA ────────────────────────── */}
      {initWeight && (
        <div style={{ marginBottom: 20 }}>
          <p style={{
            fontSize: 11, fontWeight: 700, color: theme.textMuted,
            textTransform: 'uppercase', letterSpacing: '0.06em',
            margin: '0 0 10px',
          }}>
            📈 Tu progresión
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <StatComparison
              emoji="⚖️" label="Peso"
              initial={initWeight} current={currentWeight}
              unit="kg" invertDelta={true}
              theme={theme} />

            {initBMI && (
              <StatComparison
                emoji="📊" label="IMC"
                initial={initBMI} current={currentBMI}
                unit="" invertDelta={true}
                theme={theme} />
            )}

            {hp?.initial_goal && hp?.goal && hp.initial_goal !== hp.goal && (
              <div style={{
                background: theme.surface2 || theme.surface,
                borderRadius: 16, padding: '14px 16px',
              }}>
                <p style={{ fontSize: 11, color: theme.textMuted, margin: '0 0 8px', fontWeight: 600 }}>
                  🎯 Evolución de objetivo
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontSize: 12, padding: '4px 10px', borderRadius: 8,
                    background: theme.surface, color: theme.textMuted, border: `1px solid ${theme.border}`,
                  }}>
                    {GOAL_LABELS[hp.initial_goal] || hp.initial_goal}
                  </span>
                  <span style={{ color: theme.textMuted, fontSize: 14 }}>→</span>
                  <span style={{
                    fontSize: 12, padding: '4px 10px', borderRadius: 8,
                    background: `${theme.primary}20`, color: theme.primary,
                    border: `1px solid ${theme.primary}40`,
                    fontWeight: 600,
                  }}>
                    {GOAL_LABELS[hp.goal] || hp.goal}
                  </span>
                </div>
              </div>
            )}

            {/* Días activo + racha */}
            {(hp?.onboarding_date || hp?.created_at) && (
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
              }}>
                <div style={{
                  background: theme.surface2 || theme.surface,
                  borderRadius: 16, padding: '14px 16px', textAlign: 'center',
                }}>
                  <p style={{ fontSize: 28, fontWeight: 800, color: theme.text, margin: 0 }}>
                    {daysSince(hp.onboarding_date || hp.created_at) ?? '–'}
                  </p>
                  <p style={{ fontSize: 11, color: theme.textMuted, margin: '4px 0 0' }}>
                    días con Pandi
                  </p>
                </div>
                <div style={{
                  background: theme.surface2 || theme.surface,
                  borderRadius: 16, padding: '14px 16px', textAlign: 'center',
                }}>
                  <p style={{ fontSize: 28, fontWeight: 800, color: theme.text, margin: 0 }}>
                    {profile?.streak || 0}
                  </p>
                  <p style={{ fontSize: 11, color: theme.textMuted, margin: '4px 0 0' }}>
                    días de racha 🔥
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PUNTO DE PARTIDA (expandible) ──────────────────────────────────── */}
      <OriginCard hp={hp} theme={theme} />

      {/* ── EDITAR / VER DATOS ─────────────────────────────────────────────── */}
      {editing ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="card" style={{ marginBottom: 16 }} data-tour="profile-data">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              ['name',      'Nombre',      'text'],
              ['weight_kg', 'Peso (kg)',   'number'],
              ['height_cm', 'Altura (cm)', 'number'],
            ].map(([k, p, t]) => (
              <div key={k}>
                <label className="label">{p}</label>
                <input className="input" type={t} value={form[k]}
                  onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
              </div>
            ))}
            <div>
              <label className="label">Objetivo</label>
              <select className="input" value={form.goal}
                onChange={e => setForm(f => ({ ...f, goal: e.target.value }))}>
                {Object.entries(GOAL_LABELS).map(([v, l]) =>
                  <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Actividad</label>
              <select className="input" value={form.activity_level}
                onChange={e => setForm(f => ({ ...f, activity_level: e.target.value }))}>
                {Object.entries(ACTIVITY_LABELS).map(([v, l]) =>
                  <option key={v} value={v}>{l}</option>)}
              </select>
            </div>

            {/* Salud avanzada */}
            <p style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted,
              textTransform: 'uppercase', letterSpacing: '0.06em', margin: '8px 0 0' }}>
              Salud avanzada (opcional)
            </p>
            {[
              ['physical_limitations', 'Lesiones o limitaciones', 'Ej: rodilla derecha, lumbar…'],
              ['specific_goals',       'Objetivo específico',      'Ej: correr 10km, sentadilla…'],
              ['dietary_restrictions', 'Restricciones alimentarias','Ej: sin gluten, halal…'],
            ].map(([k, l, ph]) => (
              <div key={k}>
                <label className="label">{l}</label>
                <input className="input" placeholder={ph} value={form[k]}
                  onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
              </div>
            ))}
          </div>
        </motion.div>
      ) : (
        <div className="card" style={{ marginBottom: 16 }} data-tour="profile-data">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[
              ['🎯', 'Objetivo',        GOAL_LABELS[hp?.goal] || '–'],
              ['🏃', 'Actividad',       ACTIVITY_LABELS[hp?.activity_level] || '–'],
              ['🥗', 'Dieta',           DIET_LABELS[hp?.diet_type] || '–'],
              ['🌙', 'Sueño habitual',  hp?.sleep_hours ? `${hp.sleep_hours} h` : '–'],
              ['⏰', 'Me despierto',    hp?.wake_time || '–'],
              ['💼', 'Profesión',       hp?.profession || '–'],
              ['🚬', 'Fumador',         hp?.is_smoker ? 'Sí' : 'No'],
              ['🍷', 'Alcohol',         hp?.alcohol_frequency || '–'],
            ].map(([e, l, v]) => (
              <div key={l} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom: `1px solid ${theme.border}20`,
              }}>
                <span style={{ fontSize: 13, color: theme.textMuted }}>{e} {l}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: theme.text, maxWidth: '55%',
                  textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {v}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── PREMIUM BANNER ─────────────────────────────────────────────────── */}
      <Link to="/premium" data-tour="profile-premium">
        <motion.div whileTap={{ scale: 0.97 }}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: 16, borderRadius: 18, marginBottom: 12,
            background: theme.gradientBrand || theme.primary,
          }}>
          <Sparkles size={20} color="white" style={{ flexShrink: 0 }} />
          <div>
            <p style={{ fontWeight: 700, color: 'white', fontSize: 13, margin: 0 }}>
              Hazte Premium ⭐
            </p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', margin: '2px 0 0' }}>
              7 días gratis · Cancela cuando quieras
            </p>
          </div>
          <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.6)', fontSize: 18 }}>›</span>
        </motion.div>
      </Link>

      {/* ── CICLO MENSTRUAL ─────────────────────────────────────────────────── */}
      {(profile?.sex === 'female' || !profile?.sex) && (
        <div className="card" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
          }}>
            🩸
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: theme.text, margin: 0 }}>
              Seguimiento del ciclo
            </p>
            <p style={{ fontSize: 11, color: theme.textMuted, margin: '2px 0 0' }}>
              Calendario menstrual en Mi Bienestar
            </p>
          </div>
          <button
            onClick={async () => {
              await updateProfile({ menstrual_tracking_enabled: !profile?.menstrual_tracking_enabled })
            }}
            style={{
              width: 48, height: 28, borderRadius: 14,
              background: profile?.menstrual_tracking_enabled ? theme.primary : theme.surface2,
              border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0,
            }}>
            <motion.div
              animate={{ x: profile?.menstrual_tracking_enabled ? 22 : 2 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              style={{
                position: 'absolute', top: 5,
                width: 18, height: 18, borderRadius: '50%',
                background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }} />
          </button>
        </div>
      )}

      {/* ── IDIOMA ──────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 12 }}>
        <LanguagePicker />
      </div>

      {/* ── APARIENCIA ──────────────────────────────────────────────────────── */}
      <Link to="/appearance" data-tour="profile-appearance">
        <motion.div whileTap={{ scale: 0.97 }}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: 16, borderRadius: 18, marginBottom: 12,
            background: theme.surface, border: `1px solid ${theme.border}`,
          }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: `${theme.primary}20`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Palette size={18} style={{ color: theme.primary }} />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: theme.text, margin: 0 }}>Apariencia</p>
            <p style={{ fontSize: 11, color: theme.textMuted, margin: '2px 0 0' }}>Temas y colores de la app</p>
          </div>
          <span style={{ marginLeft: 'auto', color: theme.textMuted, fontSize: 18 }}>›</span>
        </motion.div>
      </Link>

      {/* ── PWA + NOTIFICACIONES ────────────────────────────────────────────── */}
      <div style={{ marginBottom: 12 }}><InstallPWA /></div>
      <div style={{ marginBottom: 20 }}><NotificationSetup /></div>

      {/* ── LOGOUT ──────────────────────────────────────────────────────────── */}
      <button onClick={handleLogout}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 8, padding: '12px 0', borderRadius: 14, fontSize: 13, fontWeight: 500,
          border: `1px solid ${theme.error}50`, color: theme.error,
          background: 'transparent', cursor: 'pointer',
        }}>
        <LogOut size={14} /> Cerrar sesión
      </button>

      <TourHelpButton tourKey="profile" />
    </div>
  )
}
