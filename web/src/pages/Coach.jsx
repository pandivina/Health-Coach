import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Loader } from 'lucide-react'
import { api } from '../lib/api'
import { useStore } from '../store/useStore'

const SUGGESTIONS = [
  '¿Cómo voy hoy con mis macros?',
  'Dame un consejo para mejorar mi sueño',
  '¿Qué debería comer ahora?',
  'Motívame para entrenar',
]

export default function Coach() {
  const { profile } = useStore()
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `¡Hola${profile?.name ? ` ${profile.name}` : ''}! 👋 Soy tu Coach IA. Estoy aquí para ayudarte con nutrición, entrenamiento, sueño y bienestar. ¿En qué puedo ayudarte hoy?`,
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send(text) {
    const content = text || input.trim()
    if (!content || loading) return
    setInput('')
    const userMsg = { role: 'user', content }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setLoading(true)
    try {
      // Solo enviar las últimas 10 mensajes para no exceder contexto
      const contextMessages = newMessages.slice(-10)
      const { reply } = await api.coach.chat(contextMessages)
      setMessages(m => [...m, { role: 'assistant', content: reply }])
    } catch (err) {
      setMessages(m => [...m, { role: 'assistant', content: '❌ Error al conectar con el coach. Verifica tu conexión.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-[#0a0a12] max-w-lg mx-auto">
      {/* Header */}
      <div className="px-4 pt-6 pb-3 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center text-xl">🤖</div>
          <div>
            <h1 className="font-bold text-lg">Coach IA</h1>
            <p className="text-white/40 text-xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-green inline-block" /> En línea · Basado en tus datos
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
                <div className="w-7 h-7 rounded-xl bg-violet-500/20 flex items-center justify-center text-sm mr-2 flex-shrink-0 mt-1">
                  🤖
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-accent text-white rounded-br-sm'
                  : 'bg-surface-2 text-white/90 rounded-bl-sm border border-white/5'
              }`}>
                {msg.content}
              </div>
            </motion.div>
          ))}
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-violet-500/20 flex items-center justify-center text-sm">🤖</div>
              <div className="bg-surface-2 rounded-2xl rounded-bl-sm px-4 py-3 border border-white/5">
                <Loader size={14} className="animate-spin text-white/50" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Suggestions + Input */}
      <div className="fixed bottom-16 left-0 right-0 max-w-lg mx-auto px-4 pb-3 bg-[#0a0a12]/95 backdrop-blur-xl border-t border-white/5 pt-3">
        {messages.length <= 2 && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-3">
            {SUGGESTIONS.map(s => (
              <button key={s} onClick={() => send(s)}
                className="flex-shrink-0 text-xs bg-surface-2 border border-white/10 rounded-full px-3 py-1.5 text-white/70 active:bg-accent/20 transition-all">
                {s}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            className="input flex-1 text-sm"
            placeholder="Pregunta algo a tu coach…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
          />
          <button onClick={() => send()} disabled={!input.trim() || loading}
            className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center 
                       disabled:opacity-40 active:scale-90 transition-all flex-shrink-0">
            <Send size={16} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}
