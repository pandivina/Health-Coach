// ─── components/NightRitual.jsx ──────────────────────────────────────────────
// Check-in nocturno de 3 puntos: físico, mental, intenciones
// Aparece automáticamente entre las 21:00 y las 00:00

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, Moon } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useStore } from '../store/useStore'
import { useTheme } from '../contexts/ThemeProvider'

const RITUAL_KEY = 'night_ritual_done'
const API = import.meta.env.VITE_API_URL

export default function NightRitual({ onClose }) {
  const { user, addXP } = useStore()
  const { theme }       = useTheme()
  const [step,          setStep]          = useState(0) // 0=físico 1=mental 2=intenciones 3=plan
  const [bodyFeel,      setBodyFeel]      = useState(5)
  const [mentalState,   setMentalState]   = useState(3)
  const [mentalNotes,   setMentalNotes]   = useState('')
  const [intentions,    setIntentions]    = useState(['', '', ''])
  const [coachPlan,     setCoachPlan]     = useState('')
  const [loading,       setLoading]       = useState(false)

  const steps = [
    { title:'¿Cómo siente tu cuerpo?', sub:'Esfuerzo físico del día', emoji:'💪' },
    { title:'¿Cómo está tu mente?',    sub:'Estado mental al final del día', emoji:'🧠' },
    { title:'¿Qué quieres lograr mañana?', sub:'3 intenciones concretas', emoji:'🎯' },
    { title:'Tu plan para mañana',     sub:'Generado por Pandi', emoji:'🌙' },
  ]

  async function submit() {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${API}/api/recovery/ritual`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', Authorization:`Bearer ${session.access_token}` },
        body: JSON.stringify({
          body_feel:    bodyFeel,
          mental_state: mentalState,
          mental_notes: mentalNotes || null,
          intentions:   intentions.filter(i => i.trim()),
        }),
      })
      const data = await res.json()
      setCoachPlan(data.coach_plan || '')
      setStep(3)
      addXP?.(20)
      // Marcar como hecho hoy
      try { localStorage.setItem(RITUAL_KEY, new Date().toISOString().split('T')[0]) } catch {}
    } catch (err) {
      console.error('ritual error', err)
    } finally { setLoading(false) }
  }

  const MOOD_LABELS = { 1:'Muy bajo', 2:'Bajo', 3:'Normal', 4:'Bien', 5:'Excelente' }
  const RPE_LABELS  = { 1:'Muy ligero', 3:'Ligero', 5:'Moderado', 7:'Intenso', 9:'Muy intenso', 10:'Máximo' }

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(10,15,30,0.85)',
        backdropFilter:'blur(6px)', display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
      <motion.div initial={{ y:'100%' }} animate={{ y:0 }} exit={{ y:'100%' }}
        transition={{ type:'spring', damping:30, stiffness:300 }}
        style={{ width:'100%', maxWidth:480, background:'white', borderRadius:'28px 28px 0 0',
          padding:'24px 20px', paddingBottom:'calc(env(safe-area-inset-bottom) + 24px)' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:24 }}>{steps[step].emoji}</span>
            <div>
              <p style={{ fontSize:15, fontWeight:900, color:'#1A2332', margin:0 }}>{steps[step].title}</p>
              <p style={{ fontSize:11, color:'#9CA3AF', margin:0 }}>{steps[step].sub}</p>
            </div>
          </div>
          {step < 3 && (
            <button onClick={onClose}
              style={{ background:'#F3F4F6', border:'none', cursor:'pointer',
                width:32, height:32, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <X size={14} color="#6B7280" />
            </button>
          )}
        </div>

        {/* Barra de progreso */}
        <div style={{ height:4, background:'#F3F4F6', borderRadius:2, marginBottom:24, overflow:'hidden' }}>
          <motion.div animate={{ width:`${((step+1)/4)*100}%` }}
            style={{ height:'100%', borderRadius:2, background:'linear-gradient(90deg,#2EC4B6,#FF8FA3)' }} />
        </div>

        {/* Paso 0 — Físico */}
        {step === 0 && (
          <div>
            <p style={{ fontSize:13, color:'#6B7280', marginBottom:16, textAlign:'center' }}>
              Del 1 (sin esfuerzo) al 10 (agotado)
            </p>
            <div style={{ display:'flex', justifyContent:'center', marginBottom:8 }}>
              <span style={{ fontSize:48, fontWeight:900, color:'#1A2332' }}>{bodyFeel}</span>
              <span style={{ fontSize:20, color:'#9CA3AF', alignSelf:'flex-end', marginBottom:8 }}>/10</span>
            </div>
            <input type="range" min={1} max={10} value={bodyFeel}
              onChange={e => setBodyFeel(+e.target.value)}
              style={{ width:'100%', marginBottom:8, accentColor:theme.primary }} />
            <p style={{ textAlign:'center', fontSize:12, color:theme.primary, fontWeight:700 }}>
              {RPE_LABELS[bodyFeel] || ''}
            </p>
          </div>
        )}

        {/* Paso 1 — Mental */}
        {step === 1 && (
          <div>
            <div style={{ display:'flex', justifyContent:'center', gap:10, marginBottom:20 }}>
              {[1,2,3,4,5].map(v => (
                <button key={v} onClick={() => setMentalState(v)}
                  style={{ width:52, height:52, borderRadius:16, cursor:'pointer',
                    fontSize:22, background: mentalState === v ? `${theme.primary}20` : '#F3F4F6',
                    border: `2px solid ${mentalState === v ? theme.primary : 'transparent'}` }}>
                  {['😞','😕','😐','🙂','😄'][v-1]}
                </button>
              ))}
            </div>
            <p style={{ textAlign:'center', fontSize:13, fontWeight:700, color:theme.primary, marginBottom:14 }}>
              {MOOD_LABELS[mentalState]}
            </p>
            <textarea value={mentalNotes} onChange={e => setMentalNotes(e.target.value)}
              placeholder="¿Algo que quieras comentar? (opcional)"
              rows={3} style={{ width:'100%', padding:'10px 12px', borderRadius:14, fontSize:13,
                border:'1.5px solid #E5E7EB', outline:'none', resize:'none',
                fontFamily:'inherit', boxSizing:'border-box' }} />
          </div>
        )}

        {/* Paso 2 — Intenciones */}
        {step === 2 && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:28, height:28, borderRadius:10, background:`${theme.primary}15`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:13, fontWeight:800, color:theme.primary, flexShrink:0 }}>
                  {i+1}
                </div>
                <input value={intentions[i]}
                  onChange={e => setIntentions(prev => { const n=[...prev]; n[i]=e.target.value; return n })}
                  placeholder={`Intención ${i+1}…`}
                  style={{ flex:1, padding:'10px 12px', borderRadius:12, fontSize:13,
                    border:'1.5px solid #E5E7EB', outline:'none', fontFamily:'inherit' }} />
              </div>
            ))}
          </div>
        )}

        {/* Paso 3 — Plan del Coach */}
        {step === 3 && (
          <div>
            <div style={{ background:'linear-gradient(135deg,#f0fffe,#fff5f7)',
              borderRadius:20, padding:'16px', border:'1.5px solid rgba(46,196,182,0.2)',
              marginBottom:20 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                <Moon size={14} color={theme.primary} />
                <span style={{ fontSize:11, fontWeight:800, color:theme.primary, textTransform:'uppercase',
                  letterSpacing:'.05em' }}>Pandi recomienda</span>
              </div>
              <p style={{ fontSize:13, color:'#374151', lineHeight:1.6, margin:0 }}>{coachPlan}</p>
            </div>
            <p style={{ fontSize:12, color:'#9CA3AF', textAlign:'center', marginBottom:16 }}>
              +20 XP · Tu Espejo Metabólico se ha actualizado 🌙
            </p>
          </div>
        )}

        {/* Botón */}
        <motion.button whileTap={{ scale:0.97 }}
          onClick={step === 2 ? submit : step === 3 ? onClose : () => setStep(s => s+1)}
          disabled={loading}
          style={{ width:'100%', marginTop:20, padding:'14px', borderRadius:18, border:'none',
            cursor:'pointer', fontWeight:800, fontSize:15, color:'white',
            background:'linear-gradient(135deg,#2EC4B6,#FF8FA3)', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Generando plan…' :
           step === 3 ? '¡Buenas noches! 🌙' :
           step === 2 ? 'Completar ritual' : 'Siguiente →'}
        </motion.button>
      </motion.div>
    </motion.div>
  )
}

// Hook para auto-mostrar el ritual entre las 21:00 y las 00:00
export function useNightRitual() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    const done  = localStorage.getItem(RITUAL_KEY)
    if (done === today) return
    const h = new Date().getHours()
    if (h >= 21 || h < 1) {
      const t = setTimeout(() => setShow(true), 3000)
      return () => clearTimeout(t)
    }
  }, [])
  return { show, dismiss: () => setShow(false) }
}
