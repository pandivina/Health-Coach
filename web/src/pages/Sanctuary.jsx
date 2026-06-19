// ─── pages/Sanctuary.jsx ─────────────────────────────────────────────────────
// Santuario con layout dual (portrait compacto / landscape completo)
// Zoom controlado sobre objetos interactivos
// Zonas arrastrables en modo edición

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Heart, Zap, Star, Settings, Check, ZoomIn, ZoomOut } from 'lucide-react'
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

// ─── ZONAS ───────────────────────────────────────────────────────────────────
const DEFAULT_ZONES = [
  { id:'bed',  label:'Cama',   emoji:'🛏️', x:0.50, y:0.55, frame:'sleeping', action:'sleep', color:'#818CF8' },
  { id:'food', label:'Cuenco', emoji:'🍚', x:0.22, y:0.68, frame:'eating',   action:'feed',  color:'#F97316' },
  { id:'toy',  label:'Juguete',emoji:'⚽', x:0.78, y:0.68, frame:'playing',  action:'play',  color:'#2EC4B6' },
]
const ZONES_KEY = 'sanctuary_zones_v1'
function loadZones() {
  try { const s = localStorage.getItem(ZONES_KEY); return s ? JSON.parse(s) : DEFAULT_ZONES }
  catch { return DEFAULT_ZONES }
}
function saveZones(z) { try { localStorage.setItem(ZONES_KEY, JSON.stringify(z)) } catch {} }

// ─── HOOKS ───────────────────────────────────────────────────────────────────
function useNightMode() {
  const [isNight, setIsNight] = useState(() => { const h = new Date().getHours(); return h>=22||h<7 })
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
function CareBar({ icon: Icon, value, color, landscape }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:4 }}>
      <Icon size={11} color={color} />
      <div style={{ width: landscape ? 80 : 56, height:4, borderRadius:2,
        background:'rgba(255,255,255,0.2)', overflow:'hidden' }}>
        <motion.div animate={{ width:`${value}%` }} transition={{ duration:0.5 }}
          style={{ height:'100%', borderRadius:2, background:color }} />
      </div>
      {landscape && <span style={{ fontSize:9, color:'rgba(255,255,255,0.6)', fontWeight:700, minWidth:20 }}>{Math.round(value)}</span>}
    </div>
  )
}

