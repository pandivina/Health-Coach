// src/components/landing/HeroSection.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Hero section V2 — Pandi como protagonista vivo, bio-reflejo, aura de energía
// Reemplaza la sección HERO de Landing.jsx
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion'
import { ArrowRight, Sparkles, Zap } from 'lucide-react'

const C = {
  primary: '#2EC4B6',
  pink:    '#FF8FA3',
  text:    '#1F2937',
  muted:   '#6B7280',
  light:   '#9CA3AF',
  border:  '#E5E7EB',
  grad:    'linear-gradient(135deg, #2EC4B6, #FF8FA3)',
  gradSoft:'linear-gradient(135deg, #f0fffe, #fff5f7)',
}

// ─── ESTADOS DE PANDI ─────────────────────────────────────────────────────────
const PANDI_STATES = [
  {
    id:       'energized',
    emoji:    '🐼',
    label:    'Pandi está en forma 🟢',
    aura:     ['#2EC4B6', '#4AE8D8', '#00F5E9'],
    glow:     'rgba(46,196,182,0.6)',
    msg:      'Hoy tienes energía para todo. Vamos a por ello.',
    bg:       'linear-gradient(135deg, #e0fffe 0%, #f0fff8 50%, #e8f5ff 100%)',
    particle: '#2EC4B6',
  },
  {
    id:       'focused',
    emoji:    '🐼',
    label:    'Pandi está concentrado 🟡',
    aura:     ['#F59E0B', '#FCD34D', '#FEF08A'],
    glow:     'rgba(245,158,11,0.55)',
    msg:      'Ritmo moderado. El Coach ajusta tu plan.',
    bg:       'linear-gradient(135deg, #fffbeb 0%, #fef9e7 50%, #fff8e1 100%)',
    particle: '#F59E0B',
  },
  {
    id:       'recovering',
    emoji:    '🐼',
    label:    'Pandi necesita descanso 🔴',
    aura:     ['#FF8FA3', '#FFB3C6', '#FFD6E0'],
    glow:     'rgba(255,143,163,0.55)',
    msg:      'Hoy el descanso ES el entrenamiento.',
    bg:       'linear-gradient(135deg, #fff0f3 0%, #fff5f7 50%, #fce4ec 100%)',
    particle: '#FF8FA3',
  },
]

// ─── PARTÍCULAS DE AURA ───────────────────────────────────────────────────────
function AuraParticle({ color, index, total }) {
  const angle  = (index / total) * Math.PI * 2
  const radius = 110 + Math.random() * 40
  const x      = Math.cos(angle) * radius
  const y      = Math.sin(angle) * radius
  const size   = 3 + Math.random() * 5
  const delay  = Math.random() * 2

  return (
    <motion.div
      style={{
        position:    'absolute',
        left:        '50%',
        top:         '50%',
        width:       size,
        height:      size,
        borderRadius:'50%',
        background:  color,
        marginLeft:  -size / 2,
        marginTop:   -size / 2,
        boxShadow:   `0 0 ${size * 2}px ${color}`,
      }}
      animate={{
        x:       [x * 0.8, x * 1.1, x * 0.9, x],
        y:       [y * 0.8, y * 1.1, y * 0.9, y],
        opacity: [0.4, 0.9, 0.6, 0.4],
        scale:   [1, 1.4, 0.8, 1],
      }}
      transition={{
        duration:   3 + Math.random() * 2,
        delay,
        repeat:     Infinity,
        ease:       'easeInOut',
      }}
    />
  )
}

