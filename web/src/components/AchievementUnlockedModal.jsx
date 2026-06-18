// ─── components/AchievementUnlockedModal.jsx ─────────────────────────────────
import { motion, AnimatePresence } from 'framer-motion'

export default function AchievementUnlockedModal({ achievement, onClose }) {
  if (!achievement) return null

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(15,20,28,0.6)',
          backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center',
          padding:24 }}
        onClick={onClose}>

        <motion.div
          initial={{ scale:0.8, opacity:0, y:20 }} animate={{ scale:1, opacity:1, y:0 }}
          exit={{ scale:0.8, opacity:0 }}
          transition={{ type:'spring', damping:20, stiffness:280 }}
          onClick={e => e.stopPropagation()}
          style={{ width:'100%', maxWidth:320, background:'white', borderRadius:28,
            padding:'32px 24px', textAlign:'center', position:'relative', overflow:'hidden' }}>

          {/* Confeti simple */}
          {Array.from({ length: 10 }).map((_, i) => (
            <motion.div key={i}
              initial={{ y:-20, x: (Math.random()-0.5)*200, opacity:1, rotate:0 }}
              animate={{ y:300, rotate:360 }}
              transition={{ duration:1.8 + Math.random(), delay:i*0.05, ease:'easeIn' }}
              style={{ position:'absolute', top:0, left:'50%', width:8, height:8,
                background:['#2EC4B6','#FF8FA3','#FCD34D','#60A5FA'][i%4], borderRadius:2 }} />
          ))}

          <motion.div
            animate={{ y:[0,-8,0], rotate:[0,-5,5,0] }}
            transition={{ duration:1.5, repeat:Infinity }}
            style={{ fontSize:64, marginBottom:8 }}>
            🐼
          </motion.div>

          <p style={{ fontSize:11, fontWeight:800, color:'#F59E0B', textTransform:'uppercase',
            letterSpacing:'.08em', margin:'0 0 8px' }}>
            ¡Logro desbloqueado!
          </p>

          <div style={{ fontSize:40, marginBottom:8 }}>{achievement.emoji}</div>

          <p style={{ fontSize:17, fontWeight:900, color:'#1A2332', margin:'0 0 6px' }}>
            {achievement.title}
          </p>
          <p style={{ fontSize:13, color:'#6B7280', margin:'0 0 24px' }}>
            {achievement.description}
          </p>

          <motion.button whileTap={{ scale:0.96 }} onClick={onClose}
            style={{ width:'100%', padding:'13px', borderRadius:16, border:'none',
              cursor:'pointer', fontWeight:700, fontSize:14, color:'white',
              background:'linear-gradient(135deg,#2EC4B6,#FF8FA3)' }}>
            ¡Genial!
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
