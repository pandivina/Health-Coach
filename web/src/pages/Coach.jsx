import { Link } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Loader, BookmarkPlus, X, Check, Inbox } from 'lucide-react'
import { api } from '../lib/api'
import { useStore } from '../store/useStore'
import { useTheme } from '../contexts/ThemeProvider'
import { supabase } from '../lib/supabase'
import { MedicalDisclaimerModal } from '../components/legal/MedicalDisclaimer'

const SUGGESTIONS = [
  '¿Cómo voy hoy con mis macros?',
  'Dame un consejo para mejorar mi sueño',
  '¿Qué debería comer ahora?',
  'Motívame para entrenar',
]

const INBOX_CATEGORIES = [
  { id: 'nutrition', emoji: '🥗', label: 'Nutrición' },
  { id: 'workout',   emoji: '💪', label: 'Entreno'   },
  { id: 'habit',     emoji: '✅', label: 'Hábito'    },
  { id: 'recipe',    emoji: '🍳', label: 'Receta'    },
  { id: 'general',   emoji: '📌', label: 'General'   },
]

// ─── MODAL GUARDAR ────────────────────────────────────────────────────────────

function SaveModal({ message, onSave, onClose, theme }) {
  const [category, setCategory] = useState('general')
  const [note,     setNote]     = useState('')

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="w-full max-w-lg rounded-t-3xl p-5"
        style={{ background: theme.bg }} onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between mb-4">
          <p className="font-extrabold text-base" style={{ color: theme.text }}>Guardar recomendación</p>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: theme.surface2 }}>
            <X size={16} style={{ color: theme.textMuted }} />
          </button>
        </div>

        {/* Preview mensaje */}
        <div className="p-3 rounded-2xl mb-4 text-sm leading-relaxed"
          style={{ background: theme.surface2, color: theme.text }}>
          {message.length > 150 ? message.slice(0, 150) + '…' : message}
        </div>

        {/* Categoría */}
        <p className="text-xs font-bold mb-2" style={{ color: theme.textMuted }}>Categoría</p>
        <div className="grid grid-cols-5 gap-2 mb-4">
          {INBOX_CATEGORIES.map(c => (
            <button key={c.id} onClick={() => setCategory(c.id)}
              className="flex flex-col items-center gap-1 py-2.5 rounded-2xl transition-all"
              style={{
                background: category === c.id ? `${theme.primary}20` : theme.surface2,
                border: `2px solid ${category === c.id ? theme.primary : 'transparent'}`,
              }}>
              <span style={{ fontSize: 18 }}>{c.emoji}</span>
              <span className="text-[9px] font-semibold"
                style={{ color: category === c.id ? theme.primary : theme.textMuted }}>
                {c.label}
              </span>
            </button>
          ))}
        </div>

        {/* Nota */}
        <textarea className="input resize-none mb-4" rows={2}
          placeholder="Nota personal (opcional)…"
          value={note} onChange={e => setNote(e.target.value)} />

        <motion.button whileTap={{ scale: 0.97 }} onClick={() => onSave(category, note)}
          className="w-full py-3 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
          style={{ background: `linear-gradient(135deg, ${theme.primary}, #FF8FA3)` }}>
          <Check size={16} /> Guardar en bandeja
        </motion.button>
      </motion.div>
    </motion.div>
  )
}

// ─── BANDEJA ──────────────────────────────────────────────────────────────────

