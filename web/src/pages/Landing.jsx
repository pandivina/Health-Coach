import HeroSection from '../components/landing/HeroSection'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import InstallPWA from '../components/InstallPWA'
import { motion } from 'framer-motion'
import {
  Brain, Apple, Dumbbell, Moon, FlaskConical, Trophy,
  Check, ChevronDown, Star, ArrowRight, Sparkles,
  Shield, Zap, Heart
} from 'lucide-react'

const C = {
  bg:      '#FFFFFF',
  surface: '#F5F7FA',
  surface2:'#EEF1F5',
  primary: '#2EC4B6',
  pink:    '#FF8FA3',
  text:    '#1F2937',
  muted:   '#6B7280',
  light:   '#9CA3AF',
  border:  '#E5E7EB',
  grad:    'linear-gradient(135deg, #2EC4B6, #FF8FA3)',
  gradSoft:'linear-gradient(135deg, #f0fffe, #fff5f7)',
}

function GradText({ children, className = '' }) {
  return (
    <span className={className} style={{
      background: C.grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
    }}>{children}</span>
  )
}

function FadeIn({ children, delay = 0, y = 20 }) {
  return (
    <motion.div initial={{ opacity: 0, y }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.5 }}>
      {children}
    </motion.div>
  )
}

function PhoneMockup() {
  return (
    <div className="relative mx-auto" style={{ width: 220, height: 440 }}>
      <div className="absolute inset-0 rounded-[2.5rem] border-4 shadow-2xl overflow-hidden"
        style={{ borderColor: '#1F2937', background: C.bg, boxShadow: '0 40px 80px rgba(46,196,182,0.3)' }}>
        <div className="h-6 flex items-center justify-between px-4" style={{ background: C.surface }}>
          <span style={{ color: C.muted, fontSize: 9 }}>9:41</span>
          <div className="w-16 h-3 rounded-full" style={{ background: '#1F2937' }} />
          <span style={{ color: C.muted, fontSize: 9 }}>●●●</span>
        </div>
        <div className="p-3 space-y-2.5 overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p style={{ color: C.muted, fontSize: 9 }}>Buenos días,</p>
              <p className="font-bold" style={{ color: C.text, fontSize: 14 }}>María 👋</p>
            </div>
            <img src="/icons/icon-192.png" alt="Pandi" style={{ width: 64, height: 64, borderRadius: 16 }} className="mx-auto mb-4" />
          </div>
          <div className="rounded-2xl p-3" style={{ background: 'linear-gradient(135deg, #f0fffe, #fff5f7)', border: `1px solid ${C.border}` }}>
            <p style={{ color: C.muted, fontSize: 9 }}>Calorías hoy</p>
            <p className="font-extrabold" style={{ color: C.text, fontSize: 22 }}>1,240</p>
            <p style={{ color: C.muted, fontSize: 9 }}>/ 1,800 kcal</p>
            <div className="flex gap-2 mt-2">
              {[['Proteína', 78, C.primary], ['Carbos', 55, '#F97316'], ['Grasa', 40, C.pink]].map(([l, p, col]) => (
                <div key={l} className="flex-1">
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: C.border }}>
                    <div className="h-full rounded-full" style={{ width: `${p}%`, background: col }} />
                  </div>
                  <p style={{ color: C.light, fontSize: 8, marginTop: 2 }}>{l}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {[['🍎','Nutrición'],['💪','Entrena'],['😴','Sueño'],['💧','Agua']].map(([e,l]) => (
              <div key={l} className="rounded-xl p-1.5 flex flex-col items-center gap-0.5" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 13 }}>{e}</span>
                <p style={{ color: C.muted, fontSize: 7, textAlign: 'center' }}>{l}</p>
              </div>
            ))}
          </div>
          <div className="rounded-xl p-2.5" style={{ background: `${C.primary}15`, border: `1px solid ${C.primary}30` }}>
            <div className="flex items-center gap-1.5 mb-1">
              <img src="/icons/icon-192.png" alt="Pandi" style={{ width: 64, height: 64, borderRadius: 16 }} className="mx-auto mb-4" />
              <p className="font-semibold" style={{ color: C.text, fontSize: 9 }}>Coach IA</p>
            </div>
            <p style={{ color: C.text, fontSize: 8, lineHeight: 1.4 }}>
              "María, llevas 3 días sin alcanzar tu proteína. Con tu Levotiroxina, es especialmente importante…"
            </p>
          </div>
          <div className="flex justify-around pt-1" style={{ borderTop: `1px solid ${C.border}` }}>
            {['🏠','🤖','🍎','💪','📊'].map((e, i) => (
              <div key={i} className="flex flex-col items-center">
                <span style={{ fontSize: i === 0 ? 14 : 11, opacity: i === 0 ? 1 : 0.4 }}>{e}</span>
                {i === 0 && <div className="w-3 h-0.5 rounded-full mt-0.5" style={{ background: C.primary }} />}
              </div>
            ))}
          </div>
        </div>
      </div>
      <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity }}
        className="absolute -right-8 top-16 rounded-xl px-2.5 py-1.5 shadow-lg"
        style={{ background: '#fff', border: `1px solid ${C.border}`, minWidth: 90 }}>
        <p style={{ color: C.muted, fontSize: 9 }}>🔥 Racha</p>
        <p className="font-bold" style={{ color: C.text, fontSize: 13 }}>21 días</p>
      </motion.div>
      <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
        className="absolute -left-10 bottom-24 rounded-xl px-2.5 py-1.5 shadow-lg"
        style={{ background: '#fff', border: `1px solid ${C.border}`, minWidth: 90 }}>
        <p style={{ color: C.muted, fontSize: 9 }}>⚖️ Bajé</p>
        <p className="font-bold" style={{ color: C.primary, fontSize: 13 }}>−4.2 kg</p>
      </motion.div>
    </div>
  )
}

