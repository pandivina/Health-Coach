import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Zap, ChevronLeft, ChevronRight } from 'lucide-react'

const C = {
  primary: '#2EC4B6',
  pink:    '#FF8FA3',
  text:    '#1F2937',
  muted:   '#6B7280',
  light:   '#9CA3AF',
  border:  '#E5E7EB',
  grad:    'linear-gradient(135deg, #2EC4B6, #FF8FA3)',
}

const PANDI_STATES = [
  {
    id:       'energized',
    label:    'Pandi está en forma 🟢',
    aura:     ['#2EC4B6', '#4AE8D8', '#00F5E9'],
    glow:     'rgba(46,196,182,0.6)',
    msg:      'Hoy tienes energía para todo.',
    bg:       'linear-gradient(135deg, #e0fffe 0%, #f0fff8 50%, #e8f5ff 100%)',
    particle: '#2EC4B6',
    avatar:   '/panda/avatar_happy.png',
  },
  {
    id:       'focused',
    label:    'Pandi está concentrado 🟡',
    aura:     ['#F59E0B', '#FCD34D', '#FEF08A'],
    glow:     'rgba(245,158,11,0.55)',
    msg:      'Ritmo moderado. El Coach ajusta tu plan.',
    bg:       'linear-gradient(135deg, #fffbeb 0%, #fef9e7 50%, #fff8e1 100%)',
    particle: '#F59E0B',
    avatar:   '/panda/avatar_thinking.png',
  },
  {
    id:       'recovering',
    label:    'Pandi necesita descanso 🔴',
    aura:     ['#FF8FA3', '#FFB3C6', '#FFD6E0'],
    glow:     'rgba(255,143,163,0.55)',
    msg:      'Hoy el descanso ES el entrenamiento.',
    bg:       'linear-gradient(135deg, #fff0f3 0%, #fff5f7 50%, #fce4ec 100%)',
    particle: '#FF8FA3',
    avatar:   '/panda/avatar_sleep.png',
  },
]

