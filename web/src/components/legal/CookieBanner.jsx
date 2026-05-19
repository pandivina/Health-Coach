import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cookie, X, Settings } from 'lucide-react'
import { Link } from 'react-router-dom'

const C = {
  bg: '#1F2937', text: '#F9FAFB', muted: 'rgba(249,250,251,0.6)',
  primary: '#2EC4B6', border: 'rgba(255,255,255,0.1)',
}

export default function CookieBanner() {
  const [show, setShow] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [prefs, setPrefs] = useState({ analytics: true, marketing: false })

  useEffect(() => {
    const consent = localStorage.getItem('hc_cookie_consent')
    if (!consent) setTimeout(() => setShow(true), 1500)
  }, [])

  function acceptAll() {
    localStorage.setItem('hc_cookie_consent', JSON.stringify({ analytics: true, marketing: true, essential: true, date: new Date().toISOString() }))
    setShow(false)
  }

  function rejectAll() {
    localStorage.setItem('hc_cookie_consent', JSON.stringify({ analytics: false, marketing: false, essential: true, date: new Date().toISOString() }))
    setShow(false)
  }

  function savePrefs() {
    localStorage.setItem('hc_cookie_consent', JSON.stringify({ ...prefs, essential: true, date: new Date().toISOString() }))
    setShow(false)
  }

  if (!show) return null

  return (
    <AnimatePresence>
      <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 z-[100] p-4 max-w-lg mx-auto mb-2">
        <div className="rounded-2xl p-5 shadow-2xl" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
          {!showDetails ? (
            <>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${C.primary}20` }}>
                  <Cookie size={16} style={{ color: C.primary }} />
                </div>
                <div>
                  <p className="font-bold text-sm" style={{ color: C.text }}>Usamos cookies</p>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: C.muted }}>
                    Usamos cookies esenciales para el funcionamiento de la app y, con tu
                    permiso, cookies analíticas para mejorar la experiencia. Tus datos de
                    salud <strong style={{ color: C.text }}>nunca se usan para publicidad</strong>.{' '}
                    <Link to="/privacy" className="underline" style={{ color: C.primary }}>
                      Política de privacidad
                    </Link>
                  </p>
                </div>
              </div>

              <div className="flex gap-2 mb-3">
                <button onClick={rejectAll}
                  className="flex-1 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{ background: 'rgba(255,255,255,0.08)', color: C.muted, border: `1px solid ${C.border}` }}>
                  Solo esenciales
                </button>
                <button onClick={acceptAll}
                  className="flex-1 py-2 rounded-xl text-sm font-bold text-white transition-all"
                  style={{ background: C.primary }}>
                  Aceptar todas
                </button>
              </div>

              <button onClick={() => setShowDetails(true)}
                className="flex items-center gap-1 text-xs mx-auto block"
                style={{ color: C.muted }}>
                <Settings size={11} /> Personalizar preferencias
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="font-bold text-sm" style={{ color: C.text }}>Preferencias de cookies</p>
                <button onClick={() => setShowDetails(false)} style={{ color: C.muted }}>
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3 mb-4">
                {[
                  { key: 'essential', label: 'Esenciales', desc: 'Necesarias para el funcionamiento. No se pueden desactivar.', forced: true },
                  { key: 'analytics', label: 'Analíticas', desc: 'Nos ayudan a entender cómo se usa la app para mejorarla.', forced: false },
                  { key: 'marketing', label: 'Marketing', desc: 'Para mostrarte publicidad relevante en otras plataformas.', forced: false },
                ].map(({ key, label, desc, forced }) => (
                  <div key={key} className="flex items-start gap-3 py-2"
                    style={{ borderBottom: `1px solid ${C.border}` }}>
                    <div className="flex-1">
                      <p className="text-sm font-medium" style={{ color: C.text }}>{label}</p>
                      <p className="text-xs mt-0.5" style={{ color: C.muted }}>{desc}</p>
                    </div>
                    <button
                      disabled={forced}
                      onClick={() => !forced && setPrefs(p => ({ ...p, [key]: !p[key] }))}
                      className="w-11 h-6 rounded-full transition-all relative flex-shrink-0 mt-1"
                      style={{
                        background: (forced || prefs[key]) ? C.primary : 'rgba(255,255,255,0.15)',
                        opacity: forced ? 0.5 : 1,
                        cursor: forced ? 'not-allowed' : 'pointer',
                      }}>
                      <motion.div
                        animate={{ x: (forced || prefs[key]) ? 22 : 2 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
                      />
                    </button>
                  </div>
                ))}
              </div>

              <button onClick={savePrefs} className="w-full py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: C.primary }}>
                Guardar preferencias
              </button>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