const FEATURES = [
  { icon: Brain,        color: C.primary, title: 'Coach IA contextual',   desc: 'El único coach que conoce tus analíticas, tratamientos, historial de peso y objetivos. Respuestas reales, no genéricas.', badge: 'Diferenciador clave' },
  { icon: Apple,        color: '#F97316', title: 'Nutrición inteligente',  desc: 'Analiza fotos de tus platos, escanea códigos de barras y genera recetas con tus ingredientes disponibles.', badge: null },
  { icon: Dumbbell,     color: '#6366f1', title: 'Entrenamiento con PRs',  desc: 'Rutinas generadas por IA, seguimiento de récords personales y sesiones en tiempo real con timer de descanso.', badge: null },
  { icon: FlaskConical, color: C.pink,    title: 'Analíticas clínicas',    desc: 'Sube tus análisis de sangre y la IA extrae marcadores clave con recomendaciones nutricionales.', badge: '✨ Premium' },
  { icon: Moon,         color: '#818cf8', title: 'Sueño y bienestar',      desc: 'Seguimiento de sueño, ánimo e hidratación. La IA cruza todos los datos para darte el cuadro completo.', badge: null },
  { icon: Trophy,       color: '#F59E0B', title: 'Gamificación real',      desc: '21 logros conectados a acciones reales, XP, niveles y mascotas. Mantén la motivación sin trucos baratos.', badge: null },
]

const STEPS = [
  { n: '01', title: 'Crea tu perfil clínico',  desc: 'En 2 minutos registramos tu altura, peso, objetivo, horarios, restricciones y tratamientos médicos activos.' },
  { n: '02', title: 'La IA se personaliza',    desc: 'Calculamos tu TDEE, tus macros óptimos y configuramos el Coach con toda la información clínica proporcionada.' },
  { n: '03', title: 'Avanza con datos reales', desc: 'Registra comidas, entrenos y sueño. El Coach analiza tus patrones y ajusta las recomendaciones cada semana.' },
]

const FAQS = [
  { q: '¿Qué diferencia a Health Coach de MyFitnessPal o Cronometer?', a: 'Health Coach usa tu perfil clínico completo — tratamientos médicos, analíticas, horarios laborales y patrones de sueño — para dar recomendaciones contextualizadas. No es un contador de calorías, es un coach que te conoce.' },
  { q: '¿Mis datos médicos están seguros?', a: 'Sí. Tus datos se almacenan en Supabase con cifrado en reposo y en tránsito. Cumplimos con el RGPD. Nunca vendemos ni compartimos tus datos con terceros.' },
  { q: '¿El Coach IA sustituye a un médico o nutricionista?', a: 'No. Health Coach es una herramienta de apoyo y seguimiento. Las recomendaciones son orientativas y no sustituyen el consejo de un profesional de la salud.' },
  { q: '¿Puedo usar la app si tengo tratamientos médicos?', a: 'Sí, y de hecho es donde más brilla. Registra tus tratamientos (GLP-1, tiroides, anticonceptivos…) y el Coach los tendrá en cuenta.' },
  { q: '¿Cómo funciona el período de prueba?', a: '7 días con todas las funcionalidades Premium activas, sin introducir tarjeta de crédito. Al finalizar, puedes elegir continuar con Premium o usar el plan gratuito.' },
  { q: '¿Qué incluye el plan gratuito?', a: 'Diario nutricional, entrenamiento, seguimiento de sueño y ánimo, hidratación, mascota básica y Coach IA con 10 mensajes diarios. Sin fecha de caducidad.' },
]

