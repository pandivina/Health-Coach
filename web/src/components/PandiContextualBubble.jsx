import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { X } from 'lucide-react'
import { useTheme } from '../contexts/ThemeProvider'
import { useStore } from '../store/useStore'

// ─── MENSAJES POR SECCIÓN Y CONTEXTO ─────────────────────────────────────────

const MESSAGES = {
  nutrition: (data) => {
    const { cals, goal, protein, proteinGoal } = data
    if (!cals) return { text: '¿Qué has comido hoy? Registra tu primera comida 🍎', color: '#F97316' }
    const pct = Math.round((cals / goal) * 100)
    if (pct < 50)  return { text: `Llevas solo el ${pct}% de tus calorías. ¡A comer! 🍳`, color: '#F97316' }
    if (pct > 110) return { text: `Has superado tu objetivo calórico. No pasa nada, mañana más 💪`, color: '#EF4444' }
    if (protein < proteinGoal * 0.7) return { text: `Te falta proteína hoy. Un huevo o pechuga te viene bien 🥚`, color: '#6366F1' }
    return { text: `¡Vas genial con la nutrición hoy! ${pct}% del objetivo 🎯`, color: '#22C55E' }
  },
  workout: (data) => {
    const { hasWorkout, streak } = data
    const hour = new Date().getHours()
    if (hasWorkout) return { text: '¡Entreno completado! Eres una máquina 💪🔥', color: '#22C55E' }
    if (hour < 10)  return { text: 'Buenos días guerrero/a. ¿Toca entrenar hoy? 🏋️', color: '#6366F1' }
    if (hour < 14)  return { text: 'El mejor momento para entrenar es ahora mismo 💪', color: '#6366F1' }
    if (hour < 20)  return { text: '¿Todavía sin entrenar? Aún estás a tiempo 🏃', color: '#F97316' }
    if (streak > 5) return { text: `${streak} días de racha. No lo rompas esta noche 🔥`, color: '#F59E0B' }
    return { text: 'Un entrenamiento corto también cuenta. ¡20 minutos! ⚡', color: '#6366F1' }
  },
  sleep: (data) => {
    const { hours, quality, avg } = data
    if (!hours) return { text: '¿Cómo dormiste anoche? Cuéntamelo 😴', color: '#818CF8' }
    if (hours < 6)  return { text: `Solo ${hours}h de sueño. Tu cuerpo necesita más descanso 🌙`, color: '#EF4444' }
    if (hours >= 7 && quality >= 4) return { text: `¡${hours}h con calidad ${quality}/5! Descansado y listo 🌟`, color: '#22C55E' }
    if (avg && hours < avg) return { text: `Dormiste menos que tu media (${avg}h). Intenta acostarte antes 💤`, color: '#F97316' }
    return { text: `${hours}h de sueño registradas. Sigue así 🌙`, color: '#818CF8' }
  },
  hydration: (data) => {
    const { glasses, goal } = data
    if (!glasses) return { text: '¡Empieza a hidratarte! El primer vaso es el más importante 💧', color: '#3B82F6' }
    const pct = Math.round((glasses / goal) * 100)
    if (pct >= 100) return { text: `¡Meta de agua conseguida! ${glasses} vasos. Perfecto 🎉`, color: '#22C55E' }
    if (pct < 30)   return { text: `Solo ${glasses} vasos. Bebe más agua, tu cuerpo te lo agradecerá 💧`, color: '#EF4444' }
    if (pct < 70)   return { text: `Llevas el ${pct}% de tu meta. ¡Sigue bebiendo! 💧`, color: '#3B82F6' }
    return { text: `Casi en la meta de agua. ${goal - glasses} vasos más 💪`, color: '#60A5FA' }
  },
  health: (data) => {
    const { weight, target, diff } = data
    if (!weight) return { text: '¿Te has pesado esta semana? El seguimiento es clave 📊', color: '#EC4899' }
    if (diff && diff < -0.5) return { text: `Bajaste ${Math.abs(diff)}kg. ¡Vas en la dirección correcta! 📉`, color: '#22C55E' }
    if (diff && diff > 0.5)  return { text: `Subiste ${diff}kg. Revisa la nutrición esta semana 📈`, color: '#F97316' }
    if (target && weight > target) return { text: `Te quedan ${(weight - target).toFixed(1)}kg para tu objetivo. Paso a paso 🎯`, color: '#EC4899' }
    return { text: `Peso registrado: ${weight}kg. Sigue con el seguimiento 💪`, color: '#EC4899' }
  },
  report: (data) => {
    const { done, total } = data
    if (done === 0) return { text: 'Empieza a registrar datos para ver tu informe personalizado 📊', color: '#F59E0B' }
    if (done === total) return { text: '¡Todo registrado hoy! Tu informe está completo 🌟', color: '#22C55E' }
    return { text: `${done}/${total} módulos completados hoy. ¡Casi! 📊`, color: '#F59E0B' }
  },
}

// ─── COMPONENTE ──────────────────────────────────────────────────────────────

export default function PandiContextualBubble({ section, data = {}, dismissKey }) {
  const { theme }    = useTheme()
  const { profile }  = useStore()
  const [visible,    setVisible]    = useState(false)
  const [imgErr,     setImgErr]     = useState(false)
  const [dismissed,  setDismissed]  = useState(false)

  const petName = profile?.pet_name || 'Pandi'

  useEffect(() => {
    // Comprobar si ya fue dismissado hoy
    const key = dismissKey || `pandi_bubble_${section}_${new Date().toISOString().split('T')[0]}`
    if (localStorage.getItem(key)) { setDismissed(true); return }
    // Mostrar con pequeño delay
    const t = setTimeout(() => setVisible(true), 800)
    return () => clearTimeout(t)
  }, [section, dismissKey])

  function dismiss() {
    const key = dismissKey || `pandi_bubble_${section}_${new Date().toISOString().split('T')[0]}`
    localStorage.setItem(key, '1')
    setDismissed(true)
    setVisible(false)
  }

  if (dismissed) return null

  const msgFn  = MESSAGES[section]
  if (!msgFn)  return null
  const msg    = msgFn(data)

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0,  scale: 1     }}
          exit={{   opacity: 0, y: -8,  scale: 0.95  }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="flex items-end gap-3 mb-4">

          {/* Imagen Pandi */}
          <Link to="/pet" className="flex-shrink-0">
            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}>
              {imgErr ? (
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                  style={{ background: theme.surface2 }}>🐼</div>
              ) : (
                <img src="/panda/talk_1.png" alt={petName}
                  onError={() => setImgErr(true)}
                  style={{ width: 48, height: 48, objectFit: 'contain' }} />
              )}
            </motion.div>
          </Link>

          {/* Bocadillo */}
          <div className="flex-1 relative">
            {/* Cola */}
            <div style={{
              position: 'absolute', left: -7, bottom: 10,
              width: 0, height: 0,
              borderTop: '7px solid transparent',
              borderBottom: '7px solid transparent',
              borderRight: `7px solid ${theme.surface}`,
            }} />
            <div className="rounded-2xl rounded-bl-sm px-3 py-2.5 flex items-start justify-between gap-2"
              style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold mb-0.5" style={{ color: msg.color }}>
                  {petName}
                </p>
                <p className="text-xs leading-relaxed" style={{ color: theme.text }}>
                  {msg.text}
                </p>
              </div>
              <button onClick={dismiss} className="flex-shrink-0 mt-0.5">
                <X size={11} style={{ color: theme.textLight }} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
