// ─── components/WeeklyChallengesWidget.jsx ───────────────────────────────────
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'

export default function WeeklyChallengesWidget({ theme }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const headers = { Authorization: `Bearer ${session.access_token}` }

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/challenges/weekly`, { headers })
      const weekly = await res.json()

      const checkRes = await fetch(`${import.meta.env.VITE_API_URL}/api/challenges/check`, {
        method: 'POST', headers,
      })
      const checked = await checkRes.json()
      setData(checked.id ? checked : weekly)
    } catch {} finally {
      setLoading(false)
    }
  }

  if (loading || !data?.challenges?.length) return null

  const allDone = data.challenges.every(c => c.done)

  return (
    <div style={{ background:'rgba(255,255,255,0.95)', borderRadius:20, padding:'14px 16px',
      marginBottom:12, border:`1px solid ${allDone ? '#2EC4B6' : 'rgba(0,0,0,0.06)'}`,
      boxShadow:'0 2px 12px rgba(0,0,0,0.04)' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <p style={{ fontSize:13, fontWeight:800, color:'#1A2332', margin:0 }}>
          🎯 Retos de la semana
        </p>
        {allDone && (
          <span style={{ fontSize:11, color:'#2EC4B6', fontWeight:700 }}>+{data.reward_xp} XP ✓</span>
        )}
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {data.challenges.map(c => (
          <div key={c.id} style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:20, height:20, borderRadius:'50%', flexShrink:0,
              border:`2px solid ${c.done ? '#22C55E' : 'rgba(0,0,0,0.12)'}`,
              background: c.done ? '#22C55E' : 'transparent',
              display:'flex', alignItems:'center', justifyContent:'center' }}>
              {c.done && <span style={{ fontSize:10, color:'white' }}>✓</span>}
            </div>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:12, color: c.done ? '#9CA3AF' : '#1A2332', margin:0,
                textDecoration: c.done ? 'line-through' : 'none', fontWeight:600 }}>
                {c.text}
              </p>
              <div style={{ height:4, borderRadius:2, background:'rgba(0,0,0,0.06)', marginTop:4, overflow:'hidden' }}>
                <motion.div animate={{ width:`${Math.min((c.progress/c.target)*100,100)}%` }}
                  style={{ height:'100%', borderRadius:2, background: c.done ? '#22C55E' : theme.primary }} />
              </div>
            </div>
            <span style={{ fontSize:10, color:'#9CA3AF', fontWeight:700, flexShrink:0 }}>
              {c.progress}/{c.target}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