const FOOTER_LINKS = {
  'Producto': [
    { label: 'Funcionalidades', href: '#funcionalidades' },
    { label: 'Precio',          href: '#precio' },
    { label: 'Privacidad',      to: '/privacy' },
  ],
  'Legal': [
    { label: 'Términos de uso',        to: '/terms' },
    { label: 'Política de privacidad', to: '/privacy' },
    { label: 'Disclaimer médico',      to: '/disclaimer' },
  ],
}

export default function Landing() {
  const [openFaq, setOpenFaq] = useState(null)

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: "'Outfit', system-ui, sans-serif", overflowX: 'hidden' }}>

      {/* NAV */}
      <nav className="sticky top-0 z-50" style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${C.border}` }}>
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/icons/icon-192.png" alt="Pandi" style={{ width: 32, height: 32, borderRadius: 8 }} />
            <span className="font-extrabold text-lg" style={{ color: C.text }}>Health Coach</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            {[['Funcionalidades','#funcionalidades'],['Cómo funciona','#como-funciona'],['Precio','#precio']].map(([l,h]) => (
              <a key={l} href={h} className="text-sm font-medium" style={{ color: C.muted }}>{l}</a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth" className="text-sm font-medium hidden md:block" style={{ color: C.muted }}>Iniciar sesión</Link>
          </div>
        </div>
      </nav>

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

      {/* SOCIAL PROOF */}
      <section style={{ background: C.surface, padding: '2.5rem 0', borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-8 items-center">
            {[{v:'+500',l:'usuarios en beta'},{v:'4.9★',l:'valoración media'},{v:'−4.8kg',l:'pérdida media en 90 días'},{v:'94%',l:'mejoran hábitos en 30 días'}].map(({v,l}) => (
              <div key={l} className="text-center">
                <p className="font-extrabold text-2xl" style={{ color: C.primary }}>{v}</p>
                <p className="text-xs" style={{ color: C.muted }}>{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROBLEMA */}
      <section style={{ padding: '5rem 1rem' }}>
        <div className="max-w-3xl mx-auto text-center">
          <p className="font-semibold mb-3 text-sm" style={{ color: C.primary }}>EL PROBLEMA</p>
          <h2 className="font-extrabold mb-4" style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', color: C.text }}>
            Las apps de salud genéricas<br />
            <span style={{ color: C.muted, fontWeight: 500 }}>no funcionan para personas reales</span>
          </h2>
          <p className="text-base mb-12" style={{ color: C.muted }}>Todas calculan calorías. Ninguna sabe que tomas Levotiroxina, que trabajas de noche o que tu ferritina está baja.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { emoji:'🤖', title:'Consejos de copia-pega', desc:'"Come 2.000 kcal y haz ejercicio." El mismo plan para todos.' },
              { emoji:'📊', title:'Datos sin contexto', desc:'Te muestran gráficas bonitas pero no te dicen qué hacer con ellas.' },
              { emoji:'🏥', title:'Ignoran tu salud clínica', desc:'Tu tiroides, tus analíticas, tus tratamientos. Ninguna app los tiene en cuenta. Hasta ahora.' },
            ].map(({emoji,title,desc}) => (
              <div key={title} className="rounded-2xl p-6 text-left" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                <span className="text-3xl mb-3 block">{emoji}</span>
                <p className="font-bold mb-2" style={{ color: C.text }}>{title}</p>
                <p className="text-sm" style={{ color: C.muted, lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="funcionalidades" style={{ background: C.surface, padding: '5rem 1rem' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="font-semibold mb-3 text-sm" style={{ color: C.primary }}>LA SOLUCIÓN</p>
            <h2 className="font-extrabold mb-4" style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', color: C.text }}>
              Todo lo que necesitas,<br /><GradText>conectado e inteligente</GradText>
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, color, title, desc, badge }) => (
              <motion.div key={title} whileHover={{ y: -4 }} transition={{ duration: 0.2 }}
                className="rounded-2xl p-6 relative"
                style={{ background: C.bg, border: `1px solid ${C.border}`, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                {badge && <span className="absolute top-4 right-4 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${color}20`, color }}>{badge}</span>}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: `${color}15` }}><Icon size={20} style={{ color }} /></div>
                <p className="font-bold mb-2" style={{ color: C.text }}>{title}</p>
                <p className="text-sm leading-relaxed" style={{ color: C.muted }}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section id="como-funciona" style={{ padding: '5rem 1rem' }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="font-semibold mb-3 text-sm" style={{ color: C.primary }}>CÓMO FUNCIONA</p>
            <h2 className="font-extrabold" style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', color: C.text }}>En marcha en menos de 2 minutos</h2>
          </div>
          <div className="space-y-6">
            {STEPS.map(({ n, title, desc }, i) => (
              <motion.div key={n} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.15 }} viewport={{ once: true }} className="flex gap-5 items-start">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-sm flex-shrink-0" style={{ background: C.grad, color: '#fff' }}>{n}</div>
                <div className="pt-1">
                  <p className="font-bold text-lg mb-1" style={{ color: C.text }}>{title}</p>
                  <p style={{ color: C.muted, lineHeight: 1.6 }}>{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* COACH HIGHLIGHT */}
      <section style={{ background: C.gradSoft, padding: '5rem 1rem' }}>
        <div className="max-w-5xl mx-auto">
          <div className="rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-10"
            style={{ background: C.bg, border: `1px solid ${C.border}`, boxShadow: '0 8px 48px rgba(46,196,182,0.12)' }}>
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold mb-5" style={{ background: `${C.primary}15`, color: C.primary }}><Brain size={13} /> Coach IA contextual</div>
              <h2 className="font-extrabold mb-4" style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: C.text }}>El coach que sabe lo que<br />ninguna app te pregunta</h2>
              <p className="mb-6" style={{ color: C.muted, lineHeight: 1.7 }}>Pregúntale qué comer antes de entrenar teniendo en cuenta que tomas Ozempic y que tienes la vitamina D baja. Él lo sabe.</p>
              <div className="space-y-3">
                {['Conoce tus analíticas y marcadores clínicos','Tiene en cuenta tus tratamientos médicos activos','Adapta los consejos a tu horario laboral y sueño','Cruza nutrición, entrenamiento y bienestar'].map(f => (
                  <div key={f} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${C.primary}20` }}><Check size={11} style={{ color: C.primary }} /></div>
                    <p className="text-sm" style={{ color: C.text }}>{f}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="w-full md:w-72 space-y-3">
              {[
                { user: true,  text: '¿Qué como para cenar? Tengo poca proteína y estoy con el tratamiento GLP-1' },
                { user: false, text: '¡Claro! Dado que llevas Ozempic y tu apetito puede ser menor, te recomiendo algo ligero pero rico en proteína: salmón al horno con espinacas. Unos 180g te darán ≈36g proteína y es fácil de digerir.' },
              ].map(({ user, text }, i) => (
                <div key={i} className={`flex ${user ? 'justify-end' : 'justify-start'}`}>
                  {!user && <div className="w-7 h-7 rounded-xl flex items-center justify-center text-sm mr-2 flex-shrink-0 mt-1" style={{ background: `${C.primary}20` }}>🤖</div>}
                  <div className="rounded-2xl px-4 py-3 text-sm max-w-[85%]" style={{
                    background: user ? C.primary : C.surface, color: user ? '#fff' : C.text,
                    borderBottomRightRadius: user ? 4 : undefined, borderBottomLeftRadius: !user ? 4 : undefined,
                    border: user ? 'none' : `1px solid ${C.border}`, lineHeight: 1.5,
                  }}>{text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIOS */}
      <section style={{ padding: '5rem 1rem' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="font-semibold mb-3 text-sm" style={{ color: C.primary }}>TESTIMONIOS</p>
            <h2 className="font-extrabold" style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', color: C.text }}>Personas reales, resultados reales</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { name:'Laura M.', role:'Enfermera, turno nocturno', avatar:'👩‍⚕️', text:'Por fin una app que entiende que trabajo de noche. El Coach me adapta las recomendaciones a mis turnos. Llevo 8 semanas y he perdido 3.2kg sin pasar hambre.' },
              { name:'Carlos R.', role:'Lleva Ozempic desde enero', avatar:'👨', text:'Con el GLP-1 mi apetito cayó mucho. El Coach tiene en cuenta el tratamiento y me ayuda a priorizar proteína. He ganado músculo mientras perdía grasa.' },
              { name:'Ana T.', role:'Tiroides, analíticas irregulares', avatar:'👩', text:'Subí mis analíticas y la IA detectó que tenía ferritina baja y vitamina D escasa. Me dio recomendaciones específicas que mi médica validó.' },
            ].map(({ name, role, avatar, text }) => (
              <motion.div key={name} whileHover={{ y: -4 }} transition={{ duration: 0.2 }} className="rounded-2xl p-6" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                <div className="flex gap-0.5 mb-4">{[...Array(5)].map((_,i) => <Star key={i} size={14} fill={C.primary} style={{ color: C.primary }} />)}</div>
                <p className="text-sm mb-5 leading-relaxed" style={{ color: C.text }}>"{text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl" style={{ background: C.surface2 }}>{avatar}</div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: C.text }}>{name}</p>
                    <p className="text-xs" style={{ color: C.muted }}>{role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="precio" style={{ background: C.surface, padding: '5rem 1rem' }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="font-semibold mb-3 text-sm" style={{ color: C.primary }}>PRECIO</p>
            <h2 className="font-extrabold mb-3" style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', color: C.text }}>Empieza gratis.<br /><GradText>Evoluciona cuando quieras.</GradText></h2>
            <p style={{ color: C.muted }}>Sin compromisos. Sin letra pequeña.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl p-7" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
              <p className="font-bold text-lg mb-1" style={{ color: C.text }}>Gratuito</p>
              <p className="text-3xl font-extrabold mb-1" style={{ color: C.text }}>0€</p>
              <p className="text-sm mb-6" style={{ color: C.muted }}>Para siempre</p>
              <div className="space-y-2.5 mb-6">
                {['Diario nutricional manual','Coach IA (10 mensajes/día)','Entrenamiento básico','Sueño, ánimo e hidratación','Mascota Pandi','Informe diario básico'].map(f => (
                  <div key={f} className="flex items-center gap-2"><Check size={14} style={{ color: C.primary, flexShrink: 0 }} /><p className="text-sm" style={{ color: C.text }}>{f}</p></div>
                ))}
              </div>
              <Link to="/auth" className="block w-full text-center py-3 rounded-xl font-semibold text-sm" style={{ background: C.surface2, border: `1px solid ${C.border}`, color: C.text }}>Empezar gratis</Link>
            </div>
            <div className="rounded-2xl p-7 relative" style={{ background: C.text, border: `2px solid ${C.primary}` }}>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-white text-xs font-bold px-4 py-1 rounded-full" style={{ background: C.grad }}>MÁS POPULAR</div>
              <p className="font-bold text-lg mb-1 text-white">Premium</p>
              <div className="flex items-baseline gap-2 mb-1">
                <p className="text-3xl font-extrabold text-white">9,99€</p>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>/mes</p>
              </div>
              <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>59,99€/año · Ahorra 60%</p>
              <div className="space-y-2.5 mb-6">
                {['Todo lo del plan gratuito','Coach IA ilimitado + contexto clínico','Análisis de foto de comida','Escáner de código de barras','Recetas personalizadas con IA','Interpretación de analíticas','Todas las mascotas desbloqueadas'].map(f => (
                  <div key={f} className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: C.primary }}><Check size={9} color="#fff" /></div>
                    <p className="text-sm text-white">{f}</p>
                  </div>
                ))}
              </div>
              <Link to="/auth" className="block w-full text-center py-3 rounded-xl font-bold text-sm text-white" style={{ background: C.grad }}>Probar 7 días gratis</Link>
            </div>
          </div>
          <p className="text-center text-xs mt-4" style={{ color: C.light }}>El período de prueba no requiere tarjeta de crédito</p>
        </div>
      </section>

      {/* TRUST */}
      <section style={{ padding: '4rem 1rem' }}>
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-3 gap-6 text-center">
            {[
              { icon: Shield, color: C.primary, title: 'RGPD compliant',       desc: 'Datos cifrados. Nunca compartidos.' },
              { icon: Zap,    color: '#F59E0B',  title: 'Siempre disponible',   desc: '24/7, sin esperas.' },
              { icon: Heart,  color: C.pink,     title: 'No es consejo médico', desc: 'Herramienta de apoyo al bienestar.' },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}><Icon size={18} style={{ color }} /></div>
                <p className="font-semibold text-sm" style={{ color: C.text }}>{title}</p>
                <p className="text-xs" style={{ color: C.muted }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ background: C.surface, padding: '5rem 1rem' }}>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <p className="font-semibold mb-3 text-sm" style={{ color: C.primary }}>FAQ</p>
            <h2 className="font-extrabold" style={{ fontSize: 'clamp(1.6rem, 3vw, 2rem)', color: C.text }}>Preguntas frecuentes</h2>
          </div>
          <div className="space-y-2">
            {FAQS.map(({ q, a }, i) => (
              <div key={i} className="rounded-2xl overflow-hidden" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
                <button className="w-full flex items-center justify-between px-5 py-4 text-left" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <p className="font-semibold text-sm pr-4" style={{ color: C.text }}>{q}</p>
                  <motion.div animate={{ rotate: openFaq === i ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={16} style={{ color: C.muted }} />
                  </motion.div>
                </button>
                {openFaq === i && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-4">
                    <p className="text-sm leading-relaxed" style={{ color: C.muted }}>{a}</p>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ padding: '5rem 1rem' }}>
        <div className="max-w-2xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="rounded-3xl p-10" style={{ background: C.gradSoft, border: `1px solid ${C.primary}30` }}>
            <img src="/icons/icon-192.png" alt="Pandi" style={{ width: 64, height: 64, borderRadius: 16 }} className="mx-auto mb-4" />
            <h2 className="font-extrabold mb-4" style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', color: C.text }}>
              Tu salud merece<br /><GradText>un coach que te conoce</GradText>
            </h2>
            <p className="mb-8" style={{ color: C.muted, lineHeight: 1.7 }}>Únete a más de 500 personas que ya están mejorando su salud con datos reales. Empieza hoy. Gratis.</p>
            <Link to="/auth" className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-white font-bold text-base"
              style={{ background: C.grad, boxShadow: `0 12px 32px ${C.primary}40` }}>
              Empezar ahora — es gratis <ArrowRight size={16} />
            </Link>
            <p className="text-xs mt-4" style={{ color: C.light }}>✓ 7 días Premium incluidos · ✓ Sin tarjeta · ✓ Cancela cuando quieras</p>
          <div className="mt-4 max-w-sm mx-auto">
            <InstallPWA />
          </div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: C.text, padding: '3rem 1rem 2rem' }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <img src="/icons/icon-192.png" alt="Pandi" style={{ width: 64, height: 64, borderRadius: 16 }} className="mx-auto mb-4" />
                <span className="font-extrabold text-lg text-white">Health Coach</span>
              </div>
              <p className="text-sm max-w-xs" style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>Coaching de salud con IA personalizado con tus datos reales.</p>
              <p className="text-xs mt-3 max-w-xs" style={{ color: 'rgba(255,255,255,0.3)', lineHeight: 1.5 }}>⚕️ Health Coach no proporciona consejo médico. La información generada es orientativa y no sustituye la opinión de un profesional sanitario.</p>
            </div>
            <div className="flex gap-12">
              {Object.entries(FOOTER_LINKS).map(([section, links]) => (
                <div key={section}>
                  <p className="text-xs font-bold mb-3 uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>{section}</p>
                  {links.map(({ label, to, href }) => (
                    to ? (
                      <Link key={label} to={to} className="block text-sm mb-2 hover:text-white transition-colors" style={{ color: 'rgba(255,255,255,0.6)' }}>{label}</Link>
                    ) : (
                      <a key={label} href={href} className="block text-sm mb-2 hover:text-white transition-colors" style={{ color: 'rgba(255,255,255,0.6)' }}>{label}</a>
                    )
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.5rem' }}
            className="flex flex-col md:flex-row justify-between items-center gap-3">
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>© 2026 Health Coach. Todos los derechos reservados.</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Hecho con ❤️ en España · Powered by Anthropic Claude</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
