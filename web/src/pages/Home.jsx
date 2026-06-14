import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/useStore'
import { useTheme } from '../contexts/ThemeProvider'
import { usePandiState } from '../contexts/PandiStateContext'
import { supabase } from '../lib/supabase'
import { useTour } from '../hooks/useTour'
import { useSectionContext } from '../hooks/useSectionContext'
import TourHelpButton from '../components/tour/TourHelpButton'
import PandiInsights from '../components/PandiInsights'
import { Plus, Minus as MinusIcon, Droplets } from 'lucide-react'
import DailyCheckin from '../components/DailyCheckin'
import CoachSuggestion from '../components/CoachSuggestion'

const STATE_CONFIG = {
  GREEN: {
    bg:            '/panda/sanctuary_green.png',
    glow:          'rgba(46,196,182,0.4)',
    dot:           '#2EC4B6',
    msg:           'Hoy tienes energía para todo.',
    frames:        ['/panda/panda_base.png','/panda/panda_happy.png','/panda/panda_happy.png','/panda/panda_base.png','/panda/panda_happy.png','/panda/panda_base.png'],
    frameDuration: 4500,
  },
  YELLOW: {
    bg:            '/panda/sanctuary_yellow.png',
    glow:          'rgba(245,158,11,0.4)',
    dot:           '#F59E0B',
    msg:           'Ritmo moderado. Ajustando tu plan.',
    frames:        ['/panda/panda_base.png','/panda/thinking_1.png','/panda/panda_base.png','/panda/thinking_1.png'],
    frameDuration: 3000,
  },
  RED: {
    bg:            '/panda/sanctuary_red.png',
    glow:          'rgba(255,143,163,0.4)',
    dot:           '#FF8FA3',
    msg:           'Hoy el descanso ES el entrenamiento.',
    frames:        ['/panda/panda_base.png','/panda/thinking_1.png','/panda/panda_base.png','/panda/thinking_1.png'],
    frameDuration: 3500,
  },
}

const ALL_FRAMES = [
  '/panda/panda_blink.png',
  '/panda/panda_tip.png',
  ...STATE_CONFIG.GREEN.frames,
  ...STATE_CONFIG.YELLOW.frames,
  ...STATE_CONFIG.RED.frames,
  STATE_CONFIG.GREEN.bg,
  STATE_CONFIG.YELLOW.bg,
  STATE_CONFIG.RED.bg,
]

// ── Detecta si estamos en móvil (< 768px) y se actualiza al redimensionar ──
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return isMobile
}

