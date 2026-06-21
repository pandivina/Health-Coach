// ─── components/CoachMicroBubble.jsx ─────────────────────────────────────────
// Burbuja flotante del Coach — visible en todas las pantallas
// Nivel 1 (micro) → Nivel 2 (tip expandido) → Nivel 3 (chat rápido) → /coach
// Se comporta diferente según el módulo activo gracias a CoachAwarenessContext

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { X, Send, ChevronRight } from 'lucide-react'
import { useCoachAwareness } from '../contexts/CoachAwarenessContext'
import { useTheme } from '../contexts/ThemeProvider'
import { useStore } from '../store/useStore'
import { api } from '../lib/api'

// ─── TIPS INSTANTÁNEOS POR MÓDULO (sin llamada a API) ────────────────────────
const INSTANT_TIPS = {
  home:      ['¿Cómo te encuentras hoy? 🌟', '¿Has bebido agua esta mañana? 💧', 'Un pequeño paso hoy marca la diferencia 🐾'],
  nutrition: ['Proteína + fibra = saciedad duradera 🥗', '¿Has registrado el desayuno? ☀️', 'Mastica despacio, come menos sin darte cuenta'],
  workout:   ['Calentamiento 5 min = menos lesiones 💪', '¿Cuándo fue tu último descanso activo?', 'La constancia gana a la intensidad siempre'],
  sleep:     ['7-9h es el objetivo de la mayoría 😴', 'Pantallas apagadas 30min antes de dormir', 'La temperatura ideal para dormir: 18-20°C 🌙'],
  mood:      ['Respirar hondo 3 veces activa el vago 🧘', '¿Qué ha ido bien hoy?', 'Las emociones son datos, no verdades absolutas'],
  hydration: ['Los primeros síntomas de deshidratación: cansancio y dolor de cabeza 💧', '8 vasos = ~2L pero depende de tu peso', 'Agua antes de comer = menos calorías totales'],
  coach:     ['Puedo recordar lo que hablamos 🧠', '¿Tienes alguna duda de salud?', 'Guarda mis consejos con el botón 🔖'],
}

