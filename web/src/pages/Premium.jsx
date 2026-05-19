import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Check, Sparkles, Crown, ExternalLink } from 'lucide-react'
import { useTheme } from '../contexts/ThemeProvider'
import { useStore } from '../store/useStore'
import { api } from '../lib/api'
import { useSearchParams } from 'react-router-dom'

const FREE_FEATURES = [
  'Diario nutricional manual',
  'Coach IA (10 mensajes/día)',
  'Registro de entrenamiento',
  'Sueño, ánimo e hidratación',
  'Mascota Panda',
  'Informe diario básico',
]

const PREMIUM_FEATURES = [
  { label: 'Coach IA ilimitado con contexto clínico', hot: true },
  { label: 'Análisis de foto de comida con IA', hot: true },
  { label: 'Escáner de código de barras', hot: false },
  { label: 'Generación de recetas personalizadas', hot: true },
  { label: 'Interpretación de analíticas con IA', hot: true },
  { label: 'Seguimiento de peso y medidas avanzado', hot: false },
  { label: 'Todas las mascotas desbloqueadas', hot: false },
  { label: 'Sin límites en ningún módulo', hot: false },
]

const PLANS = [
  {
    id: 'monthly',
    label: 'Mensual',
    price: '9,99€',
    period: '/mes',
    priceId: import.meta.env.VITE_STRIPE_PRICE_MONTHLY || 'price_1TYqG7J0FKiKYIwTx9jSUdC3',
    popular: false,
  },
  {
    id: 'annual',
    label: 'Anual',
    price: '4,99€',
    period: '/mes',
    total: '59,99€/año',
    priceId: import.meta.env.VITE_STRIPE_PRICE_ANNUAL || 'price_1TYqGLJ0FKiKYIwTptAk15NH',
    popular: true,
    saving: 'Ahorra 50%',
  },
]

