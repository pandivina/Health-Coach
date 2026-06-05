import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/useStore'
import { useTheme } from '../contexts/ThemeProvider'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'

// ─── ENERGÍAS ─────────────────────────────────────────────────────────────────
const ENERGIES = {
  mind:      { color:'#A78BFA', freq:396 },
  water:     { color:'#3B82F6', freq:528 },
  sleep:     { color:'#8B5CF6', freq:396 },
  movement:  { color:'#F97316', freq:741 },
  food:      { color:'#22C55E', freq:639 },
  intention: { color:'#EC4899', freq:852 },
}

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

  function playTone(freq=528) {
    try {
      const ctx=getCtx(); const osc=ctx.createOscillator(); const gain=ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.type='sine'; osc.frequency.value=freq
      gain.gain.setValueAtTime(0,ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0.1,ctx.currentTime+0.05)
      gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.9)
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime+0.9)
    } catch {}
  }

  function playHeartbeat() {
    try {
      const ctx=getCtx()
      const beat=(t)=>{
        const osc=ctx.createOscillator(); const gain=ctx.createGain()
        osc.connect(gain); gain.connect(ctx.destination)
        osc.type='sine'; osc.frequency.value=60
        gain.gain.setValueAtTime(0,t)
        gain.gain.linearRampToValueAtTime(0.25,t+0.04)
        gain.gain.exponentialRampToValueAtTime(0.001,t+0.25)
        osc.start(t); osc.stop(t+0.25)
      }
      beat(ctx.currentTime)
      beat(ctx.currentTime+0.22)
    } catch {}
  }

  function playWater() {
    try {
      const ctx=getCtx()
      for(let i=0;i<3;i++){
        const osc=ctx.createOscillator(); const gain=ctx.createGain()
        osc.connect(gain); gain.connect(ctx.destination)
        osc.type='sine'; osc.frequency.value=400+i*120
        const t=ctx.currentTime+i*0.12
        gain.gain.setValueAtTime(0,t)
        gain.gain.linearRampToValueAtTime(0.08,t+0.06)
        gain.gain.exponentialRampToValueAtTime(0.001,t+0.5)
        osc.start(t); osc.stop(t+0.5)
      }
    } catch {}
  }

  function playFlash() {
    try {
      const ctx=getCtx()
      ;[528,639,741,852,963].forEach((f,i)=>{
        const osc=ctx.createOscillator(); const gain=ctx.createGain()
        osc.connect(gain); gain.connect(ctx.destination)
        osc.type='sine'; osc.frequency.value=f
        const t=ctx.currentTime+i*0.1
        gain.gain.setValueAtTime(0,t)
        gain.gain.linearRampToValueAtTime(0.12,t+0.05)
        gain.gain.exponentialRampToValueAtTime(0.001,t+1.2)
        osc.start(t); osc.stop(t+1.2)
      })
    } catch {}
  }

  useEffect(()=>()=>stopAmbient(),[])
  return { startAmbient, stopAmbient, playTone, playHeartbeat, playWater, playFlash }
}

// ─── PARTÍCULAS BRILLANTINA ───────────────────────────────────────────────────
function Glitter({ active, color }) {
  if (!active) return null
  return (
    <div style={{ position:'absolute', inset:0, zIndex:20, pointerEvents:'none', overflow:'hidden' }}>
      {[...Array(22)].map((_,i) => (
        <motion.div key={i}
          initial={{ x:`${30+Math.random()*40}%`, y:'40%', opacity:1, scale:1 }}
          animate={{ y:`${60+Math.random()*30}%`, opacity:0, scale:0.3 }}
          transition={{ duration:0.8+Math.random()*0.4, delay:Math.random()*0.2 }}
          style={{
            position:'absolute', width:4+Math.random()*4, height:4+Math.random()*4,
            borderRadius:'50%', background:color||'#F59E0B',
            boxShadow:`0 0 6px ${color||'#F59E0B'}`,
          }}
        />
      ))}
    </div>
  )
}

// ─── DESTELLO ─────────────────────────────────────────────────────────────────
function Flash({ active }) {
  if (!active) return null
  return (
    <motion.div
      initial={{ opacity:0 }} animate={{ opacity:[0,1,0] }}
      transition={{ duration:0.6, times:[0,0.3,1] }}
      style={{ position:'fixed', inset:0, zIndex:100, background:'white', pointerEvents:'none' }}
    />
  )
}

