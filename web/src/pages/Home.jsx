import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/useStore'
import { NotificationBell, default as NotificationPanel } from '../components/NotificationPanel'
import QuickBreathModal, { QuickBreathButton } from '../components/QuickBreath'
import { checkAchievements } from '../lib/achievements'
import AchievementUnlockedModal from '../components/AchievementUnlockedModal'
// RecoveryBadge y WeeklyChallengesWidget desactivados temporalmente
// import RecoveryBadge from '../components/RecoveryBadge'
// import WeeklyChallengesWidget from '../components/WeeklyChallengesWidget'
import { useTheme } from '../contexts/ThemeProvider'
import { usePandiState } from '../contexts/PandiStateContext'
import { supabase } from '../lib/supabase'
import { useSectionContext } from '../hooks/useSectionContext'
import PandiInsights from '../components/PandiInsights'
import { Plus, Minus as MinusIcon, Droplets } from 'lucide-react'
import DailyCheckin from '../components/DailyCheckin'
import PandiPulse from '../components/mood/PandiPulse'
// CoachAwarenessContext — disponible cuando el provider esté en App.jsx
// import { useModuleAwareness } from '../contexts/CoachAwarenessContext'

const TUMMY_EMOJI = { great:'😋', good:'🙂', neutral:'😐', bad:'😕', terrible:'🤢' }

const STATE_CONFIG = {
  GREEN: {
    bg:            '/panda/sanctuary_green.png',
    bgNight:       '/panda/sanctuary_green_night.png',
    glow:          'rgba(46,196,182,0.4)',
    dot:           '#2EC4B6',
    msg:           'Hoy tienes energía para todo.',
    frames:        ['/panda/panda_base.png','/panda/panda_happy.png','/panda/panda_happy.png','/panda/panda_base.png','/panda/panda_happy.png','/panda/panda_base.png'],
    frameDuration: 4500,
  },
  YELLOW: {
    bg:            '/panda/sanctuary_yellow.png',
    bgNight:       '/panda/sanctuary_yellow_night.png',
    glow:          'rgba(245,158,11,0.4)',
    dot:           '#F59E0B',
    msg:           'Ritmo moderado. Ajustando tu plan.',
    frames:        ['/panda/panda_base.png','/panda/thinking_1.png','/panda/panda_base.png','/panda/thinking_1.png'],
    frameDuration: 3000,
  },
  RED: {
    bg:            '/panda/sanctuary_red.png',
    bgNight:       '/panda/sanctuary_red_night.png',
    glow:          'rgba(255,143,163,0.4)',
    dot:           '#FF8FA3',
    msg:           'Hoy el descanso ES el entrenamiento.',
    frames:        ['/panda/panda_base.png','/panda/thinking_1.png','/panda/panda_base.png','/panda/thinking_1.png'],
    frameDuration: 3500,
  },
}

// Frames de la animación de despertar — en orden
const WAKING_FRAMES = ['/panda/panda_waking_1.png', '/panda/panda_waking_2.png', '/panda/panda_waking_3.png']
const SLEEPING_FRAME      = '/panda/panda_sleeping.png'
const SLEEPING_ZZZ_FRAME  = '/panda/panda_sleeping_zzz.png'

const ALL_FRAMES = [
  '/panda/panda_blink.png',
  '/panda/panda_tip.png',
  ...STATE_CONFIG.GREEN.frames,
  ...STATE_CONFIG.YELLOW.frames,
  ...STATE_CONFIG.RED.frames,
  STATE_CONFIG.GREEN.bg, STATE_CONFIG.GREEN.bgNight,
  STATE_CONFIG.YELLOW.bg, STATE_CONFIG.YELLOW.bgNight,
  STATE_CONFIG.RED.bg, STATE_CONFIG.RED.bgNight,
  SLEEPING_FRAME, SLEEPING_ZZZ_FRAME,
  ...WAKING_FRAMES,
]