const SECTIONS = [
  {
    id:      'sanctuary',
    emoji:   '🏠',
    label:   'Santuario',
    title:   'Pandi es tu espejo biológico',
    desc:    'El Santuario refleja tu estado real. Si descansas bien, Pandi brilla con energía. Si te sobreentrenas, Pandi lo muestra. No es una mascota — eres tú.',
    avatar:  '/panda/avatar_happy.png',
    color:   '#2EC4B6',
    bg:      'linear-gradient(135deg, #e0fffe, #f0fff8)',
    stats:   [{ emoji: '🟢', label: 'Estado', value: 'En forma' }, { emoji: '✨', label: 'Aura', value: 'Energizada' }, { emoji: '🎯', label: 'Nivel', value: '5' }],
  },
  {
    id:      'nutrition',
    emoji:   '🍎',
    label:   'Nutrición',
    title:   'Come con inteligencia clínica',
    desc:    'Pandi sabe que tomas Ozempic, que tu ferritina está baja y que trabajas de noche. Tus macros se adaptan a tu realidad, no a plantillas genéricas.',
    avatar:  '/panda/avatar_coach.png',
    color:   '#F97316',
    bg:      'linear-gradient(135deg, #fff7ed, #ffedd5)',
    stats:   [{ emoji: '🔥', label: 'Calorías', value: '1,240 / 1,800' }, { emoji: '💪', label: 'Proteína', value: '78 / 150g' }, { emoji: '⚡', label: 'Energía', value: 'Óptima' }],
  },
  {
    id:      'workout',
    emoji:   '💪',
    label:   'Entrenamiento',
    title:   'El coach que te para cuando toca',
    desc:    'Si tu semáforo de recuperación está en rojo, Pandi bloquea el entrenamiento intenso y te manda a movilidad. No es debilidad — es estrategia.',
    avatar:  '/panda/encourage_1.png',
    color:   '#6366F1',
    bg:      'linear-gradient(135deg, #eef2ff, #e0e7ff)',
    stats:   [{ emoji: '🏋️', label: 'Volumen', value: '4,200 kg' }, { emoji: '🔥', label: 'Quemadas', value: '380 kcal' }, { emoji: '📈', label: 'PR', value: '3 esta semana' }],
  },
  {
    id:      'sleep',
    emoji:   '😴',
    label:   'Sueño',
    title:   'Sin sueño, Pandi se apaga',
    desc:    'El sueño alimenta el aura de Pandi. Cada hora que duermes bien se refleja en su brillo. El Coach ajusta tu plan del día según cómo dormiste anoche.',
    avatar:  '/panda/avatar_sleep.png',
    color:   '#818CF8',
    bg:      'linear-gradient(135deg, #f5f3ff, #ede9fe)',
    stats:   [{ emoji: '😴', label: 'Anoche', value: '7.5h' }, { emoji: '⭐', label: 'Calidad', value: '4 / 5' }, { emoji: '📊', label: 'Media', value: '7.2h' }],
  },
  {
    id:      'mood',
    emoji:   '🧘',
    label:   'Bienestar',
    title:   'Tu ánimo cambia el santuario',
    desc:    'Un día difícil oscurece el ambiente de Pandi. Un día genial lo ilumina. Respiración, meditación y seguimiento de hábitos — todo conectado.',
    avatar:  '/panda/avatar_love.png',
    color:   '#EC4899',
    bg:      'linear-gradient(135deg, #fdf2f8, #fce7f3)',
    stats:   [{ emoji: '😊', label: 'Ánimo hoy', value: 'Bien' }, { emoji: '🧘', label: 'Meditación', value: '5 min' }, { emoji: '⚡', label: 'Hábitos', value: '4 / 5' }],
  },
  {
    id:      'coach',
    emoji:   '🤖',
    label:   'Coach IA',
    title:   'Ve todo. Sabe todo. Actúa.',
    desc:    'El Coach ve tu santuario, tus macros, tu sueño y tu ánimo en tiempo real. No espera a que preguntes — te avisa cuando algo no cuadra.',
    avatar:  '/panda/coach_explain_1.png',
    color:   '#2EC4B6',
    bg:      'linear-gradient(135deg, #f0fffe, #e0fffe)',
    stats:   [{ emoji: '🧠', label: 'Contexto', value: 'Completo' }, { emoji: '💬', label: 'Mensajes', value: 'Ilimitados' }, { emoji: '⚡', label: 'Respuesta', value: 'Instantánea' }],
  },
]

const PARTICLE_DATA = Array.from({ length: 12 }, (_, i) => {
  const angle  = (i / 12) * Math.PI * 2
  const radius = 110 + (i % 4) * 10
  return {
    x:     Math.cos(angle) * radius,
    y:     Math.sin(angle) * radius,
    size:  3 + (i % 3) * 1.5,
    delay: i * 0.18,
  }
})

