import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/useStore'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'

// ─── AUDIO ────────────────────────────────────────────────────────────────────
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

  function playDoor() {
    try {
      const a = new Audio('/audio/apertura.wav')
      a.volume = 0.8
      a.play().catch(() => {})
    } catch {}
  }

  function playButton() {
    try {
      const a = new Audio('/audio/boton.wav')
      a.volume = 0.9
      a.play().catch(() => {})
    } catch {}
  }

  function playDestello() {
    try {
      const a = new Audio('/audio/destello.wav')
      a.volume = 0.85
      a.play().catch(() => {})
    } catch {}
  }

  function playBrillo() {
    try {
      const a = new Audio('/audio/brillo.flac')
      a.volume = 0.8
      a.play().catch(() => {})
    } catch {}
  }

  function playFlash() {
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

  useEffect(() => {
    function handleVisibility() {
      const a = ambientRef.current; if (!a) return
      if (document.hidden) { a.pause() } else { a.play().catch(()=>{}) }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  useEffect(() => () => stopAmbient(), [])
  return { startAmbient, stopAmbient, playHeartbeat, playTone, playFlash, playDoor, playButton, playDestello, playBrillo }
}

// ─── PREGUNTAS ────────────────────────────────────────────────────────────────
const QUESTIONS = [
  {
    key: 'mind',
    bold: '¿Tu mente está lista para esta aventura?',
    sub: 'La mente debe dar lugar a este nacimiento...',
    feedback: '"La mente abre el primer espacio."',
    options: [
      { v:'yes',    emoji:'🔥', label:'Sí, llevo tiempo esperando este momento' },
      { v:'unsure', emoji:'🌿', label:'No lo sé, pero aquí estoy' },
      { v:'scared', emoji:'🌊', label:'Tengo miedo, pero quiero intentarlo' },
    ],
  },
  {
    key: 'water',
    bold: 'El agua es el canal.',
    sub: 'El agua no me llena — me conecta.',
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
    sub: 'El cuerpo reconstruye lo que el día deshizo.',
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
    sub: 'El movimiento no desgasta. Transforma.',
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
    bold: 'Somos lo que elegimos nutrir.',
    sub: '¿De qué tierra vienes?',
    feedback: '"Esta es la base. Desde aquí construimos."',
    options: [
      { v:'omnivore',    emoji:'🍽️', label:'De todo un poco' },
      { v:'vegetarian',  emoji:'🥗', label:'Sin carne' },
      { v:'vegan',       emoji:'🌱', label:'Solo plantas' },
      { v:'pescatarian', emoji:'🐟', label:'Del mar' },
      { v:'keto',        emoji:'🥑', label:'Bajo en carbohidratos' },
      { v:'paleo',       emoji:'🍖', label:'Sin procesar' },
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

// ─── COMPONENTES PROTOCOLO ───────────────────────────────────────────────────

function ProtoQuestion({ label, hint, tooltip, children, onTooltip }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        <p style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.9)',
          margin:0, flex:1, lineHeight:1.4 }}>{label}</p>
        {tooltip && (
          <button onClick={() => onTooltip?.(tooltip)}
            style={{ width:22, height:22, borderRadius:'50%', flexShrink:0,
              background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.3)',
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

function ChipGroup({ options, value, onChange }) {
  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
      {options.map(o => {
        const active = value === o.v
        return (
          <motion.button key={o.v} whileTap={{ scale:0.94 }}
            onClick={() => onChange(o.v)}
            style={{
              display:'flex', alignItems:'center', gap:6,
              padding:'9px 14px', borderRadius:20,
              border:`1.5px solid ${active ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.15)'}`,
              background: active ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.07)',
              backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)',
              color: active ? 'white' : 'rgba(255,255,255,0.55)',
              fontSize:13, fontWeight: active ? 700 : 500,
              cursor:'pointer', transition:'all 0.2s',
              boxShadow: active ? '0 2px 12px rgba(255,255,255,0.1)' : 'none',
            }}>
            <span style={{ fontSize:16 }}>{o.emoji}</span>
            {o.label}
            {active && <span style={{ fontSize:12 }}>✓</span>}
          </motion.button>
        )
      })}
    </div>
  )
}

function ChipMulti({ options, values = [], onToggle }) {
  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
      {options.map(o => {
        const active = values.includes(o.v)
        return (
          <motion.button key={o.v} whileTap={{ scale:0.94 }}
            onClick={() => onToggle(o.v)}
            style={{
              display:'flex', alignItems:'center', gap:6,
              padding:'9px 14px', borderRadius:20,
              border:`1.5px solid ${active ? '#2EC4B6' : 'rgba(255,255,255,0.15)'}`,
              background: active ? 'rgba(46,196,182,0.2)' : 'rgba(255,255,255,0.07)',
              backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)',
              color: active ? '#2EC4B6' : 'rgba(255,255,255,0.55)',
              fontSize:13, fontWeight: active ? 700 : 500,
              cursor:'pointer', transition:'all 0.2s',
            }}>
            <span style={{ fontSize:16 }}>{o.emoji}</span>
            {o.label}
          </motion.button>
        )
      })}
    </div>
  )
}

// ─── CARRUSEL VERTICAL DE OPCIONES ───────────────────────────────────────────
function OptionCarousel({ options, value, onChange, energyColor }) {
  return (
    <div style={{
      display:'flex', flexDirection:'column', gap:5,
      maxHeight:'26vh',          // ajustado: cajas más bajas, cabe más en menos espacio
      minHeight: 0,
      overflowY:'auto',
      WebkitOverflowScrolling:'touch',
      paddingRight:4,
    }}>
      {options.map((o) => (
        <motion.button
          key={o.v}
          whileTap={{ scale:0.97 }}
          onClick={() => onChange(o.v)}
          style={{
            width:'100%', padding:'9px 14px',
            borderRadius:14, flexShrink:0,
            display:'flex', alignItems:'center', gap:10,
            border:`1.5px solid ${value===o.v ? energyColor : 'rgba(0,0,0,0.1)'}`,
            background: value===o.v ? `${energyColor}18` : 'rgba(255,255,255,0.88)',
            cursor:'pointer', textAlign:'left',
            transition:'all 0.2s',
            boxShadow:'0 1px 4px rgba(0,0,0,0.06)',
          }}>
          <span style={{ fontSize:18, flexShrink:0 }}>{o.emoji}</span>
          <span style={{
            fontSize:13, flex:1,
            fontWeight: value===o.v ? 700 : 500,
            color: value===o.v ? energyColor : '#1A2332',
          }}>
            {o.label}
          </span>
          {value===o.v && (
            <motion.span
              initial={{ scale:0 }} animate={{ scale:1 }}
              style={{ fontSize:14, color:energyColor, flexShrink:0 }}>✓</motion.span>
          )}
        </motion.button>
      ))}
    </div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function Onboarding() {
  const [phase,      setPhase]      = useState(0)
  const [flash,      setFlash]      = useState(false)
  const [openFading, setOpenFading] = useState(false)
  const [qStep,      setQStep]      = useState(0)
  const [loading,    setLoading]    = useState(false)
  const [started,    setStarted]    = useState(false)
  const [imgErrs,    setImgErrs]    = useState({})

  const { user, fetchProfile } = useStore()
  const navigate = useNavigate()
  const audio    = useAudio()

  const [form, setForm] = useState({
    name:'', birth_date:'', sex:'other',
    mind:'', water:'', sleep:'', movement:'', food:'', intention:'',
    // Bloque A — energía y tiempo
    work_schedule:'', energy_style:'', intermittent_fasting:'', biphasic_sleep:'',
    // Bloque B — coach
    primary_focus:'', coach_strictness:'', user_persona:'',
    // Bloque C — protocolo de seguridad
    smoker:'', allergies:[], dislikes:[],
    // Fase 1 — gancho
    goal_main:'', lifestyle:'',
    // Fase 14 — personalidad coach
    coach_persona:'',
  })
  const set    = (k, v) => setForm(f => ({...f, [k]:v}))
  const toggle = (k, v) => setForm(f => {
    const arr = f[k] || []
    return { ...f, [k]: arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v] }
  })

  // Fase protocolo post-nacimiento
  const [protoBlock,  setProtoBlock]  = useState(0)
  const [tooltip,     setTooltip]     = useState(null)

  const showGancho      = phase === -1  // Fase 1 nueva — antes del orbe
  const showProtocol    = phase === 13
  const showPersonality = phase === 14  // Fase 3 nueva — personalidad del coach

  const [orbActivated, setOrbActivated] = useState(false)
  const [orbOpened,    setOrbOpened]    = useState(false)
  const [orbClosing,   setOrbClosing]   = useState(false)
  const [smoke,        setSmoke]        = useState(false)
  const [fillLevel,    setFillLevel]    = useState(0)

  const showBlur   = phase >= 0 && phase <= 3
  const showOpen   = phase === 1 || (phase === 2 && !openFading)
  const showClouds = phase >= 4
  const showOrb    = phase >= 4 && phase <= 10
  const showAwaken = phase === 11
  const showBorn   = phase === 12

  // Arrancar en fase gancho (-1), luego ir a intro (0)
  useEffect(() => {
    setPhase(-1)
  }, [])

  function startIntro() {
    // Tras el gancho, arrancar la intro animada normal
    handleFirstInteraction()
    audio.playButton()
    setPhase(0)
    const t1 = setTimeout(() => setPhase(1), 800)
    const t2 = setTimeout(() => setPhase(2), 5000)
    const t3 = setTimeout(() => {
      setOpenFading(true)
      setTimeout(() => { setOpenFading(false); setPhase(3) }, 1200)
    }, 9000)
  }

  function handleFirstInteraction() {
    if (!started) { setStarted(true); audio.startAmbient() }
  }

  function proceedFromName() {
    handleFirstInteraction()
    if (!form.name.trim()) return
    setPhase(4)
    setQStep(0)
  }

  function handleAnswer(key, value) {
    handleFirstInteraction()
    set(key, value)
    audio.playTone(440 + qStep * 80)
  }

  function activateOrb() {
    if (orbActivated) return
    handleFirstInteraction()

    try { navigator.vibrate?.([40, 30, 60]) } catch {}

    audio.playButton()
    setTimeout(() => audio.playDoor(), 200)

    setSmoke(true)
    setTimeout(() => setSmoke(false), 2000)

    setOrbActivated(true)

    setTimeout(() => setOrbOpened(true), 1800)
  }

  function nextQuestion() {
    handleFirstInteraction()
    const currentQ = QUESTIONS[qStep]
    if (!form[currentQ.key]) return

    audio.playHeartbeat()
    const newFill = fillLevel + 1
    setFillLevel(newFill)

    if (qStep < QUESTIONS.length - 1) {
      setQStep(q => q + 1)
    } else {
      setFillLevel(6)
      setTimeout(() => {
        // El orbe se cierra antes del destello final
        setOrbClosing(true)
        setTimeout(() => {
          audio.playBrillo()
          audio.playDestello()
          setFlash(true)
          setTimeout(() => { setFlash(false); setPhase(11) }, 700)
        }, 900)
      }, 600)
    }
  }

  function awakenPandi() {
    audio.playButton()
    setTimeout(() => {
      audio.playDestello()
      setFlash(true)
      setTimeout(() => { setFlash(false); setPhase(12) }, 700)
    }, 100)
  }

  function startProtocol() {
    audio.playTone(528)
    setPhase(13)
    setProtoBlock(1)
  }

  function nextBlock() {
    audio.playHeartbeat()
    if (protoBlock < 3) {
      setProtoBlock(b => b + 1)
    } else {
      setPhase(14) // → personalidad del coach
    }
  }

  async function finish() {
    setLoading(true)
    try {
      const userId = user.id
      const sleepHours   = { low:4, irregular:5.5, enough:7, deep:8 }[form.sleep] || 7
      const trainingDays = { never:0, sometimes:1, regular:3, daily:5 }[form.movement] || 2
      const strictnessMap = { firm: 0.9, soft: 0.4, companion: 0.1 }

      await supabase.from('user_profiles').update({
        name:             form.name,
        onboarding_done:  true,
        motivation_why:   form.intention    || null,
        primary_focus:    form.primary_focus|| form.goal_main || null,
        coach_strictness: strictnessMap[form.coach_strictness] ?? 0.5,
        energy_style:     form.energy_style || null,
        work_schedule:    form.work_schedule|| null,
        coach_persona:    form.coach_persona|| null,
      }).eq('id', userId)

      await supabase.from('health_profiles').upsert({
        user_id:                userId,
        diet_type:              form.food     || 'omnivore',
        sleep_hours:            sleepHours,
        training_days_per_week: trainingDays,
        smoker:                 form.smoker   === 'yes',
        ex_smoker:              form.smoker   === 'ex',
        intermittent_fasting:   form.intermittent_fasting === 'yes',
        biphasic_sleep:         form.biphasic_sleep       === 'yes',
        allergies:              form.allergies,
        dietary_restrictions:   form.dislikes.join(', ') || null,
        onboarding_done:        true,
        onboarding_version:     4,
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

  const currentQ    = QUESTIONS[qStep]
  const energyColors = ['#A78BFA','#3B82F6','#8B5CF6','#F97316','#22C55E','#EC4899']
  const energyColor  = energyColors[qStep] || '#D4A847'

  return (
    <div style={{ position:'fixed', inset:0, overflow:'hidden', background:'#f5f0e8' }}
      onClick={handleFirstInteraction}>

      {/* ── FONDOS ── */}
<motion.img src="/panda/onboarding_orb_baby_blur.png" alt=""
  animate={{ opacity: showBlur ? 1 : 0 }}
  transition={{ duration:1.5 }}
  style={{ position:'absolute', inset:0, width:'100%', height:'100%', 
    objectFit:'cover', objectPosition:'top center', zIndex:1 }}
  onError={()=>setImgErrs(e=>({...e,blur:true}))}
/>
<motion.img src="/panda/onboarding_clouds.png" alt=""
  animate={{ opacity: showClouds ? 1 : 0 }}
  transition={{ duration:1.8, delay: showClouds ? 0.5 : 0 }}
  style={{ position:'absolute', inset:0, width:'100%', height:'100%',
    objectFit:'cover', objectPosition:'top center',
    zIndex: showClouds ? 3 : 0 }}
  onError={()=>setImgErrs(e=>({...e,clouds:true}))}
/>
      {/* ── ORB ── */}
<AnimatePresence>
  {showOrb && (
    <motion.div key="orb"
  initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
  transition={{ duration:1.2 }}
  style={{ 
    position:'absolute', inset:0, zIndex:15,
    display:'flex', flexDirection:'column',
    alignItems:'center',
    justifyContent:'flex-end',   // ← ancla desde abajo
    paddingBottom:'20vh',        // ← ajusta este valor para subir/bajar el orbe
  }}>
            {/* ── ZONA IMAGEN — altura fija, mismo patrón que Sanctuary del Home ── */}
            <div style={{
              position:'relative', height:'56vh', minHeight:300, maxHeight:480,
              flexShrink:0, overflow:'hidden',
              display:'flex', alignItems:'center', justifyContent:'center',
              pointerEvents: orbActivated ? 'none' : 'all',
            }}>

            {/* COLUMNA DE LUZ desde arriba */}
            <motion.div
              initial={{ opacity:0, scaleY:0 }}
              animate={{ opacity:[0,0.9,0.7], scaleY:1 }}
              transition={{ duration:2, ease:'easeOut' }}
              style={{
                position:'absolute',
                top:0, left:'50%',
                transform:'translateX(-50%)',
                width:'60vw', maxWidth:260,
                height:'70%',
                background: 'linear-gradient(to bottom, rgba(255,240,180,0.85) 0%, rgba(255,220,140,0.5) 60%, transparent 100%)',
                filter:'blur(10px)',
                transformOrigin:'top center',
                pointerEvents:'none',
              }}
            />

            {/* HALO exterior pulsante */}
            <motion.div
              animate={{ scale:[1,1.15,1], opacity:[0.15,0.35,0.15] }}
              transition={{ duration:3, repeat:Infinity, ease:'easeInOut' }}
              style={{
                position:'absolute',
                width:'80vw', maxWidth:340,
                height:'80vw', maxWidth2:340,
                borderRadius:'50%',
                background:'radial-gradient(circle, rgba(255,220,140,0.4) 0%, rgba(255,180,80,0.1) 50%, transparent 70%)',
                filter:'blur(20px)',
                pointerEvents:'none',
              }}
            />

            {/* PARTÍCULAS flotantes */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={`spark-${i}`}
                initial={{
                  x: (Math.random() - 0.5) * 160,
                  y: (Math.random() - 0.5) * 200,
                  opacity: 0, scale: 0,
                }}
                animate={{
                  y: [(Math.random()-0.5)*200, (Math.random()-0.5)*200 - 40],
                  opacity: [0, 0.8, 0],
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: 2.5 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 3,
                  ease: 'easeInOut',
                }}
                style={{
                  position:'absolute',
                  width: 3 + Math.random() * 4,
                  height: 3 + Math.random() * 4,
                  borderRadius:'50%',
                  background: i % 3 === 0 ? '#FFD97D' : i % 3 === 1 ? '#FFB347' : '#FFF5CC',
                  boxShadow: `0 0 6px 2px ${i % 2 === 0 ? 'rgba(255,220,140,0.8)' : 'rgba(255,180,80,0.6)'}`,
                  pointerEvents:'none',
                }}
              />
            ))}

            <motion.div
              initial={{ scale:0.7 }} style={{ translateY:40 }}
              animate={{ scale:1, y:0 }}
              transition={{ duration:1.4, type:'spring', damping:18 }}
              style={{ position:'absolute', inset:0,
                display:'flex', alignItems:'center', justifyContent:'center' }}>

              {/* Glow */}
              <motion.div
                animate={{ scale:[1,1.08,1], opacity:[0.3,0.6,0.3] }}
                transition={{ duration:3.5, repeat:Infinity }}
                style={{
                  position:'absolute', inset:-30, borderRadius:'50%',
                  background:'radial-gradient(circle, rgba(255,220,140,0.65) 0%, transparent 65%)',
                  filter:'blur(32px)',
                }}
              />

              {/* HUMO saliendo al activar */}
              <AnimatePresence>
                {smoke && (
                  <>
                    {[...Array(8)].map((_, i) => (
                      <motion.div key={`smoke-${i}`}
                        initial={{ opacity:0.7, scale:0.3, x:(Math.random()-0.5)*40 }}
                        animate={{ opacity:0, scale:2+Math.random(), x:(Math.random()-0.5)*80, y:-60-Math.random()*60 }}
                        exit={{ opacity:0 }}
                        transition={{ duration:1.2+Math.random()*0.8, delay:i*0.08, ease:'easeOut' }}
                        style={{
                          position:'absolute',
                          top:'30%', left:'50%',
                          width:20+Math.random()*20, height:20+Math.random()*20,
                          borderRadius:'50%',
                          background:'rgba(255,250,240,0.6)',
                          filter:'blur(8px)',
                          pointerEvents:'none',
                        }}
                      />
                    ))}
                  </>
                )}
              </AnimatePresence>

              {/* FRAMES DEL ORBE */}
              {showOrb && (() => {
                const frames = [
                  '/panda/orb_frame_0.png',
                  '/panda/orb_door_closed.png',
                  '/panda/orb_door_open.png',
                  '/panda/orb_door_open_1.png',
                  '/panda/orb_door_open_2.png',
                  '/panda/orb_door_open_3.png',
                  '/panda/orb_door_open_4.png',
                  '/panda/orb_door_open_5.png',
                  '/panda/orb_door_open_6.png',
                ]

                const activeFrame = !orbActivated
                  ? 0
                  : orbClosing
                  ? 1
                  : !orbOpened
                  ? 1
                  : fillLevel === 0
                  ? 2
                  : Math.min(fillLevel + 2, 8)

                return frames.map((src, i) => (
                  <motion.img
                    key={src} src={src} alt=""
                    animate={{ opacity: activeFrame === i ? 1 : 0 }}
                    transition={{ duration:0.8 }}
                    style={{
                      position:'absolute', inset:0, zIndex:15,
                      width:'100%', height:'100%',
                      pointerEvents:'none',
                      objectFit:'contain',
                      objectPosition:'center',
                    }}
                    onError={()=>setImgErrs(e=>({...e,[`f${i}`]:true}))}
                  />
                ))
              })()}

              {/* BOTÓN boton_1 — solo en fase inicial sin activar */}
              {!orbActivated && (
                <motion.button
                  animate={{ scale:[1,1.06,1], opacity:[0.8,1,0.8] }}
                  transition={{ duration:2, repeat:Infinity }}
                  onClick={activateOrb}
                  style={{
                    position: 'fixed',
                    bottom: 100,        // ← ajusta este número
                    left: '20%',
                    transform: 'translateX(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    zIndex: 25,
                    pointerEvents: 'all',
                  }}>
                  <img src="/panda/boton_1.png" alt="Despertar"
                    style={{ width:100, height:100, objectFit:'contain' }}
                    onError={e => {
                      e.target.style.display='none'
                    }}
                  />
                </motion.button>
              )}

            </motion.div>

            </div>
            {/* ── FIN ZONA IMAGEN ── */}

            {/* ── ZONA PREGUNTAS — flujo normal, scrollable, sin fixed/safe-area ── */}
            {orbOpened && !orbClosing && (
              <div style={{
                maxHeight: '45vh', minHeight:0, overflowY:'auto',
                padding:'8px 16px 24px',
                background:'linear-gradient(to top, rgba(245,240,232,0.97) 70%, transparent 100%)',
                backdropFilter:'blur(8px)',
              }}>

                {/* Texto pregunta */}
                <AnimatePresence mode="wait">
                  <motion.div key={`qt-${qStep}`}
                    initial={{ opacity:0 }} animate={{ opacity:1, translateY:0 }} style={{ translateY:6 }}
                    exit={{ opacity:0, y:-6 }} transition={{ duration:0.3 }}
                    style={{ marginBottom:8, textAlign:'center' }}>
                    <p style={{ fontSize:14, fontWeight:900, color:'#1A2332',
                      margin:'0 0 2px', lineHeight:1.2, whiteSpace:'pre-line' }}>
                      {currentQ.bold}
                    </p>
                    <p style={{ fontSize:11, color:'#6B7280', margin:0, fontStyle:'italic' }}>
                      {currentQ.sub}
                    </p>
                  </motion.div>
                </AnimatePresence>

                {/* Opciones */}
                <AnimatePresence mode="wait">
                  <motion.div key={`qs-${qStep}`}
                    initial={{ opacity:0 }} animate={{ opacity:1, translateY:0 }} style={{ translateY:8 }}
                    exit={{ opacity:0 }} transition={{ duration:0.25 }}>
                    <OptionCarousel
                      options={currentQ.options}
                      value={form[currentQ.key]}
                      onChange={v => handleAnswer(currentQ.key, v)}
                      energyColor={energyColor}
                    />
                  </motion.div>
                </AnimatePresence>

                {/* Feedback */}
                <AnimatePresence>
                  {form[currentQ.key] && (
                    <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                      style={{ fontSize:11, color:'#6B7280', fontStyle:'italic',
                        textAlign:'center', margin:'8px 0 0' }}>
                      {currentQ.feedback}
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* Progreso + botón */}
                <div style={{ display:'flex', gap:5, justifyContent:'center', margin:'10px 0 8px' }}>
                  {QUESTIONS.map((q, i) => (
                    <motion.div key={q.key}
                      animate={{
                        width: i===qStep ? 22 : 6,
                        background: i<qStep ? '#2EC4B6' : i===qStep ? energyColor : 'rgba(0,0,0,0.15)',
                      }}
                      style={{ height:3, borderRadius:2 }}
                      transition={{ duration:0.3 }}
                    />
                  ))}
                </div>

                <motion.button whileTap={{ scale: form[currentQ.key] ? 0.97 : 1 }}
                  onClick={nextQuestion}
                  disabled={!form[currentQ.key]}
                  style={{
                    width:'100%', padding:'13px 20px', borderRadius:16,
                    border:`1.5px solid ${form[currentQ.key] ? energyColor+'60' : 'rgba(0,0,0,0.1)'}`,
                    background: form[currentQ.key] ? `${energyColor}20` : 'rgba(0,0,0,0.05)',
                    color: form[currentQ.key] ? energyColor : 'rgba(0,0,0,0.25)',
                    fontSize:15, fontWeight:700,
                    cursor: form[currentQ.key] ? 'pointer' : 'default',
                    boxShadow: form[currentQ.key] ? `0 4px 20px ${energyColor}30` : 'none',
                    transition:'all 0.3s',
                    marginBottom: 'calc(env(safe-area-inset-bottom) + 4px)',
                  }}>
                  {qStep === QUESTIONS.length - 1 ? '✨ Despertar a Pandi' : 'Continuar →'}
                </motion.button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PANDA ORB — fase 11: despertar ── */}
      <AnimatePresence>
        {showAwaken && (
          <motion.div key="awaken"
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            transition={{ duration:1 }}
            style={{ position:'fixed', inset:0, zIndex:15,
              display:'flex', alignItems:'center', justifyContent:'center',
              flexDirection:'column', gap:0 }}>

            <motion.div
              initial={{ scale:0.8 }} animate={{ scale:1 }}
              transition={{ type:'spring', damping:18 }}
              style={{ position:'relative', width:'80vw', maxWidth:320 }}>
              <motion.div
                animate={{ scale:[1,1.08,1], opacity:[0.3,0.6,0.3] }}
                transition={{ duration:3, repeat:Infinity }}
                style={{
                  position:'absolute', inset:-30, borderRadius:'50%',
                  background:'radial-gradient(circle, rgba(255,220,140,0.6) 0%, transparent 65%)',
                  filter:'blur(28px)',
                }}
              />
              <motion.img src="/panda/panda_orb_baby.png" alt="Pandi"
                initial={{ opacity:0, scale:0.85 }}
                animate={{ opacity:1, scale:1 }}
                transition={{ duration:0.8 }}
                style={{ width:'100%', objectFit:'contain', position:'relative', zIndex:1 }}
                onError={()=>setImgErrs(e=>({...e,panda_orb_baby:true}))}
              />
            </motion.div>

            <motion.div
              initial={{ opacity:0 }} animate={{ opacity:1, translateY:0 }} style={{ translateY:20 }}
              transition={{ delay:0.8 }}
              style={{
                position:'fixed', bottom:48, left:0, right:0,
                padding:'0 28px', textAlign:'center',
              }}>
              <p style={{ fontSize:13, color:'rgba(255,255,255,0.85)', fontStyle:'italic',
                marginBottom:16, textShadow:'0 2px 12px rgba(0,0,0,0.4)', lineHeight:1.6 }}>
                Hemos creado esta vida a partir de tus decisiones.
              </p>
              <motion.button
                whileTap={{ scale:0.97 }}
                onClick={awakenPandi}
                style={{ padding:0, background:'none', border:'none', cursor:'pointer' }}>
                <motion.img
                  src="/panda/boton_1.png" alt="Despertar"
                  animate={{ scale:[1,1.04,1], opacity:[0.85,1,0.85] }}
                  transition={{ duration:2, repeat:Infinity }}
                  style={{ width:300, objectFit:'contain' }}
                  onError={e => {
                    e.target.style.display='none'
                  }}
                />
                <motion.p
                  animate={{ opacity:[0.7,1,0.7] }}
                  transition={{ duration:2, repeat:Infinity }}
                  style={{ fontSize:14, fontWeight:700, color:'#D4A847',
                    margin:'32px 0 0', textShadow:'0 2px 12px rgba(0,0,0,0.3)' }}>
                  Dale clic para despertarla ✨
                </motion.p>
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PANDA SOBRE LA NUBE — fase 12 ── */}
      <AnimatePresence>
        {showBorn && (
          <motion.div key="born"
            initial={{ opacity:0, scale:0.7 }} style={{ translateY:30 }}
            animate={{ opacity:1, scale:1, y:0 }}
            transition={{ type:'spring', damping:14, delay:0.2 }}
            style={{ position:'fixed', inset:0, zIndex:15,
              display:'flex', alignItems:'center', justifyContent:'center',
              pointerEvents:'none' }}>
            <motion.div style={{ position:'relative', width:260 }}>
              <motion.div
                animate={{ scale:[1,1.1,1], opacity:[0.3,0.55,0.3] }}
                transition={{ duration:3, repeat:Infinity }}
                style={{
                  position:'absolute', inset:-30, borderRadius:'50%',
                  background:'radial-gradient(circle, rgba(255,180,100,0.6) 0%, transparent 70%)',
                  filter:'blur(24px)',
                }}
              />
              <motion.img src="/panda/pandi_new_born_cloud.png" alt="Pandi"
                animate={{ y:[0,-10,0] }}
                transition={{ duration:3.5, repeat:Infinity, ease:'easeInOut' }}
                style={{ width:'100%', objectFit:'contain', position:'relative', zIndex:1 }}
                onError={()=>setImgErrs(e=>({...e,born:true}))}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── DESTELLO ── */}
      <AnimatePresence>
        {flash && (
          <motion.div
            initial={{ opacity:0 }} animate={{ opacity:[0,1,0] }}
            transition={{ duration:0.6, times:[0,0.25,1] }}
            style={{ position:'fixed', inset:0, zIndex:50, background:'white', pointerEvents:'none' }}
          />
        )}
      </AnimatePresence>

      {/* ── INTRO 1 ── */}
      <AnimatePresence>
        {phase === 1 && (
          <motion.div key="i1"
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            transition={{ duration:1 }}
            style={{ position:'absolute', inset:0, zIndex:20,
              display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ background:'rgba(255,252,245,0.55)', backdropFilter:'blur(12px)',
              borderRadius:24, padding:'20px 32px', textAlign:'center', margin:'0 32px' }}>
              <p style={{ fontSize:22, fontWeight:900, color:'#1A2332', margin:0, lineHeight:1.3 }}>
                Toda vida comienza<br/>con energía.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── INTRO 2 ── */}
      <AnimatePresence>
        {phase === 2 && (
          <motion.div key="i2"
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            transition={{ duration:1 }}
            style={{ position:'absolute', inset:0, zIndex:20,
              display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ background:'rgba(255,252,245,0.45)', backdropFilter:'blur(12px)',
              borderRadius:24, padding:'20px 32px', textAlign:'center', margin:'0 32px' }}>
              <p style={{ fontSize:16, color:'#374151', margin:0, lineHeight:1.8, fontStyle:'italic' }}>
                Antes de que existiera cualquier forma,<br/>había una intención.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── NOMBRE ── */}
      <AnimatePresence>
        {phase === 3 && (
          <motion.div key="name"
            initial={{ opacity:0 }} animate={{ opacity:1, translateY:0 }} exit={{ opacity:0 }} style={{ translateY:20 }}
            transition={{ duration:0.8 }}
            style={{ position:'absolute', inset:0, zIndex:20,
              display:'flex', flexDirection:'column',
              alignItems:'center', justifyContent:'center', padding:'0 28px' }}>
            <p style={{ fontSize:15, color:'rgba(255,255,255,0.85)', margin:'0 0 16px',
              fontStyle:'italic', textAlign:'center',
              textShadow:'0 2px 12px rgba(0,0,0,0.4)' }}>
              Dime cómo llamarte
            </p>
            <div style={{ width:'100%', maxWidth:360, display:'flex', flexDirection:'column', gap:12 }}>
              <input
                value={form.name}
                onChange={e => { handleFirstInteraction(); set('name', e.target.value) }}
                placeholder="Mi nombre es…"
                autoFocus
                style={{
                  width:'100%', padding:'14px 18px', borderRadius:16,
                  border:'1.5px solid rgba(255,255,255,0.5)',
                  background:'rgba(255,255,255,0.18)',
                  backdropFilter:'blur(20px)',
                  fontSize:16, fontWeight:600, color:'white',
                  outline:'none', boxSizing:'border-box',
                }}
              />
              <AnimatePresence>
                {form.name && (
                  <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                    style={{ fontSize:12, color:'rgba(255,255,255,0.75)', fontStyle:'italic',
                      textAlign:'center', margin:0, textShadow:'0 1px 8px rgba(0,0,0,0.4)' }}>
                    "{form.name}". Ese nombre será el primer latido. ✨
                  </motion.p>
                )}
              </AnimatePresence>
              <motion.button whileTap={{ scale:0.97 }}
                onClick={proceedFromName}
                disabled={!form.name.trim()}
                style={{
                  width:'100%', padding:'14px 20px', borderRadius:16,
                  border:`1.5px solid ${form.name.trim() ? '#D4A84760' : 'rgba(255,255,255,0.2)'}`,
                  background: form.name.trim() ? 'rgba(212,168,71,0.25)' : 'rgba(255,255,255,0.08)',
                  backdropFilter:'blur(20px)',
                  color: form.name.trim() ? '#D4A847' : 'rgba(255,255,255,0.3)',
                  fontSize:15, fontWeight:700, cursor: form.name.trim() ? 'pointer' : 'default',
                }}>
                Continuar →
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── INVITACIÓN A TOCAR — antes de activar ── */}
      <AnimatePresence>
        {phase === 4 && !orbActivated && (
          <motion.div
            initial={{ opacity:0 }} animate={{ opacity:1, translateY:0 }} exit={{ opacity:0 }} style={{ translateY:10 }}
            transition={{ duration:0.8, delay:1 }}
            style={{
              position:'fixed', bottom:80, left:0, right:0, zIndex:20,
              display:'flex', justifyContent:'center', pointerEvents:'none',
            }}>
            <div style={{
              background:'rgba(255,252,245,0.5)', backdropFilter:'blur(12px)',
              borderRadius:20, padding:'10px 24px', textAlign:'center',
            }}>
              <p style={{ fontSize:13, color:'#1A2332', margin:0, fontStyle:'italic' }}>
                Toca el orbe para despertarlo ✨
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── NACIMIENTO ── */}
      <AnimatePresence>
        {phase === 12 && (
          <motion.div key="born-text"
            initial={{ opacity:0 }} animate={{ opacity:1 }}
            transition={{ duration:0.8, delay:0.5 }}
            style={{ position:'absolute', inset:0, zIndex:20,
              display:'flex', flexDirection:'column',
              alignItems:'center', justifyContent:'flex-end',
              padding:'0 28px 56px' }}>
            <motion.div
              initial={{ opacity:0 }} animate={{ opacity:1, translateY:0 }} style={{ translateY:20 }}
              transition={{ delay:1 }}
              style={{ textAlign:'center', maxWidth:300 }}>
              <p style={{ fontSize:10, color:'rgba(255,255,255,0.55)',
                letterSpacing:'.12em', textTransform:'uppercase',
                margin:'0 0 12px', fontWeight:700 }}>
                ya estoy aquí
              </p>
              <p style={{ fontSize:14, color:'rgba(255,255,255,0.88)',
                lineHeight:2, margin:'0 0 28px', fontStyle:'italic',
                textShadow:'0 2px 16px rgba(0,0,0,0.4)' }}>
                "No soy una recompensa.<br/>
                Soy tu reflejo.<br/>
                Lo que ocurra conmigo<br/>
                dependerá de cómo<br/>
                te cuides a partir de hoy."
              </p>
              <motion.button
                initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:1.6 }}
                whileTap={{ scale:0.97 }}
                onClick={startProtocol}
                disabled={loading}
                style={{
                  padding:'16px 44px', borderRadius:22,
                  background:'white', border:'none',
                  color:'#1A2332', fontSize:16, fontWeight:800,
                  cursor:'pointer', boxShadow:'0 8px 32px rgba(0,0,0,0.2)',
                }}>
                {loading ? 'Un momento…' : 'Empezar a crecer juntos 🐾'}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FASE 13 — PROTOCOLO DE CUIDADO ── */}
      <AnimatePresence>
        {showProtocol && (
          <motion.div key="protocol"
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            transition={{ duration:0.8 }}
            style={{ position:'fixed', inset:0, zIndex:30,
              background:'linear-gradient(160deg, #0f1729 0%, #1a2340 50%, #0d1f35 100%)',
              display:'flex', flexDirection:'column', overflow:'hidden' }}>

            {/* Fondo de nubes reutilizado */}
            <div style={{ position:'absolute', inset:0, zIndex:0,
              backgroundImage:"url('/panda/onboarding_clouds.png')",
              backgroundSize:'cover', backgroundPosition:'top center',
              opacity:0.25, pointerEvents:'none' }} />

            {/* Partículas ambientales */}
            {[...Array(8)].map((_, i) => (
              <motion.div key={`p-${i}`}
                animate={{ opacity:[0,0.6,0], scale:[0,1,0] }}
                transition={{ duration:3+i*0.4, repeat:Infinity, delay:i*0.5 }}
                style={{ position:'absolute',
                  top:`${10+i*10}%`, left:`${5+i*12}%`,
                  width:3+i%3*2, height:3+i%3*2, borderRadius:'50%',
                  background: i%2===0 ? '#FFD97D' : '#A78BFA',
                  pointerEvents:'none', zIndex:1 }} />
            ))}

            {/* Contenido */}
            <div style={{ position:'relative', zIndex:2, flex:1,
              display:'flex', flexDirection:'column', overflowY:'auto',
              padding:'calc(env(safe-area-inset-top,0px) + 24px) 20px 32px' }}>

              {/* Header con Pandi frame */}
              <AnimatePresence mode="wait">
                <motion.div key={`block-header-${protoBlock}`}
                  initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                  transition={{ duration:0.5 }}
                  style={{ display:'flex', alignItems:'center', gap:14, marginBottom:24 }}>
                  <img
                    src={protoBlock === 1 ? '/panda/coach_explain_1.png'
                       : protoBlock === 2 ? '/panda/panda_thinking.png'
                       : '/panda/encourage_1.png'}
                    alt="Pandi"
                    style={{ width:72, height:72, objectFit:'contain', flexShrink:0 }}
                    onError={e => { e.target.style.display='none' }}
                  />
                  <div style={{ background:'rgba(255,255,255,0.10)',
                    backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)',
                    border:'1px solid rgba(255,255,255,0.18)',
                    borderRadius:'0 18px 18px 18px', padding:'12px 16px', flex:1 }}>
                    <p style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.5)',
                      textTransform:'uppercase', letterSpacing:'.08em', margin:'0 0 4px' }}>
                      {protoBlock === 1 ? 'Tu energía y tiempo'
                     : protoBlock === 2 ? 'Cómo quieres que sea Pandi'
                     : 'Protocolo de seguridad'}
                    </p>
                    <p style={{ fontSize:13, color:'rgba(255,255,255,0.9)',
                      lineHeight:1.5, margin:0, fontStyle:'italic' }}>
                      {protoBlock === 1
                        ? `Para adaptar tus rutinas a tu vida real, ${form.name.split(' ')[0]}.`
                        : protoBlock === 2
                        ? 'Así sabré cómo acompañarte en cada momento.'
                        : 'Necesito saber esto para cuidarte bien.'}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Progreso de bloques */}
              <div style={{ display:'flex', gap:8, marginBottom:24 }}>
                {['A','B','C'].map((l, i) => (
                  <div key={l} style={{ flex:1, display:'flex', flexDirection:'column', gap:4,
                    alignItems:'center' }}>
                    <div style={{ height:3, width:'100%', borderRadius:2,
                      background: i+1 < protoBlock ? '#2EC4B6'
                                : i+1 === protoBlock ? 'rgba(255,255,255,0.7)'
                                : 'rgba(255,255,255,0.15)' }} />
                    <span style={{ fontSize:9, fontWeight:700, letterSpacing:'.06em',
                      color: i+1 <= protoBlock ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)' }}>
                      {l}
                    </span>
                  </div>
                ))}
              </div>

              {/* ── BLOQUE A — Energía y tiempo ── */}
              <AnimatePresence mode="wait">
              {protoBlock === 1 && (
                <motion.div key="blockA"
                  initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                  style={{ display:'flex', flexDirection:'column', gap:20 }}>

                  {/* Horario de trabajo */}
                  <ProtoQuestion label="¿Cuál es tu horario de trabajo?">
                    <ChipGroup value={form.work_schedule} onChange={v => set('work_schedule', v)}
                      options={[
                        { v:'morning',   emoji:'🌅', label:'Mañanas' },
                        { v:'afternoon', emoji:'☀️', label:'Tardes' },
                        { v:'night',     emoji:'🌙', label:'Noches' },
                        { v:'variable',  emoji:'🌀', label:'Variable' },
                        { v:'remote',    emoji:'🏠', label:'En casa' },
                      ]} />
                  </ProtoQuestion>

                  {/* Energía */}
                  <ProtoQuestion label="¿Cuándo tienes más energía para ti?">
                    <ChipGroup value={form.energy_style} onChange={v => set('energy_style', v)}
                      options={[
                        { v:'morning_person', emoji:'🌅', label:'Por la mañana' },
                        { v:'midday',         emoji:'☀️', label:'A mediodía' },
                        { v:'night_owl',      emoji:'🌙', label:'Por la noche' },
                      ]} />
                  </ProtoQuestion>

                  {/* Ayuno intermitente */}
                  <ProtoQuestion
                    label="¿Haces ayuno intermitente?"
                    tooltip="Periodos sin comer para que el cuerpo se regenere. Ejemplo: comer solo entre las 12h y las 20h.">
                    <ChipGroup value={form.intermittent_fasting} onChange={v => set('intermittent_fasting', v)}
                      options={[
                        { v:'yes',     emoji:'⏱️', label:'Sí' },
                        { v:'no',      emoji:'🍽️', label:'No' },
                        { v:'curious', emoji:'🤔', label:'Me interesa' },
                      ]} />
                  </ProtoQuestion>

                  {/* Sueño bifásico */}
                  <ProtoQuestion
                    label="¿Tienes sueño bifásico?"
                    tooltip="Dormir en dos periodos: por ejemplo, siesta corta + noche completa. Es un patrón natural en muchas personas.">
                    <ChipGroup value={form.biphasic_sleep} onChange={v => set('biphasic_sleep', v)}
                      options={[
                        { v:'yes', emoji:'😴', label:'Sí, duermo en dos fases' },
                        { v:'no',  emoji:'💤', label:'No, solo noche' },
                      ]} />
                  </ProtoQuestion>
                </motion.div>
              )}

              {/* ── BLOQUE B — Coach ── */}
              {protoBlock === 2 && (
                <motion.div key="blockB"
                  initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                  style={{ display:'flex', flexDirection:'column', gap:20 }}>

                  <ProtoQuestion label="¿Qué quieres fortalecer primero?">
                    <ChipGroup value={form.primary_focus} onChange={v => set('primary_focus', v)}
                      options={[
                        { v:'nutrition', emoji:'🥗', label:'Nutrición' },
                        { v:'exercise',  emoji:'💪', label:'Ejercicio' },
                        { v:'calm',      emoji:'🧘', label:'Calma mental' },
                        { v:'sleep',     emoji:'😴', label:'Sueño' },
                      ]} />
                  </ProtoQuestion>

                  <ProtoQuestion label="¿Cómo es tu ritmo de vida?">
                    <ChipGroup value={form.user_persona} onChange={v => set('user_persona', v)}
                      options={[
                        { v:'chaotic',      emoji:'🌪️', label:'Muy caótico' },
                        { v:'structured',   emoji:'📅', label:'Con rutina' },
                        { v:'spontaneous',  emoji:'🌊', label:'Improvisado' },
                      ]} />
                  </ProtoQuestion>

                  <ProtoQuestion label="Cuando las cosas se ponen difíciles, ¿qué necesitas de Pandi?">
                    <ChipGroup value={form.coach_strictness} onChange={v => set('coach_strictness', v)}
                      options={[
                        { v:'firm',      emoji:'🔥', label:'Un empujón firme' },
                        { v:'soft',      emoji:'🌿', label:'Un recordatorio suave' },
                        { v:'companion', emoji:'🤍', label:'Que solo esté ahí' },
                      ]} />
                  </ProtoQuestion>
                </motion.div>
              )}

              {/* ── BLOQUE C — Protocolo de seguridad ── */}
              {protoBlock === 3 && (
                <motion.div key="blockC"
                  initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                  style={{ display:'flex', flexDirection:'column', gap:20 }}>

                  <ProtoQuestion
                    label="¿Fumas actualmente?"
                    hint="Ajusta mis consejos de respiración y energía">
                    <ChipGroup value={form.smoker} onChange={v => set('smoker', v)}
                      options={[
                        { v:'yes', emoji:'🚬', label:'Sí' },
                        { v:'ex',  emoji:'🌱', label:'Lo dejé' },
                        { v:'no',  emoji:'✅', label:'No fumo' },
                      ]} />
                  </ProtoQuestion>

                  <ProtoQuestion label="¿Tienes alguna alergia alimentaria?">
                    <ChipMulti values={form.allergies} onToggle={v => toggle('allergies', v)}
                      options={[
                        { v:'gluten',    emoji:'🌾', label:'Gluten' },
                        { v:'lactose',   emoji:'🥛', label:'Lácteos' },
                        { v:'nuts',      emoji:'🥜', label:'Frutos secos' },
                        { v:'shellfish', emoji:'🦐', label:'Marisco' },
                        { v:'egg',       emoji:'🥚', label:'Huevo' },
                        { v:'soy',       emoji:'🌱', label:'Soja' },
                        { v:'none',      emoji:'✅', label:'Ninguna' },
                      ]} />
                  </ProtoQuestion>

                  <ProtoQuestion label="¿Hay alimentos que prefieres evitar?">
                    <ChipMulti values={form.dislikes} onToggle={v => toggle('dislikes', v)}
                      options={[
                        { v:'spicy',     emoji:'🌶️', label:'Picante' },
                        { v:'pork',      emoji:'🐷', label:'Cerdo' },
                        { v:'fish',      emoji:'🐟', label:'Pescado' },
                        { v:'cilantro',  emoji:'🌿', label:'Cilantro' },
                        { v:'broccoli',  emoji:'🥦', label:'Brócoli' },
                        { v:'none',      emoji:'✅', label:'Como de todo' },
                      ]} />
                  </ProtoQuestion>
                </motion.div>
              )}
              </AnimatePresence>

              {/* Botón continuar */}
              <motion.button
                whileTap={{ scale:0.97 }}
                onClick={nextBlock}
                disabled={loading}
                style={{
                  marginTop:28,
                  width:'100%', padding:'15px 20px', borderRadius:18,
                  border:'1px solid rgba(255,255,255,0.25)',
                  background:'rgba(255,255,255,0.15)',
                  backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
                  color:'white', fontSize:15, fontWeight:700,
                  cursor:'pointer',
                  boxShadow:'0 4px 24px rgba(0,0,0,0.2)',
                }}>
                {loading ? 'Configurando a Pandi…'
                  : protoBlock === 3 ? '🐾 Activar mi Santuario'
                  : 'Continuar →'}
              </motion.button>

              {/* Skip */}
              <button onClick={finish}
                style={{ marginTop:12, background:'none', border:'none', cursor:'pointer',
                  color:'rgba(255,255,255,0.3)', fontSize:12, fontWeight:600 }}>
                Saltar por ahora
              </button>

            </div>

            {/* Tooltip overlay */}
            <AnimatePresence>
              {tooltip && (
                <motion.div
                  initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                  onClick={() => setTooltip(null)}
                  style={{ position:'fixed', inset:0, zIndex:50,
                    background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)',
                    display:'flex', alignItems:'center', justifyContent:'center', padding:32 }}>
                  <motion.div
                    initial={{ scale:0.9 }} animate={{ scale:1 }}
                    style={{ background:'rgba(255,255,255,0.12)',
                      backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)',
                      border:'1px solid rgba(255,255,255,0.2)',
                      borderRadius:24, padding:'24px 20px', maxWidth:320, textAlign:'center' }}>
                    <p style={{ fontSize:32, margin:'0 0 12px' }}>💡</p>
                    <p style={{ fontSize:14, color:'white', lineHeight:1.7, margin:'0 0 20px' }}>
                      {tooltip}
                    </p>
                    <button onClick={() => setTooltip(null)}
                      style={{ padding:'10px 28px', borderRadius:14,
                        background:'rgba(255,255,255,0.2)', border:'1px solid rgba(255,255,255,0.3)',
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


      {/* ── FASE -1: GANCHO — objetivo + estilo de vida ── */}
      <AnimatePresence>
        {showGancho && (
          <motion.div key="gancho"
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:'fixed', inset:0, zIndex:40,
              background:'linear-gradient(160deg, #0f1729 0%, #1a2340 50%, #0d1f35 100%)',
              display:'flex', flexDirection:'column',
              alignItems:'center', justifyContent:'center',
              padding:'40px 24px' }}>

            {/* Fondo estrellas */}
            {[...Array(12)].map((_, i) => (
              <motion.div key={i}
                animate={{ opacity:[0, 0.7, 0], scale:[0,1,0] }}
                transition={{ duration:3+i*0.3, repeat:Infinity, delay:i*0.4 }}
                style={{ position:'absolute',
                  top:`${5+i*8}%`, left:`${4+i*9}%`,
                  width:2+i%3, height:2+i%3, borderRadius:'50%',
                  background: i%3===0 ? '#FFD97D' : i%3===1 ? '#A78BFA' : '#2EC4B6',
                  pointerEvents:'none' }} />
            ))}

            <div style={{ position:'relative', zIndex:2, width:'100%', maxWidth:400,
              display:'flex', flexDirection:'column', gap:32, alignItems:'center' }}>

              {/* Logo / intro */}
              <div style={{ textAlign:'center' }}>
                <motion.p
                  animate={{ opacity:[0.6,1,0.6] }} transition={{ duration:3, repeat:Infinity }}
                  style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.5)',
                    textTransform:'uppercase', letterSpacing:'.15em', margin:'0 0 12px' }}>
                  Bienvenido a
                </motion.p>
                <h1 style={{ fontSize:32, fontWeight:900, color:'white', margin:'0 0 8px',
                  textShadow:'0 0 40px rgba(46,196,182,0.6)' }}>
                  Pandi Health Coach
                </h1>
                <p style={{ fontSize:14, color:'rgba(255,255,255,0.5)', margin:0 }}>
                  Dos preguntas antes de despertar a Pandi.
                </p>
              </div>

              {/* Objetivo principal */}
              <div style={{ width:'100%', display:'flex', flexDirection:'column', gap:10 }}>
                <p style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.8)',
                  margin:0, textAlign:'center' }}>
                  ¿Qué quieres conseguir?
                </p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {[
                    { v:'health',    emoji:'🏥', label:'Mejorar mi salud' },
                    { v:'energy',    emoji:'⚡', label:'Tener más energía' },
                    { v:'body',      emoji:'💪', label:'Cambiar mi cuerpo' },
                    { v:'mind',      emoji:'🧘', label:'Calma mental' },
                    { v:'habits',    emoji:'🌱', label:'Crear hábitos' },
                    { v:'weight',    emoji:'⚖️', label:'Controlar el peso' },
                  ].map(o => (
                    <motion.button key={o.v} whileTap={{ scale:0.95 }}
                      onClick={() => set('goal_main', o.v)}
                      style={{
                        padding:'12px 10px', borderRadius:16,
                        border:`1.5px solid ${form.goal_main===o.v ? 'rgba(46,196,182,0.8)' : 'rgba(255,255,255,0.12)'}`,
                        background: form.goal_main===o.v ? 'rgba(46,196,182,0.2)' : 'rgba(255,255,255,0.06)',
                        backdropFilter:'blur(12px)',
                        color: form.goal_main===o.v ? '#2EC4B6' : 'rgba(255,255,255,0.6)',
                        fontSize:12, fontWeight: form.goal_main===o.v ? 700 : 500,
                        cursor:'pointer', display:'flex', alignItems:'center', gap:8,
                        transition:'all 0.2s',
                      }}>
                      <span style={{ fontSize:18 }}>{o.emoji}</span>
                      {o.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Estilo de vida */}
              <div style={{ width:'100%', display:'flex', flexDirection:'column', gap:10 }}>
                <p style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.8)',
                  margin:0, textAlign:'center' }}>
                  ¿Cómo es tu vida?
                </p>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {[
                    { v:'busy',       emoji:'🌪️', label:'Muy ocupado/a — poco tiempo para mí' },
                    { v:'balanced',   emoji:'⚖️', label:'Bastante equilibrado/a' },
                    { v:'sedentary',  emoji:'🛋️', label:'Sedentario/a — quiero cambiar' },
                    { v:'active',     emoji:'🏃', label:'Activo/a — quiero optimizar' },
                  ].map(o => (
                    <motion.button key={o.v} whileTap={{ scale:0.95 }}
                      onClick={() => set('lifestyle', o.v)}
                      style={{
                        padding:'12px 16px', borderRadius:16,
                        border:`1.5px solid ${form.lifestyle===o.v ? 'rgba(167,139,250,0.8)' : 'rgba(255,255,255,0.12)'}`,
                        background: form.lifestyle===o.v ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.06)',
                        backdropFilter:'blur(12px)',
                        color: form.lifestyle===o.v ? '#A78BFA' : 'rgba(255,255,255,0.6)',
                        fontSize:13, fontWeight: form.lifestyle===o.v ? 700 : 500,
                        cursor:'pointer', display:'flex', alignItems:'center', gap:10,
                        transition:'all 0.2s', textAlign:'left',
                      }}>
                      <span style={{ fontSize:18 }}>{o.emoji}</span>
                      {o.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <motion.button
                whileTap={{ scale:0.97 }}
                onClick={startIntro}
                disabled={!form.goal_main || !form.lifestyle}
                style={{
                  width:'100%', padding:'15px', borderRadius:18,
                  border:'1px solid rgba(255,255,255,0.25)',
                  background: form.goal_main && form.lifestyle
                    ? 'rgba(46,196,182,0.3)'
                    : 'rgba(255,255,255,0.06)',
                  backdropFilter:'blur(20px)',
                  color: form.goal_main && form.lifestyle ? 'white' : 'rgba(255,255,255,0.3)',
                  fontSize:15, fontWeight:700, cursor:'pointer',
                  boxShadow: form.goal_main && form.lifestyle
                    ? '0 4px 24px rgba(46,196,182,0.3)' : 'none',
                  transition:'all 0.3s',
                }}>
                Despertar a Pandi ✨
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FASE 14: PERSONALIDAD DEL COACH ── */}
      <AnimatePresence>
        {showPersonality && (
          <motion.div key="personality"
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:'fixed', inset:0, zIndex:40,
              background:'linear-gradient(160deg, #0f1729 0%, #1a2340 50%, #0d1f35 100%)',
              display:'flex', flexDirection:'column', overflow:'hidden' }}>

            <div style={{ position:'absolute', inset:0,
              backgroundImage:"url('/panda/onboarding_clouds.png')",
              backgroundSize:'cover', backgroundPosition:'top center',
              opacity:0.2, pointerEvents:'none' }} />

            <div style={{ position:'relative', zIndex:2, flex:1,
              display:'flex', flexDirection:'column', justifyContent:'center',
              padding:'40px 24px', gap:28 }}>

              {/* Pandi + burbuja */}
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <img src="/panda/panda_base.png" alt="Pandi"
                  style={{ width:80, height:80, objectFit:'contain', flexShrink:0 }}
                  onError={e => { e.target.style.display='none' }} />
                <div style={{
                  background:'rgba(255,255,255,0.10)',
                  backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)',
                  border:'1px solid rgba(255,255,255,0.18)',
                  borderRadius:'0 18px 18px 18px', padding:'14px 16px', flex:1 }}>
                  <p style={{ fontSize:14, color:'white', lineHeight:1.6, margin:0, fontStyle:'italic' }}>
                    "Ya sé quién eres. Ahora dime cómo quieres que sea yo."
                  </p>
                </div>
              </div>

              <div>
                <p style={{ fontSize:20, fontWeight:900, color:'white',
                  margin:'0 0 6px', textAlign:'center' }}>
                  Elige el estilo de tu coach
                </p>
                <p style={{ fontSize:13, color:'rgba(255,255,255,0.5)',
                  margin:0, textAlign:'center' }}>
                  Puedes cambiarlo después en ajustes
                </p>
              </div>

              {/* Cards de personalidad */}
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {[
                  {
                    v: 'athlete',
                    emoji: '🔥',
                    title: 'Atleta / Modo Dios',
                    desc: 'Directo, exigente y sin excusas. Te empuja cuando más lo necesitas. No acepta "mañana".',
                    color: '#F97316',
                    glow: 'rgba(249,115,22,0.3)',
                  },
                  {
                    v: 'balanced',
                    emoji: '⚖️',
                    title: 'Equilibrado',
                    desc: 'Motivación con sentido común. Celebra tus logros y te ayuda a levantarte sin dramatismos.',
                    color: '#2EC4B6',
                    glow: 'rgba(46,196,182,0.3)',
                  },
                  {
                    v: 'compassionate',
                    emoji: '🤍',
                    title: 'Comprensivo',
                    desc: 'Escucha antes de hablar. Sin presiones, sin juicios. Tu ritmo es el único ritmo que importa.',
                    color: '#A78BFA',
                    glow: 'rgba(167,139,250,0.3)',
                  },
                ].map(p => {
                  const active = form.coach_persona === p.v
                  return (
                    <motion.button key={p.v} whileTap={{ scale:0.97 }}
                      onClick={() => set('coach_persona', p.v)}
                      style={{
                        padding:'18px 16px', borderRadius:20,
                        border:`1.5px solid ${active ? p.color : 'rgba(255,255,255,0.12)'}`,
                        background: active ? `rgba(${p.color.replace('#','').match(/.{2}/g).map(h=>parseInt(h,16)).join(',')},0.15)` : 'rgba(255,255,255,0.06)',
                        backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)',
                        cursor:'pointer', textAlign:'left',
                        boxShadow: active ? `0 4px 24px ${p.glow}` : 'none',
                        transition:'all 0.25s',
                        display:'flex', alignItems:'flex-start', gap:14,
                      }}>
                      <span style={{ fontSize:28, flexShrink:0 }}>{p.emoji}</span>
                      <div>
                        <p style={{ fontSize:15, fontWeight:800,
                          color: active ? p.color : 'white', margin:'0 0 4px' }}>
                          {p.title}
                        </p>
                        <p style={{ fontSize:12, color:'rgba(255,255,255,0.55)',
                          lineHeight:1.5, margin:0 }}>
                          {p.desc}
                        </p>
                      </div>
                      {active && (
                        <div style={{ marginLeft:'auto', flexShrink:0,
                          width:22, height:22, borderRadius:'50%',
                          background: p.color, display:'flex',
                          alignItems:'center', justifyContent:'center' }}>
                          <span style={{ fontSize:12, color:'white' }}>✓</span>
                        </div>
                      )}
                    </motion.button>
                  )
                })}
              </div>

              {/* CTA */}
              <motion.button
                whileTap={{ scale:0.97 }}
                onClick={finish}
                disabled={!form.coach_persona || loading}
                style={{
                  width:'100%', padding:'15px', borderRadius:18,
                  border:'1px solid rgba(255,255,255,0.25)',
                  background: form.coach_persona
                    ? 'rgba(255,255,255,0.18)'
                    : 'rgba(255,255,255,0.06)',
                  backdropFilter:'blur(20px)',
                  color: form.coach_persona ? 'white' : 'rgba(255,255,255,0.3)',
                  fontSize:15, fontWeight:700, cursor:'pointer',
                  transition:'all 0.3s',
                }}>
                {loading ? 'Activando Santuario…' : '🐾 Comenzar con Pandi'}
              </motion.button>

              <button onClick={finish}
                style={{ background:'none', border:'none', cursor:'pointer',
                  color:'rgba(255,255,255,0.25)', fontSize:12, fontWeight:600,
                  textAlign:'center' }}>
                Saltar por ahora
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>


        <div style={{ position:'fixed', top:8, left:8, zIndex:100,
          background:'rgba(0,0,0,0.75)', borderRadius:8, padding:'5px 10px',
          fontSize:10, color:'#ff6b6b' }}>
          ❌ {Object.keys(imgErrs).join(', ')}
        </div>
      )}
    </div>
  )
}
