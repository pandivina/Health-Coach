import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, SkipForward } from 'lucide-react'
import { useTourContext } from '../../contexts/GuidedTourProvider'
import { getPetEmoji } from '../../lib/tours'

const mascotVariants = {
  wave:      { animate: { rotate: [0, 20, -10, 20, 0],    transition: { duration: 1.2, repeat: Infinity, repeatDelay: 2 } } },
  point:     { animate: { x: [0, 6, 0],                   transition: { duration: 0.8, repeat: Infinity } } },
  happy:     { animate: { y: [0, -6, 0],                  transition: { duration: 0.8, repeat: Infinity } } },
  celebrate: { animate: { rotate: [-8, 8, -8], scale: [1, 1.1, 1], transition: { duration: 0.6, repeat: Infinity } } },
  idle:      { animate: { y: [0, -3, 0],                  transition: { duration: 2,   repeat: Infinity } } },
}

const BUBBLE_W = 300
const BUBBLE_H = 220 // altura estimada con todos los botones
const MARGIN   = 12

function getBubbleStyle(targetRect, position) {
  const VW = window.innerWidth
  const VH = window.innerHeight

  // Centro de pantalla (pasos sin target)
  if (!targetRect || position === 'center') {
    return {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: Math.min(BUBBLE_W, VW - MARGIN * 2),
      zIndex: 999,
    }
  }

  const { top, left, width, height, bottom } = targetRect

  // Anchura — nunca mayor que la pantalla menos márgenes
  const bubbleW = Math.min(BUBBLE_W, VW - MARGIN * 2)

  // Horizontal: centrado sobre el target, clampado a pantalla
  let bLeft = left + width / 2 - bubbleW / 2
  bLeft = Math.max(MARGIN, Math.min(bLeft, VW - bubbleW - MARGIN))

  // Vertical: debajo si cabe, arriba si no
  let bTop
  const spaceBelow = VH - bottom - MARGIN
  const spaceAbove = top - MARGIN

  if (spaceBelow >= BUBBLE_H) {
    bTop = bottom + MARGIN
  } else if (spaceAbove >= BUBBLE_H) {
    bTop = top - BUBBLE_H - MARGIN
  } else {
    // No cabe ni arriba ni abajo — centrar verticalmente y desplazar horizontalmente
    bTop = Math.max(MARGIN, Math.min(VH / 2 - BUBBLE_H / 2, VH - BUBBLE_H - MARGIN))
    // Si el target está en el centro, poner la burbuja a la derecha o izquierda
    const targetCenterX = left + width / 2
    if (targetCenterX < VW / 2) {
      bLeft = Math.min(targetCenterX + width / 2 + MARGIN, VW - bubbleW - MARGIN)
    } else {
      bLeft = Math.max(MARGIN, targetCenterX - width / 2 - bubbleW - MARGIN)
    }
  }

  // Clamp final para asegurar que nunca sale del viewport
  bTop  = Math.max(MARGIN, Math.min(bTop,  VH - BUBBLE_H - MARGIN))
  bLeft = Math.max(MARGIN, Math.min(bLeft, VW - bubbleW  - MARGIN))

  return { position: 'fixed', top: bTop, left: bLeft, width: bubbleW, zIndex: 999 }
}

export default function GuidedTour() {
  const { isActive, steps, currentStep, targetRect, nextStep, prevStep, finishTour, userInfo } = useTourContext()

  if (!isActive || !steps.length) return null

  const step = steps[currentStep]
  if (!step) return null

  const petEmoji   = getPetEmoji(userInfo?.petType)
  const mascotAnim = mascotVariants[step.mascotAnim] || mascotVariants.idle
  const bubbleStyle = getBubbleStyle(targetRect, step.position)
  const isFirst    = currentStep === 0
  const isLast     = currentStep === steps.length - 1
  const progress   = ((currentStep + 1) / steps.length) * 100

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step.id}
        style={bubbleStyle}
        initial={{ opacity: 0, scale: 0.88, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.88, y: -8 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      >
        <div style={{
          background: '#ffffff',
          borderRadius: 20,
          border: '2px solid rgba(46,196,182,0.35)',
          boxShadow: '0 12px 48px rgba(0,0,0,0.22), 0 2px 12px rgba(46,196,182,0.18)',
          overflow: 'visible', // NO hidden — para no cortar botones
        }}>

          {/* Barra de progreso */}
          <div style={{ height: 3, background: '#F0F4F8', borderRadius: '20px 20px 0 0', overflow: 'hidden' }}>
            <motion.div
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
              style={{ height: '100%', background: 'linear-gradient(90deg, #2EC4B6, #FF8FA3)', borderRadius: 20 }}
            />
          </div>

          {/* Header: mascota + título + cerrar */}
          <div style={{ padding: '14px 14px 0', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <motion.div
              {...mascotAnim}
              style={{
                fontSize: 36, flexShrink: 0,
                width: 52, height: 52,
                borderRadius: 14,
                background: 'linear-gradient(135deg, #f0fffe, #fff5f7)',
                border: '1px solid rgba(46,196,182,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {petEmoji}
            </motion.div>

            <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
              <p style={{ fontWeight: 800, fontSize: 14, color: '#1F2937', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {step.title}
              </p>
              <p style={{ fontSize: 11, color: '#9CA3AF', margin: '2px 0 0' }}>
                {userInfo?.petName || 'Pandi'} · {currentStep + 1}/{steps.length}
              </p>
            </div>

            <button
              onClick={() => finishTour(true)}
              style={{
                flexShrink: 0, width: 26, height: 26, borderRadius: '50%',
                background: '#F5F7FA', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X size={13} color="#9CA3AF" />
            </button>
          </div>

          {/* Mensaje */}
          <div style={{ padding: '10px 14px' }}>
            <p style={{ fontSize: 13, lineHeight: 1.55, color: '#374151', margin: 0, wordBreak: 'break-word' }}>
              {step.message}
            </p>
          </div>

          {/* Controles */}
          <div style={{
            padding: '10px 14px 14px',
            borderTop: '1px solid #F3F4F6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}>
            {/* Saltar */}
            <button
              onClick={() => finishTour(true)}
              style={{
                fontSize: 11, color: '#9CA3AF', background: 'none', border: 'none',
                cursor: 'pointer', padding: '4px 6px', borderRadius: 8,
                display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0,
              }}
            >
              <SkipForward size={11} /> Saltar
            </button>

            {/* Anterior + Siguiente */}
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              {!isFirst && (
                <button
                  onClick={prevStep}
                  style={{
                    width: 34, height: 34, borderRadius: 10,
                    background: '#F5F7FA', border: '1px solid #E5E7EB',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <ChevronLeft size={15} color="#6B7280" />
                </button>
              )}

              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={isLast ? () => finishTour(false) : nextStep}
                style={{
                  height: 34, paddingLeft: 14, paddingRight: 14,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #2EC4B6, #FF8FA3)',
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 5,
                  color: '#fff', fontWeight: 700, fontSize: 12,
                  whiteSpace: 'nowrap',
                }}
              >
                {isLast ? '¡Listo! 🎉' : <><span>Siguiente</span><ChevronRight size={13} /></>}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
