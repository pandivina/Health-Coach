// ─── components/RecoveryBadge.jsx ────────────────────────────────────────────
// Badge compacto del Espejo Metabólico — visible en Home junto a Pandi
// Tap → navega a /espejo para el detalle completo

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useStore } from '../store/useStore'

const SEMAPHORE_CONFIG = {
  GREEN:  { color:'#22C55E', bg:'rgba(34,197,94,0.12)',  label:'Bien',     emoji:'💚' },
  YELLOW: { color:'#F59E0B', bg:'rgba(245,158,11,0.12)', label:'Moderado', emoji:'💛' },
  RED:    { color:'#EF4444', bg:'rgba(239,68,68,0.12)',  label:'Bajo',     emoji:'🔴' },
}

export default function RecoveryBadge({ theme }) {
  const { user }   = useStore()
  const navigate   = useNavigate()
  const [data, setData] = useState(null)

  useEffect(() => {
    if (!user?.id) return
    // Leer del perfil (ya actualizado por recoveryEngine)
    supabase.from('user_profiles')
      .select('coach_score, semaphore')
      .eq('id', user.id).single()
      .then(({ data }) => setData(data))
  }, [user?.id])

  if (!data) return null

  const cfg   = SEMAPHORE_CONFIG[data.semaphore] || SEMAPHORE_CONFIG.GREEN
  const score = Math.round(data.coach_score || 50)

  return (
    <motion.button
      whileTap={{ scale:0.95 }}
      onClick={() => navigate('/espejo')}
      style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px',
        borderRadius:20, border:`1.5px solid ${cfg.color}40`,
        background: cfg.bg, cursor:'pointer' }}>
      <span style={{ fontSize:14 }}>{cfg.emoji}</span>
      <div style={{ textAlign:'left' }}>
        <p style={{ fontSize:10, fontWeight:800, color:cfg.color, margin:0, textTransform:'uppercase',
          letterSpacing:'.04em' }}>
          {cfg.label}
        </p>
        <p style={{ fontSize:12, fontWeight:900, color:theme?.text || '#1A2332', margin:0 }}>
          {score}<span style={{ fontSize:9, fontWeight:600, color:theme?.textMuted || '#9CA3AF' }}>/100</span>
        </p>
      </div>
    </motion.button>
  )
}
