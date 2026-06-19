// ─── pages/Sanctuary.jsx ─────────────────────────────────────────────────────
// Módulo independiente del Santuario — separado de Mood
// Pandi vive aquí, se mueve por el espacio, puedes interactuar con ella
// Assets: sustituir paths de /sanctuary/ cuando estén listos

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Heart, Zap, Star } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useStore } from '../store/useStore'
import { useTheme } from '../contexts/ThemeProvider'

// ─── ASSETS ───────────────────────────────────────────────────────────────────
// Sustituye estos paths cuando tengas los PNGs listos
const ASSETS = {
  // Fondos del santuario (isométrico)
  bg_day:   '/sanctuary/bg_day.png',
  bg_night: '/sanctuary/bg_night.png',

  // Poses de Pandi — mismo estilo acuarela
  pandi: {
    idle:      '/panda/panda_base.png',        // sentada tranquila
    happy:     '/panda/avatar_happy.png',      // feliz/celebrando
    eating:    '/panda/panda_eating.png',      // comiendo (placeholder)
    sleeping:  '/panda/panda_sleeping.png',    // durmiendo
    playing:   '/panda/panda_playing.png',     // jugando
    meditating:'/panda/panda_meditating.png',  // meditando
    sad:       '/panda/panda_sad.png',         // triste (care bajo)
    walkL:     '/panda/panda_walk_l.png',      // caminando izquierda
    walkR:     '/panda/panda_walk_r.png',      // caminando derecha
  },

  // Objetos interactivos del santuario
  objects: {
    food_bowl:           '/sanctuary/obj_food_bowl.png',
    toy_ball:            '/sanctuary/obj_toy_ball.png',
    meditation_cushion:  '/sanctuary/obj_cushion.png',
    bonsai:              '/sanctuary/obj_bonsai.png',
  }
}

// ─── OBJETOS BASE DEL SANTUARIO ───────────────────────────────────────────────
const BASE_OBJECTS = [
  { id:'food_bowl',          label:'Cuenco',   emoji:'🍚', x:0.22, y:0.72, action:'feed'    },
  { id:'meditation_cushion', label:'Cojín',    emoji:'🧘', x:0.50, y:0.80, action:'meditate' },
  { id:'toy_ball',           label:'Juguete',  emoji:'⚽', x:0.78, y:0.72, action:'play'    },
  { id:'bonsai',             label:'Bonsái',   emoji:'🌳', x:0.15, y:0.45, action:null      },
]

// ─── HOOK DE MODO NOCHE ───────────────────────────────────────────────────────
function useNightMode() {
  const [isNight, setIsNight] = useState(() => {
    const h = new Date().getHours(); return h >= 22 || h < 7
  })
  useEffect(() => {
    const t = setInterval(() => {
      const h = new Date().getHours(); setIsNight(h >= 22 || h < 7)
    }, 60000)
    return () => clearInterval(t)
  }, [])
  return isNight
}

// ─── BARRA DE CUIDADO ─────────────────────────────────────────────────────────
function CareBar({ icon: Icon, value, color, label }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6, minWidth:0 }}>
      <Icon size={12} color={color} />
      <div style={{ flex:1, height:5, borderRadius:3, background:'rgba(255,255,255,0.2)', overflow:'hidden' }}>
        <motion.div animate={{ width:`${value}%` }} transition={{ duration:0.5 }}
          style={{ height:'100%', borderRadius:3, background:color }} />
      </div>
      <span style={{ fontSize:9, color:'rgba(255,255,255,0.7)', fontWeight:700, minWidth:24 }}>
        {Math.round(value)}
      </span>
    </div>
  )
}

