// ─── pages/Sanctuary.jsx ─────────────────────────────────────────────────────
// Santuario — mundo isométrico optimizado sin conflictos de hooks en producción.

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Heart, Zap, Star, Settings, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useStore } from '../store/useStore'

const ASSETS = {
  bg_day:   '/sanctuary/bg_day.png',
  bg_night: '/sanctuary/bg_night.png',
  pandi: {
    idle:      '/panda/panda_base.png',
    happy:     '/panda/avatar_happy.png',
    eating:    '/panda/panda_eating.png',
    sleeping:  '/panda/panda_sleeping.png',
    playing:   '/panda/panda_playing.png',
    sad:       '/panda/panda_sad.png',
    walkL:     '/panda/panda_walk_l.png',
    walkR:     '/panda/panda_walk_r.png',
    meditating:'/panda/panda_meditating.png',
    sitting:   '/panda/panda_sitting.png',
    looking:   '/panda/panda_looking.png',
    laydown:   '/panda/panda_laydown.png',
  },
}

const WORLD_W = 1200
const WORLD_H = 800

const PLAY_DIAMOND = {
  top:   { wx:623,  wy:201 },
  right: { wx:1118, wy:510 },
  bottom:{ wx:595,  wy:815 },
  left:  { wx:90,   wy:516 },
}

const WATER_DIAMOND = {
  top:   { wx:604,  wy:259 },
  right: { wx:887,  wy:423 },
  bottom:{ wx:605,  wy:589 },
  left:  { wx:324,  wy:419 },
}

function getDiamondCenter(d) {
  return {
    cx: (d.left.wx + d.right.wx) / 2,
    cy: (d.top.wy  + d.bottom.wy) / 2,
    hw: (d.right.wx - d.left.wx) / 2,
    hh: (d.bottom.wy - d.top.wy) / 2,
  }
}

function isInDiamond(wx, wy, diamond = PLAY_DIAMOND) {
  const { cx, cy, hw, hh } = getDiamondCenter(diamond)
  return (Math.abs(wx - cx) / hw) + (Math.abs(wy - cy) / hh) <= 1
}

function clampToDiamond(wx, wy, diamond = PLAY_DIAMOND) {
  if (isInDiamond(wx, wy, diamond)) return { wx, wy }
  const { cx, cy, hw, hh } = getDiamondCenter(diamond)
  const margin = 0.93
  const dx = wx - cx, dy = wy - cy
  const factor = margin / ((Math.abs(dx) / hw) + (Math.abs(dy) / hh))
  return { wx: Math.round(cx + dx * factor), wy: Math.round(cy + dy * factor) }
}

function isInWater(wx, wy) {
  return isInDiamond(wx, wy, WATER_DIAMOND)
}

function avoidWater(wx, wy) {
  const safe = clampToDiamond(wx, wy)
  let wx2 = safe.wx; let wy2 = safe.wy
  if (!isInWater(wx2, wy2)) return { wx: wx2, wy: wy2 }
  const { cx, cy, hw, hh } = getDiamondCenter(WATER_DIAMOND)
  const margin = 1.08 
  const dx = wx2 - cx, dy = wy2 - cy
  const norm = (Math.abs(dx) / hw) + (Math.abs(dy) / hh)
  const factor = margin / norm
  const pushed = { wx: Math.round(cx + dx * factor), wy: Math.round(cy + dy * factor) }
  return clampToDiamond(pushed.wx, pushed.wy)
}

const DEFAULT_ZONES = [
  { id:'bed',      label:'Cama',     emoji:'🛏️', wx:600, wy:340, frame:'sleeping',   action:'sleep',    color:'#818CF8' },
  { id:'food',     label:'Cuenco',   emoji:'🍚', wx:280, wy:520, frame:'eating',     action:'feed',     color:'#F97316' },
  { id:'toy',      label:'Juguete',  emoji:'⚽', wx:920, wy:520, frame:'playing',    action:'play',     color:'#2EC4B6' },
  { id:'meditate', label:'Meditar',  emoji:'🧘', wx:600, wy:560, frame:'meditating', action:'meditate', color:'#A78BFA' },
  { id:'sit',      label:'Sentarse', emoji:'🪑', wx:380, wy:420, frame:'sitting',    action:'sit',      color:'#34D399' },
  { id:'look',     label:'Mirar',    emoji:'👀', wx:820, wy:380, frame:'looking',    action:'look',     color:'#60A5FA' },
  { id:'laydown',  label:'Tumbarse', emoji:'😴', wx:200, wy:350, frame:'laydown',    action:'laydown',  color:'#F472B6' },
]