// ─── PANDI VIVO ───────────────────────────────────────────────────────────────
function PandiHero({ state }) {
  const [imgErr, setImgErr] = useState(false)

  return (
    <div style={{ position: 'relative', width: 220, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

      {/* Anillos de aura */}
      {[1, 2, 3].map(ring => (
        <motion.div
          key={ring}
          style={{
            position:    'absolute',
            width:       140 + ring * 40,
            height:      140 + ring * 40,
            borderRadius:'50%',
            border:      `${4 - ring}px solid ${state.aura[ring - 1]}`,
            opacity:     0.3 / ring,
          }}
          animate={{
            scale:   [1, 1.08, 1],
            opacity: [0.3 / ring, 0.5 / ring, 0.3 / ring],
          }}
          transition={{
            duration:  2.5 + ring * 0.5,
            repeat:    Infinity,
            ease:      'easeInOut',
            delay:     ring * 0.3,
          }}
        />
      ))}

      {/* Partículas */}
      {[...Array(12)].map((_, i) => (
        <AuraParticle key={i} color={state.particle} index={i} total={12} />
      ))}

      {/* Glow de fondo */}
      <motion.div
        style={{
          position:     'absolute',
          width:        160,
          height:       160,
          borderRadius: '50%',
          background:   `radial-gradient(circle, ${state.glow} 0%, transparent 70%)`,
          filter:       'blur(20px)',
        }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Avatar Pandi */}
      <motion.div
        style={{
          position:     'relative',
          zIndex:       2,
          width:        130,
          height:       130,
          borderRadius: '50%',
          background:   'white',
          boxShadow:    `0 0 40px ${state.glow}, 0 8px 32px rgba(0,0,0,0.1)`,
          display:      'flex',
          alignItems:   'center',
          justifyContent:'center',
          overflow:     'hidden',
        }}
        animate={{ y: [0, -8, 0], rotate: [-1, 1, -1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        {imgErr ? (
          <span style={{ fontSize: 72 }}>🐼</span>
        ) : (
          <img
            src="/panda/avatar_happy.png"
            alt="Pandi"
            style={{ width: 110, height: 110, objectFit: 'contain' }}
            onError={() => setImgErr(true)}
          />
        )}
      </motion.div>

      {/* Badge de estado */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        style={{
          position:     'absolute',
          bottom:       -8,
          left:         '50%',
          transform:    'translateX(-50%)',
          background:   'white',
          borderRadius: 20,
          padding:      '5px 14px',
          fontSize:     11,
          fontWeight:   700,
          color:        C.text,
          whiteSpace:   'nowrap',
          boxShadow:    '0 4px 16px rgba(0,0,0,0.12)',
          border:       `1.5px solid ${state.aura[0]}40`,
          zIndex:       3,
        }}
      >
        {state.label}
      </motion.div>
    </div>
  )
}

// ─── TICKER DE ESTADOS ────────────────────────────────────────────────────────
function StateTicker({ state }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={state.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.4 }}
        style={{
          display:      'flex',
          alignItems:   'center',
          gap:          8,
          padding:      '8px 16px',
          borderRadius: 20,
          background:   'rgba(255,255,255,0.8)',
          backdropFilter:'blur(8px)',
          border:       `1px solid ${state.aura[0]}30`,
          fontSize:     13,
          fontWeight:   600,
          color:        C.muted,
          boxShadow:    '0 2px 12px rgba(0,0,0,0.06)',
        }}
      >
        <motion.div
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            width:        8,
            height:       8,
            borderRadius: '50%',
            background:   state.aura[0],
            boxShadow:    `0 0 8px ${state.aura[0]}`,
            flexShrink:   0,
          }}
        />
        <span style={{ color: C.text }}>{state.msg}</span>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── STATS FLOTANTES ──────────────────────────────────────────────────────────
function FloatingStats() {
  return (
    <>
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position:     'absolute',
          right:        -20,
          top:          40,
          background:   'white',
          borderRadius: 16,
          padding:      '10px 14px',
          boxShadow:    '0 8px 32px rgba(0,0,0,0.12)',
          border:       `1px solid ${C.border}`,
          minWidth:     100,
        }}
      >
        <p style={{ fontSize: 9, color: C.muted, margin: 0 }}>🔥 Racha activa</p>
        <p style={{ fontSize: 18, fontWeight: 800, color: C.text, margin: '2px 0 0' }}>21 días</p>
        <div style={{ display: 'flex', gap: 3, marginTop: 4 }}>
          {[...Array(7)].map((_, i) => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: 2,
              background: i < 6 ? C.primary : C.border,
            }} />
          ))}
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        style={{
          position:     'absolute',
          left:         -24,
          bottom:       60,
          background:   'white',
          borderRadius: 16,
          padding:      '10px 14px',
          boxShadow:    '0 8px 32px rgba(0,0,0,0.12)',
          border:       `1px solid ${C.border}`,
          minWidth:     100,
        }}
      >
        <p style={{ fontSize: 9, color: C.muted, margin: 0 }}>⚖️ Progreso</p>
        <p style={{ fontSize: 18, fontWeight: 800, color: C.primary, margin: '2px 0 0' }}>−4.2 kg</p>
        <p style={{ fontSize: 9, color: C.muted, margin: '2px 0 0' }}>en 8 semanas</p>
      </motion.div>

      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        style={{
          position:     'absolute',
          left:         -16,
          top:          20,
          background:   'white',
          borderRadius: 14,
          padding:      '8px 12px',
          boxShadow:    '0 6px 24px rgba(0,0,0,0.1)',
          border:       `1px solid ${C.border}`,
        }}
      >
        <p style={{ fontSize: 9, color: C.muted, margin: 0 }}>😴 Sueño</p>
        <p style={{ fontSize: 15, fontWeight: 800, color: '#818CF8', margin: '2px 0 0' }}>7.5h ✓</p>
      </motion.div>
    </>
  )
}