function AuraParticles({ color }) {
  return (
    <>
      {PARTICLE_DATA.map((p, i) => (
        <motion.div key={i}
          style={{
            position: 'absolute', left: '50%', top: '50%',
            width: p.size, height: p.size, borderRadius: '50%',
            background: color, marginLeft: -p.size / 2, marginTop: -p.size / 2,
            boxShadow: `0 0 ${p.size * 2}px ${color}`,
          }}
          animate={{
            x: [p.x * 0.8, p.x * 1.1, p.x * 0.9, p.x],
            y: [p.y * 0.8, p.y * 1.1, p.y * 0.9, p.y],
            opacity: [0.3, 0.8, 0.5, 0.3],
            scale: [1, 1.3, 0.9, 1],
          }}
          transition={{ duration: 3.5 + (i % 3) * 0.5, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </>
  )
}

function PandiOrb({ state, sectionAvatar }) {
  const [imgErr, setImgErr] = useState(false)
  const [secErr, setSecErr] = useState(false)
  const avatar = sectionAvatar && !secErr ? sectionAvatar : (imgErr ? null : state.avatar)

  return (
    <div style={{ position: 'relative', width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {[1, 2, 3].map(ring => (
        <motion.div key={ring}
          style={{
            position: 'absolute', width: 120 + ring * 32, height: 120 + ring * 32,
            borderRadius: '50%', border: `${4 - ring}px solid ${state.aura[ring - 1]}`,
          }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.3 / ring, 0.5 / ring, 0.3 / ring] }}
          transition={{ duration: 2.5 + ring * 0.5, repeat: Infinity, ease: 'easeInOut', delay: ring * 0.3 }}
        />
      ))}
      <AuraParticles color={state.particle} />
      <motion.div
        style={{
          position: 'absolute', width: 140, height: 140, borderRadius: '50%',
          background: `radial-gradient(circle, ${state.glow} 0%, transparent 70%)`,
          filter: 'blur(20px)',
        }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        style={{
          position: 'relative', zIndex: 2, width: 120, height: 120, borderRadius: '50%',
          background: 'white', boxShadow: `0 0 40px ${state.glow}, 0 8px 32px rgba(0,0,0,0.1)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
        }}
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <AnimatePresence mode="wait">
          <motion.div key={avatar || 'fallback'}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.4 }}
            style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {avatar
              ? <img src={avatar} alt="Pandi" style={{ width: 100, height: 100, objectFit: 'contain' }}
                  onError={() => sectionAvatar ? setSecErr(true) : setImgErr(true)} />
              : <span style={{ fontSize: 60 }}>🐼</span>
            }
          </motion.div>
        </AnimatePresence>
      </motion.div>
      <div style={{
        position: 'absolute', bottom: -10, left: '50%', transform: 'translateX(-50%)',
        background: 'white', borderRadius: 20, padding: '4px 12px',
        fontSize: 10, fontWeight: 700, color: C.text, whiteSpace: 'nowrap',
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)', border: `1.5px solid ${state.aura[0]}40`, zIndex: 3,
      }}>
        {state.label}
      </div>
    </div>
  )
}

function SectionCarousel({ state }) {
  const [active, setActive] = useState(0)
  const section = SECTIONS[active]
  const timerRef = useRef(null)

  function go(idx) {
    setActive((idx + SECTIONS.length) % SECTIONS.length)
  }

  useEffect(() => {
    timerRef.current = setInterval(() => setActive(i => (i + 1) % SECTIONS.length), 4500)
    return () => clearInterval(timerRef.current)
  }, [])

  function handleDot(i) {
    clearInterval(timerRef.current)
    setActive(i)
    timerRef.current = setInterval(() => setActive(idx => (idx + 1) % SECTIONS.length), 4500)
  }

  return (
    <div style={{ width: '100%', maxWidth: 420 }}>
      {/* Card principal */}
      <div style={{ position: 'relative', borderRadius: 28, overflow: 'hidden', boxShadow: '0 12px 48px rgba(0,0,0,0.1)' }}>
        <AnimatePresence mode="wait">
          <motion.div key={section.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            style={{ background: section.bg, padding: '28px 24px 20px' }}
          >
            {/* Header de la card */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: `${section.color}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, flexShrink: 0,
              }}>
                {section.emoji}
              </div>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, color: section.color, margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {section.label}
                </p>
                <p style={{ fontSize: 15, fontWeight: 800, color: C.text, margin: '2px 0 0', lineHeight: 1.2 }}>
                  {section.title}
                </p>
              </div>
            </div>

            {/* Pandi + descripción lado a lado */}
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
              {/* Mini Pandi para la sección */}
              <div style={{ flexShrink: 0 }}>
                <SectionPandi avatar={section.avatar} color={section.color} />
              </div>
              <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, margin: 0 }}>
                {section.desc}
              </p>
            </div>

            {/* Stats de la sección */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {section.stats.map(s => (
                <div key={s.label} style={{
                  background: 'rgba(255,255,255,0.7)',
                  borderRadius: 14, padding: '8px 10px', textAlign: 'center',
                  border: `1px solid ${section.color}20`,
                }}>
                  <p style={{ fontSize: 14, margin: '0 0 2px' }}>{s.emoji}</p>
                  <p style={{ fontSize: 12, fontWeight: 700, color: C.text, margin: 0 }}>{s.value}</p>
                  <p style={{ fontSize: 9, color: C.muted, margin: '1px 0 0' }}>{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Flechas */}
        <button onClick={() => go(active - 1)} style={{
          position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
          width: 32, height: 32, borderRadius: '50%', border: 'none',
          background: 'rgba(255,255,255,0.9)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        }}>
          <ChevronLeft size={16} color={C.muted} />
        </button>
        <button onClick={() => go(active + 1)} style={{
          position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
          width: 32, height: 32, borderRadius: '50%', border: 'none',
          background: 'rgba(255,255,255,0.9)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        }}>
          <ChevronRight size={16} color={C.muted} />
        </button>
      </div>

      {/* Tabs de navegación */}
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
        {SECTIONS.map((s, i) => (
          <button key={s.id} onClick={() => handleDot(i)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: active === i ? '6px 14px' : '6px 10px',
              borderRadius: 20, border: 'none', cursor: 'pointer',
              background: active === i ? `${s.color}20` : 'rgba(255,255,255,0.6)',
              border: `1.5px solid ${active === i ? s.color : C.border}`,
              color: active === i ? s.color : C.muted,
              fontSize: 11, fontWeight: 700, transition: 'all 0.25s',
            }}>
            <span style={{ fontSize: 13 }}>{s.emoji}</span>
            {active === i && <span>{s.label}</span>}
          </button>
        ))}
      </div>
    </div>
  )
}

function SectionPandi({ avatar, color }) {
  const [err, setErr] = useState(false)
  return (
    <div style={{
      width: 72, height: 72, borderRadius: '50%',
      background: `${color}15`,
      border: `2px solid ${color}30`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    }}>
      {err
        ? <span style={{ fontSize: 36 }}>🐼</span>
        : <img src={avatar} alt="Pandi" style={{ width: 60, height: 60, objectFit: 'contain' }}
            onError={() => setErr(true)} />
      }
    </div>
  )
}

function StateTicker({ state }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div key={state.id}
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.35 }}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 20,
          background: 'rgba(255,255,255,0.85)', border: `1px solid ${state.aura[0]}30`,
          fontSize: 13, fontWeight: 600, boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        }}
      >
        <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity }}
          style={{ width: 8, height: 8, borderRadius: '50%', background: state.aura[0], flexShrink: 0 }} />
        <span style={{ color: C.text }}>{state.msg}</span>
      </motion.div>
    </AnimatePresence>
  )
}

export default function HeroSection() {
  const [stateIdx, setStateIdx] = useState(0)
  const state = PANDI_STATES[stateIdx]

  useEffect(() => {
    const t = setInterval(() => setStateIdx(i => (i + 1) % PANDI_STATES.length), 5000)
    return () => clearInterval(t)
  }, [])

  return (
    <section style={{ position: 'relative', overflow: 'hidden', minHeight: '100vh', display: 'flex', alignItems: 'center' }}>

      {/* Fondo dinámico */}
      <AnimatePresence mode="wait">
        <motion.div key={state.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
          style={{ position: 'absolute', inset: 0, background: state.bg, zIndex: 0 }} />
      </AnimatePresence>

      {/* Orbes */}
      <motion.div animate={{ x: [0, 30, 0], y: [0, -20, 0] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'absolute', top: '-10%', right: '-5%', width: 500, height: 500, borderRadius: '50%', background: `radial-gradient(circle, ${state.aura[0]}25 0%, transparent 70%)`, filter: 'blur(50px)', zIndex: 0 }} />
      <motion.div animate={{ x: [0, -20, 0], y: [0, 30, 0] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: 400, height: 400, borderRadius: '50%', background: `radial-gradient(circle, ${C.pink}20 0%, transparent 70%)`, filter: 'blur(50px)', zIndex: 0 }} />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '5rem 1.5rem 4rem', position: 'relative', zIndex: 1, width: '100%' }}>

        {/* Layout: izquierda texto + Pandi | derecha carrusel */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 48, alignItems: 'center' }}>

          {/* COLUMNA IZQUIERDA */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, textAlign: 'center' }}>

            {/* Badge */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 16px', borderRadius: 20, background: `${C.primary}15`, border: `1px solid ${C.primary}30`, fontSize: 12, fontWeight: 700, color: C.primary, marginBottom: 28 }}>
              <Zap size={12} />
              El primer coach que te refleja biológicamente
            </motion.div>

            {/* H1 — tipografía dominante */}
            <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}
              style={{ marginBottom: 24 }}>
              <h1 style={{ margin: 0, letterSpacing: '-0.03em', lineHeight: 1.0 }}>
                <span style={{ display: 'block', fontSize: 'clamp(3rem, 8vw, 5.5rem)', fontWeight: 900, color: C.text }}>
                  Pandi no
                </span>
                <span style={{ display: 'block', fontSize: 'clamp(3rem, 8vw, 5.5rem)', fontWeight: 900, color: C.text }}>
                  registra tu salud.
                </span>
                <span style={{ display: 'block', fontSize: 'clamp(3rem, 8vw, 5.5rem)', fontWeight: 900,
                  background: C.grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  La vive contigo.
                </span>
              </h1>
            </motion.div>

            {/* Subtítulo */}
            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              style={{ fontSize: 'clamp(1rem, 2vw, 1.15rem)', color: C.muted, lineHeight: 1.7, margin: '0 0 20px', maxWidth: 520 }}>
              Cuando descansas bien, Pandi brilla.
              Cuando te sobreentrenas, Pandi te frena.
              <br />Es el espejo biológico de tu mejor versión.
            </motion.p>

            {/* Ticker */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
              style={{ marginBottom: 32 }}>
              <StateTicker state={state} />
            </motion.div>

            {/* Pandi orb */}
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, duration: 0.6 }}
              style={{ marginBottom: 32 }}>
              <PandiOrb state={state} sectionAvatar={null} />
            </motion.div>

            {/* Selector de estado */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 36 }}>
              {PANDI_STATES.map((s, i) => (
                <button key={s.id} onClick={() => setStateIdx(i)}
                  style={{
                    padding: '7px 16px', borderRadius: 20, cursor: 'pointer',
                    border: `2px solid ${stateIdx === i ? s.aura[0] : C.border}`,
                    background: stateIdx === i ? `${s.aura[0]}15` : 'rgba(255,255,255,0.75)',
                    color: stateIdx === i ? s.aura[0] : C.muted,
                    fontSize: 12, fontWeight: 700, transition: 'all 0.2s',
                  }}>
                  {s.id === 'energized' ? '🟢 Energizado' : s.id === 'focused' ? '🟡 Moderado' : '🔴 Descansando'}
                </button>
              ))}
            </motion.div>

            {/* CTAs */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Link to="/auth" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '16px 32px', borderRadius: 18, background: C.grad,
                  color: '#fff', fontWeight: 800, fontSize: 16, textDecoration: 'none',
                  boxShadow: `0 8px 32px ${C.primary}50`, letterSpacing: '-0.01em',
                }}>
                  Dale vida a tu Pandi <ArrowRight size={17} />
                </Link>
                <a href="#como-funciona" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '16px 24px', borderRadius: 18,
                  background: 'rgba(255,255,255,0.85)', border: `1.5px solid ${C.border}`,
                  color: C.text, fontWeight: 600, fontSize: 15, textDecoration: 'none',
                }}>
                  Ver cómo funciona
                </a>
              </div>
              <p style={{ fontSize: 11, color: C.light, margin: 0 }}>
                ✓ 7 días Premium gratis &nbsp;·&nbsp; ✓ Sin tarjeta &nbsp;·&nbsp; ✓ Cancela cuando quieras
              </p>
            </motion.div>
          </div>

          {/* CARRUSEL DE SECCIONES */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.7 }}
            style={{ display: 'flex', justifyContent: 'center' }}>
            <SectionCarousel state={state} />
          </motion.div>

        </div>
      </div>
    </section>
  )
}
