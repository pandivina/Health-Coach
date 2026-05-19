import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, SkipForward } from 'lucide-react'
import { useTourContext } from '../../contexts/GuidedTourProvider'
import { getPetEmoji } from '../../lib/tours'

// ── MASCOT ANIMATIONS ────────────────────────────────────────
const mascotVariants = {
  wave: {
    animate: { rotate: [0, 20, -10, 20, 0], transition: { duration: 1.2, repeat: Infinity, repeatDelay: 2 } }
  },
  point: {
    animate: { x: [0, 6, 0], transition: { duration: 0.8, repeat: Infinity } }
  },
  happy: {
    animate: { y: [0, -6, 0], transition: { duration: 0.8, repeat: Infinity } }
  },
  celebrate: {
    animate: { rotate: [-8, 8, -8], scale: [1, 1.1, 1], transition: { duration: 0.6, repeat: Infinity } }
  },
  idle: {
    animate: { y: [0, -3, 0], transition: { duration: 2, repeat: Infinity } }
  },
}

function getBubblePosition(targetRect, position) {
  const VW = window.innerWidth
  const VH = window.innerHeight
  const BUBBLE_W = Math.min(320, VW - 32)
  const BUBBLE_H = 200 // estimado

  if (!targetRect || position === 'center') {
    return {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: BUBBLE_W,
    }
  }

  let style = { position: 'fixed', width: BUBBLE_W }

  // Horizontal: centrado sobre el target, con límites de pantalla
  let left = targetRect.left + targetRect.width / 2 - BUBBLE_W / 2
  left = Math.max(16, Math.min(left, VW - BUBBLE_W - 16))
  style.left = left

  if (position === 'bottom' || targetRect.bottom + BUBBLE_H + 20 < VH) {
    style.top = Math.min(targetRect.bottom + 16, VH - BUBBLE_H - 80)
  } else {
    style.bottom = VH - targetRect.top + 16
  }

  return style
}

export default function GuidedTour() {
  const {
    isActive, steps, currentStep, targetRect,
    nextStep, prevStep, finishTour, userInfo,
  } = useTourContext()

  if (!isActive || !steps.length) return null

  const step = steps[currentStep]
  if (!step) return null

  const petEmoji = getPetEmoji(userInfo.petType)
  const mascotAnim = mascotVariants[step.mascotAnim] || mascotVariants.idle
  const bubbleStyle = getBubblePosition(targetRect, step.position)
  const isFirst = currentStep === 0
  const isLast = currentStep === steps.length - 1
  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step.id}
        style={{ ...bubbleStyle, zIndex: 999 }}
        initial={{ opacity: 0, scale: 0.85, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.85, y: -10 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        <div style={{
          background: '#fff',
          borderRadius: '1.5rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25), 0 4px 16px rgba(46,196,182,0.2)',
          overflow: 'hidden',
          border: '2px solid rgba(46,196,182,0.3)',
        }}>
          {/* Progress bar */}
          <div style={{ height: 3, background: '#F5F7FA' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
              style={{ height: '100%', background: 'linear-gradient(90deg, #2EC4B6, #FF8FA3)' }}
            />
          </div>

          {/* Header */}
          <div style={{ padding: '16px 16px 0', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            {/* Mascot */}
            <motion.div
              {...mascotAnim}
              style={{
                fontSize: 40,
                lineHeight: 1,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 56,
                height: 56,
                borderRadius: '1rem',
                background: 'linear-gradient(135deg, #f0fffe, #fff5f7)',
                border: '1px solid rgba(46,196,182,0.2)',
              }}
            >
              {petEmoji}
            </motion.div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 800, fontSize: 15, color: '#1F2937', margin: '0 0 2px' }}>
                {step.title}
              </p>
              <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>
                {userInfo.petName} · Paso {currentStep + 1} de {steps.length}
              </p>
            </div>

            {/* Skip button */}
            <button
              onClick={() => finishTour(true)}
              style={{
                width: 28, height: 28, borderRadius: '50%',
                background: '#F5F7FA', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <X size={14} color="#9CA3AF" />
            </button>
          </div>

          {/* Message */}
          <div style={{ padding: '12px 16px' }}>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: '#4B5563', margin: 0 }}>
              {step.message}
            </p>
          </div>

          {/* Controls */}
          <div style={{
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid #F3F4F6',
            gap: 8,
          }}>
            {/* Skip all */}
            <button
              onClick={() => finishTour(true)}
              style={{
                fontSize: 12, color: '#9CA3AF', background: 'none',
                border: 'none', cursor: 'pointer', padding: '4px 8px',
                borderRadius: 8, display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              <SkipForward size={12} /> Saltar
            </button>

            <div style={{ display: 'flex', gap: 8 }}>
              {/* Prev */}
              {!isFirst && (
                <button
                  onClick={prevStep}
                  style={{
                    width: 36, height: 36, borderRadius: '0.75rem',
                    background: '#F5F7FA', border: '1px solid #E5E7EB',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <ChevronLeft size={16} color="#6B7280" />
                </button>
              )}

              {/* Next / Finish */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={isLast ? () => finishTour(false) : nextStep}
                style={{
                  height: 36,
                  paddingLeft: 16, paddingRight: 16,
                  borderRadius: '0.75rem',
                  background: 'linear-gradient(135deg, #2EC4B6, #FF8FA3)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                  color: '#fff', fontWeight: 700, fontSize: 13,
                }}
              >
                {isLast ? (
                  '¡Listo! 🎉'
                ) : (
                  <><span>Siguiente</span><ChevronRight size={14} /></>
                )}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Arrow pointer hacia el target */}
        {targetRect && step.position !== 'center' && (
          <div style={{
            position: 'absolute',
            top: step.position === 'top' ? 'auto' : -8,
            bottom: step.position === 'top' ? -8 : 'auto',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 16, height: 8,
            overflow: 'hidden',
          }}>
            <div style={{
              width: 16, height: 16,
              background: step.position === 'top' ? '#fff' : '#fff',
              border: '2px solid rgba(46,196,182,0.3)',
              transform: step.position === 'top'
                ? 'rotate(45deg) translate(-4px, -4px)'
                : 'rotate(45deg) translate(4px, 4px)',
              boxShadow: '2px 2px 8px rgba(0,0,0,0.1)',
            }} />
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
