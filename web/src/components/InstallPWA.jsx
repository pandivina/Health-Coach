import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X } from 'lucide-react'
import { useTheme } from '../contexts/ThemeProvider'

// Captura el evento en cuanto se carga el módulo — así no lo perdemos
// aunque tarde en montarse el componente.
let _deferredPrompt = null
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    _deferredPrompt = e
  })
}

function getPlatform() {
  if (typeof window === 'undefined') return 'unknown'
  const ua = navigator.userAgent
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    navigator.standalone === true
  if (standalone)                                          return 'installed'
  if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream)   return 'ios'
  if (/Android/.test(ua))                                  return 'android'
  return 'desktop'
}

export default function InstallPWA() {
  const { theme } = useTheme()
  const [platform,       setPlatform]       = useState('unknown')
  const [prompt,         setPrompt]         = useState(null)
  const [showIOSModal,   setShowIOSModal]   = useState(false)
  const [justInstalled,  setJustInstalled]  = useState(false)

  useEffect(() => {
    setPlatform(getPlatform())
    // Si el evento ya llegó antes de montar, lo recogemos aquí
    if (_deferredPrompt) setPrompt(_deferredPrompt)

    // Por si llega después de montar
    const handler = (e) => { e.preventDefault(); _deferredPrompt = e; setPrompt(e) }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => { setJustInstalled(true); setPlatform('installed') })
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleAndroid() {
    if (!prompt) return
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') { setJustInstalled(true); setPlatform('installed') }
    setPrompt(null); _deferredPrompt = null
  }

  // Ya instalada
  if (platform === 'installed' || justInstalled) {
    return (
      <div className="card flex items-center gap-3">
        <span style={{ fontSize: 22 }}>✅</span>
        <div>
          <p className="font-bold text-sm" style={{ color: theme.text }}>App instalada</p>
          <p className="text-xs" style={{ color: theme.textMuted }}>Pandi ya está en tu pantalla de inicio</p>
        </div>
      </div>
    )
  }

  // iOS
  if (platform === 'ios') {
    return (
      <>
        <motion.div whileTap={{ scale: 0.97 }} onClick={() => setShowIOSModal(true)}
          className="card flex items-center gap-4 cursor-pointer"
          style={{ borderLeft: '4px solid #2EC4B6' }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#2EC4B6,#FF8FA3)' }}>
            <Download size={20} color="#fff" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm" style={{ color: theme.text }}>Instalar app</p>
            <p className="text-xs" style={{ color: theme.textMuted }}>Añadir a pantalla de inicio (iOS)</p>
          </div>
          <span className="text-xl">📲</span>
        </motion.div>

        {/* Modal instrucciones iOS */}
        <AnimatePresence>
          {showIOSModal && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end"
              style={{ background: 'rgba(0,0,0,0.55)' }}
              onClick={() => setShowIOSModal(false)}>
              <motion.div
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                onClick={e => e.stopPropagation()}
                className="w-full rounded-t-3xl p-6 pb-12"
                style={{ background: theme.surface }}>

                {/* Handle */}
                <div className="w-10 h-1 rounded-full mx-auto mb-5"
                  style={{ background: theme.surface2 }} />

                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <img src="/icons/icon-192.png" alt="Pandi"
                      style={{ width: 40, height: 40, borderRadius: 10 }} />
                    <div>
                      <p className="font-extrabold text-base" style={{ color: theme.text }}>
                        Instalar Pandi
                      </p>
                      <p className="text-xs" style={{ color: theme.textMuted }}>
                        pandihealthcoach.app
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setShowIOSModal(false)}
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: theme.surface2 }}>
                    <X size={14} color={theme.textMuted} />
                  </button>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      n: '1',
                      icon: '⬆️',
                      title: 'Pulsa el botón Compartir',
                      sub: 'El icono de cuadrado con flecha ↑ en la barra de Safari',
                    },
                    {
                      n: '2',
                      icon: '➕',
                      title: 'Toca «Añadir a pantalla de inicio»',
                      sub: 'Desplázate hacia abajo en el menú de opciones',
                    },
                    {
                      n: '3',
                      icon: '✅',
                      title: 'Pulsa «Añadir» para confirmar',
                      sub: 'Pandi aparecerá como app en tu pantalla de inicio',
                    },
                  ].map(s => (
                    <div key={s.n} className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 text-xl"
                        style={{ background: theme.surface2 }}>
                        {s.icon}
                      </div>
                      <div className="flex-1 pt-0.5">
                        <p className="font-semibold text-sm" style={{ color: theme.text }}>{s.title}</p>
                        <p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>{s.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-center mt-6" style={{ color: theme.textMuted }}>
                  ⚠️ Solo funciona desde Safari
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    )
  }

  // Android / Desktop — prompt nativo disponible
  if (platform === 'android' || platform === 'desktop') {
    if (!prompt) return null  // Chrome aún no ha disparado el evento, esperar
    return (
      <motion.div whileTap={{ scale: 0.97 }} onClick={handleAndroid}
        className="card flex items-center gap-4 cursor-pointer"
        style={{ borderLeft: '4px solid #2EC4B6' }}>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#2EC4B6,#FF8FA3)' }}>
          <Download size={20} color="#fff" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-sm" style={{ color: theme.text }}>Instalar app</p>
          <p className="text-xs" style={{ color: theme.textMuted }}>
            {platform === 'desktop' ? 'Instalar en tu ordenador' : 'Instalar en tu Android'}
          </p>
        </div>
        <span className="text-xl">⬇️</span>
      </motion.div>
    )
  }

  return null
}
