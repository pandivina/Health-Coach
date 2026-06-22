// ─── pages/EspejoMetabolico.jsx ──────────────────────────────────────────────
// Pantalla dedicada del Espejo Metabólico V2
// 3 ejes + Coach Score + historial 7 días + ritual nocturno

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, RefreshCw, Moon } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useStore } from '../store/useStore'
import { useTheme } from '../contexts/ThemeProvider'
import NightRitual from '../components/NightRitual'

const API = import.meta.env.VITE_API_URL

const SEMAPHORE = {
  GREEN:  { color:'#22C55E', bg:'#F0FDF4', label:'Buena recuperación',   icon:'💚', desc:'Tu cuerpo y mente están listos. Aprovecha el día.' },
  YELLOW: { color:'#F59E0B', bg:'#FFFBEB', label:'Recuperación moderada',icon:'💛', desc:'Estás bien pero hay margen de mejora. Cuídate hoy.' },
  RED:    { color:'#EF4444', bg:'#FEF2F2', label:'Recuperación baja',    icon:'🔴', desc:'Tu cuerpo necesita descanso. Prioriza el sueño y la calma.' },
}

const AXES = [
  { key:'physical_score', label:'Físico',       emoji:'💪', desc:'Sueño + RPE + entrenamiento' },
  { key:'mental_score',   label:'Mental',        emoji:'🧠', desc:'Estado de ánimo + meditación + ritual' },
  { key:'env_score',      label:'Hábitos',       emoji:'🌿', desc:'Agua + alimentación + constancia' },
]

function ScoreBar({ value, color, label, emoji, desc, delay = 0 }) {
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontSize:16 }}>{emoji}</span>
          <div>
            <p style={{ fontSize:13, fontWeight:800, color:'#1A2332', margin:0 }}>{label}</p>
            <p style={{ fontSize:10, color:'#9CA3AF', margin:0 }}>{desc}</p>
          </div>
        </div>
        <span style={{ fontSize:18, fontWeight:900, color }}>{Math.round(value)}</span>
      </div>
      <div style={{ height:8, background:'#F3F4F6', borderRadius:4, overflow:'hidden' }}>
        <motion.div initial={{ width:0 }} animate={{ width:`${value}%` }}
          transition={{ duration:0.8, delay, ease:'easeOut' }}
          style={{ height:'100%', borderRadius:4, background:color }} />
      </div>
    </div>
  )
}

