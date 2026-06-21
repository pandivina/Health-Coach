// ─── pages/Sanctuary.jsx ─────────────────────────────────────────────────────
// Santuario — Ajustado al 100% de la pantalla, ultra-fluido y libre de errores.

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

const BASE_W = 1200
const BASE_H = 800

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

const ZONES_KEY = 'sanctuary_zones_v2'
function loadZones() {
  try { const s = localStorage.getItem(ZONES_KEY); return s ? JSON.parse(s) : DEFAULT_ZONES }
  catch { return DEFAULT_ZONES }
}
function saveZones(z) { try { localStorage.setItem(ZONES_KEY, JSON.stringify(z)) } catch {} }

function useNightMode() {
  const [isNight, setIsNight] = useState(() => { const h=new Date().getHours(); return h>=22||h<7 })
  useEffect(() => {
    const t = setInterval(() => { const h=new Date().getHours(); setIsNight(h>=22||h<7) }, 60000)
    return () => clearInterval(t)
  }, [])
  return isNight
}

function CareBar({ icon: Icon, value = 80, color }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:5 }}>
      <Icon size={12} color={color} />
      <div style={{ width:70, height:5, borderRadius:3, background:'rgba(255,255,255,0.2)', overflow:'hidden' }}>
        <motion.div animate={{ width:`${value}%` }} transition={{ duration:0.5 }}
          style={{ height:'100%', borderRadius:3, background:color }} />
      </div>
      <span style={{ fontSize:10, color:'rgba(255,255,255,0.7)', fontWeight:700, minWidth:24 }}>
        {Math.round(value)}
      </span>
    </div>
  )
}

