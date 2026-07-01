import { useRef, useState, useLayoutEffect } from 'react'
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

const BUBBLE_W   = 300
const MARGIN     = 12
const SAFE_BTM   = 80   // espacio para el BottomNav

// Usa visualViewport si está disponible (más fiable en móvil con teclado/barras del browser)
function getVP() {
  const vv = window.visualViewport
  return {
    VW: vv ? vv.width  : document.documentElement.clientWidth,
    VH: vv ? vv.height : document.documentElement.clientHeight,
  }
}

function computePosition(targetRect, position, bW, bH) {
  const { VW, VH } = getVP()

  // Sin target o centrado explícito
  if (!targetRect || position === 'center') {
    return {
      position: 'fixed',
      top:  Math.max(MARGIN, Math.round((VH - bH) / 2)),
      left: Math.max(MARGIN, Math.round((VW - bW) / 2)),
      width: bW,
    }
  }

  const { top, left, width, bottom } = targetRect

  // Horizontal: centrado sobre el target, siempre dentro de pantalla
  let bLeft = Math.round(left + width / 2 - bW / 2)
  bLeft = Math.max(MARGIN, Math.min(bLeft, VW - bW - MARGIN))

  const spaceBelow = VH - bottom - SAFE_BTM
  const spaceAbove = top - MARGIN

  let bTop
  if (spaceBelow >= bH + MARGIN) {
    // Debajo del elemento
    bTop = bottom + MARGIN
  } else if (spaceAbove >= bH + MARGIN) {
    // Encima del elemento
    bTop = top - bH - MARGIN
  } else {
    // No cabe ni arriba ni abajo → centrar verticalmente
    bTop = Math.max(MARGIN, Math.round((VH - bH) / 2))
    // Desplazar horizontalmente respecto al target
    const targetCX = left + width / 2
    if (targetCX < VW / 2) {
      bLeft = Math.min(left + width + MARGIN, VW - bW - MARGIN)
    } else {
      bLeft = Math.max(MARGIN, left - bW - MARGIN)
    }
  }

  // Clamp final absoluto — nunca sale del viewport
  bTop  = Math.max(MARGIN, Math.min(bTop,  VH - bH - SAFE_BTM))
  bLeft = Math.max(MARGIN, Math.min(bLeft, VW - bW - MARGIN))

  return { position: 'fixed', top: bTop, left: bLeft, width: bW }
}

// Componente interno que mide y se posiciona solo
function BubbleInner({ step, currentStep, steps, targetRect, petEmoji, userInfo, prevStep, nextStep, finishTour }) {
  const bubbleRef  = useRef(null)
  const [pos, setPos] = useState(null)  // null → invisible hasta medir

  const mascotAnim = mascotVariants[step.mascotAnim] || mascotVariants.idle
  const isFirst    = currentStep === 0
  const isLast     = currentStep === steps.length - 1
  const progress   = ((currentStep + 1) / steps.length) * 100

  // Mide la burbuja ANTES de que el browser pinte para evitar flash
  useLayoutEffect(() => {
    if (!bubbleRef.current) return
    const { VW } = getVP()
    const bW = Math.min(BUBBLE_W, VW - MARGIN * 2)
    const bH = bubbleRef.current.getBoundingClientRect().height
    setPos(computePosition(targetRect, step.position, bW, bH))
  }, [currentStep, targetRect, step.position])

  const { VW } = getVP()
  const fallbackW = Math.min(BUBBLE_W, VW - MARGIN * 2)

  const wrapperStyle = pos
    ? { ...pos, zIndex: 9999 }
    : { position: 'fixed', top: -9999, left: -9999, width: fallbackW, zIndex: 9999 }

  return (
    <motion.div
      ref={bubbleRef}
      style={wrapperStyle}
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: pos ? 1 : 0, scale: 1, translateY: 0 }}
      exit={{ opacity: 0, scale: 0.88 }}
      style={{ translateY: 12 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
    >
      <div style={{
        background: 'var(--color-surface, #ffffff)',
        borderRadius: 20,
        border: '2px solid rgba(46,196,182,0.35)',
        boxShadow: '0 12px 48px rgba(0,0,0,0.22), 0 2px 12px rgba(46,196,182,0.18)',
        overflow: 'hidden',  // Necesario para que el border-radius recorte la barra de progreso
      }}>

        {/* Barra de progreso */}
        <div style={{ height: 3, background: '#F0F4F8' }}>
          <motion.div
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
            style={{ height: '100%', background: 'linear-gradient(90deg, #2EC4B6, #FF8FA3)' }}
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

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontWeight: 800, fontSize: 14,
              color: 'var(--color-text, #1F2937)',
              margin: 0,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}>
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
          <p style={{
            fontSize: 13, lineHeight: 1.55,
            color: 'var(--color-text-secondary, #374151)',
            margin: 0,
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
          }}>
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
  )
}

export default function GuidedTour() {
  const { isActive, steps, currentStep, targetRect, nextStep, prevStep, finishTour, userInfo } = useTourContext()

  if (!isActive || !steps.length) return null

  const step = steps[currentStep]
  if (!step) return null

  const petEmoji = getPetEmoji(userInfo?.petType)

  return (
    <AnimatePresence mode="wait">
      <BubbleInner
        key={step.id}
        step={step}
        currentStep={currentStep}
        steps={steps}
        targetRect={targetRect}
        petEmoji={petEmoji}
        userInfo={userInfo}
        prevStep={prevStep}
        nextStep={nextStep}
        finishTour={finishTour}
      />
    </AnimatePresence>
  )
}
