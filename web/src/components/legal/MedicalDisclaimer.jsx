import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, X, ChevronDown } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeProvider'

// Versión compacta — para usar en Coach, Onboarding, HealthTracking
export function MedicalDisclaimerBanner({ onAccept }) {
  const { theme } = useTheme()
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-4 mb-4 relative"
      style={{ background: `${theme.warning}10`, border: `1px solid ${theme.warning}30` }}>
      <button onClick={() => { setDismissed(true); onAccept?.() }}
        className="absolute top-3 right-3 opacity-50 hover:opacity-100 transition-all"
        style={{ color: theme.text }}>
        <X size={14} />
      </button>
      <div className="flex items-start gap-3">
        <Shield size={16} style={{ color: theme.warning, flexShrink: 0, marginTop: 2 }} />
        <div>
          <p className="font-semibold text-sm mb-1" style={{ color: theme.text }}>Aviso importante</p>
          <p className="text-xs leading-relaxed" style={{ color: theme.textMuted }}>
            Health Coach es una herramienta de apoyo al bienestar personal.
            La información generada por la IA es <strong style={{ color: theme.text }}>orientativa y no sustituye
            el consejo, diagnóstico ni tratamiento de un profesional de la salud.</strong>{' '}
            Consulta siempre a tu médico antes de realizar cambios significativos en tu dieta,
            ejercicio o medicación.
          </p>
        </div>
      </div>
    </motion.div>
  )
}

// Versión modal — para primera vez en Coach
export function MedicalDisclaimerModal({ onAccept }) {
  const { theme } = useTheme()
  const [open, setOpen] = useState(() => {
    return !localStorage.getItem('hc_disclaimer_accepted')
  })

  if (!open) return null

  function accept() {
    localStorage.setItem('hc_disclaimer_accepted', '1')
    setOpen(false)
    onAccept?.()
  }

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>
        <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className="w-full max-w-sm rounded-3xl p-6"
          style={{ background: theme.bg, border: `1px solid ${theme.border}` }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: `${theme.warning}20` }}>
              <Shield size={20} style={{ color: theme.warning }} />
            </div>
            <div>
              <p className="font-bold" style={{ color: theme.text }}>Aviso médico</p>
              <p className="text-xs" style={{ color: theme.textMuted }}>Léelo antes de continuar</p>
            </div>
          </div>

          <p className="text-sm leading-relaxed mb-4" style={{ color: theme.textMuted }}>
            Health Coach y su Coach IA proporcionan información general sobre nutrición,
            entrenamiento y bienestar. Esta información es <strong style={{ color: theme.text }}>
            puramente orientativa</strong> y en ningún caso sustituye a:
          </p>

          <ul className="space-y-2 mb-5">
            {[
              'El diagnóstico o tratamiento médico',
              'El consejo de un nutricionista o dietista',
              'Las indicaciones de tu médico sobre medicación',
              'La atención sanitaria profesional',
            ].map(item => (
              <li key={item} className="flex items-center gap-2 text-sm" style={{ color: theme.text }}>
                <span style={{ color: theme.warning }}>⚠️</span> {item}
              </li>
            ))}
          </ul>

          <p className="text-xs leading-relaxed mb-5" style={{ color: theme.textMuted }}>
            Al continuar, confirmas que entiendes que Health Coach es una herramienta de apoyo
            personal y no un servicio médico profesional.
          </p>

          <button onClick={accept} className="btn-primary">
            Entendido, continuar
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Texto corto para incluir inline (pie de página, formularios)
export function MedicalDisclaimerText() {
  const { theme } = useTheme()
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="mt-4 p-3 rounded-xl" style={{ background: `${theme.surface2}`, border: `1px solid ${theme.border}` }}>
      <button className="flex items-center gap-2 w-full text-left"
        onClick={() => setExpanded(e => !e)}>
        <Shield size={13} style={{ color: theme.textMuted }} />
        <p className="text-xs font-medium flex-1" style={{ color: theme.textMuted }}>
          Aviso médico y legal
        </p>
        <motion.div animate={{ rotate: expanded ? 180 : 0 }}>
          <ChevronDown size={12} style={{ color: theme.textMuted }} />
        </motion.div>
      </button>
      {expanded && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-xs mt-2 leading-relaxed" style={{ color: theme.textLight }}>
          La información proporcionada por Health Coach tiene carácter informativo y orientativo.
          No constituye consejo, diagnóstico ni tratamiento médico. Consulta siempre con un
          profesional sanitario colegiado antes de tomar decisiones sobre tu salud, dieta,
          ejercicio o medicación. Health Coach no se responsabiliza del uso que el usuario
          haga de la información proporcionada.
        </motion.p>
      )}
    </div>
  )
}
