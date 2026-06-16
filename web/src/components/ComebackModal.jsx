// ─── components/ComebackModal.jsx ────────────────────────────────────────────
// Se activa cuando el usuario vuelve tras 2+ días de ausencia
// Muestra resumen de lo perdido + plan de acción de 3 pasos para retomar hoy

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useStore } from '../store/useStore'

const LAST_SEEN_KEY = 'pandi_last_seen'

// Genera el plan de acción según lo que más se descuidó
function buildActionPlan(stats) {
  const plan = []

  if (!stats.hadWater)   plan.push({ icon:'💧', text:'Bebe un vaso de agua ahora mismo', to:'/hydration' })
  if (!stats.hadMeal)    plan.push({ icon:'🍎', text:'Registra tu primera comida de hoy', to:'/nutrition' })
  if (!stats.hadMood)    plan.push({ icon:'🧘', text:'Cuéntale a Pandi cómo te sientes',  to:'/mood' })
  if (!stats.hadWorkout) plan.push({ icon:'💪', text:'Aunque sean 10 minutos, muévete',   to:'/workout' })
  if (!stats.hadSleep)   plan.push({ icon:'😴', text:'Registra cómo dormiste anoche',     to:'/sleep' })

  // Máximo 3 acciones — las más relevantes
  return plan.slice(0, 3)
}

