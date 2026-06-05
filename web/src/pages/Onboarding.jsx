import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/useStore'
import { useTheme } from '../contexts/ThemeProvider'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'

// ─── ENERGÍAS ─────────────────────────────────────────────────────────────────
const ENERGIES = {
  water:     { color:'#3B82F6', glow:'rgba(59,130,246,0.7)',  emoji:'💧', freq:528 },
  sleep:     { color:'#8B5CF6', glow:'rgba(139,92,246,0.7)',  emoji:'✨', freq:396 },
  movement:  { color:'#F97316', glow:'rgba(249,115,22,0.7)',  emoji:'🔥', freq:741 },
  food:      { color:'#22C55E', glow:'rgba(34,197,94,0.7)',   emoji:'🌱', freq:639 },
  intention: { color:'#EC4899', glow:'rgba(236,72,153,0.7)',  emoji:'💜', freq:852 },
}

// ─── AUDIO ────────────────────────────────────────────────────────────────────
function useAudio() {
  const ambientRef = useRef(null)
  const ctxRef     = useRef(null)

  function startAmbient() {
    try {
      if (ambientRef.current) return
      const audio = new Audio('/audio/ambient-bowls.mp3')
      audio.loop = true; audio.volume = 0
      audio.play().catch(() => {})
      ambientRef.current = audio
      let v = 0
      const id = setInterval(() => {
        v = Math.min(v + 0.02, 0.3)
        audio.volume = v
        if (v >= 0.3) clearInterval(id)
      }, 100)
    } catch {}
  }

  function stopAmbient() {
    const a = ambientRef.current; if (!a) return
    let v = a.volume
    const id = setInterval(() => {
      v = Math.max(v - 0.03, 0); a.volume = v
      if (v <= 0) { clearInterval(id); a.pause(); ambientRef.current = null }
    }, 80)
  }

  function playTone(freq = 528) {
    try {
      if (!ctxRef.current) ctxRef.current = new (window.AudioContext || window.webkitAudioContext)()
      const ctx = ctxRef.current
      const osc = ctx.createOscillator(); const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.type = 'sine'; osc.frequency.value = freq
      gain.gain.setValueAtTime(0, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9)
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.9)
    } catch {}
  }

  function playHeartbeat() {
    try {
      if (!ctxRef.current) ctxRef.current = new (window.AudioContext || window.webkitAudioContext)()
      const ctx = ctxRef.current
      const beat = (t) => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain()
        osc.connect(gain); gain.connect(ctx.destination)
        osc.type = 'sine'; osc.frequency.value = 80
        gain.gain.setValueAtTime(0, t)
        gain.gain.linearRampToValueAtTime(0.3, t + 0.05)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3)
        osc.start(t); osc.stop(t + 0.3)
      }
      beat(ctx.currentTime)
      beat(ctx.currentTime + 0.25)
      // Armonía
      ;[528,639,741].forEach((f,i) => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain()
        osc.connect(gain); gain.connect(ctx.destination)
        osc.type = 'sine'; osc.frequency.value = f
        const t = ctx.currentTime + 0.6 + i*0.2
        gain.gain.setValueAtTime(0, t)
        gain.gain.linearRampToValueAtTime(0.1, t + 0.1)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 1.5)
        osc.start(t); osc.stop(t + 1.5)
      })
    } catch {}
  }

  useEffect(() => () => stopAmbient(), [])
  return { startAmbient, stopAmbient, playTone, playHeartbeat }
}

