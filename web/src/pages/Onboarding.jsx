import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/useStore'
import { useTheme } from '../contexts/ThemeProvider'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'

// ─── ENERGÍAS ─────────────────────────────────────────────────────────────────
const ENERGIES = {
  water:    { color: '#3B82F6', glow: 'rgba(59,130,246,0.6)',  particle: '#60A5FA' },
  sleep:    { color: '#8B5CF6', glow: 'rgba(139,92,246,0.6)',  particle: '#A78BFA' },
  movement: { color: '#F97316', glow: 'rgba(249,115,22,0.6)',  particle: '#FB923C' },
  food:     { color: '#22C55E', glow: 'rgba(34,197,94,0.6)',   particle: '#4ADE80' },
  intention:{ color: '#EC4899', glow: 'rgba(236,72,153,0.6)',  particle: '#F472B6' },
}

// ─── ESFERA INCUBADORA ────────────────────────────────────────────────────────
function EnergyOrb({ filledEnergies, pulse }) {
  const colors = filledEnergies.map(k => ENERGIES[k]?.color).filter(Boolean)
  const fill   = Math.min(filledEnergies.length / 5, 1)

  return (
    <div style={{ position:'relative', width:220, height:220, margin:'0 auto' }}>
      {/* Glow exterior */}
      <motion.div
        animate={{ scale:[1,1.08,1], opacity:[0.2,0.45,0.2] }}
        transition={{ duration: pulse ? 1.5 : 4, repeat:Infinity, ease:'easeInOut' }}
        style={{
          position:'absolute', inset:-30,
          borderRadius:'50%',
          background: colors.length > 0
            ? `radial-gradient(circle, ${colors[colors.length-1]} 0%, transparent 70%)`
            : 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
          filter:'blur(24px)',
        }}
      />

      <svg width="220" height="220" viewBox="0 0 220 220" style={{ position:'absolute', inset:0 }}>
        <defs>
          <radialGradient id="orbGlass" cx="35%" cy="30%">
            <stop offset="0%"   stopColor="rgba(255,255,255,0.5)" />
            <stop offset="50%"  stopColor="rgba(255,255,255,0.08)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.05)" />
          </radialGradient>
          <clipPath id="orbClip">
            <circle cx="110" cy="110" r="90" />
          </clipPath>
          <radialGradient id="fillGrad" cx="50%" cy="80%">
            {colors.length > 0
              ? colors.map((c,i) => (
                  <stop key={i}
                    offset={`${(i/(Math.max(colors.length-1,1)))*100}%`}
                    stopColor={c} stopOpacity="0.75" />
                ))
              : <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
            }
          </radialGradient>
        </defs>

        {/* Sombra suelo */}
        <ellipse cx="110" cy="210" rx="70" ry="10" fill="rgba(0,0,0,0.12)" />

        {/* Borde exterior */}
        <circle cx="110" cy="110" r="92"
          fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />

        {/* Energía interior — sube desde abajo */}
        <motion.rect
          x="20" width="180"
          animate={{ y: 200 - 180 * fill, height: 180 * fill }}
          transition={{ duration:1, ease:'easeOut' }}
          fill="url(#fillGrad)"
          clipPath="url(#orbClip)"
        />

        {/* Cristal */}
        <circle cx="110" cy="110" r="90" fill="url(#orbGlass)" />

        {/* Brillo superior */}
        <ellipse cx="84" cy="72" rx="26" ry="16"
          fill="rgba(255,255,255,0.3)" style={{ filter:'blur(3px)' }} />
        <ellipse cx="78" cy="66" rx="12" ry="7"
          fill="rgba(255,255,255,0.5)" />

        {/* Borde final */}
        <circle cx="110" cy="110" r="90"
          fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
      </svg>

      {/* Semilla central si está vacía */}
      {filledEnergies.length === 0 && (
        <motion.div
          animate={{ scale:[1,1.12,1], opacity:[0.5,1,0.5] }}
          transition={{ duration:2.5, repeat:Infinity }}
          style={{
            position:'absolute', top:'50%', left:'50%',
            transform:'translate(-50%,-55%)',
            fontSize:40,
          }}>
          ✨
        </motion.div>
      )}

      {/* Silueta bebé cuando hay 3+ energías */}
      {filledEnergies.length >= 3 && (
        <motion.div
          initial={{ opacity:0, scale:0.5 }}
          animate={{ opacity: fill * 0.9, scale:1 }}
          style={{
            position:'absolute', top:'50%', left:'50%',
            transform:'translate(-50%,-55%)',
          }}>
          <motion.img
            src="/panda/panda_baby.png"
            alt=""
            style={{
              width:80, height:80, objectFit:'contain',
              filter:'blur(3px) brightness(1.5)',
              opacity: 0.6 + fill * 0.4,
            }}
            onError={e => e.target.style.display='none'}
          />
        </motion.div>
      )}

      {/* Partículas flotando */}
      {filledEnergies.map((key, i) => {
        const e = ENERGIES[key]
        return [...Array(3)].map((_, j) => (
          <motion.div key={`${key}-${j}`}
            animate={{
              y:[0, -(40+j*15), 0],
              x:[0, (j%2===0?12:-12), 0],
              opacity:[0, 0.85, 0],
            }}
            transition={{
              duration: 2.5 + j*0.4,
              delay: i*0.4 + j*0.6,
              repeat:Infinity,
              ease:'easeInOut',
            }}
            style={{
              position:'absolute',
              bottom:'20%',
              left:`${25 + i*12 + j*4}%`,
              width:6, height:6,
              borderRadius:'50%',
              background: e?.particle,
              filter:'blur(1px)',
              boxShadow:`0 0 6px ${e?.particle}`,
            }}
          />
        ))
      })}
    </div>
  )
}

