import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { X, Send, Loader2 } from 'lucide-react'
import { useTheme } from '../contexts/ThemeProvider'
import { useStore } from '../store/useStore'
import { supabase } from '../lib/supabase'

// ─── MENSAJES CONTEXTUALES ────────────────────────────────────────────────────
const MESSAGES = {
  nutrition: (data) => {
    const { cals, goal, protein, proteinGoal } = data
    if (!cals) return { text: '¿Qué has comido hoy? Registra tu primera comida 🍎', color: '#F97316' }
    const pct = Math.round((cals / goal) * 100)
    if (pct < 50)  return { text: `Llevas solo el ${pct}% de tus calorías. ¡A comer! 🍳`, color: '#F97316' }
    if (pct > 110) return { text: `Has superado tu objetivo calórico. No pasa nada, mañana más 💪`, color: '#EF4444' }
    if (protein < proteinGoal * 0.7) return { text: `Te falta proteína hoy. Un huevo o pechuga te viene bien 🥚`, color: '#6366F1' }
    return { text: `¡Vas genial con la nutrición hoy! ${pct}% del objetivo 🎯`, color: '#22C55E' }
  },
  workout: (data) => {
    const { hasWorkout, streak } = data
    const hour = new Date().getHours()
    if (hasWorkout) return { text: '¡Entreno completado! Eres una máquina 💪🔥', color: '#22C55E' }
    if (hour < 10)  return { text: 'Buenos días guerrero/a. ¿Toca entrenar hoy? 🏋️', color: '#6366F1' }
    if (hour < 14)  return { text: 'El mejor momento para entrenar es ahora mismo 💪', color: '#6366F1' }
    if (hour < 20)  return { text: '¿Todavía sin entrenar? Aún estás a tiempo 🏃', color: '#F97316' }
    if (streak > 5) return { text: `${streak} días de racha. No lo rompas esta noche 🔥`, color: '#F59E0B' }
    return { text: 'Un entrenamiento corto también cuenta. ¡20 minutos! ⚡', color: '#6366F1' }
  },
  sleep: (data) => {
    const { hours, quality, avg } = data
    if (!hours) return { text: '¿Cómo dormiste anoche? Cuéntamelo 😴', color: '#818CF8' }
    if (hours < 6)  return { text: `Solo ${hours}h de sueño. Tu cuerpo necesita más descanso 🌙`, color: '#EF4444' }
    if (hours >= 7 && quality >= 4) return { text: `¡${hours}h con calidad ${quality}/5! Descansado y listo 🌟`, color: '#22C55E' }
    if (avg && hours < avg) return { text: `Dormiste menos que tu media (${avg}h). Intenta acostarte antes 💤`, color: '#F97316' }
    return { text: `${hours}h de sueño registradas. Sigue así 🌙`, color: '#818CF8' }
  },
  hydration: (data) => {
    const { glasses, goal } = data
    if (!glasses) return { text: '¡Empieza a hidratarte! El primer vaso es el más importante 💧', color: '#3B82F6' }
    const pct = Math.round((glasses / goal) * 100)
    if (pct >= 100) return { text: `¡Meta de agua conseguida! ${glasses} vasos. Perfecto 🎉`, color: '#22C55E' }
    if (pct < 30)   return { text: `Solo ${glasses} vasos. Bebe más agua, tu cuerpo te lo agradecerá 💧`, color: '#EF4444' }
    if (pct < 70)   return { text: `Llevas el ${pct}% de tu meta. ¡Sigue bebiendo! 💧`, color: '#3B82F6' }
    return { text: `Casi en la meta de agua. ${goal - glasses} vasos más 💪`, color: '#60A5FA' }
  },
  health: (data) => {
    const { weight, target, diff } = data
    if (!weight) return { text: '¿Te has pesado esta semana? El seguimiento es clave 📊', color: '#EC4899' }
    if (diff && diff < -0.5) return { text: `Bajaste ${Math.abs(diff)}kg. ¡Vas en la dirección correcta! 📉`, color: '#22C55E' }
    if (diff && diff > 0.5)  return { text: `Subiste ${diff}kg. Revisa la nutrición esta semana 📈`, color: '#F97316' }
    if (target && weight > target) return { text: `Te quedan ${(weight - target).toFixed(1)}kg para tu objetivo. Paso a paso 🎯`, color: '#EC4899' }
    return { text: `Peso registrado: ${weight}kg. Sigue con el seguimiento 💪`, color: '#EC4899' }
  },
  report: (data) => {
    const { done, total } = data
    if (done === 0) return { text: 'Empieza a registrar datos para ver tu informe personalizado 📊', color: '#F59E0B' }
    if (done === total) return { text: '¡Todo registrado hoy! Tu informe está completo 🌟', color: '#22C55E' }
    return { text: `${done}/${total} módulos completados hoy. ¡Casi! 📊`, color: '#F59E0B' }
  },
  home: () => ({ text: '¡Hola! Estoy aquí para ayudarte. Tócame para hablar 🐾', color: '#2EC4B6' }),
}

