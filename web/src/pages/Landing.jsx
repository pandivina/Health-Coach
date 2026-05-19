import { useState } from 'react'
import { Link } from 'react-router-dom'
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
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: C.surface2 }}>🐼</div>
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
              <span style={{ fontSize: 11 }}>🤖</span>
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
            <span className="text-2xl">🐼</span>
            <span className="font-extrabold text-lg" style={{ color: C.text }}>Health Coach</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            {[['Funcionalidades','#funcionalidades'],['Cómo funciona','#como-funciona'],['Precio','#precio']].map(([l,h]) => (
              <a key={l} href={h} className="text-sm font-medium" style={{ color: C.muted }}>{l}</a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth" className="text-sm font-medium hidden md:block" style={{ color: C.muted }}>Iniciar sesión</Link>
            <Link to="/auth" className="text-sm font-bold px-4 py-2 rounded-xl text-white" style={{ background: C.grad }}>Empieza gratis</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ background: C.gradSoft, paddingTop: '5rem', paddingBottom: '5rem' }}>
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 text-center lg:text-left">
              <FadeIn>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold mb-6"
                  style={{ background: `${C.primary}15`, color: C.primary, border: `1px solid ${C.primary}30` }}>
                  <Sparkles size={13} /> IA de salud personalizada
                </div>
              </FadeIn>
              <FadeIn delay={0.1}>
                <h1 className="font-extrabold leading-tight mb-4" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', color: C.text }}>
                  El coach que sí<br /><GradText>te conoce de verdad</GradText>
                </h1>
              </FadeIn>
              <FadeIn delay={0.2}>
                <p className="text-lg mb-8 max-w-lg mx-auto lg:mx-0" style={{ color: C.muted, lineHeight: 1.7 }}>
                  Nutrición, entrenamiento, analíticas y bienestar en una app.
                  Personalizado con <strong style={{ color: C.text }}>tus datos reales</strong> — no con plantillas genéricas.
                </p>
              </FadeIn>
              <FadeIn delay={0.3}>
                <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-6">
                  <Link to="/auth" className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-white font-bold text-base"
                    style={{ background: C.grad, boxShadow: `0 8px 24px ${C.primary}40` }}>
                    Empieza gratis <ArrowRight size={16} />
                  </Link>
                  <a href="#como-funciona" className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-semibold text-base"
                    style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text }}>
                    Ver cómo funciona
                  </a>
                </div>
              </FadeIn>
              <FadeIn delay={0.4}>
                <p className="text-xs" style={{ color: C.light }}>✓ 7 días Premium gratis &nbsp;·&nbsp; ✓ Sin tarjeta &nbsp;·&nbsp; ✓ Cancela cuando quieras</p>
              </FadeIn>
            </div>
            <FadeIn delay={0.3} y={0}><PhoneMockup /></FadeIn>
          </div>
        </div>
      </section>

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
                {['Diario nutricional manual','Coach IA (10 mensajes/día)','Entrenamiento básico','Sueño, ánimo e hidratación','Mascota Panda','Informe diario básico'].map(f => (
                  <div key={f} className="flex items-center gap-2"><Check size={14} style={{ color: C.primary, flexShrink: 0 }} /><p className="text-sm" style={{ color: C.text }}>{f}</p></div>
                ))}
              </div>
              <Link to="/auth" className="block w-full text-center py-3 rounded-xl font-semibold text-sm" style={{ background: C.surface2, border: `1px solid ${C.border}`, color: C.text }}>Empezar gratis</Link>
            </div>
            <div className="rounded-2xl p-7 relative" style={{ background: C.text, border: `2px solid ${C.primary}` }}>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-white text-xs font-bold px-4 py-1 rounded-full" style={{ background: C.grad }}>MÁS POPULAR</div>
              <p className="font-bold text-lg mb-1 text-white">Premium</p>
              <div className="flex items-baseline gap-2 mb-1">
                <p className="text-3xl font-extrabold text-white">4,99€</p>
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
            <div className="text-5xl mb-4">🐼</div>
            <h2 className="font-extrabold mb-4" style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', color: C.text }}>
              Tu salud merece<br /><GradText>un coach que te conoce</GradText>
            </h2>
            <p className="mb-8" style={{ color: C.muted, lineHeight: 1.7 }}>Únete a más de 500 personas que ya están mejorando su salud con datos reales. Empieza hoy. Gratis.</p>
            <Link to="/auth" className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-white font-bold text-base"
              style={{ background: C.grad, boxShadow: `0 12px 32px ${C.primary}40` }}>
              Empezar ahora — es gratis <ArrowRight size={16} />
            </Link>
            <p className="text-xs mt-4" style={{ color: C.light }}>✓ 7 días Premium incluidos · ✓ Sin tarjeta · ✓ Cancela cuando quieras</p>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: C.text, padding: '3rem 1rem 2rem' }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🐼</span>
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