function ObjectPopup({ zone, onClose, onInteract }) {
  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      style={{ position:'fixed', inset:0, zIndex:10005, background:'rgba(0,0,0,0.55)',
        backdropFilter:'blur(3px)', display:'flex', alignItems:'center', justifyContent:'center' }}
      onClick={onClose}>
      <motion.div initial={{ scale:0.7, opacity:0 }} animate={{ scale:1, opacity:1 }}
        exit={{ scale:0.7, opacity:0 }} transition={{ type:'spring', damping:22, stiffness:280 }}
        onClick={e => e.stopPropagation()}
        style={{ background:'white', borderRadius:28, padding:'28px 24px', textAlign:'center',
          minWidth:220, maxWidth:300, boxShadow:'0 20px 60px rgba(0,0,0,0.4)' }}>
        <div style={{ fontSize:64, marginBottom:12 }}>{zone.emoji}</div>
        <p style={{ fontSize:16, fontWeight:800, color:'#1A2332', margin:'0 0 6px' }}>{zone.label}</p>
        <div style={{ display:'flex', gap:10, marginTop:20 }}>
          <button onClick={onClose}
            style={{ flex:1, padding:'11px', borderRadius:14, border:'none', cursor:'pointer',
              background:'#F3F4F6', color:'#6B7280', fontWeight:700, fontSize:13 }}>
            Ahora no
          </button>
          <button onClick={() => { onInteract(zone); onClose() }}
            style={{ flex:1, padding:'11px', borderRadius:14, border:'none', cursor:'pointer',
              background:zone.color, color:'white', fontWeight:700, fontSize:13 }}>
            ¡Vamos!
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function Sanctuary() {
  const { user, profile, addXP } = useStore()
  const navigate   = useNavigate()
  const isNight    = useNightMode()
  const movingRef  = useRef(null)

  const [isLandscape, setIsLandscape] = useState(() => window.innerWidth > window.innerHeight)
  const [dimensions, setDimensions] = useState({ w: window.innerWidth, h: window.innerHeight })
  const [zones, setZones] = useState(loadZones)
  const [editMode, setEditMode] = useState(false)
  const [zoomZone, setZoomZone] = useState(null)

  const [pandiPos, setPandiPos] = useState({ wx: 600, wy: 500 })
  const pandiPosRef = useRef({ wx: 600, wy: 500 })
  const [pandiFrame, setPandiFrame] = useState('idle')
  const [pandiFlip, setPandiFlip] = useState(false)

  const [hunger, setHunger] = useState(() => profile?.pandi_hunger ?? 80)
  const [energy, setEnergy] = useState(() => profile?.pandi_energy ?? 80)
  const [happiness, setHappiness] = useState(() => profile?.pandi_happiness ?? 80)
  const [toast, setToast] = useState(null)
  const [meditatingActive, setMeditatingActive] = useState(false)
  const moveDurationRef = useRef(1.2)

  useEffect(() => {
    if (screen.orientation && screen.orientation.lock) {
      screen.orientation.lock('landscape').catch(() => {})
    }
    const handleResize = () => {
      setIsLandscape(window.innerWidth > window.innerHeight)
      setDimensions({ w: window.innerWidth, h: window.innerHeight })
    }
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  function movePandi(targetWx, targetWy, onArrive) {
    const safe = avoidWater(targetWx, targetWy)
    const cur = pandiPosRef.current
    const goingLeft = safe.wx < cur.wx
    setPandiFlip(goingLeft)
    setPandiFrame(goingLeft ? 'walkL' : 'walkR')

    const dist = Math.sqrt(Math.pow(safe.wx - cur.wx, 2) + Math.pow(safe.wy - cur.wy, 2))
    const duration = Math.min(Math.max(dist / 250, 0.8), 2.5)

    pandiPosRef.current = { wx: safe.wx, wy: safe.wy }
    setPandiPos({ wx: safe.wx, wy: safe.wy })
    moveDurationRef.current = duration
    setTimeout(() => {
      setPandiFrame('idle')
      onArrive?.()
    }, duration * 1000)
  }

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
    movingRef.current = setInterval(wander, 9000 + Math.random() * 5000)
    return () => clearInterval(movingRef.current)
  }, [isNight, editMode, zones])

  function handleScreenTap(e) {
    if (editMode || isNight || zoomZone) return

    const vw = !isLandscape ? dimensions.h : dimensions.w
    const vh = !isLandscape ? dimensions.w : dimensions.h

    let clientX = e.clientX
    let clientY = e.clientY

    if (!isLandscape) {
      clientX = e.clientY
      clientY = dimensions.w - e.clientX
    }

    const logicalWx = (clientX / (vw || 1)) * BASE_W
    const logicalWy = (clientY / (vh || 1)) * BASE_H

    let nearest = null, minDist = 65
    zones.forEach(z => {
      const d = Math.sqrt(Math.pow(logicalWx - z.wx, 2) + Math.pow(logicalWy - z.wy, 2))
      if (d < minDist) { minDist = d; nearest = z }
    })

    if (nearest) { setZoomZone(nearest); return }

    clearInterval(movingRef.current)
    setMeditatingActive(false)
    movePandi(logicalWx, logicalWy, () => setPandiFrame('idle'))
  }

  const draggingZoneId = useRef(null)
  function onZoneDragStart(e, zoneId) {
    e.stopPropagation()
    draggingZoneId.current = zoneId
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch {}
  }

  function onZoneDragMove(e) {
    if (!draggingZoneId.current) return
    const vw = !isLandscape ? dimensions.h : dimensions.w
    const vh = !isLandscape ? dimensions.w : dimensions.h

    let clientX = e.clientX
    let clientY = e.clientY
    if (!isLandscape) {
      clientX = e.clientY
      clientY = dimensions.w - e.clientX
    }

    const logicalWx = (clientX / (vw || 1)) * BASE_W
    const logicalWy = (clientY / (vh || 1)) * BASE_H
    const id = draggingZoneId.current

    setZones(zs => zs.map(z => z.id === id
      ? { ...z, wx: Math.max(40, Math.min(logicalWx, BASE_W - 40)), wy: Math.max(40, Math.min(logicalWy, BASE_H - 40)) }
      : z
    ))
  }

  function onZoneDragEnd() { draggingZoneId.current = null }

  async function triggerZoneAction(zone) {
    setMeditatingActive(false)
    clearInterval(movingRef.current)
    movePandi(zone.wx, zone.wy, async () => {
      setPandiFrame(zone.frame)
      if (zone.action === 'feed') {
        const h = Math.min(hunger + 25, 100), hap = Math.min(happiness + 10, 100)
        setHunger(h); setHappiness(hap); showToast('¡Pandi come feliz! 😋'); addXP?.(5)
        await saveCare(h, energy, hap)
        setTimeout(() => setPandiFrame('idle'), 2500)
      } else if (zone.action === 'play') {
        const e2 = Math.max(energy - 15, 0), hap = Math.min(happiness + 20, 100)
        setEnergy(e2); setHappiness(hap); showToast('¡Pandi juega contigo! 🎉'); addXP?.(10)
        await saveCare(hunger, e2, hap)
        setTimeout(() => setPandiFrame('idle'), 2500)
      } else if (zone.action === 'sleep') {
        const e2 = Math.min(energy + 20, 100)
        setEnergy(e2); showToast('Pandi descansa 💤'); addXP?.(5)
        await saveCare(hunger, e2, happiness)
        setTimeout(() => setPandiFrame('idle'), 3000)
      } else if (zone.action === 'meditate') {
        const hap = Math.min(happiness + 15, 100), e2 = Math.min(energy + 10, 100)
        setHappiness(hap); setEnergy(e2); showToast('Pandi medita... 🧘'); addXP?.(8)
        await saveCare(hunger, e2, hap)
        setMeditatingActive(true)
      } else {
        showToast(`Pandi visita: ${zone.label}`)
        setTimeout(() => setPandiFrame('idle'), 2500)
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
  function saveEdit() { saveZones(zones); setEditMode(false); showToast('Zonas guardadas ✓') }

  const bgImage = isNight ? ASSETS.bg_night : ASSETS.bg_day

  const viewW = !isLandscape ? dimensions.h : dimensions.w
  const viewH = !isLandscape ? dimensions.w : dimensions.h
  const scaleRatio = Math.max((viewW || BASE_W) / BASE_W, (viewH || BASE_H) / BASE_H)

  const rotationStyles = !isLandscape ? {
    width: '100vh',
    height: '100vw',
    transform: 'rotate(90deg)',
    transformOrigin: 'top left',
    position: 'fixed',
    top: 0,
    left: '100%',
    zIndex: 9999,
  } : {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
  };

  return (
    <div 
      style={{ ...rotationStyles, background:'#0f1612', overflow:'hidden', userSelect:'none' }}
      onClick={handleScreenTap}
      onPointerMove={onZoneDragMove}
      onPointerUp={onZoneDragEnd}
    >
      {/* MAPA ADAPTADO AL 100% */}
      <div style={{
        position: 'absolute',
        width: BASE_W,
        height: BASE_H,
        left: '50%',
        top: '50%',
        transform: `translate(-50%, -50%) scale(${scaleRatio})`,
        transformOrigin: 'center center',
      }}>
        <img src={bgImage} alt="Santuario" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

        {!editMode && zones.map(z => (
          <div key={z.id} style={{ position:'absolute', left:z.wx, top:z.wy, transform:'translate(-50%,-50%)', pointerEvents:'none' }}>
            <div style={{ width:12, height:12, borderRadius:'50%', background:z.color, opacity:0.8, boxShadow:`0 0 12px ${z.color}` }} />
          </div>
        ))}

        {editMode && zones.map(z => (
          <div key={z.id}
            onPointerDown={e => onZoneDragStart(e, z.id)}
            style={{ position:'absolute', left:z.wx, top:z.wy, transform:'translate(-50%,-50%)', zIndex:50, cursor:'grab' }}>
            <div style={{ width:44, height:44, borderRadius:14, background:z.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>
              {z.emoji}
            </div>
          </div>
        ))}

        {/* Pandi */}
        <motion.div
          animate={{ left: pandiPos.wx, top: pandiPos.wy }}
          transition={{ duration: moveDurationRef.current, ease: 'linear' }}
          style={{ position: 'absolute', transform: 'translate(-50%, -100%)', zIndex: 10, width: 110, pointerEvents: 'none' }}
        >
          <motion.div animate={pandiFrame === 'idle' ? { y: [0, -6, 0] } : {}} transition={{ duration: 2.5, repeat: Infinity }}>
            <img src={ASSETS.pandi[pandiFrame] || ASSETS.pandi.idle} alt="Pandi"
              style={{ width: '100%', transform: pandiFlip ? 'scaleX(-1)' : 'scaleX(1)' }} />
          </motion.div>
        </motion.div>

        <AnimatePresence>
          {toast && (
            <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
              style={{ position:'absolute', left:pandiPos.wx, top:pandiPos.wy - 130, transform:'translateX(-50%)', zIndex:100,
                background:'white', borderRadius:14, padding:'8px 16px', color:'#1A2332', fontWeight:700, boxShadow:'0 4px 12px rgba(0,0,0,0.2)' }}>
              {toast}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* HUD SEGURO (Z-INDEX SUPERIOR A LA BARRA GLOBAL) */}
      <div style={{ position:'absolute', top:16, left:16, zIndex:10010 }}>
        <button onClick={(e) => { e.stopPropagation(); navigate(-1); }}
          style={{ width:42, height:42, borderRadius:12, border:'none', background:'white', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 12px rgba(0,0,0,0.15)', cursor:'pointer' }}>
          <ArrowLeft size={20} color='#1A2332' />
        </button>
      </div>

      <div style={{ position:'absolute', top:16, right:16, zIndex:10010, background:'rgba(255,255,255,0.95)', borderRadius:16, padding:'12px', minWidth:160, boxShadow:'0 4px 12px rgba(0,0,0,0.1)' }}>
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          <CareBar icon={Heart} value={hunger}    color='#FF8FA3' />
          <CareBar icon={Zap}   value={energy}    color='#FCD34D' />
          <CareBar icon={Star}  value={happiness} color='#2EC4B6' />
        </div>
      </div>

      <div style={{ position:'absolute', bottom:16, left:16, zIndex:10010 }}>
        {editMode ? (
          <button onClick={(e) => { e.stopPropagation(); saveEdit(); }} style={{ padding:'12px 24px', borderRadius:16, background:'#2EC4B6', color:'white', fontWeight:800, border:'none', cursor:'pointer' }}>
            <Check size={16} /> Guardar Cambios
          </button>
        ) : (
          <div style={{ background:'rgba(255,255,255,0.95)', borderRadius:16, padding:'8px', display:'flex', gap:6, boxShadow:'0 4px 12px rgba(0,0,0,0.1)' }}>
            {zones.filter(z=>z.action).map(z => (
              <button key={z.id} onClick={(e) => { e.stopPropagation(); setZoomZone(z); }}
                style={{ width:56, height:56, borderRadius:12, border:'none', background:`${z.color}15`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                <span style={{ fontSize:22 }}>{z.emoji}</span>
                <span style={{ fontSize:9, fontWeight:700 }}>{z.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ position:'absolute', bottom:16, right:16, zIndex:10010 }}>
        <button onClick={(e) => { e.stopPropagation(); setEditMode(!editMode); }}
          style={{ width:44, height:44, borderRadius:12, background:'white', border:'none', boxShadow:'0 4px 12px rgba(0,0,0,0.1)', cursor:'pointer' }}>
          <Settings size={18} color='#6B7280' />
        </button>
      </div>

      <AnimatePresence>
        {zoomZone && (
          <ObjectPopup zone={zoomZone} onClose={() => setZoomZone(null)} onInteract={z => { setZoomZone(null); triggerZoneAction(z) }} />
        )}
      </AnimatePresence>
    </div>
  )
}