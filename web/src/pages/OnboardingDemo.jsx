import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── FASES ────────────────────────────────────────────────────────────────────
// 0: solo onboarding_orb_baby_blur.png
// 1: onboarding_orb_baby_blur.png + onboarding_sanctuary_open.png encima
// 2: onboarding_clouds.png + onboarding_sanctuary_open.png (luego quitamos open)
// 3: zoom/desplazamiento al interior → panda_orb + panda_baby + orb_door centrados
// 4: orb_door se va transparentando (simulamos 4 pasos)
// 5: resultado final — panda_baby visible dentro del orbe
// 6: destello → panda_baby suelto (sin cordón)

export default function OnboardingDemo() {
  const [phase,      setPhase]      = useState(0)
  const [flash,      setFlash]      = useState(false)
  const [openFading, setOpenFading] = useState(false) // fade out del sanctuary_open en fase 2
  const [doorOp,     setDoorOp]     = useState(1)     // opacidad del door
  const [imgErrs,    setImgErrs]    = useState({})

  const isLast = phase === 6

  function next() {
    if (phase === 5) {
      // Destello antes de nacer
      setFlash(true)
      setTimeout(() => { setFlash(false); setPhase(6) }, 700)
      return
    }
    if (phase === 2) {
      // Fase 2: después de un momento quitamos sanctuary_open
      setOpenFading(true)
      setTimeout(() => { setOpenFading(false); setPhase(3) }, 1200)
      return
    }
    if (phase >= 3 && phase <= 4) {
      // Cada paso reduce la puerta 0.25
      setDoorOp(d => Math.max(d - 0.25, 0))
      if (doorOp - 0.25 <= 0) setPhase(5)
      else setPhase(p => p + 1) // avanza visualmente pero el control es doorOp
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
    'Ha despertado',
    'Nace',
  ]

  // Cuándo mostrar cada capa
  const showBlur     = phase <= 1
  const showOpen     = (phase === 1) || (phase === 2 && !openFading)
  const showOpenFade = phase === 2 && openFading
  const showClouds   = phase >= 2
  const showOrb      = phase >= 3 && phase <= 5
  const showBorn     = phase === 6

  // Opacidad puerta del orbe
  const doorOpacity = phase === 3 ? 1 : phase === 4 ? 0.6 : phase === 5 ? 0 : 1

  return (
    <div style={{ position:'fixed', inset:0, overflow:'hidden', background:'#f5f0e8' }}>

      {/* ── CAPA 0: onboarding_orb_baby_blur ── */}
      <motion.img
        src="/panda/onboarding_orb_baby_blur.png" alt=""
        animate={{ opacity: showBlur ? 1 : 0 }}
        transition={{ duration: 1.5 }}
        style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', zIndex:1 }}
        onError={()=>setImgErrs(e=>({...e,blur:true}))}
      />

      {/* ── CAPA 1: onboarding_sanctuary_open — encima del blur ── */}
      <motion.img
        src="/panda/onboarding_sanctuary_open.png" alt=""
        animate={{ opacity: showOpen ? 1 : showOpenFade ? 0 : 0 }}
        transition={{ duration: showOpenFade ? 1.2 : 1.8 }}
        style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', zIndex:2 }}
        onError={()=>setImgErrs(e=>({...e,open:true}))}
      />

      {/* ── CAPA 2: onboarding_clouds ── */}
      <motion.img
        src="/panda/onboarding_clouds.png" alt=""
        animate={{ opacity: showClouds ? 1 : 0 }}
        transition={{ duration: 1.8 }}
        style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', zIndex:3 }}
        onError={()=>setImgErrs(e=>({...e,clouds:true}))}
      />

      {/* ── ORB — wrapper pantalla completa con flex centrado ── */}
      <AnimatePresence>
        {showOrb && (
          <motion.div
            key="orb"
            initial={{ opacity:0 }}
            animate={{ opacity:1 }}
            exit={{ opacity:0 }}
            transition={{ duration:1.2 }}
            style={{
              position:'fixed',
              top:0, left:0, right:0, bottom:0,
              zIndex:15,
              display:'flex',
              alignItems:'center',
              justifyContent:'center',
              pointerEvents:'none',
            }}>

            {/* El orbe en sí */}
            <motion.div
              initial={{ scale:0.6, y:60 }}
              animate={{ scale:1, y:0 }}
              transition={{ duration:1.4, type:'spring', damping:18, stiffness:100 }}
              style={{
                position:'relative',
                width:'372vw',
                height:'480vw',
                flexShrink:15,
                marginTop:'55%',
              }}>

              {/* Glow */}
              <motion.div
                animate={{ scale:[1,1.08,1], opacity:[0.3,0.6,0.3] }}
                transition={{ duration:3.5, repeat:Infinity }}
                style={{
                  position:'absolute', inset:'-15%',
                  borderRadius:'50%',
                  background:'radial-gradient(circle, rgba(255,220,140,0.65) 0%, transparent 65%)',
                  filter:'blur(32px)',
                }}
              />

              {/* CAPA 1: panda_orb — contenedor cristal, siempre visible */}
              <img src="/panda/panda_orb.png" alt=""
                style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'contain', zIndex:1 }}
                onError={()=>setImgErrs(e=>({...e,orb:true}))}
              />

              {/* CAPA 2: panda_baby — dentro del orbe */}
              <img src="/panda/panda_baby.png" alt=""
                style={{
                  position:'absolute',
                  top:'30%', left:'28%', width:'44%', height:'38%',
                  objectFit:'contain', zIndex:2,
                }}
                onError={()=>setImgErrs(e=>({...e,baby_inner:true}))}
              />

              {/* CAPA 3: onboarding_orb_door — encima de panda_baby, se va transparentando */}
              <motion.img src="/panda/onboarding_orb_door.png" alt=""
                animate={{ opacity: doorOpacity }}
                transition={{ duration:0.9 }}
                style={{ 
  position:'absolute', 
  top:'31%', left:'5%', 
  width:'100%', height:'100%', 
  objectFit:'contain', zIndex:3 
}}
                onError={()=>setImgErrs(e=>({...e,door:true}))}
              />

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PANDA BABY LIBRE — fase 6 ── */}
      <AnimatePresence>
        {showBorn && (
          <motion.div
            key="baby-born"
            initial={{ opacity:0, scale:0.6, y:40 }}
            animate={{ opacity:1, scale:1, y:0 }}
            transition={{ type:'spring', damping:14, stiffness:110, delay:0.2 }}
            style={{
              position:'fixed', zIndex:10,
              top:'50%', left:'50%',
              transform:'translate(-50%, -55%)',
              width:'min(55vw, 240px)',
              pointerEvents:'none',
            }}>
            <motion.div
              animate={{ scale:[1,1.1,1], opacity:[0.3,0.55,0.3] }}
              transition={{ duration:3, repeat:Infinity }}
              style={{
                position:'absolute', inset:'-20%', borderRadius:'50%',
                background:'radial-gradient(circle, rgba(255,180,100,0.6) 0%, transparent 70%)',
                filter:'blur(24px)',
              }}
            />
            <motion.img
              src="/panda/panda_baby.png" alt="Pandi libre"
              animate={{ y:[0,-10,0] }}
              transition={{ duration:3.5, repeat:Infinity, ease:'easeInOut' }}
              style={{ width:'100%', objectFit:'contain', position:'relative', zIndex:1 }}
              onError={()=>setImgErrs(e=>({...e,baby_born:true}))}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── DESTELLO ── */}
      <AnimatePresence>
        {flash && (
          <motion.div
            initial={{ opacity:0 }} animate={{ opacity:[0,1,0] }}
            transition={{ duration:0.6, times:[0,0.25,1] }}
            style={{ position:'fixed', inset:0, zIndex:50, background:'white', pointerEvents:'none' }}
          />
        )}
      </AnimatePresence>

      {/* ── UI ── */}
      <div style={{
        position:'fixed', bottom:0, left:0, right:0, zIndex:20,
        padding:'0 24px 48px',
        display:'flex', flexDirection:'column', alignItems:'center', gap:12,
      }}>

        {/* Label fase */}
        <AnimatePresence mode="wait">
          <motion.div key={phase}
            initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
            exit={{ opacity:0, y:-6 }} transition={{ duration:0.3 }}
            style={{
              background:'rgba(255,252,245,0.65)', backdropFilter:'blur(16px)',
              borderRadius:14, padding:'8px 18px', textAlign:'center',
            }}>
            <p style={{ fontSize:16, fontWeight:800, color:'#1A2332', margin:0 }}>
              {LABELS[phase]}
            </p>
            <p style={{ fontSize:10, color:'#6B7280', margin:'2px 0 0' }}>
              {phase + 1} / {LABELS.length}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Progreso */}
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

        {/* Botón */}
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

      {/* Debug errores de imagen */}
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
