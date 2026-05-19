import { motion, AnimatePresence } from 'framer-motion'
import { useTourContext } from '../../contexts/GuidedTourProvider'

export default function SpotlightOverlay() {
  const { isActive, targetRect, finishTour } = useTourContext()

  if (!isActive) return null

  const hasTarget = !!targetRect

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[998]"
          style={{ pointerEvents: hasTarget ? 'none' : 'auto' }}
          onClick={!hasTarget ? undefined : undefined}
        >
          {hasTarget ? (
            // SVG spotlight con hole en el target
            <svg
              className="absolute inset-0 w-full h-full"
              style={{ pointerEvents: 'none' }}
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <mask id="tour-spotlight-mask">
                  {/* Fondo blanco = oscuro en la máscara */}
                  <rect x="0" y="0" width="100%" height="100%" fill="white" />
                  {/* Hole = transparente (negro en máscara) */}
                  <motion.rect
                    key={`${targetRect.left}-${targetRect.top}`}
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: 1,
                      x: targetRect.left,
                      y: targetRect.top,
                      width: targetRect.width,
                      height: targetRect.height,
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    rx="12"
                    ry="12"
                    fill="black"
                  />
                </mask>
              </defs>
              {/* Overlay oscuro con el hole */}
              <rect
                x="0" y="0" width="100%" height="100%"
                fill="rgba(0,0,0,0.7)"
                mask="url(#tour-spotlight-mask)"
              />
              {/* Borde brillante alrededor del spotlight */}
              <motion.rect
                key={`border-${targetRect.left}-${targetRect.top}`}
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  x: targetRect.left,
                  y: targetRect.top,
                  width: targetRect.width,
                  height: targetRect.height,
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                rx="12"
                ry="12"
                fill="none"
                stroke="rgba(46,196,182,0.8)"
                strokeWidth="2"
              />
            </svg>
          ) : (
            // Sin target: overlay completo semitransparente
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0"
              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
