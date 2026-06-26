// web/src/components/nutrition/RecetasTab.jsx
// Planes semanales personalizados por IA según objetivo del usuario
// Lunes / Miércoles / Viernes — desayuno, comida, merienda, cena

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeProvider'
import { useStore } from '../../store/useStore'
import { supabase } from '../../lib/supabase'

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function getWeekKey() {
  const d   = new Date()
  const jan = new Date(d.getFullYear(), 0, 1)
  const week = Math.ceil(((d - jan) / 86400000 + jan.getDay() + 1) / 7)
  return `pandi_recipes_w${week}_${d.getFullYear()}`
}

const GOAL_LABELS = {
  lose_weight:    'perder peso',
  gain_muscle:    'ganar músculo',
  maintain:       'mantener peso',
  improve_health: 'mejorar salud',
  default:        'mejorar salud',
}

const DAYS = [
  { key: 'lunes',     label: 'Lunes',      emoji: '🌅' },
  { key: 'miercoles', label: 'Miércoles',  emoji: '🌤️' },
  { key: 'viernes',   label: 'Viernes',    emoji: '🌟' },
]

const MEALS_ORDER = [
  { key: 'desayuno', label: '🌅 Desayuno' },
  { key: 'comida',   label: '☀️ Comida'   },
  { key: 'merienda', label: '🍎 Merienda' },
  { key: 'cena',     label: '🌙 Cena'     },
]

// ─── COMPONENTE TARJETA DÍA ───────────────────────────────────────────────────

