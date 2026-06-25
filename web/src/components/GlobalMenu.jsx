import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { X } from 'lucide-react'
import { useTheme } from '../contexts/ThemeProvider'
import { useStore } from '../store/useStore'
import { useGlobalMenu } from '../contexts/GlobalMenuContext'

// ─── SECCIONES DEL MENÚ ───────────────────────────────────────────────────────
const SECTIONS = [
  {
    label: 'Principal',
    items: [
      { icon: '🏠', label: 'Inicio',       to: '/home'      },
      { icon: '🌿', label: 'Bienestar',    to: '/mood'      },
      { icon: '📅', label: 'Organizador',  to: '/calendar'  },
      { icon: '📊', label: 'Informe diario', to: '/report'  },
    ],
  },
  {
    label: 'Salud',
    items: [
      { icon: '🍎', label: 'Nutrición',    to: '/nutrition' },
      { icon: '💪', label: 'Entrena',      to: '/workout'   },
      { icon: '😴', label: 'Sueño',        to: '/sleep'     },
      { icon: '💧', label: 'Hidratación',  to: '/hydration' },
      { icon: '⚖️', label: 'Seguimiento',  to: '/health'    },
    ],
  },
  {
    label: 'Pandi',
    items: [
      { icon: '🤖', label: 'Coach IA',     to: '/coach'     },
      { icon: '🐾', label: 'Mi Pandi',     to: '/pet'       },
      { icon: '🏆', label: 'Logros',       to: '/achievements' },
    ],
  },
  {
    label: 'Cuenta',
    items: [
      { icon: '👤', label: 'Perfil',       to: '/profile'   },
      { icon: '🎨', label: 'Apariencia',   to: '/appearance'},
      { icon: '⭐', label: 'Premium',      to: '/premium'   },
    ],
  },
]

export default function GlobalMenu() {
  const { theme }           = useTheme()
  const { profile }         = useStore()
  const { open, closeMenu } = useGlobalMenu()
  const navigate            = useNavigate()
  const location            = useLocation()

  function go(to) {
    closeMenu()
    setTimeout(() => navigate(to), 180) // esperar al fadeout
  }

  const name   = profile?.name?.split(' ')[0] || 'Usuario'
  const level  = profile?.level  || 1
  const xp     = profile?.xp     || 0
  const streak = profile?.streak || 0

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            key="overlay"
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            transition={{ duration:0.2 }}
            onClick={closeMenu}
            style={{ position:'fixed', inset:0, zIndex:500,
              background:'rgba(0,0,0,0.45)', backdropFilter:'blur(4px)' }} />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ x:'-100%' }} animate={{ x:0 }} exit={{ x:'-100%' }}
            transition={{ type:'spring', damping:28, stiffness:280 }}
            style={{ position:'fixed', top:0, left:0, bottom:0, zIndex:501,
              width:'min(80vw, 320px)',
              background: theme.background || 'white',
              display:'flex', flexDirection:'column',
              boxShadow:'8px 0 40px rgba(0,0,0,0.18)',
              overflowY:'auto' }}>

            {/* Header — perfil del usuario */}
            <div style={{ padding:'calc(env(safe-area-inset-top,0px) + 20px) 20px 20px',
              background:`linear-gradient(135deg, ${theme.primary || '#2EC4B6'}22, transparent)`,
              borderBottom:`1px solid ${theme.border || 'rgba(0,0,0,0.06)'}` }}>

              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:52, height:52, borderRadius:18,
                    background:`linear-gradient(135deg, ${theme.primary || '#2EC4B6'}, #FF8FA3)`,
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:26 }}>
                    🐾
                  </div>
                  <div>
                    <p style={{ fontSize:17, fontWeight:900, color: theme.text || '#1A2332', margin:0 }}>
                      {name}
                    </p>
                    <p style={{ fontSize:11, color: theme.textMuted || '#9CA3AF', margin:'2px 0 0' }}>
                      Nivel {level} · {xp} XP
                    </p>
                  </div>
                </div>
                <button onClick={closeMenu}
                  style={{ width:32, height:32, borderRadius:10, border:'none', cursor:'pointer',
                    background: theme.surface2 || '#F3F4F6', marginTop:2,
                    display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <X size={16} color={theme.textMuted || '#9CA3AF'} />
                </button>
              </div>

              {/* Racha */}
              {streak > 0 && (
                <div style={{ marginTop:14, display:'flex', alignItems:'center', gap:6,
                  padding:'7px 12px', borderRadius:12,
                  background:'rgba(249,115,22,0.1)', width:'fit-content' }}>
                  <span style={{ fontSize:14 }}>🔥</span>
                  <span style={{ fontSize:12, fontWeight:800, color:'#F97316' }}>
                    {streak} días de racha
                  </span>
                </div>
              )}
            </div>

            {/* Secciones */}
            <div style={{ flex:1, padding:'12px 12px 24px' }}>
              {SECTIONS.map((section, si) => (
                <div key={si} style={{ marginBottom:8 }}>
                  <p style={{ fontSize:10, fontWeight:800, letterSpacing:'.08em',
                    color: theme.textMuted || '#9CA3AF', textTransform:'uppercase',
                    padding:'8px 8px 4px', margin:0 }}>
                    {section.label}
                  </p>
                  {section.items.map((item, ii) => {
                    const active = location.pathname === item.to
                    return (
                      <motion.button key={ii} whileTap={{ scale:0.97 }}
                        onClick={() => go(item.to)}
                        style={{ width:'100%', display:'flex', alignItems:'center', gap:12,
                          padding:'11px 12px', borderRadius:14, border:'none', cursor:'pointer',
                          textAlign:'left', marginBottom:2, transition:'background 0.15s',
                          background: active
                            ? `${theme.primary || '#2EC4B6'}18`
                            : 'transparent' }}>
                        <span style={{ fontSize:18, width:24, textAlign:'center' }}>{item.icon}</span>
                        <span style={{ fontSize:13, fontWeight: active ? 800 : 600,
                          color: active ? (theme.primary || '#2EC4B6') : (theme.text || '#1A2332') }}>
                          {item.label}
                        </span>
                        {active && (
                          <div style={{ marginLeft:'auto', width:6, height:6, borderRadius:'50%',
                            background: theme.primary || '#2EC4B6' }} />
                        )}
                      </motion.button>
                    )
                  })}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{ padding:'12px 20px', paddingBottom:'calc(env(safe-area-inset-bottom,0px) + 12px)',
              borderTop:`1px solid ${theme.border || 'rgba(0,0,0,0.06)'}` }}>
              <p style={{ fontSize:10, color: theme.textMuted || '#9CA3AF',
                textAlign:'center', margin:0 }}>
                Pandi Health Coach · v1.0
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
