import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import MenuButton from '../components/MenuButton'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/useStore'
import { NotificationBell, default as NotificationPanel } from '../components/NotificationPanel'
import AchievementUnlockedModal from '../components/AchievementUnlockedModal'
import { useTheme } from '../contexts/ThemeProvider'
import { supabase } from '../lib/supabase'
import { useSectionContext } from '../hooks/useSectionContext'
import PandiInsights from '../components/PandiInsights'
import { Plus, Minus as MinusIcon, Droplets } from 'lucide-react'
import PandiPulse from '../components/mood/PandiPulse'

// ─── CONSTANTES ───────────────────────────────────────────────────────────────

const TUMMY_EMOJI = { great:'😋', good:'🙂', neutral:'😐', bad:'😕', terrible:'🤢' }

const STATE_CONFIG = {
  GREEN: {
    bg:            '/panda/sanctuary_green.png',
    bgNight:       '/panda/sanctuary_green_night.png',
    glow:          'rgba(46,196,182,0.4)',
    dot:           '#2EC4B6',
    label:         '🟢 Todo en orden',
    msg:           'Hoy tienes energía para todo.',
    frames:        ['/panda/panda_sitting.png','/panda/panda_happy.png','/panda/panda_happy.png','/panda/panda_sitting.png','/panda/panda_happy.png','/panda/panda_stay.png'],
    frameDuration: 4500,
  },
  YELLOW: {
    bg:            '/panda/sanctuary_yellow.png',
    bgNight:       '/panda/sanctuary_yellow_night.png',
    glow:          'rgba(245,158,11,0.4)',
    dot:           '#F59E0B',
    label:         '🟡 Ritmo moderado',
    msg:           'Ritmo moderado. Ajustando tu plan.',
    frames:        ['/panda/panda_base.png','/panda/thinking_1.png','/panda/panda_base.png','/panda/thinking_1.png'],
    frameDuration: 3000,
  },
  RED: {
    bg:            '/panda/sanctuary_red.png',
    bgNight:       '/panda/sanctuary_red_night.png',
    glow:          'rgba(255,143,163,0.4)',
    dot:           '#FF8FA3',
    label:         '🔴 Pandi te necesita',
    msg:           'Hoy el descanso ES el entrenamiento.',
    frames:        ['/panda/panda_base.png','/panda/panda_sad.png','/panda/panda_sad.png','/panda/thinking_1.png'],
    frameDuration: 3500,
  },
}

const WAKING_FRAMES     = ['/panda/panda_waking_1.png', '/panda/panda_waking_2.png', '/panda/panda_waking_3.png']
const SLEEPING_FRAME    = '/panda/panda_sleeping.png'
const SLEEPING_ZZZ_FRAME= '/panda/panda_sleeping_zzz.png'

const ALL_FRAMES = [
  '/panda/panda_blink.png', '/panda/panda_tip.png',
  ...STATE_CONFIG.GREEN.frames, ...STATE_CONFIG.YELLOW.frames, ...STATE_CONFIG.RED.frames,
  STATE_CONFIG.GREEN.bg, STATE_CONFIG.GREEN.bgNight,
  STATE_CONFIG.YELLOW.bg, STATE_CONFIG.YELLOW.bgNight,
  STATE_CONFIG.RED.bg, STATE_CONFIG.RED.bgNight,
  SLEEPING_FRAME, SLEEPING_ZZZ_FRAME, ...WAKING_FRAMES,
]

// ─── HOOKS ────────────────────────────────────────────────────────────────────

function useNightMode() {
  const [isNight, setIsNight] = useState(() => { const h = new Date().getHours(); return h >= 22 || h < 7 })
  useEffect(() => {
    const check = () => { const h = new Date().getHours(); setIsNight(h >= 22 || h < 7) }
    const t = setInterval(check, 60000)
    return () => clearInterval(t)
  }, [])
  return isNight
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return isMobile
}

// ─── ALERTA PANTALLA COMPLETA — SEMÁFORO ROJO ────────────────────────────────

