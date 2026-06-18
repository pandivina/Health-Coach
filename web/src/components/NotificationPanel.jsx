// ─── components/NotificationPanel.jsx ────────────────────────────────────────
// Dropdown flotante bajo la campana — logros recientes + recordatorios del día
// Sustituye el comportamiento anterior de redirigir directo a /calendar

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Trophy, Droplets, Apple, Moon, Sparkles, Bell, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase'

// ─── BOTÓN CAMPANA ────────────────────────────────────────────────────────────
export function NotificationBell({ userId, onOpen, hasUnseen }) {
  return (
    <button onClick={onOpen}
      style={{ width:36, height:36, borderRadius:12, background:'rgba(255,255,255,0.88)',
        backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:18, position:'relative', border:'none', cursor:'pointer' }}>
      🔔
      {hasUnseen && (
        <div style={{ position:'absolute', top:-3, right:-3, width:10, height:10,
          borderRadius:'50%', background:'#EF4444', border:'2px solid white' }} />
      )}
    </button>
  )
}

// ─── ITEM DE LOGRO ────────────────────────────────────────────────────────────
function AchievementItem({ achievement }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 4px' }}>
      <div style={{ width:34, height:34, borderRadius:11, background:'#FEF3C7',
        display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <Trophy size={15} color="#92400E" />
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontSize:13, fontWeight:700, color:'#1A2332', margin:0 }}>
          {achievement.title || achievement.name}
        </p>
        <p style={{ fontSize:11, color:'#9CA3AF', margin:0 }}>
          {achievement.description || 'Logro desbloqueado'}
        </p>
      </div>
    </div>
  )
}

// ─── ITEM DE RECORDATORIO ─────────────────────────────────────────────────────
function ReminderItem({ icon: Icon, color, bg, text, to }) {
  const content = (
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 4px',
      textDecoration:'none', cursor:'pointer' }}>
      <div style={{ width:34, height:34, borderRadius:11, background:bg,
        display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <Icon size={15} color={color} />
      </div>
      <p style={{ fontSize:13, fontWeight:600, color:'#1A2332', margin:0, flex:1 }}>{text}</p>
      <ChevronRight size={14} color="#D1D5DB" />
    </div>
  )
  return to ? <Link to={to} style={{ textDecoration:'none' }}>{content}</Link> : content
}

// ─── PANEL PRINCIPAL ──────────────────────────────────────────────────────────
export default function NotificationPanel({ userId, onClose }) {
  const [achievements, setAchievements] = useState([])
  const [reminders,    setReminders]    = useState([])
  const [loading,      setLoading]      = useState(true)
  const panelRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose?.()
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [onClose])

  useEffect(() => {
    if (!userId) return
    load()
  }, [userId])

  async function load() {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]
    const safe = async fn => { try { return await fn } catch { return { data: null } } }

    const [achR, waterR, mealR, sleepR, planR] = await Promise.all([
      safe(supabase.from('achievements').select('*').eq('user_id', userId)
        .order('unlocked_at', { ascending: false }).limit(3)),
      safe(supabase.from('hydration_logs').select('glasses,goal').eq('user_id', userId).eq('date', today).maybeSingle()),
      safe(supabase.from('meal_logs').select('id').eq('user_id', userId).eq('date', today).limit(1)),
      safe(supabase.from('sleep_logs').select('id').eq('user_id', userId).eq('date', today).maybeSingle()),
      safe(supabase.from('coach_memory').select('tomorrow_plan').eq('user_id', userId).maybeSingle()),
    ])

    setAchievements(achR.data || [])

    const built = []
    const water = waterR.data
    if (!water || (water.glasses || 0) < (water.goal || 8)) {
      built.push({ key:'water', icon:Droplets, color:'#3B82F6', bg:'#EFF6FF',
        text: water ? `Llevas ${water.glasses}/${water.goal} vasos de agua` : 'Aún no has registrado agua hoy',
        to:'/hydration' })
    }
    if (!mealR.data?.length) {
      built.push({ key:'meal', icon:Apple, color:'#F97316', bg:'#FFF7ED',
        text:'Aún no has registrado ninguna comida hoy', to:'/nutrition' })
    }
    if (!sleepR.data) {
      built.push({ key:'sleep', icon:Moon, color:'#818CF8', bg:'#EEF2FF',
        text:'Registra cómo dormiste anoche', to:'/sleep' })
    }
    const plan = planR.data?.tomorrow_plan
    if (plan?.prioridades?.length) {
      built.push({ key:'plan', icon:Sparkles, color:'#2EC4B6', bg:'#ECFDF5',
        text: `Tu plan de hoy: ${plan.prioridades[0]}`, to:'/home' })
    }
    setReminders(built)
    setLoading(false)
  }

  return (
    <motion.div ref={panelRef}
      initial={{ opacity:0, y:-8, scale:0.97 }} animate={{ opacity:1, y:0, scale:1 }}
      exit={{ opacity:0, y:-8, scale:0.97 }} transition={{ duration:0.18 }}
      style={{ position:'absolute', top:48, right:0, width:300, maxWidth:'90vw',
        background:'white', borderRadius:20, boxShadow:'0 12px 36px rgba(0,0,0,0.18)',
        zIndex:50, overflow:'hidden', border:'1px solid rgba(0,0,0,0.06)' }}>

      <div style={{ padding:'14px 16px 10px', display:'flex', alignItems:'center', gap:8,
        borderBottom:'1px solid rgba(0,0,0,0.06)' }}>
        <Bell size={15} color="#1A2332" />
        <p style={{ fontSize:14, fontWeight:800, color:'#1A2332', margin:0 }}>Notificaciones</p>
      </div>

      <div style={{ maxHeight:380, overflowY:'auto', padding:'4px 14px 14px' }}>

        {loading ? (
          <div style={{ padding:'24px 0', textAlign:'center' }}>
            <div style={{ width:20, height:20, border:'2px solid #2EC4B6',
              borderTopColor:'transparent', borderRadius:'50%', margin:'0 auto',
              animation:'spin 1s linear infinite' }} />
          </div>
        ) : (
          <>
            {achievements.length > 0 && (
              <div style={{ marginBottom:8 }}>
                <p style={{ fontSize:10, fontWeight:800, color:'#9CA3AF', textTransform:'uppercase',
                  letterSpacing:'.05em', margin:'10px 4px 2px' }}>Logros recientes</p>
                {achievements.map((a, i) => <AchievementItem key={a.id || i} achievement={a} />)}
              </div>
            )}

            {reminders.length > 0 && (
              <div>
                <p style={{ fontSize:10, fontWeight:800, color:'#9CA3AF', textTransform:'uppercase',
                  letterSpacing:'.05em', margin:'10px 4px 2px' }}>Para hoy</p>
                {reminders.map(r => (
                  <ReminderItem key={r.key} icon={r.icon} color={r.color} bg={r.bg} text={r.text} to={r.to} />
                ))}
              </div>
            )}

            {achievements.length === 0 && reminders.length === 0 && (
              <div style={{ padding:'28px 0', textAlign:'center' }}>
                <p style={{ fontSize:28, margin:'0 0 8px' }}>✨</p>
                <p style={{ fontSize:13, color:'#9CA3AF', margin:0 }}>Todo en orden por hoy</p>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  )
}
