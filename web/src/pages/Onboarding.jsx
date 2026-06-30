import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/useStore'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES EDITABLES — ajusta posición y tamaño del orbe aquí
// ─────────────────────────────────────────────────────────────────────────────
const ORB_CONFIG = {
  bottom:     '37%',   // distancia desde el fondo de la pantalla
  size:       '100%',   // ancho del orbe relativo al contenedor
  maxWidth:   340,     // px máximo
  btnBottom:  '48%',   // posición del botón invisible sobre el orbe
  btnSize:    75,      // px del área táctil del botón
}

// ─────────────────────────────────────────────────────────────────────────────
// PREGUNTAS DEL ORBE — 6 preguntas, distintas a las de Fase 1
// ─────────────────────────────────────────────────────────────────────────────
const QUESTIONS = [
  {
    key: 'water',
    bold: 'El agua es el canal.',
    sub: '¿Cuánto líquido fluye por ti cada día?',
    feedback: '"Este canal será nuestro punto de encuentro."',
    options: [
      { v:'none',    emoji:'🏜️', label:'Casi nada — menos de 1 litro' },
      { v:'little',  emoji:'💧', label:'Lo justo — 1 a 1.5 litros' },
      { v:'enough',  emoji:'🌊', label:'Bien — 1.5 a 2 litros' },
      { v:'flowing', emoji:'🌀', label:'Fluyo — más de 2 litros' },
    ],
  },
  {
    key: 'sleep',
    bold: 'El silencio es donde integramos.',
    sub: '¿Cuántas horas duermes normalmente?',
    feedback: '"Siento tu ritmo nocturno. Aprenderé a respirar con él."',
    options: [
      { v:'low',       emoji:'🌑', label:'Poco — menos de 5 horas' },
      { v:'irregular', emoji:'🌓', label:'Irregular — 5 a 6 horas' },
      { v:'enough',    emoji:'🌕', label:'Suficiente — 6 a 7 horas' },
      { v:'deep',      emoji:'✨', label:'Profundo — más de 7 horas' },
    ],
  },
  {
    key: 'movement',
    bold: 'El movimiento es el fuego que transforma.',
    sub: '¿Con qué frecuencia te mueves o haces ejercicio?',
    feedback: '"Tu fuego dará forma a lo que soy."',
    options: [
      { v:'never',     emoji:'🪨', label:'Casi nunca' },
      { v:'sometimes', emoji:'🌿', label:'Una o dos veces por semana' },
      { v:'regular',   emoji:'🔥', label:'Tres o cuatro veces' },
      { v:'daily',     emoji:'⚡', label:'Cada día es una oportunidad' },
    ],
  },
  {
    key: 'food',
    bold: 'La tierra que nos nutre.',
    sub: '¿Cómo describirías tu alimentación ahora mismo?',
    feedback: '"Construiré mis fuerzas con lo que tú me das."',
    options: [
      { v:'omnivore',    emoji:'🍖', label:'Como de todo — omnívoro' },
      { v:'vegetarian',  emoji:'🥦', label:'Vegetariano — sin carne' },
      { v:'vegan',       emoji:'🌱', label:'Vegano — sin productos animales' },
      { v:'mediterranean', emoji:'🫒', label:'Mediterránea — fresco y natural' },
      { v:'irregular',   emoji:'🌀', label:'Irregular — como lo que hay' },
    ],
  },
  {
    key: 'mind',
    bold: 'La mente abre el primer espacio.',
    sub: '¿Cómo está tu cabeza últimamente?',
    feedback: '"Tu estado mental será mi primera brújula."',
    options: [
      { v:'overwhelmed', emoji:'🌊', label:'Saturada — demasiadas cosas' },
      { v:'tired',       emoji:'😶', label:'Cansada — sin energía mental' },
      { v:'ok',          emoji:'🌿', label:'Bien — puedo con ello' },
      { v:'clear',       emoji:'✨', label:'Clara — lista para más' },
    ],
  },
  {
    key: 'intention',
    bold: 'La intención es el alma.',
    sub: '¿Qué te trajo hasta aquí?',
    feedback: '"Esa es la razón por la que latiré."',
    options: [
      { v:'family',    emoji:'👨‍👩‍👧', label:'Estar presente para quienes amo' },
      { v:'body',      emoji:'💪',    label:'Reconocerme cuando me miro' },
      { v:'health',    emoji:'🏥',    label:'Controlar algo que me preocupa' },
      { v:'energy',    emoji:'⚡',    label:'Tener más energía para lo que importa' },
      { v:'habits',    emoji:'🌱',    label:'Recuperar algo que perdí' },
      { v:'wellbeing', emoji:'🧘',    label:'Cuidarme por primera vez de verdad' },
    ],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// AUDIO HOOK
// ─────────────────────────────────────────────────────────────────────────────
function useAudio() {
  const ambientRef = useRef(null)
  const ctxRef     = useRef(null)

  function getCtx() {
    if (!ctxRef.current) ctxRef.current = new (window.AudioContext || window.webkitAudioContext)()
    return ctxRef.current
  }

  function startAmbient() {
    try {
      if (ambientRef.current) return
      const audio = new Audio('/audio/ambient-bowls.mp3')
      audio.loop = true; audio.volume = 0
      audio.play().catch(() => {})
      ambientRef.current = audio
      let v = 0
      const id = setInterval(() => { v = Math.min(v+0.015, 0.25); audio.volume = v; if(v>=0.25) clearInterval(id) }, 100)
    } catch {}
  }

  function stopAmbient() {
    const a = ambientRef.current; if (!a) return
    let v = a.volume
    const id = setInterval(() => { v = Math.max(v-0.03,0); a.volume=v; if(v<=0){clearInterval(id);a.pause();ambientRef.current=null} }, 80)
  }

  function playSound(src, vol=0.8) {
    try { const a = new Audio(src); a.volume=vol; a.play().catch(()=>{}) } catch {}
  }

  function playHeartbeat() {
    try {
      const ctx = getCtx()
      const beat = (t) => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain()
        osc.connect(gain); gain.connect(ctx.destination)
        osc.type = 'sine'; osc.frequency.value = 60
        gain.gain.setValueAtTime(0, t)
        gain.gain.linearRampToValueAtTime(0.25, t+0.04)
        gain.gain.exponentialRampToValueAtTime(0.001, t+0.25)
        osc.start(t); osc.stop(t+0.25)
      }
      beat(ctx.currentTime); beat(ctx.currentTime+0.22)
    } catch {}
  }

  function playTone(freq=528) {
    try {
      const ctx = getCtx()
      const osc = ctx.createOscillator(); const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.type = 'sine'; osc.frequency.value = freq
      gain.gain.setValueAtTime(0, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime+0.05)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+0.9)
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime+0.9)
    } catch {}
  }

  function playBrillo() {
    try {
      const ctx = getCtx()
      ;[528,639,741,852,963].forEach((f,i) => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain()
        osc.connect(gain); gain.connect(ctx.destination)
        osc.type = 'sine'; osc.frequency.value = f
        const t = ctx.currentTime + i*0.1
        gain.gain.setValueAtTime(0, t)
        gain.gain.linearRampToValueAtTime(0.12, t+0.05)
        gain.gain.exponentialRampToValueAtTime(0.001, t+1.2)
        osc.start(t); osc.stop(t+1.2)
      })
    } catch {}
  }

  return {
    startAmbient, stopAmbient, playHeartbeat, playTone, playBrillo,
    playButton:   () => playSound('/audio/boton.wav', 0.9),
    playDestello: () => playSound('/audio/destello.wav', 0.9),
    playApertura: () => playSound('/audio/apertura.wav', 0.8),
    playLock:     () => playSound('/audio/lock.wav', 0.8),
    playLiquidUp: () => playSound('/audio/liquid_up.wav', 0.75),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTES UI — glassmorphism + neumorphism
// ─────────────────────────────────────────────────────────────────────────────

// Card glassmorphism oscura
function GlassCard({ children, style={} }) {
  return (
    <div style={{
      background:'rgba(255,255,255,0.08)',
      backdropFilter:'blur(20px)',
      WebkitBackdropFilter:'blur(20px)',
      border:'1px solid rgba(255,255,255,0.15)',
      borderRadius:24,
      boxShadow:'0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
      ...style,
    }}>
      {children}
    </div>
  )
}

// Chip glassmorphism seleccionable
function GlassChip({ active, color='#2EC4B6', emoji, label, onClick }) {
  return (
    <motion.button whileTap={{ scale:0.95 }} onClick={onClick}
      style={{
        display:'flex', alignItems:'center', gap:8,
        padding:'10px 16px', borderRadius:20,
        border:`1.5px solid ${active ? color : 'rgba(255,255,255,0.12)'}`,
        background: active
          ? `rgba(${hexToRgb(color)},0.2)`
          : 'rgba(255,255,255,0.06)',
        backdropFilter:'blur(12px)',
        WebkitBackdropFilter:'blur(12px)',
        color: active ? color : 'rgba(255,255,255,0.6)',
        fontSize:13, fontWeight: active ? 700 : 500,
        cursor:'pointer', transition:'all 0.2s',
        boxShadow: active ? `0 2px 16px rgba(${hexToRgb(color)},0.3)` : 'none',
      }}>
      <span style={{ fontSize:16 }}>{emoji}</span>
      {label}
      {active && <span style={{ fontSize:11 }}>✓</span>}
    </motion.button>
  )
}

// Chip multiselección
function GlassChipMulti({ active, emoji, label, onClick }) {
  return (
    <motion.button whileTap={{ scale:0.95 }} onClick={onClick}
      style={{
        display:'flex', alignItems:'center', gap:8,
        padding:'10px 16px', borderRadius:20,
        border:`1.5px solid ${active ? '#2EC4B6' : 'rgba(255,255,255,0.12)'}`,
        background: active ? 'rgba(46,196,182,0.2)' : 'rgba(255,255,255,0.06)',
        backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)',
        color: active ? '#2EC4B6' : 'rgba(255,255,255,0.6)',
        fontSize:13, fontWeight: active ? 700 : 500,
        cursor:'pointer', transition:'all 0.2s',
      }}>
      <span style={{ fontSize:16 }}>{emoji}</span>
      {label}
    </motion.button>
  )
}