function DayCard({ day, plan, theme }) {
  const [open, setOpen] = useState(false)

  return (
    <motion.div layout
      style={{ borderRadius:20, overflow:'hidden',
        background: theme.surface, border:`1px solid ${theme.border}` }}>

      {/* Header del día */}
      <button onClick={() => setOpen(o => !o)}
        style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'14px 16px', background:'none', border:'none', cursor:'pointer' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:22 }}>{day.emoji}</span>
          <div style={{ textAlign:'left' }}>
            <p style={{ fontSize:15, fontWeight:800, color: theme.text, margin:0 }}>{day.label}</p>
            <p style={{ fontSize:11, color: theme.textMuted, margin:'2px 0 0' }}>
              {plan?.kcal_total ? `~${plan.kcal_total} kcal · ` : ''}
              {plan?.resumen || 'Plan del día'}
            </p>
          </div>
        </div>
        {open
          ? <ChevronUp size={18} color={theme.textMuted} />
          : <ChevronDown size={18} color={theme.textMuted} />
        }
      </button>

      {/* Contenido expandible */}
      <AnimatePresence>
        {open && plan && (
          <motion.div
            initial={{ height:0, opacity:0 }}
            animate={{ height:'auto', opacity:1 }}
            exit={{ height:0, opacity:0 }}
            transition={{ duration:0.2 }}>
            <div style={{ padding:'0 16px 16px', borderTop:`1px solid ${theme.border}` }}>

              {/* Macros del día */}
              {plan.macros && (
                <div style={{ display:'flex', gap:8, margin:'12px 0',
                  padding:'10px 12px', borderRadius:14,
                  background: theme.primary + '10' }}>
                  {[
                    { l:'Proteína', v: plan.macros.protein + 'g' },
                    { l:'Carbos',   v: plan.macros.carbs + 'g'   },
                    { l:'Grasa',    v: plan.macros.fat + 'g'     },
                  ].map(({ l, v }) => (
                    <div key={l} style={{ flex:1, textAlign:'center' }}>
                      <p style={{ fontSize:13, fontWeight:800, color: theme.primary, margin:0 }}>{v}</p>
                      <p style={{ fontSize:10, color: theme.textMuted, margin:'2px 0 0' }}>{l}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Comidas del día */}
              <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:8 }}>
                {MEALS_ORDER.map(meal => {
                  const m = plan[meal.key]
                  if (!m) return null
                  return (
                    <div key={meal.key}
                      style={{ padding:'10px 12px', borderRadius:14,
                        background: theme.surface2 }}>
                      <p style={{ fontSize:11, fontWeight:700, color: theme.textMuted,
                        margin:'0 0 4px', textTransform:'uppercase', letterSpacing:'.05em' }}>
                        {meal.label}
                      </p>
                      <p style={{ fontSize:13, fontWeight:700, color: theme.text, margin:'0 0 3px' }}>
                        {m.nombre}
                      </p>
                      <p style={{ fontSize:12, color: theme.textMuted, margin:'0 0 4px', lineHeight:1.4 }}>
                        {m.descripcion}
                      </p>
                      {m.kcal && (
                        <p style={{ fontSize:11, color: theme.primary, fontWeight:600, margin:0 }}>
                          ~{m.kcal} kcal
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Consejo Pandi */}
              {plan.consejo_pandi && (
                <div style={{ marginTop:12, padding:'10px 12px', borderRadius:14,
                  background: '#6EE7B710', border:'1px solid #6EE7B730',
                  display:'flex', gap:8 }}>
                  <span style={{ fontSize:18 }}>🐾</span>
                  <p style={{ fontSize:12, color: theme.text, margin:0, lineHeight:1.5 }}>
                    {plan.consejo_pandi}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────

export default function RecetasTab() {
  const { theme }         = useTheme()
  const { user, profile } = useStore()
  const [plans,    setPlans]    = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [goal,     setGoal]     = useState('default')
  const weekKey = getWeekKey()

  useEffect(() => {
    if (!user) return
    loadGoalAndPlans()
  }, [user])

  async function loadGoalAndPlans() {
    // Obtener objetivo del usuario
    try {
      const { data } = await supabase.from('health_profiles')
        .select('goal, diet_type, calories_goal, protein_goal')
        .eq('user_id', user.id)
        .maybeSingle()
      if (data?.goal) setGoal(data.goal)
    } catch {}

    // Intentar cargar desde cache semanal
    try {
      const cached = localStorage.getItem(weekKey)
      if (cached) {
        setPlans(JSON.parse(cached))
        return
      }
    } catch {}

    // Generar nuevos planes
    await generatePlans()
  }

  async function generatePlans(forceRefresh = false) {
    if (loading) return
    setLoading(true)
    setError(null)

    if (forceRefresh) {
      try { localStorage.removeItem(weekKey) } catch {}
    }

    try {
      // Obtener datos del perfil para personalizar
      const { data: hp } = await supabase.from('health_profiles')
        .select('goal, diet_type, calories_goal, protein_goal, weight_kg, height_cm, activity_level')
        .eq('user_id', user.id).maybeSingle()

      const { data: up } = await supabase.from('user_profiles')
        .select('name').eq('id', user.id).maybeSingle()

      const goalStr    = GOAL_LABELS[hp?.goal || 'default']
      const kcalTarget = hp?.calories_goal || 2000
      const protTarget = hp?.protein_goal  || 150
      const dietType   = hp?.diet_type     || 'omnivora'
      const name       = up?.name?.split(' ')[0] || 'Usuario'

      const prompt = `Eres el coach nutricional Pandi. Crea planes de alimentación saludables para ${name}.

OBJETIVO: ${goalStr}
CALORÍAS OBJETIVO: ~${kcalTarget} kcal/día
PROTEÍNA OBJETIVO: ~${protTarget}g/día
TIPO DE DIETA: ${dietType}

Genera planes para LUNES, MIÉRCOLES y VIERNES. Cada día debe incluir desayuno, comida, merienda y cena. Las recetas deben ser simples, económicas y fáciles de preparar en España.

Responde ÚNICAMENTE con este JSON (sin markdown, sin explicaciones):
{
  "lunes": {
    "resumen": "descripción breve del día en 8 palabras",
    "kcal_total": 1850,
    "macros": { "protein": 145, "carbs": 210, "fat": 55 },
    "desayuno": { "nombre": "Nombre del plato", "descripcion": "Ingredientes y preparación breve", "kcal": 420 },
    "comida":   { "nombre": "Nombre del plato", "descripcion": "Ingredientes y preparación breve", "kcal": 650 },
    "merienda": { "nombre": "Nombre del plato", "descripcion": "Ingredientes y preparación breve", "kcal": 180 },
    "cena":     { "nombre": "Nombre del plato", "descripcion": "Ingredientes y preparación breve", "kcal": 520 },
    "consejo_pandi": "Consejo motivacional breve de Pandi relacionado con el objetivo"
  },
  "miercoles": { ... mismo formato ... },
  "viernes":   { ... mismo formato ... }
}`

      // Llamar al backend — Railway tiene la API key de Anthropic
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/recipes/weekly`,
        {
          method:  'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization:  `Bearer ${session?.access_token}`,
          },
        }
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const parsed = await res.json()

      // Guardar en cache semanal
      try { localStorage.setItem(weekKey, JSON.stringify(parsed)) } catch {}
      setPlans(parsed)
    } catch (err) {
      console.error('[RecetasTab]', err)
      setError('No se pudieron generar las recetas. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const goalLabel = GOAL_LABELS[goal] || GOAL_LABELS.default

  return (
    <div style={{ paddingBottom: 32 }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
        marginBottom:16 }}>
        <div>
          <p style={{ fontSize:16, fontWeight:900, color: theme.text, margin:0 }}>
            Plan semanal 🐾
          </p>
          <p style={{ fontSize:12, color: theme.textMuted, margin:'3px 0 0' }}>
            Personalizado para <strong>{goalLabel}</strong>
          </p>
        </div>
        <motion.button whileTap={{ scale:0.92 }}
          onClick={() => generatePlans(true)} disabled={loading}
          style={{ display:'flex', alignItems:'center', gap:6,
            padding:'8px 14px', borderRadius:14, border:'none', cursor:'pointer',
            background: theme.surface2, opacity: loading ? 0.5 : 1 }}>
          {loading
            ? <Loader2 size={14} color={theme.textMuted} style={{ animation:'spin 1s linear infinite' }} />
            : <RefreshCw size={14} color={theme.textMuted} />
          }
          <span style={{ fontSize:12, fontWeight:700, color: theme.textMuted }}>
            {loading ? 'Generando…' : 'Renovar'}
          </span>
        </motion.button>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>

      {/* Info cambio semanal */}
      <div style={{ padding:'10px 14px', borderRadius:14, marginBottom:16,
        background: theme.primary + '10', border:`1px solid ${theme.primary}20` }}>
        <p style={{ fontSize:12, color: theme.text, margin:0 }}>
          🔄 El plan se renueva cada semana automáticamente. Puedes renovarlo antes con el botón de arriba.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding:'12px 16px', borderRadius:14, marginBottom:16,
          background:'#FEF2F2', border:'1px solid #FECACA' }}>
          <p style={{ fontSize:13, color:'#EF4444', margin:'0 0 8px' }}>{error}</p>
          <button onClick={() => generatePlans()}
            style={{ fontSize:12, fontWeight:700, color:'#EF4444',
              background:'none', border:'none', cursor:'pointer', padding:0 }}>
            Reintentar →
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && !plans && (
        <div style={{ textAlign:'center', padding:'48px 0' }}>
          <p style={{ fontSize:36, margin:'0 0 12px' }}>🍳</p>
          <p style={{ fontSize:15, fontWeight:800, color: theme.text, margin:'0 0 6px' }}>
            Pandi está cocinando tu plan…
          </p>
          <p style={{ fontSize:13, color: theme.textMuted, margin:0 }}>
            Adaptando recetas a tu objetivo de {goalLabel}
          </p>
        </div>
      )}

      {/* Planes */}
      {plans && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {DAYS.map(day => (
            <DayCard key={day.key} day={day} plan={plans[day.key]} theme={theme} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!plans && !loading && !error && (
        <div style={{ textAlign:'center', padding:'48px 20px',
          background: theme.surface, borderRadius:20 }}>
          <p style={{ fontSize:40, margin:'0 0 12px' }}>🍽️</p>
          <p style={{ fontSize:15, fontWeight:800, color: theme.text, margin:'0 0 6px' }}>
            Sin plan esta semana
          </p>
          <p style={{ fontSize:13, color: theme.textMuted, margin:'0 0 16px' }}>
            Pandi te preparará 3 días completos adaptados a tu objetivo
          </p>
          <motion.button whileTap={{ scale:0.97 }} onClick={() => generatePlans()}
            style={{ padding:'12px 24px', borderRadius:16, border:'none', cursor:'pointer',
              background: theme.primary, color:'white', fontSize:14, fontWeight:700 }}>
            Generar plan semanal
          </motion.button>
        </div>
      )}
    </div>
  )
}
