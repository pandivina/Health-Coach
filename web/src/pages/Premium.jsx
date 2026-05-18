import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, X, Sparkles, Lock } from 'lucide-react'
import { useStore } from '../store/useStore'

const FREE_FEATURES = [
  'Diario nutricional manual',
  'Coach IA (10 mensajes/día)',
  'Registro de entrenamiento',
  'Seguimiento de sueño y ánimo',
  'Hidratación diaria',
  'Mascota básica (Panda)',
  'Informe diario básico',
  'Objetivos nutricionales',
]

const PREMIUM_FEATURES = [
  { label: 'Coach IA ilimitado con contexto clínico', hot: true },
  { label: 'Análisis de foto de comida con IA', hot: true },
  { label: 'Escáner de código de barras', hot: false },
  { label: 'Generación de recetas personalizadas', hot: true },
  { label: 'Interpretación de analíticas con IA', hot: true },
  { label: 'Seguimiento de peso y medidas avanzado', hot: false },
  { label: 'Tendencias y gráficas semanales', hot: false },
  { label: 'Todas las mascotas desbloqueadas', hot: false },
  { label: 'Programa anti-tabaco completo', hot: false },
  { label: 'Exportar datos y reportes PDF', hot: false },
  { label: 'Sin límites en ningún módulo', hot: false },
]

const PLANS = [
  {
    id: 'monthly',
    label: 'Mensual',
    price: '9,99€',
    period: '/mes',
    stripe_price_id: 'price_monthly',
    popular: false,
  },
  {
    id: 'annual',
    label: 'Anual',
    price: '4,99€',
    period: '/mes',
    total: '59,99€/año',
    stripe_price_id: 'price_annual',
    popular: true,
    saving: 'Ahorra 60%',
  },
]

export default function Premium() {
  const { profile } = useStore()
  const [selectedPlan, setSelectedPlan] = useState('annual')
  const isPremium = false // TODO: conectar con subscriptions table

  if (isPremium) {
    return (
      <div className="page text-center">
        <div className="text-6xl mb-4">⭐</div>
        <h1 className="text-2xl font-bold mb-2">Eres Premium</h1>
        <p className="text-white/50">Tienes acceso a todas las funcionalidades de Health Coach.</p>
        <div className="card mt-6 text-left">
          <p className="font-semibold mb-3">Tu plan incluye</p>
          <div className="space-y-2">
            {PREMIUM_FEATURES.map(f => (
              <div key={f.label} className="flex items-center gap-2">
                <Check size={14} className="text-accent-green flex-shrink-0" />
                <p className="text-sm text-white/70">{f.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-brand mx-auto flex items-center justify-center mb-3">
          <Sparkles size={28} className="text-white" />
        </div>
        <h1 className="text-2xl font-extrabold">Health Coach Premium</h1>
        <p className="text-white/50 text-sm mt-1">Desbloquea todo el potencial de tu salud</p>
      </motion.div>

      {/* Plans */}
      <div className="flex gap-3 mb-6">
        {PLANS.map(plan => (
          <motion.button key={plan.id} whileTap={{ scale: 0.97 }}
            onClick={() => setSelectedPlan(plan.id)}
            className={`flex-1 p-4 rounded-2xl border transition-all relative ${
              selectedPlan === plan.id
                ? 'border-accent bg-accent/10'
                : 'border-white/10 bg-surface-2'
            }`}>
            {plan.popular && (
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gradient-brand text-white text-[10px] font-bold px-3 py-0.5 rounded-full">
                MÁS POPULAR
              </span>
            )}
            <p className="font-semibold text-sm">{plan.label}</p>
            <p className="text-2xl font-extrabold mt-1">{plan.price}</p>
            <p className="text-white/40 text-xs">{plan.period}</p>
            {plan.total && <p className="text-white/30 text-[10px] mt-1">{plan.total}</p>}
            {plan.saving && (
              <span className="inline-block mt-1 bg-accent-green/20 text-accent-green text-[10px] font-bold px-2 py-0.5 rounded-full">
                {plan.saving}
              </span>
            )}
          </motion.button>
        ))}
      </div>

      {/* CTA */}
      <motion.button whileTap={{ scale: 0.97 }}
        className="btn-primary flex items-center justify-center gap-2 mb-6 text-base font-bold py-4"
        onClick={() => alert('Stripe integration próximamente 🚀')}>
        <Sparkles size={18} /> Empezar Premium
      </motion.button>

      <p className="text-center text-white/30 text-xs mb-6">
        7 días de prueba gratuita · Cancela cuando quieras · Sin permanencia
      </p>

      {/* Feature comparison */}
      <div className="space-y-4">
        <div className="card">
          <p className="font-semibold mb-3 flex items-center gap-2">
            <Sparkles size={15} className="text-yellow-400" /> Incluido en Premium
          </p>
          <div className="space-y-2.5">
            {PREMIUM_FEATURES.map(f => (
              <div key={f.label} className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${f.hot ? 'bg-gradient-brand' : 'bg-accent-green/20'}`}>
                  <Check size={11} className="text-white" />
                </div>
                <p className="text-sm text-white/80">{f.label}</p>
                {f.hot && <span className="text-[9px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded-full ml-auto flex-shrink-0">HOT</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <p className="font-semibold mb-3 text-white/50">Plan gratuito incluye</p>
          <div className="space-y-2">
            {FREE_FEATURES.map(f => (
              <div key={f} className="flex items-center gap-3">
                <Check size={14} className="text-white/30 flex-shrink-0" />
                <p className="text-sm text-white/40">{f}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Social proof */}
      <div className="card mt-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/5 border-yellow-500/15 text-center">
        <p className="text-2xl mb-2">⭐⭐⭐⭐⭐</p>
        <p className="text-sm font-medium">"La app más completa que he probado"</p>
        <p className="text-white/30 text-xs mt-1">— Usuario Premium desde enero</p>
      </div>
    </div>
  )
}
