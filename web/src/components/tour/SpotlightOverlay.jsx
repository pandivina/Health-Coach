import { motion, AnimatePresence } from 'framer-motion'
import { useTourContext } from '../../contexts/GuidedTourProvider'

// Usa 4 divs para crear el spotlight — más fiable que SVG mask
export default function SpotlightOverlay() {
  const { isActive, targetRect } = useTourContext()

  if (!isActive) return null

  const OVERLAY_COLOR = 'rgba(0,0,0,0.68)'

  // Sin target: overlay completo
  if (!targetRect) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 998,
            background: OVERLAY_COLOR,
            pointerEvents: 'none',
          }}
        />
      </AnimatePresence>
    )
  }

  const { top, left, width, height } = targetRect
  const right  = left + width
  const bottom = top + height
  const VW = window.innerWidth
  const VH = window.innerHeight

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ position: 'fixed', inset: 0, zIndex: 998, pointerEvents: 'none' }}
      >
        {/* Top */}
        <motion.div
          animate={{ height: Math.max(0, top) }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, background: OVERLAY_COLOR }}
        />
        {/* Bottom */}
        <motion.div
          animate={{ top: Math.min(VH, bottom), height: Math.max(0, VH - bottom) }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{ position: 'absolute', left: 0, right: 0, background: OVERLAY_COLOR }}
        />
        {/* Left */}
        <motion.div
          animate={{ top, width: Math.max(0, left), height }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{ position: 'absolute', left: 0, background: OVERLAY_COLOR }}
        />
        {/* Right */}
        <motion.div
          animate={{ top, left: right, width: Math.max(0, VW - right), height }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{ position: 'absolute', background: OVERLAY_COLOR }}
        />
        {/* Borde brillante */}
        <motion.div
          animate={{ top, left, width, height }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{
            position: 'absolute',
            borderRadius: 14,
            border: '2px solid rgba(46,196,182,0.9)',
            boxShadow: '0 0 0 4px rgba(46,196,182,0.15), 0 0 24px rgba(46,196,182,0.3)',
          }}
        />
      </motion.div>
    </AnimatePresence>
  )
}