// ── Detecta si estamos en modo noche (22h - 7h) ──────────────────────────────
function useNightMode() {
  const [isNight, setIsNight] = useState(() => {
    const h = new Date().getHours()
    return h >= 22 || h < 7
  })
  useEffect(() => {
    const check = () => {
      const h = new Date().getHours()
      setIsNight(h >= 22 || h < 7)
    }
    const t = setInterval(check, 60000) // revisar cada minuto
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

function Sanctuary({ recoveryLight, profile, theme, greeting, name, userId }) {
  const cfg      = STATE_CONFIG[recoveryLight] || STATE_CONFIG.GREEN
  const isMobile = useIsMobile()
  const isNight  = useNightMode()
  const navigate = useNavigate()

  const [frameIdx, setFrameIdx] = useState(0)
  const [imgErr,   setImgErr]   = useState(false)
  const [blinking, setBlinking] = useState(false)
  const [zzzOn,    setZzzOn]    = useState(true)
  const [notifOpen, setNotifOpen] = useState(false)
  const [waking,   setWaking]   = useState(false)
  const [wakeFrame,setWakeFrame]= useState(0)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    ALL_FRAMES.forEach(src => { const i = new Image(); i.src = src })
  }, [])

  useEffect(() => { setFrameIdx(0); setImgErr(false) }, [recoveryLight])

  // Animación normal de frames — solo de día
  useEffect(() => {
    if (isNight || cfg.frames.length <= 1) return
    const t = setInterval(() => setFrameIdx(i => (i + 1) % cfg.frames.length), cfg.frameDuration)
    return () => clearInterval(t)
  }, [recoveryLight, cfg.frames.length, cfg.frameDuration, isNight])

  // Parpadeo — solo de día
  useEffect(() => {
    if (isNight) return
    const schedule = () => setTimeout(() => {
      setBlinking(true)
      setTimeout(() => { setBlinking(false); schedule() }, 120)
    }, 3000 + Math.random() * 4000)
    const t = schedule()
    return () => clearTimeout(t)
  }, [isNight])

  // Parpadeo del Zzz — solo de noche
  useEffect(() => {
    if (!isNight) return
    const t = setInterval(() => setZzzOn(z => !z), 1400)
    return () => clearInterval(t)
  }, [isNight])

  function handlePandiTap() {
    if (!isNight) { navigate('/sanctuary'); return }
    if (waking) return
    setWaking(true)
    setWakeFrame(0)
    setTimeout(() => setWakeFrame(1), 500)
    setTimeout(() => setWakeFrame(2), 1100)
    setTimeout(() => { setShowPrompt(true) }, 1700)
  }

  function goToSanctuary() {
    setShowPrompt(false); setWaking(false)
    navigate('/sanctuary')
  }

  function letSleep() {
    setShowPrompt(false)
    setTimeout(() => setWaking(false), 300)
  }

  const bgImage = isNight ? (cfg.bgNight || cfg.bg) : cfg.bg

  const currentFrame = isNight
    ? (waking
        ? WAKING_FRAMES[wakeFrame]
        : (zzzOn ? SLEEPING_ZZZ_FRAME : SLEEPING_FRAME))
    : (blinking ? '/panda/panda_blink.png' : cfg.frames[frameIdx])

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: isMobile ? '95vw' : '50vw',
      maxHeight: isMobile ? 550 : 500,
      overflow: 'hidden',
      backgroundImage: `url(${bgImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center bottom',
      backgroundRepeat: 'no-repeat',
      backgroundColor: isNight ? '#1a2138'
                      : recoveryLight==='GREEN' ? '#e8f5ee'
                      : recoveryLight==='YELLOW' ? '#fef3c7'
                      : '#ffe4ec',
      transition: 'background-color 1.5s ease',
    }}>

      {/* Overlay top */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:'35%', zIndex:1,
        background: isNight
          ? 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 100%)'
          : 'linear-gradient(to bottom, rgba(0,0,0,0.22) 0%, transparent 100%)',
        pointerEvents:'none' }} />

      {/* Overlay bottom */}
      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'32%', zIndex:1,
        background:'linear-gradient(to top, #f8fafa 0%, transparent 100%)',
        pointerEvents:'none' }} />

      {/* Botón Santuario — acceso directo sin animación */}
      <div style={{ position:'absolute', bottom:'4%', left:'50%', transform:'translateX(-50%)', zIndex:8 }}>
        <motion.button whileTap={{ scale:0.95 }}
          onClick={() => navigate('/sanctuary')}
          style={{ padding:'8px 22px', borderRadius:20, border:'none', cursor:'pointer',
            background:'rgba(255,255,255,0.45)', backdropFilter:'blur(8px)',
            fontSize:12, fontWeight:800, color:'rgba(0,0,0,0.6)',
            letterSpacing:'.04em', display:'block' }}>
          ✨ Santuario
        </motion.button>
      </div>

      {/* HEADER */}
      <div style={{ position:'absolute', top:0, left:0, right:0, zIndex:10,
        padding:'14px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>

        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <Link to="/profile">
            <div style={{ width:36, height:36, borderRadius:12, background:'rgba(255,255,255,0.88)',
              backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>☰</div>
          </Link>
          <Link to="/onboarding">
            <div style={{ width:36, height:36, borderRadius:12, background:'rgba(255,255,255,0.88)',
              backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>✨</div>
          </Link>
        </div>

        <div style={{ textAlign:'center' }}>
          <p style={{ fontSize:11, color:'rgba(255,255,255,0.9)', margin:0, fontWeight:600 }}>{greeting},</p>
          <h1 style={{ fontSize:20, fontWeight:900, color:'white', margin:0,
            letterSpacing:'-.02em', textShadow:'0 2px 8px rgba(0,0,0,0.3)' }}>{name} 👋</h1>
        </div>

        <div style={{ position:'relative' }}>
          <NotificationBell userId={userId} onOpen={() => setNotifOpen(o => !o)} hasUnseen={true} />
          <AnimatePresence>
            {notifOpen && (
              <NotificationPanel userId={userId} onClose={() => setNotifOpen(false)} />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Estrellas decorativas — solo de noche */}
      {isNight && (
        <div style={{ position:'absolute', inset:0, zIndex:2, pointerEvents:'none' }}>
          {[
            { top:'12%', left:'15%', size:3, delay:0 },
            { top:'18%', left:'75%', size:2, delay:0.6 },
            { top:'8%',  left:'45%', size:2, delay:1.2 },
            { top:'25%', left:'85%', size:3, delay:0.3 },
          ].map((s, i) => (
            <motion.div key={i}
              animate={{ opacity:[0.2,0.9,0.2] }}
              transition={{ duration:2.5, repeat:Infinity, delay:s.delay }}
              style={{ position:'absolute', top:s.top, left:s.left, width:s.size, height:s.size,
                borderRadius:'50%', background:'white', boxShadow:'0 0 4px white' }} />
          ))}
        </div>
      )}

      {/* PANDI — de día navega directo, de noche hay que despertarla */}
      <div style={{ position:'absolute', bottom:'13%', left:'50%', transform:'translateX(-50%)',
        zIndex:5, width:isMobile ? '48%' : '22%', maxWidth:200 }}>
        <motion.div
          onClick={handlePandiTap}
          whileTap={{ scale:0.95 }}
          style={{ cursor:'pointer', touchAction:'manipulation' }}>
        <div style={{ position:'relative' }}>
          <motion.div
            animate={{ opacity: isNight ? [0.15,0.3,0.15] : [0.3,0.5,0.3] }}
            transition={{ duration:3, repeat:Infinity, ease:'easeInOut' }}
            style={{ position:'absolute', top:'50%', left:'50%',
              transform:'translate(-50%,-50%)', width:'80%', height:'80%',
              borderRadius:'50%',
              background:`radial-gradient(circle, ${isNight ? 'rgba(120,140,220,0.35)' : cfg.glow} 0%, transparent 65%)`,
              filter:'blur(24px)', zIndex:-1, pointerEvents:'none' }} />
          <motion.div
            animate={{ scaleX:[1,1.04,1], opacity:[0.2,0.3,0.2] }}
            transition={{ duration:3, repeat:Infinity, ease:'easeInOut' }}
            style={{ position:'absolute', bottom:-4, left:'50%',
              transform:'translateX(-50%)', width:'50%', height:8,
              borderRadius:'50%', background:'rgba(0,0,0,0.15)',
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
            <div style={{ position:'absolute', top:'6%', right:'2%',
              width:26, height:26, borderRadius:'50%', background:'white',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:14, boxShadow:'0 2px 8px rgba(0,0,0,0.15)' }}>
              {TUMMY_EMOJI[profile.tummy_state] || '😐'}
            </div>
          )}
        </div>
        </motion.div>
      </div>

      {/* Prompt: ¿entramos o la dejamos dormir? */}
      <AnimatePresence>
        {showPrompt && (
          <motion.div
            initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:10 }}
            style={{ position:'absolute', bottom:'4%', left:16, right:16, zIndex:15,
              display:'flex', gap:8, justifyContent:'center' }}>
            <button onClick={letSleep}
              style={{ padding:'10px 16px', borderRadius:14, border:'none', cursor:'pointer',
                background:'rgba(255,255,255,0.92)', backdropFilter:'blur(8px)',
                fontSize:12, fontWeight:700, color:'#6B7280' }}>
              Déjala dormir 😴
            </button>
            <button onClick={goToSanctuary}
              style={{ padding:'10px 16px', borderRadius:14, border:'none', cursor:'pointer',
                background:'linear-gradient(135deg,#2EC4B6,#FF8FA3)',
                fontSize:12, fontWeight:700, color:'white' }}>
              Entrar al santuario →
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}

function XPBar({ profile, cfg }) {
  return (
    <div style={{ padding:'10px 20px 0', marginTop:-4 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
            <span style={{ fontSize:10, color:'#9CA3AF', fontWeight:600 }}>Nivel</span>
            <span style={{ fontSize:13, fontWeight:900, color:cfg?.dot||'#2EC4B6' }}>{profile?.level||1}</span>
          </div>
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
          initial={{ width:0 }}
          animate={{ width:`${((profile?.xp||0)%500)/5}%` }}
          transition={{ duration:0.8 }}
        />
      </div>
    </div>
  )
}

function DayTask({ to, icon, label, sublabel, color, done }) {
  return (
    <Link to={to}>
      <motion.div whileTap={{ scale:0.97 }} style={{ display:'flex', alignItems:'center', gap:14,
        padding:'14px 16px', borderRadius:18, background:'rgba(255,255,255,0.95)',
        border:`1px solid ${done ? color+'30' : 'rgba(0,0,0,0.06)'}`,
        boxShadow: done ? `0 2px 12px ${color}15` : '0 2px 8px rgba(0,0,0,0.04)', marginBottom:8 }}>
        <div style={{ width:44, height:44, borderRadius:14, flexShrink:0,
          background: done ? `${color}15` : 'rgba(0,0,0,0.04)',
          display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>{icon}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ fontSize:14, fontWeight:700, color:'#1A2332', margin:0 }}>{label}</p>
          <p style={{ fontSize:12, color:'#6B7280', margin:'2px 0 0' }}>{sublabel}</p>
        </div>
        {done
          ? <div style={{ width:28, height:28, borderRadius:'50%', background:color,
              display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <span style={{ fontSize:12, color:'#fff' }}>✓</span></div>
          : <div style={{ width:28, height:28, borderRadius:'50%',
              border:'2px solid rgba(0,0,0,0.1)', flexShrink:0 }} />
        }
      </motion.div>
    </Link>
  )
}

function WaterWidget({ userId }) {
  const [glasses, setGlasses] = useState(0)
  const [goal,    setGoal]    = useState(8)
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (!userId) return
    supabase.from('hydration_logs').select('glasses,goal').eq('user_id', userId).eq('date', today).maybeSingle()
      .then(({ data }) => { if (data) { setGlasses(data.glasses||0); setGoal(data.goal||8) } })
  }, [userId])

  async function update(delta) {
    const next = Math.max(0, Math.min(glasses + delta, goal + 4))
    setGlasses(next)
    const { error } = await supabase
      .from('hydration_logs')
      .upsert({ user_id: userId, date: today, glasses: next, goal }, { onConflict: 'user_id,date' })
    if (error) console.error('Hydration error:', error.message)
    if (next === goal && glasses < goal) useStore.getState().addXP(20)
  }

  const pct = Math.min(glasses / goal, 1)
  return (
    <motion.div whileTap={{ scale:0.98 }} style={{ display:'flex', alignItems:'center', gap:12,
      padding:'14px 16px', borderRadius:18, background:'rgba(255,255,255,0.95)',
      border:'1px solid rgba(59,130,246,0.2)', marginBottom:8, boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
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
    </motion.div>
  )
}

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

// ── Tip de Pandi — componente del scroll ─────────────────────────────────────
// ── Lógica de contexto proactivo ─────────────────────────────────────────────
async function buildPandiContext(userId) {
  const today = new Date()
  const dateStr = today.toISOString().split('T')[0]
  const hour    = today.getHours()
  const safe    = async fn => { try { return await fn } catch { return { data: null } } }

  const [waterR, mealsR, moodR, sleepR, workoutR, goalsR] = await Promise.all([
    safe(supabase.from('hydration_logs').select('glasses,goal').eq('user_id',userId).eq('date',dateStr).maybeSingle()),
    safe(supabase.from('meal_logs').select('calories,protein_g').eq('user_id',userId).eq('date',dateStr)),
    safe(supabase.from('mood_logs').select('mood').eq('user_id',userId).eq('date',dateStr).maybeSingle()),
    safe(supabase.from('sleep_logs').select('hours').eq('user_id',userId).eq('date',dateStr).maybeSingle()),
    safe(supabase.from('workout_sessions').select('id').eq('user_id',userId).eq('status','completed').gte('created_at',dateStr+'T00:00:00').limit(1)),
    safe(supabase.from('nutrition_goals').select('calories,protein_g').eq('user_id',userId).maybeSingle()),
  ])

  const water   = waterR.data
  const meals   = mealsR.data || []
  const mood    = moodR.data?.mood    || null
  const sleep   = sleepR.data?.hours  || null
  const workout = (workoutR.data||[]).length > 0
  const goals   = goalsR.data || { calories:2000, protein_g:150 }

  const totalCal     = meals.reduce((s,m) => s+(m.calories||0), 0)
  const totalProtein = meals.reduce((s,m) => s+(m.protein_g||0), 0)
  const glasses      = water?.glasses || 0
  const waterGoal    = water?.goal    || 8

  // Detectar qué situación aplica — en orden de prioridad
  let situation = null

  if (hour >= 21 && !sleep) {
    situation = 'no_sleep_logged_night'
  } else if (hour >= 13 && meals.length === 0) {
    situation = 'no_food_logged_afternoon'
  } else if (hour >= 10 && glasses < 3 && hour < 22) {
    situation = 'low_water'
  } else if (mood !== null && mood <= 2) {
    situation = 'low_mood'
  } else if (mood !== null && mood >= 4 && workout && totalCal > goals.calories * 0.7) {
    situation = 'great_day'
  } else if (hour >= 19 && totalCal < goals.calories * 0.5) {
    situation = 'low_calories_evening'
  } else if (totalProtein > 0 && totalProtein < goals.protein_g * 0.5 && hour >= 18) {
    situation = 'low_protein'
  } else if (hour >= 22 || hour < 7) {
    situation = 'deep_night_calm'
  }

  return {
    situation,
    hour,
    glasses, waterGoal,
    totalCal, totalProtein,
    calorieGoal: goals.calories,
    proteinGoal: goals.protein_g,
    mood, sleep, workout,
    mealsCount: meals.length,
  }
}

// Mensajes instantáneos sin API — para situaciones claras
function getInstantMessage(ctx) {
  const { situation, hour, glasses, waterGoal, totalCal, calorieGoal, mood, totalProtein, proteinGoal } = ctx
  switch (situation) {
    case 'no_sleep_logged_night':
      return { text: 'Ya es tarde 🌙 ¿Vas a dormir pronto? Registra tu sueño antes de cerrar el día — es el dato más importante para tu recuperación.', type:'reminder' }
    case 'no_food_logged_afternoon':
      return { text: `Son las ${hour}h y aún no has registrado ninguna comida. ¿Ya comiste algo? Anótalo para que pueda ayudarte mejor. 🍽️`, type:'reminder' }
    case 'low_water':
      return { text: `Solo ${glasses} de ${waterGoal} vasos de agua. Ahora mismo, un vaso. Sin excusas 💧`, type:'hydration' }
    case 'low_mood':
      return {
        text: `Hoy te sientes ${mood <= 1 ? 'muy bajo' : 'bajo'} 🤍 Estoy aquí. Hagamos una respiración corta juntos.`,
        type:'mood',
        action: { label: '🫁 Calmar con Pandi', situation: 'low_mood', score: mood ? mood/5 : 0.3 },
      }
    case 'great_day':
      return { text: `¡Qué día tan completo! 🎉 Comida, entreno y buen ánimo. Esto es exactamente lo que construye resultados a largo plazo.`, type:'celebrate' }
    case 'low_calories_evening':
      return { text: `Son las ${hour}h y llevas ${Math.round(totalCal)} de ${calorieGoal} kcal. Una cena con proteína te ayudará a recuperarte esta noche. 🍳`, type:'nutrition' }
    case 'low_protein':
      return { text: `Son las ${hour}h y llevas ${Math.round(totalProtein)}g de ${proteinGoal}g de proteína. Añade huevo, pollo, atún o yogur griego en tu próxima comida. 💪`, type:'nutrition' }
    case 'deep_night_calm':
      return { text: 'Has cerrado bien el día. Ahora toca descansar — el cuerpo se recupera mientras duermes. Hasta mañana 🌙', type:'mood' }
    default:
      return null
  }
}

const TIP_ICONS = {
  reminder:  '⏰',
  hydration: '💧',
  mood:      '🤍',
  celebrate: '🎉',
  nutrition: '💪',
  tip:       '💡',
}

function PandiTipCard({ theme, userId }) {
  const [tip,       setTip]       = useState('')
  const [tipType,   setTipType]   = useState('tip')
  const [action,    setAction]    = useState(null)
  const [visible,   setVisible]   = useState(false)
  const [open,      setOpen]      = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [showPulse, setShowPulse] = useState(false)

  useEffect(() => {
    if (!userId) return
    loadContextualTip()
  }, [userId])

  async function loadContextualTip() {
    // Cache por hora — cada hora puede cambiar el mensaje contextual
    const cacheKey = `pandi_ctx_tip_${new Date().toISOString().slice(0, 13)}`
    try {
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        const { text, type, action: cachedAction } = JSON.parse(cached)
        setTip(text); setTipType(type||'tip'); setAction(cachedAction || null)
        setTimeout(() => setVisible(true), 800)
        return
      }
    } catch {}

    setLoading(true)
    try {
      // 1. Leer contexto del usuario
      const ctx = await buildPandiContext(userId)

      // 2. Intentar mensaje instantáneo primero (sin API)
      const instant = getInstantMessage(ctx)
      if (instant) {
        setTip(instant.text); setTipType(instant.type); setAction(instant.action || null)
        try { localStorage.setItem(cacheKey, JSON.stringify(instant)) } catch {}
        setTimeout(() => setVisible(true), 800)
        setLoading(false)
        return
      }

      // 3. Si no hay situación especial — pedir tip genérico contextual a la API
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setLoading(false); return }

      const res  = await fetch(`${import.meta.env.VITE_API_URL}/api/tip/daily`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      const data = await res.json()
      if (data.tip) {
        const entry = { text: data.tip, type: 'tip' }
        setTip(data.tip); setTipType('tip'); setAction(null)
        try { localStorage.setItem(cacheKey, JSON.stringify(entry)) } catch {}
        setTimeout(() => setVisible(true), 800)
      }
    } catch {
      // Fallback estático
      const fallbacks = [
        { text:'Beber agua antes de comer reduce la ingesta calórica hasta un 13%. 💧', type:'hydration' },
        { text:'Una caminata de 10 min después de comer mejora la glucemia. 🚶', type:'tip' },
        { text:'Dormir menos de 7h aumenta el hambre hasta un 24%. 😴', type:'reminder' },
      ]
      const f = fallbacks[Math.floor(Math.random() * fallbacks.length)]
      setTip(f.text); setTipType(f.type); setAction(null)
      setTimeout(() => setVisible(true), 800)
    } finally {
      setLoading(false)
    }
  }

  if (!visible || !tip || dismissed) return null

  const icon  = TIP_ICONS[tipType] || '💡'
  const label = tipType === 'celebrate' ? '🎉 Pandi celebra'
               : tipType === 'mood'     ? '🤍 Pandi te acompaña'
               : tipType === 'reminder' ? '⏰ Recordatorio de Pandi'
               : tipType === 'hydration'? '💧 Pandi te recuerda'
               : tipType === 'nutrition'? '💪 Pandi sugiere'
               : '💡 Tip de Pandi'

  const accentColor = tipType === 'celebrate' ? '#F59E0B'
                    : tipType === 'mood'       ? '#FF8FA3'
                    : tipType === 'reminder'   ? '#8B5CF6'
                    : tipType === 'hydration'  ? '#3B82F6'
                    : theme.primary

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
        exit={{ opacity:0, y:-6 }}
        transition={{ type:'spring', damping:22, stiffness:300 }}
        style={{ marginBottom:12 }}>
        <div
          onClick={() => setOpen(o => !o)}
          style={{
            background:'rgba(255,255,255,0.95)', borderRadius:18, padding:'12px 14px',
            border:`1px solid ${open ? accentColor+'40' : 'rgba(0,0,0,0.06)'}`,
            boxShadow: open ? `0 4px 16px ${accentColor}15` : '0 2px 12px rgba(0,0,0,0.05)',
            cursor:'pointer', transition:'all 0.25s',
          }}>

          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
            marginBottom: open ? 8 : 0 }}>
            <p style={{ fontSize:11, fontWeight:800, color:accentColor,
              margin:0, textTransform:'uppercase', letterSpacing:'.05em' }}>
              {label}
            </p>
            <button
              onClick={e => { e.stopPropagation(); setDismissed(true) }}
              style={{ fontSize:11, color:'#9CA3AF', background:'none', border:'none',
                cursor:'pointer', padding:'0 0 0 8px', lineHeight:1 }}>✕</button>
          </div>

          <AnimatePresence mode="wait">
            {open ? (
              <motion.div key="open"
                initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }}
                exit={{ opacity:0, height:0 }} transition={{ duration:0.2 }}>
                <p style={{ fontSize:13, color:'#1A2332', lineHeight:1.55,
                  margin:'0 0 10px', fontWeight:500 }}>{tip}</p>
                <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                  {action && (
                    <button
                      onClick={e => { e.stopPropagation(); setShowPulse(true) }}
                      style={{ fontSize:12, color:'white', fontWeight:700,
                        background: accentColor, border:'none', borderRadius:12,
                        padding:'7px 14px', cursor:'pointer' }}>
                      {action.label}
                    </button>
                  )}
                  <button
                    onClick={e => { e.stopPropagation(); setDismissed(true) }}
                    style={{ fontSize:11, color:accentColor, fontWeight:700,
                      background:'none', border:'none', cursor:'pointer', padding:0 }}>
                    Entendido ✓
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.p key="closed"
                initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                style={{ fontSize:12, color:'#6B7280', lineHeight:1.4, margin:'6px 0 0',
                  overflow:'hidden', display:'-webkit-box',
                  WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
                {tip}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* El Pulso de Pandi — modo guiado desde el tip contextual */}
      <AnimatePresence>
        {showPulse && action && (
          <PandiPulse
            mode="guided"
            situation={action.situation}
            score={action.score}
            onClose={() => setShowPulse(false)}
            onComplete={() => { setShowPulse(false); setDismissed(true) }}
          />
        )}
      </AnimatePresence>
    </AnimatePresence>
  )
}


// ── Mini widget semanal para Home ────────────────────────────────────────────
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
    ]).then(([mealsR, moodR, workoutR, sleepR]) => {
      const calByDate  = {}; (mealsR.data||[]).forEach(m => { calByDate[m.date]=(calByDate[m.date]||0)+m.calories })
      const moodByDate = {}; (moodR.data||[]).forEach(m => { moodByDate[m.date]=m.mood })
      const woDates    = new Set((workoutR.data||[]).map(w=>w.created_at?.split('T')[0]))
      const sleepByDate= {}; (sleepR.data||[]).forEach(s => { sleepByDate[s.date]=s.hours })

      setWeekData(days.map(date => {
        const cal   = calByDate[date]  || 0
        const mood  = moodByDate[date] || null
        const wo    = woDates.has(date)
        const sleep = sleepByDate[date]|| null
        let score=0, count=0
        if (cal>0)  { score+=Math.min(cal/2000,1); count++ }
        if (mood)   { score+=mood/5; count++ }
        if (wo)     { score+=1; count++ }
        if (sleep)  { score+=Math.min(sleep/7,1); count++ }
        return { date, score: count>0 ? score/count : 0, registered: count>0, mood, workout:wo }
      }))
    })
  }, [userId])

  if (!weekData.length) return null

  const scoreColor = s => s>0.7 ? '#2EC4B6' : s>0.4 ? '#F59E0B' : s>0 ? '#EF4444' : 'rgba(0,0,0,0.08)'
  const MOOD_EMOJIS = {1:'😩',2:'😞',3:'😐',4:'😊',5:'🤩'}
  const activeDays  = weekData.filter(d=>d.registered).length

  return (
    <Link to="/calendar?tab=history" style={{ textDecoration:'none' }}>
      <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
        transition={{ delay:0.08 }}
        style={{ background:'rgba(255,255,255,0.95)', borderRadius:20, padding:'12px 14px',
          marginBottom:12, border:'1px solid rgba(0,0,0,0.06)', boxShadow:'0 2px 12px rgba(0,0,0,0.04)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
          <p style={{ fontSize:13, fontWeight:800, color:'#1A2332', margin:0 }}>Esta semana</p>
          <span style={{ fontSize:11, color:theme.primary, fontWeight:700 }}>
            {activeDays}/7 días activos →
          </span>
        </div>
        <div style={{ display:'flex', gap:6, alignItems:'flex-end', height:48 }}>
          {weekData.map((day, i) => {
            const date    = new Date(day.date+'T12:00:00')
            const dayName = ['L','M','X','J','V','S','D'][date.getDay()===0?6:date.getDay()-1]
            const isToday = day.date === new Date().toISOString().split('T')[0]
            const h       = day.registered ? Math.max(day.score*36, 6) : 6
            return (
              <div key={day.date} style={{ flex:1, display:'flex', flexDirection:'column',
                alignItems:'center', gap:3 }}>
                {day.mood
                  ? <span style={{ fontSize:9 }}>{MOOD_EMOJIS[day.mood]}</span>
                  : <span style={{ fontSize:9, opacity:0 }}>·</span>
                }
                <motion.div
                  initial={{ height:0 }} animate={{ height:h }}
                  transition={{ duration:0.4, delay:i*0.05 }}
                  style={{ width:'100%', borderRadius:5,
                    background: scoreColor(day.score),
                    border: isToday ? `2px solid ${theme.primary}` : '2px solid transparent',
                    boxShadow: isToday ? `0 0 6px ${theme.primary}50` : 'none' }} />
                <span style={{ fontSize:9, fontWeight:700,
                  color: isToday ? theme.primary : '#9CA3AF' }}>{dayName}</span>
              </div>
            )
          })}
        </div>
      </motion.div>
    </Link>
  )
}

export default function Home() {
  const { profile, user } = useStore()
  const { theme, loaded } = useTheme()
  const { recoveryLight: recoveryLightCtx } = usePandiState()
  const recoveryLight = recoveryLightCtx || 'GREEN'

  const [todayMeals,   setTodayMeals]   = useState([])
  const [todayWorkout, setTodayWorkout] = useState(null)
  const [goals,        setGoals]        = useState({ calories: 2000, protein_g: 150 })
  const [weightLogs,   setWeightLogs]   = useState([])
  const [todaySleep,   setTodaySleep]   = useState(null)
  const [todayMood,    setTodayMood]    = useState(null)
  const [waterGlasses, setWaterGlasses] = useState(0)
  const [showCheckin, setShowCheckin] = useState(() => {
    try {
      const done = localStorage.getItem('daily_checkin_done')
      return done !== new Date().toISOString().split('T')[0]
    } catch { return true }
  })
  const [showQuickBreath, setShowQuickBreath] = useState(false)
  const [newAchievement, setNewAchievement] = useState(null)

  // checkAchievements desactivado temporalmente
  // useEffect(() => {
  //   if (!user) return
  //   checkAchievements(user.id).then(unlocked => {
  //     if (unlocked.length > 0) setNewAchievement(unlocked[0])
  //   })
  // }, [user])



  useEffect(() => {
    if (!user) return
    useStore.getState().initCoach()
  }, [user])

  useEffect(() => {
    if (!user) return
    const today = new Date().toISOString().split('T')[0]
    const safe  = p => Promise.resolve(p).catch(() => ({ data:null }))
    Promise.all([
      safe(supabase.from('meal_logs').select('calories,protein_g').eq('user_id',user.id).eq('date',today)),
      safe(supabase.from('workout_sessions').select('calories_burned').eq('user_id',user.id).eq('status','completed').gte('created_at',today+'T00:00:00').limit(1)),
      safe(supabase.from('nutrition_goals').select('*').eq('user_id',user.id).maybeSingle()),
      safe(supabase.from('weight_logs').select('weight_kg,date').eq('user_id',user.id).order('date',{ascending:false}).limit(5)),
      safe(supabase.from('sleep_logs').select('hours,quality').eq('user_id',user.id).eq('date',today).maybeSingle()),
      safe(supabase.from('mood_logs').select('mood').eq('user_id',user.id).eq('date',today).maybeSingle()),
      safe(supabase.from('hydration_logs').select('glasses').eq('user_id',user.id).eq('date',today).maybeSingle()),
    ]).then(([mealsR,workoutR,goalsR,weightR,sleepR,moodR,waterR]) => {
      setTodayMeals(mealsR.data || [])
      setTodayWorkout(workoutR.data?.[0] || null)
      if (goalsR.data) setGoals(goalsR.data)
      setWeightLogs(weightR.data || [])
      setTodaySleep(sleepR.data || null)
      setTodayMood(moodR.data || null)
      setWaterGlasses(waterR.data?.glasses || 0)
    })
  }, [user])

  const cals    = todayMeals?.reduce((s,m) => s+(m.calories||0), 0) || 0
  const protein = todayMeals?.reduce((s,m) => s+(m.protein_g||0), 0) || 0
  const burned  = todayWorkout?.calories_burned || 0

  // FIX: useModuleAwareness comentado hasta que CoachAwarenessProvider esté en App.jsx
  // useModuleAwareness('home', { caloriesConsumed: Math.round(cals), ... })
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

  const hour           = new Date().getHours()
  const greeting = hour >= 20 || hour < 7 ? '¡Buenas noches'
                 : hour < 12 ? '¡Buenos días'
                 : '¡Buenas tardes'
  const name           = profile?.name?.split(' ')[0] || 'Compi'
  const MOODS          = {1:'😩',2:'😞',3:'😐',4:'😊',5:'🤩'}
  const MOOD_LABELS    = {1:'Muy mal',2:'Mal',3:'Regular',4:'Bien',5:'Genial'}
  const currentWeight  = weightLogs[0]?.weight_kg
  const doneTodayCount = [cals>0, !!todayWorkout, !!todaySleep, !!todayMood, waterGlasses>0].filter(Boolean).length
  const cfg            = STATE_CONFIG[recoveryLight] || STATE_CONFIG.GREEN

  const tasks = [
    { to:'/nutrition', icon:'🍎', label:'Nutrición',     sublabel: cals>0 ? `${Math.round(cals)} / ${goals.calories} kcal` : 'Sin registro hoy', color:'#F97316', done:cals>0 },
    { to:'/workout',   icon:'💪', label:'Entrenamiento', sublabel: todayWorkout ? `${burned} kcal quemadas` : 'Sin entreno hoy', color:'#6366F1', done:!!todayWorkout },
    { to:'/sleep',     icon:'😴', label:'Sueño',         sublabel: todaySleep ? `${todaySleep.hours}h · Calidad ${todaySleep.quality}/5` : 'Sin registro', color:'#818CF8', done:!!todaySleep },
    { to:'/mood', icon: todayMood ? MOODS[todayMood.mood] : '🧘', label:'Bienestar',
      sublabel: todayMood ? `Hoy te sientes ${MOOD_LABELS[todayMood.mood].toLowerCase()}` : 'Check-in pendiente',
      color:'#2EC4B6', done:!!todayMood },
    { to:'/health', icon:'⚖️', label:'Seguimiento', sublabel: currentWeight ? `${currentWeight} kg actual` : 'Peso y medidas', color:'#EC4899', done:!!currentWeight },
  ]

  return (
    <div style={{ minHeight:'100vh', background:'#f8fafa', paddingBottom:100 }}>

      <Sanctuary recoveryLight={recoveryLight} profile={profile} theme={theme} greeting={greeting} name={name} userId={user?.id} />

      <div style={{ marginTop: '20px' }}>
        <XPBar profile={profile} cfg={cfg} />
      </div>

      <div style={{ padding:'0 16px', marginTop:8 }}>

        {/* BADGE SEMÁFORO */}
        <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.05 }}
          style={{ display:'flex', justifyContent:'center', marginBottom:12 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'8px 20px',
            borderRadius:20, background:'white',
            border:`1.5px solid ${recoveryLight==='GREEN' ? '#2EC4B6' : recoveryLight==='YELLOW' ? '#F59E0B' : '#FF8FA3'}30`,
            boxShadow:'0 2px 12px rgba(0,0,0,0.06)', whiteSpace:'nowrap' }}>
            <motion.div animate={{ scale:[1,1.4,1] }} transition={{ duration:1.5, repeat:Infinity }}
              style={{ width:8, height:8, borderRadius:'50%',
                background: recoveryLight==='GREEN' ? '#2EC4B6' : recoveryLight==='YELLOW' ? '#F59E0B' : '#FF8FA3',
                boxShadow:`0 0 8px ${recoveryLight==='GREEN' ? '#2EC4B6' : recoveryLight==='YELLOW' ? '#F59E0B' : '#FF8FA3'}`,
                flexShrink:0 }} />
            <span style={{ fontSize:12, fontWeight:700, color:'#1A2332' }}>
              {recoveryLight==='GREEN' ? 'Hoy tienes energía para todo.'
               : recoveryLight==='YELLOW' ? 'Ritmo moderado. Ajustando tu plan.'
               : 'Hoy el descanso ES el entrenamiento.'}
            </span>
          </div>
        </motion.div>

        {/* MINI WIDGET SEMANAL */}
        <MiniWeekWidget userId={user?.id} theme={theme} />

        {/* RecoveryBadge desactivado temporalmente */}

        {/* RESPIRACIÓN RÁPIDA */}
        <div style={{ marginBottom:12 }}>
          <QuickBreathButton onActivate={() => setShowQuickBreath(true)} />
        </div>

        {/* WeeklyChallengesWidget desactivado temporalmente */}

        {/* TIP DE PANDI */}
        <PandiTipCard theme={theme} userId={user?.id} />

        {/* PLAN DE HOY */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
          style={{ background:'rgba(255,255,255,0.95)', borderRadius:20, padding:'14px 16px',
            marginBottom:16, border:'1px solid rgba(0,0,0,0.06)', boxShadow:'0 4px 20px rgba(0,0,0,0.06)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
            <div>
              <p style={{ fontSize:15, fontWeight:800, color:'#1A2332', margin:0 }}>Tu plan de hoy</p>
              <p style={{ fontSize:12, color:'#6B7280', margin:'2px 0 0' }}>{doneTodayCount} de {tasks.length} tareas completadas</p>
            </div>
            <div style={{ width:52, height:52, position:'relative' }}>
              <svg width={52} height={52} style={{ transform:'rotate(-90deg)' }}>
                <circle cx={26} cy={26} r={20} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth={5} />
                <motion.circle cx={26} cy={26} r={20} fill="none" stroke={theme.primary} strokeWidth={5}
                  strokeDasharray={2*Math.PI*20} initial={{ strokeDashoffset:2*Math.PI*20 }}
                  animate={{ strokeDashoffset:2*Math.PI*20*(1-doneTodayCount/tasks.length) }}
                  transition={{ duration:0.8 }} strokeLinecap="round" />
              </svg>
              <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span style={{ fontSize:11, fontWeight:800, color:theme.primary }}>{Math.round(doneTodayCount/tasks.length*100)}%</span>
              </div>
            </div>
          </div>
          <div style={{ display:'flex', justifyContent:'space-around', padding:'8px 0', borderTop:'1px solid rgba(0,0,0,0.05)' }}>
            <MiniRing value={cals}         max={goals.calories}   color="#F97316"       label="Calorías" />
            <MiniRing value={protein}      max={goals.protein_g}  color={theme.primary} label="Proteína" />
            <MiniRing value={burned}       max={400}              color="#22C55E"        label="Quemadas" />
            <MiniRing value={waterGlasses} max={8}                color="#3B82F6"        label="Agua" />
          </div>
        </motion.div>

        {/* TAREAS */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <p style={{ fontSize:15, fontWeight:800, color:'#1A2332', margin:0 }}>Tareas del día</p>
            <Link to="/report" style={{ fontSize:12, color:theme.primary, fontWeight:600, textDecoration:'none' }}>Ver todas →</Link>
          </div>
          {tasks.map((t,i) => (
            <motion.div key={t.to} initial={{ opacity:0, x:-16 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.25+i*0.06 }}>
              <DayTask {...t} />
            </motion.div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.5 }}>
          <WaterWidget userId={user?.id} />
        </motion.div>

        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.6 }}>
          <PandiInsights />
        </motion.div>

      </div>

      {showCheckin && <DailyCheckin onComplete={() => {
        try { localStorage.setItem('daily_checkin_done', new Date().toISOString().split('T')[0]) } catch {}
        setShowCheckin(false)
      }} />}

      <AnimatePresence>
        {showQuickBreath && (
          <QuickBreathModal onClose={() => setShowQuickBreath(false)} />
        )}
      </AnimatePresence>

      <AchievementUnlockedModal achievement={newAchievement} onClose={() => setNewAchievement(null)} />
    </div>
  )
}
