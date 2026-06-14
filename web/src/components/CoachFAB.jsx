// src/components/CoachFAB.jsx
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Minimize2 } from 'lucide-react'
import { useTheme } from '../contexts/ThemeProvider'
import { useStore } from '../store/useStore'
import { usePandiState } from '../contexts/PandiStateContext'
import { useTourContext } from '../contexts/GuidedTourProvider'
import { api } from '../lib/api'
import { SECTION_LABELS } from '../hooks/useSectionContext'

function getWelcomeMessage(section, name) {
  const n = name ? ` ${name}` : ''
  const messages = {
    nutrition:  `Estoy viendo tu nutrición de hoy${n}. ¿Quieres que analice cómo vas con tus macros?`,
    workout:    `Listo para entrenar${n}. ¿Buscas rutina para hoy o tienes alguna duda?`,
    sleep:      `Revisando tu sueño${n}. El descanso es donde ocurre la recuperación real. ¿Qué tal dormiste?`,
    mood:       `Estoy aquí${n}. ¿Cómo estás hoy realmente?`,
    hydration:  `Veo tu hidratación${n}. El agua mueve todo lo demás. ¿Cuánto llevas hoy?`,
    health:     `Revisando tu progreso${n}. Los números cuentan una historia — vamos a leerla juntos.`,
    home:       `Tengo tu resumen del día${n}. ¿Por dónde empezamos?`,
    smoking:    `Aquí contigo${n}. Cada día cuenta. ¿Cómo va la batalla de hoy?`,
    profile:    `Mirando tu perfil${n}. ¿Quieres ajustar algún objetivo?`,
    default:    `Hola${n}. Estoy aquí para lo que necesites.`,
  }
  return messages[section] || messages.default
}