// ─── OBJETO INTERACTIVO ───────────────────────────────────────────────────────
function SanctuaryObject({ obj, onTap, unlocked, pandiNear }) {
  if (!unlocked) return null
  return (
    <motion.button
      whileTap={{ scale:0.9 }}
      onClick={() => obj.action && onTap(obj)}
      animate={{ scale: pandiNear ? [1,1.08,1] : 1 }}
      transition={{ duration:1.2, repeat: pandiNear ? Infinity : 0 }}
      style={{
        position:'absolute',
        left:`${obj.x * 100}%`,
        top:`${obj.y * 100}%`,
        transform:'translate(-50%,-50%)',
        width:56, height:56,
        background:'none', border:'none', cursor: obj.action ? 'pointer' : 'default',
        display:'flex', flexDirection:'column', alignItems:'center', gap:2,
        zIndex:3,
      }}>
      <img src={ASSETS.objects[obj.id]} alt={obj.label}
        style={{ width:44, height:44, objectFit:'contain' }}
        onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='block' }} />
      <span style={{ fontSize:28, display:'none' }}>{obj.emoji}</span>
      {obj.action && (
        <span style={{ fontSize:9, color:'white', fontWeight:700,
          background:'rgba(0,0,0,0.4)', borderRadius:6, padding:'1px 5px' }}>
          {obj.label}
        </span>
      )}
    </motion.button>
  )
}

