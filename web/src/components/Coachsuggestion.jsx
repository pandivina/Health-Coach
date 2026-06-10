// src/components/CoachSuggestion.jsx
// Tarjeta de sugerencia proactiva del coach — aparece en el Home
// El color y mensaje cambian según el motor de decisión del coachState

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/useStore'
import { useNavigate } from 'react-router-dom'

const TYPE_STYLES = {
  calm: {
    bg:     'rgba(168,85,247,0.07)',
    border: 'rgba(168,85,247,0.2)',
    dot:    '#8B5CF6',
    label:  '#6D28D9',
    btn_bg: 'rgba(168,85,247,0.12)',
    btn_border: 'rgba(168,85,247,0.25)',
    btn_color: '#6D28D9',
  },
  productivity: {
    bg:     'rgba(99,153,34,0.08)',
    border: 'rgba(99,153,34,0.25)',
    dot:    '#639922',
    label:  '#3B6D11',
    btn_bg: 'rgba(99,153,34,0.15)',
    btn_border: 'rgba(99,153,34,0.35)',
    btn_color: '#3B6D11',
  },
  intention: {
    bg:     'rgba(251,146,60,0.07)',
    border: 'rgba(251,146,60,0.2)',
    dot:    '#F97316',
    label:  '#C2410C',
    btn_bg: 'rgba(251,146,60,0.12)',
    btn_border: 'rgba(251,146,60,0.25)',
    btn_color: '#C2410C',
  },
  health: {
    bg:     'rgba(59,130,246,0.07)',
    border: 'rgba(59,130,246,0.2)',
    dot:    '#3B82F6',
    label:  '#1D4ED8',
    btn_bg: 'rgba(59,130,246,0.12)',
    btn_border: 'rgba(59,130,246,0.25)',
    btn_color: '#1D4ED8',
  },
  checkin: {
    bg:     'rgba(46,196,182,0.07)',
    border: 'rgba(46,196,182,0.2)',
    dot:    '#2EC4B6',
    label:  '#0F766E',
    btn_bg: 'rgba(46,196,182,0.12)',
    btn_border: 'rgba(46,196,182,0.25)',
    btn_color: '#0F766E',
  },
}

export default function CoachSuggestion() {
  const { coachState, completeSmartTask } = useStore()
  const navigate = useNavigate()
  const [dismissed, setDismissed] = useState(false)

  const suggestion = coachState?.coachSuggestion
  if (!suggestion || dismissed) return null

  const style = TYPE_STYLES[suggestion.type] || TYPE_STYLES.intention

  function handleAction() {
    if (!suggestion.action) return
    if (suggestion.action.route) {
      navigate(suggestion.action.route)
    }
    if (suggestion.action.taskId) {
      completeSmartTask(suggestion.action.taskId)
    }
    setDismissed(true)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity:0, y:8 }}
        animate={{ opacity:1, y:0 }}
        exit={{ opacity:0, y:-8 }}
        transition={{ duration:0.4 }}
        style={{
          background:     style.bg,
          borderRadius:   18,
          border:         `0.5px solid ${style.border}`,
          padding:        '14px 16px',
          backdropFilter: 'blur(12px)',
          marginBottom:   16,
        }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
          <div style={{
            width:6, height:6, borderRadius:'50%',
            background: style.dot, flexShrink:0,
          }} />
          <p style={{
            fontSize:11, fontWeight:600, color:style.label,
            margin:0, textTransform:'uppercase', letterSpacing:'0.06em',
          }}>
            Pandi sugiere
          </p>
        </div>

        {/* Mensaje */}
        <p style={{
          fontSize:14, color:'#1A2332',
          margin:'0 0 12px', lineHeight:1.55,
          fontStyle: suggestion.type === 'intention' ? 'italic' : 'normal',
        }}>
          {suggestion.message}
        </p>

        {/* Acciones */}
        {(suggestion.action || true) && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            {suggestion.action ? (
              <motion.button whileTap={{ scale:0.97 }} onClick={handleAction}
                style={{
                  fontSize:12, padding:'7px 16px', borderRadius:10,
                  background:   style.btn_bg,
                  border:       `0.5px solid ${style.btn_border}`,
                  color:        style.btn_color,
                  cursor:       'pointer', fontWeight:500,
                }}>
                {suggestion.action.label}
              </motion.button>
            ) : (
              <span />
            )}
            <button onClick={() => setDismissed(true)}
              style={{
                fontSize:11, background:'none', border:'none',
                color:'rgba(107,114,128,0.7)', cursor:'pointer', padding:0,
              }}>
              Ignorar
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
