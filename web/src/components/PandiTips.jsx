import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../contexts/ThemeProvider'
import { useStore } from '../store/useStore'

const TIPS = {
  home: [
    "Beber agua en ayunas despierta tu metabolismo. 💧",
    "Un paseo corto después de comer mejora tu digestión notablemente. 🚶",
    "Reducir pantallas 30 min antes de dormir mejora la calidad del sueño. 😴",
    "La constancia supera a la intensidad. Pequeños pasos cada día. 🐾",
    "Tu racha es tu mejor activo. Un día a la vez. 🔥",
  ],
  nutrition: [
    "La proteína en el desayuno reduce el hambre el resto del día. 🥚",
    "Mastica despacio — tu cerebro tarda 20 min en registrar la saciedad. 🧠",
    "El color en el plato indica variedad de nutrientes. 🥦",
    "Hidratarte bien antes de comer evita confundir hambre con sed. 💧",
  ],
  workout: [
    "El calentamiento reduce el riesgo de lesión hasta un 40%. 🔥",
    "Descansar bien es parte del entrenamiento, no lo opuesto. 😴",
    "La progresión gradual es más efectiva que el esfuerzo máximo constante. 📈",
    "Escucha a tu cuerpo — el dolor y la fatiga son señales, no debilidad. 🐾",
  ],
  sleep: [
    "Dormir menos de 7h reduce la síntesis de proteínas musculares. 💪",
    "La temperatura ideal para dormir es entre 16-19°C. 🌡️",
    "Evita cafeína después de las 14h — su efecto dura 6-8 horas. ☕",
    "La luz azul suprime la melatonina. Modo nocturno al anochecer. 📱",
  ],
  mood: [
    "3 respiraciones profundas activan el nervio vago y reducen el estrés. 🌬️",
    "Escribir lo que agradeces cambia tu perspectiva en minutos. 📝",
    "El movimiento genera dopamina — aunque sean 10 minutos. 🚶",
    "Hablar de cómo te sientes reduce la activación de la amígdala. 🧠",
  ],
  hydration: [
    "La orina clara o amarillo pálido indica buena hidratación. 💧",
    "Pierdes hasta 500ml de agua mientras duermes. Bebe al despertar. 🌅",
    "El café y el té cuentan para tu hidratación diaria. ☕",
  ],
  health: [
    "El peso varía hasta 2kg en un día por agua y digestión. No te obsesiones. ⚖️",
    "Medir en el mismo momento del día da datos más fiables. 📊",
    "Los cambios reales de composición corporal se ven en semanas, no días. 🗓️",
  ],
}

export default function PandiTips({ section, variant = 'inline' }) {
  const { theme }  = useTheme()
  const { profile } = useStore()

  const [tip,      setTip]      = useState(null)
  const [visible,  setVisible]  = useState(false)
  const [active,   setActive]   = useState(false) // true cuando el usuario clica
  const [imgErr,   setImgErr]   = useState(false)
  const [tipImgErr,setTipImgErr]= useState(false)

  const petName = profile?.pet_name || 'Pandi'

  useEffect(() => {
    const sectionTips = TIPS[section]
    if (!sectionTips) return

    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000)
    const tipIndex  = (dayOfYear + section.length) % sectionTips.length
    setTip(sectionTips[tipIndex])

    const key = `pandi_tip_${section}_${new Date().toISOString().split('T')[0]}`
    if (localStorage.getItem(key)) return

    const t = setTimeout(() => setVisible(true), 2000)
    return () => clearTimeout(t)
  }, [section])

  function dismiss() {
    const key = `pandi_tip_${section}_${new Date().toISOString().split('T')[0]}`
    localStorage.setItem(key, '1')
    setVisible(false)
    setActive(false)
  }

  function handleClick() {
    setActive(a => !a)
  }

  if (!tip || !visible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        style={{ width: '100%', marginBottom: 12, position: 'relative' }}
      >
        <div
          onClick={handleClick}
          style={{
            display:    'flex',
            alignItems: 'flex-end',
            gap:        12,
            cursor:     'pointer',
          }}
        >
          {/* Pandi — cambia de frame al activar */}
          <motion.div
            animate={active ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 0.3 }}
            style={{ flexShrink: 0 }}
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={active ? 'tip' : 'base'}
                src={active
                  ? (tipImgErr ? '/panda/panda_base.png' : '/panda/panda_tip.png')
                  : (imgErr    ? '/panda/panda_base.png' : '/panda/panda_base.png')
                }
                alt={petName}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.25 }}
                style={{ width: 64, height: 64, objectFit: 'contain', display: 'block' }}
                onError={() => active ? setTipImgErr(true) : setImgErr(true)}
              />
            </AnimatePresence>
          </motion.div>

          {/* Bocadillo */}
          <div style={{ flex: 1, position: 'relative' }}>
            {/* Cola del bocadillo */}
            <div style={{
              position:    'absolute',
              left:        -8,
              bottom:      14,
              width:       0,
              height:      0,
              borderTop:   '7px solid transparent',
              borderBottom:'7px solid transparent',
              borderRight: `8px solid ${active ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.55)'}`,
              transition:  'border-right-color 0.3s',
            }} />

            <motion.div
              animate={{
                background: active
                  ? 'rgba(255,255,255,0.95)'
                  : 'rgba(255,255,255,0.55)',
                boxShadow: active
                  ? '0 4px 20px rgba(0,0,0,0.1)'
                  : '0 2px 8px rgba(0,0,0,0.05)',
              }}
              transition={{ duration: 0.3 }}
              style={{
                borderRadius:  16,
                borderBottomLeftRadius: 4,
                padding:       active ? '12px 14px' : '10px 14px',
                border:        `1px solid ${active ? 'rgba(46,196,182,0.25)' : 'rgba(0,0,0,0.08)'}`,
                backdropFilter:'blur(8px)',
                transition:    'all 0.3s',
              }}
            >
              {/* Label */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: active ? 6 : 4 }}>
                <p style={{ fontSize: 10, fontWeight: 800, color: theme.primary, margin: 0, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                  💡 Tip de {petName}
                </p>
                {active && (
                  <button
                    onClick={e => { e.stopPropagation(); dismiss() }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: theme.textMuted || '#9CA3AF', fontSize: 14, lineHeight: 1 }}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Tip — siempre visible pero más compacto cuando no está activo */}
              <p style={{
                fontSize:   active ? 13 : 12,
                color:      active ? (theme.text || '#1A2332') : (theme.textMuted || '#6B7280'),
                lineHeight: 1.55,
                margin:     0,
                transition: 'all 0.3s',
                overflow:   active ? 'visible' : 'hidden',
                display:    active ? 'block' : '-webkit-box',
                WebkitLineClamp: active ? 'unset' : 1,
                WebkitBoxOrient: 'vertical',
              }}>
                {tip}
              </p>

              {/* Hint cuando está cerrado */}
              {!active && (
                <p style={{ fontSize: 10, color: theme.primary || '#2EC4B6', margin: '4px 0 0', fontWeight: 600 }}>
                  Toca para leer →
                </p>
              )}
            </motion.div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
