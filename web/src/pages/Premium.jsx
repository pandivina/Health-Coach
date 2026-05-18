import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Sparkles, Lock } from 'lucide-react'
import { useTheme } from '../contexts/ThemeProvider'

const FREE_FEATURES = ['Diario nutricional manual','Coach IA (10 mensajes/día)','Registro de entrenamiento','Seguimiento sueño y ánimo','Hidratación diaria','Mascota básica (Panda)','Informe diario básico']
const PREMIUM_FEATURES = [
  { label: 'Coach IA ilimitado con contexto clínico', hot: true },
  { label: 'Análisis de foto de comida con IA', hot: true },
  { label: 'Escáner de código de barras', hot: false },
  { label: 'Generación de recetas personalizadas', hot: true },
  { label: 'Interpretación de analíticas con IA', hot: true },
  { label: 'Seguimiento de peso y medidas avanzado', hot: false },
  { label: 'Tendencias y gráficas semanales', hot: false },
  { label: 'Todas las mascotas desbloqueadas', hot: false },
  { label: 'Sin límites en ningún módulo', hot: false },
]
const PLANS = [
  { id: 'monthly', label: 'Mensual', price: '9,99€', period: '/mes', popular: false },
  { id: 'annual',  label: 'Anual',   price: '4,99€', period: '/mes', total: '59,99€/año', popular: true, saving: 'Ahorra 60%' },
]

export default function Premium() {
  const { theme } = useTheme()
  const [selectedPlan, setSelectedPlan] = useState('annual')

  return (
    <div className="page">
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
          <motion.button key={plan.id} whileTap={{ scale: 0.97 }} onClick={() => setSelectedPlan(plan.id)}
            className="flex-1 p-4 rounded-2xl border transition-all relative"
            style={{
              borderColor: selectedPlan === plan.id ? theme.primary : theme.border,
              background: selectedPlan === plan.id ? `${theme.primary}10` : theme.surface,
            }}>
            {plan.popular && (
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-white text-[10px] font-bold px-3 py-0.5 rounded-full"
                style={{ background: theme.gradientBrand }}>MÁS POPULAR</span>
            )}
            <p className="font-semibold text-sm" style={{ color: theme.text }}>{plan.label}</p>
            <p className="text-2xl font-extrabold mt-1" style={{ color: theme.text }}>{plan.price}</p>
            <p className="text-xs" style={{ color: theme.textMuted }}>{plan.period}</p>
            {plan.total && <p className="text-[10px] mt-1" style={{ color: theme.textMuted }}>{plan.total}</p>}
            {plan.saving && (
              <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: `${theme.success}20`, color: theme.success }}>{plan.saving}</span>
            )}
          </motion.button>
        ))}
      </div>

      <motion.button whileTap={{ scale: 0.97 }} className="btn-primary text-base font-bold py-4 flex items-center justify-center gap-2 mb-3"
        onClick={() => alert('Stripe integration próximamente 🚀')}>
        <Sparkles size={18} /> Empezar Premium
      </motion.button>

      <p className="text-center text-xs mb-6" style={{ color: theme.textMuted }}>
        7 días de prueba gratuita · Cancela cuando quieras
      </p>

      {/* Features */}
      <div className="space-y-4">
        <div className="card">
          <p className="font-semibold mb-3 flex items-center gap-2" style={{ color: theme.text }}>
            <Sparkles size={15} style={{ color: theme.warning }} /> Incluido en Premium
          </p>
          <div className="space-y-2.5">
            {PREMIUM_FEATURES.map(f => (
              <div key={f.label} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: f.hot ? theme.gradientBrand : `${theme.success}20` }}>
                  <Check size={11} color="#fff" />
                </div>
                <p className="text-sm" style={{ color: theme.text }}>{f.label}</p>
                {f.hot && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-auto flex-shrink-0"
                  style={{ background: `${theme.warning}20`, color: theme.warning }}>HOT</span>}
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
      </div>
    </div>
  )
}
