import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { X, Sparkles } from 'lucide-react'
import { useTheme } from '../contexts/ThemeProvider'

// ─── COMPONENTE REUTILIZABLE ──────────────────────────────────────────────────
// Uso: <PremiumGate visible={showPremium} onClose={() => setShowPremium(false)} feature="Análisis de foto" />
// Disparar: catch (err) { if (err.message === 'premium_required') setShowPremium(true) }

export default function PremiumGate({ visible, onClose, feature = 'esta función' }) {
  const { theme } = useTheme()

  return (
    <AnimatePresence>
      {visible && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={onClose}>
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="w-full max-w-lg rounded-t-3xl p-6"
            style={{ background: theme.bg }}
            onClick={e => e.stopPropagation()}>

            {/* Close */}
            <button onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: theme.surface2 }}>
              <X size={16} style={{ color: theme.textMuted }} />
            </button>

            {/* Pandi */}
            <div className="flex flex-col items-center text-center mb-5">
              <motion.img src="/panda/talk_1.png" alt="Pandi"
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                style={{ width: 80, height: 80, objectFit: 'contain', marginBottom: 12 }}
                onError={e => { e.target.style.display='none' }} />
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-3"
                style={{ background: `${theme.primary}15`, color: theme.primary }}>
                <Sparkles size={11} /> Función Premium
              </div>
              <h2 className="text-xl font-extrabold mb-2" style={{ color: theme.text }}>
                {feature} es Premium ⭐
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: theme.textMuted }}>
                Hazte Premium para desbloquear {feature.toLowerCase()} y muchas más funciones avanzadas.
                7 días gratis, sin tarjeta.
              </p>
            </div>

            {/* Features incluidas */}
            <div className="space-y-2 mb-5">
              {[
                '📸 Análisis de foto de comida con IA',
                '📦 Escáner de código de barras',
                '🍳 Recetas personalizadas con IA',
                '🔬 Interpretación de analíticas',
                '💬 Coach IA sin límite de mensajes',
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: `${theme.primary}20` }}>
                    <span style={{ fontSize: 8, color: theme.primary }}>✓</span>
                  </div>
                  <p className="text-xs" style={{ color: theme.text }}>{f}</p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <Link to="/premium" onClick={onClose}>
              <motion.button whileTap={{ scale: 0.97 }}
                className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 mb-2"
                style={{ background: `linear-gradient(135deg, ${theme.primary}, #FF8FA3)` }}>
                <Sparkles size={16} /> Ver planes Premium
              </motion.button>
            </Link>
            <button onClick={onClose}
              className="w-full py-3 rounded-2xl text-sm font-semibold"
              style={{ background: theme.surface2, color: theme.textMuted }}>
              Ahora no
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