// Botón neumorphism claro
function NeuButton({ children, onClick, disabled, color='#2EC4B6', style={} }) {
  return (
    <motion.button whileTap={{ scale: disabled ? 1 : 0.97 }}
      onClick={disabled ? undefined : onClick}
      style={{
        width:'100%', padding:'15px', borderRadius:18,
        border:`1px solid ${disabled ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.25)'}`,
        background: disabled
          ? 'rgba(255,255,255,0.05)'
          : `linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.08))`,
        backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
        color: disabled ? 'rgba(255,255,255,0.25)' : 'white',
        fontSize:15, fontWeight:700,
        cursor: disabled ? 'default' : 'pointer',
        boxShadow: disabled ? 'none' : `0 4px 24px rgba(${hexToRgb(color)},0.3), inset 0 1px 0 rgba(255,255,255,0.2)`,
        transition:'all 0.3s',
        ...style,
      }}>
      {children}
    </motion.button>
  )
}

// Carrusel de opciones del orbe
function OptionCarousel({ options, value, onChange, energyColor }) {
  return (
    <div style={{
      display:'flex', flexDirection:'column', gap:6,
      maxHeight:'28vh', overflowY:'auto',
      WebkitOverflowScrolling:'touch', paddingRight:4,
    }}>
      {options.map(o => {
        const active = value === o.v
        return (
          <motion.button key={o.v} whileTap={{ scale:0.97 }} onClick={() => onChange(o.v)}
            style={{
              width:'100%', padding:'11px 16px', borderRadius:16, flexShrink:0,
              display:'flex', alignItems:'center', gap:12,
              border:`1.5px solid ${active ? energyColor : 'rgba(255,255,255,0.12)'}`,
              background: active
                ? `rgba(${hexToRgb(energyColor)},0.18)`
                : 'rgba(255,255,255,0.07)',
              backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)',
              cursor:'pointer', textAlign:'left', transition:'all 0.2s',
              boxShadow: active ? `0 2px 16px rgba(${hexToRgb(energyColor)},0.25), inset 0 1px 0 rgba(255,255,255,0.15)` : 'none',
            }}>
            <span style={{ fontSize:20, flexShrink:0 }}>{o.emoji}</span>
            <span style={{
              fontSize:13, flex:1, lineHeight:1.4,
              fontWeight: active ? 700 : 400,
              color: active ? energyColor : 'rgba(255,255,255,0.75)',
            }}>
              {o.label}
            </span>
            {active && (
              <div style={{ width:18, height:18, borderRadius:'50%', flexShrink:0,
                background: energyColor, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span style={{ fontSize:10, color:'white' }}>✓</span>
              </div>
            )}
          </motion.button>
        )
      })}
    </div>
  )
}

// Pregunta del protocolo
function ProtoQuestion({ label, hint, tooltip, onTooltip, children }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <p style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.9)',
          margin:0, flex:1, lineHeight:1.4 }}>{label}</p>
        {tooltip && (
          <button onClick={() => onTooltip?.(tooltip)}
            style={{ width:22, height:22, borderRadius:'50%', flexShrink:0,
              background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.25)',
              backdropFilter:'blur(8px)',
              color:'rgba(255,255,255,0.7)', fontSize:11, fontWeight:800,
              cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            ?
          </button>
        )}
      </div>
      {hint && (
        <p style={{ fontSize:11, color:'rgba(255,255,255,0.4)', margin:0, fontStyle:'italic' }}>
          {hint}
        </p>
      )}
      {children}
    </div>
  )
}

// Helper hex a rgb
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16)
  const g = parseInt(hex.slice(3,5),16)
  const b = parseInt(hex.slice(5,7),16)
  return `${r},${g},${b}`
}

// ─────────────────────────────────────────────────────────────────────────────
// PRELOAD IMÁGENES
// ─────────────────────────────────────────────────────────────────────────────
const PRELOAD_IMAGES = [
  '/panda/onboarding_door_closed.png',
  '/panda/onboarding_clouds.png',
  '/panda/orb_frame_0.png',
  '/panda/orb_door_opening.png',
  '/panda/orb_door_open_1.png',
  '/panda/orb_door_open_2.png',
  '/panda/orb_door_open_3.png',
  '/panda/orb_door_open_4.png',
  '/panda/orb_door_open_5.png',
  '/panda/orb_door_open_6.png',
  '/panda/panda_orb_baby.png',
  '/panda/pandi_new_born_cloud.png',
  '/panda/panda_base.png',
  '/panda/coach_explain_1.png',
  '/panda/panda_thinking.png',
  '/panda/encourage_1.png',
]