// ─── CHAT MODAL ───────────────────────────────────────────────────────────────
function CoachChatModal({ onClose, section }) {
  const { theme }   = useTheme()
  const { user, profile } = useStore()
  const [messages,  setMessages]  = useState([])
  const [input,     setInput]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [imgErr,    setImgErr]    = useState(false)
  const bottomRef   = useRef(null)
  const petName     = profile?.pet_name || 'Pandi'

  useEffect(() => {
    // Mensaje de bienvenida contextual
    const greet = section
      ? `Hola, estoy aquí para ayudarte con ${section}. ¿Qué necesitas?`
      : '¡Hola! Soy tu coach de salud. ¿En qué puedo ayudarte hoy?'
    setMessages([{ role: 'assistant', content: greet }])
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages(m => [...m, { role: 'user', content: userMsg }])
    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/coach/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          message: userMsg,
          userId: user?.id,
          context: section,
          history: messages.slice(-6),
        }),
      })
      const data = await res.json()
      setMessages(m => [...m, { role: 'assistant', content: data.reply || data.message || '…' }])
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: 'Ups, algo ha fallado. Inténtalo de nuevo 🐾' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,0.4)',
        backdropFilter:'blur(4px)', display:'flex', alignItems:'flex-end' }}
      onClick={onClose}>

      <motion.div initial={{ y:'100%' }} animate={{ y:0 }} exit={{ y:'100%' }}
        transition={{ type:'spring', damping:28, stiffness:300 }}
        onClick={e => e.stopPropagation()}
        style={{ width:'100%', height:'75vh', background: theme.background || 'white',
          borderRadius:'24px 24px 0 0', display:'flex', flexDirection:'column',
          overflow:'hidden', boxShadow:'0 -8px 32px rgba(0,0,0,0.2)' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'16px 16px 12px',
          borderBottom:`1px solid ${theme.border || 'rgba(0,0,0,0.08)'}` }}>
          <div style={{ width:40, height:40, borderRadius:12,
            background:'linear-gradient(135deg,#2EC4B6,#FF8FA3)',
            display:'flex', alignItems:'center', justifyContent:'center' }}>
            {imgErr
              ? <span style={{ fontSize:20 }}>🐼</span>
              : <img src="/panda/talk_1.png" alt={petName}
                  onError={() => setImgErr(true)}
                  style={{ width:32, height:32, objectFit:'contain' }} />
            }
          </div>
          <div style={{ flex:1 }}>
            <p style={{ fontSize:14, fontWeight:800, color: theme.text || '#1A2332', margin:0 }}>
              {petName} Coach
            </p>
            <p style={{ fontSize:11, color: theme.textMuted || '#9CA3AF', margin:0 }}>
              Tu asistente de salud personal
            </p>
          </div>
          <button onClick={onClose}
            style={{ width:32, height:32, borderRadius:10, border:'none', cursor:'pointer',
              background: theme.surface2 || '#F3F4F6',
              display:'flex', alignItems:'center', justifyContent:'center' }}>
            <X size={16} color={theme.textMuted || '#9CA3AF'} />
          </button>
        </div>

        {/* Mensajes */}
        <div style={{ flex:1, overflowY:'auto', padding:'16px', display:'flex',
          flexDirection:'column', gap:12 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display:'flex',
              justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', gap:8 }}>
              {m.role === 'assistant' && (
                <div style={{ width:28, height:28, borderRadius:8, flexShrink:0,
                  background:'linear-gradient(135deg,#2EC4B6,#FF8FA3)',
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>
                  🐾
                </div>
              )}
              <div style={{
                maxWidth:'78%', padding:'10px 14px', borderRadius:16,
                borderBottomLeftRadius: m.role === 'assistant' ? 4 : 16,
                borderBottomRightRadius: m.role === 'user' ? 4 : 16,
                background: m.role === 'user'
                  ? 'linear-gradient(135deg,#2EC4B6,#3B82F6)'
                  : (theme.surface || '#F9FAFB'),
                boxShadow:'0 1px 4px rgba(0,0,0,0.08)',
              }}>
                <p style={{ fontSize:13, lineHeight:1.5, margin:0,
                  color: m.role === 'user' ? 'white' : (theme.text || '#1A2332') }}>
                  {m.content}
                </p>
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <div style={{ width:28, height:28, borderRadius:8,
                background:'linear-gradient(135deg,#2EC4B6,#FF8FA3)',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>
                🐾
              </div>
              <div style={{ padding:'10px 14px', borderRadius:16, borderBottomLeftRadius:4,
                background: theme.surface || '#F9FAFB' }}>
                <Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}
                  color={theme.textMuted || '#9CA3AF'} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding:'12px 16px',
          paddingBottom:'calc(env(safe-area-inset-bottom, 0px) + 12px)',
          borderTop:`1px solid ${theme.border || 'rgba(0,0,0,0.08)'}`,
          display:'flex', gap:8 }}>
          <input
            value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Pregúntame lo que quieras…"
            style={{ flex:1, padding:'10px 14px', borderRadius:14,
              border:`1.5px solid ${theme.border || 'rgba(0,0,0,0.1)'}`,
              fontSize:13, outline:'none', background: theme.surface || 'white',
              color: theme.text || '#1A2332' }} />
          <motion.button whileTap={{ scale:0.95 }} onClick={send}
            disabled={!input.trim() || loading}
            style={{ width:42, height:42, borderRadius:12, border:'none', cursor:'pointer',
              background: input.trim() ? 'linear-gradient(135deg,#2EC4B6,#3B82F6)' : '#E5E7EB',
              display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Send size={16} color={input.trim() ? 'white' : '#9CA3AF'} />
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── BURBUJA PRINCIPAL ────────────────────────────────────────────────────────
export default function PandiContextualBubble({ section, data = {}, dismissKey }) {
  const { theme }   = useTheme()
  const { profile } = useStore()
  const [visible,   setVisible]   = useState(false)
  const [imgErr,    setImgErr]    = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [chatOpen,  setChatOpen]  = useState(false)
  const petName = profile?.pet_name || 'Pandi'

  useEffect(() => {
    const key = dismissKey || `pandi_bubble_${section}_${new Date().toISOString().split('T')[0]}`
    if (localStorage.getItem(key)) { setDismissed(true); return }
    const t = setTimeout(() => setVisible(true), 800)
    return () => clearTimeout(t)
  }, [section, dismissKey])

  function dismiss() {
    const key = dismissKey || `pandi_bubble_${section}_${new Date().toISOString().split('T')[0]}`
    localStorage.setItem(key, '1')
    setDismissed(true)
    setVisible(false)
  }

  if (dismissed && !chatOpen) return null

  const msgFn = MESSAGES[section] || MESSAGES.home
  const msg   = msgFn(data)

  return (
    <>
      <AnimatePresence>
        {visible && !chatOpen && (
          <motion.div
            initial={{ opacity:0, y:-8, scale:0.95 }}
            animate={{ opacity:1, y:0,  scale:1     }}
            exit={{   opacity:0, y:-8,  scale:0.95  }}
            transition={{ type:'spring', damping:20, stiffness:300 }}
            style={{ display:'flex', alignItems:'flex-end', gap:12, marginBottom:16 }}>

            {/* Avatar Pandi — tap abre el chat */}
            <motion.button
              whileTap={{ scale:0.92 }}
              onClick={() => setChatOpen(true)}
              style={{ flexShrink:0, background:'none', border:'none', cursor:'pointer',
                padding:0, position:'relative' }}>
              <motion.div
                animate={{ y:[0,-3,0] }}
                transition={{ duration:2.5, repeat:Infinity, ease:'easeInOut' }}>
                {imgErr ? (
                  <div style={{ width:48, height:48, borderRadius:16,
                    background:'linear-gradient(135deg,#2EC4B6,#FF8FA3)',
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>
                    🐼
                  </div>
                ) : (
                  <img src="/panda/talk_1.png" alt={petName}
                    onError={() => setImgErr(true)}
                    style={{ width:48, height:48, objectFit:'contain' }} />
                )}
              </motion.div>
              {/* Indicador de chat */}
              <div style={{ position:'absolute', top:-2, right:-2, width:12, height:12,
                borderRadius:'50%', background:'#2EC4B6', border:'2px solid white' }} />
            </motion.button>

            {/* Bocadillo */}
            <div style={{ flex:1, position:'relative' }}>
              <div style={{ position:'absolute', left:-7, bottom:10, width:0, height:0,
                borderTop:'7px solid transparent', borderBottom:'7px solid transparent',
                borderRight:`7px solid ${theme.surface}` }} />
              <div style={{ borderRadius:16, borderBottomLeftRadius:4, padding:'10px 12px',
                display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8,
                background: theme.surface, border:`1px solid ${theme.border || 'rgba(0,0,0,0.08)'}` }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:10, fontWeight:800, color:msg.color, margin:'0 0 2px' }}>
                    {petName.toUpperCase()} TE RECUERDA
                  </p>
                  <p style={{ fontSize:12, lineHeight:1.5, color: theme.text || '#1A2332', margin:0 }}>
                    {msg.text}
                  </p>
                  <button onClick={() => setChatOpen(true)}
                    style={{ marginTop:6, fontSize:10, fontWeight:700, color:'#2EC4B6',
                      background:'none', border:'none', cursor:'pointer', padding:0 }}>
                    Hablar con {petName} →
                  </button>
                </div>
                <button onClick={dismiss}
                  style={{ flexShrink:0, background:'none', border:'none', cursor:'pointer' }}>
                  <X size={11} color={theme.textLight || '#9CA3AF'} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {chatOpen && (
          <CoachChatModal section={section} onClose={() => setChatOpen(false)} />
        )}
      </AnimatePresence>
    </>
  )
}