function PandiRedAlert({ name, onClose, onAction }) {
  return (
    <motion.div
      initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      style={{ position:'fixed', inset:0, zIndex:200,
        background:'rgba(0,0,0,0.6)', backdropFilter:'blur(8px)',
        display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
      <motion.div
        initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        transition={{ type:'spring', damping:28, stiffness:280 }}
        style={{ width:'100%', maxWidth:480,
          background:'linear-gradient(160deg,#fff 0%,#FFF1F4 100%)',
          borderRadius:'28px 28px 0 0', padding:'28px 24px 48px',
          boxShadow:'0 -8px 40px rgba(255,100,130,0.2)' }}>

        <div style={{ textAlign:'center', marginBottom:20 }}>
          <img src="/panda/panda_sad.png" alt="Pandi"
            style={{ width:100, height:'auto', margin:'0 auto 12px' }}
            onError={e => { e.target.style.display='none' }} />
          <p style={{ fontSize:20, fontWeight:900, color:'#1A2332', margin:'0 0 8px' }}>
            Pandi ha notado algo 🐾
          </p>
          <p style={{ fontSize:14, color:'#6B7280', lineHeight:1.6, margin:0 }}>
            Hola <strong>{name}</strong>, hoy no he detectado actividad. Sin comida,
            sin entreno, sin check-in. Pequeños pasos hacen grandes cambios —
            ¿empezamos con algo sencillo?
          </p>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <motion.button whileTap={{ scale:0.97 }} onClick={onAction}
            style={{ padding:'14px', borderRadius:16, border:'none', cursor:'pointer',
              background:'linear-gradient(135deg,#2EC4B6,#FF8FA3)',
              color:'white', fontSize:15, fontWeight:800 }}>
            🌿 Ir a Bienestar
          </motion.button>
          <button onClick={onClose}
            style={{ padding:'12px', borderRadius:16, border:'none', cursor:'pointer',
              background:'rgba(0,0,0,0.06)', color:'#6B7280',
              fontSize:14, fontWeight:600 }}>
            Ahora no
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── SANCTUARY ────────────────────────────────────────────────────────────────

function Sanctuary({ recoveryLight, profile, theme, greeting, name, userId }) {
  const cfg      = STATE_CONFIG[recoveryLight] || STATE_CONFIG.GREEN
  const isMobile = useIsMobile()
  const isNight  = useNightMode()
  const navigate = useNavigate()

  const [frameIdx,   setFrameIdx]   = useState(0)
  const [imgErr,     setImgErr]     = useState(false)
  const [blinking,   setBlinking]   = useState(false)
  const [zzzOn,      setZzzOn]      = useState(true)
  const [notifOpen,  setNotifOpen]  = useState(false)
  const [waking,     setWaking]     = useState(false)
  const [wakeFrame,  setWakeFrame]  = useState(0)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => { ALL_FRAMES.forEach(src => { const i = new Image(); i.src = src }) }, [])
  useEffect(() => { setFrameIdx(0); setImgErr(false) }, [recoveryLight])

  useEffect(() => {
    if (isNight || cfg.frames.length <= 1) return
    const t = setInterval(() => setFrameIdx(i => (i + 1) % cfg.frames.length), cfg.frameDuration)
    return () => clearInterval(t)
  }, [recoveryLight, cfg.frames.length, cfg.frameDuration, isNight])

  useEffect(() => {
    if (isNight) return
    const schedule = () => setTimeout(() => {
      setBlinking(true)
      setTimeout(() => { setBlinking(false); schedule() }, 120)
    }, 3000 + Math.random() * 4000)
    const t = schedule()
    return () => clearTimeout(t)
  }, [isNight])

  useEffect(() => {
    if (!isNight) return
    const t = setInterval(() => setZzzOn(z => !z), 1400)
    return () => clearInterval(t)
  }, [isNight])

  function handlePandiTap() {
    if (!isNight) { navigate('/mood'); return }
    if (waking) return
    setWaking(true); setWakeFrame(0)
    setTimeout(() => setWakeFrame(1), 500)
    setTimeout(() => setWakeFrame(2), 1100)
    setTimeout(() => setShowPrompt(true), 1700)
  }

  function goToMood() { setShowPrompt(false); setWaking(false); navigate('/mood') }
  function letSleep() { setShowPrompt(false); setTimeout(() => setWaking(false), 300) }

  const bgImage = isNight ? (cfg.bgNight || cfg.bg) : cfg.bg
  const currentFrame = isNight
    ? (waking ? WAKING_FRAMES[wakeFrame] : (zzzOn ? SLEEPING_ZZZ_FRAME : SLEEPING_FRAME))
    : (blinking ? '/panda/panda_blink.png' : cfg.frames[frameIdx])

  return (
    <div style={{
      position:'relative', width:'100%',
      height: isMobile ? '95vw' : '50vw',
      maxHeight: isMobile ? 550 : 500,
      overflow:'hidden',
      backgroundImage:`url(${bgImage})`,
      backgroundSize:'cover', backgroundPosition:'center bottom', backgroundRepeat:'no-repeat',
      backgroundColor: isNight ? '#1a2138'
                      : recoveryLight==='GREEN' ? '#e8f5ee'
                      : recoveryLight==='YELLOW' ? '#fef3c7'
                      : '#ffe4ec',
      transition:'background-color 1.5s ease',
    }}>

      {/* Overlays */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:'35%', zIndex:1, pointerEvents:'none',
        background: isNight ? 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 100%)'
                            : 'linear-gradient(to bottom, rgba(0,0,0,0.22) 0%, transparent 100%)' }} />
      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'32%', zIndex:1, pointerEvents:'none',
        background:'linear-gradient(to top, #f8fafa 0%, transparent 100%)' }} />

      {/* HEADER */}
      <div style={{ position:'absolute', top:0, left:0, right:0, zIndex:10,
        padding:'14px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <MenuButton />
        <div style={{ textAlign:'center' }}>
          <p style={{ fontSize:11, color:'rgba(255,255,255,0.9)', margin:0, fontWeight:600 }}>{greeting},</p>
          <h1 style={{ fontSize:20, fontWeight:900, color:'white', margin:0,
            letterSpacing:'-.02em', textShadow:'0 2px 8px rgba(0,0,0,0.3)' }}>{name} 👋</h1>
          {/* SEMÁFORO — justo bajo el saludo */}
          <motion.div animate={{ opacity:[0.7,1,0.7] }} transition={{ duration:2, repeat:Infinity }}
            style={{ display:'inline-flex', alignItems:'center', gap:5, marginTop:4,
              padding:'4px 12px', borderRadius:20,
              background:'rgba(255,255,255,0.25)', backdropFilter:'blur(8px)' }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background:cfg.dot,
              boxShadow:`0 0 6px ${cfg.dot}` }} />
            <span style={{ fontSize:10, fontWeight:700, color:'white' }}>{cfg.label}</span>
          </motion.div>
        </div>
        <div style={{ position:'relative' }}>
          <NotificationBell userId={userId} onOpen={() => setNotifOpen(o => !o)} hasUnseen={true} />
          <AnimatePresence>
            {notifOpen && <NotificationPanel userId={userId} onClose={() => setNotifOpen(false)} />}
          </AnimatePresence>
        </div>
      </div>

      {/* Estrellas nocturnas */}
      {isNight && (
        <div style={{ position:'absolute', inset:0, zIndex:2, pointerEvents:'none' }}>
          {[{top:'12%',left:'15%',size:3,delay:0},{top:'18%',left:'75%',size:2,delay:0.6},
            {top:'8%',left:'45%',size:2,delay:1.2},{top:'25%',left:'85%',size:3,delay:0.3}].map((s,i) => (
            <motion.div key={i}
              animate={{ opacity:[0.2,0.9,0.2] }} transition={{ duration:2.5, repeat:Infinity, delay:s.delay }}
              style={{ position:'absolute', top:s.top, left:s.left, width:s.size, height:s.size,
                borderRadius:'50%', background:'white', boxShadow:'0 0 4px white' }} />
          ))}
        </div>
      )}

      {/* Botón Bienestar */}
      <div style={{ position:'absolute', bottom:'4%', left:'50%', transform:'translateX(-50%)', zIndex:8 }}>
        <motion.button whileTap={{ scale:0.95 }} onClick={() => navigate('/mood')}
          style={{ padding:'8px 22px', borderRadius:20, border:'none', cursor:'pointer',
            background:'rgba(255,255,255,0.45)', backdropFilter:'blur(8px)',
            fontSize:12, fontWeight:800, color:'rgba(0,0,0,0.6)', letterSpacing:'.04em' }}>
          🌿 Bienestar
        </motion.button>
      </div>

      {/* PANDI */}
      <div style={{ position:'absolute', bottom:'12%', left:'50%', transform:'translateX(-50%)',
        zIndex:5, width:isMobile ? '48%' : '15%', maxWidth:500 }}>
        <motion.div onClick={handlePandiTap} whileTap={{ scale:0.95 }}
          style={{ cursor:'pointer', touchAction:'manipulation' }}>
          <div style={{ position:'relative' }}>
            <motion.div
              animate={{ opacity: isNight ? [0.15,0.3,0.15] : [0.3,0.5,0.3] }}
              transition={{ duration:3, repeat:Infinity, ease:'easeInOut' }}
              style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
                width:'80%', height:'80%', borderRadius:'50%',
                background:`radial-gradient(circle, ${isNight ? 'rgba(120,140,220,0.35)' : cfg.glow} 0%, transparent 65%)`,
                filter:'blur(24px)', zIndex:-1, pointerEvents:'none' }} />
            <motion.div
              animate={{ scaleX:[1,1.04,1], opacity:[0.2,0.3,0.2] }}
              transition={{ duration:3, repeat:Infinity, ease:'easeInOut' }}
              style={{ position:'absolute', bottom:-4, left:'50%', transform:'translateX(-50%)',
                width:'50%', height:8, borderRadius:'50%', background:'rgba(0,0,0,0.15)',
                filter:'blur(4px)', zIndex:-1 }} />
            <div style={{ filter:`drop-shadow(0 12px 20px ${isNight ? 'rgba(120,140,220,0.3)' : cfg.glow})` }}>
              {imgErr
                ? <span style={{ fontSize:'15vw', display:'block', textAlign:'center' }}>{isNight ? '😴' : '🐾'}</span>
                : <motion.img src={currentFrame} alt="Pandi"
                    animate={{ opacity:1 }} transition={{ duration:0.15 }}
                    style={{ width:'100%', height:'auto', objectFit:'contain', display:'block' }}
                    onError={() => setImgErr(true)} />
              }
            </div>
            {!isNight && profile?.tummy_state && profile.tummy_state !== 'neutral' && (
              <div style={{ position:'absolute', top:'6%', right:'2%', width:26, height:26,
                borderRadius:'50%', background:'white', display:'flex', alignItems:'center',
                justifyContent:'center', fontSize:14, boxShadow:'0 2px 8px rgba(0,0,0,0.15)' }}>
                {TUMMY_EMOJI[profile.tummy_state] || '😐'}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Prompt nocturno */}
      <AnimatePresence>
        {showPrompt && (
          <motion.div
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:'absolute', bottom:'6%', left:16, right:16, zIndex:15,
              display:'flex', gap:8, justifyContent:'center' }}>
            <button onClick={letSleep}
              style={{ padding:'10px 16px', borderRadius:14, border:'none', cursor:'pointer',
                background:'rgba(255,255,255,0.92)', backdropFilter:'blur(8px)',
                fontSize:12, fontWeight:700, color:'#6B7280' }}>Déjala dormir 😴</button>
            <button onClick={goToMood}
              style={{ padding:'10px 16px', borderRadius:14, border:'none', cursor:'pointer',
                background:'linear-gradient(135deg,#2EC4B6,#FF8FA3)',
                fontSize:12, fontWeight:700, color:'white' }}>Ir a Bienestar 🌿</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── XP BAR ───────────────────────────────────────────────────────────────────

function XPBar({ profile, cfg }) {
  return (
    <div style={{ padding:'8px 16px', background:'rgba(255,255,255,0.95)',
      borderBottom:'1px solid rgba(0,0,0,0.04)' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontSize:12, fontWeight:800, color:'#1A2332' }}>Nivel {profile?.level||1}</span>
          <div style={{ width:1, height:12, background:'rgba(0,0,0,0.1)' }} />
          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
            <span style={{ fontSize:13 }}>🔥</span>
            <span style={{ fontSize:13, fontWeight:900, color:'#F97316' }}>{profile?.streak||0}</span>
            <span style={{ fontSize:10, color:'#9CA3AF', fontWeight:600 }}>racha</span>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontSize:10, fontWeight:700, color:cfg?.dot||'#2EC4B6' }}>{profile?.xp||0} XP</span>
          <span style={{ fontSize:10, color:'#9CA3AF' }}>/ {(profile?.level||1)*500}</span>
        </div>
      </div>
      <div style={{ height:5, borderRadius:3, background:'rgba(0,0,0,0.08)', overflow:'hidden' }}>
        <motion.div
          style={{ height:'100%', borderRadius:3, background:cfg?.dot||'#2EC4B6',
            boxShadow:`0 0 8px ${cfg?.dot||'#2EC4B6'}60` }}
          initial={{ width:0 }} animate={{ width:`${((profile?.xp||0)%500)/5}%` }}
          transition={{ duration:0.8 }} />
      </div>
    </div>
  )
}

