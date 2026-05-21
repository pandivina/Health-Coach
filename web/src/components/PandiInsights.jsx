import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../lib/api'
import { useTheme } from '../contexts/ThemeProvider'

export default function PandiInsights() {
  const { theme }               = useTheme()
  const [insights, setInsights] = useState([])
  const [message,  setMessage]  = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [brief,    setBrief]    = useState(null)
  const [expanded, setExpanded] = useState(false)
  const [generated, setGenerated] = useState(false)

  useEffect(() => {
    api.insights.get()
      .then(data => {
        if (data?.length > 0) setInsights(data)
      })
      .catch(() => {})
  }, [])

  async function generate() {
    setLoading(true)
    try {
      const res = await api.insights.generate()
      if (res.insights?.length > 0) {
        setInsights(res.insights)
        setBrief(res.pandi_brief)
        setExpanded(true)
      } else {
        setMessage(res.message)
      }
      setGenerated(true)
    } catch {}
    setLoading(false)
  }

  async function markSeen(id) {
    await api.insights.markSeen(id).catch(() => {})
    setInsights(prev => prev.map(i => i.id === id ? { ...i, seen: true } : i))
  }

  const unseen = insights.filter(i => !i.seen)

  return (
    <div className="card mb-4" style={{ border: `1px solid ${theme.border}` }}>
      {/* Header */}
      <button onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 text-left">
        <motion.span
          animate={{ rotate: [0, 10, -10, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 5 }}
          style={{ fontSize: 28, flexShrink: 0 }}>
          🔍
        </motion.span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-bold text-sm" style={{ color: theme.text }}>
              Pandi ha notado algo
            </p>
            {unseen.length > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
                style={{ background: theme.primary }}>
                {unseen.length}
              </span>
            )}
          </div>
          <p className="text-xs" style={{ color: theme.textMuted }}>
            {insights.length > 0
              ? `${insights.length} patrones detectados`
              : 'Patrones de tus hábitos'}
          </p>
        </div>
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ color: theme.textMuted, fontSize: 16 }}>
          ▾
        </motion.span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}>
            <div className="mt-4 space-y-3">

              {/* Mensaje de Pandi si viene del generate */}
              {brief && (
                <div className="flex items-start gap-2 p-3 rounded-2xl"
                  style={{ background: `${theme.primary}10` }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>🐼</span>
                  <p className="text-xs italic" style={{ color: theme.text }}>
                    "{brief}"
                  </p>
                </div>
              )}

              {/* Sin datos suficientes */}
              {message && (
                <div className="text-center py-3">
                  <span style={{ fontSize: 36 }}>🐼</span>
                  <p className="text-xs mt-2" style={{ color: theme.textMuted }}>{message}</p>
                </div>
              )}

              {/* Lista de insights */}
              {insights.map((ins, i) => (
                <motion.div key={ins.id || i}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="p-3 rounded-2xl"
                  style={{
                    background: ins.seen ? theme.surface2 : `${theme.primary}10`,
                    border: `1px solid ${ins.seen ? 'transparent' : theme.primary + '30'}`,
                  }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-bold text-xs mb-0.5" style={{ color: theme.text }}>
                        {ins.title}
                      </p>
                      <p className="text-xs leading-relaxed" style={{ color: theme.textMuted }}>
                        {ins.body}
                      </p>
                    </div>
                    {!ins.seen && ins.id && (
                      <button onClick={() => markSeen(ins.id)}
                        className="text-[10px] px-2 py-1 rounded-lg flex-shrink-0"
                        style={{ background: theme.surface2, color: theme.textMuted }}>
                        ✓
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Botón generar */}
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={generate}
                disabled={loading}
                className="w-full py-2.5 rounded-2xl text-sm font-bold transition-all disabled:opacity-50"
                style={{
                  background: generated ? theme.surface2 : `linear-gradient(135deg,#2EC4B6,#FF8FA3)`,
                  color:      generated ? theme.textMuted : '#fff',
                }}>
                {loading ? '🐼 Analizando tus patrones…' : generated ? '🔄 Actualizar análisis' : '🐼 Analizar mis patrones'}
              </motion.button>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