export default function Premium() {
  const { theme } = useTheme()
  const { profile } = useStore()
  const [selectedPlan, setSelectedPlan] = useState('annual')
  const [loading, setLoading] = useState(false)
  const [subStatus, setSubStatus] = useState(null)
  const [searchParams] = useSearchParams()

  const isPremium = profile?.is_premium || ['active', 'trialing'].includes(subStatus?.status)

  useEffect(() => {
    api.stripe.getStatus().then(setSubStatus).catch(() => {})
  }, [])

  async function handleCheckout() {
    setLoading(true)
    try {
      const plan = PLANS.find(p => p.id === selectedPlan)
      const { url } = await api.stripe.createCheckout(plan.priceId)
      window.location.href = url
    } catch (err) {
      alert('Error al procesar el pago: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handlePortal() {
    setLoading(true)
    try {
      const { url } = await api.stripe.portal()
      window.location.href = url
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Mostrar mensaje de éxito/cancelación
  const success = searchParams.get('success')
  const canceled = searchParams.get('canceled')

  if (isPremium) {
    return (
      <div className="page text-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="text-5xl mb-4">⭐</div>
          <h1 className="text-2xl font-extrabold mb-2" style={{ color: theme.text }}>Eres Premium</h1>
          <p className="text-sm mb-6" style={{ color: theme.textMuted }}>
            Tienes acceso completo a todas las funcionalidades.
          </p>

          {subStatus?.trial_end && new Date(subStatus.trial_end) > new Date() && (
            <div className="card mb-5" style={{ background: `${theme.primary}10`, border: `1px solid ${theme.primary}20` }}>
              <p className="font-semibold text-sm" style={{ color: theme.text }}>🎉 Período de prueba activo</p>
              <p className="text-xs mt-1" style={{ color: theme.textMuted }}>
                Tu prueba gratuita termina el {new Date(subStatus.trial_end).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
              </p>
            </div>
          )}

          <div className="card text-left mb-5">
            <p className="font-semibold mb-3" style={{ color: theme.text }}>Tu plan incluye</p>
            <div className="space-y-2">
              {PREMIUM_FEATURES.map(f => (
                <div key={f.label} className="flex items-center gap-2">
                  <Check size={14} style={{ color: theme.success, flexShrink: 0 }} />
                  <p className="text-sm" style={{ color: theme.text }}>{f.label}</p>
                </div>
              ))}
            </div>
          </div>

          <button onClick={handlePortal} disabled={loading}
            className="btn-secondary flex items-center justify-center gap-2">
            <ExternalLink size={14} /> Gestionar suscripción
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="page">
      {/* Mensaje de éxito */}
      {success && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="card mb-5" style={{ background: `${theme.success}15`, border: `1px solid ${theme.success}30` }}>
          <p className="font-bold text-sm" style={{ color: theme.success }}>🎉 ¡Bienvenido a Premium!</p>
          <p className="text-xs mt-1" style={{ color: theme.textMuted }}>Tu suscripción está activa. Disfruta de todas las funcionalidades.</p>
        </motion.div>
      )}

      {canceled && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="card mb-5" style={{ background: `${theme.warning}15`, border: `1px solid ${theme.warning}30` }}>
          <p className="font-bold text-sm" style={{ color: theme.warning }}>Pago cancelado</p>
          <p className="text-xs mt-1" style={{ color: theme.textMuted }}>No se ha realizado ningún cargo. Puedes intentarlo de nuevo cuando quieras.</p>
        </motion.div>
      )}

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
        <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-3"
          style={{ background: theme.gradientBrand }}>
          <Sparkles size={28} color="#fff" />
        </div>
        <h1 className="text-2xl font-extrabold" style={{ color: theme.text }}>Health Coach Premium</h1>
        <p className="text-sm mt-1" style={{ color: theme.textMuted }}>Desbloquea todo el potencial de tu salud</p>
      </motion.div>

      {/* Plans */}
      <div className="flex gap-3 mb-6">
        {PLANS.map(plan => (
          <motion.button key={plan.id} whileTap={{ scale: 0.97 }}
            onClick={() => setSelectedPlan(plan.id)}
            className="flex-1 p-4 rounded-2xl border transition-all relative"
            style={{
              borderColor: selectedPlan === plan.id ? theme.primary : theme.border,
              background: selectedPlan === plan.id ? `${theme.primary}10` : theme.surface,
            }}>
            {plan.popular && (
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-white text-[10px] font-bold px-3 py-0.5 rounded-full"
                style={{ background: theme.gradientBrand }}>
                MÁS POPULAR
              </span>
            )}
            <p className="font-semibold text-sm" style={{ color: theme.text }}>{plan.label}</p>
            <p className="text-2xl font-extrabold mt-1" style={{ color: theme.text }}>{plan.price}</p>
            <p className="text-xs" style={{ color: theme.textMuted }}>{plan.period}</p>
            {plan.total && <p className="text-[10px] mt-0.5" style={{ color: theme.textMuted }}>{plan.total}</p>}
            {plan.saving && (
              <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: `${theme.success}20`, color: theme.success }}>
                {plan.saving}
              </span>
            )}
          </motion.button>
        ))}
      </div>

      {/* CTA */}
      <motion.button whileTap={{ scale: 0.97 }} onClick={handleCheckout} disabled={loading}
        className="btn-primary text-base font-bold py-4 flex items-center justify-center gap-2 mb-3">
        {loading
          ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Redirigiendo…</>
          : <><Sparkles size={18} /> Empezar 7 días gratis</>
        }
      </motion.button>

      <p className="text-center text-xs mb-6" style={{ color: theme.textMuted }}>
        Sin tarjeta durante la prueba · Cancela cuando quieras · Pago seguro con Stripe
      </p>

      {/* Features */}
      <div className="space-y-4">
        <div className="card">
          <p className="font-semibold mb-3 flex items-center gap-2" style={{ color: theme.text }}>
            <Crown size={15} style={{ color: theme.warning }} /> Incluido en Premium
          </p>
          <div className="space-y-2.5">
            {PREMIUM_FEATURES.map(f => (
              <div key={f.label} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: f.hot ? theme.gradientBrand : `${theme.success}20` }}>
                  <Check size={11} color="#fff" />
                </div>
                <p className="text-sm" style={{ color: theme.text }}>{f.label}</p>
                {f.hot && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-auto flex-shrink-0"
                    style={{ background: `${theme.warning}20`, color: theme.warning }}>HOT</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <p className="font-semibold mb-3" style={{ color: theme.textMuted }}>Plan gratuito incluye</p>
          <div className="space-y-2">
            {FREE_FEATURES.map(f => (
              <div key={f} className="flex items-center gap-3">
                <Check size={14} style={{ color: theme.textLight }} />
                <p className="text-sm" style={{ color: theme.textMuted }}>{f}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card text-center" style={{ background: `${theme.warning}10`, border: `1px solid ${theme.warning}20` }}>
          <p className="text-2xl mb-2">⭐⭐⭐⭐⭐</p>
          <p className="text-sm font-medium" style={{ color: theme.text }}>"La app más completa que he probado"</p>
          <p className="text-xs mt-1" style={{ color: theme.textMuted }}>— Usuario Premium desde enero</p>
        </div>
      </div>
    </div>
  )
}