// ─── DEMO CHAT ────────────────────────────────────────────────────────────────
function DemoChat() {
  const messages = [
    { user: true,  text: '¿Qué como antes de entrenar? Llevo Ozempic.' },
    { user: false, text: 'Con Ozempic tu apetito es menor, así que algo ligero: 150g pollo + arroz. Te da energía sin saturarte. ¿A qué hora entrenas?' },
    { user: true,  text: 'En 30 minutos' },
    { user: false, text: 'Perfecto, come ahora. Y recuerda: tu proteína hoy va al 68%. Después del entreno toma un batido o requesón.' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.6, duration: 0.6 }}
      style={{
        background:   'white',
        borderRadius: 24,
        border:       `1px solid ${C.border}`,
        boxShadow:    '0 8px 48px rgba(0,0,0,0.08)',
        overflow:     'hidden',
        maxWidth:     320,
      }}
    >
      {/* Header del chat */}
      <div style={{
        display:     'flex',
        alignItems:  'center',
        gap:         10,
        padding:     '12px 16px',
        borderBottom:`1px solid ${C.border}`,
        background:  'linear-gradient(135deg, #f0fffe, #fff5f7)',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: C.grad,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18,
        }}>🐼</div>
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: C.text, margin: 0 }}>Pandi Coach</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E' }} />
            <p style={{ fontSize: 10, color: C.muted, margin: 0 }}>Ve lo que estás haciendo ahora</p>
          </div>
        </div>
      </div>

      {/* Mensajes */}
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 + i * 0.3 }}
            style={{ display: 'flex', justifyContent: msg.user ? 'flex-end' : 'flex-start' }}
          >
            <div style={{
              maxWidth:            '82%',
              padding:             '8px 12px',
              borderRadius:        14,
              fontSize:            12,
              lineHeight:          1.45,
              background:          msg.user ? C.primary : '#F5F7FA',
              color:               msg.user ? '#fff' : C.text,
              borderBottomRightRadius: msg.user ? 3 : 14,
              borderBottomLeftRadius:  msg.user ? 14 : 3,
            }}>
              {msg.text}
            </div>
          </motion.div>
        ))}

        {/* Typing indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.2 }}
          style={{ display: 'flex', gap: 4, padding: '4px 8px' }}
        >
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
              style={{ width: 6, height: 6, borderRadius: '50%', background: C.primary }}
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  )
}

// ─── HERO SECTION PRINCIPAL ───────────────────────────────────────────────────
export default function HeroSection() {
  const [stateIdx, setStateIdx] = useState(0)
  const state = PANDI_STATES[stateIdx]

  // Cicla entre estados cada 4 segundos para demostrar el bio-reflejo
  useEffect(() => {
    const t = setInterval(() => {
      setStateIdx(i => (i + 1) % PANDI_STATES.length)
    }, 4000)
    return () => clearInterval(t)
  }, [])

  return (
    <section style={{
      position:   'relative',
      overflow:   'hidden',
      minHeight:  '100vh',
      display:    'flex',
      alignItems: 'center',
    }}>

      {/* Fondo dinámico que cambia con el estado */}
      <AnimatePresence mode="wait">
        <motion.div
          key={state.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
          style={{
            position: 'absolute',
            inset:    0,
            background: state.bg,
            zIndex:   0,
          }}
        />
      </AnimatePresence>

      {/* Orbes de fondo decorativos */}
      <motion.div
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position:     'absolute',
          top:          '-10%',
          right:        '-5%',
          width:        400,
          height:       400,
          borderRadius: '50%',
          background:   `radial-gradient(circle, ${state.aura[0]}30 0%, transparent 70%)`,
          filter:       'blur(40px)',
          zIndex:       0,
        }}
      />
      <motion.div
        animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        style={{
          position:     'absolute',
          bottom:       '-10%',
          left:         '-5%',
          width:        350,
          height:       350,
          borderRadius: '50%',
          background:   `radial-gradient(circle, ${C.pink}25 0%, transparent 70%)`,
          filter:       'blur(40px)',
          zIndex:       0,
        }}
      />

      {/* Contenido */}
      <div style={{
        maxWidth:  1080,
        margin:    '0 auto',
        padding:   '6rem 1.5rem 5rem',
        position:  'relative',
        zIndex:    1,
        width:     '100%',
      }}>
        <div style={{
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          gap:            48,
        }}>

          {/* Columna izquierda — texto */}
          <div style={{ flex: 1, textAlign: 'center', maxWidth: 600 }}>

            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              style={{
                display:      'inline-flex',
                alignItems:   'center',
                gap:          6,
                padding:      '6px 16px',
                borderRadius: 20,
                background:   `${C.primary}15`,
                border:       `1px solid ${C.primary}30`,
                fontSize:     12,
                fontWeight:   700,
                color:        C.primary,
                marginBottom: 20,
              }}
            >
              <Zap size={12} />
              El primer coach que te refleja biológicamente
            </motion.div>

            {/* H1 */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              style={{
                fontSize:     'clamp(2.4rem, 6vw, 4rem)',
                fontWeight:   900,
                lineHeight:   1.1,
                color:        C.text,
                margin:       '0 0 20px',
                letterSpacing:'-0.02em',
              }}
            >
              Pandi no registra<br />
              tu salud.{' '}
              <span style={{
                background:             C.grad,
                WebkitBackgroundClip:   'text',
                WebkitTextFillColor:    'transparent',
                backgroundClip:         'text',
              }}>
                La vive contigo.
              </span>
            </motion.h1>

            {/* Subtítulo */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              style={{
                fontSize:   'clamp(1rem, 2vw, 1.2rem)',
                color:      C.muted,
                lineHeight: 1.7,
                margin:     '0 0 16px',
              }}
            >
              Cuando descansas bien, Pandi brilla.
              Cuando te sobreentrenas, Pandi te frena.
              Es el espejo biológico de tu mejor versión.
            </motion.p>

            {/* Ticker de estado */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              style={{ marginBottom: 32, display: 'flex', justifyContent: 'center' }}
            >
              <StateTicker state={state} />
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}
            >
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Link to="/auth" style={{
                  display:      'inline-flex',
                  alignItems:   'center',
                  gap:          8,
                  padding:      '14px 28px',
                  borderRadius: 18,
                  background:   C.grad,
                  color:        '#fff',
                  fontWeight:   800,
                  fontSize:     15,
                  textDecoration:'none',
                  boxShadow:    `0 8px 32px ${C.primary}50`,
                  letterSpacing:'-0.01em',
                }}>
                  Dale vida a tu Pandi
                  <ArrowRight size={16} />
                </Link>

                <a href="#como-funciona" style={{
                  display:      'inline-flex',
                  alignItems:   'center',
                  gap:          8,
                  padding:      '14px 24px',
                  borderRadius: 18,
                  background:   'rgba(255,255,255,0.8)',
                  backdropFilter:'blur(8px)',
                  border:       `1.5px solid ${C.border}`,
                  color:        C.text,
                  fontWeight:   600,
                  fontSize:     14,
                  textDecoration:'none',
                }}>
                  Ver cómo funciona
                </a>
              </div>

              <p style={{ fontSize: 11, color: C.light, margin: 0 }}>
                ✓ 7 días Premium gratis &nbsp;·&nbsp; ✓ Sin tarjeta &nbsp;·&nbsp; ✓ Cancela cuando quieras
              </p>
            </motion.div>
          </div>

          {/* Columna derecha — Pandi vivo + chat demo */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
            style={{
              display:        'flex',
              flexDirection:  'column',
              alignItems:     'center',
              gap:            32,
              width:          '100%',
              maxWidth:       480,
            }}
          >
            {/* Pandi con aura */}
            <div style={{ position: 'relative' }}>
              <PandiHero state={state} />
              <FloatingStats />
            </div>

            {/* Selector de estados — para que el usuario interactúe */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              {PANDI_STATES.map((s, i) => (
                <motion.button
                  key={s.id}
                  onClick={() => setStateIdx(i)}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    padding:      '6px 14px',
                    borderRadius: 20,
                    border:       `2px solid ${stateIdx === i ? s.aura[0] : C.border}`,
                    background:   stateIdx === i ? `${s.aura[0]}15` : 'rgba(255,255,255,0.7)',
                    color:        stateIdx === i ? s.aura[0] : C.muted,
                    fontSize:     11,
                    fontWeight:   700,
                    cursor:       'pointer',
                    transition:   'all 0.2s',
                  }}
                >
                  {s.id === 'energized' ? '🟢 Energizado' : s.id === 'focused' ? '🟡 Moderado' : '🔴 Descansando'}
                </motion.button>
              ))}
            </div>

            {/* Demo chat */}
            <DemoChat />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
