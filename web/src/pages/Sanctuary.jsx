// ─── pages/Sanctuary.jsx ─────────────────────────────────────────────────────
// Santuario — solo landscape. Portrait muestra aviso de girar.
// En landscape: mundo completo con pan libre (todo se mueve junto como un mapa)
// Zonas arrastrables en modo edición. Zoom controlado sobre objetos.

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Heart, Zap, Star, Settings, Check, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useStore } from '../store/useStore'

// ─── ASSETS ──────────────────────────────────────────────────────────────────
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
  },
}

// Tamaño del mundo en px — más grande que la pantalla para poder hacer pan
const WORLD_W = 1200
const WORLD_H = 800

// ─── ZONAS ───────────────────────────────────────────────────────────────────
// Coordenadas en px dentro del mundo (0-WORLD_W, 0-WORLD_H)
const DEFAULT_ZONES = [
  { id:'bed',  label:'Cama',    emoji:'🛏️', wx:600, wy:340, frame:'sleeping', action:'sleep', color:'#818CF8' },
  { id:'food', label:'Cuenco',  emoji:'🍚', wx:280, wy:520, frame:'eating',   action:'feed',  color:'#F97316' },
  { id:'toy',  label:'Juguete', emoji:'⚽', wx:920, wy:520, frame:'playing',  action:'play',  color:'#2EC4B6' },
]
const ZONES_KEY = 'sanctuary_zones_v2'
function loadZones() {
  try { const s = localStorage.getItem(ZONES_KEY); return s ? JSON.parse(s) : DEFAULT_ZONES }
  catch { return DEFAULT_ZONES }
}
function saveZones(z) { try { localStorage.setItem(ZONES_KEY, JSON.stringify(z)) } catch {} }

// ─── HOOKS ───────────────────────────────────────────────────────────────────
function useNightMode() {
  const [isNight, setIsNight] = useState(() => { const h=new Date().getHours(); return h>=22||h<7 })
  useEffect(() => {
    const t = setInterval(() => { const h=new Date().getHours(); setIsNight(h>=22||h<7) }, 60000)
    return () => clearInterval(t)
  }, [])
  return isNight
}