// ─── ECLOSIÓN ─────────────────────────────────────────────────────────────────
function BirthScene({ name, dominantEnergy, onContinue }) {
  const [phase, setPhase] = useState('crack')
  const [imgErr, setImgErr] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('explode'), 1200)
    const t2 = setTimeout(() => setPhase('born'),    2200)
    const t3 = setTimeout(() => setPhase('message'), 3600)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  const glowColor = dominantEnergy
    ? ENERGIES[dominantEnergy]?.glow
    : 'rgba(46,196,182,0.5)'

  return (
    <motion.div
      initial={{ opacity:0 }}
      animate={{ opacity:1 }}
      style={{
        position:'fixed', inset:0, zIndex:100,
        display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center',
        background:'radial-gradient(ellipse at 50% 40%, #fff8e7 0%, #e8f4fd 50%, #f5f0ff 100%)',
        padding:32, overflow:'hidden',
      }}>

      {/* Grietas de luz */}
      <AnimatePresence>
        {phase === 'crack' && (
          <motion.div
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)' }}>
            {[...Array(8)].map((_,i) => (
              <motion.div key={i}
                initial={{ scaleX:0, opacity:1 }}
                animate={{ scaleX:1, opacity:0 }}
                transition={{ duration:0.6, delay:i*0.08 }}
                style={{
                  position:'absolute',
                  width: 60 + i*20,
                  height:2,
                  background:'linear-gradient(90deg, transparent, #FFF3C4, transparent)',
                  top: Math.sin(i*45*Math.PI/180)*80,
                  left: Math.cos(i*45*Math.PI/180)*80 - 40,
                  transform:`rotate(${i*45}deg)`,
                  transformOrigin:'left center',
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Explosión */}
      <AnimatePresence>
        {phase === 'explode' && (
          <motion.div
            initial={{ scale:0, opacity:0.9 }}
            animate={{ scale:10, opacity:0 }}
            transition={{ duration:0.7, ease:'easeOut' }}
            style={{
              position:'absolute',
              width:100, height:100, borderRadius:'50%',
              background:`radial-gradient(circle, ${glowColor} 0%, rgba(255,200,100,0.4) 50%, transparent 70%)`,
            }}
          />
        )}
      </AnimatePresence>

      {/* Partículas de eclosión */}
      {(phase === 'born' || phase === 'message') && (
        [...Array(16)].map((_,i) => (
          <motion.div key={i}
            initial={{ x:0, y:0, opacity:1, scale:1 }}
            animate={{
              x: Math.cos(i*22.5*Math.PI/180)*180,
              y: Math.sin(i*22.5*Math.PI/180)*180,
              opacity:0, scale:0,
            }}
            transition={{ duration:1.2, delay:i*0.04 }}
            style={{
              position:'absolute',
              width:8, height:8, borderRadius:'50%',
              background:['#2EC4B6','#FF8FA3','#F59E0B','#6366F1','#22C55E'][i%5],
              boxShadow:`0 0 8px ${['#2EC4B6','#FF8FA3','#F59E0B','#6366F1','#22C55E'][i%5]}`,
            }}
          />
        ))
      )}

      {/* Baby Pandi */}
      <AnimatePresence>
        {(phase === 'born' || phase === 'message') && (
          <motion.div
            initial={{ scale:0, opacity:0, y:30 }}
            animate={{ scale:1, opacity:1, y:0 }}
            transition={{ type:'spring', damping:14, stiffness:180 }}
            style={{ position:'relative', marginBottom:32 }}>
            <motion.div
              animate={{ scale:[1,1.12,1], opacity:[0.35,0.6,0.35] }}
              transition={{ duration:3, repeat:Infinity }}
              style={{
                position:'absolute', top:'50%', left:'50%',
                transform:'translate(-50%,-50%)',
                width:200, height:200, borderRadius:'50%',
                background:`radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
                filter:'blur(20px)',
              }}
            />
            {imgErr
              ? <span style={{ fontSize:120, display:'block', position:'relative', zIndex:1 }}>🐾</span>
              : <motion.img
                  src="/panda/panda_baby.png"
                  alt="Pandi"
                  animate={phase==='message' ? { y:[0,-6,0] } : {}}
                  transition={{ duration:3, repeat:Infinity, ease:'easeInOut' }}
                  style={{ width:180, height:180, objectFit:'contain', position:'relative', zIndex:1 }}
                  onError={() => setImgErr(true)}
                />
            }
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mensaje final */}
      <AnimatePresence>
        {phase === 'message' && (
          <motion.div
            initial={{ opacity:0, y:20 }}
            animate={{ opacity:1, y:0 }}
            transition={{ delay:0.4 }}
            style={{ textAlign:'center', maxWidth:300 }}>
            <p style={{ fontSize:13, color:'#9CA3AF', lineHeight:1.8, margin:'0 0 6px', fontStyle:'italic' }}>
              Tu energía ha dado origen a una nueva vida.
            </p>
            <h2 style={{ fontSize:22, fontWeight:900, color:'#1A2332', margin:'0 0 10px' }}>
              {name ? `${name},` : ''} esta eres tú. 🐾
            </h2>
            <p style={{ fontSize:13, color:'#6B7280', lineHeight:1.7, margin:'0 0 32px' }}>
              No soy una recompensa.<br/>
              Soy tu reflejo.<br/>
              Lo que ocurra conmigo<br/>
              dependerá de cómo te cuides a partir de hoy.
            </p>
            <motion.button
              initial={{ opacity:0, y:10 }}
              animate={{ opacity:1, y:0 }}
              transition={{ delay:0.6 }}
              whileTap={{ scale:0.97 }}
              onClick={onContinue}
              style={{
                padding:'16px 40px', borderRadius:20,
                background:'linear-gradient(135deg, #2EC4B6, #FF8FA3)',
                border:'none', color:'white',
                fontSize:16, fontWeight:800,
                cursor:'pointer',
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
function OptionCard({ selected, onSelect, emoji, label, theme }) {
  return (
    <motion.button
      whileTap={{ scale:0.97 }}
      onClick={onSelect}
      style={{
        width:'100%',
        display:'flex', alignItems:'center', gap:14,
        padding:'14px 18px', borderRadius:18,
        border:`1.5px solid ${selected ? theme.primary : 'rgba(255,255,255,0.5)'}`,
        background: selected ? `${theme.primary}18` : 'rgba(255,255,255,0.55)',
        backdropFilter:'blur(10px)',
        textAlign:'left', cursor:'pointer',
        transition:'all 0.2s',
        boxShadow: selected ? `0 4px 16px ${theme.primary}25` : '0 2px 8px rgba(0,0,0,0.04)',
      }}>
      <span style={{ fontSize:24 }}>{emoji}</span>
      <span style={{ fontSize:14, fontWeight:500, color: selected ? theme.primary : '#374151' }}>
        {label}
      </span>
      {selected && (
        <motion.div
          initial={{ scale:0 }} animate={{ scale:1 }}
          style={{
            marginLeft:'auto', width:20, height:20, borderRadius:'50%',
            background:theme.primary,
            display:'flex', alignItems:'center', justifyContent:'center',
            flexShrink:0,
          }}>
          <span style={{ fontSize:11, color:'white' }}>✓</span>
        </motion.div>
      )}
    </motion.button>
  )
}

// ─── FONDO SANTUARIO ──────────────────────────────────────────────────────────
function SanctuaryBg({ step }) {
  const bgs = [
    '/panda/sanctuary_green.png',
    '/panda/sanctuary_green.png',
    '/panda/sanctuary_red.png',
    '/panda/sanctuary_yellow.png',
    '/panda/sanctuary_green.png',
    '/panda/sanctuary_red.png',
  ]
  return (
    <motion.div key={step} initial={{ opacity:0 }} animate={{ opacity:1 }}
      transition={{ duration:1.2 }}
      style={{ position:'fixed', inset:0, zIndex:0, overflow:'hidden' }}>
      <img src={bgs[step] || bgs[0]} alt=""
        style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center 60%', opacity:0.35 }} />
      <div style={{ position:'absolute', inset:0, background:'rgba(255,255,255,0.58)', backdropFilter:'blur(1px)' }} />
    </motion.div>
  )
}

// ─── FEEDBACK FLASH ───────────────────────────────────────────────────────────
function EnergyFeedback({ text, color }) {
  return (
    <motion.div
      initial={{ opacity:0, y:8, scale:0.95 }}
      animate={{ opacity:1, y:0, scale:1 }}
      exit={{ opacity:0, y:-8 }}
      style={{
        background:'rgba(255,255,255,0.92)',
        backdropFilter:'blur(12px)',
        borderRadius:16,
        padding:'10px 18px',
        border:`1.5px solid ${color}40`,
        boxShadow:`0 4px 20px ${color}20`,
        textAlign:'center',
        marginTop:12,
      }}>
      <p style={{ fontSize:13, color:'#374151', margin:0, fontStyle:'italic', lineHeight:1.5 }}>
        {text}
      </p>
    </motion.div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function Onboarding() {
  const { theme }          = useTheme()
  const [step, setStep]    = useState(0)
  const [loading, setLoading] = useState(false)
  const [showBirth, setShowBirth] = useState(false)
  const { user, fetchProfile } = useStore()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name:      '',
    water:     '',   // none | little | enough | flowing
    sleep:     '',   // low | irregular | enough | deep
    movement:  '',   // never | sometimes | regular | daily
    food:      '',   // omnivore | vegetarian | vegan | pescatarian | keto | paleo
    intention: '',   // family | body | health | energy | habits | wellbeing | custom
    intentionCustom: '',
    sex:       'other',
    birth_date:'',
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Energías acumuladas
  const filledEnergies = [
    form.water     ? 'water'     : null,
    form.sleep     ? 'sleep'     : null,
    form.movement  ? 'movement'  : null,
    form.food      ? 'food'      : null,
    form.intention ? 'intention' : null,
  ].filter(Boolean)

  const dominantEnergy = filledEnergies[filledEnergies.length - 1] || null

  // Mapeo energía → valores de salud
  const waterMap    = { none:'<0.5L', little:'1L', enough:'1.5L', flowing:'>2L' }
  const sleepMap    = { low:'<5', irregular:'5-6', enough:'6-7', deep:'>7' }
  const movementMap = { never:'0', sometimes:'1-2', regular:'3-4', daily:'5-7' }
  const foodMap     = { omnivore:'omnivore', vegetarian:'vegetarian', vegan:'vegan', pescatarian:'pescatarian', keto:'keto', paleo:'paleo' }

  const canNext = () => {
    if (step === 0) return form.name.trim().length > 0
    if (step === 1) return form.water
    if (step === 2) return form.sleep
    if (step === 3) return form.movement
    if (step === 4) return form.food
    if (step === 5) return form.intention
    return true
  }

  async function finish() {
    setLoading(true)
    try {
      const userId = user.id

      // Datos mínimos desde el onboarding narrativo
      const sleepHours = { low:4, irregular:5.5, enough:7, deep:8 }[form.sleep] || 7
      const trainingDays = { never:0, sometimes:1, regular:3, daily:5 }[form.movement] || 2
      const motivation = form.intention === 'custom' ? form.intentionCustom : form.intention

      await supabase.from('user_profiles').update({
        name:            form.name,
        onboarding_done: true,
        motivation_why:  motivation || null,
      }).eq('id', userId)

      await supabase.from('health_profiles').upsert({
        user_id:                userId,
        diet_type:              foodMap[form.food] || 'omnivore',
        sleep_hours:            sleepHours,
        training_days_per_week: trainingDays,
        onboarding_done:        true,
        onboarding_version:     3,
        onboarding_date:        new Date().toISOString(),
      }, { onConflict:'user_id' })

      await fetchProfile(userId)
      try { await api.email.welcome() } catch {}

      setShowBirth(true)
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (showBirth) {
    return <BirthScene name={form.name} dominantEnergy={dominantEnergy} onContinue={() => navigate('/')} />
  }

  // ── PASOS ────────────────────────────────────────────────────────────────────

  const steps = [

    // 0 — La Semilla
    {
      energy: null,
      title: 'Toda vida\ncomienza con energía.',
      subtitle: 'Antes de que existiera cualquier forma,\nhabía una intención.',
      feedback: null,
      content: (
        <div style={{ display:'flex', flexDirection:'column', gap:14, marginTop:8 }}>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:'#6B7280', textTransform:'uppercase', letterSpacing:'.06em', display:'block', marginBottom:8 }}>
              Dime cómo llamarte
            </label>
            <input
              className="input"
              placeholder="Mi nombre es…"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              style={{ fontSize:16, fontWeight:500 }}
              autoFocus
            />
            {form.name && (
              <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }}
                style={{ fontSize:12, color:theme.primary, marginTop:6, fontStyle:'italic' }}>
                "{form.name}". Ese nombre será el primer latido.
              </motion.p>
            )}
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <div style={{ flex:1 }}>
              <label style={{ fontSize:12, fontWeight:600, color:'#6B7280', textTransform:'uppercase', letterSpacing:'.06em', display:'block', marginBottom:8 }}>
                Naciste en
              </label>
              <input className="input" type="date"
                value={form.birth_date} onChange={e => set('birth_date', e.target.value)} />
            </div>
            <div style={{ flex:1 }}>
              <label style={{ fontSize:12, fontWeight:600, color:'#6B7280', textTransform:'uppercase', letterSpacing:'.06em', display:'block', marginBottom:8 }}>
                Te identificas
              </label>
              <select className="input" value={form.sex} onChange={e => set('sex', e.target.value)}>
                <option value="male">Hombre</option>
                <option value="female">Mujer</option>
                <option value="other">Prefiero no decir</option>
              </select>
            </div>
          </div>
        </div>
      ),
    },

    // 1 — El Agua
    {
      energy: 'water',
      title: 'El agua es el canal.',
      subtitle: 'Siento el primer canal abrirse.\nEl agua no me llena — me conecta.\n¿Cuánto fluye a través de ti cada día?',
      feedback: form.water ? 'Este canal será nuestro punto de encuentro.' : null,
      content: (
        <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:8 }}>
          {[
            { v:'none',    emoji:'🏜️', label:'Casi nada — menos de 1 litro' },
            { v:'little',  emoji:'💧', label:'Lo justo — 1 a 1.5 litros' },
            { v:'enough',  emoji:'🌊', label:'Bien — 1.5 a 2 litros' },
            { v:'flowing', emoji:'🌀', label:'Fluyo — más de 2 litros' },
          ].map(o => (
            <OptionCard key={o.v} selected={form.water===o.v}
              onSelect={() => set('water', o.v)}
              emoji={o.emoji} label={o.label} theme={theme} />
          ))}
        </div>
      ),
    },

    // 2 — El Silencio
    {
      energy: 'sleep',
      title: 'El silencio es\ndonde integramos.',
      subtitle: 'El silencio no es ausencia.\nEs donde el cuerpo reconstruye lo que el día deshizo.\n¿Cuánto tiempo le das a ese proceso?',
      feedback: form.sleep ? 'Siento tu ritmo nocturno. Aprenderé a respirar con él.' : null,
      content: (
        <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:8 }}>
          {[
            { v:'low',       emoji:'🌑', label:'Poco — menos de 5 horas' },
            { v:'irregular', emoji:'🌓', label:'Irregular — entre 5 y 6 horas' },
            { v:'enough',    emoji:'🌕', label:'Suficiente — 6 a 7 horas' },
            { v:'deep',      emoji:'✨', label:'Profundo — más de 7 horas' },
          ].map(o => (
            <OptionCard key={o.v} selected={form.sleep===o.v}
              onSelect={() => set('sleep', o.v)}
              emoji={o.emoji} label={o.label} theme={theme} />
          ))}
        </div>
      ),
    },

    // 3 — El Fuego
    {
      energy: 'movement',
      title: 'El movimiento es\nel fuego que transforma.',
      subtitle: 'El movimiento no desgasta.\nTransforma.\n¿Con qué frecuencia enciendes ese fuego?',
      feedback: form.movement ? 'Tu fuego dará forma a lo que soy.' : null,
      content: (
        <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:8 }}>
          {[
            { v:'never',     emoji:'🪨', label:'Casi nunca' },
            { v:'sometimes', emoji:'🌿', label:'Una o dos veces por semana' },
            { v:'regular',   emoji:'🔥', label:'Tres o cuatro veces' },
            { v:'daily',     emoji:'⚡', label:'Cada día es una oportunidad' },
          ].map(o => (
            <OptionCard key={o.v} selected={form.movement===o.v}
              onSelect={() => set('movement', o.v)}
              emoji={o.emoji} label={o.label} theme={theme} />
          ))}
        </div>
      ),
    },

    // 4 — La Tierra
    {
      energy: 'food',
      title: 'Somos lo que\negimos nutrir.',
      subtitle: 'Ya tengo agua, silencio y fuego.\nAhora necesito saber de qué tierra vienes.\n¿Qué pone en tu mesa la vida?',
      feedback: form.food ? 'Esta es la base. Desde aquí construimos.' : null,
      content: (
        <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:8 }}>
          {[
            { v:'omnivore',    emoji:'🍽️', label:'De todo un poco' },
            { v:'vegetarian',  emoji:'🥗', label:'Sin carne' },
            { v:'vegan',       emoji:'🌱', label:'Solo plantas' },
            { v:'pescatarian', emoji:'🐟', label:'Del mar' },
            { v:'keto',        emoji:'🥑', label:'Bajo en carbohidratos' },
            { v:'paleo',       emoji:'🍖', label:'Alimentos sin procesar' },
          ].map(o => (
            <OptionCard key={o.v} selected={form.food===o.v}
              onSelect={() => set('food', o.v)}
              emoji={o.emoji} label={o.label} theme={theme} />
          ))}
        </div>
      ),
    },

    // 5 — La Intención
    {
      energy: 'intention',
      title: 'La intención\nes el alma.',
      subtitle: 'Tengo forma. Tengo energía.\nSolo me falta saber por qué existo.\n¿Qué te trajo hasta aquí?',
      feedback: form.intention ? 'Esa es la razón por la que latiré.' : null,
      content: (
        <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:8 }}>
          {[
            { v:'family',    emoji:'👨‍👩‍👧', label:'Estar presente para quienes amo' },
            { v:'body',      emoji:'💪',    label:'Reconocerme cuando me miro' },
            { v:'health',    emoji:'🏥',    label:'Controlar algo que me preocupa' },
            { v:'energy',    emoji:'⚡',    label:'Tener más energía para lo que importa' },
            { v:'habits',    emoji:'🌱',    label:'Recuperar algo que perdí' },
            { v:'wellbeing', emoji:'🧘',    label:'Cuidarme por primera vez de verdad' },
          ].map(o => (
            <OptionCard key={o.v} selected={form.intention===o.v}
              onSelect={() => set('intention', o.v)}
              emoji={o.emoji} label={o.label} theme={theme} />
          ))}
          {form.intention && form.intention !== 'custom' && (
            <motion.button
              initial={{ opacity:0 }} animate={{ opacity:1 }}
              onClick={() => set('intention', 'custom')}
              style={{ background:'none', border:'none', color:theme.textMuted,
                fontSize:12, cursor:'pointer', padding:'4px 0', textAlign:'center' }}>
              ✍️ Escribir mi propia razón
            </motion.button>
          )}
          {form.intention === 'custom' && (
            <motion.input
              initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
              className="input"
              placeholder="Mi razón es…"
              value={form.intentionCustom}
              onChange={e => set('intentionCustom', e.target.value)}
              autoFocus
            />
          )}
        </div>
      ),
    },
  ]

  const current = steps[step]
  const energyColor = current.energy ? ENERGIES[current.energy]?.color : '#2EC4B6'

  return (
    <div style={{ minHeight:'100vh', position:'relative', display:'flex', flexDirection:'column' }}>

      <SanctuaryBg step={step} />

      <div style={{
        position:'relative', zIndex:1,
        display:'flex', flexDirection:'column',
        minHeight:'100vh',
        padding:'24px 20px 40px',
        maxWidth:440, margin:'0 auto', width:'100%',
      }}>

        {/* Orbe — siempre visible */}
        <div style={{ marginBottom:32, marginTop:8 }}>
          <EnergyOrb filledEnergies={filledEnergies} pulse={!!current.energy && !!form[current.energy || '']} />
        </div>

        {/* Título y subtítulo */}
        <AnimatePresence mode="wait">
          <motion.div key={step}
            initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
            exit={{ opacity:0, y:-12 }} transition={{ duration:0.3 }}
            style={{ marginBottom:20 }}>
            <h2 style={{
              fontSize:22, fontWeight:900, color:'#1A2332',
              margin:'0 0 10px', lineHeight:1.25,
              whiteSpace:'pre-line',
            }}>
              {current.title}
            </h2>
            <p style={{
              fontSize:13, color:'#6B7280', margin:0,
              lineHeight:1.65, whiteSpace:'pre-line',
            }}>
              {current.subtitle}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Contenido del paso */}
        <div style={{ flex:1 }}>
          <AnimatePresence mode="wait">
            <motion.div key={`content-${step}`}
              initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }}
              exit={{ opacity:0, x:-20 }} transition={{ duration:0.22 }}>
              {current.content}

              {/* Feedback de energía */}
              <AnimatePresence>
                {current.feedback && (
                  <EnergyFeedback
                    text={current.feedback}
                    color={energyColor}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Barra de progreso */}
        <div style={{ display:'flex', gap:6, margin:'24px 0 16px' }}>
          {steps.map((_,i) => (
            <motion.div key={i}
              animate={{
                flex: i === step ? 2 : 1,
                background: i < step ? energyColor : i === step ? energyColor : 'rgba(0,0,0,0.1)',
                opacity: i <= step ? 1 : 0.4,
              }}
              transition={{ duration:0.4 }}
              style={{ height:3, borderRadius:3 }}
            />
          ))}
        </div>

        {/* Navegación */}
        <div style={{ display:'flex', gap:10 }}>
          {step > 0 && (
            <motion.button whileTap={{ scale:0.97 }}
              onClick={() => setStep(s => s-1)}
              style={{
                padding:'14px 20px', borderRadius:16,
                border:'1.5px solid rgba(0,0,0,0.1)',
                background:'rgba(255,255,255,0.7)',
                color:'#6B7280', fontSize:14, fontWeight:600,
                cursor:'pointer', backdropFilter:'blur(8px)',
              }}>
              ←
            </motion.button>
          )}

          {step < steps.length - 1 ? (
            <motion.button
              whileTap={{ scale: canNext() ? 0.97 : 1 }}
              onClick={() => { if (canNext()) setStep(s => s+1) }}
              disabled={!canNext()}
              style={{
                flex:1, padding:'14px 20px', borderRadius:16,
                background: canNext()
                  ? `linear-gradient(135deg, ${energyColor}, ${energyColor}cc)`
                  : 'rgba(0,0,0,0.1)',
                border:'none', color:'white',
                fontSize:15, fontWeight:700,
                cursor: canNext() ? 'pointer' : 'default',
                opacity: canNext() ? 1 : 0.5,
                boxShadow: canNext() ? `0 6px 24px ${energyColor}40` : 'none',
                transition:'all 0.3s',
              }}>
              Continuar →
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale:0.97 }}
              onClick={finish}
              disabled={loading || !canNext()}
              style={{
                flex:1, padding:'14px 20px', borderRadius:16,
                background:'linear-gradient(135deg, #2EC4B6, #FF8FA3)',
                border:'none', color:'white',
                fontSize:15, fontWeight:700,
                cursor: (!loading && canNext()) ? 'pointer' : 'default',
                opacity: (!loading && canNext()) ? 1 : 0.5,
                boxShadow:'0 6px 24px rgba(46,196,182,0.4)',
              }}>
              {loading
                ? <motion.span animate={{ opacity:[1,0.5,1] }} transition={{ duration:1, repeat:Infinity }}>
                    Dando vida…
                  </motion.span>
                : '✨ Despertar a Pandi'
              }
            </motion.button>
          )}
        </div>
      </div>
    </div>
  )
}