// ─── MARCADOR ARRASTRABLE ─────────────────────────────────────────────────────
function ZoneMarker({ zone, containerRef, onChange }) {
  const dragging = useRef(false)
  function onPointerDown(e) {
    e.stopPropagation(); dragging.current = true
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }
  function onMove(e) {
    if (!dragging.current || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    onChange({ ...zone,
      x: Math.min(Math.max((e.clientX - rect.left) / rect.width,  0.05), 0.95),
      y: Math.min(Math.max((e.clientY - rect.top)  / rect.height, 0.05), 0.95),
    })
  }
  function onUp() {
    dragging.current = false
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
  }
  return (
    <div onPointerDown={onPointerDown} style={{
      position:'absolute', left:`${zone.x*100}%`, top:`${zone.y*100}%`,
      transform:'translate(-50%,-50%)', zIndex:30, cursor:'grab', touchAction:'none',
    }}>
      <div style={{ position:'absolute', width:80, height:80, borderRadius:'50%',
        border:`2px dashed ${zone.color}`, background:`${zone.color}18`,
        transform:'translate(-50%,-50%)', top:'50%', left:'50%' }} />
      <div style={{ width:36, height:36, borderRadius:12, background:zone.color,
        display:'flex', alignItems:'center', justifyContent:'center', fontSize:18,
        boxShadow:`0 4px 12px ${zone.color}60`,
        position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)' }}>
        {zone.emoji}
      </div>
      <div style={{ position:'absolute', top:'calc(50% + 26px)', left:'50%',
        transform:'translateX(-50%)', background:'rgba(0,0,0,0.65)', borderRadius:8,
        padding:'2px 8px', fontSize:10, fontWeight:700, color:'white', whiteSpace:'nowrap' }}>
        {zone.label}
      </div>
    </div>
  )
}

// ─── POPUP DE ZOOM SOBRE OBJETO ───────────────────────────────────────────────
function ObjectZoom({ zone, onClose, onInteract }) {
  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      style={{ position:'absolute', inset:0, zIndex:40, background:'rgba(0,0,0,0.55)',
        backdropFilter:'blur(3px)', display:'flex', alignItems:'center', justifyContent:'center' }}
      onClick={onClose}>
      <motion.div initial={{ scale:0.7, opacity:0 }} animate={{ scale:1, opacity:1 }}
        exit={{ scale:0.7, opacity:0 }} transition={{ type:'spring', damping:22, stiffness:280 }}
        onClick={e => e.stopPropagation()}
        style={{ background:'white', borderRadius:28, padding:'28px 24px', textAlign:'center',
          minWidth:200, boxShadow:'0 20px 60px rgba(0,0,0,0.4)' }}>
        <div style={{ fontSize:64, marginBottom:12 }}>{zone.emoji}</div>
        <p style={{ fontSize:16, fontWeight:800, color:'#1A2332', margin:'0 0 6px' }}>{zone.label}</p>
        <p style={{ fontSize:12, color:'#9CA3AF', margin:'0 0 20px' }}>
          {zone.action === 'feed'  ? '¿Le damos de comer a Pandi?' :
           zone.action === 'play'  ? '¿Jugamos con Pandi?' :
           zone.action === 'sleep' ? '¿Pandi descansa un momento?' : ''}
        </p>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose}
            style={{ flex:1, padding:'11px', borderRadius:14, border:'none', cursor:'pointer',
              background:'#F3F4F6', color:'#6B7280', fontWeight:700, fontSize:13 }}>
            Ahora no
          </button>
          <button onClick={() => { onInteract(zone); onClose() }}
            style={{ flex:1, padding:'11px', borderRadius:14, border:'none', cursor:'pointer',
              background:`linear-gradient(135deg,${zone.color},${zone.color}aa)`,
              color:'white', fontWeight:700, fontSize:13 }}>
            ¡Vamos!
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────
export default function Sanctuary() {
  const { user, profile, addXP } = useStore()
  const navigate  = useNavigate()
  const isNight   = useNightMode()
  const landscape = useOrientation()
  const containerRef = useRef(null)
  const movingRef    = useRef(null)
  const pressRef     = useRef(null)

  const [zones,     setZones]     = useState(loadZones)
  const [editMode,  setEditMode]  = useState(false)
  const [zoomZone,  setZoomZone]  = useState(null) // zona en zoom
  const [pandiPos,  setPandiPos]  = useState({ x:0.5, y:0.55 })
  const [pandiFrame,setPandiFrame]= useState('idle')
  const [pandiFlip, setPandiFlip] = useState(false)
  const [hunger,    setHunger]    = useState(profile?.pandi_hunger    ?? 80)
  const [energy,    setEnergy]    = useState(profile?.pandi_energy    ?? 80)
  const [happiness, setHappiness] = useState(profile?.pandi_happiness ?? 80)
  const [toast,     setToast]     = useState(null)

  // ── Frame según estado ──────────────────────────────────────────────────
  useEffect(() => {
    if (isNight) {
      const bed = zones.find(z => z.id === 'bed')
      if (bed) { setPandiPos({ x:bed.x, y:bed.y }); setPandiFrame('sleeping') }
      return
    }
    if (['eating','playing','sleeping'].includes(pandiFrame)) return
    setPandiFrame(hunger < 30 ? 'sad' : 'idle')
  }, [isNight, hunger])

  // ── Movimiento autónomo ──────────────────────────────────────────────────
  useEffect(() => {
    if (isNight || editMode) return
    const wander = () => {
      const zone = zones[Math.floor(Math.random() * zones.length)]
      setPandiFlip(zone.x < pandiPos.x)
      setPandiPos({ x:zone.x, y:zone.y })
      setPandiFrame('walkR')
      setTimeout(() => setPandiFrame(zone.frame), 1200)
    }
    movingRef.current = setInterval(wander, 7000 + Math.random() * 5000)
    return () => clearInterval(movingRef.current)
  }, [isNight, editMode, zones])

  // ── Tap en canvas ────────────────────────────────────────────────────────
  function handleCanvasTap(e) {
    if (editMode || isNight || zoomZone) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top)  / rect.height

    // ¿Cerca de una zona?
    let nearest = null, minDist = 0.14
    zones.forEach(z => {
      const d = Math.sqrt(Math.pow(x-z.x,2) + Math.pow(y-z.y,2))
      if (d < minDist) { minDist = d; nearest = z }
    })

    if (nearest) {
      // Zoom sobre el objeto — popup de confirmación
      setZoomZone(nearest)
      return
    }

    // Mover Pandi libremente
    setPandiFlip(x < pandiPos.x)
    setPandiPos({ x, y })
    setPandiFrame('walkR')
    clearInterval(movingRef.current)
    setTimeout(() => setPandiFrame('idle'), 1200)
  }

  // ── Interacción con zona (tras confirmar en popup) ───────────────────────
  async function triggerZoneAction(zone) {
    setPandiFlip(zone.x < pandiPos.x)
    setPandiPos({ x:zone.x, y:zone.y })
    setPandiFrame('walkR')
    clearInterval(movingRef.current)
    setTimeout(async () => {
      setPandiFrame(zone.frame)
      if (zone.action === 'feed') {
        if (hunger >= 95) { showToast('Ya está saciada 😄'); return }
        const h = Math.min(hunger+25,100), hap = Math.min(happiness+10,100)
        setHunger(h); setHappiness(hap); showToast('¡Pandi come feliz! 😋'); addXP?.(5)
        await saveCare(h, energy, hap)
      }
      if (zone.action === 'play') {
        if (energy < 20) { showToast('Pandi está muy cansada 😴'); return }
        const e2=Math.max(energy-15,0), hap=Math.min(happiness+20,100)
        setEnergy(e2); setHappiness(hap); showToast('¡Pandi juega contigo! 🎉'); addXP?.(10)
        await saveCare(hunger, e2, hap)
      }
      if (zone.action === 'sleep') {
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

  function startEditPress() { pressRef.current = setTimeout(()=>setEditMode(true), 1500) }
  function endEditPress()   { clearTimeout(pressRef.current) }

  function saveEdit() { saveZones(zones); setEditMode(false); showToast('Zonas guardadas ✓') }
  function updateZone(z) { setZones(zs => zs.map(x => x.id===z.id ? z : x)) }

  const bgImage = isNight ? ASSETS.bg_night : ASSETS.bg_day
  const careLevel = (hunger + energy + happiness) / 3
  const currentFrame = ASSETS.pandi[pandiFrame] || ASSETS.pandi.idle

  // ── LAYOUT PORTRAIT (compacto) ────────────────────────────────────────────
  // ── LAYOUT LANDSCAPE (completo) ───────────────────────────────────────────
  return (
    <div style={{ height:'100dvh', display:'flex',
      flexDirection: landscape ? 'row' : 'column',
      background:'#0f1612', overflow:'hidden' }}>

      {/* SIDEBAR — solo en landscape */}
      {landscape && (
        <div style={{ width:80, display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'space-between',
          padding:'16px 8px', background:'rgba(0,0,0,0.4)', backdropFilter:'blur(12px)', zIndex:10 }}>
          <button onClick={() => navigate(-1)}
            style={{ width:36, height:36, borderRadius:12, border:'none', cursor:'pointer',
              background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center',
              justifyContent:'center', color:'white' }}>
            <ArrowLeft size={16} />
          </button>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <CareBar icon={Heart} value={hunger}    color='#FF8FA3' landscape />
            <CareBar icon={Zap}   value={energy}    color='#FCD34D' landscape />
            <CareBar icon={Star}  value={happiness} color='#2EC4B6' landscape />
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {zones.filter(z=>z.action).map(z => (
              <motion.button key={z.id} whileTap={{ scale:0.92 }}
                onClick={() => setZoomZone(z)}
                style={{ width:52, padding:'8px 4px', borderRadius:14, border:'none',
                  cursor:'pointer', background:'rgba(255,255,255,0.1)',
                  display:'flex', flexDirection:'column', alignItems:'center', gap:3, color:'white' }}>
                <span style={{ fontSize:20 }}>{z.emoji}</span>
                <span style={{ fontSize:9, fontWeight:700 }}>{z.label}</span>
              </motion.button>
            ))}
            <motion.button whileTap={{ scale:0.92 }}
              onPointerDown={startEditPress} onPointerUp={endEditPress}
              style={{ width:52, height:36, borderRadius:12, border:'none', cursor:'pointer',
                background:'rgba(255,255,255,0.07)',
                display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Settings size={14} color='rgba(255,255,255,0.35)' />
            </motion.button>
          </div>
        </div>
      )}

      {/* CANVAS PRINCIPAL */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* Header — solo en portrait */}
        {!landscape && (
          <div onPointerDown={startEditPress} onPointerUp={endEditPress}
            style={{ position:'relative', zIndex:10, display:'flex', alignItems:'center',
              justifyContent:'space-between', padding:'12px 16px',
              background:'linear-gradient(to bottom,rgba(0,0,0,0.5),transparent)',
              userSelect:'none' }}>
            <button onClick={() => navigate(-1)}
              style={{ width:36, height:36, borderRadius:12, border:'none', cursor:'pointer',
                background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center',
                justifyContent:'center', color:'white' }}>
              <ArrowLeft size={16} />
            </button>
            <p style={{ color:'white', fontSize:13, fontWeight:800, margin:0 }}>
              {editMode ? '✏️ Edición de zonas' : 'Tu Santuario'}
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
              <CareBar icon={Heart} value={hunger}    color='#FF8FA3' />
              <CareBar icon={Zap}   value={energy}    color='#FCD34D' />
              <CareBar icon={Star}  value={happiness} color='#2EC4B6' />
            </div>
          </div>
        )}

        {/* Área de juego */}
        <div ref={containerRef} onClick={handleCanvasTap}
          style={{ flex:1, position:'relative', overflow:'hidden',
            cursor: editMode ? 'default' : 'crosshair' }}>

          <img src={bgImage} alt="Santuario"
            style={{ position:'absolute', inset:0, width:'100%', height:'100%',
              objectFit:'cover', objectPosition:'center bottom', zIndex:0 }}
            onError={e => e.target.style.background='#1a2438'} />

          <div style={{ position:'absolute', inset:0, zIndex:1, pointerEvents:'none',
            background: isNight
              ? 'linear-gradient(to bottom,rgba(15,20,45,0.35) 0%,transparent 40%)'
              : 'linear-gradient(to bottom,rgba(0,0,0,0.08) 0%,transparent 30%)' }} />

          {/* Marcadores en modo edición */}
          {editMode && zones.map(z => (
            <ZoneMarker key={z.id} zone={z} containerRef={containerRef} onChange={updateZone} />
          ))}

          {/* Pandi */}
          {!editMode && (
            <motion.div
              animate={{ left:`${pandiPos.x*100}%`, top:`${pandiPos.y*100}%` }}
              transition={{ duration:1.2, ease:'easeInOut' }}
              style={{ position:'absolute', transform:'translate(-50%,-100%)',
                zIndex:5, width: landscape ? '14%' : '22%', maxWidth:130, pointerEvents:'none' }}>
              <motion.div
                animate={pandiFrame==='idle' ? {y:[0,-4,0]} : {}}
                transition={{ duration:2.5, repeat:Infinity, ease:'easeInOut' }}>
                <img src={currentFrame} alt="Pandi"
                  style={{ width:'100%', height:'auto', objectFit:'contain',
                    transform: pandiFlip ? 'scaleX(-1)' : 'scaleX(1)',
                    filter:'drop-shadow(0 8px 16px rgba(0,0,0,0.3))' }}
                  onError={e => { e.target.src = ASSETS.pandi.idle }} />
              </motion.div>
            </motion.div>
          )}

          {/* Indicadores de zona (puntos sutiles siempre visibles) */}
          {!editMode && zones.map(z => (
            <div key={z.id} style={{ position:'absolute',
              left:`${z.x*100}%`, top:`${z.y*100}%`, transform:'translate(-50%,-50%)',
              zIndex:3, pointerEvents:'none' }}>
              <div style={{ width:8, height:8, borderRadius:'50%',
                background:z.color, opacity:0.5,
                boxShadow:`0 0 8px ${z.color}` }} />
            </div>
          ))}

          {/* Instrucción edición */}
          {editMode && (
            <div style={{ position:'absolute', top:'12%', left:'50%',
              transform:'translateX(-50%)', zIndex:20,
              background:'rgba(0,0,0,0.7)', borderRadius:14, padding:'8px 16px' }}>
              <p style={{ color:'white', fontSize:11, fontWeight:700, margin:0, whiteSpace:'nowrap' }}>
                Arrastra las zonas a su posición real
              </p>
            </div>
          )}

          {/* Alertas */}
          {careLevel < 40 && !isNight && !editMode && !zoomZone && (
            <motion.div animate={{ opacity:[0.7,1,0.7] }} transition={{ duration:2, repeat:Infinity }}
              style={{ position:'absolute', top:'12%', left:'50%', transform:'translateX(-50%)',
                zIndex:15, background:'rgba(254,243,199,0.95)', borderRadius:14,
                padding:'8px 14px', display:'flex', alignItems:'center', gap:8 }}>
              <span>💛</span>
              <p style={{ fontSize:11, fontWeight:700, color:'#92400E', margin:0 }}>Pandi te necesita</p>
            </motion.div>
          )}

          {isNight && !editMode && (
            <p style={{ position:'absolute', top:'12%', left:'50%', transform:'translateX(-50%)',
              zIndex:15, color:'rgba(255,255,255,0.55)', fontSize:11, fontWeight:700, margin:0 }}>
              Pandi descansa 🌙
            </p>
          )}

          {/* Toast */}
          <AnimatePresence>
            {toast && (
              <motion.div initial={{ opacity:0, y:20, x:'-50%' }} animate={{ opacity:1, y:0, x:'-50%' }}
                exit={{ opacity:0 }}
                style={{ position:'absolute', bottom:'18%', left:'50%', zIndex:20,
                  background:'rgba(255,255,255,0.95)', borderRadius:16, padding:'10px 18px',
                  boxShadow:'0 8px 24px rgba(0,0,0,0.2)', fontSize:13, fontWeight:700, color:'#1A2332' }}>
                {toast}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Popup de zoom sobre objeto */}
          <AnimatePresence>
            {zoomZone && (
              <ObjectZoom zone={zoomZone}
                onClose={() => setZoomZone(null)}
                onInteract={z => { setZoomZone(null); triggerZoneAction(z) }} />
            )}
          </AnimatePresence>
        </div>

        {/* Footer — portrait: acciones + ajustes */}
        {!landscape && (
          <div style={{ background:'rgba(0,0,0,0.45)', backdropFilter:'blur(12px)',
            padding:'10px 20px', display:'flex', gap:10, justifyContent:'center', alignItems:'center' }}>
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
                      padding:'9px 16px', borderRadius:16, border:'none', cursor:'pointer',
                      background:'rgba(255,255,255,0.12)', color:'white' }}>
                    <span style={{ fontSize:20 }}>{z.emoji}</span>
                    <span style={{ fontSize:10, fontWeight:700 }}>{z.label}</span>
                  </motion.button>
                ))}
                <motion.button whileTap={{ scale:0.92 }}
                  onPointerDown={startEditPress} onPointerUp={endEditPress}
                  style={{ width:38, height:38, borderRadius:12, border:'none', cursor:'pointer',
                    background:'rgba(255,255,255,0.08)',
                    display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Settings size={15} color='rgba(255,255,255,0.35)' />
                </motion.button>
              </>
            )}
          </div>
        )}

        {/* Footer landscape — guardar edición */}
        {landscape && editMode && (
          <div style={{ padding:'10px', display:'flex', justifyContent:'center',
            background:'rgba(0,0,0,0.3)' }}>
            <motion.button whileTap={{ scale:0.95 }} onClick={saveEdit}
              style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 24px',
                borderRadius:16, border:'none', cursor:'pointer',
                background:'linear-gradient(135deg,#2EC4B6,#86EFAC)', color:'white',
                fontWeight:800, fontSize:13 }}>
              <Check size={15} /> Guardar zonas
            </motion.button>
          </div>
        )}
      </div>
    </div>
  )
}
