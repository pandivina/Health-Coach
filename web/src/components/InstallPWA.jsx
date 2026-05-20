/**
 * InstallPWA — botón de instalación siempre visible.
 * - iOS Safari   → bottom sheet con instrucciones manuales
 * - Android/Desktop con prompt nativo → lanza el prompt del sistema
 * - Android/Desktop sin prompt aún   → instrucciones manuales desde menú Chrome
 * - Ya instalada → muestra "App instalada ✓"
 *
 * Úsalo en: <Landing />, <Auth />, <Profile /> (y donde quieras)
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X } from 'lucide-react'
import { useTheme } from '../contexts/ThemeProvider'

// Captura el prompt en cuanto el módulo se carga — no lo perdemos aunque el
// componente tarde en montarse (lo que pasaba antes y causaba que el botón
// nunca apareciese en Android).
let _prompt = null
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault()
    _prompt = e
    // Notifica a todos los componentes montados
    window.dispatchEvent(new Event('pwa-prompt-ready'))
  })
}

function getPlatform() {
  if (typeof window === 'undefined') return 'unknown'
  const ua = navigator.userAgent
  if (window.matchMedia('(display-mode: standalone)').matches ||
      navigator.standalone === true) return 'installed'
  if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) return 'ios'
  return 'other' // Android, desktop, etc.
}

// ─── Instrucciones iOS ───────────────────────────────────────────────────────

function IOSModal({ onClose, theme }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={onClose}>
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()}
        className="w-full rounded-t-3xl p-6 pb-12"
        style={{ background: theme.surface }}>

        <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: theme.surface2 }} />

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <img src="/icons/icon-192.png" alt="Pandi"
              style={{ width: 40, height: 40, borderRadius: 10 }}
              onError={e => { e.currentTarget.style.display='none' }} />
            <div>
              <p className="font-extrabold text-base" style={{ color: theme.text }}>Instalar Pandi</p>
              <p className="text-xs" style={{ color: theme.textMuted }}>pandihealthcoach.app</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: theme.surface2 }}>
            <X size={14} color={theme.textMuted} />
          </button>
        </div>

        {[
          { icon: '⬆️', title: 'Pulsa el botón Compartir',
            sub: 'Icono de cuadrado con flecha ↑ en la barra inferior de Safari' },
          { icon: '➕', title: 'Toca «Añadir a pantalla de inicio»',
            sub: 'Desplázate hacia abajo en el menú de opciones' },
          { icon: '✅', title: 'Pulsa «Añadir» para confirmar',
            sub: 'Pandi aparecerá como app en tu pantalla de inicio' },
        ].map((s, i) => (
          <div key={i} className="flex items-start gap-4 mb-4">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 text-xl"
              style={{ background: theme.surface2 }}>{s.icon}</div>
            <div className="flex-1 pt-1">
              <p className="font-semibold text-sm" style={{ color: theme.text }}>{s.title}</p>
              <p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>{s.sub}</p>
            </div>
          </div>
        ))}

        <p className="text-xs text-center mt-2" style={{ color: theme.textMuted }}>
          ⚠️ Solo funciona desde Safari
        </p>
      </motion.div>
    </motion.div>
  )
}

// ─── Instrucciones Android/Desktop sin prompt nativo ────────────────────────

function AndroidModal({ onClose, theme }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={onClose}>
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()}
        className="w-full rounded-t-3xl p-6 pb-12"
        style={{ background: theme.surface }}>

        <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: theme.surface2 }} />

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <img src="/icons/icon-192.png" alt="Pandi"
              style={{ width: 40, height: 40, borderRadius: 10 }}
              onError={e => { e.currentTarget.style.display='none' }} />
            <div>
              <p className="font-extrabold text-base" style={{ color: theme.text }}>Instalar Pandi</p>
              <p className="text-xs" style={{ color: theme.textMuted }}>pandihealthcoach.app</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: theme.surface2 }}>
            <X size={14} color={theme.textMuted} />
          </button>
        </div>

        {[
          { icon: '⋮', title: 'Abre el menú de Chrome',
            sub: 'Pulsa los tres puntos ⋮ en la esquina superior derecha' },
          { icon: '📲', title: 'Toca «Añadir a pantalla de inicio»',
            sub: 'O «Instalar app» si aparece esa opción' },
          { icon: '✅', title: 'Confirma la instalación',
            sub: 'Pandi aparecerá como app en tu pantalla de inicio' },
        ].map((s, i) => (
          <div key={i} className="flex items-start gap-4 mb-4">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 text-xl font-bold"
              style={{ background: theme.surface2, color: theme.text }}>{s.icon}</div>
            <div className="flex-1 pt-1">
              <p className="font-semibold text-sm" style={{ color: theme.text }}>{s.title}</p>
              <p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>{s.sub}</p>
            </div>
          </div>
        ))}
      </motion.div>
    </motion.div>
  )
}

// ─── Componente principal ────────────────────────────────────────────────────

export default function InstallPWA({ variant = 'card' }) {
  const { theme }  = useTheme()
  const [platform, setPlatform]     = useState('unknown')
  const [prompt,   setPrompt]       = useState(null)
  const [modal,    setModal]        = useState(null)   // 'ios' | 'android' | null
  const [installed, setInstalled]   = useState(false)

  useEffect(() => {
    setPlatform(getPlatform())
    if (_prompt) setPrompt(_prompt)

    const onPromptReady = () => setPrompt(_prompt)
    const onInstalled   = () => { setInstalled(true); setPlatform('installed') }

    window.addEventListener('pwa-prompt-ready', onPromptReady)
    window.addEventListener('appinstalled',     onInstalled)
    return () => {
      window.removeEventListener('pwa-prompt-ready', onPromptReady)
      window.removeEventListener('appinstalled',     onInstalled)
    }
  }, [])

  async function handlePress() {
    if (platform === 'ios') {
      setModal('ios')
      return
    }
    if (prompt) {
      // Prompt nativo disponible → lanzarlo
      prompt.prompt()
      const { outcome } = await prompt.userChoice
      if (outcome === 'accepted') { setInstalled(true); setPlatform('installed') }
      _prompt = null; setPrompt(null)
    } else {
      // Sin prompt nativo → instrucciones manuales
      setModal('android')
    }
  }

  // Ya instalada
  if (platform === 'installed' || installed) {
    return (
      <div className="card flex items-center gap-3 py-3">
        <span className="text-xl">✅</span>
        <div>
          <p className="font-bold text-sm" style={{ color: theme.text }}>App instalada</p>
          <p className="text-xs" style={{ color: theme.textMuted }}>
            Pandi está en tu pantalla de inicio
          </p>
        </div>
      </div>
    )
  }

  // No mostrar en desktop si no hay soporte (ni iOS ni prompt)
  // — en móvil siempre mostramos
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(
    typeof navigator !== 'undefined' ? navigator.userAgent : ''
  )
  if (!isMobile && !prompt && platform !== 'ios') return null

  const label = platform === 'ios'
    ? 'Añadir a pantalla de inicio'
    : prompt
      ? 'Instalar app'
      : 'Cómo instalar la app'

  const sublabel = platform === 'ios'
    ? 'Instrucciones para Safari'
    : prompt
      ? 'Instalar en tu dispositivo'
      : 'Añadir desde el menú de Chrome'

  return (
    <>
      <motion.div
        whileTap={{ scale: 0.97 }}
        onClick={handlePress}
        className="card flex items-center gap-4 cursor-pointer"
        style={{ borderLeft: '4px solid #2EC4B6' }}>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#2EC4B6,#FF8FA3)' }}>
          <Download size={20} color="#fff" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-sm" style={{ color: theme.text }}>{label}</p>
          <p className="text-xs" style={{ color: theme.textMuted }}>{sublabel}</p>
        </div>
        <span className="text-xl">{platform === 'ios' ? '📲' : '⬇️'}</span>
      </motion.div>

      <AnimatePresence>
        {modal === 'ios'     && <IOSModal     onClose={() => setModal(null)} theme={theme} />}
        {modal === 'android' && <AndroidModal onClose={() => setModal(null)} theme={theme} />}
      </AnimatePresence>
    </>
  )
}