function Sanctuary({ recoveryLight, profile, theme, greeting, name, onXpBarRef }) {
  const cfg      = STATE_CONFIG[recoveryLight] || STATE_CONFIG.GREEN
  const isMobile = useIsMobile()
  const [frameIdx,   setFrameIdx]   = useState(0)
  const [imgErr,     setImgErr]     = useState(false)
  const [blinking,   setBlinking]   = useState(false)
  const [tipOpen,    setTipOpen]    = useState(false)
  const [tipVisible, setTipVisible] = useState(false)
  const [tip,        setTip]        = useState('')

  useEffect(() => {
    ALL_FRAMES.forEach(src => { const i = new Image(); i.src = src })
  }, [])

  useEffect(() => {
    setFrameIdx(0)
    setImgErr(false)
  }, [recoveryLight])

  useEffect(() => {
    if (cfg.frames.length <= 1) return
    const t = setInterval(() => setFrameIdx(i => (i + 1) % cfg.frames.length), cfg.frameDuration)
    return () => clearInterval(t)
  }, [recoveryLight, cfg.frames.length, cfg.frameDuration])

  useEffect(() => {
    const schedule = () => setTimeout(() => {
      setBlinking(true)
      setTimeout(() => { setBlinking(false); schedule() }, 120)
    }, 3000 + Math.random() * 4000)
    const t = schedule()
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const cacheKey = `pandi_tip_ai_${new Date().toISOString().slice(0, 13)}`
    const cached   = localStorage.getItem(cacheKey)
    if (cached) {
      setTip(cached)
      setTimeout(() => setTipVisible(true), 2000)
      return
    }
    import('../lib/supabase').then(({ supabase }) => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) return
        fetch(`${import.meta.env.VITE_API_URL}/api/tip/daily`, {
          headers: { Authorization: `Bearer ${session.access_token}` }
        })
        .then(r => r.json())
        .then(data => {
          if (data.tip) {
            setTip(data.tip)
            localStorage.setItem(cacheKey, data.tip)
            setTimeout(() => setTipVisible(true), 2000)
          }
        })
        .catch(() => {
          const fallbacks = [
            'Beber agua antes de comer reduce la ingesta calórica hasta un 13%. 💧',
            'Una caminata de 10 min después de comer mejora la glucemia. 🚶',
            'Dormir menos de 7h aumenta el hambre hasta un 24%. 😴',
          ]
          setTip(fallbacks[Math.floor(Math.random() * fallbacks.length)])
          setTimeout(() => setTipVisible(true), 2000)
        })
      })
    })
  }, [])

  function handleTipClick() { setTipOpen(o => !o) }
  function dismissTip() { setTipVisible(false); setTipOpen(false) }

  const currentFrame = blinking
    ? '/panda/panda_blink.png'
    : tipOpen
    ? '/panda/panda_tip.png'
    : cfg.frames[frameIdx]

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: isMobile ? '80vw' : '42vw',
      maxHeight: isMobile ? 480 : 420,
      overflow: 'hidden',
      // background-image CSS — no se deforma nunca
      backgroundImage: `url(${cfg.bg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center 30%',
      backgroundRepeat: 'no-repeat',
      // Fallback si no carga la imagen
      backgroundColor: recoveryLight==='GREEN' ? '#e8f5ee'
                      : recoveryLight==='YELLOW' ? '#fef3c7'
                      : '#ffe4ec',
    }}>

      {/* Overlay top — oscurece ligeramente para que el header se lea */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:'35%', zIndex:1,
        background:'linear-gradient(to bottom, rgba(0,0,0,0.22) 0%, transparent 100%)',
        pointerEvents:'none' }} />

      {/* Overlay bottom — funde con el scroll */}
      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'32%', zIndex:1,
        background:'linear-gradient(to top, #f8fafa 0%, transparent 100%)',
        pointerEvents:'none' }} />

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

        <Link to="/calendar">
          <div style={{ width:36, height:36, borderRadius:12, background:'rgba(255,255,255,0.88)',
            backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:18, position:'relative' }}>
            🔔
            <div style={{ position:'absolute', top:-3, right:-3, width:10, height:10,
              borderRadius:'50%', background:'#EF4444', border:'2px solid white' }} />
          </div>
        </Link>
      </div>

      {/* TIP DE PANDI — debajo del header */}
      <AnimatePresence>
        {tipVisible && tip && (
          <motion.div
            initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}
            exit={{ opacity:0, y:-10 }}
            transition={{ type:'spring', damping:20, stiffness:300 }}
            onClick={handleTipClick}
            style={{ position:'absolute', top:72, left:16, right:16, cursor:'pointer', zIndex:8 }}>
            <motion.div
              animate={{ background: tipOpen ? 'rgba(255,255,255,0.97)' : 'rgba(255,255,255,0.78)',
                boxShadow: tipOpen ? '0 8px 24px rgba(0,0,0,0.15)' : '0 2px 8px rgba(0,0,0,0.08)' }}
              transition={{ duration:0.3 }}
              style={{ borderRadius:16, padding:'10px 12px', backdropFilter:'blur(16px)',
                border:`1px solid ${tipOpen ? 'rgba(46,196,182,0.3)' : 'rgba(255,255,255,0.5)'}` }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                <p style={{ fontSize:10, fontWeight:800, color:theme.primary||'#2EC4B6',
                  margin:0, textTransform:'uppercase', letterSpacing:'.05em' }}>💡 Tip de Pandi</p>
                <button onClick={e => { e.stopPropagation(); dismissTip() }}
                  style={{ fontSize:10, color:'#9CA3AF', background:'none', border:'none', cursor:'pointer', padding:0 }}>✕</button>
              </div>
              <AnimatePresence mode="sync">
                {tipOpen ? (
                  <motion.div key="open" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.2 }}>
                    <p style={{ fontSize:12, color:'#1A2332', lineHeight:1.5, margin:'0 0 8px', fontWeight:500 }}>{tip}</p>
                    <button onClick={e => { e.stopPropagation(); dismissTip() }}
                      style={{ fontSize:10, color:theme.primary||'#2EC4B6', fontWeight:700,
                        background:'none', border:'none', cursor:'pointer', padding:0 }}>
                      Entendido ✓
                    </button>
                  </motion.div>
                ) : (
                  <motion.div key="closed" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.2 }}>
                    <p style={{ fontSize:11, color:'rgba(26,35,50,0.75)', lineHeight:1.4, margin:0,
                      overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{tip}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PANDI — capa independiente, animada, centrada sobre la plataforma */}
      <div style={{
        position: 'absolute',
        bottom: '14%',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 5,
        width: isMobile ? '48%' : '22%',
        maxWidth: 200,
      }}>
        <div style={{ position:'relative' }}>
          {/* Glow bajo Pandi */}
          <motion.div
            animate={{ opacity:[0.3,0.5,0.3] }}
            transition={{ duration:3, repeat:Infinity, ease:'easeInOut' }}
            style={{ position:'absolute', top:'50%', left:'50%',
              transform:'translate(-50%,-50%)', width:'80%', height:'80%',
              borderRadius:'50%', background:`radial-gradient(circle, ${cfg.glow} 0%, transparent 65%)`,
              filter:'blur(24px)', zIndex:-1, pointerEvents:'none' }} />
          {/* Sombra suelo */}
          <motion.div
            animate={{ scaleX:[1,1.04,1], opacity:[0.2,0.3,0.2] }}
            transition={{ duration:3, repeat:Infinity, ease:'easeInOut' }}
            style={{ position:'absolute', bottom:-4, left:'50%',
              transform:'translateX(-50%)', width:'50%', height:8,
              borderRadius:'50%', background:'rgba(0,0,0,0.15)',
              filter:'blur(4px)', zIndex:-1 }} />
          {/* Imagen Pandi */}
          <div style={{ filter:`drop-shadow(0 12px 20px ${cfg.glow})` }}>
            {imgErr
              ? <span style={{ fontSize:'15vw', display:'block', textAlign:'center' }}>🐾</span>
              : <img src={currentFrame} alt="Pandi"
                  style={{ width:'100%', height:'auto', objectFit:'contain', display:'block' }}
                  onError={() => setImgErr(true)} />
            }
          </div>
        </div>
      </div>

    </div>
  )
}

// ── XP BAR como componente independiente en el scroll ────────────────────────
function XPBar({ profile, cfg }) {
  return (
    <div style={{ padding:'10px 20px 0', marginTop:-4 }}>
      {/* Nivel + Racha + XP en una fila */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
            <span style={{ fontSize:10, color:'#9CA3AF', fontWeight:600 }}>Nivel</span>
            <span style={{ fontSize:13, fontWeight:900, color: cfg?.dot || '#2EC4B6' }}>{profile?.level || 1}</span>
          </div>
          <div style={{ width:1, height:12, background:'rgba(0,0,0,0.1)' }} />
          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
            <span style={{ fontSize:13 }}>🔥</span>
            <span style={{ fontSize:13, fontWeight:900, color:'#F97316' }}>{profile?.streak || 0}</span>
            <span style={{ fontSize:10, color:'#9CA3AF', fontWeight:600 }}>racha</span>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontSize:10, fontWeight:700, color: cfg?.dot || '#2EC4B6' }}>{profile?.xp || 0} XP</span>
          <span style={{ fontSize:10, color:'#9CA3AF' }}>/ {(profile?.level || 1) * 500}</span>
        </div>
      </div>
      {/* Barra */}
      <div style={{ height:5, borderRadius:3, background:'rgba(0,0,0,0.08)', overflow:'hidden' }}>
        <motion.div
          style={{ height:'100%', borderRadius:3, background: cfg?.dot || '#2EC4B6', boxShadow:`0 0 8px ${cfg?.dot || '#2EC4B6'}60` }}
          initial={{ width:0 }}
          animate={{ width:`${((profile?.xp || 0) % 500) / 5}%` }}
          transition={{ duration:0.8 }}
        />
      </div>
    </div>
  )
}

function DayTask({ to, icon, label, sublabel, color, done }) {
  return (
    <Link to={to}>
      <motion.div whileTap={{ scale:0.97 }} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 16px', borderRadius:18, background:'rgba(255,255,255,0.95)', border:`1px solid ${done ? color+'30' : 'rgba(0,0,0,0.06)'}`, boxShadow: done ? `0 2px 12px ${color}15` : '0 2px 8px rgba(0,0,0,0.04)', marginBottom:8 }}>
        <div style={{ width:44, height:44, borderRadius:14, flexShrink:0, background: done ? `${color}15` : 'rgba(0,0,0,0.04)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>{icon}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ fontSize:14, fontWeight:700, color:'#1A2332', margin:0 }}>{label}</p>
          <p style={{ fontSize:12, color:'#6B7280', margin:'2px 0 0' }}>{sublabel}</p>
        </div>
        {done
          ? <div style={{ width:28, height:28, borderRadius:'50%', background:color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><span style={{ fontSize:12, color:'#fff' }}>✓</span></div>
          : <div style={{ width:28, height:28, borderRadius:'50%', border:'2px solid rgba(0,0,0,0.1)', flexShrink:0 }} />
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
      .then(({ data }) => { if (data) { setGlasses(data.glasses || 0); setGoal(data.goal || 8) } })
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
    <motion.div whileTap={{ scale:0.98 }} style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', borderRadius:18, background:'rgba(255,255,255,0.95)', border:'1px solid rgba(59,130,246,0.2)', marginBottom:8, boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
      <div style={{ width:44, height:44, borderRadius:14, background:'#EFF6FF', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <Droplets size={20} style={{ color:'#3B82F6' }} />
      </div>
      <div style={{ flex:1 }}>
        <p style={{ fontSize:14, fontWeight:700, color:'#1A2332', margin:0 }}>Hidratación</p>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:4 }}>
          <div style={{ flex:1, height:6, borderRadius:3, background:'rgba(0,0,0,0.08)', overflow:'hidden' }}>
            <motion.div animate={{ width:`${pct*100}%` }} transition={{ duration:0.4 }} style={{ height:'100%', borderRadius:3, background:'linear-gradient(90deg,#60A5FA,#3B82F6)' }} />
          </div>
          <span style={{ fontSize:11, color:'#6B7280', whiteSpace:'nowrap' }}>{glasses*250}ml / {goal*250}ml</span>
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
        <button onClick={() => update(-1)} disabled={glasses===0} style={{ width:28, height:28, borderRadius:8, background:'rgba(0,0,0,0.06)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <MinusIcon size={12} style={{ color:'#6B7280' }} />
        </button>
        <span style={{ fontSize:16, fontWeight:800, color:'#3B82F6', minWidth:16, textAlign:'center' }}>{glasses}</span>
        <motion.button whileTap={{ scale:0.9 }} onClick={() => update(1)} style={{ width:28, height:28, borderRadius:8, background:'#3B82F6', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
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

  useTour('home')

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

  useSectionContext('home', {
    caloriesConsumed:Math.round(cals), caloriesTarget:goals.calories,
    proteinConsumed:Math.round(protein), proteinTarget:goals.protein_g,
    caloriesBurned:burned, waterGlasses, workedOutToday:!!todayWorkout,
    sleepLastNight:todaySleep?.hours||null, moodToday:todayMood?.mood||null,
    streak:profile?.streak||0, level:profile?.level||1,
  })

  if (!loaded) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#f0fffe' }}>
      <motion.div animate={{ scale:[1,1.1,1] }} transition={{ duration:1.5, repeat:Infinity }}>
        <span style={{ fontSize:48 }}>🐾</span>
      </motion.div>
    </div>
  )

  const hour           = new Date().getHours()
  const greeting       = hour<12 ? '¡Buenos días' : hour<20 ? '¡Buenas tardes' : '¡Buenas noches'
  const name           = profile?.name?.split(' ')[0] || 'Compi'
  const MOODS          = {1:'😩',2:'😞',3:'😐',4:'😊',5:'🤩'}
  const MOOD_LABELS    = {1:'Muy mal',2:'Mal',3:'Regular',4:'Bien',5:'Genial'}
  const currentWeight  = weightLogs[0]?.weight_kg
  const doneTodayCount = [cals>0, !!todayWorkout, !!todaySleep, !!todayMood, waterGlasses>0].filter(Boolean).length
  const cfg            = STATE_CONFIG[recoveryLight] || STATE_CONFIG.GREEN

  const tasks = [
    { to:'/nutrition', icon:'🍎', label:'Nutrición',     sublabel: cals>0 ? `${Math.round(cals)} / ${goals.calories} kcal` : 'Sin registro hoy',                                          color:'#F97316', done:cals>0 },
    { to:'/workout',   icon:'💪', label:'Entrenamiento', sublabel: todayWorkout ? `${burned} kcal quemadas` : 'Sin entreno hoy',                                                            color:'#6366F1', done:!!todayWorkout },
    { to:'/sleep',     icon:'😴', label:'Sueño',         sublabel: todaySleep ? `${todaySleep.hours}h · Calidad ${todaySleep.quality}/5` : 'Sin registro',                                 color:'#818CF8', done:!!todaySleep },
    { to:'/mood',      icon: todayMood ? MOODS[todayMood.mood] : '🧘', label:'Bienestar', sublabel: todayMood ? `Hoy te sientes ${MOOD_LABELS[todayMood.mood].toLowerCase()}` : 'Check-in pendiente', color:'#2EC4B6', done:!!todayMood },
    { to:'/health',    icon:'⚖️', label:'Seguimiento',  sublabel: currentWeight ? `${currentWeight} kg actual` : 'Peso y medidas',                                                          color:'#EC4899', done:!!currentWeight },
  ]

  return (
    <div style={{ minHeight:'100vh', background:'#f8fafa', paddingBottom:100 }}>

      {/* SANCTUARY — sin XP bar dentro */}
      <Sanctuary recoveryLight={recoveryLight} profile={profile} theme={theme} greeting={greeting} name={name} />

      {/* XP BAR — fuera del sanctuary, en el scroll, pegada al borde inferior del sanctuary */}
      <XPBar profile={profile} cfg={cfg} />

      <div style={{ padding:'0 16px', marginTop:8 }}>

        {/* BADGE SEMÁFORO */}
        <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.05 }}
          style={{ display:'flex', justifyContent:'center', marginBottom:12 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'8px 20px', borderRadius:20, background:'white', border:`1.5px solid ${recoveryLight==='GREEN' ? '#2EC4B6' : recoveryLight==='YELLOW' ? '#F59E0B' : '#FF8FA3'}30`, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', whiteSpace:'nowrap' }}>
            <motion.div animate={{ scale:[1,1.4,1] }} transition={{ duration:1.5, repeat:Infinity }}
              style={{ width:8, height:8, borderRadius:'50%', background: recoveryLight==='GREEN' ? '#2EC4B6' : recoveryLight==='YELLOW' ? '#F59E0B' : '#FF8FA3', boxShadow:`0 0 8px ${recoveryLight==='GREEN' ? '#2EC4B6' : recoveryLight==='YELLOW' ? '#F59E0B' : '#FF8FA3'}`, flexShrink:0 }} />
            <span style={{ fontSize:12, fontWeight:700, color:'#1A2332' }}>
              {recoveryLight==='GREEN' ? 'Hoy tienes energía para todo.' : recoveryLight==='YELLOW' ? 'Ritmo moderado. Ajustando tu plan.' : 'Hoy el descanso ES el entrenamiento.'}
            </span>
          </div>
        </motion.div>

        {/* SUGERENCIA DEL COACH */}
        <CoachSuggestion />

        {/* PLAN DE HOY */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
          style={{ background:'rgba(255,255,255,0.95)', borderRadius:20, padding:'14px 16px', marginBottom:16, border:'1px solid rgba(0,0,0,0.06)', boxShadow:'0 4px 20px rgba(0,0,0,0.06)' }}>
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

        <TourHelpButton tourKey="home" />
      </div>

      {/* DAILY CHECKIN — bottom sheet, fuera del scroll */}
      <DailyCheckin />
    </div>
  )
}