export default function ComebackModal() {
  const { user, profile } = useStore()
  const [show,  setShow]  = useState(false)
  const [stats, setStats] = useState(null)
  const [plan,  setPlan]  = useState([])

  useEffect(() => {
    if (!user?.id) return
    checkComeback()
  }, [user?.id])

  async function checkComeback() {
    let lastSeen
    try { lastSeen = localStorage.getItem(LAST_SEEN_KEY) } catch { lastSeen = null }

    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    if (!lastSeen) {
      // Primera vez que vemos esta marca — guardar y salir
      try { localStorage.setItem(LAST_SEEN_KEY, todayStr) } catch {}
      return
    }

    const lastDate = new Date(lastSeen + 'T12:00:00')
    const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24))

    if (diffDays < 2) {
      // Visita reciente — solo actualizar marca
      try { localStorage.setItem(LAST_SEEN_KEY, todayStr) } catch {}
      return
    }

    // ── Ausencia de 2+ días — construir resumen ──────────────────────────
    const from = lastSeen
    const to   = todayStr
    const safe = async fn => { try { return await fn } catch { return { data: [] } } }

    const [mealsR, workoutR, moodR, sleepR, waterR] = await Promise.all([
      safe(supabase.from('meal_logs').select('date').eq('user_id', user.id).gte('date', from).lt('date', to)),
      safe(supabase.from('workout_sessions').select('created_at').eq('user_id', user.id).eq('status','completed').gte('created_at', from+'T00:00:00').lt('created_at', to+'T00:00:00')),
      safe(supabase.from('mood_logs').select('date').eq('user_id', user.id).gte('date', from).lt('date', to)),
      safe(supabase.from('sleep_logs').select('date').eq('user_id', user.id).gte('date', from).lt('date', to)),
      safe(supabase.from('hydration_logs').select('date').eq('user_id', user.id).gte('date', from).lt('date', to)),
    ])

    const daysAbsent = diffDays
    const mealDays    = new Set((mealsR.data||[]).map(m=>m.date)).size
    const workoutDays = new Set((workoutR.data||[]).map(w=>w.created_at?.split('T')[0])).size
    const moodDays    = new Set((moodR.data||[]).map(m=>m.date)).size
    const sleepDays   = new Set((sleepR.data||[]).map(s=>s.date)).size
    const waterDays   = new Set((waterR.data||[]).map(w=>w.date)).size

    const previousStreak = profile?.streak || 0
    const streakBroken    = previousStreak > 0 && daysAbsent >= 1

    setStats({
      daysAbsent,
      mealDays, workoutDays, moodDays, sleepDays, waterDays,
      previousStreak,
      streakBroken,
      // Para el plan de acción — qué se ha hecho hoy
      hadWater:   false,
      hadMeal:    false,
      hadMood:    false,
      hadWorkout: false,
      hadSleep:   false,
    })
    setPlan(buildActionPlan({ hadWater:false, hadMeal:false, hadMood:false, hadWorkout:false, hadSleep:false }))
    setShow(true)

    try { localStorage.setItem(LAST_SEEN_KEY, todayStr) } catch {}
  }

  function close() { setShow(false) }

  if (!show || !stats) return null

  const name = profile?.name?.split(' ')[0] || ''

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        style={{ position:'fixed', inset:0, zIndex:100, background:'rgba(15,20,28,0.55)',
          backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center',
          padding:20 }}
        onClick={close}>

        <motion.div
          initial={{ scale:0.9, opacity:0, y:20 }} animate={{ scale:1, opacity:1, y:0 }}
          exit={{ scale:0.9, opacity:0, y:20 }}
          transition={{ type:'spring', damping:24, stiffness:300 }}
          onClick={e => e.stopPropagation()}
          style={{ width:'100%', maxWidth:380, background:'#fff', borderRadius:28,
            overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>

          {/* Header con Pandi */}
          <div style={{ background:'linear-gradient(135deg, #2EC4B6, #FF8FA3)',
            padding:'28px 24px 20px', textAlign:'center', position:'relative' }}>
            <motion.div
              animate={{ y:[0,-6,0] }}
              transition={{ duration:2.5, repeat:Infinity, ease:'easeInOut' }}
              style={{ fontSize:56, marginBottom:8 }}>
              🐼
            </motion.div>
            <h2 style={{ fontSize:19, fontWeight:900, color:'white', margin:0 }}>
              ¡Te he echado de menos{name ? `, ${name}` : ''}!
            </h2>
            <p style={{ fontSize:13, color:'rgba(255,255,255,0.92)', margin:'4px 0 0' }}>
              Llevas {stats.daysAbsent} día{stats.daysAbsent>1?'s':''} sin entrar
            </p>
          </div>

          {/* Resumen de lo perdido */}
          <div style={{ padding:'20px 24px 4px' }}>
            <p style={{ fontSize:11, fontWeight:800, color:'#9CA3AF', textTransform:'uppercase',
              letterSpacing:'.06em', margin:'0 0 12px' }}>
              Mientras no estabas
            </p>

            <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16 }}>
              {stats.streakBroken && (
                <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
                  borderRadius:14, background:'#FEF2F2' }}>
                  <span style={{ fontSize:18 }}>🔥</span>
                  <p style={{ fontSize:13, color:'#991B1B', margin:0, fontWeight:600 }}>
                    Tu racha de {stats.previousStreak} días se interrumpió
                  </p>
                </div>
              )}

              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8 }}>
                {[
                  { icon:'🍎', label:'Comidas',    value:stats.mealDays,    total:stats.daysAbsent },
                  { icon:'💪', label:'Entrenos',   value:stats.workoutDays, total:stats.daysAbsent },
                  { icon:'😴', label:'Sueño',      value:stats.sleepDays,   total:stats.daysAbsent },
                  { icon:'💧', label:'Hidratación',value:stats.waterDays,   total:stats.daysAbsent },
                ].map(({ icon, label, value, total }) => (
                  <div key={label} style={{ background:'#F9FAFB', borderRadius:14, padding:'10px 12px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                      <span style={{ fontSize:14 }}>{icon}</span>
                      <span style={{ fontSize:11, fontWeight:700, color:'#6B7280' }}>{label}</span>
                    </div>
                    <p style={{ fontSize:15, fontWeight:900, color: value>0 ? '#2EC4B6' : '#D1D5DB', margin:0 }}>
                      {value}/{total} días
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Plan de acción para hoy */}
          <div style={{ padding:'4px 24px 20px' }}>
            <p style={{ fontSize:11, fontWeight:800, color:'#9CA3AF', textTransform:'uppercase',
              letterSpacing:'.06em', margin:'8px 0 10px' }}>
              Plan para retomar hoy
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {plan.map((step, i) => (
                <motion.a key={step.to} href={step.to}
                  initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }}
                  transition={{ delay:0.1 + i*0.08 }}
                  onClick={close}
                  style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px',
                    borderRadius:16, background:'linear-gradient(135deg, rgba(46,196,182,0.08), rgba(255,143,163,0.08))',
                    border:'1px solid rgba(46,196,182,0.15)', textDecoration:'none' }}>
                  <div style={{ width:32, height:32, borderRadius:10, background:'white',
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:16,
                    flexShrink:0, fontWeight:800, color:'#2EC4B6' }}>
                    {i+1}
                  </div>
                  <span style={{ fontSize:13, fontWeight:600, color:'#1A2332', flex:1 }}>
                    {step.icon} {step.text}
                  </span>
                </motion.a>
              ))}
            </div>
          </div>

          {/* Botón cerrar */}
          <div style={{ padding:'0 24px 24px' }}>
            <motion.button whileTap={{ scale:0.97 }} onClick={close}
              style={{ width:'100%', padding:'14px', borderRadius:18, border:'none',
                cursor:'pointer', fontSize:14, fontWeight:700,
                background:'linear-gradient(135deg,#2EC4B6,#FF8FA3)', color:'white' }}>
              Vamos a por hoy 💪
            </motion.button>
          </div>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
