import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Loader } from 'lucide-react'
import { api } from '../lib/api'
import { useStore } from '../store/useStore'
import { useTheme } from '../contexts/ThemeProvider'
import { MedicalDisclaimerModal } from '../components/legal/MedicalDisclaimer'

const SUGGESTIONS = [
  '¿Cómo voy hoy con mis macros?',
  'Dame un consejo para mejorar mi sueño',
  '¿Qué debería comer ahora?',
  'Motívame para entrenar',
]

export default function Coach() {
  const { profile } = useStore()
  const { theme } = useTheme()
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: `¡Hola${profile?.name ? ` ${profile.name}` : ''}! 👋 Soy tu Coach IA. Estoy aquí para ayudarte con nutrición, entrenamiento, sueño y bienestar. ¿En qué puedo ayudarte hoy?`,
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  async function send(text) {
    const content = text || input.trim()
    if (!content || loading) return
    setInput('')
    const newMessages = [...messages, { role: 'user', content }]
    setMessages(newMessages)
    setLoading(true)
    try {
      const { reply } = await api.coach.chat(newMessages.slice(-10))
      setMessages(m => [...m, { role: 'assistant', content: reply }])
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: '❌ Error al conectar. Verifica tu conexión.' }])
    } finally { setLoading(false) }
  }
  return (
    <div className="flex flex-col h-screen max-w-lg mx-auto" style={{ background: theme.bg }}>
      <MedicalDisclaimerModal />
      {/* Header */}
      <div className="px-4 pt-6 pb-3" style={{ borderBottom: `1px solid ${theme.border}` }}>
        <div className="flex items-center gap-3">
          <img src="/icons/icon-192.png" alt="Coach" style={{ width: 40, height: 40, borderRadius: 12 }} />
          <div>
            <h1 className="font-bold text-lg" style={{ color: theme.text }}>Coach IA</h1>
            <p className="text-xs flex items-center gap-1" style={{ color: theme.textMuted }}>
              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: theme.success }} />
              En línea · Basado en tus datos
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-32">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <img src="/icons/icon-192.png" alt="Coach" style={{ width: 40, height: 40, borderRadius: 12 }} />
              )}
              <div className="max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
                style={msg.role === 'user'
                  ? { background: theme.primary, color: '#fff', borderBottomRightRadius: '4px' }
                  : { background: theme.surface, color: theme.text, border: `1px solid ${theme.border}`, borderBottomLeftRadius: '4px' }}>
                {msg.content}
              </div>
            </motion.div>
          ))}
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
              <img src="/icons/icon-192.png" alt="Coach" style={{ width: 40, height: 40, borderRadius: 12 }} />
              <div className="rounded-2xl px-4 py-3" style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>
                <Loader size={14} className="animate-spin" style={{ color: theme.textMuted }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="fixed bottom-16 left-0 right-0 max-w-lg mx-auto px-4 pb-3 pt-3"
        style={{ background: `${theme.bg}f5`, backdropFilter: 'blur(20px)', borderTop: `1px solid ${theme.border}` }}>
        {messages.length <= 2 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
            {SUGGESTIONS.map(s => (
              <button key={s} onClick={() => send(s)}
                className="flex-shrink-0 text-xs rounded-full px-3 py-1.5 transition-all"
                style={{ background: theme.surface2, border: `1px solid ${theme.border}`, color: theme.textMuted }}>
                {s}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input className="input flex-1 text-sm" placeholder="Pregunta algo a tu coach…"
            value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()} />
          <button onClick={() => send()} disabled={!input.trim() || loading}
            className="w-11 h-11 rounded-xl flex items-center justify-center active:scale-90 transition-all flex-shrink-0 disabled:opacity-40"
            style={{ background: theme.primary }}>
            <Send size={16} color="#fff" />
          </button>
        </div>
      </div>
    </div>
  )
}