// ─── FONDO COMPLETO ───────────────────────────────────────────────────────────
// phase: 'white' | 'blur' | 'open' | 'clouds' | 'orb' | 'born'
function FullBackground({ phase, doorOpacity }) {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:0 }}>

      {/* Blanco inicial */}
      <motion.div
        animate={{ opacity: ['blur','intro1','intro2','name'].includes(phase) ? 1 : 0 }}
        transition={{ duration:1.5 }}
        style={{ position:'absolute', inset:0, background:'white', zIndex:5 }}
      />

      {/* orb baby blur — pantalla intro */}
      <motion.img src="/panda/onboarding_orb_baby_blur.png" alt=""
        animate={{ opacity: phase==='blur' ? 1 : 0 }}
        transition={{ duration:1.5 }}
        style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', objectPosition:'center', zIndex:4 }}
        onError={e=>e.target.style.display='none'}
      />

      {/* sanctuary open */}
      <motion.img src="/panda/onboarding_sanctuary_open.png" alt=""
        animate={{ opacity: ['open','clouds','orb','questions','born'].includes(phase) ? 1 : 0 }}
        transition={{ duration:1.8 }}
        style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', objectPosition:'center', zIndex:3 }}
        onError={e=>e.target.style.display='none'}
      />

      {/* clouds — se solapa encima */}
      <motion.img src="/panda/onboarding_clouds.png" alt=""
        animate={{ opacity: ['clouds','orb','questions','born'].includes(phase) ? 1 : 0 }}
        transition={{ duration:2 }}
        style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', objectPosition:'center', zIndex:4 }}
        onError={e=>e.target.style.display='none'}
      />

      {/* ORB + DOOR — aparece en phase orb+ */}
      <AnimatePresence>
        {['orb','born'].includes(phase) && (
          <motion.div
            initial={{ opacity:0, scale:0.8, y:40 }}
            animate={{ opacity:1, scale:1, y:0 }}
            transition={{ duration:1.2, type:'spring', damping:20 }}
            style={{
              position:'absolute', zIndex:6,
              bottom:'12%', left:'50%', transform:'translateX(-50%)',
              width:'62%', maxWidth:300,
            }}>
            {/* Glow */}
            <motion.div
              animate={{ scale:[1,1.08,1], opacity:[0.3,0.55,0.3] }}
              transition={{ duration:3.5, repeat:Infinity }}
              style={{
                position:'absolute', inset:-30, borderRadius:'50%',
                background:'radial-gradient(circle, rgba(255,220,140,0.5) 0%, transparent 70%)',
                filter:'blur(24px)',
              }}
            />
            {/* Baby debajo */}
            <img src="/panda/panda_orb.png" alt=""
              style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'contain', opacity:1-doorOpacity+0.1 }}
              onError={e=>e.target.style.display='none'}
            />
            {/* Puerta encima */}
            <motion.img src="/panda/onboarding_orb_door.png" alt=""
              animate={{ opacity: doorOpacity }}
              transition={{ duration:0.9 }}
              style={{ position:'relative', zIndex:2, width:'100%', objectFit:'contain', display:'block' }}
              onError={e=>e.target.style.display='none'}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* PANDA BABY — tras destello */}
      <AnimatePresence>
        {phase==='born' && (
          <motion.div
            initial={{ opacity:0, y:30, scale:0.8 }}
            animate={{ opacity:1, y:0, scale:1 }}
            transition={{ type:'spring', damping:14, stiffness:140, delay:0.3 }}
            style={{
              position:'absolute', zIndex:7,
              bottom:'10%', left:'50%', transform:'translateX(-50%)',
              width:'55%', maxWidth:260,
            }}>
            <motion.div
              animate={{ scale:[1,1.1,1], opacity:[0.3,0.55,0.3] }}
              transition={{ duration:3, repeat:Infinity }}
              style={{
                position:'absolute', inset:-20, borderRadius:'50%',
                background:'radial-gradient(circle, rgba(255,180,100,0.6) 0%, transparent 70%)',
                filter:'blur(20px)',
              }}
            />
            <motion.img
              src="/panda/panda_baby.png" alt="Pandi"
              animate={{ y:[0,-8,0] }}
              transition={{ duration:3.5, repeat:Infinity, ease:'easeInOut' }}
              style={{ width:'100%', objectFit:'contain', position:'relative', zIndex:1 }}
              onError={e=>e.target.style.display='none'}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── TEXTO FLOTANTE (sin fondo) ───────────────────────────────────────────────
function FloatingText({ bold, normal, color='#1A2332' }) {
  return (
    <motion.div
      initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
      exit={{ opacity:0, y:-10 }} transition={{ duration:0.7 }}
      style={{ textAlign:'center', padding:'0 32px' }}>
      {bold && <p style={{ fontSize:20, fontWeight:900, color, margin:'0 0 10px', lineHeight:1.3 }}>{bold}</p>}
      {normal && <p style={{ fontSize:14, color, opacity:0.75, margin:0, lineHeight:1.6, fontStyle:'italic' }}>{normal}</p>}
    </motion.div>
  )
}

// ─── INPUT TRANSLÚCIDO ────────────────────────────────────────────────────────
function GlassInput({ value, onChange, placeholder }) {
  return (
    <input
      value={value} onChange={onChange} placeholder={placeholder} autoFocus
      style={{
        width:'100%', padding:'14px 18px', borderRadius:16,
        border:'1.5px solid rgba(255,255,255,0.6)',
        background:'rgba(255,255,255,0.25)',
        backdropFilter:'blur(20px)',
        fontSize:16, fontWeight:600, color:'#1A2332',
        outline:'none', boxSizing:'border-box',
        boxShadow:'0 4px 20px rgba(0,0,0,0.06)',
      }}
    />
  )
}

// ─── SELECTOR DESPLEGABLE TRANSLÚCIDO ─────────────────────────────────────────
function GlassSelect({ options, value, onChange, energyColor }) {
  const [open, setOpen] = useState(false)
  const selected = options.find(o=>o.v===value)

  return (
    <div style={{ position:'relative', width:'100%' }}>
      <motion.button whileTap={{ scale:0.98 }} onClick={()=>setOpen(o=>!o)}
        style={{
          width:'100%', padding:'13px 18px', borderRadius:16,
          border:`1.5px solid ${value ? energyColor+'60' : 'rgba(255,255,255,0.5)'}`,
          background: value ? `${energyColor}18` : 'rgba(255,255,255,0.25)',
          backdropFilter:'blur(20px)',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          cursor:'pointer', boxSizing:'border-box',
          boxShadow:'0 4px 20px rgba(0,0,0,0.06)',
        }}>
        <span style={{ fontSize:14, fontWeight:value?700:400, color: value ? energyColor : 'rgba(26,35,50,0.5)' }}>
          {selected ? `${selected.emoji} ${selected.label}` : 'Selecciona una opción…'}
        </span>
        <motion.span animate={{ rotate: open?180:0 }} transition={{ duration:0.2 }}
          style={{ color:'rgba(26,35,50,0.4)', fontSize:12 }}>▾</motion.span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity:0, y:-8, scaleY:0.9 }}
            animate={{ opacity:1, y:0, scaleY:1 }}
            exit={{ opacity:0, y:-8, scaleY:0.9 }}
            transition={{ duration:0.18 }}
            style={{
              position:'absolute', top:'calc(100% + 8px)', left:0, right:0, zIndex:50,
              borderRadius:16, overflow:'hidden',
              background:'rgba(255,252,245,0.92)',
              backdropFilter:'blur(24px)',
              border:'1.5px solid rgba(255,255,255,0.7)',
              boxShadow:'0 8px 32px rgba(0,0,0,0.12)',
            }}>
            {options.map((o,i) => (
              <motion.button key={o.v}
                initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.04 }}
                whileTap={{ scale:0.98 }}
                onClick={()=>{ onChange(o.v); setOpen(false) }}
                style={{
                  width:'100%', padding:'12px 18px',
                  display:'flex', alignItems:'center', gap:12,
                  background: value===o.v ? `${energyColor}18` : 'transparent',
                  border:'none', cursor:'pointer', textAlign:'left',
                  borderBottom: i<options.length-1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                }}>
                <span style={{ fontSize:20 }}>{o.emoji}</span>
                <span style={{ fontSize:13, fontWeight:value===o.v?700:400, color: value===o.v ? energyColor : '#374151' }}>
                  {o.label}
                </span>
                {value===o.v && <span style={{ marginLeft:'auto', color:energyColor, fontSize:12 }}>✓</span>}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── BOTÓN TRANSLÚCIDO ────────────────────────────────────────────────────────
function GlassButton({ onClick, disabled, children, energyColor }) {
  return (
    <motion.button whileTap={{ scale: disabled?1:0.97 }} onClick={onClick} disabled={disabled}
      style={{
        width:'100%', padding:'14px 20px', borderRadius:16,
        border:`1.5px solid ${disabled ? 'rgba(255,255,255,0.3)' : energyColor+'50'}`,
        background: disabled ? 'rgba(255,255,255,0.15)' : `${energyColor}22`,
        backdropFilter:'blur(20px)',
        color: disabled ? 'rgba(26,35,50,0.35)' : energyColor,
        fontSize:15, fontWeight:700, cursor: disabled?'default':'pointer',
        boxShadow: disabled ? 'none' : `0 4px 20px ${energyColor}25`,
        transition:'all 0.3s',
      }}>
      {children}
    </motion.button>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function Onboarding() {
  const [phase, setPhase]         = useState('white')   // white→blur→intro1→intro2→name→open→clouds→orb→questions→flash→born
  const [qStep, setQStep]         = useState(0)          // 0=mind,1=water,2=sleep,3=movement,4=food,5=intention
  const [glitter, setGlitter]     = useState(false)
  const [flash, setFlash]         = useState(false)
  const [loading, setLoading]     = useState(false)
  const [started, setStarted]     = useState(false)

  const { user, fetchProfile } = useStore()
  const navigate = useNavigate()
  const audio    = useAudio()

  const [form, setForm] = useState({
    name:'', birth_date:'', sex:'other',
    mind:'', water:'', sleep:'', movement:'', food:'', intention:'',
  })
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  // Contar energías activas para opacidad de la puerta
  const qKeys = ['mind','water','sleep','movement','food','intention']
  // Puerta empieza opaca, baja 0.25 por cada respuesta desde water en adelante
  const waterAnswers = ['water','sleep','movement','food','intention'].filter(k=>form[k]).length
  const doorOpacity  = Math.max(1 - waterAnswers * 0.25, 0)

  // ── SECUENCIA AUTOMÁTICA DE FASES ──────────────────────────────────────────
  useEffect(() => {
    const t1 = setTimeout(()=>setPhase('blur'),   1000)  // blanco → blur
    const t2 = setTimeout(()=>setPhase('intro1'), 2500)  // blur → texto 1
    const t3 = setTimeout(()=>setPhase('intro2'), 7500)  // texto 1 → texto 2
    const t4 = setTimeout(()=>setPhase('name'),  12500)  // texto 2 → nombre
    return ()=>{ clearTimeout(t1);clearTimeout(t2);clearTimeout(t3);clearTimeout(t4) }
  }, [])

  function handleFirstInteraction() {
    if (!started) { setStarted(true); audio.startAmbient() }
  }

  function proceedFromName() {
    handleFirstInteraction()
    if (!form.name.trim()) return
    setPhase('open')
    setTimeout(()=>setPhase('clouds'), 2000)
    setTimeout(()=>setPhase('orb'),    4000)
    setTimeout(()=>setPhase('questions'), 5500)
  }

  function handleAnswer(key, value) {
    handleFirstInteraction()
    set(key, value)
    if (key==='water') audio.playWater()
    else audio.playHeartbeat()
  }

  function goNextQ() {
    handleFirstInteraction()
    const currentKey = qKeys[qStep]
    if (!form[currentKey]) return

    // Brillantina dentro del orbe
    setGlitter(true)
    setTimeout(()=>setGlitter(false), 1000)

    // Latido entre decisiones
    setTimeout(()=>audio.playHeartbeat(), 300)

    if (qStep < qKeys.length - 1) {
      setTimeout(()=>setQStep(s=>s+1), 400)
    } else {
      // Fin del cuestionario — destello
      setTimeout(()=>{
        audio.playFlash()
        setFlash(true)
        setTimeout(()=>{ setFlash(false); setPhase('born') }, 700)
      }, 400)
    }
  }

  async function finish() {
    setLoading(true)
    try {
      const userId = user.id
      const sleepHours   = { low:4, irregular:5.5, enough:7, deep:8 }[form.sleep] || 7
      const trainingDays = { never:0, sometimes:1, regular:3, daily:5 }[form.movement] || 2

      await supabase.from('user_profiles').update({
        name: form.name, onboarding_done:true, motivation_why: form.intention||null,
      }).eq('id', userId)

      await supabase.from('health_profiles').upsert({
        user_id: userId,
        diet_type: form.food || 'omnivore',
        sleep_hours: sleepHours,
        training_days_per_week: trainingDays,
        onboarding_done:true, onboarding_version:3,
        onboarding_date: new Date().toISOString(),
      }, { onConflict:'user_id' })

      await fetchProfile(userId)
      try { await api.email.welcome() } catch {}
      audio.stopAmbient()
      navigate('/')
    } catch(err) { alert('Error: '+err.message) }
    finally { setLoading(false) }
  }

  const currentKey   = qKeys[qStep]
  const energyColor  = ENERGIES[currentKey]?.color || '#D4A847'
  const isLastQ      = qStep === qKeys.length - 1

  // ── OPCIONES POR PREGUNTA ──────────────────────────────────────────────────
  const Q_OPTIONS = {
    mind: [
      {v:'yes',    emoji:'🔥', label:'Sí, llevo tiempo esperando este momento'},
      {v:'unsure', emoji:'🌿', label:'No lo sé, pero aquí estoy'},
      {v:'scared', emoji:'🌊', label:'Tengo miedo, pero quiero intentarlo'},
    ],
    water: [
      {v:'none',    emoji:'🏜️', label:'Casi nada — menos de 1 litro'},
      {v:'little',  emoji:'💧', label:'Lo justo — 1 a 1.5 litros'},
      {v:'enough',  emoji:'🌊', label:'Bien — 1.5 a 2 litros'},
      {v:'flowing', emoji:'🌀', label:'Fluyo — más de 2 litros'},
    ],
    sleep: [
      {v:'low',       emoji:'🌑', label:'Poco — menos de 5 horas'},
      {v:'irregular', emoji:'🌓', label:'Irregular — entre 5 y 6 horas'},
      {v:'enough',    emoji:'🌕', label:'Suficiente — 6 a 7 horas'},
      {v:'deep',      emoji:'✨', label:'Profundo — más de 7 horas'},
    ],
    movement: [
      {v:'never',     emoji:'🪨', label:'Casi nunca'},
      {v:'sometimes', emoji:'🌿', label:'Una o dos veces por semana'},
      {v:'regular',   emoji:'🔥', label:'Tres o cuatro veces'},
      {v:'daily',     emoji:'⚡', label:'Cada día es una oportunidad'},
    ],
    food: [
      {v:'omnivore',    emoji:'🍽️', label:'De todo un poco'},
      {v:'vegetarian',  emoji:'🥗', label:'Sin carne'},
      {v:'vegan',       emoji:'🌱', label:'Solo plantas'},
      {v:'pescatarian', emoji:'🐟', label:'Del mar'},
      {v:'keto',        emoji:'🥑', label:'Bajo en carbohidratos'},
      {v:'paleo',       emoji:'🍖', label:'Sin procesar'},
    ],
    intention: [
      {v:'family',    emoji:'👨‍👩‍👧', label:'Estar presente para quienes amo'},
      {v:'body',      emoji:'💪',    label:'Reconocerme cuando me miro'},
      {v:'health',    emoji:'🏥',    label:'Controlar algo que me preocupa'},
      {v:'energy',    emoji:'⚡',    label:'Tener más energía para lo que importa'},
      {v:'habits',    emoji:'🌱',    label:'Recuperar algo que perdí'},
      {v:'wellbeing', emoji:'🧘',    label:'Cuidarme por primera vez de verdad'},
    ],
  }

  const Q_TEXT = {
    mind:      { bold:'¿Tu mente está lista\npara esta aventura?',      sub:'La mente debe dar lugar a este nacimiento...' },
    water:     { bold:'El agua es el canal.',                            sub:'El agua no me llena — me conecta.' },
    sleep:     { bold:'El silencio es donde integramos.',                sub:'Es donde el cuerpo reconstruye lo que el día deshizo.' },
    movement:  { bold:'El movimiento es el fuego\nque transforma.',      sub:'El movimiento no desgasta. Transforma.' },
    food:      { bold:'Somos lo que elegimos nutrir.',                   sub:'¿De qué tierra vienes?' },
    intention: { bold:'La intención es el alma.',                        sub:'¿Qué te trajo hasta aquí?' },
  }

  const FEEDBACK = {
    mind:      '"La mente abre el primer espacio."',
    water:     '"Este canal será nuestro punto de encuentro."',
    sleep:     '"Siento tu ritmo nocturno. Aprenderé a respirar con él."',
    movement:  '"Tu fuego dará forma a lo que soy."',
    food:      '"Esta es la base. Desde aquí construimos."',
    intention: '"Esa es la razón por la que latiré."',
  }

  return (
    <div style={{ position:'fixed', inset:0, overflow:'hidden' }} onClick={handleFirstInteraction}>

      {/* FONDO */}
      <FullBackground phase={phase} doorOpacity={doorOpacity} />

      {/* BRILLANTINA */}
      <Glitter active={glitter} color={energyColor} />

      {/* DESTELLO FINAL */}
      <Flash active={flash} />

      {/* ── INTRO 1 — Texto flotante ── */}
      <AnimatePresence>
        {phase==='intro1' && (
          <motion.div key="i1"
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            transition={{ duration:1 }}
            style={{ position:'absolute', inset:0, zIndex:20, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <FloatingText bold="Toda vida comienza con energía." color="white" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── INTRO 2 — Texto flotante ── */}
      <AnimatePresence>
        {phase==='intro2' && (
          <motion.div key="i2"
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            transition={{ duration:1 }}
            style={{ position:'absolute', inset:0, zIndex:20, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <FloatingText
              normal="Antes de que existiera cualquier forma,&#10;había una intención."
              color="white"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── NOMBRE ── */}
      <AnimatePresence>
        {phase==='name' && (
          <motion.div key="name"
            initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            transition={{ duration:0.8 }}
            style={{
              position:'absolute', inset:0, zIndex:20,
              display:'flex', flexDirection:'column',
              alignItems:'center', justifyContent:'center',
              padding:'0 28px',
            }}>
            <p style={{ fontSize:16, fontWeight:400, color:'white', margin:'0 0 6px', fontStyle:'italic', opacity:0.8 }}>
              Dime cómo llamarte
            </p>
            <div style={{ width:'100%', maxWidth:360, display:'flex', flexDirection:'column', gap:12 }}>
              <GlassInput
                value={form.name}
                onChange={e=>{ handleFirstInteraction(); set('name',e.target.value) }}
                placeholder="Mi nombre es…"
              />
              {form.name && (
                <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }}
                  style={{ fontSize:12, color:'rgba(255,255,255,0.8)', fontStyle:'italic', textAlign:'center', margin:0 }}>
                  "{form.name}". Ese nombre será el primer latido. ✨
                </motion.p>
              )}
              <GlassButton
                onClick={proceedFromName}
                disabled={!form.name.trim()}
                energyColor="#D4A847">
                Continuar →
              </GlassButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PREGUNTAS ── */}
      <AnimatePresence>
        {phase==='questions' && (
          <motion.div key="questions"
            initial={{ opacity:0 }} animate={{ opacity:1 }}
            style={{
              position:'absolute', inset:0, zIndex:20,
              display:'flex', flexDirection:'column',
              justifyContent:'flex-end',
              padding:'0 0 40px',
            }}>

            {/* Texto de la pregunta — sin fondo, en el aire */}
            <div style={{ padding:'0 28px 20px', textAlign:'center' }}>
              <AnimatePresence mode="wait">
                <motion.div key={`qt-${qStep}`}
                  initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                  exit={{ opacity:0, y:-8 }} transition={{ duration:0.4 }}>
                  <p style={{ fontSize:18, fontWeight:900, color:'white', margin:'0 0 6px', lineHeight:1.3, whiteSpace:'pre-line',
                    textShadow:'0 2px 12px rgba(0,0,0,0.3)' }}>
                    {Q_TEXT[currentKey]?.bold}
                  </p>
                  <p style={{ fontSize:13, color:'rgba(255,255,255,0.8)', margin:0, fontStyle:'italic',
                    textShadow:'0 1px 8px rgba(0,0,0,0.3)' }}>
                    {Q_TEXT[currentKey]?.sub}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Selector desplegable + botón */}
            <div style={{ padding:'0 20px', display:'flex', flexDirection:'column', gap:10, maxWidth:440, margin:'0 auto', width:'100%' }}>
              <AnimatePresence mode="wait">
                <motion.div key={`qs-${qStep}`}
                  initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
                  exit={{ opacity:0 }} transition={{ duration:0.3 }}>
                  <GlassSelect
                    options={Q_OPTIONS[currentKey] || []}
                    value={form[currentKey]}
                    onChange={v=>handleAnswer(currentKey, v)}
                    energyColor={energyColor}
                  />
                </motion.div>
              </AnimatePresence>

              {/* Feedback de la criatura */}
              <AnimatePresence>
                {form[currentKey] && (
                  <motion.p
                    initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                    style={{ fontSize:12, color:'rgba(255,255,255,0.75)', fontStyle:'italic', textAlign:'center', margin:0,
                      textShadow:'0 1px 8px rgba(0,0,0,0.4)' }}>
                    {FEEDBACK[currentKey]}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Progreso minimalista */}
              <div style={{ display:'flex', gap:4, justifyContent:'center' }}>
                {qKeys.map((_,i)=>(
                  <motion.div key={i}
                    animate={{ width: i===qStep?24:6, background: i<qStep?'rgba(255,255,255,0.9)':i===qStep?energyColor:'rgba(255,255,255,0.3)' }}
                    style={{ height:3, borderRadius:2 }}
                    transition={{ duration:0.3 }}
                  />
                ))}
              </div>

              <GlassButton
                onClick={goNextQ}
                disabled={!form[currentKey]}
                energyColor={energyColor}>
                {isLastQ ? '✨ Despertar a Pandi' : 'Continuar →'}
              </GlassButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── NACIDA ── */}
      <AnimatePresence>
        {phase==='born' && (
          <motion.div key="born"
            initial={{ opacity:0 }} animate={{ opacity:1 }}
            transition={{ duration:0.8, delay:0.4 }}
            style={{
              position:'absolute', inset:0, zIndex:20,
              display:'flex', flexDirection:'column',
              alignItems:'center', justifyContent:'flex-end',
              padding:'0 28px 60px',
            }}>
            <motion.div
              initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
              transition={{ delay:0.8 }}
              style={{ textAlign:'center', maxWidth:300 }}>
              <p style={{ fontSize:11, color:'rgba(255,255,255,0.6)', letterSpacing:'.1em', textTransform:'uppercase', margin:'0 0 10px', fontWeight:700 }}>
                ya estoy aquí
              </p>
              <p style={{ fontSize:15, color:'white', lineHeight:1.9, margin:'0 0 28px', fontStyle:'italic',
                textShadow:'0 2px 12px rgba(0,0,0,0.3)' }}>
                "No soy una recompensa.<br/>
                Soy tu reflejo.<br/>
                Lo que ocurra conmigo<br/>
                dependerá de cómo<br/>
                te cuides a partir de hoy."
              </p>
              <motion.button
                initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:1.4 }}
                whileTap={{ scale:0.97 }}
                onClick={finish}
                disabled={loading}
                style={{
                  padding:'16px 44px', borderRadius:22,
                  background:'white',
                  border:'none', color:'#1A2332',
                  fontSize:16, fontWeight:800, cursor:'pointer',
                  boxShadow:'0 8px 32px rgba(0,0,0,0.15)',
                }}>
                {loading ? 'Un momento…' : 'Empezar a crecer juntos 🐾'}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