export default function CoachFAB() {
  const { theme }                                    = useTheme()
  const { profile }                                  = useStore()
  const { pandiState, recoveryLight, recoveryScore } = usePandiState()
  const { isActive: tourActive }                     = useTourContext()

  const [open,     setOpen]     = useState(false)
  const [messages, setMessages] = useState([])
  const [input,    setInput]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [section,  setSection]  = useState(null)
  const bottomRef = useRef(null)

  // No mostrar el FAB mientras hay un tour activo
  if (tourActive) return null

  // Detectar sección actual
  useEffect(() => {
    const s = window.__pandi_section__?.section || null
    setSection(s)
  }, [open])

  // Scroll al último mensaje
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Publicar recovery en window para que api.js lo recoja
  useEffect(() => {
    window.__pandi_recovery__ = recoveryScore
  }, [recoveryScore])

  function handleOpen() {
    if (open) return setOpen(false)
    const currentSection = window.__pandi_section__?.section || null
    setSection(currentSection)
    if (messages.length === 0) {
      setMessages([{
        role:    'assistant',
        content: getWelcomeMessage(currentSection, profile?.name),
      }])
    }
    setOpen(true)
  }

  async function send(text) {
    const content = (text || input).trim()
    if (!content || loading) return
    setInput('')
    const newMessages = [...messages, { role: 'user', content }]
    setMessages(newMessages)
    setLoading(true)
    try {
      // Pasar hora y timezone reales al backend
      const context = {
        clientTime: new Date().toISOString(),
        timezone:   Intl.DateTimeFormat().resolvedOptions().timeZone,
      }
      const { reply } = await api.coach.chat(newMessages.slice(-8), context)
      setMessages(m => [...m, { role: 'assistant', content: reply }])
      useStore.getState().addBondXP?.(5)
    } catch (err) {
      const isLimit = err.message?.includes('limit_reached') || err.message?.includes('límite')
      setMessages(m => [...m, {
        role:    'assistant',
        content: isLimit
          ? '⚠️ Límite diario alcanzado. Actualiza a Premium para mensajes ilimitados.'
          : '❌ Error de conexión. Inténtalo de nuevo.',
      }])
    } finally {
      setLoading(false)
    }
  }

  const fabColor = recoveryLight === 'RED'
    ? '#EF4444'
    : recoveryLight === 'YELLOW'
    ? '#F59E0B'
    : theme.primary

  return (
    <>
      {/* ── MINI CHAT ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity:0, y:20, scale:0.95 }}
            animate={{ opacity:1, y:0,  scale:1    }}
            exit={{    opacity:0, y:20, scale:0.95 }}
            transition={{ type:'spring', damping:25, stiffness:300 }}
            style={{
              position:      'fixed',
              bottom:        90,
              left:          16,
              right:         16,
              maxWidth:      380,
              margin:        '0 auto',
              zIndex:        40,
              borderRadius:  24,
              background:    theme.bg,
              border:        `1.5px solid ${theme.border}`,
              boxShadow:     '0 8px 32px rgba(0,0,0,0.18)',
              overflow:      'hidden',
              display:       'flex',
              flexDirection: 'column',
              maxHeight:     '55vh',
            }}>

            {/* Header */}
            <div style={{
              display:      'flex',
              alignItems:   'center',
              gap:          10,
              padding:      '12px 14px',
              borderBottom: `1px solid ${theme.border}`,
              background:   theme.surface,
              flexShrink:   0,
            }}>
              <div style={{ position:'relative', flexShrink:0 }}>
                <img src="/icons/icon-192.png?v=2" alt="Coach"
                  style={{ width:36, height:36, borderRadius:10 }} />
                <div style={{
                  position:     'absolute',
                  bottom:-2, right:-2,
                  width:10, height:10,
                  borderRadius: '50%',
                  background:   fabColor,
                  border:       `2px solid ${theme.bg}`,
                }} />
              </div>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:13, fontWeight:700, color:theme.text, margin:0 }}>Coach IA</p>
                {section && (
                  <p style={{ fontSize:10, color:theme.textMuted, margin:'1px 0 0' }}>
                    📍 {SECTION_LABELS[section] || section}
                  </p>
                )}
              </div>
              <button onClick={() => setOpen(false)}
                style={{
                  width:36, height:36, borderRadius:8,
                  background:theme.surface2, border:'none',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  cursor:'pointer',
                }}>
                <Minimize2 size={14} style={{ color:theme.textMuted }} />
              </button>
            </div>

            {/* Mensajes */}
            <div style={{
              flex:1, overflowY:'auto',
              padding:'12px 12px 0',
              display:'flex', flexDirection:'column', gap:10,
            }}>
              {messages.map((msg, i) => (
                <div key={i} style={{
                  display:'flex',
                  justifyContent: msg.role==='user' ? 'flex-end' : 'flex-start',
                }}>
                  <div style={{
                    maxWidth:'82%',
                    padding:'9px 13px',
                    borderRadius:16,
                    fontSize:13,
                    lineHeight:1.45,
                    ...(msg.role==='user'
                      ? { background:theme.primary, color:'#fff', borderBottomRightRadius:4 }
                      : { background:theme.surface, color:theme.text, border:`1px solid ${theme.border}`, borderBottomLeftRadius:4 }
                    ),
                  }}>
                    {msg.content}
                  </div>
                </div>
              ))}

              {loading && (
                <div style={{ display:'flex', gap:5, padding:'4px 4px 8px' }}>
                  {[0,1,2].map(i => (
                    <motion.div key={i}
                      animate={{ y:[0,-4,0] }}
                      transition={{ duration:0.6, repeat:Infinity, delay:i*0.15 }}
                      style={{ width:6, height:6, borderRadius:'50%', background:theme.primary }}
                    />
                  ))}
                </div>
              )}
              <div ref={bottomRef} style={{ height:8 }} />
            </div>

            {/* Input */}
            <div style={{
              display:'flex', gap:8,
              padding:'10px 12px',
              borderTop:`1px solid ${theme.border}`,
              background:theme.bg,
              flexShrink:0,
            }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key==='Enter' && send()}
                placeholder="Pregunta algo…"
                style={{
                  flex:1, padding:'9px 14px', borderRadius:12,
                  border:`1.5px solid ${theme.border}`,
                  background:theme.surface2, color:theme.text,
                  fontSize:13, outline:'none',
                }}
              />
              <button onClick={() => send()} disabled={!input.trim() || loading}
                style={{
                  width:40, height:40, borderRadius:12,
                  background: input.trim() ? theme.primary : theme.surface2,
                  border:'none',
                  cursor: input.trim() ? 'pointer' : 'default',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  flexShrink:0, transition:'all 0.2s',
                }}>
                <Send size={15} color={input.trim() ? '#fff' : theme.textMuted} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FAB ── */}
      <motion.button
        onClick={handleOpen}
        whileTap={{ scale:0.92 }}
        animate={!open ? { y:[0,-3,0], scale:[1,1.04,1] } : {}}
        transition={{ duration:3, repeat:Infinity, ease:'easeInOut' }}
        style={{
          position:      'fixed',
          bottom:        88,
          left:          16,
          width:         52,
          height:        52,
          borderRadius:  16,
          background:    `linear-gradient(135deg, ${fabColor}, ${theme.accent || '#FF8FA3'})`,
          border:        'none',
          cursor:        'pointer',
          display:       'flex',
          alignItems:    'center',
          justifyContent:'center',
          zIndex:        39,
          boxShadow:     `0 4px 20px ${fabColor}60`,
        }}>
        {open
          ? <X size={20} color="#fff" />
          : <img src="/icons/icon-192.png?v=2" alt="Coach"
              style={{ width:32, height:32, borderRadius:8 }} />
        }
        {!open && recoveryLight !== 'GREEN' && (
          <div style={{
            position:'absolute', top:-3, right:-3,
            width:14, height:14,
            borderRadius:'50%',
            background:fabColor,
            border:'2px solid white',
          }} />
        )}
      </motion.button>
    </>
  )
}
