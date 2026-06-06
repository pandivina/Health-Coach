import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── FASES ────────────────────────────────────────────────────────────────────
// 0: blanco → fade in onboarding_orb_baby_blur
// 1: sanctuary_open aparece + panda_orb vacío centrado
// 2: onboarding_clouds encima + panda_orb con interior_cerrado (borroso, 30% opacidad)
// 3: interior_cerrado 60% opacidad
// 4: interior_cerrado 90% opacidad  
// 5: resultado.png nítido
// 6: destello → panda_baby flotando

const PHASES = [
  { label: 'El comienzo',      bg: 'blur'     },
  { label: 'La puerta abre',   bg: 'open'     },
  { label: 'Primera energía',  bg: 'clouds'   },
  { label: 'Tomando forma',    bg: 'clouds'   },
  { label: 'Casi completo',    bg: 'clouds'   },
  { label: 'Ha despertado',    bg: 'clouds'   },
  { label: 'Nace',             bg: 'born'     },
]

export default function OnboardingDemo() {
  const [phase,   setPhase]   = useState(0)
  const [flash,   setFlash]   = useState(false)
  const [imgErrs, setImgErrs] = useState({})

  const isLast = phase === PHASES.length - 1

  function next() {
    if (phase === PHASES.length - 2) {
      // Destello antes del nacimiento
      setFlash(true)
      setTimeout(() => { setFlash(false); setPhase(p => p + 1) }, 700)
    } else if (!isLast) {
      setPhase(p => p + 1)
    }
  }

  function imgErr(key) {
    setImgErrs(e => ({ ...e, [key]: true }))
  }

  // Opacidad del bebé interior según fase
  const interiorOpacity = phase === 2 ? 0.35 : phase === 3 ? 0.65 : phase >= 4 ? 1 : 0
  const showInterior    = phase >= 2 && phase <= 4
  const showResultado   = phase === 5
  const showOrb         = phase >= 1 && phase <= 5
  const showBaby        = phase === 6

  return (
    <div style={{ position:'fixed', inset:0, overflow:'hidden', background:'#f5f0e8' }}>

      {/* ── CAPAS DE FONDO ── */}

      {/* 1. Blur inicial */}
      <motion.img src="/panda/onboarding_orb_baby_blur.png" alt=""
        animate={{ opacity: phase === 0 ? 1 : 0 }}
        transition={{ duration:1.5 }}
        style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', zIndex:1 }}
        onError={()=>imgErr('blur')}
      />

      {/* 2. Sanctuary open */}
      <motion.img src="/panda/onboarding_sanctuary_open.png" alt=""
        animate={{ opacity: phase >= 1 ? 1 : 0 }}
        transition={{ duration:1.8 }}
        style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', zIndex:2 }}
        onError={()=>imgErr('open')}
      />

      {/* 3. Clouds */}
      <motion.img src="/panda/onboarding_clouds.png" alt=""
        animate={{ opacity: phase >= 2 ? 1 : 0 }}
        transition={{ duration:1.8 }}
        style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', zIndex:3 }}
        onError={()=>imgErr('clouds')}
      />

      {/* ── ORB — centrado exactamente como en la imagen ── */}
      <AnimatePresence>
        {showOrb && (
          <motion.div
            key="orb-container"
            initial={{ opacity:0, scale:0.8, y:20 }}
            animate={{ opacity:1, scale:1, y:0 }}
            exit={{ opacity:0, scale:0.9 }}
            transition={{ duration:1.2, type:'spring', damping:20 }}
            style={{
              position:'fixed', zIndex:10,
              // Centrado absoluto
              top:'50%', left:'50%',
              transform:'translate(-50%, -52%)',
              // Tamaño: igual que en la imagen de referencia
              width: 'min(68vw, 320px)',
              aspectRatio: '0.78', // proporción de la imagen panda_orb (ancho/alto)
            }}>

            {/* Glow de fondo */}
            <motion.div
              animate={{ scale:[1,1.08,1], opacity:[0.3,0.55,0.3] }}
              transition={{ duration:3.5, repeat:Infinity, ease:'easeInOut' }}
              style={{
                position:'absolute',
                inset:'-15%',
                borderRadius:'50%',
                background:'radial-gradient(circle, rgba(255,220,140,0.6) 0%, transparent 65%)',
                filter:'blur(30px)',
              }}
            />

            {/* CAPA 1: panda_orb — el contenedor cristal */}
            <img src="/panda/panda_orb.png" alt=""
              style={{
                position:'absolute', inset:0,
                width:'100%', height:'100%',
                objectFit:'contain',
                zIndex:1,
              }}
              onError={()=>imgErr('orb')}
            />

            {/* CAPA 2: interior_cerrado — Pandi borrosa, aumenta opacidad */}
            <AnimatePresence>
              {showInterior && (
                <motion.img
                  key="interior"
                  src="/panda/interior_cerrado.png" alt=""
                  initial={{ opacity:0 }}
                  animate={{ opacity: interiorOpacity }}
                  exit={{ opacity:0 }}
                  transition={{ duration:0.9 }}
                  style={{
                    position:'absolute', inset:0,
                    width:'100%', height:'100%',
                    objectFit:'contain',
                    zIndex:2,
                    filter: phase === 2 ? 'blur(4px)' : phase === 3 ? 'blur(2px)' : 'blur(0px)',
                  }}
                  onError={()=>imgErr('interior')}
                />
              )}
            </AnimatePresence>

            {/* CAPA 3: resultado — Pandi nítida completa */}
            <AnimatePresence>
              {showResultado && (
                <motion.img
                  key="resultado"
                  src="/panda/resultado.png" alt=""
                  initial={{ opacity:0 }}
                  animate={{ opacity:1 }}
                  exit={{ opacity:0 }}
                  transition={{ duration:1.2 }}
                  style={{
                    position:'absolute', inset:0,
                    width:'100%', height:'100%',
                    objectFit:'contain',
                    zIndex:3,
                  }}
                  onError={()=>imgErr('resultado')}
                />
              )}
            </AnimatePresence>

          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PANDA BABY — tras el destello ── */}
      <AnimatePresence>
        {showBaby && (
          <motion.div
            key="baby"
            initial={{ opacity:0, scale:0.7, y:30 }}
            animate={{ opacity:1, scale:1, y:0 }}
            transition={{ type:'spring', damping:14, stiffness:120, delay:0.2 }}
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
                position:'absolute', inset:'-20%',
                borderRadius:'50%',
                background:'radial-gradient(circle, rgba(255,180,100,0.6) 0%, transparent 70%)',
                filter:'blur(24px)',
              }}
            />
            <motion.img
              src="/panda/panda_baby.png" alt="Pandi"
              animate={{ y:[0,-10,0] }}
              transition={{ duration:3.5, repeat:Infinity, ease:'easeInOut' }}
              style={{ width:'100%', objectFit:'contain', position:'relative', zIndex:1 }}
              onError={()=>imgErr('baby')}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── DESTELLO ── */}
      <AnimatePresence>
        {flash && (
          <motion.div
            initial={{ opacity:0 }} animate={{ opacity:[0,1,0] }}
            transition={{ duration:0.6, times:[0,0.3,1] }}
            style={{ position:'fixed', inset:0, zIndex:50, background:'white', pointerEvents:'none' }}
          />
        )}
      </AnimatePresence>

      {/* ── UI — texto + botón ── */}
      <div style={{
        position:'fixed', bottom:0, left:0, right:0, zIndex:20,
        padding:'0 24px 48px',
        display:'flex', flexDirection:'column', alignItems:'center', gap:12,
      }}>

        {/* Texto de fase */}
        <AnimatePresence mode="wait">
          <motion.div key={phase}
            initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
            exit={{ opacity:0, y:-8 }} transition={{ duration:0.3 }}
            style={{
              background:'rgba(255,252,245,0.6)',
              backdropFilter:'blur(16px)',
              borderRadius:16, padding:'10px 20px',
              textAlign:'center',
            }}>
            <p style={{ fontSize:18, fontWeight:900, color:'#1A2332', margin:0 }}>
              {PHASES[phase]?.label}
            </p>
            <p style={{ fontSize:11, color:'#6B7280', margin:'2px 0 0' }}>
              Fase {phase + 1} / {PHASES.length}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Progreso */}
        <div style={{ display:'flex', gap:6 }}>
          {PHASES.map((_,i) => (
            <motion.div key={i}
              animate={{
                width: i === phase ? 24 : 6,
                background: i < phase ? '#2EC4B6' : i === phase ? '#1A2332' : 'rgba(0,0,0,0.2)',
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
              width:'100%', maxWidth:400,
              padding:'15px 20px', borderRadius:16,
              background:'rgba(255,252,245,0.75)',
              backdropFilter:'blur(16px)',
              border:'1.5px solid rgba(255,255,255,0.6)',
              fontSize:15, fontWeight:700, color:'#1A2332',
              cursor:'pointer',
              boxShadow:'0 4px 20px rgba(0,0,0,0.08)',
            }}>
            Siguiente →
          </motion.button>
        ) : (
          <motion.div
            initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
            style={{ textAlign:'center' }}>
            <p style={{ fontSize:13, color:'rgba(255,255,255,0.8)', fontStyle:'italic', marginBottom:12,
              textShadow:'0 1px 8px rgba(0,0,0,0.3)' }}>
              "Ya estoy aquí. Ahora crecemos juntos."
            </p>
            <motion.button whileTap={{ scale:0.97 }}
              style={{
                padding:'15px 44px', borderRadius:20,
                background:'white', border:'none',
                fontSize:16, fontWeight:800, color:'#1A2332',
                cursor:'pointer', boxShadow:'0 8px 32px rgba(0,0,0,0.15)',
              }}>
              Empezar 🐾
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* Debug — mostrar qué imágenes fallaron */}
      {Object.keys(imgErrs).length > 0 && (
        <div style={{ position:'fixed', top:8, left:8, zIndex:100, background:'rgba(0,0,0,0.7)',
          borderRadius:8, padding:'6px 10px', fontSize:10, color:'#ff6b6b' }}>
          ❌ {Object.keys(imgErrs).join(', ')}
        </div>
      )}
    </div>
  )
}
