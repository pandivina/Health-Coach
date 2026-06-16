// ─── components/shared/TutorialOverlay.jsx ───────────────────────────────────
// Overlay explicativo genérico y reutilizable para cualquier minijuego.
// Se muestra automáticamente la primera vez (localStorage) y queda accesible
// después mediante un botón "?" persistente.
//
// Uso:
//   const [showTutorial, setShowTutorial] = useState(false)
//   const seenKey = 'tutorial_seen_pandi_pulse'
//
//   useEffect(() => {
//     try { if (!localStorage.getItem(seenKey)) setShowTutorial(true) } catch {}
//   }, [])
//
//   <TutorialOverlay
//     show={showTutorial}
//     onClose={() => { setShowTutorial(false); localStorage.setItem(seenKey,'1') }}
//     title="El Pulso de Pandi"
//     steps={[
//       { icon: '👆', text: 'Arrastra el control hacia arriba para inhalar' },
//       { icon: '✋', text: 'Mantenlo en el centro durante la pausa' },
//       { icon: '👇', text: 'Arrastra hacia abajo para exhalar' },
//     ]}
//   />
//
//   Botón "?" persistente en cualquier pantalla:
//   <TutorialHelpButton onClick={() => setShowTutorial(true)} />

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, HelpCircle } from 'lucide-react'

export function TutorialOverlay({ show, onClose, title, subtitle, steps = [] }) {
  const [stepIdx, setStepIdx] = useState(0)
  const isLast = stepIdx === steps.length - 1

  function next() {
    if (isLast) { onClose(); setStepIdx(0) }
    else setStepIdx(i => i + 1)
  }

  function skip() {
    onClose(); setStepIdx(0)
  }

  if (!show) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(10,14,22,0.88)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
        onClick={skip}>

        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 24, stiffness: 280 }}
          onClick={e => e.stopPropagation()}
          style={{ width: '100%', maxWidth: 340, background: 'white', borderRadius: 28,
            padding: '28px 24px 24px', textAlign: 'center', position: 'relative' }}>

          <button onClick={skip}
            style={{ position: 'absolute', top: 16, right: 16, width: 30, height: 30,
              borderRadius: 10, border: 'none', cursor: 'pointer',
              background: 'rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center',
              justifyContent: 'center' }}>
            <X size={14} color="#6B7280" />
          </button>

          {title && (
            <p style={{ fontSize: 16, fontWeight: 900, color: '#1A2332', margin: '0 0 4px' }}>
              {title}
            </p>
          )}
          {subtitle && (
            <p style={{ fontSize: 12, color: '#9CA3AF', margin: '0 0 20px' }}>{subtitle}</p>
          )}

          <AnimatePresence mode="wait">
            <motion.div key={stepIdx}
              initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }}
              style={{ minHeight: 140, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', marginTop: subtitle ? 0 : 16 }}>
              <span style={{ fontSize: 52, marginBottom: 14, display: 'block' }}>
                {steps[stepIdx]?.icon}
              </span>
              <p style={{ fontSize: 14, color: '#1A2332', lineHeight: 1.5,
                fontWeight: 600, maxWidth: 260 }}>
                {steps[stepIdx]?.text}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Indicadores de paso */}
          {steps.length > 1 && (
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', margin: '16px 0 20px' }}>
              {steps.map((_, i) => (
                <div key={i} style={{ width: i === stepIdx ? 18 : 6, height: 6, borderRadius: 3,
                  background: i === stepIdx ? '#2EC4B6' : 'rgba(0,0,0,0.12)',
                  transition: 'all 0.25s' }} />
              ))}
            </div>
          )}

          <motion.button whileTap={{ scale: 0.96 }} onClick={next}
            style={{ width: '100%', padding: '13px', borderRadius: 16, border: 'none',
              cursor: 'pointer', fontWeight: 700, fontSize: 14, color: 'white',
              background: 'linear-gradient(135deg,#2EC4B6,#FF8FA3)' }}>
            {isLast ? 'Entendido, ¡vamos!' : 'Siguiente →'}
          </motion.button>

          {!isLast && (
            <button onClick={skip}
              style={{ marginTop: 10, fontSize: 12, color: '#9CA3AF', background: 'none',
                border: 'none', cursor: 'pointer', fontWeight: 600 }}>
              Saltar
            </button>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Botón "?" persistente — para reabrir el tutorial en cualquier momento
export function TutorialHelpButton({ onClick, dark = true }) {
  return (
    <motion.button whileTap={{ scale: 0.92 }} onClick={onClick}
      style={{ width: 32, height: 32, borderRadius: 10, border: 'none', cursor: 'pointer',
        background: dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <HelpCircle size={15} color={dark ? 'rgba(255,255,255,0.7)' : '#6B7280'} />
    </motion.button>
  )
}

// Hook helper — gestiona automáticamente el "ya visto" en localStorage
export function useTutorial(key) {
  const seenKey = `tutorial_seen_${key}`
  const [show, setShow] = useState(() => {
    try { return !localStorage.getItem(seenKey) } catch { return false }
  })

  function close() {
    setShow(false)
    try { localStorage.setItem(seenKey, '1') } catch {}
  }

  function reopen() { setShow(true) }

  return { show, close, reopen }
}
