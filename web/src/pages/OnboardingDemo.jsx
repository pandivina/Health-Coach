import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function OnboardingDemo() {
  const [phase,      setPhase]      = useState(0)
  const [flash,      setFlash]      = useState(false)
  const [openFading, setOpenFading] = useState(false)
  const [doorOp,     setDoorOp]     = useState(1)
  const [imgErrs,    setImgErrs]    = useState({})

  const isLast = phase === 8

  function next() {
    if (phase === 7) {
      setFlash(true)
      setTimeout(() => { setFlash(false); setPhase(8) }, 700)
      return
    }
    if (phase === 2) {
      setOpenFading(true)
      setTimeout(() => { setOpenFading(false); setPhase(3) }, 1200)
      return
    }
    setPhase(p => p + 1)
  }

  const LABELS = [
    'El comienzo',
    'Se abre el portal',
    'Las nubes llegan',
    'El orbe aparece',
    'La energía fluye',
    'Tomando forma',
    'Casi despierta',
    'Ha despertado',
    'Nace',
  ]

  const showBlur   = phase <= 1
  const showOpen   = phase === 1 || (phase === 2 && !openFading)
  const showClouds = phase >= 2
  const showOrb    = phase >= 3 && phase <= 7
  const showBorn   = phase === 8

  return (
    <div style={{ position:'fixed', inset:0, overflow:'hidden', background:'#f5f0e8' }}>

      {/* CAPA 0: blur */}
      <motion.img src="/panda/onboarding_orb_baby_blur.png" alt=""
        animate={{ opacity: showBlur ? 1 : 0 }}
        transition={{ duration:1.5 }}
        style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', zIndex:1 }}
        onError={()=>setImgErrs(e=>({...e,blur:true}))}
      />

      {/* CAPA 1: sanctuary_open */}
      <motion.img src="/panda/onboarding_sanctuary_open.png" alt=""
        animate={{ opacity: showOpen ? 1 : 0 }}
        transition={{ duration: openFading ? 1.2 : 1.8 }}
        style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', zIndex:2 }}
        onError={()=>setImgErrs(e=>({...e,open:true}))}
      />

      {/* CAPA 2: clouds */}
      <motion.img src="/panda/onboarding_clouds.png" alt=""
        animate={{ opacity: showClouds ? 1 : 0 }}
        transition={{ duration:1.8 }}
        style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', zIndex:3 }}
        onError={()=>setImgErrs(e=>({...e,clouds:true}))}
      />

      {/* ── ORB — flex centrado, tamaños fijos correctos ── */}
      <AnimatePresence>
        {showOrb && (
          <motion.div
            key="orb"
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            transition={{ duration:1.2 }}
            style={{
              position:'fixed', inset:0, zIndex:15,
              display:'flex', alignItems:'center', justifyContent:'center',
              pointerEvents:'none',
            }}>

            <motion.div
              initial={{ scale:0.7, y:40 }}
              animate={{ scale:1, y:0 }}
              transition={{ duration:1.4, type:'spring', damping:18 }}
              style={{
                position:'relative',
                width:220, height:280,
                flexShrink:0,
              }}>

              {/* Glow */}
              <motion.div
                animate={{ scale:[1,1.08,1], opacity:[0.3,0.6,0.3] }}
                transition={{ duration:3.5, repeat:Infinity }}
                style={{
                  position:'absolute', inset:-30,
                  borderRadius:'50%',
                  background:'radial-gradient(circle, rgba(255,220,140,0.65) 0%, transparent 65%)',
                  filter:'blur(32px)',
                }}
              />

              {/* Frames pre-compuestos — crossfade entre fases */}
              {[
                '/panda/orb_frame_0.png',
                '/panda/orb_frame_1.png',
                '/panda/orb_frame_2.png',
                '/panda/orb_frame_3.png',
                '/panda/orb_frame_4.png',
              ].map((frameSrc, i) => (
                <motion.img
                  key={frameSrc}
                  src={frameSrc}
                  alt=""
                  animate={{ opacity: phase - 3 === i ? 1 : 0 }}
                  transition={{ duration:0.9 }}
                  style={{
                position:'relative',
                width:'372vw',
                height:'480vw',
                flexShrink:15,
                marginTop:'55%',
              }}>
                  onError={()=>setImgErrs(e=>({...e,[`f${i}`]:true}))}
                />
              ))}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PANDA BABY LIBRE — fase 6 */}
      <AnimatePresence>
        {showBorn && (
          <motion.div
            key="born"
            initial={{ opacity:0, scale:0.7, y:30 }}
            animate={{ opacity:1, scale:1, y:0 }}
            transition={{ type:'spring', damping:14, delay:0.2 }}
            style={{
              position:'fixed', inset:0, zIndex:15,
              display:'flex', alignItems:'center', justifyContent:'center',
              pointerEvents:'none',
            }}>
            <motion.div style={{ position:'relative', width:220 }}>
              <motion.div
                animate={{ scale:[1,1.1,1], opacity:[0.3,0.55,0.3] }}
                transition={{ duration:3, repeat:Infinity }}
                style={{
                  position:'absolute', inset:-30, borderRadius:'50%',
                  background:'radial-gradient(circle, rgba(255,180,100,0.6) 0%, transparent 70%)',
                  filter:'blur(24px)',
                }}
              />
              <motion.img src="/panda/panda_baby.png" alt="Pandi"
                animate={{ y:[0,-10,0] }}
                transition={{ duration:3.5, repeat:Infinity, ease:'easeInOut' }}
                style={{ width:'100%', objectFit:'contain', position:'relative', zIndex:1 }}
                onError={()=>setImgErrs(e=>({...e,baby_born:true}))}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DESTELLO */}
      <AnimatePresence>
        {flash && (
          <motion.div
            initial={{ opacity:0 }} animate={{ opacity:[0,1,0] }}
            transition={{ duration:0.6, times:[0,0.25,1] }}
            style={{ position:'fixed', inset:0, zIndex:50, background:'white', pointerEvents:'none' }}
          />
        )}
      </AnimatePresence>

      {/* UI */}
      <div style={{
        position:'fixed', bottom:0, left:0, right:0, zIndex:20,
        padding:'0 24px 48px',
        display:'flex', flexDirection:'column', alignItems:'center', gap:12,
      }}>
        <AnimatePresence mode="wait">
          <motion.div key={phase}
            initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
            exit={{ opacity:0, y:-6 }} transition={{ duration:0.3 }}
            style={{
              background:'rgba(255,252,245,0.65)', backdropFilter:'blur(16px)',
              borderRadius:14, padding:'8px 18px', textAlign:'center',
            }}>
            <p style={{ fontSize:16, fontWeight:800, color:'#1A2332', margin:0 }}>{LABELS[phase]}</p>
            <p style={{ fontSize:10, color:'#6B7280', margin:'2px 0 0' }}>{phase + 1} / {LABELS.length}</p>
          </motion.div>
        </AnimatePresence>

        <div style={{ display:'flex', gap:5 }}>
          {LABELS.map((_,i) => (
            <motion.div key={i}
              animate={{
                width: i===phase ? 22 : 6,
                background: i<phase ? '#2EC4B6' : i===phase ? '#1A2332' : 'rgba(0,0,0,0.18)',
              }}
              style={{ height:3, borderRadius:2 }}
              transition={{ duration:0.3 }}
            />
          ))}
        </div>

        {!isLast ? (
          <motion.button whileTap={{ scale:0.97 }} onClick={next}
            style={{
              width:'100%', maxWidth:400, padding:'15px 20px', borderRadius:16,
              background:'rgba(255,252,245,0.7)', backdropFilter:'blur(16px)',
              border:'1.5px solid rgba(255,255,255,0.6)',
              fontSize:15, fontWeight:700, color:'#1A2332',
              cursor:'pointer', boxShadow:'0 4px 20px rgba(0,0,0,0.08)',
            }}>
            Siguiente →
          </motion.button>
        ) : (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ textAlign:'center', width:'100%' }}>
            <p style={{ fontSize:13, color:'rgba(255,255,255,0.85)', fontStyle:'italic', marginBottom:12,
              textShadow:'0 1px 10px rgba(0,0,0,0.4)' }}>
              "Ya estoy aquí. Ahora crecemos juntos."
            </p>
            <motion.button whileTap={{ scale:0.97 }}
              style={{
                width:'100%', maxWidth:400, padding:'15px 20px', borderRadius:20,
                background:'white', border:'none',
                fontSize:16, fontWeight:800, color:'#1A2332',
                cursor:'pointer', boxShadow:'0 8px 32px rgba(0,0,0,0.15)',
              }}>
              Empezar a crecer juntos 🐾
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* Debug */}
      {Object.keys(imgErrs).length > 0 && (
        <div style={{ position:'fixed', top:8, left:8, zIndex:100,
          background:'rgba(0,0,0,0.75)', borderRadius:8, padding:'5px 10px',
          fontSize:10, color:'#ff6b6b' }}>
          ❌ {Object.keys(imgErrs).join(', ')}
        </div>
      )}
    </div>
  )
}