// ─── WATER WIDGET ─────────────────────────────────────────────────────────────

function WaterWidget({ userId }) {
  const [glasses, setGlasses] = useState(0)
  const [goal,    setGoal]    = useState(8)
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (!userId) return
    supabase.from('hydration_logs').select('glasses,goal').eq('user_id',userId).eq('date',today).maybeSingle()
      .then(({ data }) => { if (data) { setGlasses(data.glasses||0); setGoal(data.goal||8) } })
  }, [userId])

  async function update(delta) {
    const next = Math.max(0, Math.min(glasses + delta, goal + 4))
    setGlasses(next)
    await supabase.from('hydration_logs')
      .upsert({ user_id:userId, date:today, glasses:next, goal }, { onConflict:'user_id,date' })
    if (next === goal && glasses < goal) useStore.getState().addXP(20)
  }

  const pct = Math.min(glasses / goal, 1)
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px',
      borderRadius:18, background:'rgba(255,255,255,0.95)',
      border:'1px solid rgba(59,130,246,0.2)', marginBottom:8,
      boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
      <div style={{ width:44, height:44, borderRadius:14, background:'#EFF6FF',
        display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <Droplets size={20} style={{ color:'#3B82F6' }} />
      </div>
      <div style={{ flex:1 }}>
        <p style={{ fontSize:14, fontWeight:700, color:'#1A2332', margin:0 }}>Hidratación</p>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:4 }}>
          <div style={{ flex:1, height:6, borderRadius:3, background:'rgba(0,0,0,0.08)', overflow:'hidden' }}>
            <motion.div animate={{ width:`${pct*100}%` }} transition={{ duration:0.4 }}
              style={{ height:'100%', borderRadius:3, background:'linear-gradient(90deg,#60A5FA,#3B82F6)' }} />
          </div>
          <span style={{ fontSize:11, color:'#6B7280', whiteSpace:'nowrap' }}>{glasses*250}ml / {goal*250}ml</span>
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
        <button onClick={() => update(-1)} disabled={glasses===0}
          style={{ width:28, height:28, borderRadius:8, background:'rgba(0,0,0,0.06)',
            border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <MinusIcon size={12} style={{ color:'#6B7280' }} />
        </button>
        <span style={{ fontSize:16, fontWeight:800, color:'#3B82F6', minWidth:16, textAlign:'center' }}>{glasses}</span>
        <motion.button whileTap={{ scale:0.9 }} onClick={() => update(1)}
          style={{ width:28, height:28, borderRadius:8, background:'#3B82F6',
            border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Plus size={12} style={{ color:'#fff' }} />
        </motion.button>
      </div>
    </div>
  )
}

// ─── MINI RING ────────────────────────────────────────────────────────────────

function MiniRing({ value, max, color, label }) {
  const r = 22, circ = 2 * Math.PI * r
  const pct = Math.min(value / max, 1)
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
      <div style={{ position:'relative', width:56, height:56 }}>
        <svg width={56} height={56} style={{ transform:'rotate(-90deg)' }}>
          <circle cx={28} cy={28} r={r} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth={6} />
          <motion.circle cx={28} cy={28} r={r} fill="none" stroke={color} strokeWidth={6}
            strokeDasharray={circ} initial={{ strokeDashoffset:circ }}
            animate={{ strokeDashoffset:circ*(1-pct) }} transition={{ duration:0.8 }} strokeLinecap="round" />
        </svg>
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <span style={{ fontSize:10, fontWeight:800, color }}>{Math.round(pct*100)}%</span>
        </div>
      </div>
      <span style={{ fontSize:10, fontWeight:600, color:'#6B7280' }}>{label}</span>
    </div>
  )
}

// ─── MINI WEEK WIDGET ─────────────────────────────────────────────────────────

function MiniWeekWidget({ userId, theme }) {
  const [weekData, setWeekData] = useState([])
  useEffect(() => {
    if (!userId) return
    const today = new Date()
    const days  = Array.from({ length:7 }, (_, i) => {
      const d = new Date(today); d.setDate(d.getDate() - (6-i))
      return d.toISOString().split('T')[0]
    })
    const from = days[0], to = days[6]
    const safe = async fn => { try { return await fn } catch { return { data:[] } } }
    Promise.all([
      safe(supabase.from('meal_logs').select('date,calories').eq('user_id',userId).gte('date',from).lte('date',to)),
      safe(supabase.from('mood_logs').select('date,mood').eq('user_id',userId).gte('date',from).lte('date',to)),
      safe(supabase.from('workout_sessions').select('created_at').eq('user_id',userId).eq('status','completed').gte('created_at',from+'T00:00:00')),
      safe(supabase.from('sleep_logs').select('date,hours').eq('user_id',userId).gte('date',from).lte('date',to)),
    ]).then(([mealsR,moodR,workoutR,sleepR]) => {
      const calByDate  = {}; (mealsR.data||[]).forEach(m => { calByDate[m.date]=(calByDate[m.date]||0)+m.calories })
      const moodByDate = {}; (moodR.data||[]).forEach(m => { moodByDate[m.date]=m.mood })
      const woDates    = new Set((workoutR.data||[]).map(w=>w.created_at?.split('T')[0]))
      const sleepByDate= {}; (sleepR.data||[]).forEach(s => { sleepByDate[s.date]=s.hours })
      setWeekData(days.map(date => {
        const cal=calByDate[date]||0, mood=moodByDate[date]||null, wo=woDates.has(date), sleep=sleepByDate[date]||null
        let score=0, count=0
        if (cal>0) { score+=Math.min(cal/2000,1); count++ }
        if (mood)  { score+=mood/5; count++ }
        if (wo)    { score+=1; count++ }
        if (sleep) { score+=Math.min(sleep/7,1); count++ }
        return { date, score:count>0?score/count:0, registered:count>0, mood, workout:wo }
      }))
    })
  }, [userId])

  if (!weekData.length) return null
  const scoreColor = s => s>0.7 ? '#2EC4B6' : s>0.4 ? '#F59E0B' : s>0 ? '#EF4444' : 'rgba(0,0,0,0.08)'
  const MOOD_EMOJIS = {1:'😩',2:'😞',3:'😐',4:'😊',5:'🤩'}
  const activeDays  = weekData.filter(d=>d.registered).length

  return (
    <Link to="/calendar?tab=history" style={{ textDecoration:'none' }}>
      <div style={{ background:'rgba(255,255,255,0.95)', borderRadius:20, padding:'12px 14px',
        marginBottom:12, border:'1px solid rgba(0,0,0,0.06)', boxShadow:'0 2px 12px rgba(0,0,0,0.04)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
          <p style={{ fontSize:13, fontWeight:800, color:'#1A2332', margin:0 }}>Esta semana</p>
          <span style={{ fontSize:11, color:theme.primary, fontWeight:700 }}>{activeDays}/7 días activos →</span>
        </div>
        <div style={{ display:'flex', gap:6, alignItems:'flex-end', height:48 }}>
          {weekData.map((day, i) => {
            const date    = new Date(day.date+'T12:00:00')
            const dayName = ['L','M','X','J','V','S','D'][date.getDay()===0?6:date.getDay()-1]
            const isToday = day.date === new Date().toISOString().split('T')[0]
            const h       = day.registered ? Math.max(day.score*36, 6) : 6
            return (
              <div key={day.date} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                {day.mood ? <span style={{ fontSize:9 }}>{MOOD_EMOJIS[day.mood]}</span>
                          : <span style={{ fontSize:9, opacity:0 }}>·</span>}
                <motion.div initial={{ height:0 }} animate={{ height:h }} transition={{ duration:0.4, delay:i*0.05 }}
                  style={{ width:'100%', borderRadius:5, background:scoreColor(day.score),
                    border:isToday ? `2px solid ${theme.primary}` : '2px solid transparent',
                    boxShadow:isToday ? `0 0 6px ${theme.primary}50` : 'none' }} />
                <span style={{ fontSize:9, fontWeight:700, color:isToday?theme.primary:'#9CA3AF' }}>{dayName}</span>
              </div>
            )
          })}
        </div>
      </div>
    </Link>
  )
}

// ─── PANDI TIP CARD ───────────────────────────────────────────────────────────

const TIP_ICONS = { reminder:'⏰', hydration:'💧', mood:'🤍', celebrate:'🎉', nutrition:'💪', tip:'💡' }

function PandiTipCard({ theme, userId }) {
  const [tip,       setTip]       = useState('')
  const [tipType,   setTipType]   = useState('tip')
  const [action,    setAction]    = useState(null)
  const [visible,   setVisible]   = useState(false)
  const [open,      setOpen]      = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [showPulse, setShowPulse] = useState(false)

  useEffect(() => { if (userId) loadContextualTip() }, [userId])

  async function loadContextualTip() {
    const cacheKey = `pandi_ctx_tip_${new Date().toISOString().slice(0,13)}`
    try {
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        const { text, type, action: a } = JSON.parse(cached)
        setTip(text); setTipType(type||'tip'); setAction(a||null)
        setTimeout(() => setVisible(true), 800); return
      }
    } catch {}

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const res  = await fetch(`${import.meta.env.VITE_API_URL}/api/tip/daily`,
        { headers: { Authorization:`Bearer ${session.access_token}` } })
      const data = await res.json()
      if (data.tip) {
        const entry = { text:data.tip, type:'tip' }
        setTip(data.tip); setTipType('tip'); setAction(null)
        try { localStorage.setItem(cacheKey, JSON.stringify(entry)) } catch {}
        setTimeout(() => setVisible(true), 800)
      }
    } catch {
      const fallbacks = [
        { text:'Beber agua antes de comer reduce la ingesta calórica hasta un 13%. 💧', type:'hydration' },
        { text:'Una caminata de 10 min después de comer mejora la glucemia. 🚶', type:'tip' },
        { text:'Dormir menos de 7h aumenta el hambre hasta un 24%. 😴', type:'reminder' },
      ]
      const f = fallbacks[Math.floor(Math.random() * fallbacks.length)]
      setTip(f.text); setTipType(f.type); setAction(null)
      setTimeout(() => setVisible(true), 800)
    }
  }

  if (!visible || !tip || dismissed) return null
  const accentColor = tipType==='celebrate' ? '#F59E0B' : tipType==='mood' ? '#FF8FA3'
                    : tipType==='reminder'   ? '#8B5CF6' : tipType==='hydration' ? '#3B82F6' : theme.primary
  const label = tipType==='celebrate' ? '🎉 Pandi celebra' : tipType==='mood' ? '🤍 Pandi te acompaña'
              : tipType==='reminder'   ? '⏰ Pandi recuerda' : tipType==='hydration' ? '💧 Pandi sugiere'
              : tipType==='nutrition'  ? '💪 Pandi sugiere' : '💡 Tip de Pandi'

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        style={{ marginBottom:12 }}>
        <div onClick={() => setOpen(o => !o)}
          style={{ background:'rgba(255,255,255,0.95)', borderRadius:18, padding:'12px 14px',
            border:`1px solid ${open ? accentColor+'40' : 'rgba(0,0,0,0.06)'}`,
            boxShadow:open ? `0 4px 16px ${accentColor}15` : '0 2px 12px rgba(0,0,0,0.05)',
            cursor:'pointer' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:open?8:0 }}>
            <p style={{ fontSize:11, fontWeight:800, color:accentColor, margin:0, textTransform:'uppercase', letterSpacing:'.06em' }}>
              {label}
            </p>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <img src="/panda/panda_tip.png" alt="" style={{ width:28, height:28, objectFit:'contain' }}
                onError={e => { e.target.style.display='none' }} />
              <span style={{ fontSize:11, color:'#9CA3AF' }}>{open ? '▲' : '▼'}</span>
            </div>
          </div>
          <AnimatePresence mode="wait">
            {open ? (
              <motion.div key="open" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
                <p style={{ fontSize:13, color:'#374151', lineHeight:1.6, margin:'0 0 10px' }}>{tip}</p>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {action && (
                    <button onClick={e => { e.stopPropagation(); setShowPulse(true) }}
                      style={{ fontSize:12, color:'white', fontWeight:700, background:accentColor,
                        border:'none', borderRadius:12, padding:'7px 14px', cursor:'pointer' }}>
                      {action.label}
                    </button>
                  )}
                  <button onClick={e => { e.stopPropagation(); setDismissed(true) }}
                    style={{ fontSize:11, color:accentColor, fontWeight:700, background:'none',
                      border:'none', cursor:'pointer', padding:0 }}>
                    Entendido ✓
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.p key="closed" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                style={{ fontSize:12, color:'#6B7280', lineHeight:1.4, margin:'6px 0 0',
                  overflow:'hidden', display:'-webkit-box',
                  WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
                {tip}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
      <AnimatePresence>
        {showPulse && action && (
          <PandiPulse mode="guided" situation={action.situation} score={action.score}
            onClose={() => setShowPulse(false)}
            onComplete={() => { setShowPulse(false); setDismissed(true) }} />
        )}
      </AnimatePresence>
    </AnimatePresence>
  )
}

// ─── MAIN HOME ────────────────────────────────────────────────────────────────

export default function Home() {
  const { profile, user } = useStore()
  const { theme, loaded } = useTheme()
  const navigate = useNavigate()

  const [todayMeals,   setTodayMeals]   = useState([])
  const [todayWorkout, setTodayWorkout] = useState(null)
  const [goals,        setGoals]        = useState({ calories:2000, protein_g:150 })
  const [todaySleep,   setTodaySleep]   = useState(null)
  const [todayMood,    setTodayMood]    = useState(null)
  const [waterGlasses, setWaterGlasses] = useState(0)
  const [newAchievement, setNewAchievement] = useState(null)
  const [showRedAlert, setShowRedAlert] = useState(false)

  useEffect(() => { if (user) useStore.getState().initCoach() }, [user])

  useEffect(() => {
    if (!user) return
    const today = new Date().toISOString().split('T')[0]
    const safe  = p => Promise.resolve(p).catch(() => ({ data:null }))
    Promise.all([
      safe(supabase.from('meal_logs').select('calories,protein_g').eq('user_id',user.id).eq('date',today)),
      safe(supabase.from('workout_sessions').select('calories_burned').eq('user_id',user.id).eq('status','completed').gte('created_at',today+'T00:00:00').limit(1)),
      safe(supabase.from('nutrition_goals').select('*').eq('user_id',user.id).maybeSingle()),
      safe(supabase.from('sleep_logs').select('hours,quality').eq('user_id',user.id).eq('date',today).maybeSingle()),
      safe(supabase.from('mood_logs').select('mood').eq('user_id',user.id).eq('date',today).maybeSingle()),
      safe(supabase.from('hydration_logs').select('glasses,goal').eq('user_id',user.id).eq('date',today).maybeSingle()),
    ]).then(([mealsR,workoutR,goalsR,sleepR,moodR,waterR]) => {
      setTodayMeals(mealsR.data || [])
      setTodayWorkout(workoutR.data?.[0] || null)
      if (goalsR.data) setGoals(goalsR.data)
      setTodaySleep(sleepR.data || null)
      setTodayMood(moodR.data || null)
      setWaterGlasses(waterR.data?.glasses || 0)
    })
  }, [user])

  const cals    = todayMeals.reduce((s,m) => s+(m.calories||0), 0)
  const protein = todayMeals.reduce((s,m) => s+(m.protein_g||0), 0)
  const burned  = todayWorkout?.calories_burned || 0

  // ── SEMÁFORO REAL — calculado desde datos del día ─────────────────────────
  const recoveryLight = useMemo(() => {
    const hasFood    = cals > 200
    const hasWorkout = !!todayWorkout
    const hasSleep   = !!todaySleep
    const hasMood    = !!todayMood
    const hasWater   = waterGlasses >= 4
    const score = [hasFood, hasWorkout, hasSleep, hasMood, hasWater].filter(Boolean).length
    if (score === 0) return 'RED'
    if (score <= 2)  return 'YELLOW'
    return 'GREEN'
  }, [cals, todayWorkout, todaySleep, todayMood, waterGlasses])

  // Mostrar alerta roja una vez por sesión si el semáforo está en rojo
  useEffect(() => {
    if (recoveryLight !== 'RED') return
    const alertKey = `pandi_red_alert_${new Date().toISOString().split('T')[0]}`
    const shown    = sessionStorage.getItem(alertKey)
    if (!shown) {
      const t = setTimeout(() => {
        sessionStorage.setItem(alertKey, '1')
        setShowRedAlert(true)
      }, 3000) // esperar 3s antes de mostrar
      return () => clearTimeout(t)
    }
  }, [recoveryLight])

  // Generar notificación nocturna si es después de las 20h y no se ha generado hoy
  useEffect(() => {
    if (!user) return
    const hour = new Date().getHours()
    if (hour < 20) return
    const notifKey = `pandi_notif_${new Date().toISOString().split('T')[0]}`
    if (sessionStorage.getItem(notifKey)) return

    async function generateNightNotif() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return
        await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/nightly`, {
          method: 'POST',
          headers: { Authorization:`Bearer ${session.access_token}`, 'Content-Type':'application/json' },
          body: JSON.stringify({ recoveryLight, cals, burned, waterGlasses }),
        })
        sessionStorage.setItem(notifKey, '1')
      } catch {}
    }
    generateNightNotif()
  }, [user, recoveryLight])

  useSectionContext('home', {
    caloriesConsumed: Math.round(cals), caloriesTarget: goals.calories,
    proteinConsumed:  Math.round(protein), proteinTarget: goals.protein_g,
    caloriesBurned:   burned, waterGlasses, workedOutToday: !!todayWorkout,
    sleepLastNight:   todaySleep?.hours||null, moodToday: todayMood?.mood||null,
    streak: profile?.streak||0, level: profile?.level||1,
  })

  if (!loaded) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#f0fffe' }}>
      <motion.div animate={{ scale:[1,1.1,1] }} transition={{ duration:1.5, repeat:Infinity }}>
        <span style={{ fontSize:48 }}>🐾</span>
      </motion.div>
    </div>
  )

  const hour     = new Date().getHours()
  const greeting = hour >= 20 || hour < 7 ? '¡Buenas noches' : hour < 12 ? '¡Buenos días' : '¡Buenas tardes'
  const name     = profile?.name?.split(' ')[0] || 'Compi'
  const cfg      = STATE_CONFIG[recoveryLight] || STATE_CONFIG.GREEN

  return (
    <div style={{ minHeight:'100vh', background:'#f8fafa', paddingBottom:100 }}>

      {/* Sanctuary con Pandi y semáforo integrado */}
      <Sanctuary recoveryLight={recoveryLight} profile={profile} theme={theme}
        greeting={greeting} name={name} userId={user?.id} />

      {/* XP Bar */}
      <div style={{ marginTop:'20px' }}>
        <XPBar profile={profile} cfg={cfg} />
      </div>

      <div style={{ padding:'0 16px', marginTop:8 }}>

        {/* Widget semanal */}
        <MiniWeekWidget userId={user?.id} theme={theme} />

        {/* Tip de Pandi */}
        <PandiTipCard theme={theme} userId={user?.id} />

        {/* Plan de hoy — solo los anillos */}
        <div style={{ background:'rgba(255,255,255,0.95)', borderRadius:20, padding:'14px 16px',
          marginBottom:16, border:'1px solid rgba(0,0,0,0.06)', boxShadow:'0 4px 20px rgba(0,0,0,0.06)' }}>
          <p style={{ fontSize:15, fontWeight:800, color:'#1A2332', margin:'0 0 12px' }}>Resumen de hoy</p>
          <div style={{ display:'flex', justifyContent:'space-around', padding:'4px 0' }}>
            <MiniRing value={cals}         max={goals.calories}   color="#F97316"       label="Calorías" />
            <MiniRing value={protein}      max={goals.protein_g}  color={theme.primary} label="Proteína" />
            <MiniRing value={burned}       max={400}              color="#22C55E"        label="Quemadas" />
            <MiniRing value={waterGlasses} max={8}                color="#3B82F6"        label="Agua" />
          </div>
        </div>

        {/* Hidratación */}
        <WaterWidget userId={user?.id} />

        {/* Insights de Pandi */}
        <PandiInsights />

      </div>

      {/* Alerta pantalla completa — semáforo rojo */}
      <AnimatePresence>
        {showRedAlert && (
          <PandiRedAlert
            name={name}
            onClose={() => setShowRedAlert(false)}
            onAction={() => { setShowRedAlert(false); navigate('/mood') }} />
        )}
      </AnimatePresence>

      <AchievementUnlockedModal achievement={newAchievement} onClose={() => setNewAchievement(null)} />
    </div>
  )
}