const INTRO_KEY = 'sanctuary_intro_done'
const ZONES_KEY = 'sanctuary_zones_v2'

export default function Sanctuary() {
  const { user, profile, addXP } = useStore()
  const navigate = useNavigate()
  
  // Referencias obligatorias para el pan y movimiento
  const worldRef = useRef(null)
  const pressRef = useRef(null)
  const movingRef = useRef(null)
  const panStart = useRef(null)
  const isDragging = useRef(null)
  const offsetRef = useRef({ x: 0, y: 0 })
  const pandiPosRef = useRef({ wx: 600, wy: 500 })
  const moveDurationRef = useRef(1.2)
  const draggingZoneId = useRef(null)

  // 1. Estados iniciales ordenados de forma secuencial limpia
  const [showIntro, setShowIntro] = useState(() => {
    try { return !localStorage.getItem(INTRO_KEY) } catch { return true }
  })
  const [isNight, setIsNight] = useState(() => {
    const h = new Date().getHours()
    return h >= 22 || h < 7
  })
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [zones, setZones] = useState(() => {
    try { const s = localStorage.getItem(ZONES_KEY); return s ? JSON.parse(s) : DEFAULT_ZONES } catch { return DEFAULT_ZONES }
  })
  const [editMode, setEditMode] = useState(false)
  const [zoomZone, setZoomZone] = useState(null)
  const [pandiPos, setPandiPos] = useState(() => {
    const z = DEFAULT_ZONES[Math.floor(Math.random() * DEFAULT_ZONES.length)]
    return { wx: z.wx, wy: z.wy }
  })
  const [pandiFrame, setPandiFrame] = useState('idle')
  const [pandiFlip, setPandiFlip] = useState(false)
  const [toast, setToast] = useState(null)
  const [meditatingActive, setMeditatingActive] = useState(false)

  // Mapeo directo de valores del perfil de usuario
  const hunger = profile?.pandi_hunger ?? 80
  const energy = profile?.pandi_energy ?? 80
  const happiness = profile?.pandi_happiness ?? 80

  // 2. Efectos síncronos y asíncronos unificados
  useEffect(() => {
    const t = setInterval(() => {
      const h = new Date().getHours()
      setIsNight(h >= 22 || h < 7)
    }, 60000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const vw = window.innerWidth, vh = window.innerHeight
    const ox = (vw - WORLD_W) / 2
    const oy = (vh - WORLD_H) / 2
    offsetRef.current = { x: ox, y: oy }
    setOffset({ x: ox, y: oy })
    if (worldRef.current) {
      worldRef.current.style.transform = `translate(${ox}px,${oy}px)`
    }
  }, [])

  useEffect(() => {
    if (isNight) {
      const bed = zones.find(z => z.id === 'bed')
      if (bed) { setPandiPos({ wx: bed.wx, wy: bed.wy }); setPandiFrame('sleeping') }
      return
    }
    if (['eating', 'playing'].includes(pandiFrame)) return
    setPandiFrame(hunger < 30 ? 'sad' : 'idle')
  }, [isNight, hunger])

  useEffect(() => {
    if (isNight || editMode) return
    const wander = () => {
      const z = zones[Math.floor(Math.random() * zones.length)]
      if (z) movePandi(z.wx, z.wy, () => setPandiFrame(z.frame))
    }
    movingRef.current = setInterval(wander, 8000 + Math.random() * 6000)
    return () => clearInterval(movingRef.current)
  }, [isNight, editMode, zones])

  // Lógica de movimiento de Pandi
  function movePandi(targetWx, targetWy, onArrive) {
    const safe = avoidWater(targetWx, targetWy)
    const cur = pandiPosRef.current
    const goingLeft = safe.wx < cur.wx
    setPandiFlip(goingLeft)
    setPandiFrame(goingLeft ? 'walkL' : 'walkR')

    const dist = Math.sqrt(Math.pow(safe.wx - cur.wx, 2) + Math.pow(safe.wy - cur.wy, 2))
    const duration = Math.min(Math.max(dist / 300, 1), 3)

    pandiPosRef.current = { wx: safe.wx, wy: safe.wy }
    setPandiPos({ wx: safe.wx, wy: safe.wy })
    moveDurationRef.current = duration
    setTimeout(() => {
      setPandiFrame('idle')
      onArrive?.()
    }, duration * 1000)
  }

  // Interacciones táctiles del escenario
  function onPointerDown(e) {
    if (draggingZoneId.current) return
    panStart.current = { x: e.clientX, y: e.clientY, ox: offsetRef.current.x, oy: offsetRef.current.y }
    isDragging.current = false
  }

  function onPointerMove(e) {
    if (!panStart.current || draggingZoneId.current) return
    const dx = e.clientX - panStart.current.x
    const dy = e.clientY - panStart.current.y
    if (Math.abs(dx) + Math.abs(dy) > 4) isDragging.current = true
    if (isDragging.current) {
      const ox = panStart.current.ox + dx
      const oy = panStart.current.oy + dy
      const vw = window.innerWidth, vh = window.innerHeight
      const cx = Math.min(Math.max(ox, Math.min(0, vw - WORLD_W)), Math.max(0, vw - WORLD_W))
      const cy = Math.min(Math.max(oy, Math.min(0, vh - WORLD_H)), Math.max(0, vh - WORLD_H))
      offsetRef.current = { x: cx, y: cy }
      if (worldRef.current) worldRef.current.style.transform = `translate(${cx}px,${cy}px)`
    }
  }

  function onPointerUp(e) {
    if (!panStart.current) return
    if (!isDragging.current) {
      setOffset({ ...offsetRef.current })
      const wx = e.clientX - offsetRef.current.x
      const wy = e.clientY - offsetRef.current.y

      if (!editMode && !isNight && !zoomZone) {
        let nearest = null, minDist = 80
        zones.forEach(z => {
          const d = Math.sqrt(Math.pow(wx - z.wx, 2) + Math.pow(wy - z.wy, 2))
          if (d < minDist) { minDist = d; nearest = z }
        })
        if (nearest) { setZoomZone(nearest) } else {
          clearInterval(movingRef.current)
          setMeditatingActive(false)
          movePandi(wx, wy, () => setPandiFrame('idle'))
        }
      }
    }
    panStart.current = null
    isDragging.current = false
  }

  // Gestión del modo edición
  function onZoneDragStart(e, zoneId) {
    e.stopPropagation()
    e.preventDefault()
    draggingZoneId.current = zoneId
    panStart.current = null
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch {}
  }

  function onZoneDragMove(e) {
    if (!draggingZoneId.current) return
    e.stopPropagation()
    const wx = e.clientX - offset.x
    const wy = e.clientY - offset.y
    const id = draggingZoneId.current
    setZones(zs => zs.map(z => z.id === id
      ? { ...z, wx: Math.max(40, Math.min(wx, WORLD_W - 40)), wy: Math.max(40, Math.min(wy, WORLD_H - 40)) }
      : z
    ))
  }

  function onZoneDragEnd(e) {
    if (!draggingZoneId.current) return
    e.stopPropagation()
    draggingZoneId.current = null
  }

  async function triggerZoneAction(zone) {
    setMeditatingActive(false)
    clearInterval(movingRef.current)
    movePandi(zone.wx, zone.wy, async () => {
      setPandiFrame(zone.frame)
      if (zone.action === 'feed') {
        const h = Math.min(hunger + 25, 100), hap = Math.min(happiness + 10, 100)
        showToast('¡Pandi come feliz! 😋'); addXP?.(5); await saveCare(h, energy, hap)
        setTimeout(() => setPandiFrame('idle'), 2500)
      }
      if (zone.action === 'play') {
        const e2 = Math.max(energy - 15, 0), hap = Math.min(happiness + 20, 100)
        showToast('¡Pandi juega contigo! 🎉'); addXP?.(10); await saveCare(hunger, e2, hap)
        setTimeout(() => setPandiFrame('idle'), 2500)
      }
      if (zone.action === 'sleep') {
        const e2 = Math.min(energy + 20, 100)
        showToast('Pandi descansa 💤'); addXP?.(5); await saveCare(hunger, e2, happiness)
        setTimeout(() => setPandiFrame('idle'), 3000)
      }
      if (zone.action === 'meditate') {
        const hap = Math.min(happiness + 15, 100), e2 = Math.min(energy + 10, 100)
        showToast('Pandi medita... Tócala para unirte 🧘'); addXP?.(8); await saveCare(hunger, e2, hap)
        setMeditatingActive(true)
      }
      if (zone.action === 'sit') {
        showToast('Pandi se sienta tranquila 🪑')
        setTimeout(() => setPandiFrame('idle'), 3000)
      }
      if (zone.action === 'look') {
        showToast('Pandi observa el santuario 👀')
        setTimeout(() => { setPandiFrame('happy'); setTimeout(() => setPandiFrame('idle'), 1500) }, 2000)
      }
      if (zone.action === 'laydown') {
        const e2 = Math.min(energy + 10, 100)
        showToast('Pandi se tumba a descansar 😴'); addXP?.(3); await saveCare(hunger, e2, happiness)
        setTimeout(() => setPandiFrame('idle'), 4000)
      }
    })
  }

  async function saveCare(h, e, hap) {
    if (!user?.id) return
    await supabase.from('user_profiles').update({
      pandi_hunger: Math.round(h), pandi_energy: Math.round(e),
      pandi_happiness: Math.round(hap), pandi_care_updated_at: new Date().toISOString()
    }).eq('id', user.id)
  }

  function showToast(t) { setToast(t); setTimeout(() => setToast(null), 2500) }
  function saveEdit() { try { localStorage.setItem(ZONES_KEY, JSON.stringify(zones)) } catch {} setEditMode(false); showToast('Zonas guardadas ✓') }

  const careLevel = (hunger + energy + happiness) / 3
  const bgImage = isNight ? ASSETS.bg_night : ASSETS.bg_day

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0f1612', overflow: 'hidden', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 56px)' }}
      onPointerDown={showIntro ? undefined : onPointerDown}
      onPointerMove={showIntro ? undefined : e => { onPointerMove(e); onZoneDragMove(e) }}
      onPointerUp={showIntro ? undefined : e => { onPointerUp(e); onZoneDragEnd() }}
      onPointerLeave={showIntro ? undefined : onZoneDragEnd}>

      <AnimatePresence>
        {showIntro && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(15,20,28,0.75)', backdropFilter: 'blur(6px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center', gap: 20 }}>
            <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} style={{ fontSize: 56 }}>📱</motion.div>
            <div>
              <p style={{ color: 'white', fontSize: 18, fontWeight: 800, margin: '0 0 8px' }}>Gira tu móvil</p>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: 0, lineHeight: 1.5 }}>El Santuario se disfruta mejor<br />en horizontal</p>
            </div>
            <button onClick={() => { try { localStorage.setItem(INTRO_KEY, '1') } catch {} ; setShowIntro(false) }} style={{ marginTop: 8, padding: '14px 36px', borderRadius: 20, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#2EC4B6,#86EFAC)', color: 'white', fontWeight: 800, fontSize: 15, boxShadow: '0 8px 24px rgba(46,196,182,0.4)' }}>✨ Iniciar Santuario</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={worldRef} style={{ position: 'absolute', left: 0, top: 0, transform: `translate(${offset.x}px,${offset.y}px)`, width: WORLD_W, height: WORLD_H, userSelect: 'none', willChange: 'transform' }}>
        <img src={bgImage} alt="Santuario" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', zIndex: 0, pointerEvents: 'none' }} onError={e => e.target.style.background = '#1a2438'} />

        {!editMode && zones.map(z => (
          <div key={z.id} style={{ position: 'absolute', left: z.wx, top: z.wy, transform: 'translate(-50%,-50%)', zIndex: 3, pointerEvents: 'none' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: z.color, opacity: 0.6, boxShadow: `0 0 10px ${z.color}` }} />
          </div>
        ))}

        {editMode && zones.map(z => (
          <div key={z.id} onPointerDown={e => onZoneDragStart(e, z.id)} onPointerMove={onZoneDragMove} onPointerUp={onZoneDragEnd} onPointerCancel={onZoneDragEnd} style={{ position: 'absolute', left: z.wx, top: z.wy, transform: 'translate(-50%,-50%)', zIndex: 20, cursor: 'grab', touchAction: 'none', userSelect: 'none' }}>
            <div style={{ position: 'absolute', width: 100, height: 100, borderRadius: '50%', border: `2px dashed ${z.color}`, background: `${z.color}15`, transform: 'translate(-50%,-50%)', top: '50%', left: '50%', pointerEvents: 'none' }} />
            <div style={{ width: 44, height: 44, borderRadius: 14, background: z.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, boxShadow: `0 4px 16px ${z.color}70`, position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}>{z.emoji}</div>
            <div style={{ position: 'absolute', top: 'calc(50% + 30px)', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.7)', borderRadius: 8, padding: '2px 10px', fontSize: 11, fontWeight: 700, color: 'white', whiteSpace: 'nowrap' }}>{z.label}</div>
          </div>
        ))}

        <motion.div animate={{ left: pandiPos.wx, top: pandiPos.wy }} transition={{ duration: moveDurationRef.current, ease: 'linear' }} onClick={() => { if (meditatingActive) navigate('/mood') }} style={{ position: 'absolute', transform: 'translate(-50%,-100%)', zIndex: 5, width: 100, cursor: meditatingActive ? 'pointer' : 'default' }}>
          <motion.div animate={pandiFrame === 'idle' ? { y: [0, -5, 0] } : {}} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}>
            {meditatingActive && (
              <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity }} style={{ position: 'absolute', top: -28, left: '50%', transform: 'translateX(-50%)', background: '#A78BFA', borderRadius: 10, padding: '3px 8px', fontSize: 9, fontWeight: 800, color: 'white', whiteSpace: 'nowrap', zIndex: 10 }}>Tócame para meditar juntos</motion.div>
            )}
            <img src={ASSETS.pandi[pandiFrame] || ASSETS.pandi.idle} alt="Pandi" style={{ width: '100%', height: 'auto', objectFit: 'contain', transform: pandiFlip ? 'scaleX(-1)' : 'scaleX(1)', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.35))' }} onError={e => { e.target.src = ASSETS.pandi.idle }} />
          </motion.div>
        </motion.div>

        <AnimatePresence>
          {toast && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ position: 'absolute', left: pandiPos.wx, top: pandiPos.wy - 120, transform: 'translateX(-50%)', zIndex: 15, background: 'rgba(255,255,255,0.95)', borderRadius: 14, padding: '8px 16px', boxShadow: '0 8px 20px rgba(0,0,0,0.2)', fontSize: 13, fontWeight: 700, color: '#1A2332', whiteSpace: 'nowrap' }}>{toast}</motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* HUD FLOTANTE - INTEGRADO INLINE SIN RENDERIZADO CONDICIONAL DE HOOKS */}
      <div style={{ position: 'fixed', top: 12, left: 12, zIndex: 50, display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={() => navigate(-1)} style={{ width: 36, height: 36, borderRadius: 12, border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={16} color='#1A2332' />
        </button>
        {editMode && (
          <div style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)', borderRadius: 12, padding: '6px 12px' }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: '#1A2332', margin: 0 }}>✏️ Arrastra las zonas</p>
          </div>
        )}
      </div>

      <div style={{ position: 'fixed', top: 12, right: 12, zIndex: 50, background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(12px)', borderRadius: 16, padding: '10px 14px', minWidth: 160, boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
        <p style={{ fontSize: 9, fontWeight: 900, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.08em', margin: '0 0 8px' }}>Pet Care</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* Barra Hambre */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Heart size={12} color='#FF8FA3' />
            <div style={{ width: 70, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.2)', overflow: 'hidden' }}>
              <motion.div animate={{ width: `${hunger}%` }} transition={{ duration: 0.5 }} style={{ height: '100%', borderRadius: 3, background: '#FF8FA3' }} />
            </div>
            <span style={{ fontSize: 10, color: 'rgba(0,0,0,0.6)', fontWeight: 700, minWidth: 24 }}>{Math.round(hunger)}</span>
          </div>
          {/* Barra Energía */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Zap size={12} color='#FCD34D' />
            <div style={{ width: 70, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.2)', overflow: 'hidden' }}>
              <motion.div animate={{ width: `${energy}%` }} transition={{ duration: 0.5 }} style={{ height: '100%', borderRadius: 3, background: '#FCD34D' }} />
            </div>
            <span style={{ fontSize: 10, color: 'rgba(0,0,0,0.6)', fontWeight: 700, minWidth: 24 }}>{Math.round(energy)}</span>
          </div>
          {/* Barra Felicidad */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Star size={12} color='#2EC4B6' />
            <div style={{ width: 70, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.2)', overflow: 'hidden' }}>
              <motion.div animate={{ width: `${happiness}%` }} transition={{ duration: 0.5 }} style={{ height: '100%', borderRadius: 3, background: '#2EC4B6' }} />
            </div>
            <span style={{ fontSize: 10, color: 'rgba(0,0,0,0.6)', fontWeight: 700, minWidth: 24 }}>{Math.round(happiness)}</span>
          </div>
        </div>
      </div>

      <div style={{ position: 'fixed', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 68px)', left: 12, zIndex: 50 }}>
        {editMode ? (
          <button onClick={saveEdit} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 20px', borderRadius: 16, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#2EC4B6,#86EFAC)', color: 'white', fontWeight: 800, fontSize: 13, boxShadow: '0 4px 16px rgba(46,196,182,0.4)' }}>
            <Check size={15} /> Guardar zonas
          </button>
        ) : (
          <div style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(12px)', borderRadius: 16, padding: '8px', display: 'flex', gap: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
            <p style={{ position: 'absolute', top: -18, left: 4, fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '.08em', margin: 0 }}>Inventario</p>
            {zones.filter(z => z.action).map(z => (
              <button key={z.id} onClick={() => setZoomZone(z)} style={{ width: 52, height: 52, borderRadius: 12, border: 'none', cursor: 'pointer', background: `${z.color}18`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                <span style={{ fontSize: 22 }}>{z.emoji}</span>
                <span style={{ fontSize: 8, fontWeight: 700, color: '#1A2332' }}>{z.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ position: 'fixed', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 68px)', right: 12, zIndex: 50, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div onDoubleClick={e => { e.stopPropagation(); setEditMode(true) }} onPointerDown={e => { e.stopPropagation(); pressRef.current = setTimeout(() => setEditMode(true), 1500) }} onPointerUp={() => clearTimeout(pressRef.current)} onPointerLeave={() => clearTimeout(pressRef.current)} title="Mantén pulsado o doble clic para editar" style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', cursor: 'pointer' }}>
          <Settings size={16} color='#6B7280' />
        </div>
        <button onClick={() => { try { localStorage.removeItem(ZONES_KEY) } catch {} ; setZones(DEFAULT_ZONES); showToast('Zonas reseteadas ✓') }} title="Resetear zonas" style={{ width: 42, height: 42, borderRadius: 12, border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', fontSize: 18 }}>🔄</button>
      </div>

      {careLevel < 40 && !isNight && !editMode && (
        <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 51, background: 'rgba(254,243,199,0.95)', backdropFilter: 'blur(8px)', borderRadius: 14, padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <span>💛</span>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#92400E', margin: 0 }}>Pandi te necesita</p>
        </div>
      )}

      {isNight && (
        <div style={{ position: 'fixed', top: 60, left: '50%', transform: 'translateX(-50%)', zIndex: 51, background: 'rgba(15,20,45,0.7)', backdropFilter: 'blur(8px)', borderRadius: 14, padding: '7px 14px' }}>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 700, margin: 0 }}>Pandi descansa 🌙</p>
        </div>
      )}

      <AnimatePresence>
        {zoomZone && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setZoomZone(null)}>
            <div style={{ background: 'white', borderRadius: 28, padding: '28px 24px', textAlign: 'center', minWidth: 220, maxWidth: 300, boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }} onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: 64, marginBottom: 12 }}>{zoomZone.emoji}</div>
              <p style={{ fontSize: 16, fontWeight: 800, color: '#1A2332', margin: '0 0 6px' }}>{zoomZone.label}</p>
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button onClick={() => setZoomZone(null)} style={{ flex: 1, padding: '11px', borderRadius: 14, border: 'none', cursor: 'pointer', background: '#F3F4F6', color: '#6B7280', fontWeight: 700, fontSize: 13 }}>Ahora no</button>
                <button onClick={() => { const z = zoomZone; setZoomZone(null); triggerZoneAction(z) }} style={{ flex: 1, padding: '11px', borderRadius: 14, border: 'none', cursor: 'pointer', background: zoomZone.color, color: 'white', fontWeight: 700, fontSize: 13 }}>¡Vamos!</button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}