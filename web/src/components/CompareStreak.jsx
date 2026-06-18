// ─── components/CompareStreak.jsx ────────────────────────────────────────────
// Compartir racha vía enlace + comparar con la de un amigo (sin datos privados)

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Share2, Users, X } from 'lucide-react'
import { supabase } from '../lib/supabase'

export function ShareStreakButton({ profile }) {
  const [copied, setCopied] = useState(false)

  async function share() {
    const url = `${window.location.origin}/u/${profile?.public_share_id}`
    if (navigator.share) {
      try { await navigator.share({ title: 'Mi racha en Pandi Health Coach', url }) } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch {}
    }
  }

  return (
    <motion.button whileTap={{ scale:0.95 }} onClick={share}
      style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px',
        borderRadius:14, border:'none', cursor:'pointer',
        background:'rgba(255,255,255,0.9)', fontSize:11, fontWeight:700, color:'#1A2332' }}>
      <Share2 size={13} /> {copied ? '¡Copiado!' : 'Compartir racha'}
    </motion.button>
  )
}

// Modal que muestra el perfil público de un amigo a partir de su share_id
export function FriendCompareModal({ shareId, myProfile, onClose }) {
  const [friend, setFriend] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!shareId) return
    supabase.from('public_profile_share').select('*').eq('public_share_id', shareId).maybeSingle()
      .then(({ data }) => { setFriend(data); setLoading(false) })
  }, [shareId])

  if (loading) return null

  const myStreak = myProfile?.streak || 0
  const friendStreak = friend?.streak || 0
  const winning = myStreak > friendStreak

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(15,20,28,0.6)',
        display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}
      onClick={onClose}>
      <motion.div initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }}
        onClick={e => e.stopPropagation()}
        style={{ width:'100%', maxWidth:340, background:'white', borderRadius:28, padding:24 }}>

        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <Users size={16} color="#2EC4B6" />
            <p style={{ fontWeight:800, fontSize:14, color:'#1A2332', margin:0 }}>Comparar racha</p>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer' }}>
            <X size={16} color="#9CA3AF" />
          </button>
        </div>

        {!friend ? (
          <p style={{ fontSize:13, color:'#9CA3AF', textAlign:'center', padding:'20px 0' }}>
            No se encontró ese enlace
          </p>
        ) : (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-around', padding:'10px 0' }}>
            <div style={{ textAlign:'center' }}>
              <p style={{ fontSize:11, color:'#9CA3AF', fontWeight:700, margin:'0 0 6px' }}>Tú</p>
              <p style={{ fontSize:32 }}>🔥</p>
              <p style={{ fontSize:22, fontWeight:900, color: winning ? '#2EC4B6' : '#1A2332', margin:0 }}>
                {myStreak}
              </p>
              <p style={{ fontSize:10, color:'#9CA3AF' }}>Nv. {myProfile?.level || 1}</p>
            </div>
            <p style={{ fontSize:18, color:'#D1D5DB', fontWeight:700 }}>vs</p>
            <div style={{ textAlign:'center' }}>
              <p style={{ fontSize:11, color:'#9CA3AF', fontWeight:700, margin:'0 0 6px' }}>{friend.name?.split(' ')[0] || 'Amigo'}</p>
              <p style={{ fontSize:32 }}>🔥</p>
              <p style={{ fontSize:22, fontWeight:900, color: !winning ? '#2EC4B6' : '#1A2332', margin:0 }}>
                {friendStreak}
              </p>
              <p style={{ fontSize:10, color:'#9CA3AF' }}>Nv. {friend.level || 1}</p>
            </div>
          </div>
        )}

        {friend && (
          <p style={{ fontSize:12, textAlign:'center', marginTop:16, color: winning ? '#16A34A' : '#F97316', fontWeight:700 }}>
            {winning ? '¡Vas por delante! 💪' : myStreak === friendStreak ? '¡Vais a la par!' : 'A por ello, puedes alcanzarle'}
          </p>
        )}
      </motion.div>
    </motion.div>
  )
}