// Módulos donde NO mostrar la burbuja (el coach ya está presente)
const HIDDEN_ON = ['/coach', '/onboarding', '/auth', '/landing']

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function CoachMicroBubble() {
  const { theme }               = useTheme()
  const navigate                = useNavigate()
  const location                = useLocation()
  const { user }                = useStore()
  const { buildCoachContext, activeModule, recoveryLight, today } = useCoachAwareness()

  const [level,       setLevel]       = useState(0) // 0=oculto 1=micro 2=tip 3=chat
  const [tip,         setTip]         = useState('')
  const [chatInput,   setChatInput]   = useState('')
  const [chatReply,   setChatReply]   = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [dismissed,   setDismissed]   = useState(false)

  const currentModule = activeModule || location.pathname.replace('/', '') || 'home'
  const hidden = HIDDEN_ON.some(p => location.pathname.startsWith(p))

  // Al cambiar de módulo, resetear a nivel 1 con nuevo tip
  useEffect(() => {
    if (hidden || dismissed) return
    const tips = INSTANT_TIPS[currentModule] || INSTANT_TIPS.home
    const random = tips[Math.floor(Math.random() * tips.length)]
    setTip(random)
    setChatReply('')
    setChatInput('')
    // Mostrar micro-burbuja con un pequeño delay para no molestar al entrar
    const t = setTimeout(() => setLevel(1), 1500)
    return () => clearTimeout(t)
  }, [currentModule, hidden])

  // Alerta proactiva según estado del usuario
  useEffect(() => {
    if (hidden || level > 1) return
    const h = new Date().getHours()

    if (h >= 10 && !today.workoutDone && currentModule === 'home' && recoveryLight === 'GREEN') {
      setTip('¿Hoy toca entreno? 💪 Tu energía está bien para ello')
      setLevel(1)
    }
    if (h >= 14 && (today.water || 0) < 3 && currentModule !== 'hydration') {
      setTip(`Solo ${today.water || 0} vasos de agua hasta ahora 💧`)
      setLevel(1)
    }
  }, [today, recoveryLight, currentModule, h])

  async function quickChat() {
    if (!chatInput.trim() || chatLoading) return
    const msg = chatInput.trim()
    setChatInput('')
    setChatLoading(true)
    try {
      const ctx = buildCoachContext()
      const { reply } = await api.coach.chat(
        [{ role: 'user', content: msg }],
        ctx
      )
      setChatReply(reply)
    } catch {
      setChatReply('No pude conectar ahora. Abre el Coach para hablar 👉')
    } finally { setChatLoading(false) }
  }

  function dismiss() {
    setLevel(0)
    setDismissed(true)
    // Volver a aparecer tras 30 minutos
    setTimeout(() => setDismissed(false), 30 * 60 * 1000)
  }

  if (hidden || !user?.id) return null

  return (
    <div style={{ position:'fixed', bottom: 76, right: 14, zIndex: 40 }}>
      <AnimatePresence mode="wait">

        {/* NIVEL 1 — micro punto pulsante */}
        {level === 1 && (
          <motion.button key="micro"
            initial={{ scale:0, opacity:0 }} animate={{ scale:1, opacity:1 }}
            exit={{ scale:0, opacity:0 }}
            onClick={() => setLevel(2)}
            style={{ width:44, height:44, borderRadius:'50%', border:'none', cursor:'pointer',
              background:`linear-gradient(135deg,${theme.primary},#FF8FA3)`,
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:`0 4px 20px ${theme.primary}60` }}>
            <motion.div animate={{ scale:[1,1.12,1] }} transition={{ duration:2, repeat:Infinity }}>
              <img src="/panda/panda_base.png" alt="Pandi"
                style={{ width:28, height:28, objectFit:'contain', borderRadius:'50%' }}
                onError={e => { e.target.style.display='none' }} />
            </motion.div>
          </motion.button>
        )}

        {/* NIVEL 2 — tip expandido */}
        {level === 2 && (
          <motion.div key="tip"
            initial={{ opacity:0, y:10, scale:0.95 }} animate={{ opacity:1, y:0, scale:1 }}
            exit={{ opacity:0, y:10, scale:0.95 }}
            style={{ width:260, background:'white', borderRadius:20,
              boxShadow:'0 8px 32px rgba(0,0,0,0.15)', overflow:'hidden',
              border:`1px solid ${theme.border}` }}>

            {/* Header */}
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 12px 8px',
              background:`linear-gradient(135deg,${theme.primary}15,#FF8FA315)` }}>
              <img src="/panda/panda_base.png" alt="Pandi"
                style={{ width:26, height:26, objectFit:'contain', borderRadius:'50%' }}
                onError={e => e.target.style.display='none'} />
              <span style={{ fontSize:11, fontWeight:800, color:theme.primary, flex:1 }}>Pandi dice</span>
              <button onClick={dismiss}
                style={{ background:'none', border:'none', cursor:'pointer', padding:2 }}>
                <X size={13} color={theme.textMuted} />
              </button>
            </div>

            {/* Tip */}
            <p style={{ fontSize:12, color:theme.text, padding:'8px 14px 10px', lineHeight:1.5, margin:0 }}>
              {tip}
            </p>

            {/* Acciones */}
            <div style={{ display:'flex', gap:6, padding:'0 12px 12px' }}>
              <button onClick={() => setLevel(3)}
                style={{ flex:1, padding:'8px', borderRadius:12, border:'none', cursor:'pointer',
                  background:`${theme.primary}15`, fontSize:11, fontWeight:700, color:theme.primary }}>
                Preguntarme algo
              </button>
              <button onClick={() => navigate('/coach')}
                style={{ width:34, height:34, borderRadius:12, border:'none', cursor:'pointer',
                  background:theme.surface2, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <ChevronRight size={14} color={theme.textMuted} />
              </button>
            </div>
          </motion.div>
        )}

        {/* NIVEL 3 — chat rápido inline */}
        {level === 3 && (
          <motion.div key="chat"
            initial={{ opacity:0, y:10, scale:0.95 }} animate={{ opacity:1, y:0, scale:1 }}
            exit={{ opacity:0, y:10, scale:0.95 }}
            style={{ width:280, background:'white', borderRadius:20,
              boxShadow:'0 8px 32px rgba(0,0,0,0.15)',
              border:`1px solid ${theme.border}` }}>

            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 12px',
              borderBottom:`1px solid ${theme.border}` }}>
              <img src="/panda/panda_base.png" alt="Pandi"
                style={{ width:24, height:24, objectFit:'contain', borderRadius:'50%' }}
                onError={e => e.target.style.display='none'} />
              <span style={{ fontSize:11, fontWeight:800, color:theme.text, flex:1 }}>Chat rápido</span>
              <button onClick={() => setLevel(1)} style={{ background:'none', border:'none', cursor:'pointer' }}>
                <X size={13} color={theme.textMuted} />
              </button>
            </div>

            <div style={{ padding:'10px 12px', minHeight:50 }}>
              {chatLoading && (
                <div style={{ display:'flex', gap:4, alignItems:'center' }}>
                  {[0,1,2].map(i => (
                    <motion.div key={i} animate={{ y:[0,-3,0] }}
                      transition={{ duration:0.5, repeat:Infinity, delay:i*0.1 }}
                      style={{ width:6, height:6, borderRadius:'50%', background:theme.primary }} />
                  ))}
                </div>
              )}
              {chatReply && !chatLoading && (
                <>
                  <p style={{ fontSize:12, color:theme.text, margin:'0 0 8px', lineHeight:1.5 }}>
                    {chatReply.length > 200 ? chatReply.slice(0, 200) + '…' : chatReply}
                  </p>
                  <button onClick={() => navigate('/coach')}
                    style={{ fontSize:11, color:theme.primary, fontWeight:700,
                      background:'none', border:'none', cursor:'pointer', padding:0 }}>
                    Ver conversación completa →
                  </button>
                </>
              )}
            </div>

            <div style={{ display:'flex', gap:6, padding:'8px 12px 12px' }}>
              <input
                value={chatInput} onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && quickChat()}
                placeholder="Escribe algo…"
                style={{ flex:1, padding:'7px 10px', borderRadius:10, fontSize:12,
                  border:`1px solid ${theme.border}`, outline:'none', background:theme.surface }} />
              <button onClick={quickChat} disabled={!chatInput.trim() || chatLoading}
                style={{ width:32, height:32, borderRadius:10, border:'none', cursor:'pointer',
                  background:theme.primary, display:'flex', alignItems:'center', justifyContent:'center',
                  opacity: !chatInput.trim() ? 0.5 : 1 }}>
                <Send size={13} color="white" />
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}