// ─── ESCENA VISUAL DEL ORB ────────────────────────────────────────────────────
// step 0: solo santuario cerrado
// step 1-5: santuario abierto + orb con puerta que se va transparentando
// step 6: nacimiento con latido
function OrbScene({ step, filledCount, born }) {
  // Opacidad de la puerta del orb: empieza en 1, baja 0.2 por cada energía
  const doorOpacity = Math.max(1 - filledCount * 0.2, 0)
  // Opacidad del bebé: inversa a la puerta
  const babyOpacity = Math.min(filledCount * 0.22, 1)

  return (
    <div style={{ position:'relative', width:'100%', height:'100%' }}>

      {/* 1. SANTUARIO CERRADO — solo en step 0 */}
      <AnimatePresence>
        {step === 0 && (
          <motion.img
            key="closed"
            src="/panda/onboarding_sanctuary_closed.png"
            initial={{ opacity:0 }}
            animate={{ opacity:1 }}
            exit={{ opacity:0 }}
            transition={{ duration:1.5 }}
            style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', objectPosition:'center' }}
          />
        )}
      </AnimatePresence>

      {/* 2. FONDO NUBES — aparece en step 1+ */}
      <AnimatePresence>
        {step >= 1 && (
          <motion.img
            key="clouds"
            src="/panda/onboarding_clouds.png"
            initial={{ opacity:0 }}
            animate={{ opacity:1 }}
            exit={{ opacity:0 }}
            transition={{ duration:2 }}
            style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', objectPosition:'center' }}
          />
        )}
      </AnimatePresence>

      {/* 3. ORB — aparece en step 1+ */}
      <AnimatePresence>
        {step >= 1 && (
          <motion.div
            key="orb"
            initial={{ opacity:0, scale:0.7 }}
            animate={{ opacity:1, scale:1 }}
            transition={{ duration:1.2, type:'spring', damping:20 }}
            style={{
              position:'absolute',
              bottom:'5%', left:'50%',
              transform:'translateX(-50%)',
              width:'55%', maxWidth:280,
            }}>

            {/* Glow del orb */}
            <motion.div
              animate={{ scale:[1,1.08,1], opacity:[0.4,0.7,0.4] }}
              transition={{ duration:3, repeat:Infinity, ease:'easeInOut' }}
              style={{
                position:'absolute', inset:-20,
                borderRadius:'50%',
                background:'radial-gradient(circle, rgba(255,220,140,0.5) 0%, transparent 70%)',
                filter:'blur(20px)',
              }}
            />

            {/* Baby Pandi — debajo de la puerta */}
            <motion.img
              src="/panda/onboarding_orb_baby_clear.png"
              animate={{ opacity: babyOpacity }}
              transition={{ duration:0.8 }}
              style={{
                position:'absolute', inset:0,
                width:'100%', height:'100%',
                objectFit:'contain',
                filter: `blur(${Math.max(0, (1-babyOpacity)*6)}px)`,
              }}
              onError={e => e.target.style.display='none'}
            />

            {/* Puerta del orb — se va haciendo transparente */}
            <motion.img
              src="/panda/onboarding_orb_door.png"
              animate={{ opacity: doorOpacity }}
              transition={{ duration:0.8 }}
              style={{
                position:'relative', zIndex:2,
                width:'100%', height:'auto',
                objectFit:'contain',
                display:'block',
              }}
              onError={e => e.target.style.display='none'}
            />

            {/* Partículas de energía */}
            {filledCount > 0 && [...Array(filledCount)].map((_,i) => (
              <motion.div key={i}
                animate={{ y:[0,-(20+i*8),0], opacity:[0,0.7,0] }}
                transition={{ duration:2+i*0.3, delay:i*0.4, repeat:Infinity }}
                style={{
                  position:'absolute',
                  bottom:'30%', left:`${30+i*10}%`,
                  width:6, height:6, borderRadius:'50%',
                  background:Object.values(ENERGIES)[i]?.color,
                  filter:'blur(1px)',
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. LATIDO — born */}
      <AnimatePresence>
        {born && (
          <motion.div
            initial={{ scale:0.8, opacity:0 }}
            animate={{ scale:[1,1.06,1], opacity:1 }}
            transition={{ scale:{ duration:1, repeat:Infinity }, opacity:{ duration:0.5 } }}
            style={{
              position:'absolute', inset:0,
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
            <motion.div
              animate={{ scale:[1,1.15,1], opacity:[0.3,0.6,0.3] }}
              transition={{ duration:1.2, repeat:Infinity }}
              style={{
                width:200, height:200, borderRadius:'50%',
                background:'radial-gradient(circle, rgba(255,180,100,0.6) 0%, transparent 70%)',
                filter:'blur(20px)',
                position:'absolute',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── ESCENA DE NACIMIENTO ─────────────────────────────────────────────────────
function BirthScene({ name, onContinue, playHeartbeat }) {
  const [phase, setPhase] = useState('heartbeat')
  const [imgErr, setImgErr] = useState(false)

  useEffect(() => {
    playHeartbeat()
    const t1 = setTimeout(() => setPhase('glow'),    800)
    const t2 = setTimeout(() => setPhase('born'),   1800)
    const t3 = setTimeout(() => setPhase('message'),3200)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
      style={{
        position:'fixed', inset:0, zIndex:200,
        display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center',
        overflow:'hidden', padding:'32px 24px',
      }}>

      {/* Fondo */}
      <img src="/panda/onboarding_clouds.png" alt=""
        style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', opacity:0.8 }} />
      <div style={{ position:'absolute', inset:0, background:'rgba(255,248,235,0.4)' }} />

      {/* Pulso de luz */}
      <AnimatePresence>
        {phase === 'glow' && (
          <motion.div
            initial={{ scale:0.5, opacity:0.8 }}
            animate={{ scale:4, opacity:0 }}
            transition={{ duration:1, ease:'easeOut' }}
            style={{
              position:'absolute',
              width:120, height:120, borderRadius:'50%',
              background:'radial-gradient(circle, rgba(255,220,140,0.9) 0%, rgba(255,180,80,0.4) 60%, transparent 80%)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Partículas */}
      {(phase==='born'||phase==='message') && [...Array(16)].map((_,i) => (
        <motion.div key={i}
          initial={{ x:0, y:0, opacity:1 }}
          animate={{ x:Math.cos(i*22.5*Math.PI/180)*160, y:Math.sin(i*22.5*Math.PI/180)*160, opacity:0 }}
          transition={{ duration:1.2, delay:i*0.03 }}
          style={{
            position:'absolute', width:7, height:7, borderRadius:'50%',
            background:['#2EC4B6','#FF8FA3','#F59E0B','#6366F1','#22C55E'][i%5],
          }}
        />
      ))}

      {/* Resultado — orb con Pandi */}
      <AnimatePresence>
        {(phase==='born'||phase==='message') && (
          <motion.div
            initial={{ scale:0.6, opacity:0, y:20 }}
            animate={{ scale:1, opacity:1, y:0 }}
            transition={{ type:'spring', damping:14, stiffness:160 }}
            style={{ position:'relative', zIndex:1, width:'65%', maxWidth:300, marginBottom:32 }}>
            <motion.div
              animate={{ scale:[1,1.1,1], opacity:[0.3,0.5,0.3] }}
              transition={{ duration:2, repeat:Infinity }}
              style={{
                position:'absolute', inset:-30, borderRadius:'50%',
                background:'radial-gradient(circle, rgba(255,200,100,0.5) 0%, transparent 70%)',
                filter:'blur(20px)',
              }}
            />
            {imgErr
              ? <span style={{ fontSize:120, display:'block' }}>🐾</span>
              : <motion.img
                  src="/panda/onboarding_orb_baby_clear.png"
                  alt="Pandi"
                  animate={phase==='message' ? { y:[0,-6,0] } : {}}
                  transition={{ duration:3, repeat:Infinity, ease:'easeInOut' }}
                  style={{ width:'100%', objectFit:'contain', position:'relative', zIndex:1 }}
                  onError={() => setImgErr(true)}
                />
            }
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mensaje */}
      <AnimatePresence>
        {phase==='message' && (
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
            transition={{ delay:0.3 }}
            style={{ textAlign:'center', maxWidth:300, position:'relative', zIndex:1 }}>
            <p style={{ fontSize:11, color:'#9CA3AF', letterSpacing:'.1em', textTransform:'uppercase', margin:'0 0 8px', fontWeight:700 }}>
              ha nacido
            </p>
            <h2 style={{ fontSize:24, fontWeight:900, color:'#1A2332', margin:'0 0 14px', lineHeight:1.2 }}>
              {name ? `${name},\nesta eres tú.` : 'Esta eres tú.'} 🐾
            </h2>
            <p style={{ fontSize:13, color:'#6B7280', lineHeight:1.9, margin:'0 0 28px', fontStyle:'italic' }}>
              "No soy una recompensa.<br/>
              Soy tu reflejo.<br/>
              Lo que ocurra conmigo<br/>
              dependerá de cómo te cuides<br/>
              a partir de hoy."
            </p>
            <motion.button
              initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.8 }}
              whileTap={{ scale:0.97 }}
              onClick={onContinue}
              style={{
                padding:'16px 44px', borderRadius:22,
                background:'linear-gradient(135deg, #2EC4B6, #FF8FA3)',
                border:'none', color:'white',
                fontSize:16, fontWeight:800, cursor:'pointer',
                boxShadow:'0 8px 32px rgba(46,196,182,0.4)',
              }}>
              Empezar a crecer juntos 🐾
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── OPCIÓN CARD ──────────────────────────────────────────────────────────────
function OptionCard({ selected, onSelect, emoji, label, energyColor }) {
  return (
    <motion.button whileTap={{ scale:0.97 }} onClick={onSelect}
      style={{
        width:'100%', display:'flex', alignItems:'center', gap:12,
        padding:'12px 16px', borderRadius:16,
        border:`1.5px solid ${selected ? energyColor : 'rgba(255,255,255,0.5)'}`,
        background: selected ? `${energyColor}20` : 'rgba(255,255,255,0.55)',
        backdropFilter:'blur(16px)',
        textAlign:'left', cursor:'pointer',
        boxShadow: selected
          ? `0 4px 20px ${energyColor}30, inset 0 1px 0 rgba(255,255,255,0.6)`
          : '0 2px 8px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.6)',
        transition:'all 0.2s',
      }}>
      <span style={{ fontSize:20 }}>{emoji}</span>
      <span style={{ fontSize:13, fontWeight:500, color: selected ? energyColor : '#374151', flex:1 }}>{label}</span>
      {selected && (
        <motion.div initial={{ scale:0 }} animate={{ scale:1 }}
          style={{ width:18, height:18, borderRadius:'50%', background:energyColor, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <span style={{ fontSize:10, color:'white' }}>✓</span>
        </motion.div>
      )}
    </motion.button>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function Onboarding() {
  const { theme }             = useTheme()
  const [step, setStep]       = useState(0)
  const [loading, setLoading] = useState(false)
  const [showBirth, setShowBirth] = useState(false)
  const [absorbing, setAbsorbing] = useState(false)
  const { user, fetchProfile }    = useStore()
  const navigate  = useNavigate()
  const audio     = useAudio()
  const started   = useRef(false)

  const [form, setForm] = useState({
    name:'', birth_date:'', sex:'other',
    water:'', sleep:'', movement:'', food:'', intention:'',
    intentionCustom:'',
  })
  const set = (k,v) => setForm(f => ({...f,[k]:v}))

  const filledEnergies = [
    form.water     ? 'water'     : null,
    form.sleep     ? 'sleep'     : null,
    form.movement  ? 'movement'  : null,
    form.food      ? 'food'      : null,
    form.intention ? 'intention' : null,
  ].filter(Boolean)

  const filledCount    = filledEnergies.length
  const stepEnergyKey  = ['water','sleep','movement','food','intention'][step-1] || null
  const energyColor    = stepEnergyKey ? ENERGIES[stepEnergyKey]?.color : '#D4A847'

  function handleFirstInteraction() {
    if (!started.current) { started.current = true; audio.startAmbient() }
  }

  function selectOption(key, value) {
    handleFirstInteraction()
    set(key, value)
    audio.playTone(ENERGIES[stepEnergyKey]?.freq || 528)
    setAbsorbing(true)
    setTimeout(() => setAbsorbing(false), 700)
  }

  const canNext = () => {
    if (step===0) return form.name.trim().length > 0
    if (step===1) return !!form.water
    if (step===2) return !!form.sleep
    if (step===3) return !!form.movement
    if (step===4) return !!form.food
    if (step===5) return !!form.intention
    return true
  }

  function goNext() {
    handleFirstInteraction()
    if (canNext()) setStep(s=>s+1)
  }

  async function finish() {
    setLoading(true)
    try {
      const userId = user.id
      const sleepHours   = { low:4, irregular:5.5, enough:7, deep:8 }[form.sleep] || 7
      const trainingDays = { never:0, sometimes:1, regular:3, daily:5 }[form.movement] || 2
      const motivation   = form.intention==='custom' ? form.intentionCustom : form.intention

      await supabase.from('user_profiles').update({
        name: form.name, onboarding_done:true, motivation_why: motivation||null,
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
      setShowBirth(true)
    } catch(err) { alert('Error: '+err.message) }
    finally { setLoading(false) }
  }

  if (showBirth) {
    return <BirthScene name={form.name} onContinue={() => navigate('/')} playHeartbeat={audio.playHeartbeat} />
  }

  // ── PASOS ──────────────────────────────────────────────────────────────────
  const STEPS = [
    {
      title: 'Toda vida\ncomienza con energía.',
      subtitle: 'Antes de que existiera cualquier forma,\nhabía una intención.\n\nDime cómo llamarte.',
      content: (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <input className="input" placeholder="Mi nombre es…" value={form.name}
            onChange={e => { handleFirstInteraction(); set('name', e.target.value) }}
            style={{ fontSize:16, fontWeight:500, background:'rgba(255,255,255,0.7)', backdropFilter:'blur(16px)' }}
            autoFocus />
          {form.name && (
            <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }}
              style={{ fontSize:12, color:'#D4A847', fontStyle:'italic', margin:0, paddingLeft:4 }}>
              "{form.name}". Ese nombre será el primer latido. ✨
            </motion.p>
          )}
          <div style={{ display:'flex', gap:10 }}>
            <div style={{ flex:1 }}>
              <label style={{ fontSize:11, color:'#9CA3AF', fontWeight:600, display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'.05em' }}>Naciste en</label>
              <input className="input" type="date" value={form.birth_date} onChange={e => set('birth_date', e.target.value)}
                style={{ background:'rgba(255,255,255,0.7)', backdropFilter:'blur(16px)' }} />
            </div>
            <div style={{ flex:1 }}>
              <label style={{ fontSize:11, color:'#9CA3AF', fontWeight:600, display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'.05em' }}>Te identificas</label>
              <select className="input" value={form.sex} onChange={e => set('sex', e.target.value)}
                style={{ background:'rgba(255,255,255,0.7)', backdropFilter:'blur(16px)' }}>
                <option value="male">Hombre</option>
                <option value="female">Mujer</option>
                <option value="other">Prefiero no decir</option>
              </select>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'El agua es el canal.',
      subtitle: 'El agua no me llena — me conecta.\n¿Cuánto fluye a través de ti cada día?',
      feedback: form.water ? '"Este canal será nuestro punto de encuentro."' : null,
      content: (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {[
            {v:'none',    emoji:'🏜️', label:'Casi nada — menos de 1 litro'},
            {v:'little',  emoji:'💧', label:'Lo justo — 1 a 1.5 litros'},
            {v:'enough',  emoji:'🌊', label:'Bien — 1.5 a 2 litros'},
            {v:'flowing', emoji:'🌀', label:'Fluyo — más de 2 litros'},
          ].map((o,i) => (
            <motion.div key={o.v} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.06 }}>
              <OptionCard selected={form.water===o.v} onSelect={() => selectOption('water',o.v)}
                emoji={o.emoji} label={o.label} energyColor={energyColor} />
            </motion.div>
          ))}
        </div>
      ),
    },
    {
      title: 'El silencio es\ndonde integramos.',
      subtitle: 'El silencio no es ausencia.\nEs donde el cuerpo reconstruye lo que el día deshizo.',
      feedback: form.sleep ? '"Siento tu ritmo nocturno. Aprenderé a respirar con él."' : null,
      content: (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {[
            {v:'low',       emoji:'🌑', label:'Poco — menos de 5 horas'},
            {v:'irregular', emoji:'🌓', label:'Irregular — entre 5 y 6 horas'},
            {v:'enough',    emoji:'🌕', label:'Suficiente — 6 a 7 horas'},
            {v:'deep',      emoji:'✨', label:'Profundo — más de 7 horas'},
          ].map((o,i) => (
            <motion.div key={o.v} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.06 }}>
              <OptionCard selected={form.sleep===o.v} onSelect={() => selectOption('sleep',o.v)}
                emoji={o.emoji} label={o.label} energyColor={energyColor} />
            </motion.div>
          ))}
        </div>
      ),
    },
    {
      title: 'El movimiento es\nel fuego que transforma.',
      subtitle: 'El movimiento no desgasta. Transforma.\n¿Con qué frecuencia enciendes ese fuego?',
      feedback: form.movement ? '"Tu fuego dará forma a lo que soy."' : null,
      content: (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {[
            {v:'never',     emoji:'🪨', label:'Casi nunca'},
            {v:'sometimes', emoji:'🌿', label:'Una o dos veces por semana'},
            {v:'regular',   emoji:'🔥', label:'Tres o cuatro veces'},
            {v:'daily',     emoji:'⚡', label:'Cada día es una oportunidad'},
          ].map((o,i) => (
            <motion.div key={o.v} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.06 }}>
              <OptionCard selected={form.movement===o.v} onSelect={() => selectOption('movement',o.v)}
                emoji={o.emoji} label={o.label} energyColor={energyColor} />
            </motion.div>
          ))}
        </div>
      ),
    },
    {
      title: 'Somos lo que\nelegimos nutrir.',
      subtitle: 'Ya tengo agua, silencio y fuego.\nAhora necesito saber de qué tierra vienes.',
      feedback: form.food ? '"Esta es la base. Desde aquí construimos."' : null,
      content: (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          {[
            {v:'omnivore',    emoji:'🍽️', label:'De todo un poco'},
            {v:'vegetarian',  emoji:'🥗', label:'Sin carne'},
            {v:'vegan',       emoji:'🌱', label:'Solo plantas'},
            {v:'pescatarian', emoji:'🐟', label:'Del mar'},
            {v:'keto',        emoji:'🥑', label:'Bajo en carbos'},
            {v:'paleo',       emoji:'🍖', label:'Sin procesar'},
          ].map((o,i) => (
            <motion.button key={o.v}
              initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} transition={{ delay:i*0.05 }}
              whileTap={{ scale:0.96 }} onClick={() => selectOption('food',o.v)}
              style={{
                padding:'14px 8px', borderRadius:16,
                border:`1.5px solid ${form.food===o.v ? energyColor : 'rgba(255,255,255,0.5)'}`,
                background: form.food===o.v ? `${energyColor}22` : 'rgba(255,255,255,0.55)',
                backdropFilter:'blur(16px)',
                display:'flex', flexDirection:'column', alignItems:'center', gap:6,
                cursor:'pointer',
                boxShadow: form.food===o.v ? `0 4px 16px ${energyColor}30` : '0 2px 8px rgba(0,0,0,0.05)',
                transition:'all 0.2s',
              }}>
              <span style={{ fontSize:22 }}>{o.emoji}</span>
              <span style={{ fontSize:11, fontWeight:500, color: form.food===o.v ? energyColor : '#374151', textAlign:'center' }}>{o.label}</span>
            </motion.button>
          ))}
        </div>
      ),
    },
    {
      title: 'La intención\nes el alma.',
      subtitle: 'Tengo forma. Tengo energía.\nSolo me falta saber por qué existo.',
      feedback: form.intention ? '"Esa es la razón por la que latiré."' : null,
      content: (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {[
            {v:'family',    emoji:'👨‍👩‍👧', label:'Estar presente para quienes amo'},
            {v:'body',      emoji:'💪',    label:'Reconocerme cuando me miro'},
            {v:'health',    emoji:'🏥',    label:'Controlar algo que me preocupa'},
            {v:'energy',    emoji:'⚡',    label:'Tener más energía para lo que importa'},
            {v:'habits',    emoji:'🌱',    label:'Recuperar algo que perdí'},
            {v:'wellbeing', emoji:'🧘',    label:'Cuidarme por primera vez de verdad'},
          ].map((o,i) => (
            <motion.div key={o.v} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.05 }}>
              <OptionCard selected={form.intention===o.v} onSelect={() => selectOption('intention',o.v)}
                emoji={o.emoji} label={o.label} energyColor={energyColor} />
            </motion.div>
          ))}
          {form.intention && form.intention!=='custom' && (
            <button onClick={() => set('intention','custom')}
              style={{ background:'none', border:'none', color:'#9CA3AF', fontSize:12, cursor:'pointer', padding:'4px 0' }}>
              ✍️ Escribir mi propia razón
            </button>
          )}
          {form.intention==='custom' && (
            <motion.input initial={{ opacity:0 }} animate={{ opacity:1 }}
              className="input" placeholder="Mi razón es…"
              value={form.intentionCustom} onChange={e => set('intentionCustom',e.target.value)}
              style={{ background:'rgba(255,255,255,0.7)' }} autoFocus />
          )}
        </div>
      ),
    },
  ]

  const current = STEPS[step]
  const isLast  = step === STEPS.length - 1

  return (
    <div style={{ position:'fixed', inset:0, display:'flex', flexDirection:'column', overflow:'hidden' }}>

      {/* ── FONDO COMPLETO — ocupa toda la pantalla ── */}
      <div style={{ position:'absolute', inset:0, zIndex:0 }}>
        <OrbScene step={step} filledCount={filledCount} born={false} />
      </div>

      {/* ── TRANSICIÓN INICIAL: blanco → imagen ── */}
      <AnimatePresence>
        {step === 0 && (
          <motion.div
            initial={{ opacity:1 }}
            animate={{ opacity:0 }}
            transition={{ duration:2, delay:0.3 }}
            style={{ position:'absolute', inset:0, zIndex:5, background:'white', pointerEvents:'none' }}
          />
        )}
      </AnimatePresence>

      {/* ── PANEL INFERIOR GLASSMORPHISM ── */}
      <div style={{
        position:'absolute', bottom:0, left:0, right:0, zIndex:10,
        background:'rgba(255,252,245,0.82)',
        backdropFilter:'blur(24px)',
        borderTop:'1px solid rgba(255,255,255,0.8)',
        borderRadius:'28px 28px 0 0',
        padding:'20px 20px 40px',
        maxHeight:'55vh',
        overflowY:'auto',
        boxShadow:'0 -8px 40px rgba(0,0,0,0.08)',
        maxWidth:440,
        margin:'0 auto',
        width:'100%',
      }}>

        {/* Pill decorativo */}
        <div style={{ width:40, height:4, borderRadius:2, background:'rgba(0,0,0,0.1)', margin:'0 auto 16px' }} />

        {/* Título */}
        <AnimatePresence mode="wait">
          <motion.div key={`t-${step}`}
            initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
            exit={{ opacity:0, y:-8 }} transition={{ duration:0.25 }}
            style={{ marginBottom:14 }}>
            <h2 style={{ fontSize:19, fontWeight:900, color:'#1A2332', margin:'0 0 6px', lineHeight:1.25, whiteSpace:'pre-line' }}>
              {current.title}
            </h2>
            <p style={{ fontSize:12, color:'#6B7280', margin:0, lineHeight:1.6, whiteSpace:'pre-line' }}>
              {current.subtitle}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Contenido */}
        <AnimatePresence mode="wait">
          <motion.div key={`c-${step}`}
            initial={{ opacity:0, x:16 }} animate={{ opacity:1, x:0 }}
            exit={{ opacity:0, x:-16 }} transition={{ duration:0.2 }}>
            {current.content}
            <AnimatePresence>
              {current.feedback && (
                <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                  style={{ marginTop:10, padding:'10px 14px', borderRadius:14,
                    background:`${energyColor}14`, border:`1px solid ${energyColor}30` }}>
                  <p style={{ fontSize:12, color:energyColor, margin:0, fontStyle:'italic', lineHeight:1.5 }}>
                    {current.feedback}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>

        {/* Progreso */}
        <div style={{ display:'flex', gap:5, margin:'16px 0 12px' }}>
          {STEPS.map((_,i) => (
            <motion.div key={i}
              animate={{
                flex: i===step ? 2 : 1,
                background: i<step ? '#2EC4B6' : i===step ? energyColor : 'rgba(0,0,0,0.1)',
                opacity: i<=step ? 1 : 0.3,
              }}
              transition={{ duration:0.4 }}
              style={{ height:3, borderRadius:3 }}
            />
          ))}
        </div>

        {/* Botones */}
        <div style={{ display:'flex', gap:10 }}>
          {step > 0 && (
            <motion.button whileTap={{ scale:0.97 }} onClick={() => setStep(s=>s-1)}
              style={{ padding:'13px 18px', borderRadius:14, border:'1.5px solid rgba(0,0,0,0.1)',
                background:'rgba(255,255,255,0.8)', color:'#6B7280', fontSize:14, fontWeight:600, cursor:'pointer' }}>
              ←
            </motion.button>
          )}
          <motion.button
            whileTap={{ scale: canNext() ? 0.97 : 1 }}
            onClick={isLast ? finish : goNext}
            disabled={!canNext() || loading}
            style={{
              flex:1, padding:'13px 20px', borderRadius:14,
              background: canNext()
                ? isLast
                  ? 'linear-gradient(135deg, #2EC4B6, #FF8FA3)'
                  : `linear-gradient(135deg, ${energyColor}, ${energyColor}cc)`
                : 'rgba(0,0,0,0.1)',
              border:'none', color:'white',
              fontSize:15, fontWeight:700,
              cursor: canNext() ? 'pointer' : 'default',
              opacity: canNext() ? 1 : 0.45,
              boxShadow: canNext() ? `0 6px 20px ${energyColor}40` : 'none',
              transition:'all 0.3s',
            }}>
            {loading
              ? <motion.span animate={{ opacity:[1,0.5,1] }} transition={{ duration:1, repeat:Infinity }}>Dando vida…</motion.span>
              : isLast ? '✨ Despertar a Pandi' : 'Continuar →'
            }
          </motion.button>
        </div>
      </div>
    </div>
  )
}
