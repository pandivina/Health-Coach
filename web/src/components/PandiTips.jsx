import { useTheme } from '../contexts/ThemeProvider'
// Añade la propiedad 'variant' (por defecto "inline")
export default function PandiTips({ section, variant = "inline" }) {
  const { theme } = useTheme()
  const { profile } = useStore()
  const [tip, setTip] = useState(null)
  const [visible, setVisible] = useState(false)
  const [imgErr, setImgErr] = useState(false)

  const petName = profile?.pet_name || 'Pandi'

  useEffect(() => {
    const sectionTips = TIPS[section]
    if (!sectionTips) return

    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000)
    const tipIndex = (dayOfYear + section.length) % sectionTips.length
    setTip(sectionTips[tipIndex])

    const key = `pandi_tip_${section}_${new Date().toISOString().split('T')[0]}`
    if (localStorage.getItem(key)) return

    const t = setTimeout(() => setVisible(true), 1500) // Un pelín más rápido
    return () => clearTimeout(t)
  }, [section])

  function dismiss() {
    const key = `pandi_tip_${section}_${new Date().toISOString().split('T')[0]}`
    localStorage.setItem(key, '1')
    setVisible(false)
  }

  if (!tip) return null

  // Clases CSS dinámicas según la variante para evitar romper la UI
  const containerClasses = variant === "fixed"
    ? "fixed bottom-[80px] left-4 right-4 z-40 max-w-lg mx-auto" // Flotante: justo por encima de la Tab Bar (h-16 = 64px + 16px aire)
    : "w-full my-4 relative" // Integrado: se mueve con el scroll de la página sin tapar nada

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 15, scale: 0.96 }}
          animate={{ opacity: 1, y: 0,  scale: 1    }}
          exit={{    opacity: 0, y: -10, scale: 0.96 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          className={containerClasses}
        >
          <div 
            className="rounded-2xl p-3.5 flex items-start gap-3 border transition-all duration-300"
            style={{
              background: theme.surface, // Cambio sutil a surface para que destaque sobre el fondo plano bg
              borderColor: theme.border,
              boxShadow: variant === "fixed" 
                ? '0 12px 32px rgba(0,0,0,0.12)' 
                : '0 4px 14px rgba(0,0,0,0.03)',
            }}
          >
            {/* Pandi Animación */}
            <motion.div
              animate={{ rotate: [0, -6, 6, -6, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
              className="flex-shrink-0 pt-0.5"
            >
              {imgErr ? (
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm"
                  style={{ background: `${theme.primary}15` }}
                >
                  🐼
                </div>
              ) : (
                <img 
                  src="/panda/talk_1.png" 
                  alt={petName}
                  onError={() => setImgErr(true)}
                  style={{ width: 42, height: 42, objectFit: 'contain' }} 
                />
              )}
            </motion.div>

            {/* Contenido del Tip */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Lightbulb size={12} style={{ color: theme.primary, flexShrink: 0 }} />
                <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: theme.primary }}>
                  Tip de {petName}
                </p>
              </div>
              <p className="text-xs font-medium leading-relaxed" style={{ color: theme.text }}>
                {tip}
              </p>
            </div>

            {/* Botón Cerrar */}
            <button 
              onClick={dismiss} 
              className="flex-shrink-0 p-1 -mr-1 -mt-1 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            >
              <X size={14} style={{ color: theme.textMuted }} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
