import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/useStore'
import { useTheme } from '../contexts/ThemeProvider'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'

// ─── ENERGÍAS ─────────────────────────────────────────────────────────────────
const ENERGIES = {
  water:     { color:'#3B82F6', glow:'rgba(59,130,246,0.7)',  tint:'rgba(59,130,246,0.25)',  emoji:'💧', freq:528 },
  sleep:     { color:'#8B5CF6', glow:'rgba(139,92,246,0.7)',  tint:'rgba(139,92,246,0.25)',  emoji:'✨', freq:396 },
  movement:  { color:'#F97316', glow:'rgba(249,115,22,0.7)',  tint:'rgba(249,115,22,0.25)',  emoji:'🔥', freq:741 },
  food:      { color:'#22C55E', glow:'rgba(34,197,94,0.7)',   tint:'rgba(34,197,94,0.25)',   emoji:'🌱', freq:639 },
  intention: { color:'#EC4899', glow:'rgba(236,72,153,0.7)',  tint:'rgba(236,72,153,0.25)',  emoji:'💜', freq:852 },
}

// ─── AUDIO ────────────────────────────────────────────────────────────────────
function useAudio() {
  const ambientRef = useRef(null)
  const ctxRef     = useRef(null)

  function startAmbient() {
    try {
      if (ambientRef.current) return
      const audio = new Audio('/audio/ambient-bowls.mp3')
      audio.loop   = true
      audio.volume = 0
      audio.play().catch(() => {})
      ambientRef.current = audio
      // Fade in
      let v = 0
      const id = setInterval(() => {
        v = Math.min(v + 0.02, 0.28)
        audio.volume = v
        if (v >= 0.28) clearInterval(id)
      }, 100)
    } catch {}
  }

  function stopAmbient() {
    const a = ambientRef.current
    if (!a) return
    let v = a.volume
    const id = setInterval(() => {
      v = Math.max(v - 0.03, 0)
      a.volume = v
      if (v <= 0) { clearInterval(id); a.pause(); ambientRef.current = null }
    }, 80)
  }

  function playTone(freq = 528) {
    try {
      if (!ctxRef.current) ctxRef.current = new (window.AudioContext || window.webkitAudioContext)()
      const ctx = ctxRef.current
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.8)
    } catch {}
  }

  function playBirth() {
    try {
      if (!ctxRef.current) ctxRef.current = new (window.AudioContext || window.webkitAudioContext)()
      const ctx = ctxRef.current
      ;[528, 639, 741, 852].forEach((f, i) => {
        const osc  = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain); gain.connect(ctx.destination)
        osc.type = 'sine'
        osc.frequency.value = f
        const t = ctx.currentTime + i * 0.15
        gain.gain.setValueAtTime(0, t)
        gain.gain.linearRampToValueAtTime(0.15, t + 0.1)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 1.5)
        osc.start(t); osc.stop(t + 1.5)
      })
    } catch {}
  }

  useEffect(() => () => stopAmbient(), [])

  return { startAmbient, stopAmbient, playTone, playBirth }
}

