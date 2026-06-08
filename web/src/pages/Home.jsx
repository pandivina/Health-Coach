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

const STATE_CONFIG = {
  GREEN: {
    bg: '/panda/sanctuary_green.png',
    glow: 'rgba(46,196,182,0.4)',
    dot: '#2EC4B6',
    msg: 'Hoy tienes energía para todo.',
    frames: ['/panda/panda_base.png','/panda/panda_happy.png','/panda/panda_happy.png','/panda/panda_base.png','/panda/panda_happy.png','/panda/panda_base.png'],
    frameDuration: 4500,
  },
  YELLOW: {
    bg: '/panda/sanctuary_yellow.png',
    glow: 'rgba(245,158,11,0.4)',
    dot: '#F59E0B',
    msg: 'Ritmo moderado. Ajustando tu plan.',
    frames: ['/panda/panda_base.png','/panda/thinking_1.png','/panda/panda_base.png','/panda/thinking_1.png'],
    frameDuration: 3000,
  },
  RED: {
    bg: '/panda/sanctuary_red.png',
    glow: 'rgba(255,143,163,0.4)',
    dot: '#FF8FA3',
    msg: 'Hoy el descanso ES el entrenamiento.',
    frames: ['/panda/panda_base.png','/panda/thinking_1.png','/panda/panda_base.png','/panda/thinking_1.png'],
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

function Sanctuary({ recoveryLight, profile, theme, greeting, name }) {
  const cfg = STATE_CONFIG[recoveryLight] || STATE_CONFIG.GREEN;
  const [frameIdx, setFrameIdx] = useState(0)
  const [imgErr, setImgErr] = useState(false)
  const [bgErr, setBgErr] = useState(false)
  const [blinking, setBlinking] = useState(false)
  const [tipOpen, setTipOpen] = useState(false)
  const [tipVisible, setTipVisible] = useState(false)
  const [tip, setTip] = useState('')

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
    let cached = null
    try { cached = localStorage.getItem(cacheKey) } catch (e) {}
    
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
            try { localStorage.setItem(cacheKey, data.tip) } catch (e) {}
            setTimeout(() => setTipVisible(true), 2000)
          }
        })
        .catch(() => {
          const fallbacks = ['Beber agua ayuda a tu metabolismo. 💧', 'Caminar 10 min mejora la glucemia. 🚶', 'El descanso es parte del entreno. 😴']
          setTip(fallbacks[Math.floor(Math.random() * fallbacks.length)])
          setTimeout(() => setTipVisible(true), 2000)
        })
      })
    })
  }, [])

  const currentFrame = blinking ? '/panda/panda_blink.png' : tipOpen ? '/panda/panda_tip.png' : cfg.frames[frameIdx]

  return (
    <div style={{ position:'relative', height:'56vw', minHeight:340, maxHeight:480, overflow:'hidden' }}>
      <AnimatePresence mode="wait">
        <motion.div key={recoveryLight} initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:1.2 }} style={{ position:'absolute', inset:0, zIndex:0 }}>
          {bgErr ? <div style={{ width:'100%', height:'100%', background: recoveryLight==='GREEN' ? '#c8f5e8' : recoveryLight==='YELLOW' ? '#fef3c7' : '#ffe4ec' }} />
            : <img src={cfg.bg} alt="Santuario" style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center 60%' }} onError={() => setBgErr(true)} />}
        </motion.div>
      </AnimatePresence>

      <div style={{ position:'absolute', top:0, left:0, right:0, height:110, zIndex:1, background:'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 100%)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:100, zIndex:1, background:'linear-gradient(to top, #f8fafa 0%, transparent 100%)', pointerEvents:'none' }} />

      <div style={{ position:'absolute', top:0, left:0, right:0, zIndex:10, padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <p style={{ fontSize:11, color:'rgba(255,255,255,0.8)', margin:0, fontWeight:600 }}>{greeting},</p>
          <h1 style={{ fontSize:22, fontWeight:900, color:'white', margin:0, letterSpacing:'-.02em', textShadow:'0 2px 8px rgba(0,0,0,0.25)' }}>{name} 👋</h1>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ padding:'6px 12px', borderRadius:12, background:'rgba(255,255,255,0.88)', backdropFilter:'blur(8px)' }}>
            <p style={{ fontSize:9, color:'#6B7280', margin:0, textAlign:'center' }}>Nivel</p>
            <p style={{ fontSize:14, fontWeight:900, color:theme.primary, margin:0, textAlign:'center' }}>{profile?.level || 1}</p>
          </div>
          <Link to="/profile"><div style={{ width:36, height:36, borderRadius:12, background:'rgba(255,255,255,0.88)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>☰</div></Link>
        </div>
      </div>

      <div style={{ position:'absolute', bottom:'12%', left:0, right:0, zIndex:5, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
        <div style={{ position:'relative', flexShrink:0 }}>
          <div style={{ filter:`drop-shadow(0 12px 20px ${cfg.glow})` }}>
            {imgErr ? <span style={{ fontSize:100 }}>🐾</span> : <img src={currentFrame} alt="Pandi" style={{ width:220, height:220, objectFit:'contain', display:'block' }} onError={() => setImgErr(true)} />}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {tipVisible && tip && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={() => setTipOpen(o => !o)} style={{ position:'absolute', bottom:42, left:16, right:16, cursor:'pointer', zIndex:6 }}>
            <div style={{ borderRadius:16, padding:'10px 12px', background:'rgba(255,255,255,0.8)', backdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,0.4)' }}>
              <p style={{ fontSize:11, color:'#1A2332', margin:0, textAlign:'center' }}>{tip}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function DayTask({ to, icon, label, sublabel, color, done }) {
  return (
    <Link to={to} style={{ textDecoration:'none' }}>
      <div style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 16px', borderRadius:18, background:'white', border:`1px solid ${done ? color+'30' : 'rgba(0,0,0,0.06)'}`, marginBottom:8, boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ width:44, height:44, borderRadius:14, background: done ? `${color}15` : '#f5f5f5', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>{icon}</div>
        <div style={{ flex:1 }}>
          <p style={{ fontSize:14, fontWeight:700, color:'#1A2332', margin:0 }}>{label}</p>
          <p style={{ fontSize:12, color:'#6B7280', margin:0 }}>{sublabel}</p>
        </div>
        {done && <div style={{ width:24, height:24, borderRadius:12, background:color, display:'flex', alignItems:'center', justifyContent:'center' }}><span style={{ color:'white' }}>✓</span></div>}
      </div>
    </Link>
  )
}

export default function Home() {
  const { profile, user } = useStore()
  const { theme, loaded } = useTheme()
  const pandiContext = usePandiState()
  const recoveryLight = pandiContext?.recoveryLight || 'GREEN'

  const [todayMeals, setTodayMeals] = useState([])
  const [todayWorkout, setTodayWorkout] = useState(null)
  const [goals, setGoals] = useState({ calories:2000, protein_g:150 })
  const [waterGlasses, setWaterGlasses] = useState(0)

  useEffect(() => {
    if (!user) return
    const fetchData = async () => {
      const today = new Date().toISOString().split('T')[0]
      try {
        const [m, w, g, h] = await Promise.all([
          supabase.from('meal_logs').select('calories,protein_g').eq('user_id', user.id).eq('date', today),
          supabase.from('workout_sessions').select('calories_burned').eq('user_id', user.id).eq('status', 'completed').gte('created_at', today+'T00:00:00'),
          supabase.from('nutrition_goals').select('*').eq('user_id', user.id).maybeSingle(),
          supabase.from('hydration_logs').select('glasses').eq('user_id', user.id).eq('date', today).maybeSingle(),
        ])
        setTodayMeals(m.data || [])
        setTodayWorkout(w.data?.[0] || null)
        if (g.data) setGoals(g.data)
        setWaterGlasses(h.data?.glasses || 0)
      } catch (err) { console.error(err) }
    }
    fetchData()
  }, [user])

  if (!loaded) return <div style={{ height:'100dvh', display:'flex', alignItems:'center', justifyContent:'center' }}>🐾</div>

  const cals = todayMeals.reduce((s,m) => s+(m.calories||0), 0)
  const tasks = [
    { to:'/nutrition', icon:'🍎', label:'Nutrición', sublabel: `${Math.round(cals)} kcal`, color:'#F97316', done:cals>0 },
    { to:'/workout', icon:'💪', label:'Entrenamiento', sublabel: todayWorkout ? 'Completado' : 'Pendiente', color:'#6366F1', done:!!todayWorkout }
  ]

  return (
    <div style={{ minHeight:'100dvh', background:'#f8fafa', paddingBottom:40 }}>
      <Sanctuary recoveryLight={recoveryLight} profile={profile} theme={theme} greeting="Hola" name={profile?.name?.split(' ')[0] || 'Compi'} />
      <div style={{ padding:'0 16px' }}>
        {tasks.map(t => <DayTask key={t.to} {...t} />)}
        <PandiInsights />
      </div>
    </div>
  )
}