function preloadImages(urls) {
  urls.forEach(src => { const img = new Image(); img.src = src })
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function Onboarding() {
  const [phase,      setPhase]      = useState(-1)  // -1=gancho, 0-2=intro, 3=nombre, 4-9=orbe, 10=cierre orbe, 11=despertar, 12=nacido, 13=protocolo, 14=personalidad
  const [flash,      setFlash]      = useState(false)
  const [qStep,      setQStep]      = useState(0)
  const [loading,    setLoading]    = useState(false)
  const [started,    setStarted]    = useState(false)
  const [imgErrs,    setImgErrs]    = useState({})
  const [feedback,   setFeedback]   = useState(null)

  // Orbe
  const [orbActivated,  setOrbActivated]  = useState(false)
  const [orbOpening,    setOrbOpening]    = useState(false)  // mostrando orb_door_opening.png
  const [orbOpen,       setOrbOpen]       = useState(false)  // mostrando orb_door_open_X
  const [orbClosing,    setOrbClosing]    = useState(false)
  const [smoke,         setSmoke]         = useState(false)
  const [fillLevel,     setFillLevel]     = useState(0)      // 0-6

  // Protocolo
  const [protoBlock,    setProtoBlock]    = useState(1)
  const [tooltip,       setTooltip]       = useState(null)

  const { user, fetchProfile } = useStore()
  const navigate = useNavigate()
  const audio    = useAudio()

  const [form, setForm] = useState({
    name:'', birth_date:'', sex:'other',
    // Orbe (fase 2)
    water:'', sleep:'', movement:'', food:'', mind:'', intention:'',
    // Gancho (fase 1)
    goal_main:'', lifestyle:'',
    // Protocolo bloque A
    work_schedule:'', energy_style:'', intermittent_fasting:'', biphasic_sleep:'',
    // Protocolo bloque B
    primary_focus:'', coach_strictness:'', user_persona:'',
    // Protocolo bloque C
    smoker:'', allergies:[], dislikes:[],
    // Personalidad coach (fase 3)
    coach_persona:'',
  })
  const set    = (k,v) => setForm(f => ({...f, [k]:v}))
  const toggle = (k,v) => setForm(f => {
    const arr = f[k]||[]
    return {...f, [k]: arr.includes(v) ? arr.filter(x=>x!==v) : [...arr,v]}
  })

  // ── COLORES POR PREGUNTA ─────────────────────────────────────────────────
  const Q_COLORS = ['#64B5F6','#81C784','#FFB74D','#CE93D8','#F48FB1','#FFD54F']
  const energyColor = Q_COLORS[qStep] || '#2EC4B6'

  // ── PRELOAD ──────────────────────────────────────────────────────────────
  useEffect(() => {
    preloadImages(PRELOAD_IMAGES)
  }, [])

  // ── HANDLERS ────────────────────────────────────────────────────────────
  function handleFirstInteraction() {
    if (!started) { setStarted(true); audio.startAmbient() }
  }

  function startIntro() {
    handleFirstInteraction()
    audio.playButton()
    setPhase(0)                                    // puerta cerrada
    setTimeout(() => setPhase(1), 600)             // puerta sigue
    setTimeout(() => { setPhase(2); audio.playApertura() }, 2500)  // transición a nubes
    setTimeout(() => setPhase(3), 4500)            // nombre
  }

  function proceedFromName() {
    handleFirstInteraction()
    if (!form.name.trim()) return
    audio.playButton()
    setPhase(4)
    setQStep(0)
  }

  function activateOrb() {
    if (orbActivated) return
    handleFirstInteraction()
    try { navigator.vibrate?.([40,30,60]) } catch {}
    audio.playButton()
    setOrbActivated(true)
    // Destello
    setFlash(true)
    setTimeout(() => {
      setFlash(false)
      audio.playDestello()
    }, 100)
    // Smoke
    setSmoke(true)
    setTimeout(() => setSmoke(false), 2000)
    // Apertura
    setTimeout(() => {
      setOrbOpening(true)
      audio.playApertura()
    }, 600)
    setTimeout(() => {
      setOrbOpening(false)
      setOrbOpen(true)
    }, 2200)
  }

  function handleAnswer(key, value) {
    handleFirstInteraction()
    set(key, value)
    audio.playTone(440 + qStep * 80)
  }

  function nextQuestion() {
    handleFirstInteraction()
    const currentQ = QUESTIONS[qStep]
    if (!form[currentQ.key]) return
    audio.playLiquidUp()
    const newFill = fillLevel + 1
    setFillLevel(newFill)
    // Mostrar feedback brevemente
    setFeedback(currentQ.feedback)
    setTimeout(() => setFeedback(null), 1800)

    if (qStep < QUESTIONS.length - 1) {
      setTimeout(() => setQStep(q => q+1), 400)
    } else {
      // Completado — cerrar orbe
      setTimeout(() => {
        setOrbOpen(false)
        setOrbClosing(true)
        audio.playLock()
        setTimeout(() => {
          setOrbClosing(false)
          setOrbActivated(false)
          // Destello potente
          setFlash(true)
          audio.playDestello()
          audio.playApertura()
          audio.playBrillo()
          setTimeout(() => { setFlash(false); setPhase(11) }, 800)
        }, 1200)
      }, 600)
    }
  }

  function awakenPandi() {
    audio.playButton()
    setFlash(true)
    audio.playDestello()
    setTimeout(() => { setFlash(false); setPhase(12) }, 700)
  }

  function startProtocol() {
    audio.playTone(528)
    setPhase(13)
    setProtoBlock(1)
  }

  function nextBlock() {
    audio.playHeartbeat()
    if (protoBlock < 3) setProtoBlock(b=>b+1)
    else setPhase(14)
  }

  async function finish() {
    setLoading(true)
    try {
      const userId = user.id
      const sleepMap    = { low:4, irregular:5.5, enough:7, deep:8 }
      const movementMap = { never:0, sometimes:1, regular:3, daily:5 }
      const strictMap   = { firm:0.9, soft:0.4, companion:0.1 }
      await supabase.from('user_profiles').update({
        name:             form.name,
        onboarding_done:  true,
        motivation_why:   form.intention    || null,
        primary_focus:    form.primary_focus|| form.goal_main || null,
        coach_strictness: strictMap[form.coach_strictness] ?? 0.5,
        energy_style:     form.energy_style || null,
        work_schedule:    form.work_schedule|| null,
        coach_persona:    form.coach_persona|| null,
        goal_main:        form.goal_main    || null,
        lifestyle:        form.lifestyle    || null,
      }).eq('id', userId)

      await supabase.from('health_profiles').upsert({
        user_id:                userId,
        diet_type:              form.food     || 'omnivore',
        sleep_hours:            sleepMap[form.sleep] || 7,
        training_days_per_week: movementMap[form.movement] || 2,
        smoker:                 form.smoker === 'yes',
        ex_smoker:              form.smoker === 'ex',
        intermittent_fasting:   form.intermittent_fasting === 'yes',
        biphasic_sleep:         form.biphasic_sleep === 'yes',
        allergies:              form.allergies,
        dietary_restrictions:   form.dislikes.join(', ') || null,
        onboarding_done:        true,
        onboarding_version:     5,
        onboarding_date:        new Date().toISOString(),
      }, { onConflict:'user_id' })

      await fetchProfile(userId)
      try { await api.email.welcome() } catch {}
      audio.stopAmbient()
      navigate('/')
    } catch(err) {
      console.error('Onboarding error:', err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── ORBE — frame actual ──────────────────────────────────────────────────
  const orbFrame = (() => {
    if (orbOpening)         return '/panda/orb_door_opening.png'
    if (orbOpen)            return `/panda/orb_door_open_${fillLevel + 1}.png`
    if (orbClosing)         return '/panda/orb_frame_0.png'
    if (orbActivated)       return '/panda/orb_frame_0.png'
    return '/panda/orb_frame_0.png'
  })()

  // ── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div style={{ position:'fixed', inset:0, overflow:'hidden',
      fontFamily:'-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* ── FLASH ── */}
      <AnimatePresence>
        {flash && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            transition={{ duration:0.15 }}
            style={{ position:'fixed', inset:0, zIndex:100,
              background:'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(201,169,110,0.8) 40%, transparent 70%)',
              pointerEvents:'none' }} />
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════
          FASE -1: GANCHO — objetivo + estilo de vida
      ══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {phase === -1 && (
          <motion.div key="gancho"
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:'fixed', inset:0, zIndex:30,
              background:'linear-gradient(160deg, #0a0f1e 0%, #141c35 50%, #0a1526 100%)',
              display:'flex', flexDirection:'column',
              alignItems:'center', justifyContent:'center',
              padding:'40px 20px', overflowY:'auto' }}>

            {/* Estrellas */}
            {[...Array(14)].map((_,i) => (
              <motion.div key={i}
                animate={{ opacity:[0,0.8,0], scale:[0,1,0] }}
                transition={{ duration:3+i*0.25, repeat:Infinity, delay:i*0.35 }}
                style={{ position:'absolute',
                  top:`${4+i*7}%`, left:`${3+i*7}%`,
                  width:2+(i%3), height:2+(i%3), borderRadius:'50%',
                  background: ['#FFD97D','#A78BFA','#2EC4B6'][i%3],
                  pointerEvents:'none' }} />
            ))}

            <div style={{ position:'relative', zIndex:2, width:'100%',
              maxWidth:420, display:'flex', flexDirection:'column', gap:28 }}>

              {/* Header */}
              <div style={{ textAlign:'center' }}>
                <motion.p animate={{ opacity:[0.5,1,0.5] }} transition={{ duration:3, repeat:Infinity }}
                  style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.4)',
                    textTransform:'uppercase', letterSpacing:'.15em', margin:'0 0 10px' }}>
                  Bienvenido a
                </motion.p>
                <h1 style={{ fontSize:30, fontWeight:900, color:'white', margin:'0 0 8px',
                  textShadow:'0 0 40px rgba(46,196,182,0.5)' }}>
                  Pandi Health Coach
                </h1>
                <p style={{ fontSize:13, color:'rgba(255,255,255,0.45)', margin:0 }}>
                  Dos preguntas antes de despertar a Pandi.
                </p>
              </div>

              {/* Objetivo */}
              <GlassCard style={{ padding:'20px' }}>
                <p style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.8)',
                  margin:'0 0 14px', textAlign:'center' }}>
                  ¿Qué quieres conseguir?
                </p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {[
                    { v:'health',  emoji:'🏥', label:'Mejorar mi salud' },
                    { v:'energy',  emoji:'⚡', label:'Más energía' },
                    { v:'body',    emoji:'💪', label:'Cambiar mi cuerpo' },
                    { v:'mind',    emoji:'🧘', label:'Calma mental' },
                    { v:'habits',  emoji:'🌱', label:'Crear hábitos' },
                    { v:'weight',  emoji:'⚖️', label:'Controlar el peso' },
                  ].map(o => (
                    <GlassChip key={o.v} active={form.goal_main===o.v}
                      color="#2EC4B6" emoji={o.emoji} label={o.label}
                      onClick={() => set('goal_main', o.v)} />
                  ))}
                </div>
              </GlassCard>

              {/* Estilo de vida */}
              <GlassCard style={{ padding:'20px' }}>
                <p style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.8)',
                  margin:'0 0 14px', textAlign:'center' }}>
                  ¿Cómo es tu vida?
                </p>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {[
                    { v:'busy',      emoji:'🌪️', label:'Muy ocupado/a — poco tiempo para mí' },
                    { v:'balanced',  emoji:'⚖️', label:'Bastante equilibrado/a' },
                    { v:'sedentary', emoji:'🛋️', label:'Sedentario/a — quiero cambiar' },
                    { v:'active',    emoji:'🏃', label:'Activo/a — quiero optimizar' },
                  ].map(o => (
                    <GlassChip key={o.v} active={form.lifestyle===o.v}
                      color="#A78BFA" emoji={o.emoji} label={o.label}
                      onClick={() => set('lifestyle', o.v)} />
                  ))}
                </div>
              </GlassCard>

              <NeuButton onClick={startIntro} disabled={!form.goal_main || !form.lifestyle}>
                Despertar a Pandi ✨
              </NeuButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════
          FASES 0-2: INTRO ANIMADA — puerta → nubes
      ══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {phase >= 0 && phase <= 3 && (
          <motion.div key="intro-bg"
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:'fixed', inset:0, zIndex:10 }}>
            {/* Puerta cerrada → nubes */}
            <AnimatePresence mode="wait">
              {phase <= 1 ? (
                <motion.img key="door" src="/panda/onboarding_door_closed.png"
                  initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                  transition={{ duration:0.8 }}
                  style={{ width:'100%', height:'100%', objectFit:'cover' }}
                  onError={e => e.target.style.display='none'} />
              ) : (
                <motion.img key="clouds" src="/panda/onboarding_clouds.png"
                  initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                  transition={{ duration:1.2 }}
                  style={{ width:'100%', height:'100%', objectFit:'cover' }}
                  onError={e => e.target.style.display='none'} />
              )}
            </AnimatePresence>

            {/* Overlay oscuro */}
            <div style={{ position:'absolute', inset:0,
              background:'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.5) 100%)' }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════
          FASE 3: NOMBRE
      ══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {phase === 3 && (
          <motion.div key="name-phase"
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:'fixed', inset:0, zIndex:20,
              display:'flex', flexDirection:'column',
              alignItems:'center', justifyContent:'flex-end',
              paddingBottom:'20%', padding:'0 24px 20%' }}>

            <GlassCard style={{ width:'100%', maxWidth:400, padding:'28px 24px' }}>
              <p style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.5)',
                textTransform:'uppercase', letterSpacing:'.1em', margin:'0 0 8px', textAlign:'center' }}>
                Antes de comenzar
              </p>
              <p style={{ fontSize:20, fontWeight:900, color:'white',
                margin:'0 0 6px', textAlign:'center' }}>
                ¿Cómo te llamas?
              </p>
              <p style={{ fontSize:13, color:'rgba(255,255,255,0.5)',
                margin:'0 0 20px', textAlign:'center' }}>
                Pandi aprenderá a conocerte.
              </p>
              <input
                value={form.name}
                onChange={e => set('name', e.target.value)}
                onKeyDown={e => e.key==='Enter' && proceedFromName()}
                placeholder="Tu nombre..."
                autoFocus
                style={{
                  width:'100%', padding:'14px 18px', borderRadius:16,
                  border:'1px solid rgba(255,255,255,0.2)',
                  background:'rgba(255,255,255,0.1)',
                  backdropFilter:'blur(12px)',
                  color:'white', fontSize:16, fontWeight:600,
                  outline:'none', boxSizing:'border-box',
                  boxShadow:'inset 0 2px 8px rgba(0,0,0,0.2)',
                  marginBottom:14,
                }}
              />
              <NeuButton onClick={proceedFromName} disabled={!form.name.trim()}>
                Continuar →
              </NeuButton>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════
          FASES 4-10: ORBE + PREGUNTAS
      ══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {phase >= 4 && phase <= 10 && (
          <motion.div key="orb-phase"
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:'fixed', inset:0, zIndex:20 }}>

            {/* Fondo nubes */}
            <img src="/panda/onboarding_clouds.png" alt=""
              style={{ position:'absolute', inset:0, width:'100%', height:'100%',
                objectFit:'cover', zIndex:0 }}
              onError={e => e.target.style.display='none'} />
            <div style={{ position:'absolute', inset:0, zIndex:1,
              background:'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.6) 100%)' }} />

            {/* ORBE */}
            <div style={{ position:'absolute', zIndex:3,
              bottom: ORB_CONFIG.bottom,
              left:'50%', transform:'translateX(-50%)',
              width: ORB_CONFIG.size,
              maxWidth: ORB_CONFIG.maxWidth }}>

              {/* Smoke effect */}
              <AnimatePresence>
                {smoke && [...Array(6)].map((_,i) => (
                  <motion.div key={i}
                    initial={{ opacity:0.6, scale:0.3, x:(Math.random()-0.5)*40 }}
                    animate={{ opacity:0, scale:2.5, translateY:-80 }}
                    exit={{ opacity:0 }}
                    transition={{ duration:1.8+i*0.2, ease:'easeOut' }}
                    style={{ position:'absolute', bottom:'40%',
                      left:`${35+i*6}%`, width:16+i*4, height:16+i*4,
                      borderRadius:'50%', background:'rgba(255,255,255,0.5)',
                      filter:'blur(6px)', pointerEvents:'none', zIndex:5 }} />
                ))}
              </AnimatePresence>

              {/* Frame del orbe */}
              <AnimatePresence mode="wait">
                <motion.img key={orbFrame}
                  src={orbFrame}
                  initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                  transition={{ duration:0.4 }}
                  style={{ width:'100%', height:'auto', objectFit:'contain', display:'block' }}
                  onError={e => { setImgErrs(p=>({...p,[orbFrame]:1})); e.target.style.display='none' }} />
              </AnimatePresence>

              {/* Botón invisible sobre el orbe — ajusta ORB_CONFIG.btnBottom */}
              {!orbActivated && (
                <div onClick={activateOrb}
                  style={{
                    position:'absolute',
                    bottom: ORB_CONFIG.btnBottom,
                    left:'50%', transform:'translateX(-50%)',
                    width: ORB_CONFIG.btnSize,
                    height: ORB_CONFIG.btnSize,
                    borderRadius:'50%', cursor:'pointer', zIndex:10,
                    // Descomenta para ver el botón mientras ajustas:
                    // background:'rgba(255,0,0,0.3)',
                  }} />
              )}
            </div>

            {/* Panel de pregunta */}
            <AnimatePresence mode="wait">
              {orbOpen && (
                <motion.div key={`q-${qStep}`}
                  initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                  style={{
                    position:'absolute', top:0, left:0, right:0, zIndex:4,
                    padding:'calc(env(safe-area-inset-top,0px) + 20px) 20px 16px',
                  }}>

                  {/* Progreso */}
                  <div style={{ display:'flex', gap:4, marginBottom:16 }}>
                    {QUESTIONS.map((_,i) => (
                      <motion.div key={i}
                        animate={{ background: i <= qStep ? energyColor : 'rgba(255,255,255,0.2)' }}
                        style={{ flex:1, height:3, borderRadius:2 }} />
                    ))}
                  </div>

                  <GlassCard style={{ padding:'20px' }}>
                    <p style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.5)',
                      textTransform:'uppercase', letterSpacing:'.08em', margin:'0 0 6px' }}>
                      Pregunta {qStep+1} de {QUESTIONS.length}
                    </p>
                    <p style={{ fontSize:17, fontWeight:900, color:'white',
                      margin:'0 0 4px', lineHeight:1.3 }}>
                      {QUESTIONS[qStep].bold}
                    </p>
                    <p style={{ fontSize:12, color:'rgba(255,255,255,0.55)',
                      margin:'0 0 14px', fontStyle:'italic' }}>
                      {QUESTIONS[qStep].sub}
                    </p>

                    <OptionCarousel
                      options={QUESTIONS[qStep].options}
                      value={form[QUESTIONS[qStep].key]}
                      onChange={v => handleAnswer(QUESTIONS[qStep].key, v)}
                      energyColor={energyColor}
                    />

                    <motion.button whileTap={{ scale:0.97 }}
                      onClick={nextQuestion}
                      disabled={!form[QUESTIONS[qStep].key]}
                      style={{
                        width:'100%', marginTop:14, padding:'13px', borderRadius:16,
                        border:`1px solid ${form[QUESTIONS[qStep].key] ? energyColor+'60' : 'rgba(255,255,255,0.1)'}`,
                        background: form[QUESTIONS[qStep].key]
                          ? `rgba(${hexToRgb(energyColor)},0.25)`
                          : 'rgba(255,255,255,0.05)',
                        backdropFilter:'blur(12px)',
                        color: form[QUESTIONS[qStep].key] ? energyColor : 'rgba(255,255,255,0.3)',
                        fontSize:14, fontWeight:700, cursor:'pointer',
                        boxShadow: form[QUESTIONS[qStep].key]
                          ? `0 4px 20px rgba(${hexToRgb(energyColor)},0.3), inset 0 1px 0 rgba(255,255,255,0.15)`
                          : 'none',
                        transition:'all 0.2s',
                      }}>
                      {qStep < QUESTIONS.length-1 ? 'Continuar →' : 'Completar ✨'}
                    </motion.button>
                  </GlassCard>

                  {/* Feedback */}
                  <AnimatePresence>
                    {feedback && (
                      <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                        style={{ textAlign:'center', fontSize:12, color:'rgba(255,255,255,0.6)',
                          fontStyle:'italic', marginTop:10 }}>
                        {feedback}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* Estado inicial — instrucción pulsar orbe */}
              {!orbActivated && !orbOpen && (
                <motion.div key="tap-hint"
                  initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                  style={{ position:'absolute', bottom:'8%', left:0, right:0,
                    display:'flex', justifyContent:'center', zIndex:4, padding:'0 20px' }}>
                  <GlassCard style={{ padding:'14px 24px', textAlign:'center' }}>
                    <motion.p animate={{ opacity:[0.6,1,0.6] }}
                      transition={{ duration:2, repeat:Infinity }}
                      style={{ fontSize:14, color:'rgba(255,255,255,0.8)',
                        fontWeight:600, margin:0 }}>
                      Toca el orbe para comenzar ✨
                    </motion.p>
                  </GlassCard>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════
          FASE 11: DESPERTAR — panda_orb_baby.png
      ══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {phase === 11 && (
          <motion.div key="awaken"
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:'fixed', inset:0, zIndex:20,
              background:'radial-gradient(circle at 50% 60%, #1a2340 0%, #0a0f1e 100%)',
              display:'flex', flexDirection:'column',
              alignItems:'center', justifyContent:'center', padding:'40px 24px' }}>

            {/* Aura */}
            <motion.div
              animate={{ scale:[1,1.15,1], opacity:[0.3,0.6,0.3] }}
              transition={{ duration:3, repeat:Infinity }}
              style={{ position:'absolute', width:280, height:280, borderRadius:'50%',
                background:'radial-gradient(circle, rgba(201,169,110,0.4), transparent 70%)',
                filter:'blur(30px)' }} />

            <motion.img src="/panda/panda_orb_baby.png" alt="Pandi nace"
              animate={{ scale:[0.9,1,0.9] }}
              transition={{ duration:3, repeat:Infinity, ease:'easeInOut' }}
              style={{ width:'70%', maxWidth:280, objectFit:'contain',
                position:'relative', zIndex:2 }}
              onError={e => e.target.style.display='none'} />

            <GlassCard style={{ padding:'24px', marginTop:24, textAlign:'center', width:'100%', maxWidth:360 }}>
              <p style={{ fontSize:22, fontWeight:900, color:'white', margin:'0 0 6px' }}>
                ¡Ha nacido!
              </p>
              <p style={{ fontSize:14, color:'rgba(255,255,255,0.6)', margin:'0 0 20px', lineHeight:1.6 }}>
                {form.name.split(' ')[0]}, tu compañero de bienestar está listo para crecer contigo.
              </p>
              <NeuButton onClick={awakenPandi} color="#C9A96E">
                Despertar a Pandi 🐾
              </NeuButton>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════
          FASE 12: NACIDO — pandi_new_born_cloud.png
      ══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {phase === 12 && (
          <motion.div key="born"
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:'fixed', inset:0, zIndex:20,
              background:'linear-gradient(160deg, #0f1729 0%, #1a2340 60%, #0d1f35 100%)',
              display:'flex', flexDirection:'column',
              alignItems:'center', justifyContent:'center', padding:'40px 24px' }}>

            <motion.img src="/panda/pandi_new_born_cloud.png" alt="Pandi flotando"
              animate={{ translateY:[0,-12,0] }}
              transition={{ duration:3, repeat:Infinity, ease:'easeInOut' }}
              style={{ width:'80%', maxWidth:320, objectFit:'contain', marginBottom:24 }}
              onError={e => e.target.style.display='none'} />

            <GlassCard style={{ padding:'24px', textAlign:'center', width:'100%', maxWidth:360 }}>
              <p style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.4)',
                textTransform:'uppercase', letterSpacing:'.1em', margin:'0 0 10px' }}>
                Protocolo de Cuidado
              </p>
              <p style={{ fontSize:20, fontWeight:900, color:'white', margin:'0 0 8px' }}>
                Ahora déjame conocerte mejor
              </p>
              <p style={{ fontSize:13, color:'rgba(255,255,255,0.55)', margin:'0 0 20px', lineHeight:1.6 }}>
                Unas preguntas rápidas para que Pandi sepa exactamente cómo cuidarte.
              </p>
              <NeuButton onClick={startProtocol}>
                Empezar a crecer juntos 🌱
              </NeuButton>
              <button onClick={finish}
                style={{ marginTop:12, background:'none', border:'none', cursor:'pointer',
                  color:'rgba(255,255,255,0.25)', fontSize:12, fontWeight:600, width:'100%' }}>
                Saltar por ahora
              </button>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════
          FASE 13: PROTOCOLO DE CUIDADO
      ══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {phase === 13 && (
          <motion.div key="protocol"
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:'fixed', inset:0, zIndex:30,
              background:'linear-gradient(160deg, #0f1729 0%, #1a2340 50%, #0d1f35 100%)',
              display:'flex', flexDirection:'column', overflow:'hidden' }}>

            <div style={{ position:'absolute', inset:0, zIndex:0,
              backgroundImage:"url('/panda/onboarding_clouds.png')",
              backgroundSize:'cover', backgroundPosition:'top center',
              opacity:0.2, pointerEvents:'none' }} />

            {/* Partículas */}
            {[...Array(8)].map((_,i) => (
              <motion.div key={i}
                animate={{ opacity:[0,0.6,0], scale:[0,1,0] }}
                transition={{ duration:3+i*0.4, repeat:Infinity, delay:i*0.5 }}
                style={{ position:'absolute',
                  top:`${10+i*10}%`, left:`${5+i*12}%`,
                  width:3+i%3*2, height:3+i%3*2, borderRadius:'50%',
                  background: i%2===0 ? '#FFD97D' : '#A78BFA',
                  pointerEvents:'none', zIndex:1 }} />
            ))}

            <div style={{ position:'relative', zIndex:2, flex:1,
              display:'flex', flexDirection:'column', overflowY:'auto',
              padding:'calc(env(safe-area-inset-top,0px) + 20px) 20px 32px', gap:16 }}>

              {/* Pandi + burbuja */}
              <AnimatePresence mode="wait">
                <motion.div key={`block-${protoBlock}`}
                  initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                  style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <img
                    src={protoBlock===1 ? '/panda/coach_explain_1.png'
                       : protoBlock===2 ? '/panda/panda_thinking.png'
                       : '/panda/encourage_1.png'}
                    alt="Pandi"
                    style={{ width:68, height:68, objectFit:'contain', flexShrink:0 }}
                    onError={e => e.target.style.display='none'} />
                  <GlassCard style={{ flex:1, padding:'12px 14px',
                    borderRadius:'0 18px 18px 18px' }}>
                    <p style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.45)',
                      textTransform:'uppercase', letterSpacing:'.07em', margin:'0 0 3px' }}>
                      {protoBlock===1 ? 'Tu energía y tiempo'
                     : protoBlock===2 ? 'Cómo quieres que sea Pandi'
                     : 'Protocolo de seguridad'}
                    </p>
                    <p style={{ fontSize:12, color:'rgba(255,255,255,0.85)',
                      lineHeight:1.5, margin:0, fontStyle:'italic' }}>
                      {protoBlock===1
                        ? `Para adaptar tus rutinas a tu vida real, ${form.name.split(' ')[0]}.`
                        : protoBlock===2
                        ? 'Así sabré cómo acompañarte en cada momento.'
                        : 'Necesito saber esto para cuidarte bien. Todo queda entre nosotros.'}
                    </p>
                  </GlassCard>
                </motion.div>
              </AnimatePresence>

              {/* Progreso A/B/C */}
              <div style={{ display:'flex', gap:8 }}>
                {['A','B','C'].map((l,i) => (
                  <div key={l} style={{ flex:1, display:'flex', flexDirection:'column', gap:4, alignItems:'center' }}>
                    <div style={{ height:3, width:'100%', borderRadius:2,
                      background: i+1<protoBlock ? '#2EC4B6'
                                : i+1===protoBlock ? 'rgba(255,255,255,0.7)'
                                : 'rgba(255,255,255,0.15)' }} />
                    <span style={{ fontSize:9, fontWeight:700, letterSpacing:'.06em',
                      color: i+1<=protoBlock ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)' }}>
                      {l}
                    </span>
                  </div>
                ))}
              </div>

              {/* Contenido por bloque */}
              <AnimatePresence mode="wait">

                {/* BLOQUE A */}
                {protoBlock===1 && (
                  <motion.div key="blockA"
                    initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                    style={{ display:'flex', flexDirection:'column', gap:18 }}>

                    <ProtoQuestion label="¿Cuál es tu horario de trabajo?">
                      <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                        {[
                          { v:'morning',   emoji:'🌅', label:'Mañanas' },
                          { v:'afternoon', emoji:'☀️', label:'Tardes' },
                          { v:'night',     emoji:'🌙', label:'Noches' },
                          { v:'variable',  emoji:'🌀', label:'Variable' },
                          { v:'remote',    emoji:'🏠', label:'En casa' },
                        ].map(o => (
                          <GlassChip key={o.v} active={form.work_schedule===o.v}
                            emoji={o.emoji} label={o.label}
                            onClick={() => set('work_schedule', o.v)} />
                        ))}
                      </div>
                    </ProtoQuestion>

                    <ProtoQuestion label="¿Cuándo tienes más energía para ti?">
                      <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                        {[
                          { v:'morning_person', emoji:'🌅', label:'Por la mañana' },
                          { v:'midday',         emoji:'☀️', label:'A mediodía' },
                          { v:'night_owl',      emoji:'🌙', label:'Por la noche' },
                        ].map(o => (
                          <GlassChip key={o.v} active={form.energy_style===o.v}
                            emoji={o.emoji} label={o.label}
                            onClick={() => set('energy_style', o.v)} />
                        ))}
                      </div>
                    </ProtoQuestion>

                    <ProtoQuestion label="¿Haces ayuno intermitente?"
                      tooltip="Periodos sin comer para que el cuerpo se regenere. Ejemplo: comer solo entre las 12h y las 20h."
                      onTooltip={setTooltip}>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                        {[
                          { v:'yes',     emoji:'⏱️', label:'Sí' },
                          { v:'no',      emoji:'🍽️', label:'No' },
                          { v:'curious', emoji:'🤔', label:'Me interesa' },
                        ].map(o => (
                          <GlassChip key={o.v} active={form.intermittent_fasting===o.v}
                            emoji={o.emoji} label={o.label}
                            onClick={() => set('intermittent_fasting', o.v)} />
                        ))}
                      </div>
                    </ProtoQuestion>

                    <ProtoQuestion label="¿Tienes sueño bifásico?"
                      tooltip="Dormir en dos periodos: por ejemplo, siesta corta + noche completa. Es un patrón natural en muchas personas."
                      onTooltip={setTooltip}>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                        {[
                          { v:'yes', emoji:'😴', label:'Sí, duermo en dos fases' },
                          { v:'no',  emoji:'💤', label:'No, solo noche' },
                        ].map(o => (
                          <GlassChip key={o.v} active={form.biphasic_sleep===o.v}
                            emoji={o.emoji} label={o.label}
                            onClick={() => set('biphasic_sleep', o.v)} />
                        ))}
                      </div>
                    </ProtoQuestion>
                  </motion.div>
                )}

                {/* BLOQUE B */}
                {protoBlock===2 && (
                  <motion.div key="blockB"
                    initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                    style={{ display:'flex', flexDirection:'column', gap:18 }}>

                    <ProtoQuestion label="¿Qué quieres fortalecer primero?">
                      <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                        {[
                          { v:'nutrition', emoji:'🥗', label:'Nutrición' },
                          { v:'exercise',  emoji:'💪', label:'Ejercicio' },
                          { v:'calm',      emoji:'🧘', label:'Calma mental' },
                          { v:'sleep',     emoji:'😴', label:'Sueño' },
                        ].map(o => (
                          <GlassChip key={o.v} active={form.primary_focus===o.v}
                            emoji={o.emoji} label={o.label}
                            onClick={() => set('primary_focus', o.v)} />
                        ))}
                      </div>
                    </ProtoQuestion>

                    <ProtoQuestion label="¿Cómo es tu ritmo de vida?">
                      <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                        {[
                          { v:'chaotic',     emoji:'🌪️', label:'Muy caótico' },
                          { v:'structured',  emoji:'📅', label:'Con rutina' },
                          { v:'spontaneous', emoji:'🌊', label:'Improvisado' },
                        ].map(o => (
                          <GlassChip key={o.v} active={form.user_persona===o.v}
                            emoji={o.emoji} label={o.label}
                            onClick={() => set('user_persona', o.v)} />
                        ))}
                      </div>
                    </ProtoQuestion>

                    <ProtoQuestion label="Cuando las cosas se ponen difíciles, ¿qué necesitas?">
                      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                        {[
                          { v:'firm',      emoji:'🔥', label:'Un empujón firme — no me dejes rendirme' },
                          { v:'soft',      emoji:'🌿', label:'Un recordatorio suave — sin presión' },
                          { v:'companion', emoji:'🤍', label:'Que solo esté ahí — sin consejos' },
                        ].map(o => (
                          <GlassChip key={o.v} active={form.coach_strictness===o.v}
                            emoji={o.emoji} label={o.label}
                            onClick={() => set('coach_strictness', o.v)} />
                        ))}
                      </div>
                    </ProtoQuestion>
                  </motion.div>
                )}

                {/* BLOQUE C */}
                {protoBlock===3 && (
                  <motion.div key="blockC"
                    initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                    style={{ display:'flex', flexDirection:'column', gap:18 }}>

                    <ProtoQuestion label="¿Fumas actualmente?"
                      hint="Ajusta mis consejos de respiración y energía">
                      <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                        {[
                          { v:'yes', emoji:'🚬', label:'Sí' },
                          { v:'ex',  emoji:'🌱', label:'Lo dejé' },
                          { v:'no',  emoji:'✅', label:'No fumo' },
                        ].map(o => (
                          <GlassChip key={o.v} active={form.smoker===o.v}
                            emoji={o.emoji} label={o.label}
                            onClick={() => set('smoker', o.v)} />
                        ))}
                      </div>
                    </ProtoQuestion>

                    <ProtoQuestion label="¿Tienes alguna alergia alimentaria?">
                      <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                        {[
                          { v:'gluten',    emoji:'🌾', label:'Gluten' },
                          { v:'lactose',   emoji:'🥛', label:'Lácteos' },
                          { v:'nuts',      emoji:'🥜', label:'Frutos secos' },
                          { v:'shellfish', emoji:'🦐', label:'Marisco' },
                          { v:'egg',       emoji:'🥚', label:'Huevo' },
                          { v:'soy',       emoji:'🌱', label:'Soja' },
                          { v:'none',      emoji:'✅', label:'Ninguna' },
                        ].map(o => (
                          <GlassChipMulti key={o.v} active={form.allergies.includes(o.v)}
                            emoji={o.emoji} label={o.label}
                            onClick={() => toggle('allergies', o.v)} />
                        ))}
                      </div>
                    </ProtoQuestion>

                    <ProtoQuestion label="¿Hay alimentos que prefieres evitar?">
                      <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                        {[
                          { v:'spicy',    emoji:'🌶️', label:'Picante' },
                          { v:'pork',     emoji:'🐷', label:'Cerdo' },
                          { v:'fish',     emoji:'🐟', label:'Pescado' },
                          { v:'cilantro', emoji:'🌿', label:'Cilantro' },
                          { v:'broccoli', emoji:'🥦', label:'Brócoli' },
                          { v:'none',     emoji:'✅', label:'Como de todo' },
                        ].map(o => (
                          <GlassChipMulti key={o.v} active={form.dislikes.includes(o.v)}
                            emoji={o.emoji} label={o.label}
                            onClick={() => toggle('dislikes', o.v)} />
                        ))}
                      </div>
                    </ProtoQuestion>
                  </motion.div>
                )}
              </AnimatePresence>

              <NeuButton onClick={nextBlock} disabled={loading}>
                {loading ? 'Configurando a Pandi…'
                  : protoBlock===3 ? '🐾 Activar mi Santuario'
                  : 'Continuar →'}
              </NeuButton>

              <button onClick={finish}
                style={{ marginTop:8, background:'none', border:'none', cursor:'pointer',
                  color:'rgba(255,255,255,0.25)', fontSize:12, fontWeight:600,
                  textAlign:'center', width:'100%' }}>
                Saltar por ahora
              </button>
            </div>

            {/* Tooltip */}
            <AnimatePresence>
              {tooltip && (
                <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                  onClick={() => setTooltip(null)}
                  style={{ position:'fixed', inset:0, zIndex:50,
                    background:'rgba(0,0,0,0.65)', backdropFilter:'blur(6px)',
                    display:'flex', alignItems:'center', justifyContent:'center', padding:32 }}>
                  <motion.div initial={{ scale:0.9 }} animate={{ scale:1 }}
                    onClick={e => e.stopPropagation()}
                    style={{ background:'rgba(255,255,255,0.1)',
                      backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)',
                      border:'1px solid rgba(255,255,255,0.2)',
                      borderRadius:24, padding:'24px 20px', maxWidth:320, textAlign:'center' }}>
                    <p style={{ fontSize:32, margin:'0 0 12px' }}>💡</p>
                    <p style={{ fontSize:14, color:'white', lineHeight:1.7, margin:'0 0 20px' }}>
                      {tooltip}
                    </p>
                    <button onClick={() => setTooltip(null)}
                      style={{ padding:'10px 28px', borderRadius:14,
                        background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.25)',
                        color:'white', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                      Entendido
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════
          FASE 14: PERSONALIDAD DEL COACH
      ══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {phase === 14 && (
          <motion.div key="personality"
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:'fixed', inset:0, zIndex:30,
              background:'linear-gradient(160deg, #0f1729 0%, #1a2340 50%, #0d1f35 100%)',
              display:'flex', flexDirection:'column', overflow:'hidden' }}>

            <div style={{ position:'absolute', inset:0,
              backgroundImage:"url('/panda/onboarding_clouds.png')",
              backgroundSize:'cover', backgroundPosition:'top center',
              opacity:0.15, pointerEvents:'none' }} />

            <div style={{ position:'relative', zIndex:2, flex:1,
              display:'flex', flexDirection:'column', justifyContent:'center',
              padding:'40px 20px', gap:24, overflowY:'auto' }}>

              {/* Pandi + burbuja */}
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <img src="/panda/panda_base.png" alt="Pandi"
                  style={{ width:76, height:76, objectFit:'contain', flexShrink:0 }}
                  onError={e => e.target.style.display='none'} />
                <GlassCard style={{ flex:1, padding:'12px 14px',
                  borderRadius:'0 18px 18px 18px' }}>
                  <p style={{ fontSize:13, color:'white', lineHeight:1.6, margin:0, fontStyle:'italic' }}>
                    "Ya sé quién eres. Ahora dime cómo quieres que sea yo."
                  </p>
                </GlassCard>
              </div>

              <div style={{ textAlign:'center' }}>
                <p style={{ fontSize:22, fontWeight:900, color:'white', margin:'0 0 6px' }}>
                  Elige el estilo de tu coach
                </p>
                <p style={{ fontSize:13, color:'rgba(255,255,255,0.45)', margin:0 }}>
                  Puedes cambiarlo después en ajustes.
                </p>
              </div>

              {/* Cards personalidad */}
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {[
                  { v:'athlete',       emoji:'🔥', title:'Atleta / Modo Dios',
                    desc:'Directo, exigente y sin excusas. Te empuja cuando más lo necesitas.',
                    color:'#F97316' },
                  { v:'balanced',      emoji:'⚖️', title:'Equilibrado',
                    desc:'Motivación con sentido común. Celebra logros y te ayuda a levantarte.',
                    color:'#2EC4B6' },
                  { v:'compassionate', emoji:'🤍', title:'Comprensivo',
                    desc:'Escucha antes de hablar. Sin presiones ni juicios. Tu ritmo, siempre.',
                    color:'#A78BFA' },
                ].map(p => {
                  const active = form.coach_persona === p.v
                  return (
                    <motion.button key={p.v} whileTap={{ scale:0.97 }}
                      onClick={() => set('coach_persona', p.v)}
                      style={{
                        padding:'18px 16px', borderRadius:20, cursor:'pointer',
                        textAlign:'left', display:'flex', alignItems:'flex-start', gap:14,
                        border:`1.5px solid ${active ? p.color : 'rgba(255,255,255,0.12)'}`,
                        background: active
                          ? `rgba(${hexToRgb(p.color)},0.15)`
                          : 'rgba(255,255,255,0.06)',
                        backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)',
                        boxShadow: active
                          ? `0 4px 24px rgba(${hexToRgb(p.color)},0.3), inset 0 1px 0 rgba(255,255,255,0.1)`
                          : 'none',
                        transition:'all 0.25s',
                      }}>
                      <span style={{ fontSize:28, flexShrink:0 }}>{p.emoji}</span>
                      <div style={{ flex:1 }}>
                        <p style={{ fontSize:15, fontWeight:800,
                          color: active ? p.color : 'white', margin:'0 0 4px' }}>
                          {p.title}
                        </p>
                        <p style={{ fontSize:12, color:'rgba(255,255,255,0.5)',
                          lineHeight:1.5, margin:0 }}>
                          {p.desc}
                        </p>
                      </div>
                      {active && (
                        <div style={{ width:22, height:22, borderRadius:'50%', flexShrink:0,
                          background:p.color, display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <span style={{ fontSize:11, color:'white' }}>✓</span>
                        </div>
                      )}
                    </motion.button>
                  )
                })}
              </div>

              <NeuButton onClick={finish} disabled={!form.coach_persona || loading}>
                {loading ? 'Activando Santuario…' : '🐾 Comenzar con Pandi'}
              </NeuButton>

              <button onClick={finish}
                style={{ background:'none', border:'none', cursor:'pointer',
                  color:'rgba(255,255,255,0.25)', fontSize:12, fontWeight:600,
                  textAlign:'center', width:'100%' }}>
                Saltar por ahora
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Debug errores de imagen */}
      {Object.keys(imgErrs).length > 0 && (
        <div style={{ position:'fixed', top:8, left:8, zIndex:200,
          background:'rgba(0,0,0,0.75)', borderRadius:8, padding:'5px 10px',
          fontSize:10, color:'#ff6b6b' }}>
          ❌ {Object.keys(imgErrs).join(', ')}
        </div>
      )}
    </div>
  )
}
