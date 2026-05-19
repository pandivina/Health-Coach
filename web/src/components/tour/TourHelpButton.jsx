import { motion } from 'framer-motion'
import { useTourContext } from '../../contexts/GuidedTourProvider'
import { getPetEmoji } from '../../lib/tours'

// Botón flotante para relanzar el tour de la página actual
export default function TourHelpButton({ tourKey }) {
  const { startTour, isActive, userInfo } = useTourContext()
  if (isActive) return null

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 2 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => startTour(tourKey)}
      style={{
        position: 'fixed',
        bottom: 88,
        right: 16,
        zIndex: 100,
        width: 44,
        height: 44,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #2EC4B6, #FF8FA3)',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 20,
        boxShadow: '0 4px 16px rgba(46,196,182,0.4)',
      }}
      title="Ver tutorial"
    >
      {getPetEmoji(userInfo?.petType)}
    </motion.button>
  )
}
