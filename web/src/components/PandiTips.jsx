import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Lightbulb } from 'lucide-react'
import { useTheme } from '../contexts/ThemeProvider'
import { useStore } from '../store/useStore'

// ─── TIPS POR SECCIÓN ────────────────────────────────────────────────────────

const TIPS = {
  home: [
    '¿Sabías que beber agua nada más levantarte activa tu metabolismo un 30%? 💧',
    'La exposición a luz natural por la mañana regula tu ritmo circadiano y mejora el sueño nocturno ☀️',
    'Las personas que registran lo que comen pierden el doble de peso que las que no lo hacen 📊',
    'Un paseo de 10 minutos después de comer reduce el azúcar en sangre un 22% 🚶',
    'Dormir menos de 7 horas aumenta el apetito hasta un 24% al día siguiente 🌙',
    'La música con más de 120 BPM aumenta el rendimiento en el entrenamiento hasta un 15% 🎵',
  ],
  nutrition: [
    'La proteína tiene el mayor efecto saciante de todos los macronutrientes. Priorízala en el desayuno 🥚',
    'Masticar despacio reduce la ingesta calórica hasta un 10%. El cerebro tarda 20 min en registrar saciedad 🧠',
    'Los alimentos ultraprocesados se digieren tan rápido que el cerebro no los registra igual que la comida real 🚫',
    'La vitamina C en las comidas multiplica la absorción de hierro de origen vegetal ×3 🍊',
    'Comer en platos más pequeños reduce la ingesta calórica un 30% sin sentir hambre 🍽️',
    'El ayuno de 12 horas entre cena y desayuno mejora la sensibilidad a la insulina 🌙',
    'Las legumbres combinadas con arroz forman una proteína completa equivalente a la animal 🫘',
  ],
  workout: [
    'El músculo se construye durante el descanso, no durante el entrenamiento 💤',
    'El calentamiento reduce el riesgo de lesión un 54%. Nunca lo saltes 🔥',
    'La progresión de carga es el factor más importante para ganar músculo. Sube peso gradualmente 📈',
    'Entrenar en ayunas puede quemar más grasa, pero reduce el rendimiento hasta un 20% ⚡',
    'Los ejercicios compuestos (sentadilla, peso muerto, press) activan más del 70% de la musculatura 💪',
    'El descanso entre series importa: 60-90s para resistencia, 2-3min para fuerza máxima ⏱️',
    'La hidratación afecta directamente al rendimiento. Con solo 2% de deshidratación baja un 10% 💧',
  ],
  sleep: [
    'La temperatura ideal para dormir es entre 16-18°C. El frío favorece el sueño profundo ❄️',
    'La luz azul del móvil bloquea la melatonina hasta 3 horas. Activa el modo nocturno al anochecer 📱',
    'Un ritual nocturno consistente (misma hora, mismas actividades) mejora la calidad del sueño un 40% 🌙',
    'La cafeína tiene una vida media de 5-6 horas. Evítala después de las 14:00 ☕',
    'El sueño REM consolida los recuerdos y regula las emociones. Se concentra en la última mitad de la noche 🧠',
    'Ejercicio regular aumenta el sueño profundo hasta un 65%. Pero evítalo 2h antes de dormir 🏋️',
  ],
  hydration: [
    'Cuando sientes sed, ya llevas un 1-2% de deshidratación. Bebe antes de tener sed 💧',
    'El agua fría quema ligeramente más calorías porque el cuerpo la calienta hasta temperatura corporal 🧊',
    'El café y el té también hidratan — el efecto diurético es menor que el agua que aportan ☕',
    'La hidratación mejora la concentración hasta un 14% y reduce la fatiga mental 🧠',
    'Los alimentos sólidos aportan el 20% de tu hidratación diaria. Las frutas y verduras son clave 🥒',
    'Beber agua antes de las comidas reduce la ingesta calórica hasta un 13% 🍽️',
  ],
  mood: [
    '10 minutos de meditación diaria reducen el cortisol (hormona del estrés) hasta un 14% 🧘',
    'El ejercicio es el antidepresivo natural más potente. Libera serotonina, dopamina y endorfinas 🏃',
    'Escribir 3 cosas por las que estás agradecido cada día remodela el cerebro hacia el optimismo 📝',
    'Las conexiones sociales son el predictor más fuerte de bienestar y longevidad 👥',
    'El intestino produce el 90% de la serotonina de tu cuerpo. Lo que comes afecta tu estado de ánimo 🥗',
    'La respiración lenta (4-7-8) activa el sistema nervioso parasimpático en menos de 60 segundos 🫁',
  ],
  health: [
    'El peso fluctúa hasta 2kg a lo largo del día. Pésate siempre a la misma hora, en ayunas 📊',
    'La grasa visceral (alrededor de los órganos) es la más peligrosa. Se reduce primero con ejercicio 🏃',
    'El músculo pesa más que la grasa. La báscula no es el único indicador de progreso 💪',
    'La circunferencia de cintura es mejor predictor de salud cardiovascular que el IMC 📏',
    'El colesterol LDL sube con grasas saturadas pero el HDL (bueno) sube con ejercicio y omega-3 🫀',
    'La vitamina D regula más de 200 genes. La mayoría de personas en España tienen déficit en invierno ☀️',
  ],
}