// ─── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────
export default function Sanctuary() {
  const { user, profile, addXP } = useStore()
  const { theme } = useTheme()
  const navigate = useNavigate()
  const isNight = useNightMode()

  // Cuidado de Pandi
  const [hunger,    setHunger]    = useState(profile?.pandi_hunger    ?? 80)
  const [energy,    setEnergy]    = useState(profile?.pandi_energy    ?? 80)
  const [happiness, setHappiness] = useState(profile?.pandi_happiness ?? 80)

  // Estado de Pandi
  const [pandiPos,   setPandiPos]   = useState({ x:0.5, y:0.55 })
  const [pandiFrame, setPandiFrame] = useState('idle')
  const [pandiFlip,  setPandiFlip]  = useState(false)
  const [toast,      setToast]      = useState(null)
  const [objects,    setObjects]    = useState(BASE_OBJECTS)

  const movingRef  = useRef(null)
  const containerRef = useRef(null)

  // ── Cargar estado de cuidado del perfil ────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return
    supabase.from('user_profiles')
      .select('pandi_hunger, pandi_energy, pandi_happiness, pandi_care_updated_at')
      .eq('id', user.id).single()
      .then(({ data }) => {
        if (!data) return
        // Calcular decaimiento desde la última vez que se abrió
        const lastUpdate = new Date(data.pandi_care_updated_at || Date.now())
        const hoursAgo = (Date.now() - lastUpdate) / (1000 * 60 * 60)
        const decay = Math.min(hoursAgo * 4, 40) // máx 40 puntos de decaimiento

        setHunger(Math.max((data.pandi_hunger ?? 80) - decay, 10))
        setEnergy(Math.max((data.pandi_energy ?? 80) - decay * 0.5, 10))
        setHappiness(Math.max((data.pandi_happiness ?? 80) - decay * 0.3, 10))
      })
  }, [user?.id])

  // ── Determinar frame según estado ─────────────────────────────────────────
  useEffect(() => {
    if (isNight) { setPandiFrame('sleeping'); return }
    if (hunger < 30) { setPandiFrame('sad'); return }
    if (happiness > 80) { setPandiFrame('happy'); return }
    if (pandiFrame !== 'eating' && pandiFrame !== 'playing' && pandiFrame !== 'meditating') {
      setPandiFrame('idle')
    }
  }, [hunger, energy, happiness, isNight])

  // ── Movimiento autónomo de Pandi ───────────────────────────────────────────
  useEffect(() => {
    if (isNight) return
    const wander = () => {
      const targets = [
        { x:0.35, y:0.52 }, { x:0.65, y:0.52 },
        { x:0.50, y:0.58 }, { x:0.40, y:0.48 }, { x:0.60, y:0.48 },
      ]
      const target = targets[Math.floor(Math.random() * targets.length)]
      setPandiFlip(target.x < pandiPos.x)
      setPandiFrame('walkR')
      setPandiPos(target)
      setTimeout(() => setPandiFrame('idle'), 1200)
    }
    movingRef.current = setInterval(wander, 5000 + Math.random() * 5000)
    return () => clearInterval(movingRef.current)
  }, [isNight])

  // ── Guardar cuidado en BD ─────────────────────────────────────────────────
  async function saveCare(h, e, hap) {
    if (!user?.id) return
    await supabase.from('user_profiles').update({
      pandi_hunger: Math.round(h),
      pandi_energy: Math.round(e),
      pandi_happiness: Math.round(hap),
      pandi_care_updated_at: new Date().toISOString(),
    }).eq('id', user.id)
  }

  // ── Acciones sobre los objetos ────────────────────────────────────────────
  async function handleObjectTap(obj) {
    // Mover Pandi hacia el objeto
    setPandiFlip(obj.x < pandiPos.x)
    setPandiPos({ x: obj.x, y: obj.y - 0.08 })
    clearInterval(movingRef.current)

    if (obj.action === 'feed') {
      if (hunger >= 95) { showToast('Ya está saciada 😄'); return }
      setPandiFrame('eating')
      const newH = Math.min(hunger + 25, 100)
      const newHap = Math.min(happiness + 10, 100)
      setHunger(newH); setHappiness(newHap)
      showToast('¡Pandi come feliz! 😋')
      addXP?.(5)
      await saveCare(newH, energy, newHap)
      setTimeout(() => setPandiFrame('idle'), 2500)
    }

    if (obj.action === 'play') {
      if (energy < 20) { showToast('Pandi está muy cansada 😴'); return }
      setPandiFrame('playing')
      const newE = Math.max(energy - 15, 0)
      const newHap = Math.min(happiness + 20, 100)
      setEnergy(newE); setHappiness(newHap)
      showToast('¡Pandi juega contigo! 🎉')
      addXP?.(10)
      await saveCare(hunger, newE, newHap)
      setTimeout(() => setPandiFrame('idle'), 2500)
    }

    if (obj.action === 'meditate') {
      setPandiFrame('meditating')
      const newE = Math.min(energy + 20, 100)
      const newHap = Math.min(happiness + 15, 100)
      setEnergy(newE); setHappiness(newHap)
      showToast('Pandi medita contigo 🧘')
      addXP?.(15)
      await saveCare(hunger, newE, newHap)
      setTimeout(() => setPandiFrame('idle'), 3000)
    }
  }

  function showToast(text) {
    setToast(text)
    setTimeout(() => setToast(null), 2500)
  }

  // ── Tap libre sobre el santuario — Pandi se acerca ────────────────────────
  function handleCanvasTap(e) {
    if (isNight) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    setPandiFlip(x < pandiPos.x)
    setPandiPos({ x, y })
    clearInterval(movingRef.current)
  }

  const careLevel = (hunger + energy + happiness) / 3
  const bgImage = isNight ? ASSETS.bg_night : ASSETS.bg_day

  return (
    <div style={{ height:'100dvh', display:'flex', flexDirection:'column', background:'#1a2438', overflow:'hidden' }}>

      {/* Header */}
      <div style={{ position:'relative', zIndex:10, display:'flex', alignItems:'center',
        justifyContent:'space-between', padding:'14px 16px',
        background:'linear-gradient(to bottom, rgba(0,0,0,0.4), transparent)' }}>
        <button onClick={() => navigate(-1)}
          style={{ width:36, height:36, borderRadius:12, border:'none', cursor:'pointer',
            background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center',
            justifyContent:'center', color:'white' }}>
          <ArrowLeft size={16} />
        </button>

        <p style={{ color:'white', fontSize:13, fontWeight:800,
          textTransform:'uppercase', letterSpacing:'.05em', opacity:0.8 }}>
          Tu Santuario
        </p>

        {/* Barras de cuidado */}
        <div style={{ display:'flex', flexDirection:'column', gap:4, width:110 }}>
          <CareBar icon={Heart}  value={hunger}    color='#FF8FA3' label='Hambre' />
          <CareBar icon={Zap}    value={energy}    color='#FCD34D' label='Energía' />
          <CareBar icon={Star}   value={happiness} color='#2EC4B6' label='Alegría' />
        </div>
      </div>

      {/* Canvas del santuario */}
      <div ref={containerRef}
        onClick={handleCanvasTap}
        style={{ flex:1, position:'relative', overflow:'hidden', cursor:'crosshair' }}>

        {/* Fondo */}
        <img src={bgImage} alt="Santuario"
          style={{ position:'absolute', inset:0, width:'100%', height:'100%',
            objectFit:'cover', objectPosition:'center bottom', zIndex:0 }}
          onError={e => e.target.style.background='linear-gradient(135deg,#e8f5ee,#c8e6c9)'} />

        {/* Overlay suave */}
        <div style={{ position:'absolute', inset:0, zIndex:1, pointerEvents:'none',
          background: isNight
            ? 'linear-gradient(to bottom, rgba(15,20,45,0.4) 0%, transparent 40%)'
            : 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, transparent 30%)' }} />

        {/* Objetos interactivos */}
        {objects.map(obj => (
          <SanctuaryObject key={obj.id} obj={obj} onTap={handleObjectTap}
            unlocked={true}
            pandiNear={Math.abs(pandiPos.x - obj.x) < 0.1 && pandiFrame === 'idle'} />
        ))}

        {/* Pandi */}
        <motion.div
          animate={{ left:`${pandiPos.x * 100}%`, top:`${pandiPos.y * 100}%` }}
          transition={{ duration:1.2, ease:'easeInOut' }}
          style={{ position:'absolute', transform:'translate(-50%,-100%)',
            zIndex:5, width:isMobileWidth() ? '22%' : '12%', maxWidth:120,
            pointerEvents:'none' }}>
          <motion.div
            animate={pandiFrame === 'idle' ? { y:[0,-4,0] } : {}}
            transition={{ duration:2.5, repeat:Infinity, ease:'easeInOut' }}>
            <img
              src={ASSETS.pandi[pandiFrame] || ASSETS.pandi.idle}
              alt="Pandi"
              style={{ width:'100%', height:'auto', objectFit:'contain',
                transform: pandiFlip ? 'scaleX(-1)' : 'scaleX(1)',
                filter:'drop-shadow(0 8px 16px rgba(0,0,0,0.3))' }}
              onError={e => { e.target.src = ASSETS.pandi.idle }}
            />
          </motion.div>
        </motion.div>

        {/* Toast de reacción */}
        <AnimatePresence>
          {toast && (
            <motion.div initial={{ opacity:0, y:20, x:'-50%' }} animate={{ opacity:1, y:0, x:'-50%' }}
              exit={{ opacity:0, y:-10 }}
              style={{ position:'absolute', bottom:'15%', left:'50%', zIndex:20,
                background:'rgba(255,255,255,0.95)', borderRadius:16, padding:'10px 18px',
                boxShadow:'0 8px 24px rgba(0,0,0,0.2)', fontSize:13, fontWeight:700, color:'#1A2332' }}>
              {toast}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Alerta de cuidado bajo */}
        {careLevel < 40 && !isNight && (
          <motion.div animate={{ opacity:[0.7,1,0.7] }} transition={{ duration:2, repeat:Infinity }}
            style={{ position:'absolute', top:'15%', left:'50%', transform:'translateX(-50%)',
              zIndex:15, background:'rgba(254,243,199,0.95)', borderRadius:14, padding:'8px 14px',
              display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:16 }}>💛</span>
            <p style={{ fontSize:11, fontWeight:700, color:'#92400E', margin:0 }}>
              Pandi te necesita
            </p>
          </motion.div>
        )}

        {/* Modo noche — Pandi durmiendo */}
        {isNight && (
          <motion.div animate={{ opacity:[0.6,1,0.6] }} transition={{ duration:3, repeat:Infinity }}
            style={{ position:'absolute', top:'18%', left:'50%', transform:'translateX(-50%)',
              zIndex:15, color:'rgba(255,255,255,0.6)', fontSize:11, fontWeight:700 }}>
            Pandi descansa 🌙
          </motion.div>
        )}
      </div>

      {/* Panel inferior de acciones rápidas */}
      <div style={{ background:'rgba(0,0,0,0.4)', backdropFilter:'blur(12px)',
        padding:'12px 20px', display:'flex', gap:10, justifyContent:'center' }}>
        {BASE_OBJECTS.filter(o => o.action).map(obj => (
          <motion.button key={obj.id} whileTap={{ scale:0.92 }}
            onClick={() => handleObjectTap(obj)}
            style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4,
              padding:'10px 14px', borderRadius:16, border:'none', cursor:'pointer',
              background:'rgba(255,255,255,0.12)', color:'white' }}>
            <span style={{ fontSize:22 }}>{obj.emoji}</span>
            <span style={{ fontSize:10, fontWeight:700 }}>{obj.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}

function isMobileWidth() {
  return typeof window !== 'undefined' && window.innerWidth < 768
}