// ─── ORB CON IMAGEN REAL ──────────────────────────────────────────────────────
function EnergyOrb({ filledEnergies, activeEnergy, absorbing }) {
  const [orbErr,   setOrbErr]   = useState(false)
  const [babyErr,  setBabyErr]  = useState(false)
  const fill     = filledEnergies.length / 5
  const lastE    = filledEnergies[filledEnergies.length - 1]
  const tint     = lastE ? ENERGIES[lastE]?.tint : 'rgba(255,220,100,0.15)'
  const glowCol  = lastE ? ENERGIES[lastE]?.glow : 'rgba(255,220,140,0.4)'
  const showBaby = filledEnergies.length >= 3

  return (
    <div style={{ position:'relative', width:260, height:300, margin:'0 auto' }}>

      {/* Glow exterior pulsante */}
      <motion.div
        animate={{ scale:[1,1.1,1], opacity:[0.3,0.6,0.3] }}
        transition={{ duration: absorbing ? 0.6 : 4, repeat:Infinity, ease:'easeInOut' }}
        style={{
          position:'absolute', inset:-40,
          borderRadius:'50%',
          background:`radial-gradient(circle, ${glowCol} 0%, transparent 65%)`,
          filter:'blur(28px)',
        }}
      />

      {/* Orb imagen */}
      {orbErr ? (
        <motion.div
          animate={{ scale:[1,1.04,1] }}
          transition={{ duration:3, repeat:Infinity }}
          style={{
            width:'100%', height:'100%',
            borderRadius:'50%',
            background:'radial-gradient(ellipse at 35% 30%, rgba(255,240,200,0.9), rgba(200,180,140,0.6))',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:80,
          }}>
          ✨
        </motion.div>
      ) : (
        <motion.img
          src="/panda/panda_orb.png"
          alt="orb"
          animate={{ scale: absorbing ? [1,1.06,1] : [1,1.02,1] }}
          transition={{ duration: absorbing ? 0.4 : 4, repeat:Infinity, ease:'easeInOut' }}
          style={{ width:'100%', height:'100%', objectFit:'contain', position:'relative', zIndex:1 }}
          onError={() => setOrbErr(true)}
        />
      )}

      {/* Tinte de energía sobre el orb */}
      <motion.div
        animate={{ opacity: fill > 0 ? 0.7 : 0 }}
        transition={{ duration:0.8 }}
        style={{
          position:'absolute', inset:0, zIndex:2,
          borderRadius:'50%',
          background:`radial-gradient(ellipse at 50% 70%, ${tint} 0%, transparent 70%)`,
          mixBlendMode:'multiply',
          pointerEvents:'none',
        }}
      />

      {/* Bebé dentro del orb — aparece borroso y se va aclarando */}
      <AnimatePresence>
        {showBaby && (
          <motion.div
            initial={{ opacity:0, scale:0.6 }}
            animate={{
              opacity: 0.4 + fill * 0.5,
              scale:   0.7 + fill * 0.15,
              filter:  `blur(${Math.max(0, (1-fill)*8)}px)`,
            }}
            style={{
              position:'absolute',
              top:'55%', left:'50%',
              transform:'translate(-50%,-50%)',
              zIndex:3,
              pointerEvents:'none',
            }}>
            {babyErr
              ? <span style={{ fontSize:48 }}>🐾</span>
              : <img src="/panda/panda_baby.png" alt=""
                  style={{ width:90, height:90, objectFit:'contain' }}
                  onError={() => setBabyErr(true)} />
            }
          </motion.div>
        )}
      </AnimatePresence>

      {/* Partícula que absorbe al seleccionar */}
      <AnimatePresence>
        {absorbing && activeEnergy && (
          <motion.div
            initial={{ bottom:-20, left:'50%', scale:1, opacity:1 }}
            animate={{ bottom:'60%', left:'50%', scale:0.2, opacity:0 }}
            exit={{ opacity:0 }}
            transition={{ duration:0.6, ease:'easeOut' }}
            style={{
              position:'absolute', zIndex:10,
              fontSize:24,
              transform:'translateX(-50%)',
            }}>
            {ENERGIES[activeEnergy]?.emoji}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Indicador de energías acumuladas */}
      <div style={{
        position:'absolute', bottom:-16, left:'50%',
        transform:'translateX(-50%)',
        display:'flex', gap:6, zIndex:5,
      }}>
        {Object.keys(ENERGIES).map((k,i) => (
          <motion.div key={k}
            animate={{
              scale:    filledEnergies.includes(k) ? 1 : 0.6,
              opacity:  filledEnergies.includes(k) ? 1 : 0.25,
              boxShadow: filledEnergies.includes(k) ? `0 0 8px ${ENERGIES[k].color}` : 'none',
            }}
            transition={{ duration:0.4 }}
            style={{
              width:10, height:10, borderRadius:'50%',
              background: ENERGIES[k].color,
            }}
          />
        ))}
      </div>
    </div>
  )
}

// ─── OPCIÓN CARD ──────────────────────────────────────────────────────────────
function OptionCard({ selected, onSelect, emoji, label, theme, energyColor }) {
  return (
    <motion.button
      whileTap={{ scale:0.97 }}
      onClick={onSelect}
      initial={{ opacity:0, y:10 }}
      animate={{ opacity:1, y:0 }}
      style={{
        width:'100%',
        display:'flex', alignItems:'center', gap:12,
        padding:'12px 16px', borderRadius:16,
        border:`1.5px solid ${selected ? energyColor : 'rgba(255,255,255,0.4)'}`,
        background: selected
          ? `${energyColor}22`
          : 'rgba(255,255,255,0.45)',
        backdropFilter:'blur(12px)',
        textAlign:'left', cursor:'pointer',
        boxShadow: selected
          ? `0 4px 20px ${energyColor}30, inset 0 1px 0 rgba(255,255,255,0.5)`
          : '0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.5)',
        transition:'all 0.25s',
      }}>
      <span style={{ fontSize:20, flexShrink:0 }}>{emoji}</span>
      <span style={{ fontSize:13, fontWeight:500, color: selected ? energyColor : '#374151', flex:1, textAlign:'left' }}>
        {label}
      </span>
      {selected && (
        <motion.div initial={{ scale:0 }} animate={{ scale:1 }}
          style={{ width:18, height:18, borderRadius:'50%', background:energyColor,
            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <span style={{ fontSize:10, color:'white' }}>✓</span>
        </motion.div>
      )}
    </motion.button>
  )
}

// ─── ECLOSIÓN ─────────────────────────────────────────────────────────────────
function BirthScene({ name, dominantEnergy, onContinue, playBirth }) {
  const [phase, setPhase] = useState('glow')
  const [babyErr, setBabyErr] = useState(false)

  useEffect(() => {
    playBirth()
    const t1 = setTimeout(() => setPhase('crack'),   600)
    const t2 = setTimeout(() => setPhase('explode'), 1400)
    const t3 = setTimeout(() => setPhase('born'),    2200)
    const t4 = setTimeout(() => setPhase('message'), 3400)
    return () => { clearTimeout(t1);clearTimeout(t2);clearTimeout(t3);clearTimeout(t4) }
  }, [])

  const glowColor = dominantEnergy ? ENERGIES[dominantEnergy]?.glow : 'rgba(46,196,182,0.6)'

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
      style={{
        position:'fixed', inset:0, zIndex:200,
        display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center',
        background:'radial-gradient(ellipse at 50% 40%, #fffbf0 0%, #e8f4fd 40%, #f0e8ff 100%)',
        overflow:'hidden', padding:32,
      }}>

      {/* Grietas de luz */}
      <AnimatePresence>
        {(phase==='crack'||phase==='explode') && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:'absolute', top:'40%', left:'50%', transform:'translate(-50%,-50%)' }}>
            {[...Array(10)].map((_,i) => (
              <motion.div key={i}
                initial={{ scaleX:0, opacity:0.9 }}
                animate={{ scaleX:1, opacity:0 }}
                transition={{ duration:0.5, delay:i*0.06 }}
                style={{
                  position:'absolute',
                  width:80+i*15, height:1.5,
                  background:`linear-gradient(90deg, transparent, ${glowColor.replace('0.7','1')}, transparent)`,
                  top: Math.sin(i*36*Math.PI/180)*60,
                  left: Math.cos(i*36*Math.PI/180)*60 - 40,
                  transform:`rotate(${i*36}deg)`,
                  transformOrigin:'left center',
                  boxShadow:`0 0 6px ${glowColor}`,
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Explosión */}
      <AnimatePresence>
        {phase==='explode' && (
          <motion.div
            initial={{ scale:0.2, opacity:1 }}
            animate={{ scale:12, opacity:0 }}
            transition={{ duration:0.6, ease:'easeOut' }}
            style={{
              position:'absolute', width:80, height:80, borderRadius:'50%',
              background:`radial-gradient(circle, rgba(255,240,180,0.95) 0%, ${glowColor} 50%, transparent 70%)`,
            }}
          />
        )}
      </AnimatePresence>

      {/* Partículas */}
      {(phase==='born'||phase==='message') && (
        [...Array(20)].map((_,i) => (
          <motion.div key={i}
            initial={{ x:0, y:0, opacity:1, scale:1 }}
            animate={{ x:Math.cos(i*18*Math.PI/180)*200, y:Math.sin(i*18*Math.PI/180)*200, opacity:0, scale:0 }}
            transition={{ duration:1.4, delay:i*0.03, ease:'easeOut' }}
            style={{
              position:'absolute', width:7, height:7, borderRadius:'50%',
              background:['#2EC4B6','#FF8FA3','#F59E0B','#6366F1','#22C55E'][i%5],
              boxShadow:`0 0 10px ${['#2EC4B6','#FF8FA3','#F59E0B','#6366F1','#22C55E'][i%5]}`,
            }}
          />
        ))
      )}

      {/* Baby Pandi */}
      <AnimatePresence>
        {(phase==='born'||phase==='message') && (
          <motion.div
            initial={{ scale:0, opacity:0, y:40 }}
            animate={{ scale:1, opacity:1, y:0 }}
            transition={{ type:'spring', damping:12, stiffness:160 }}
            style={{ position:'relative', marginBottom:32 }}>
            <motion.div
              animate={{ scale:[1,1.15,1], opacity:[0.3,0.6,0.3] }}
              transition={{ duration:3, repeat:Infinity }}
              style={{
                position:'absolute', top:'50%', left:'50%',
                transform:'translate(-50%,-50%)',
                width:220, height:220, borderRadius:'50%',
                background:`radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
                filter:'blur(24px)',
              }}
            />
            {babyErr
              ? <span style={{ fontSize:120, display:'block', position:'relative', zIndex:1 }}>🐾</span>
              : <motion.img
                  src="/panda/panda_baby.png" alt="Pandi"
                  animate={phase==='message' ? { y:[0,-8,0] } : {}}
                  transition={{ duration:3, repeat:Infinity, ease:'easeInOut' }}
                  style={{ width:200, height:200, objectFit:'contain', position:'relative', zIndex:1 }}
                  onError={() => setBabyErr(true)}
                />
            }
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mensaje */}
      <AnimatePresence>
        {phase==='message' && (
          <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }}
            transition={{ delay:0.3 }}
            style={{ textAlign:'center', maxWidth:300 }}>
            <p style={{ fontSize:12, color:'#9CA3AF', letterSpacing:'.08em', textTransform:'uppercase', margin:'0 0 10px', fontWeight:600 }}>
              ha nacido
            </p>
            <h2 style={{ fontSize:24, fontWeight:900, color:'#1A2332', margin:'0 0 14px', lineHeight:1.2 }}>
              {name ? `${name},\nesta eres tú.` : 'Esta eres tú.'} 🐾
            </h2>
            <p style={{ fontSize:13, color:'#6B7280', lineHeight:1.8, margin:'0 0 28px', fontStyle:'italic' }}>
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
                boxShadow:'0 8px 32px rgba(46,196,182,0.45)',
              }}>
              Empezar a crecer juntos 🐾
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
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
  const navigate = useNavigate()
  const audio    = useAudio()
  const started  = useRef(false)

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

  const stepEnergyKey = ['water','sleep','movement','food','intention'][step-1] || null
  const activeEnergy  = stepEnergyKey
  const energyColor   = stepEnergyKey ? ENERGIES[stepEnergyKey]?.color : '#2EC4B6'
  const dominantEnergy = filledEnergies[filledEnergies.length-1] || null

  function handleFirstInteraction() {
    if (!started.current) {
      started.current = true
      audio.startAmbient()
    }
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
      const sleepHours  = { low:4, irregular:5.5, enough:7, deep:8 }[form.sleep] || 7
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
    return <BirthScene name={form.name} dominantEnergy={dominantEnergy}
      onContinue={() => navigate('/')} playBirth={audio.playBirth} />
  }

  const STEPS = [
    {
      title: 'Toda vida\ncomienza con energía.',
      subtitle: 'Antes de que existiera cualquier forma,\nhabía una intención.\n\nDime cómo llamarte.',
      content: (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <input className="input"
            placeholder="Mi nombre es…"
            value={form.name}
            onChange={e => { handleFirstInteraction(); set('name', e.target.value) }}
            style={{ fontSize:16, fontWeight:500, background:'rgba(255,255,255,0.6)', backdropFilter:'blur(12px)' }}
            autoFocus
          />
          {form.name && (
            <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }}
              style={{ fontSize:12, color:'#6366F1', fontStyle:'italic', margin:0, paddingLeft:4 }}>
              "{form.name}". Ese nombre será el primer latido. ✨
            </motion.p>
          )}
          <div style={{ display:'flex', gap:10 }}>
            <div style={{ flex:1 }}>
              <label style={{ fontSize:11, color:'#9CA3AF', fontWeight:600, display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'.05em' }}>
                Naciste en
              </label>
              <input className="input" type="date" value={form.birth_date}
                onChange={e => set('birth_date', e.target.value)}
                style={{ background:'rgba(255,255,255,0.6)', backdropFilter:'blur(12px)' }} />
            </div>
            <div style={{ flex:1 }}>
              <label style={{ fontSize:11, color:'#9CA3AF', fontWeight:600, display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'.05em' }}>
                Te identificas
              </label>
              <select className="input" value={form.sex} onChange={e => set('sex', e.target.value)}
                style={{ background:'rgba(255,255,255,0.6)', backdropFilter:'blur(12px)' }}>
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
      subtitle: 'Siento el primer canal abrirse.\nEl agua no me llena — me conecta.\n¿Cuánto fluye a través de ti cada día?',
      feedback: form.water ? '"Este canal será nuestro punto de encuentro."' : null,
      content: (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {[
            {v:'none',    emoji:'🏜️', label:'Casi nada — menos de 1 litro'},
            {v:'little',  emoji:'💧', label:'Lo justo — 1 a 1.5 litros'},
            {v:'enough',  emoji:'🌊', label:'Bien — 1.5 a 2 litros'},
            {v:'flowing', emoji:'🌀', label:'Fluyo — más de 2 litros'},
          ].map((o,i) => (
            <motion.div key={o.v} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.06 }}>
              <OptionCard selected={form.water===o.v} onSelect={() => selectOption('water',o.v)}
                emoji={o.emoji} label={o.label} theme={theme} energyColor={energyColor} />
            </motion.div>
          ))}
        </div>
      ),
    },
    {
      title: 'El silencio es\ndonde integramos.',
      subtitle: 'El silencio no es ausencia.\nEs donde el cuerpo reconstruye\nlo que el día deshizo.',
      feedback: form.sleep ? '"Siento tu ritmo nocturno. Aprenderé a respirar con él."' : null,
      content: (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {[
            {v:'low',       emoji:'🌑', label:'Poco — menos de 5 horas'},
            {v:'irregular', emoji:'🌓', label:'Irregular — entre 5 y 6 horas'},
            {v:'enough',    emoji:'🌕', label:'Suficiente — 6 a 7 horas'},
            {v:'deep',      emoji:'✨', label:'Profundo — más de 7 horas'},
          ].map((o,i) => (
            <motion.div key={o.v} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.06 }}>
              <OptionCard selected={form.sleep===o.v} onSelect={() => selectOption('sleep',o.v)}
                emoji={o.emoji} label={o.label} theme={theme} energyColor={energyColor} />
            </motion.div>
          ))}
        </div>
      ),
    },
    {
      title: 'El movimiento es\nel fuego que transforma.',
      subtitle: 'El movimiento no desgasta.\nTransforma.\n¿Con qué frecuencia enciendes ese fuego?',
      feedback: form.movement ? '"Tu fuego dará forma a lo que soy."' : null,
      content: (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {[
            {v:'never',     emoji:'🪨', label:'Casi nunca'},
            {v:'sometimes', emoji:'🌿', label:'Una o dos veces por semana'},
            {v:'regular',   emoji:'🔥', label:'Tres o cuatro veces'},
            {v:'daily',     emoji:'⚡', label:'Cada día es una oportunidad'},
          ].map((o,i) => (
            <motion.div key={o.v} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.06 }}>
              <OptionCard selected={form.movement===o.v} onSelect={() => selectOption('movement',o.v)}
                emoji={o.emoji} label={o.label} theme={theme} energyColor={energyColor} />
            </motion.div>
          ))}
        </div>
      ),
    },
    {
      title: 'Somos lo que\negimos nutrir.',
      subtitle: 'Ya tengo agua, silencio y fuego.\nAhora necesito saber\nde qué tierra vienes.',
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
              whileTap={{ scale:0.96 }}
              onClick={() => selectOption('food',o.v)}
              style={{
                padding:'14px 8px', borderRadius:16,
                border:`1.5px solid ${form.food===o.v ? energyColor : 'rgba(255,255,255,0.4)'}`,
                background: form.food===o.v ? `${energyColor}22` : 'rgba(255,255,255,0.45)',
                backdropFilter:'blur(12px)',
                display:'flex', flexDirection:'column', alignItems:'center', gap:6,
                cursor:'pointer',
                boxShadow: form.food===o.v ? `0 4px 16px ${energyColor}30` : '0 2px 8px rgba(0,0,0,0.05)',
                transition:'all 0.2s',
              }}>
              <span style={{ fontSize:24 }}>{o.emoji}</span>
              <span style={{ fontSize:11, fontWeight:500, color: form.food===o.v ? energyColor : '#374151', textAlign:'center' }}>
                {o.label}
              </span>
            </motion.button>
          ))}
        </div>
      ),
    },
    {
      title: 'La intención\nes el alma.',
      subtitle: 'Tengo forma. Tengo energía.\nSolo me falta saber por qué existo.\n¿Qué te trajo hasta aquí?',
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
                emoji={o.emoji} label={o.label} theme={theme} energyColor={energyColor} />
            </motion.div>
          ))}
          {form.intention && form.intention !== 'custom' && (
            <button onClick={() => set('intention','custom')}
              style={{ background:'none', border:'none', color:'#9CA3AF', fontSize:12, cursor:'pointer', padding:'4px 0' }}>
              ✍️ Escribir mi propia razón
            </button>
          )}
          {form.intention === 'custom' && (
            <motion.input initial={{ opacity:0 }} animate={{ opacity:1 }}
              className="input" placeholder="Mi razón es…"
              value={form.intentionCustom} onChange={e => set('intentionCustom',e.target.value)}
              style={{ background:'rgba(255,255,255,0.6)' }} autoFocus />
          )}
        </div>
      ),
    },
  ]

  const current = STEPS[step]
  const isLast  = step === STEPS.length - 1

  return (
    <div style={{ minHeight:'100vh', position:'relative', display:'flex', flexDirection:'column', overflow:'hidden' }}>

      {/* Fondo santuario */}
      <motion.div key={step} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:1.2 }}
        style={{ position:'fixed', inset:0, zIndex:0, overflow:'hidden' }}>
        <img
          src={[
            '/panda/sanctuary_green.png',
            '/panda/sanctuary_green.png',
            '/panda/sanctuary_red.png',
            '/panda/sanctuary_yellow.png',
            '/panda/sanctuary_green.png',
            '/panda/sanctuary_red.png',
          ][step] || '/panda/sanctuary_green.png'}
          alt=""
          style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center 60%', opacity:0.45 }}
        />
        {/* Overlay glassmorphism en la mitad inferior */}
        <div style={{
          position:'absolute', bottom:0, left:0, right:0, height:'55%',
          background:'linear-gradient(to top, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.3) 60%, transparent 100%)',
          backdropFilter:'blur(0px)',
        }} />
      </motion.div>

      {/* Contenido */}
      <div style={{
        position:'relative', zIndex:1,
        display:'flex', flexDirection:'column',
        minHeight:'100vh',
        maxWidth:440, margin:'0 auto', width:'100%',
      }}>

        {/* Zona superior — ORB (55% pantalla) */}
        <div style={{
          flex:'0 0 auto',
          display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center',
          paddingTop:32, paddingBottom:16,
          minHeight:'45vh',
        }}>
          <EnergyOrb
            filledEnergies={filledEnergies}
            activeEnergy={activeEnergy}
            absorbing={absorbing}
          />
        </div>

        {/* Zona inferior — contenido con glassmorphism */}
        <div style={{
          flex:1,
          background:'rgba(255,255,255,0.72)',
          backdropFilter:'blur(20px)',
          borderTop:'1px solid rgba(255,255,255,0.8)',
          borderRadius:'28px 28px 0 0',
          padding:'24px 20px 36px',
          display:'flex', flexDirection:'column',
          boxShadow:'0 -8px 32px rgba(0,0,0,0.06)',
        }}>

          {/* Título */}
          <AnimatePresence mode="wait">
            <motion.div key={`title-${step}`}
              initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
              exit={{ opacity:0, y:-10 }} transition={{ duration:0.25 }}
              style={{ marginBottom:16 }}>
              <h2 style={{
                fontSize:20, fontWeight:900, color:'#1A2332',
                margin:'0 0 8px', lineHeight:1.25, whiteSpace:'pre-line',
              }}>
                {current.title}
              </h2>
              <p style={{ fontSize:12, color:'#6B7280', margin:0, lineHeight:1.6, whiteSpace:'pre-line' }}>
                {current.subtitle}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Opciones */}
          <div style={{ flex:1, overflowY:'auto' }}>
            <AnimatePresence mode="wait">
              <motion.div key={`content-${step}`}
                initial={{ opacity:0, x:16 }} animate={{ opacity:1, x:0 }}
                exit={{ opacity:0, x:-16 }} transition={{ duration:0.2 }}>
                {current.content}

                {/* Feedback de la criatura */}
                <AnimatePresence>
                  {current.feedback && (
                    <motion.div
                      initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                      style={{
                        marginTop:12, padding:'10px 16px',
                        borderRadius:14,
                        background:`${energyColor}12`,
                        border:`1px solid ${energyColor}30`,
                      }}>
                      <p style={{ fontSize:12, color: energyColor, margin:0, fontStyle:'italic', lineHeight:1.5 }}>
                        {current.feedback}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Progreso */}
          <div style={{ display:'flex', gap:5, margin:'16px 0 14px' }}>
            {STEPS.map((_,i) => (
              <motion.div key={i}
                animate={{
                  flex: i===step ? 2 : 1,
                  background: i<step ? '#2EC4B6' : i===step ? energyColor : 'rgba(0,0,0,0.1)',
                  opacity: i<=step ? 1 : 0.35,
                }}
                transition={{ duration:0.4 }}
                style={{ height:3, borderRadius:3 }}
              />
            ))}
          </div>

          {/* Botones */}
          <div style={{ display:'flex', gap:10 }}>
            {step > 0 && (
              <motion.button whileTap={{ scale:0.97 }}
                onClick={() => setStep(s=>s-1)}
                style={{
                  padding:'14px 18px', borderRadius:16,
                  border:'1.5px solid rgba(0,0,0,0.1)',
                  background:'rgba(255,255,255,0.7)',
                  color:'#6B7280', fontSize:14, fontWeight:600,
                  cursor:'pointer',
                }}>
                ←
              </motion.button>
            )}
            <motion.button
              whileTap={{ scale: canNext() ? 0.97 : 1 }}
              onClick={isLast ? finish : goNext}
              disabled={!canNext() || loading}
              style={{
                flex:1, padding:'14px 20px', borderRadius:16,
                background: canNext()
                  ? isLast
                    ? 'linear-gradient(135deg, #2EC4B6, #FF8FA3)'
                    : `linear-gradient(135deg, ${energyColor}, ${energyColor}bb)`
                  : 'rgba(0,0,0,0.1)',
                border:'none', color:'white',
                fontSize:15, fontWeight:700,
                cursor: canNext() ? 'pointer' : 'default',
                opacity: canNext() ? 1 : 0.45,
                boxShadow: canNext() ? `0 6px 24px ${energyColor}40` : 'none',
                transition:'all 0.3s',
              }}>
              {loading
                ? '✨ Dando vida…'
                : isLast
                ? '✨ Despertar a Pandi'
                : 'Continuar →'
              }
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  )
}