// ─── COMPONENTE ──────────────────────────────────────────────────────────────

export default function PandiTips({ section }) {
  const { theme }   = useTheme()
  const { profile } = useStore()
  const [tip,       setTip]       = useState(null)
  const [visible,   setVisible]   = useState(false)
  const [imgErr,    setImgErr]    = useState(false)

  const petName = profile?.pet_name || 'Pandi'

  useEffect(() => {
    const sectionTips = TIPS[section]
    if (!sectionTips) return

    // Seleccionar tip del día para esta sección (cambia cada día)
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000)
    const tipIndex  = (dayOfYear + section.length) % sectionTips.length
    setTip(sectionTips[tipIndex])

    // Mostrar solo si no fue dismissado hoy
    const key = `pandi_tip_${section}_${new Date().toISOString().split('T')[0]}`
    if (localStorage.getItem(key)) return

    // Aparecer con delay para no ser intrusivo
    const t = setTimeout(() => setVisible(true), 2000)
    return () => clearTimeout(t)
  }, [section])

  function dismiss() {
    const key = `pandi_tip_${section}_${new Date().toISOString().split('T')[0]}`
    localStorage.setItem(key, '1')
    setVisible(false)
  }

  if (!tip) return null

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0,  scale: 1     }}
          exit={{   opacity: 0, y: 20,  scale: 0.95  }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-24 left-4 right-4 z-40 max-w-lg mx-auto">
          <div className="rounded-2xl p-3 flex items-start gap-3 shadow-xl"
            style={{
              background: theme.bg,
              border: `1px solid ${theme.border}`,
              boxShadow: `0 8px 32px rgba(0,0,0,0.12)`,
            }}>

            {/* Pandi imagen */}
            <motion.div
              animate={{ rotate: [0, -5, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="flex-shrink-0">
              {imgErr ? (
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: `${theme.primary}15` }}>🐼</div>
              ) : (
                <img src="/panda/talk_1.png" alt={petName}
                  onError={() => setImgErr(true)}
                  style={{ width: 40, height: 40, objectFit: 'contain' }} />
              )}
            </motion.div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <Lightbulb size={11} style={{ color: theme.primary, flexShrink: 0 }} />
                <p className="text-[10px] font-bold" style={{ color: theme.primary }}>
                  Tip de {petName}
                </p>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: theme.text }}>
                {tip}
              </p>
            </div>

            <button onClick={dismiss} className="flex-shrink-0 mt-0.5">
              <X size={13} style={{ color: theme.textMuted }} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
