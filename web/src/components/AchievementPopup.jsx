import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../contexts/ThemeProvider'

// ─── POPUP GLOBAL DE LOGRO ────────────────────────────────────────────────────
// Uso: importar en App.jsx y envolver con AchievementProvider
// Disparar desde cualquier sitio: achievementToast({ title, icon, description, xp })

let _showToast = null

export function achievementToast(achievement) {
  if (_showToast) _showToast(achievement)
}

export function AchievementToastProvider({ children }) {
  const { theme }   = useTheme()
  const [queue,     setQueue]     = useState([])
  const [current,   setCurrent]   = useState(null)
  const [visible,   setVisible]   = useState(false)

  _showToast = useCallback((achievement) => {
    setQueue(q => [...q, achievement])
  }, [])

  useEffect(() => {
    if (!current && queue.length > 0) {
      const [next, ...rest] = queue
      setQueue(rest)
      setCurrent(next)
      setVisible(true)
      setTimeout(() => {
        setVisible(false)
        setTimeout(() => setCurrent(null), 500)
      }, 4000)
    }
  }, [queue, current])

  return (
    <>
      {children}
      <AnimatePresence>
        {visible && current && (
          <motion.div
            initial={{ opacity: 0, y: -80, scale: 0.8 }}
            animate={{ opacity: 1, y: 0,   scale: 1    }}
            exit={{   opacity: 0, y: -80, scale: 0.8   }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed top-4 left-0 right-0 z-[100] flex justify-center px-4 pointer-events-none">
            <div className="rounded-2xl px-4 py-3 flex items-center gap-3 shadow-2xl max-w-sm w-full"
              style={{
                background: 'linear-gradient(135deg, #1F2937, #374151)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}>
              {/* Pandi pequeño */}
              <motion.img src="/panda/celebrate_1.png" alt="Pandi"
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.6, delay: 0.3 }}
                style={{ width: 44, height: 44, objectFit: 'contain', flexShrink: 0 }}
                onError={e => { e.target.style.display='none' }} />

              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5"
                  style={{ color: '#2EC4B6' }}>
                  ¡Logro desbloqueado!
                </p>
                <div className="flex items-center gap-1.5">
                  <span style={{ fontSize: 18 }}>{current.icon}</span>
                  <p className="font-extrabold text-sm text-white truncate">{current.title}</p>
                </div>
                {current.description && (
                  <p className="text-[10px] mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    {current.description}
                  </p>
                )}
              </div>

              {current.xp && (
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: 'spring' }}
                  className="flex-shrink-0 px-2.5 py-1 rounded-xl text-xs font-bold"
                  style={{ background: '#2EC4B620', color: '#2EC4B6' }}>
                  +{current.xp} XP
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