function useOrientation() {
  const [landscape, setLandscape] = useState(() => window.innerWidth > window.innerHeight)
  useEffect(() => {
    const check = () => setLandscape(window.innerWidth > window.innerHeight)
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  return landscape
}

// ─── BARRA DE CUIDADO ─────────────────────────────────────────────────────────
function CareBar({ icon: Icon, value, color }) {
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

// ─── POPUP DE OBJETO ──────────────────────────────────────────────────────────
function ObjectPopup({ zone, onClose, onInteract }) {
  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      style={{ position:'fixed', inset:0, zIndex:100, background:'rgba(0,0,0,0.55)',
        backdropFilter:'blur(3px)', display:'flex', alignItems:'center', justifyContent:'center' }}
      onClick={onClose}>
      <motion.div initial={{ scale:0.7, opacity:0 }} animate={{ scale:1, opacity:1 }}
        exit={{ scale:0.7, opacity:0 }} transition={{ type:'spring', damping:22, stiffness:280 }}
        onClick={e => e.stopPropagation()}
        style={{ background:'white', borderRadius:28, padding:'28px 24px', textAlign:'center',
          minWidth:220, maxWidth:300, boxShadow:'0 20px 60px rgba(0,0,0,0.4)' }}>
        <div style={{ fontSize:64, marginBottom:12 }}>{zone.emoji}</div>
        <p style={{ fontSize:16, fontWeight:800, color:'#1A2332', margin:'0 0 6px' }}>{zone.label}</p>
        <p style={{ fontSize:12, color:'#9CA3AF', margin:'0 0 20px' }}>
          {zone.action==='feed'  ? '¿Le damos de comer a Pandi?' :
           zone.action==='play'  ? '¿Jugamos con Pandi?' :
           zone.action==='sleep' ? '¿Pandi descansa un momento?' : ''}
        </p>
        <div style={{ display:'flex', gap:10 }}>
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

// ─── AVISO DE GIRAR ───────────────────────────────────────────────────────────
function RotateNotice() {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, background:'#0f1612',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      padding:32, textAlign:'center' }}>
      <div style={{ fontSize:56, marginBottom:20 }}>📱</div>
      <p style={{ color:'white', fontSize:17, fontWeight:800, margin:'0 0 8px' }}>
        Gira tu móvil
      </p>
      <p style={{ color:'rgba(255,255,255,0.5)', fontSize:13, maxWidth:260, lineHeight:1.5, margin:0 }}>
        El Santuario se ve mejor en horizontal
      </p>
    </div>
  )
}

// ─── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────
export default function Sanctuary() {
  const { user, profile, addXP } = useStore()
  const navigate   = useNavigate()
  const isNight    = useNightMode()
  const landscape  = useOrientation()
  const worldRef   = useRef(null)
  const pressRef   = useRef(null)
  const movingRef  = useRef(null)

  // Pan del mundo
  const [offset,    setOffset]    = useState({ x:0, y:0 })
  const panStart    = useRef(null)
  const offsetStart = useRef({ x:0, y:0 })
  const isDragging  = useRef(false)

  // Zonas y modos
  const [zones,      setZones]      = useState(loadZones)
  const [editMode,   setEditMode]   = useState(false)
  const [zoomZone,   setZoomZone]   = useState(null)
  const [draggingZoneId, setDraggingZoneId] = useState(null)

  // Estado de Pandi (coordenadas en px del mundo)
  const [pandiPos,   setPandiPos]   = useState({ wx:600, wy:460 })
  const [pandiFrame, setPandiFrame] = useState('idle')
  const [pandiFlip,  setPandiFlip]  = useState(false)

  // Cuidado
  const [hunger,    setHunger]    = useState(profile?.pandi_hunger    ?? 80)
  const [energy,    setEnergy]    = useState(profile?.pandi_energy    ?? 80)
  const [happiness, setHappiness] = useState(profile?.pandi_happiness ?? 80)
  const [toast,     setToast]     = useState(null)

  // Centrar el mundo al montar y al cambiar orientación
  useEffect(() => {
    if (!landscape) return
    const vw = window.innerWidth, vh = window.innerHeight
    setOffset({ x:(vw-WORLD_W)/2, y:(vh-WORLD_H)/2 })
  }, [landscape])

  // Frame según estado
  useEffect(() => {
    if (isNight) {
      const bed = zones.find(z=>z.id==='bed')
      if (bed) { setPandiPos({ wx:bed.wx, wy:bed.wy }); setPandiFrame('sleeping') }
      return
    }
    if (['eating','playing'].includes(pandiFrame)) return
    setPandiFrame(hunger < 30 ? 'sad' : 'idle')
  }, [isNight, hunger])

  // Movimiento autónomo
  useEffect(() => {
    if (isNight || editMode) return
    const wander = () => {
      const z = zones[Math.floor(Math.random()*zones.length)]
      setPandiFlip(z.wx < pandiPos.wx)
      setPandiPos({ wx:z.wx, wy:z.wy })
      setPandiFrame('walkR')
      setTimeout(() => setPandiFrame(z.frame), 1200)
    }
    movingRef.current = setInterval(wander, 7000 + Math.random()*5000)
    return () => clearInterval(movingRef.current)
  }, [isNight, editMode, zones])

  // ── Pan handlers ────────────────────────────────────────────────────────
  function clampOffset(ox, oy) {
    const vw = window.innerWidth, vh = window.innerHeight
    return {
      x: Math.min(Math.max(ox, Math.min(0, vw-WORLD_W)), Math.max(0, vw-WORLD_W)),
      y: Math.min(Math.max(oy, Math.min(0, vh-WORLD_H)), Math.max(0, vh-WORLD_H)),
    }
  }

  function onPointerDown(e) {
    if (editMode && draggingZoneId) return
    panStart.current = { x:e.clientX, y:e.clientY }
    offsetStart.current = { ...offset }
    isDragging.current = false
  }

  function onPointerMove(e) {
    if (!panStart.current) return
    const dx = e.clientX - panStart.current.x
    const dy = e.clientY - panStart.current.y
    if (Math.abs(dx)+Math.abs(dy) > 5) isDragging.current = true
    if (isDragging.current) {
      setOffset(clampOffset(offsetStart.current.x+dx, offsetStart.current.y+dy))
    }
  }

  function onPointerUp(e) {
    if (!panStart.current) return
    if (!isDragging.current) handleTap(e)
    panStart.current = null
    isDragging.current = false
  }

  // ── Tap en el mundo ─────────────────────────────────────────────────────
  function handleTap(e) {
    if (editMode || isNight || zoomZone) return
    // Coordenadas dentro del mundo
    const wx = e.clientX - offset.x
    const wy = e.clientY - offset.y

    // ¿Cerca de una zona?
    let nearest = null, minDist = 80
    zones.forEach(z => {
      const d = Math.sqrt(Math.pow(wx-z.wx,2)+Math.pow(wy-z.wy,2))
      if (d < minDist) { minDist=d; nearest=z }
    })
    if (nearest) { setZoomZone(nearest); return }

    // Mover Pandi
    setPandiFlip(wx < pandiPos.wx)
    setPandiPos({ wx, wy })
    setPandiFrame('walkR')
    clearInterval(movingRef.current)
    setTimeout(() => setPandiFrame('idle'), 1200)
  }

  // ── Arrastrar zona en modo edición ──────────────────────────────────────
  function onZoneDragStart(e, zoneId) {
    e.stopPropagation()
    setDraggingZoneId(zoneId)
    panStart.current = null
  }

  function onZoneDragMove(e) {
    if (!draggingZoneId) return
    const wx = e.clientX - offset.x
    const wy = e.clientY - offset.y
    setZones(zs => zs.map(z => z.id===draggingZoneId
      ? { ...z, wx:Math.max(40,Math.min(wx,WORLD_W-40)), wy:Math.max(40,Math.min(wy,WORLD_H-40)) }
      : z
    ))
  }

  function onZoneDragEnd() { setDraggingZoneId(null) }

  // ── Interacción con zona ────────────────────────────────────────────────
  async function triggerZoneAction(zone) {
    setPandiFlip(zone.wx < pandiPos.wx)
    setPandiPos({ wx:zone.wx, wy:zone.wy })
    setPandiFrame('walkR')
    clearInterval(movingRef.current)
    setTimeout(async () => {
      setPandiFrame(zone.frame)
      if (zone.action==='feed') {
        const h=Math.min(hunger+25,100), hap=Math.min(happiness+10,100)
        setHunger(h); setHappiness(hap); showToast('¡Pandi come feliz! 😋'); addXP?.(5)
        await saveCare(h, energy, hap)
      }
      if (zone.action==='play') {
        const e2=Math.max(energy-15,0), hap=Math.min(happiness+20,100)
        setEnergy(e2); setHappiness(hap); showToast('¡Pandi juega contigo! 🎉'); addXP?.(10)
        await saveCare(hunger, e2, hap)
      }
      if (zone.action==='sleep') {
        const e2=Math.min(energy+20,100)
        setEnergy(e2); showToast('Pandi descansa 💤'); addXP?.(5)
        await saveCare(hunger, e2, happiness)
      }
      setTimeout(() => setPandiFrame('idle'), 2500)
    }, 1200)
  }

  async function saveCare(h, e, hap) {
    if (!user?.id) return
    await supabase.from('user_profiles').update({
      pandi_hunger:Math.round(h), pandi_energy:Math.round(e),
      pandi_happiness:Math.round(hap), pandi_care_updated_at:new Date().toISOString()
    }).eq('id', user.id)
  }

  function showToast(t) { setToast(t); setTimeout(()=>setToast(null),2500) }
  function startEditPress() { pressRef.current = setTimeout(()=>setEditMode(true),1500) }
  function endEditPress()   { clearTimeout(pressRef.current) }
  function saveEdit() { saveZones(zones); setEditMode(false); showToast('Zonas guardadas ✓') }

  const careLevel = (hunger+energy+happiness)/3
  const bgImage = isNight ? ASSETS.bg_night : ASSETS.bg_day

  // Portrait → aviso
  if (!landscape) return <RotateNotice />

  return (
    <div style={{ position:'fixed', inset:0, background:'#0f1612', overflow:'hidden' }}
      onPointerDown={onPointerDown}
      onPointerMove={e => { onPointerMove(e); onZoneDragMove(e) }}
      onPointerUp={e => { onPointerUp(e); onZoneDragEnd() }}
      onPointerLeave={onZoneDragEnd}>

      {/* MUNDO — se desplaza todo junto */}
      <div ref={worldRef} style={{
        position:'absolute',
        left:offset.x, top:offset.y,
        width:WORLD_W, height:WORLD_H,
        userSelect:'none',
      }}>
        {/* Fondo */}
        <img src={bgImage} alt="Santuario"
          style={{ position:'absolute', inset:0, width:'100%', height:'100%',
            objectFit:'cover', objectPosition:'center', zIndex:0, pointerEvents:'none' }}
          onError={e => e.target.style.background='#1a2438'} />

        {/* Puntos de zona (siempre visibles) */}
        {!editMode && zones.map(z => (
          <div key={z.id} style={{ position:'absolute', left:z.wx, top:z.wy,
            transform:'translate(-50%,-50%)', zIndex:3, pointerEvents:'none' }}>
            <div style={{ width:10, height:10, borderRadius:'50%',
              background:z.color, opacity:0.6, boxShadow:`0 0 10px ${z.color}` }} />
          </div>
        ))}

        {/* Marcadores arrastrables en modo edición */}
        {editMode && zones.map(z => (
          <div key={z.id}
            onPointerDown={e => onZoneDragStart(e, z.id)}
            style={{ position:'absolute', left:z.wx, top:z.wy,
              transform:'translate(-50%,-50%)', zIndex:20, cursor:'grab', touchAction:'none' }}>
            <div style={{ position:'absolute', width:100, height:100, borderRadius:'50%',
              border:`2px dashed ${z.color}`, background:`${z.color}15`,
              transform:'translate(-50%,-50%)', top:'50%', left:'50%', pointerEvents:'none' }} />
            <div style={{ width:44, height:44, borderRadius:14, background:z.color,
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:22,
              boxShadow:`0 4px 16px ${z.color}70`,
              position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)' }}>
              {z.emoji}
            </div>
            <div style={{ position:'absolute', top:'calc(50% + 30px)', left:'50%',
              transform:'translateX(-50%)', background:'rgba(0,0,0,0.7)', borderRadius:8,
              padding:'2px 10px', fontSize:11, fontWeight:700, color:'white', whiteSpace:'nowrap' }}>
              {z.label}
            </div>
          </div>
        ))}

        {/* Pandi */}
        <motion.div
          animate={{ left:pandiPos.wx, top:pandiPos.wy }}
          transition={{ duration:1.2, ease:'easeInOut' }}
          style={{ position:'absolute', transform:'translate(-50%,-100%)',
            zIndex:5, width:100, pointerEvents:'none' }}>
          <motion.div
            animate={pandiFrame==='idle' ? {y:[0,-5,0]} : {}}
            transition={{ duration:2.5, repeat:Infinity, ease:'easeInOut' }}>
            <img
              src={ASSETS.pandi[pandiFrame] || ASSETS.pandi.idle}
              alt="Pandi"
              style={{ width:'100%', height:'auto', objectFit:'contain',
                transform: pandiFlip ? 'scaleX(-1)' : 'scaleX(1)',
                filter:'drop-shadow(0 10px 20px rgba(0,0,0,0.35))' }}
              onError={e => { e.target.src = ASSETS.pandi.idle }} />
          </motion.div>
        </motion.div>

        {/* Toast dentro del mundo */}
        <AnimatePresence>
          {toast && (
            <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
              style={{ position:'absolute', left:pandiPos.wx, top:pandiPos.wy - 120,
                transform:'translateX(-50%)', zIndex:15,
                background:'rgba(255,255,255,0.95)', borderRadius:14, padding:'8px 16px',
                boxShadow:'0 8px 20px rgba(0,0,0,0.2)', fontSize:13, fontWeight:700,
                color:'#1A2332', whiteSpace:'nowrap' }}>
              {toast}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* HUD fijo — siempre encima del pan */}
      <div style={{ position:'fixed', top:0, left:0, right:0, zIndex:50,
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'12px 16px',
        background:'linear-gradient(to bottom,rgba(0,0,0,0.55),transparent)',
        pointerEvents:'none' }}>
        <button onClick={() => navigate(-1)} style={{ pointerEvents:'all',
          width:36, height:36, borderRadius:12, border:'none', cursor:'pointer',
          background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center',
          justifyContent:'center', color:'white' }}>
          <ArrowLeft size={16} />
        </button>

        <p style={{ color:'white', fontSize:13, fontWeight:800, margin:0, opacity:0.85 }}>
          {editMode ? '✏️ Arrastra las zonas' : 'Tu Santuario'}
        </p>

        <div style={{ display:'flex', flexDirection:'column', gap:5, pointerEvents:'none' }}>
          <CareBar icon={Heart} value={hunger}    color='#FF8FA3' />
          <CareBar icon={Zap}   value={energy}    color='#FCD34D' />
          <CareBar icon={Star}  value={happiness} color='#2EC4B6' />
        </div>
      </div>

      {/* Footer fijo — acciones */}
      <div style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:50,
        display:'flex', gap:10, justifyContent:'center', alignItems:'center',
        padding:'10px 20px',
        background:'linear-gradient(to top,rgba(0,0,0,0.6),transparent)' }}>
        {editMode ? (
          <motion.button whileTap={{ scale:0.95 }} onClick={saveEdit}
            style={{ display:'flex', alignItems:'center', gap:8, padding:'11px 28px',
              borderRadius:18, border:'none', cursor:'pointer',
              background:'linear-gradient(135deg,#2EC4B6,#86EFAC)', color:'white',
              fontWeight:800, fontSize:14 }}>
            <Check size={16} /> Guardar zonas
          </motion.button>
        ) : (
          <>
            {zones.filter(z=>z.action).map(z => (
              <motion.button key={z.id} whileTap={{ scale:0.92 }}
                onClick={() => setZoomZone(z)}
                style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4,
                  padding:'9px 18px', borderRadius:16, border:'none', cursor:'pointer',
                  background:'rgba(255,255,255,0.12)', color:'white', backdropFilter:'blur(8px)' }}>
                <span style={{ fontSize:22 }}>{z.emoji}</span>
                <span style={{ fontSize:10, fontWeight:700 }}>{z.label}</span>
              </motion.button>
            ))}
            <motion.button whileTap={{ scale:0.92 }}
              onPointerDown={e => { e.stopPropagation(); startEditPress() }}
              onPointerUp={e => { e.stopPropagation(); endEditPress() }}
              style={{ width:42, height:42, borderRadius:12, border:'none', cursor:'pointer',
                background:'rgba(255,255,255,0.08)', backdropFilter:'blur(8px)',
                display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Settings size={16} color='rgba(255,255,255,0.4)' />
            </motion.button>
          </>
        )}
      </div>

      {/* Alertas */}
      {careLevel < 40 && !isNight && !editMode && (
        <motion.div animate={{ opacity:[0.8,1,0.8] }} transition={{ duration:2, repeat:Infinity }}
          style={{ position:'fixed', top:70, left:'50%', transform:'translateX(-50%)',
            zIndex:51, background:'rgba(254,243,199,0.95)', borderRadius:14,
            padding:'8px 14px', display:'flex', alignItems:'center', gap:8 }}>
          <span>💛</span>
          <p style={{ fontSize:11, fontWeight:700, color:'#92400E', margin:0 }}>Pandi te necesita</p>
        </motion.div>
      )}

      {isNight && (
        <p style={{ position:'fixed', top:70, left:'50%', transform:'translateX(-50%)',
          zIndex:51, color:'rgba(255,255,255,0.55)', fontSize:11, fontWeight:700, margin:0 }}>
          Pandi descansa 🌙
        </p>
      )}

      {/* Popup de objeto */}
      <AnimatePresence>
        {zoomZone && (
          <ObjectPopup zone={zoomZone}
            onClose={() => setZoomZone(null)}
            onInteract={z => { setZoomZone(null); triggerZoneAction(z) }} />
        )}
      </AnimatePresence>
    </div>
  )
}