function MiniChart({ history }) {
  if (!history.length) return null
  const max = 100
  const days = ['L','M','X','J','V','S','D']

  return (
    <div style={{ background:'white', borderRadius:20, padding:'16px', marginBottom:16,
      border:'1px solid rgba(0,0,0,0.06)' }}>
      <p style={{ fontSize:13, fontWeight:800, color:'#1A2332', margin:'0 0 12px' }}>
        Últimos 7 días
      </p>
      <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:60 }}>
        {history.map((d, i) => {
          const sem = SEMAPHORE[d.semaphore] || SEMAPHORE.GREEN
          const h = Math.max((d.coach_score / max) * 52, 4)
          return (
            <div key={d.date} style={{ flex:1, display:'flex', flexDirection:'column',
              alignItems:'center', gap:3 }}>
              <motion.div initial={{ height:0 }} animate={{ height:h }}
                transition={{ duration:0.4, delay:i*0.06 }}
                style={{ width:'100%', borderRadius:4, background:sem.color }} />
              <span style={{ fontSize:9, color:'#9CA3AF', fontWeight:700 }}>
                {days[new Date(d.date+'T12:00:00').getDay()]}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function EspejoMetabolico() {
  const { user }  = useStore()
  const { theme } = useTheme()
  const navigate  = useNavigate()

  const [score,     setScore]     = useState(null)
  const [history,   setHistory]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [refreshing,setRefreshing]= useState(false)
  const [showRitual,setShowRitual]= useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    if (!user?.id) return
    try {
      const [profileR, historyR] = await Promise.all([
        supabase.from('user_profiles').select('coach_score, semaphore').eq('id', user.id).single(),
        supabase.from('recovery_logs').select('*').eq('user_id', user.id)
          .gte('date', new Date(Date.now()-7*86400000).toISOString().split('T')[0])
          .order('date', { ascending: true }),
      ])

      // Score del día de hoy
      const today = new Date().toISOString().split('T')[0]
      const todayLog = historyR.data?.find(d => d.date === today)

      setScore(todayLog || { coach_score: profileR.data?.coach_score || 50,
        semaphore: profileR.data?.semaphore || 'GREEN',
        physical_score:50, mental_score:50, env_score:50, details:{} })
      setHistory(historyR.data || [])
    } finally { setLoading(false) }
  }

  async function recalculate() {
    setRefreshing(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${API}/api/recovery/calculate`, {
        method:'POST', headers:{ Authorization:`Bearer ${session.access_token}` },
      })
      const data = await res.json()
      setScore(data)
      await load()
    } finally { setRefreshing(false) }
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
      height:'100vh', background:'#f8fafa' }}>
      <div style={{ width:32, height:32, borderRadius:'50%',
        border:'3px solid #2EC4B620', borderTopColor:'#2EC4B6', animation:'spin 1s linear infinite' }} />
    </div>
  )

  const sem = SEMAPHORE[score?.semaphore] || SEMAPHORE.GREEN

  return (
    <div style={{ minHeight:'100vh', background:'#f8fafa', paddingBottom:100 }}>

      {/* Header */}
      <div style={{ background:'white', padding:'14px 16px',
        borderBottom:'1px solid rgba(0,0,0,0.06)',
        display:'flex', alignItems:'center', gap:12 }}>
        <button onClick={() => navigate(-1)}
          style={{ width:36, height:36, borderRadius:12, border:'none', cursor:'pointer',
            background:'#F3F4F6', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <ArrowLeft size={16} color="#1A2332" />
        </button>
        <div style={{ flex:1 }}>
          <p style={{ fontSize:16, fontWeight:900, color:'#1A2332', margin:0 }}>Espejo Metabólico</p>
          <p style={{ fontSize:11, color:'#9CA3AF', margin:0 }}>Tu estado hoy</p>
        </div>
        <button onClick={recalculate} disabled={refreshing}
          style={{ width:36, height:36, borderRadius:12, border:'none', cursor:'pointer',
            background:'#F3F4F6', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <motion.div animate={refreshing ? { rotate:360 } : {}}
            transition={{ duration:1, repeat:refreshing?Infinity:0, ease:'linear' }}>
            <RefreshCw size={15} color="#6B7280" />
          </motion.div>
        </button>
      </div>

      <div style={{ padding:'16px' }}>

        {/* Coach Score principal */}
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
          style={{ background:sem.bg, borderRadius:24, padding:'20px',
            border:`2px solid ${sem.color}30`, marginBottom:16, textAlign:'center' }}>
          <p style={{ fontSize:11, fontWeight:800, color:sem.color, textTransform:'uppercase',
            letterSpacing:'.06em', margin:'0 0 8px' }}>Coach Score</p>
          <motion.p initial={{ scale:0.8 }} animate={{ scale:1 }}
            transition={{ type:'spring', stiffness:200 }}
            style={{ fontSize:64, fontWeight:900, color:'#1A2332', margin:'0 0 4px',
              lineHeight:1 }}>
            {Math.round(score?.coach_score || 50)}
          </motion.p>
          <p style={{ fontSize:11, color:'#6B7280', margin:'0 0 12px' }}>de 100</p>
          <div style={{ display:'inline-flex', alignItems:'center', gap:6,
            padding:'6px 14px', borderRadius:20, background:`${sem.color}20` }}>
            <span>{sem.icon}</span>
            <p style={{ fontSize:12, fontWeight:700, color:sem.color, margin:0 }}>{sem.label}</p>
          </div>
          <p style={{ fontSize:12, color:'#6B7280', margin:'12px 0 0', lineHeight:1.5 }}>
            {sem.desc}
          </p>
        </motion.div>

        {/* Gráfico histórico */}
        <MiniChart history={history} />

        {/* Tres ejes */}
        <div style={{ background:'white', borderRadius:20, padding:'16px', marginBottom:16,
          border:'1px solid rgba(0,0,0,0.06)' }}>
          <p style={{ fontSize:13, fontWeight:800, color:'#1A2332', margin:'0 0 16px' }}>
            Desglose por eje
          </p>
          {AXES.map((axis, i) => (
            <ScoreBar key={axis.key}
              value={score?.[axis.key] || 0}
              color={i===0?'#3B82F6':i===1?'#8B5CF6':'#22C55E'}
              label={axis.label} emoji={axis.emoji} desc={axis.desc}
              delay={i * 0.15} />
          ))}
        </div>

        {/* Detalles */}
        {score?.details && (
          <div style={{ background:'white', borderRadius:20, padding:'16px', marginBottom:16,
            border:'1px solid rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize:13, fontWeight:800, color:'#1A2332', margin:'0 0 12px' }}>
              Factores de hoy
            </p>
            {[
              { label:'Sueño', value: score.details.sleep_hours != null ? `${score.details.sleep_hours}h` : 'Sin registro', emoji:'😴' },
              { label:'Ánimo', value: score.details.mood_today != null ? `${score.details.mood_today}/5` : 'Sin registro', emoji:'😊' },
              { label:'Agua',  value: score.details.water_pct  != null ? `${score.details.water_pct}%` : 'Sin registro', emoji:'💧' },
              { label:'RPE',   value: score.details.rpe_today  != null ? `${score.details.rpe_today}/10` : 'Sin registro', emoji:'🏋️' },
              { label:'Meditación', value: `${score.details.meditation_streak || 0} días`, emoji:'🧘' },
              { label:'Ritual nocturno', value: score.details.ritual_done ? 'Completado ✓' : 'Pendiente', emoji:'🌙' },
            ].map(item => (
              <div key={item.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                padding:'8px 0', borderBottom:'1px solid #F3F4F6' }}>
                <span style={{ fontSize:13, color:'#6B7280' }}>{item.emoji} {item.label}</span>
                <span style={{ fontSize:13, fontWeight:700, color:'#1A2332' }}>{item.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* CTA Ritual nocturno */}
        <motion.button whileTap={{ scale:0.97 }}
          onClick={() => setShowRitual(true)}
          style={{ width:'100%', padding:'16px', borderRadius:20, border:'none', cursor:'pointer',
            background:'linear-gradient(135deg,#1a1a2e,#16213e)',
            display:'flex', alignItems:'center', gap:12 }}>
          <Moon size={20} color="#818CF8" />
          <div style={{ textAlign:'left' }}>
            <p style={{ fontSize:14, fontWeight:800, color:'white', margin:0 }}>
              Ritual nocturno
            </p>
            <p style={{ fontSize:11, color:'rgba(255,255,255,0.5)', margin:0 }}>
              3 puntos · 2 minutos · +20 XP
            </p>
          </div>
        </motion.button>
      </div>

      {/* Ritual modal */}
      <AnimatePresence>
        {showRitual && <NightRitual onClose={() => { setShowRitual(false); load() }} />}
      </AnimatePresence>
    </div>
  )
}
