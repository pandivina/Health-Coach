import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../contexts/ThemeProvider'

export default function UpdateBanner() {
  const { theme } = useTheme()
  const [needsUpdate, setNeedsUpdate] = useState(false)
  const [worker, setWorker] = useState(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    // Escuchar cuando el service worker detecta una nueva versión
    navigator.serviceWorker.ready.then(reg => {
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing
        if (!newWorker) return

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // Hay una nueva versión lista
            setNeedsUpdate(true)
            setWorker(newWorker)
          }
        })
      })
    })

    // También escuchar el evento custom de vite-plugin-pwa
    const handler = (e) => {
      setNeedsUpdate(true)
      setWorker(e.detail?.waiting)
    }
    window.addEventListener('sw-update-available', handler)
    return () => window.removeEventListener('sw-update-available', handler)
  }, [])

  function update() {
    if (worker) {
      worker.postMessage({ type: 'SKIP_WAITING' })
    }
    window.location.reload()
  }

  return (
    <AnimatePresence>
      {needsUpdate && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-20 left-0 right-0 z-50 px-4 max-w-lg mx-auto"
        >
          <div className="rounded-2xl p-4 flex items-center gap-3 shadow-xl"
            style={{ background: theme.text, border: `1px solid rgba(255,255,255,0.1)` }}>
            <span className="text-2xl flex-shrink-0">🐼</span>
            <div className="flex-1">
              <p className="font-bold text-sm text-white">Nueva versión disponible</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Actualiza para disfrutar de las últimas mejoras
              </p>
            </div>
            <button
              onClick={update}
              className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
              style={{ background: theme.gradientBrand }}
            >
              Actualizar
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
