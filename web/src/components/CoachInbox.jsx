import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bookmark, Trash2, X } from 'lucide-react'
import { useTheme } from '../contexts/ThemeProvider'
import { supabase } from '../lib/supabase'

// ─── INBOX DE RECOMENDACIONES DE PANDI ────────────────────────────────────────
// Uso: <CoachInbox open={open} onClose={() => setOpen(false)} />

export default function CoachInbox({ open, onClose }) {
  const { theme }             = useTheme()
  const [recs,    setRecs]    = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) load()
  }, [open])

  async function load() {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res  = await fetch(`${import.meta.env.VITE_API_URL}/api/coach/recommendations`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      })
      const data = await res.json()
      setRecs(data || [])
    } catch { setRecs([]) }
    finally  { setLoading(false) }
  }

  async function remove(id) {
    setRecs(r => r.filter(x => x.id !== id)) // optimistic
    try {
      const { data: { session } } = await supabase.auth.getSession()
      await fetch(`${import.meta.env.VITE_API_URL}/api/coach/recommendations/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session?.access_token}` },
      })
    } catch { load() } // revertir si falla
  }

  const SECTION_LABELS = {
    nutrition: '🍎 Nutrición', workout: '💪 Entrena', sleep: '😴 Sueño',
    hydration: '💧 Agua',      health: '📊 Salud',   mood: '🧘 Bienestar',
    home: '🏠 Inicio',
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
          style={{ position:'fixed', inset:0, zIndex:300, background:'rgba(0,0,0,0.4)',
            backdropFilter:'blur(4px)', display:'flex', alignItems:'flex-end' }}
          onClick={onClose}>

          <motion.div initial={{ y:'100%' }} animate={{ y:'0%' }} exit={{ y:'100%' }}
            transition={{ type:'spring', damping:28, stiffness:280 }}
            onClick={e => e.stopPropagation()}
            style={{ width:'100%', maxHeight:'80vh', background: theme.background || 'white',
              borderRadius:'24px 24px 0 0', display:'flex', flexDirection:'column',
              overflow:'hidden', boxShadow:'0 -8px 32px rgba(0,0,0,0.2)' }}>

            {/* Header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
              padding:'18px 16px 14px',
              borderBottom:`1px solid ${theme.border || 'rgba(0,0,0,0.08)'}` }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:36, height:36, borderRadius:12,
                  background:'linear-gradient(135deg,#2EC4B6,#FF8FA3)',
                  display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Bookmark size={18} color="white" />
                </div>
                <div>
                  <p style={{ fontSize:15, fontWeight:800, color: theme.text || '#1A2332', margin:0 }}>
                    Guardado de Pandi
                  </p>
                  <p style={{ fontSize:11, color: theme.textMuted || '#9CA3AF', margin:0 }}>
                    {recs.length} recomendación{recs.length !== 1 ? 'es' : ''}
                  </p>
                </div>
              </div>
              <button onClick={onClose}
                style={{ width:32, height:32, borderRadius:10, border:'none', cursor:'pointer',
                  background: theme.surface2 || '#F3F4F6',
                  display:'flex', alignItems:'center', justifyContent:'center' }}>
                <X size={16} color={theme.textMuted || '#9CA3AF'} />
              </button>
            </div>

            {/* Lista */}
            <div style={{ flex:1, overflowY:'auto', padding:'12px 16px 32px' }}>
              {loading ? (
                <div style={{ textAlign:'center', padding:'40px 0', color: theme.textMuted || '#9CA3AF' }}>
                  <div style={{ fontSize:28, marginBottom:8 }}>🐾</div>
                  <p style={{ fontSize:13 }}>Cargando...</p>
                </div>
              ) : recs.length === 0 ? (
                <div style={{ textAlign:'center', padding:'40px 0' }}>
                  <div style={{ fontSize:48, marginBottom:12 }}>📭</div>
                  <p style={{ fontSize:14, fontWeight:700, color: theme.text || '#1A2332', margin:'0 0 6px' }}>
                    Sin recomendaciones guardadas
                  </p>
                  <p style={{ fontSize:12, color: theme.textMuted || '#9CA3AF', margin:0 }}>
                    Cuando hables con Pandi, pulsa "Guardar" en sus mensajes
                  </p>
                </div>
              ) : (
                recs.map((rec, i) => (
                  <motion.div key={rec.id}
                    initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                    transition={{ delay: i * 0.04 }}
                    style={{ background: theme.surface || '#F9FAFB', borderRadius:16,
                      padding:'14px 14px 12px', marginBottom:10,
                      border:`1px solid ${theme.border || 'rgba(0,0,0,0.06)'}`,
                      boxShadow:'0 1px 6px rgba(0,0,0,0.05)' }}>

                    {/* Sección + fecha */}
                    <div style={{ display:'flex', alignItems:'center',
                      justifyContent:'space-between', marginBottom:8 }}>
                      <span style={{ fontSize:10, fontWeight:700, color:'#2EC4B6',
                        background:'rgba(46,196,182,0.1)', padding:'3px 8px',
                        borderRadius:8 }}>
                        {SECTION_LABELS[rec.section] || '🐾 General'}
                      </span>
                      <span style={{ fontSize:10, color: theme.textMuted || '#9CA3AF' }}>
                        {new Date(rec.saved_at).toLocaleDateString('es-ES', {
                          day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'
                        })}
                      </span>
                    </div>

                    <p style={{ fontSize:13, lineHeight:1.55,
                      color: theme.text || '#1A2332', margin:'0 0 10px' }}>
                      {rec.content}
                    </p>

                    <button onClick={() => remove(rec.id)}
                      style={{ display:'flex', alignItems:'center', gap:4,
                        background:'none', border:'none', cursor:'pointer',
                        padding:0, opacity:0.5 }}>
                      <Trash2 size={11} color={theme.textMuted || '#9CA3AF'} />
                      <span style={{ fontSize:10, color: theme.textMuted || '#9CA3AF' }}>Eliminar</span>
                    </button>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
