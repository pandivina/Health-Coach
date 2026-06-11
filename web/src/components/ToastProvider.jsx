// src/components/ToastProvider.jsx
// Añadir en App.jsx junto a AchievementToastProvider

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { _registerToast } from '../lib/toast'

const STYLES = {
  error:   { bg:'#FEF2F2', border:'#FECACA', dot:'#EF4444', icon:'❌' },
  success: { bg:'#F0FDF4', border:'#BBF7D0', dot:'#22C55E', icon:'✅' },
  info:    { bg:'#EFF6FF', border:'#BFDBFE', dot:'#3B82F6', icon:'💡' },
}

export function ToastProvider({ children }) {
  const [queue,   setQueue]   = useState([])
  const [current, setCurrent] = useState(null)
  const [visible, setVisible] = useState(false)

  _registerToast((t) => setQueue(q => [...q, { ...t, id: Date.now() }]))

  useEffect(() => {
    if (!current && queue.length > 0) {
      const [next, ...rest] = queue
      setQueue(rest)
      setCurrent(next)
      setVisible(true)
      setTimeout(() => {
        setVisible(false)
        setTimeout(() => setCurrent(null), 400)
      }, 3500)
    }
  }, [queue, current])

  const s = current ? STYLES[current.type] || STYLES.info : STYLES.info

  return (
    <>
      {children}
      <AnimatePresence>
        {visible && current && (
          <motion.div
            initial={{ opacity:0, y:-60, scale:0.9 }}
            animate={{ opacity:1, y:0,   scale:1   }}
            exit={{   opacity:0, y:-60, scale:0.9  }}
            transition={{ type:'spring', damping:22, stiffness:320 }}
            style={{
              position:'fixed', top:16, left:16, right:16,
              zIndex:200,
              display:'flex', justifyContent:'center',
              pointerEvents:'none',
            }}>
            <div style={{
              maxWidth:380, width:'100%',
              background: s.bg,
              border: `1px solid ${s.border}`,
              borderRadius:16,
              padding:'12px 16px',
              display:'flex', alignItems:'center', gap:10,
              boxShadow:'0 8px 24px rgba(0,0,0,0.08)',
            }}>
              <span style={{ fontSize:18, flexShrink:0 }}>{s.icon}</span>
              <p style={{
                fontSize:13, fontWeight:600,
                color:'#1A2332', margin:0, flex:1, lineHeight:1.4,
              }}>
                {current.message}
              </p>
              <div style={{
                width:6, height:6, borderRadius:'50%',
                background: s.dot, flexShrink:0,
              }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