function InboxPanel({ userId, theme, onClose }) {
  const [items,    setItems]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('all')

  useEffect(() => {
    if (!userId) return
    supabase.from('coach_inbox')
      .select('*').eq('user_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setItems(data || []); setLoading(false) })
  }, [userId])

  async function deleteItem(id) {
    await supabase.from('coach_inbox').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  async function toggleDone(item) {
    await supabase.from('coach_inbox').update({ done: !item.done }).eq('id', item.id)
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, done: !i.done } : i))
  }

  const filtered = filter === 'all' ? items : items.filter(i => i.category === filter)

  return (
    <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed inset-0 z-50 flex flex-col max-w-lg mx-auto"
      style={{ background: theme.bg }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-3"
        style={{ borderBottom: `1px solid ${theme.border}` }}>
        <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: theme.surface2 }}>
          <X size={16} style={{ color: theme.textMuted }} />
        </button>
        <div className="flex-1">
          <p className="font-extrabold text-lg" style={{ color: theme.text }}>Bandeja del Coach</p>
          <p className="text-xs" style={{ color: theme.textMuted }}>
            {items.filter(i => !i.done).length} pendientes
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto">
        {[{ id: 'all', emoji: '📋', label: 'Todo' }, ...INBOX_CATEGORIES].map(c => (
          <button key={c.id} onClick={() => setFilter(c.id)}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{
              background: filter === c.id ? theme.primary : theme.surface2,
              color: filter === c.id ? '#fff' : theme.textMuted,
            }}>
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader size={20} className="animate-spin" style={{ color: theme.primary }} />
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-12">
            <p style={{ fontSize: 48 }}>📭</p>
            <p className="mt-3 font-semibold text-sm" style={{ color: theme.text }}>
              Bandeja vacía
            </p>
            <p className="text-xs mt-1" style={{ color: theme.textMuted }}>
              Guarda recomendaciones del coach con el botón 🔖
            </p>
          </div>
        )}
        {filtered.map(item => {
          const cat = INBOX_CATEGORIES.find(c => c.id === item.category)
          return (
            <motion.div key={item.id} layout
              className="p-3 rounded-2xl"
              style={{
                background: item.done ? theme.surface2 : theme.surface,
                border: `1px solid ${item.done ? 'transparent' : theme.border}`,
                opacity: item.done ? 0.6 : 1,
              }}>
              <div className="flex items-start gap-3">
                <button onClick={() => toggleDone(item)}
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{
                    background: item.done ? theme.primary : 'transparent',
                    border: `2px solid ${item.done ? theme.primary : theme.border}`,
                  }}>
                  {item.done && <Check size={10} color="#fff" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span style={{ fontSize: 12 }}>{cat?.emoji}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wide"
                      style={{ color: theme.textMuted }}>{cat?.label}</span>
                    <span className="text-[10px]" style={{ color: theme.textLight }}>
                      {new Date(item.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed"
                    style={{ color: item.done ? theme.textMuted : theme.text,
                             textDecoration: item.done ? 'line-through' : 'none' }}>
                    {item.content}
                  </p>
                  {item.note && (
                    <p className="text-[10px] mt-1 italic" style={{ color: theme.textMuted }}>
                      📝 {item.note}
                    </p>
                  )}
                </div>
                <button onClick={() => deleteItem(item.id)}
                  className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: theme.surface2 }}>
                  <X size={11} style={{ color: theme.textMuted }} />
                </button>
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

// ─── COACH PRINCIPAL ──────────────────────────────────────────────────────────

export default function Coach() {
  const { profile, user } = useStore()
  const { theme }         = useTheme()

  const [messages,    setMessages]    = useState([{
    role: 'assistant',
    content: `¡Hola${profile?.name ? ` ${profile.name}` : ''}! 👋 Soy tu Coach IA. Estoy aquí para ayudarte con nutrición, entrenamiento, sueño y bienestar. ¿En qué puedo ayudarte hoy?`,
  }])
  const [input,       setInput]       = useState('')
  const [loading,     setLoading]     = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [saveModal,   setSaveModal]   = useState(null)  // mensaje a guardar
  const [showInbox,   setShowInbox]   = useState(false)
  const [inboxCount,  setInboxCount]  = useState(0)
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  // Cargar contador bandeja
  useEffect(() => {
    if (!user?.id) return
    supabase.from('coach_inbox').select('id', { count: 'exact' })
      .eq('user_id', user.id).eq('done', false)
      .then(({ count }) => setInboxCount(count || 0))
  }, [user?.id, showInbox])

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
      useStore.getState().addBondXP?.(5)
    } catch (err) {
      const isLimit = err.message?.includes('limit_reached') || err.message?.includes('límite')
      if (isLimit) {
        setMessages(m => [...m, {
          role: 'assistant',
          content: `⚠️ Has alcanzado el límite de 10 mensajes diarios del plan gratuito.\n\n✨ Actualiza a Premium para conversaciones ilimitadas con contexto clínico completo.`,
        }])
        setShowUpgrade(true)
      } else {
        setMessages(m => [...m, { role: 'assistant', content: '❌ Error al conectar. Verifica tu conexión.' }])
      }
    } finally { setLoading(false) }
  }

  async function saveToInbox(category, note) {
    if (!saveModal || !user?.id) return
    await supabase.from('coach_inbox').insert({
      user_id:  user.id,
      content:  saveModal,
      category,
      note:     note || null,
      done:     false,
    })
    setSaveModal(null)
    setInboxCount(n => n + 1)
  }

  return (
    <div className="flex flex-col h-screen max-w-lg mx-auto" style={{ background: theme.bg }}>
      <MedicalDisclaimerModal />

      {/* Header */}
      <div className="px-4 pt-6 pb-3" style={{ borderBottom: `1px solid ${theme.border}` }}>
        <div className="flex items-center gap-3">
          <img src="/icons/icon-192.png" alt="Coach"
            style={{ width: 40, height: 40, borderRadius: 12 }} />
          <div className="flex-1">
            <h1 className="font-bold text-lg" style={{ color: theme.text }}>Coach IA</h1>
            <p className="text-xs flex items-center gap-1" style={{ color: theme.textMuted }}>
              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: theme.success }} />
              En línea · Basado en tus datos
            </p>
          </div>
          {/* Botón bandeja */}
          <button onClick={() => setShowInbox(true)}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: theme.surface2 }}>
            <Inbox size={17} style={{ color: theme.textMuted }} />
            {inboxCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center"
                style={{ background: theme.primary }}>
                {inboxCount > 9 ? '9+' : inboxCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-32">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}>
              {msg.role === 'assistant' && (
                <img src="/icons/icon-192.png" alt="Coach"
                  style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, alignSelf: 'flex-end' }} />
              )}
              <div className="flex flex-col gap-1 max-w-[80%]">
                <div className="rounded-2xl px-4 py-3 text-sm leading-relaxed"
                  style={msg.role === 'user'
                    ? { background: theme.primary, color: '#fff', borderBottomRightRadius: '4px' }
                    : { background: theme.surface, color: theme.text, border: `1px solid ${theme.border}`, borderBottomLeftRadius: '4px' }}>
                  {msg.content}
                </div>
                {/* Botón guardar solo en mensajes del coach */}
                {msg.role === 'assistant' && i > 0 && (
                  <button onClick={() => setSaveModal(msg.content)}
                    className="flex items-center gap-1 self-start px-2 py-0.5 rounded-lg text-[10px] font-medium transition-all"
                    style={{ color: theme.textLight, background: 'transparent' }}>
                    <BookmarkPlus size={11} /> Guardar
                  </button>
                )}
              </div>
            </motion.div>
          ))}
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
              <img src="/icons/icon-192.png" alt="Coach"
                style={{ width: 32, height: 32, borderRadius: 10 }} />
              <div className="rounded-2xl px-4 py-3"
                style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>
                <Loader size={14} className="animate-spin" style={{ color: theme.textMuted }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Banner upgrade */}
        {showUpgrade && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="mx-1 p-3 rounded-2xl flex items-center gap-3"
            style={{ background: `${theme.primary}15`, border: `1px solid ${theme.primary}30` }}>
            <span style={{ fontSize: 22 }}>✨</span>
            <div className="flex-1">
              <p className="text-xs font-bold" style={{ color: theme.text }}>Límite diario alcanzado</p>
              <p className="text-[10px]" style={{ color: theme.textMuted }}>Vuelve mañana o hazte Premium</p>
            </div>
            <Link to="/premium"
              className="text-xs font-bold px-3 py-1.5 rounded-xl text-white flex-shrink-0"
              style={{ background: theme.primary }}>
              Premium
            </Link>
          </motion.div>
        )}

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

      {/* Modal guardar */}
      <AnimatePresence>
        {saveModal && (
          <SaveModal message={saveModal} theme={theme}
            onSave={saveToInbox} onClose={() => setSaveModal(null)} />
        )}
      </AnimatePresence>

      {/* Panel bandeja */}
      <AnimatePresence>
        {showInbox && (
          <InboxPanel userId={user?.id} theme={theme} onClose={() => setShowInbox(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}
