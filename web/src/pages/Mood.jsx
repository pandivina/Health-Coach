import {
  PANDI_MOOD_MESSAGES, PANDI_ACTIONS, PANDI_MOOD_FRAME, DEFAULT_HABITS,
} from '../lib/pandiMessages'
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, RotateCcw, Volume2, VolumeX, Check, Smile, Heart, Sparkles, Lock, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useStore } from '../store/useStore'
import { useTheme } from '../contexts/ThemeProvider'
import { useSectionContext } from '../hooks/useSectionContext'
import { usePandiState } from '../contexts/PandiStateContext'
import CycleTab from '../components/mood/CycleTab'
import WellnessCalendar from '../components/mood/WellnessCalendar'
import PandiContextualBubble from '../components/PandiContextualBubble'
import PandiTips from '../components/PandiTips'
import { speak, stopSpeech, sayAsync, PANDI_VOICE } from '../lib/tts'
import { registerMeditationSession } from '../lib/meditationStreak'
import JournalEntry from '../components/mood/JournalEntry'
import PandiPulse from '../components/mood/PandiPulse'
import SunJourney from '../components/mood/SunJourney'
import CalmScreen from '../components/mood/CalmButton'

// ─── AUDIO ───────────────────────────────────────────────────────────────────
const A = {
  ambient: {
    rain:    '/audio/ambient-rain.mp3',
    ocean:   '/audio/ambient-ocean.mp3',
    forest:  '/audio/ambient-forest.mp3',
    bowls:   '/audio/ambient-bowls.mp3',
    space:   '/audio/ambient-space.mp3',
  },
  breath: {
    inhale:  '/audio/breath-inhale.mp3',
    hold:    '/audio/breath-hold.mp3',
    exhale:  '/audio/breath-exhale.mp3',
  },
  med: (n) => `/audio/med-${String(n).padStart(2, '0')}.mp3`,
}

// ─── CONSTANTES ──────────────────────────────────────────────────────────────
const MOODS = [
  { v: 1, emoji: '😩', label: 'Hundido', color: '#EF4444' },
  { v: 2, emoji: '😞', label: 'Bajo',    color: '#F97316' },
  { v: 3, emoji: '😐', label: 'Normal',  color: '#EAB308' },
  { v: 4, emoji: '😊', label: 'Bien',    color: '#22C55E' },
  { v: 5, emoji: '🤩', label: 'Genial',  color: '#2EC4B6' },
]

const TECHNIQUES = {
  '478':    { name: '4-7-8',  inhale: 4, hold: 7, exhale: 8, holdOut: 0, desc: 'Para ansiedad'   },
  'box':    { name: 'Box',    inhale: 4, hold: 4, exhale: 4, holdOut: 4, desc: 'Para equilibrio' },
  'simple': { name: 'Simple', inhale: 4, hold: 0, exhale: 4, holdOut: 0, desc: 'Para empezar'    },
}

const PHASES = {
  inhale:  { label: 'Inhala', color: '#2EC4B6', scale: 1.4, breathFrame: 2 },
  hold:    { label: 'Mantén', color: '#A78BFA', scale: 1.4, breathFrame: 3 },
  exhale:  { label: 'Exhala', color: '#FF8FA3', scale: 1.0, breathFrame: 4 },
  holdOut: { label: 'Pausa',  color: '#FCD34D', scale: 1.0, breathFrame: 1 },
}

const AMBIENT = [
  { id: 'rain',   emoji: '🌧️', label: 'Lluvia'  },
  { id: 'ocean',  emoji: '🌊', label: 'Océano'  },
  { id: 'forest', emoji: '🌲', label: 'Bosque'  },
  { id: 'bowls',  emoji: '🎵', label: 'Cuencos' },
  { id: 'space',  emoji: '🌌', label: 'Espacio' },
]

const MASCOTAS_COLECCIONABLES = [
  { id: 'pandi',  nombreDefault: 'Pandi',  especie: 'Oso Panda',  desc: 'Tu compañero fiel inicial.', nivelRequerido: 1  },
  { id: 'slothi', nombreDefault: 'Slothi', especie: 'Perezoso',   desc: 'Experto en calma profunda.', nivelRequerido: 4  },
  { id: 'lumi',   nombreDefault: 'Lumi',   especie: 'Luciérnaga', desc: 'Brilla en tus momentos oscuros.', nivelRequerido: 8 },
]

// Santuario según estado de recuperación
const SANCTUARY_CONFIG = {
  GREEN:  { bg: '/panda/sanctuary_green.png',  glow: 'rgba(46,196,182,0.4)',  dot: '#2EC4B6' },
  YELLOW: { bg: '/panda/sanctuary_yellow.png', glow: 'rgba(245,158,11,0.4)', dot: '#F59E0B' },
  RED:    { bg: '/panda/sanctuary_red.png',    glow: 'rgba(255,143,163,0.4)', dot: '#FF8FA3' },
}

// Frames de Pandi según mood/acción
const PANDI_FRAMES = {
  idle:      ['/panda/panda_base.png'],
  happy:     ['/panda/panda_base.png'],
  thinking:  ['/panda/panda_sitting.png'],
  meditate:  ['/panda/panda_sitting.png'],
  celebrate: ['/panda/panda_base.png'],
  breathing: ['/panda/panda_sitting.png'],
  sitting:   ['/panda/panda_sitting.png'],
  walkR:     ['/panda/panda_walk_r.png'],
  walkL:     ['/panda/panda_lateral_izq.png'],
  back:      ['/panda/panda_back.png'],
  blink:     '/panda/panda_base.png',
}

// ─── CONFIGURACIÓN POR TAB — fondo + pose de Pandi ───────────────────────────
const TAB_CONFIG = {
  breathing:  {
    bg:          '/sanctuary/bg_breathing.png',
    bgFallback:  '#d4eaf7',
    frames:      ['/panda/panda_sitting.png'],
    pandiMode:   'breathing',
  },
  meditation: {
    bg:          '/sanctuary/bg_forest.png',
    bgFallback:  '#d4ead4',
    frames:      ['/panda/panda_sitting.png'],
    pandiMode:   'meditate',
  },
  checkin: {
    bg:          '/sanctuary/bg_checkin.png',
    bgFallback:  '#f5efe6',
    frames:      ['/panda/panda_base.png'],
    pandiMode:   'idle',
  },
  habits: {
    bg:          '/sanctuary/bg_checkin.png',
    bgFallback:  '#f0edf8',
    frames:      ['/panda/panda_base.png'],
    pandiMode:   'celebrate',
  },
  journal: {
    bg:          '/sanctuary/bg_journal.png',
    bgFallback:  '#f7f0e6',
    frames:      ['/panda/panda_sitting.png'],
    pandiMode:   'sitting',
  },
}

const MED_SESSIONS = { 2: [1,2,3], 5: [4,5,6,7], 10: [8,9,10] }
const pickSession  = (m) => { const p = MED_SESSIONS[m] ?? [1]; return p[Math.floor(Math.random()*p.length)] }

// ─── AUDIO HELPERS ───────────────────────────────────────────────────────────
function fadeIn(audio, targetVol = 0.45, step = 0.03) {
  audio.volume = 0
  const id = setInterval(() => {
    const v = Math.min(audio.volume + step, targetVol)
    audio.volume = v
    if (v >= targetVol) clearInterval(id)
  }, 90)
}

function fadeOut(audio, onDone, step = 0.04) {
  const id = setInterval(() => {
    const v = Math.max(audio.volume - step, 0)
    audio.volume = v
    if (v <= 0) { clearInterval(id); audio.pause(); onDone?.() }
  }, 80)
}

function playAmbient(soundId, ref) {
  stopAmbient(ref)
  const audio = new Audio(A.ambient[soundId])
  audio.loop = true; ref.current = audio
  audio.play().catch(() => {}); fadeIn(audio)
}

function stopAmbient(ref) {
  const audio = ref.current
  if (!audio) return
  ref.current = null; fadeOut(audio)
}

// ─── PANDA IMG ───────────────────────────────────────────────────────────────
function PandaImg({ name, size = 48, fallback = '🐼', style = {} }) {
  const [err, setErr] = useState(false)
  if (err) return (
    <span style={{ fontSize: size * 0.65, lineHeight: 1, display: 'flex',
      alignItems: 'center', justifyContent: 'center', width: size, height: size, ...style }}>
      {fallback}
    </span>
  )
  return (
    <img src={`/panda/${name}.png`} alt="Pandi"
      style={{ width: size, height: size, objectFit: 'contain', ...style }}
      onError={() => setErr(true)} />
  )
}

// ─── SANTUARIO FONDO — reutiliza la misma lógica que Home ────────────────────
function SanctuaryBg({ recoveryLight, mood, activeTab }) {
  const tabCfg = TAB_CONFIG[activeTab]

  const bgSrc = tabCfg?.bg || (() => {
    const state = mood
      ? (mood >= 4 ? 'GREEN' : mood === 3 ? 'YELLOW' : 'RED')
      : (recoveryLight || 'GREEN')
    return (SANCTUARY_CONFIG[state] || SANCTUARY_CONFIG.GREEN).bg
  })()

  const bgColor = tabCfg?.bgFallback || '#e8f5ee'

  return (
    <>
      {/* Color base siempre visible — fallback mientras no hay PNG */}
      <div style={{ position:'absolute', inset:0, backgroundColor: bgColor, zIndex:0 }} />
      <AnimatePresence mode="wait">
        <motion.div
          key={bgSrc}
          initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
          transition={{ duration:1.2 }}
          style={{
            position:'absolute', inset:0, zIndex:1,
            backgroundImage:`url(${bgSrc})`,
            backgroundSize:'cover',
            backgroundPosition:'center bottom',
            backgroundRepeat:'no-repeat',
          }}
        />
      </AnimatePresence>
    </>
  )
}

// ─── PANDI ANIMADA ───────────────────────────────────────────────────────────
function SanctuaryPandi({ mood, pandiMode, cfg, activeTab, recoveryLight }) {
  const [imgErr, setImgErr] = useState(false)
  const isMeditating = activeTab === 'meditation'

  const frame = (() => {
    if (activeTab && TAB_CONFIG[activeTab]?.frames?.[0]) {
      return TAB_CONFIG[activeTab].frames[0]
    }
    const light = recoveryLight || 'GREEN'
    if (light === 'GREEN')  return '/panda/panda_stay.png'
    if (light === 'YELLOW') return '/panda/panda_base.png'
    if (light === 'RED')    return '/panda/panda_sad.png'
    return '/panda/panda_base.png'
  })()

  return (
    <div style={{ position:'relative', width:'100%', display:'flex',
      alignItems:'center', justifyContent:'center' }}>

      {/* Aura de meditación — solo visible cuando medita */}
      <AnimatePresence>
        {isMeditating && (
          <>
            {/* Anillo exterior */}
            <motion.div
              key="aura-outer"
              initial={{ opacity:0, scale:0.6 }}
              animate={{ opacity:[0.15,0.35,0.15], scale:[1,1.18,1] }}
              exit={{ opacity:0, scale:0.6 }}
              transition={{ duration:4, repeat:Infinity, ease:'easeInOut' }}
              style={{ position:'absolute', width:'160%', height:'160%',
                borderRadius:'50%',
                background:'radial-gradient(circle, rgba(168,139,250,0.5) 0%, transparent 65%)',
                filter:'blur(18px)', zIndex:0 }} />
            {/* Anillo medio */}
            <motion.div
              key="aura-mid"
              initial={{ opacity:0, scale:0.5 }}
              animate={{ opacity:[0.2,0.5,0.2], scale:[0.9,1.08,0.9] }}
              exit={{ opacity:0 }}
              transition={{ duration:3, repeat:Infinity, ease:'easeInOut', delay:0.5 }}
              style={{ position:'absolute', width:'110%', height:'110%',
                borderRadius:'50%',
                background:'radial-gradient(circle, rgba(196,169,110,0.6) 0%, transparent 60%)',
                filter:'blur(10px)', zIndex:0 }} />
            {/* Partículas flotantes */}
            {[...Array(6)].map((_, i) => (
              <motion.div key={`p${i}`}
                animate={{ y:[-10, -40, -10], opacity:[0,0.8,0], x: (i%2===0?1:-1)*10 }}
                transition={{ duration:2.5+i*0.4, repeat:Infinity, delay:i*0.5, ease:'easeInOut' }}
                style={{ position:'absolute', bottom:'40%',
                  left:`${30 + i*8}%`,
                  width:6, height:6, borderRadius:'50%', zIndex:6,
                  background: i%3===0 ? 'rgba(168,139,250,0.8)'
                    : i%3===1 ? 'rgba(196,169,110,0.8)'
                    : 'rgba(255,200,200,0.8)',
                  boxShadow:`0 0 6px 2px ${i%2===0 ? 'rgba(168,139,250,0.5)' : 'rgba(196,169,110,0.5)'}` }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Pandi */}
      <div style={{ position:'relative', zIndex:2, width:'100%' }}>
        {imgErr
          ? <span style={{ fontSize:80, display:'block', textAlign:'center' }}>🐾</span>
          : <motion.img src={frame} alt="Pandi"
              animate={isMeditating ? { scale:[1,1.03,1] } : {}}
              transition={{ duration:4, repeat:Infinity, ease:'easeInOut' }}
              style={{ width:'100%', height:'auto', objectFit:'contain', display:'block' }}
              onError={() => setImgErr(true)} />
        }
      </div>
    </div>
  )
}

// ─── TABS ─────────────────────────────────────────────────────────────────────

function CheckinTab({ theme, userId, addXP, onTabChange, onMoodSaved, profile }) {
  const [logs,         setLogs]         = useState([])
  const [mood,         setMood]         = useState(null)
  const [notes,        setNotes]        = useState('')
  const [saved,        setSaved]        = useState(false)
  const [pandiMessage, setPandiMessage] = useState('')
  const [loadingCoach, setLoadingCoach] = useState(false)
  const today = new Date().toISOString().split('T')[0]

  async function load() {
    const { data } = await supabase.from('mood_logs').select('*')
      .eq('user_id', userId).order('date', { ascending: false }).limit(7)
    setLogs(data || [])
    const t = data?.find(l => l.date === today)
    if (t) {
      setMood(t.mood); setNotes(t.notes || ''); setSaved(true)
      setPandiMessage(PANDI_MOOD_MESSAGES.already_saved[t.mood] || '')
      onMoodSaved?.(t.mood)
    }
  }

  useEffect(() => {
    if (userId) load()
    // Saludo de voz al entrar
    const name = profile?.name?.split(' ')[0] || ''
    setTimeout(() => sayAsync(PANDI_VOICE.greeting(name)), 800)
  }, [userId])

  async function save() {
    if (!mood) return
    setLoadingCoach(true)
    await supabase.from('mood_logs').upsert(
      { user_id: userId, date: today, mood, notes },
      { onConflict: 'user_id,date' }
    )
    await addXP(10)
    setSaved(true)
    onMoodSaved?.(mood)
    // TTS respuesta al mood
    sayAsync(PANDI_VOICE.moodResponse[mood])
    try {
      const moodLabel = MOODS.find(m => m.v === mood)?.label || 'Desconocido'
      const promptOculto = `[SISTEMA: El usuario acaba de hacer Check-in. Estado: "${moodLabel}" (${mood}/5). Notas: "${notes || 'Sin notas'}". Respuesta corta, máx 3 líneas, empática, sin introducciones.]`
      const res  = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: promptOculto, userId }),
      })
      const data = await res.json()
      setPandiMessage(data?.response || PANDI_MOOD_MESSAGES.first[mood] || '')
    } catch {
      setPandiMessage(PANDI_MOOD_MESSAGES.first[mood] ?? '')
    } finally {
      setLoadingCoach(false); load()
    }
  }

  const consecutiveLow = (() => {
    if (logs.length < 3) return false
    return [0, 1, 2].every(i => {
      const d = new Date(); d.setDate(d.getDate() - i)
      const ds = d.toISOString().split('T')[0]
      const l  = logs.find(x => x.date === ds)
      return l && l.mood <= 2
    })
  })()

  const finalMessage = saved ? pandiMessage : (PANDI_MOOD_MESSAGES.first[mood] ?? '')
  const action       = (!saved && mood) ? PANDI_ACTIONS[mood] : null
  const moodData     = MOODS.find(m => m.v === mood)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

      {/* Selector mood — botones flotantes */}
      <div style={{ display:'flex', justifyContent:'space-around' }}>
        {MOODS.map(m => (
          <motion.button key={m.v} whileTap={{ scale:0.85 }}
            onClick={() => { setMood(m.v); setSaved(false); setPandiMessage('') }}
            style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4,
              padding:'10px 8px', borderRadius:16, border:'none', cursor:'pointer',
              background: mood === m.v ? `${m.color}33` : 'rgba(255,255,255,0.45)',
              backdropFilter:'blur(12px)',
              outline: mood === m.v ? `2px solid ${m.color}80` : '2px solid transparent',
              opacity: mood && mood !== m.v ? 0.5 : 1, transition:'all 0.2s' }}>
            <span style={{ fontSize:32 }}>{m.emoji}</span>
            <span style={{ fontSize:10, fontWeight:700,
              color: mood === m.v ? m.color : 'rgba(255,255,255,0.8)' }}>{m.label}</span>
          </motion.button>
        ))}
      </div>

      <input
        style={{ width:'100%', padding:'12px 16px', borderRadius:14,
          border:'1.5px solid rgba(255,255,255,0.3)',
          background:'rgba(255,255,255,0.45)', backdropFilter:'blur(12px)',
          fontSize:13, outline:'none', boxSizing:'border-box', color:'#1A2332' }}
        placeholder="¿Qué ha influido? (opcional)…"
        value={notes} onChange={e => setNotes(e.target.value)} disabled={loadingCoach}
      />

      <motion.button whileTap={{ scale:0.97 }} onClick={save}
        disabled={!mood || saved || loadingCoach}
        style={{ width:'100%', padding:'13px', borderRadius:16, border:'none', cursor:'pointer',
          background: mood && !saved ? 'rgba(201,169,110,0.85)' : 'rgba(255,255,255,0.35)',
          backdropFilter:'blur(12px)',
          color: mood && !saved ? 'white' : 'rgba(255,255,255,0.6)',
          fontSize:14, fontWeight:700, opacity: !mood || loadingCoach ? 0.5 : 1 }}>
        {loadingCoach ? '🧠 Pandi analizando...' : saved ? '✅ Guardado hoy' : '💾 Guardar (+10 XP)'}
      </motion.button>

      {/* Respuesta Pandi */}
      <AnimatePresence>
        {mood && (finalMessage || loadingCoach) && (
          <motion.div key={mood} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
            exit={{ opacity:0 }}
            style={{ background:'rgba(255,255,255,0.45)', backdropFilter:'blur(16px)',
              borderRadius:20, padding:'14px',
              borderLeft:`3px solid ${moodData?.color}` }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
              <PandaImg name={mood >= 4 ? 'avatar_happy' : 'avatar_neutro'} size={44}
                style={{ borderRadius: 12, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 10, fontWeight: 800, color: theme.primary,
                  textTransform: 'uppercase', letterSpacing: '.05em', margin: '0 0 6px' }}>
                  Pandi Coach (IA)
                </p>
                {loadingCoach ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ height: 12, borderRadius: 6, background: 'rgba(0,0,0,0.08)',
                      width: '75%', animation: 'pulse 1.5s infinite' }} />
                    <div style={{ height: 12, borderRadius: 6, background: 'rgba(0,0,0,0.08)',
                      width: '90%', animation: 'pulse 1.5s infinite' }} />
                  </div>
                ) : (
                  <p style={{ fontSize: 13, lineHeight: 1.6, color: '#1A2332', margin: 0 }}>{finalMessage}</p>
                )}
              </div>
            </div>
            {action && !loadingCoach && (
              <motion.button whileTap={{ scale: 0.96 }}
                onClick={() => action.tab && onTabChange(action.tab)}
                style={{ width: '100%', padding: '12px', borderRadius: 14, border: 'none',
                  cursor: 'pointer', background: `linear-gradient(135deg, ${moodData?.color}, #FF8FA3)`,
                  color: 'white', fontSize: 14, fontWeight: 700 }}>
                {action.label}
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alerta días difíciles */}
      <AnimatePresence>
        {consecutiveLow && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ background: 'rgba(254,243,199,0.95)', backdropFilter: 'blur(12px)',
              borderRadius: 20, padding: '16px', border: '1px solid #FCD34D', textAlign: 'center' }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#92400E', margin: '0 0 6px' }}>
              Llevas varios días difíciles 🤍
            </p>
            <p style={{ fontSize: 12, color: '#78350F', margin: 0 }}>
              Si lo necesitas, hablar con alguien de confianza siempre ayuda.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function BreathingTab({ theme }) {
  const [tech,    setTech]    = useState(null)   // null = sin selección
  const [running, setRunning] = useState(false)
  const [phase,   setPhase]   = useState('inhale')
  const [count,   setCount]   = useState(0)
  const [rounds,  setRounds]  = useState(0)
  const timerRef    = useRef(null)
  const intervalRef = useRef(null)
  const breathAudio = useRef({
    inhale: new Audio(A.breath.inhale),
    hold:   new Audio(A.breath.hold),
    exhale: new Audio(A.breath.exhale),
  })

  function playCue(k) {
    const a = breathAudio.current[k === 'holdOut' ? 'hold' : k]
    if (!a) return
    a.currentTime = 0; a.volume = 0.8; a.play().catch(() => {})
  }

  function buildSeq(tk) {
    const t = TECHNIQUES[tk]
    return [
      { key:'inhale',  dur:t.inhale },
      ...(t.hold    > 0 ? [{ key:'hold',    dur:t.hold    }] : []),
      { key:'exhale',  dur:t.exhale },
      ...(t.holdOut > 0 ? [{ key:'holdOut', dur:t.holdOut }] : []),
    ]
  }

  function stop() {
    clearTimeout(timerRef.current); clearInterval(intervalRef.current)
    stopSpeech()
    setRunning(false); setPhase('inhale'); setCount(0)
  }

  function runPhase(seq, idx, rc) {
    const p = seq[idx]
    setPhase(p.key); setCount(p.dur); playCue(p.key)
    sayAsync(PANDI_VOICE.breathPhase[p.key] || p.key, { rate:0.8, volume:0.7 })
    let c = p.dur
    intervalRef.current = setInterval(() => {
      c--; setCount(c)
      if (c <= 0) {
        clearInterval(intervalRef.current)
        const ni = (idx + 1) % seq.length
        const nr = ni === 0 ? rc + 1 : rc
        if (ni === 0) setRounds(nr)
        timerRef.current = setTimeout(() => runPhase(seq, ni, nr), 300)
      }
    }, 1000)
  }

  function start() {
    stop(); const seq = buildSeq(tech)
    setRunning(true); setRounds(0); runPhase(seq, 0, 0)
  }

  useEffect(() => () => stop(), [])

  const phaseInfo = PHASES[phase]
  const t = tech ? TECHNIQUES[tech] : null
  const animDur = t ? (phase === 'inhale' ? t.inhale : phase === 'exhale' ? t.exhale
    : phase === 'hold' ? t.hold : t.holdOut) : 4

  // Escala de Pandi según fase
  const pandiScale = running
    ? (phase === 'inhale' || phase === 'hold' ? 1.08 : 0.94)
    : 1

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16, padding:'8px 16px 0' }}>

      {/* Fase actual sobre Pandi — solo durante el ejercicio */}
      {running && (
        <AnimatePresence mode="wait">
          <motion.div key={phase}
            initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            style={{ textAlign:'center' }}>
            <p style={{ fontSize:20, fontWeight:900, color: phaseInfo.color, margin:0 }}>
              {phaseInfo.label}
            </p>
            <motion.p key={count} initial={{ scale:1.4, opacity:0.6 }} animate={{ scale:1, opacity:1 }}
              style={{ fontSize:44, fontWeight:900, color:'#1A2332', margin:'2px 0 0' }}>
              {count}
            </motion.p>
            {rounds > 0 && (
              <p style={{ fontSize:11, color:'rgba(255,255,255,0.7)', margin:'4px 0 0' }}>
                {rounds} ronda{rounds > 1 ? 's' : ''} ✓
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Selector de técnica — botones semitransparentes sobre el fondo */}
      {!running && (
        <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap' }}>
          {Object.entries(TECHNIQUES).map(([k, v]) => (
            <motion.button key={k} whileTap={{ scale:0.94 }}
              onClick={() => setTech(k)}
              style={{ padding:'10px 18px', borderRadius:20, border:'none', cursor:'pointer',
                fontWeight:700, fontSize:12, transition:'all 0.2s',
                background: tech === k
                  ? 'rgba(201,169,110,0.85)'
                  : 'rgba(255,255,255,0.55)',
                backdropFilter:'blur(12px)',
                color: tech === k ? 'white' : '#B8924A',
                boxShadow: tech === k ? '0 4px 16px rgba(201,169,110,0.4)' : 'none' }}>
              {v.name}
            </motion.button>
          ))}
        </div>
      )}

      {/* Botón Iniciar / Parar */}
      <AnimatePresence>
        {tech && !running && (
          <motion.button whileTap={{ scale:0.95 }}
            initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            onClick={start}
            style={{ padding:'12px 36px', borderRadius:24, border:'none', cursor:'pointer',
              fontWeight:800, fontSize:14, color:'white',
              background:'rgba(201,169,110,0.85)', backdropFilter:'blur(12px)',
              boxShadow:'0 6px 20px rgba(201,169,110,0.4)' }}>
            Iniciar
          </motion.button>
        )}
        {running && (
          <motion.button whileTap={{ scale:0.95 }}
            initial={{ opacity:0 }} animate={{ opacity:1 }}
            onClick={stop}
            style={{ padding:'10px 28px', borderRadius:20, border:'none', cursor:'pointer',
              fontWeight:700, fontSize:12,
              background:'rgba(255,255,255,0.5)', backdropFilter:'blur(12px)',
              color:'#B8924A' }}>
            Parar
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}

function MeditationTab({ theme, profile, userId }) {
  const [duration, setDuration] = useState(5)
  const [sound,    setSound]    = useState(null)
  const [running,  setRunning]  = useState(false)
  const [elapsed,  setElapsed]  = useState(0)
  const [muted,    setMuted]    = useState(false)
  const [done,     setDone]     = useState(false)
  const [streakInfo, setStreakInfo] = useState(null) // { streak, newAccessory }
  const ambientRef  = useRef(null)
  const medAudioRef = useRef(null)
  const intervalRef = useRef(null)

  const total    = duration * 60
  const left     = Math.max(total - elapsed, 0)
  const mm       = String(Math.floor(left / 60)).padStart(2, '0')
  const ss       = String(left % 60).padStart(2, '0')
  const progress = total > 0 ? elapsed / total : 0

  function stopAll() {
    clearInterval(intervalRef.current)
    stopAmbient(ambientRef)
    stopSpeech()
    const med = medAudioRef.current
    if (med) { fadeOut(med); medAudioRef.current = null }
  }

  async function start() {
    stopAll()
    // TTS inicio
    const name = profile?.name?.split(' ')[0] || ''
    await speak(PANDI_VOICE.meditationStart(duration), { rate: 0.85 })
    if (sound) playAmbient(sound, ambientRef)
    const session = pickSession(duration)
    const med = new Audio(A.med(session))
    med.volume = 0.75; med.play().catch(() => {})
    medAudioRef.current = med
    setElapsed(0); setRunning(true); setDone(false)
    intervalRef.current = setInterval(() => {
      setElapsed(e => {
        if (e + 1 >= total) {
          clearInterval(intervalRef.current)
          setRunning(false); setDone(true); stopAll()
          useStore.getState().addXP?.(duration * 5)
          useStore.getState().addBondXP?.(10)
          registerMeditationSession(userId).then(setStreakInfo)
          // TTS fin
          setTimeout(() => sayAsync(PANDI_VOICE.meditationEnd(name)), 500)
          return total
        }
        return e + 1
      })
    }, 1000)
  }

  function reset() {
    stopAll(); setRunning(false); setElapsed(0); setDone(false); setMuted(false); setStreakInfo(null)
  }

  function toggleMute() {
    const amb = ambientRef.current; const med = medAudioRef.current
    if (!amb && !med) return
    const nm = !muted
    if (amb) amb.volume = nm ? 0 : 0.45
    if (med) med.volume = nm ? 0 : 0.75
    setMuted(nm)
  }

  useEffect(() => () => stopAll(), [])

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

      {/* Duración */}
      <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
        {[2, 5, 10].map(d => (
          <button key={d} onClick={() => !running && setDuration(d)} disabled={running}
            style={{ padding:'10px 20px', borderRadius:20, fontWeight:700, fontSize:13, border:'none',
              cursor: running ? 'default' : 'pointer', transition:'all 0.2s',
              background: duration === d ? 'rgba(201,169,110,0.85)' : 'rgba(255,255,255,0.55)',
              backdropFilter:'blur(12px)',
              color: duration === d ? 'white' : '#B8924A',
              boxShadow: duration === d ? '0 4px 16px rgba(201,169,110,0.4)' : 'none' }}>
            {d} min
          </button>
        ))}
      </div>

      {/* Sonido ambiental */}
      <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap' }}>
        {AMBIENT.map(a => (
          <button key={a.id} onClick={() => !running && setSound(s => s === a.id ? null : a.id)}
            disabled={running}
            style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3,
              padding:'8px 12px', borderRadius:16, border:'none', cursor:'pointer',
              background: sound === a.id ? 'rgba(201,169,110,0.85)' : 'rgba(255,255,255,0.55)',
              backdropFilter:'blur(12px)',
              outline: `2px solid ${sound === a.id ? '#B8924A' : 'transparent'}` }}>
            <span style={{ fontSize:18 }}>{a.emoji}</span>
            <span style={{ fontSize:9, fontWeight:700,
              color: sound === a.id ? 'white' : '#B8924A' }}>{a.label}</span>
          </button>
        ))}
      </div>

      {/* Temporizador flotante — sin caja */}
      {(running || done) && (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
          {/* Barra progreso */}
          <div style={{ width:'80%', height:4, borderRadius:2,
            background:'rgba(255,255,255,0.3)', overflow:'hidden' }}>
            <motion.div style={{ height:'100%', borderRadius:2,
              background:'rgba(201,169,110,0.9)' }}
              animate={{ width:`${progress * 100}%` }}
              transition={{ duration:1, ease:'linear' }} />
          </div>

          <p style={{ fontSize:40, fontWeight:900, color:'white', margin:0,
            textShadow:'0 2px 12px rgba(0,0,0,0.3)' }}>
            {done ? '¡Completado!' : `${mm}:${ss}`}
          </p>

          {done && streakInfo && (
            <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
              style={{ textAlign:'center' }}>
              <p style={{ fontSize:13, color:'#FCD34D', fontWeight:700, margin:0 }}>
                🔥 {streakInfo.streak} día{streakInfo.streak > 1 ? 's' : ''} seguidos meditando
              </p>
            </motion.div>
          )}
        </div>
      )}

      {/* Botones de control */}
      <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
        {!running && !done && (
          <motion.button whileTap={{ scale:0.94 }} onClick={start}
            style={{ padding:'12px 36px', borderRadius:24, border:'none', cursor:'pointer',
              fontWeight:800, fontSize:14, color:'white',
              background:'rgba(201,169,110,0.85)', backdropFilter:'blur(12px)',
              boxShadow:'0 6px 20px rgba(201,169,110,0.4)' }}>
            Iniciar
          </motion.button>
        )}
        {running && (
          <>
            <motion.button whileTap={{ scale:0.94 }} onClick={reset}
              style={{ padding:'10px 24px', borderRadius:20, border:'none', cursor:'pointer',
                fontWeight:700, background:'rgba(255,255,255,0.5)', backdropFilter:'blur(12px)',
                color:'#B8924A' }}>
              Parar
            </motion.button>
            <button onClick={toggleMute}
              style={{ width:42, height:42, borderRadius:14, border:'none', cursor:'pointer',
                background:'rgba(255,255,255,0.5)', backdropFilter:'blur(12px)',
                display:'flex', alignItems:'center', justifyContent:'center' }}>
              {muted ? <VolumeX size={16} color="#B8924A" /> : <Volume2 size={16} color="#B8924A" />}
            </button>
          </>
        )}
        {done && (
          <motion.button whileTap={{ scale:0.94 }} onClick={reset}
            style={{ padding:'12px 28px', borderRadius:20, border:'none', cursor:'pointer',
              fontWeight:700, background:'rgba(201,169,110,0.85)', backdropFilter:'blur(12px)',
              color:'white' }}>
            Nueva sesión
          </motion.button>
        )}
      </div>
    </div>
  )
}

function MeditationPandi({ running }) {
  const [frame, setFrame] = useState(1)
  const [err,   setErr]   = useState(false)

  useEffect(() => {
    if (!running) { setFrame(1); return }
    const id = setTimeout(() => setFrame(2), 15000)
    return () => clearTimeout(id)
  }, [running])

  if (err) return (
    <motion.span animate={running ? { scale:[1,1.06,1] } : {}}
      transition={{ duration:5, repeat:Infinity }} style={{ fontSize:100 }}>🧘</motion.span>
  )

  return (
    <div style={{ position:'relative', display:'flex', alignItems:'center',
      justifyContent:'center', width:'100%', maxWidth:280 }}>
      <motion.div
        animate={running ? { scale:[1,1.15,1], opacity:[0.35,0.55,0.35] } : { scale:1, opacity:0.2 }}
        transition={{ duration:5, repeat:Infinity, ease:'easeInOut' }}
        style={{ position:'absolute', width:'85%', height:'85%', borderRadius:'50%',
          background:'radial-gradient(circle,#e9d5ff 0%,#c084fc 35%,#a855f7 60%,transparent 80%)',
          filter:'blur(28px)', zIndex:0 }}
      />
      <motion.div
        animate={running ? { scale:[1,1.055,1] } : { scale:1 }}
        transition={running ? { duration:5, repeat:Infinity, ease:'easeInOut' } : { duration:0.4 }}
        style={{ position:'relative', zIndex:1, width:'100%', height:260 }}>
        <AnimatePresence mode="wait">
          <motion.img key={frame} src={`/panda/meditate_${frame}.png`} alt="Pandi meditando"
            initial={{ opacity:0, scale:0.96 }} animate={{ opacity:1, scale:1 }}
            exit={{ opacity:0, scale:0.96 }} transition={{ duration:1.8, ease:'easeInOut' }}
            style={{ width:'100%', height:'100%', objectFit:'contain' }}
            onError={() => setErr(true)} />
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

function HabitsTab({ theme, userId, onHabitsUpdate, profile }) {
  const today      = new Date().toISOString().split('T')[0]
  const storageKey = `pandi_habits_${today}`
  const configKey  = 'pandi_habit_config'

  const [habits, setHabits] = useState(() => {
    try {
      const saved = localStorage.getItem(configKey)
      return saved ? JSON.parse(saved) : DEFAULT_HABITS.map(h => ({ ...h, enabled: true }))
    } catch { return DEFAULT_HABITS.map(h => ({ ...h, enabled: true })) }
  })
  const [checked, setChecked] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      return saved ? JSON.parse(saved) : {}
    } catch { return {} }
  })
  const [celebrated, setCelebrated] = useState(false)

  const active    = habits.filter(h => h.enabled)
  const doneCount = active.filter(h => checked[h.id]).length
  const allDone   = active.length > 0 && doneCount === active.length

  useEffect(() => { onHabitsUpdate?.(checked) }, [checked])

  function toggle(id) {
    const next = { ...checked, [id]: !checked[id] }
    setChecked(next)
    try { localStorage.setItem(storageKey, JSON.stringify(next)) } catch {}
    if (!checked[id] && active.every(h => h.id === id ? true : checked[h.id])) {
      setCelebrated(true)
      useStore.getState().addBondXP?.(5)
      const name = profile?.name?.split(' ')[0] || ''
      setTimeout(() => sayAsync(PANDI_VOICE.habitsDone(name)), 300)
      setTimeout(() => setCelebrated(false), 3000)
    }
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ background:'rgba(255,255,255,0.65)', backdropFilter:'blur(16px)',
        borderRadius:24, padding:'16px', display:'flex', alignItems:'center', gap:12,
        border:`1px solid ${theme.primary}20` }}>
        <AnimatePresence mode="wait">
          {allDone
            ? <motion.div key="celebrate" initial={{ scale:0.5 }} animate={{ scale:1 }}>
                <PandaImg name="avatar_celebrate" size={48} />
              </motion.div>
            : <motion.div key="normal">
                <PandaImg name="avatar_neutro" size={48} />
              </motion.div>
          }
        </AnimatePresence>
        <div style={{ flex:1 }}>
          <p style={{ fontWeight:700, fontSize:14, color:'#1A2332', margin:'0 0 2px' }}>
            {allDone ? '¡Todo listo hoy! 🎉' : `${doneCount} de ${active.length} hábitos`}
          </p>
          <p style={{ fontSize:12, color:'#9CA3AF', margin:0 }}>
            {allDone ? 'Pandi está proud de ti 🐾' : 'Cada hábito cuenta. Uno a la vez.'}
          </p>
        </div>
        {active.length > 0 && (
          <p style={{ fontSize:22, fontWeight:900, color:theme.primary, margin:0 }}>
            {Math.round((doneCount/active.length)*100)}%
          </p>
        )}
      </div>

      <AnimatePresence>
        {celebrated && (
          <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }}
            exit={{ opacity:0 }}
            style={{ background:'rgba(255,255,255,0.65)', backdropFilter:'blur(16px)',
              borderRadius:24, padding:'20px', textAlign:'center' }}>
            <p style={{ fontSize:32, margin:'0 0 8px' }}>🎊</p>
            <p style={{ fontWeight:700, color:'#1A2332', margin:'0 0 4px' }}>
              ¡Todos los hábitos completados!
            </p>
            <p style={{ fontSize:12, color:'#9CA3AF', margin:0 }}>Pandi está muy orgulloso 🐼</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ background:'rgba(255,255,255,0.65)', backdropFilter:'blur(16px)',
        borderRadius:24, padding:'16px' }}>
        <p style={{ fontSize:14, fontWeight:700, color:'#1A2332', margin:'0 0 12px' }}>Hoy</p>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {active.map(h => (
            <motion.button key={h.id} whileTap={{ scale:0.97 }} onClick={() => toggle(h.id)}
              style={{ display:'flex', alignItems:'center', gap:12, padding:'12px',
                borderRadius:16, border:'none', cursor:'pointer', textAlign:'left', width:'100%',
                background: checked[h.id] ? `${theme.primary}12` : 'rgba(0,0,0,0.04)',
                outline:`2px solid ${checked[h.id] ? theme.primary+'60' : 'transparent'}`,
                transition:'all 0.2s' }}>
              <div style={{ width:36, height:36, borderRadius:12, flexShrink:0, fontSize:20,
                display:'flex', alignItems:'center', justifyContent:'center',
                background: checked[h.id] ? `${theme.primary}20` : 'rgba(0,0,0,0.06)' }}>
                {h.icon}
              </div>
              <p style={{ flex:1, fontSize:14, fontWeight:600, margin:0,
                color: checked[h.id] ? theme.primary : '#1A2332',
                textDecoration: checked[h.id] ? 'line-through' : 'none' }}>{h.name}</p>
              <div style={{ width:22, height:22, borderRadius:'50%', flexShrink:0,
                border:`2px solid ${checked[h.id] ? theme.primary : '#D1D5DB'}`,
                background: checked[h.id] ? theme.primary : 'transparent',
                display:'flex', alignItems:'center', justifyContent:'center' }}>
                {checked[h.id] && <Check size={12} color="white" />}
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}

function SantuarioTab({ theme, userLevel, currentMood, habitsChecked }) {
  const [mascotaActiva,   setMascotaActiva]   = useState(() => {
    try { return localStorage.getItem('pandi_active_pet') || 'pandi' } catch { return 'pandi' }
  })
  const [nombresMascotas, setNombresMascotas] = useState(() => {
    try {
      const saved = localStorage.getItem('pandi_pet_names')
      return saved ? JSON.parse(saved) : { pandi: 'Pandi', slothi: 'Slothi', lumi: 'Lumi' }
    } catch { return { pandi: 'Pandi', slothi: 'Slothi', lumi: 'Lumi' } }
  })
  const [editingName,  setEditingName]  = useState(false)
  const [newNameInput, setNewNameInput] = useState('')

  const menteStatus  = currentMood ? (currentMood / 5) * 100 : 50
  const totalHabits  = Object.keys(habitsChecked).length || 3
  const doneHabits   = Object.values(habitsChecked).filter(Boolean).length
  const rutinaStatus = Math.min(Math.round((doneHabits / totalHabits) * 100) || 0, 100)
  const almaStatus   = 75

  const infoMascota  = MASCOTAS_COLECCIONABLES.find(m => m.id === mascotaActiva)
  const nombreActual = nombresMascotas[mascotaActiva] || infoMascota?.nombreDefault

  let sufijoEstado = 'neutro'
  if (currentMood >= 4)     sufijoEstado = 'happy'
  if (rutinaStatus === 100) sufijoEstado = 'celebrate'

  const prefijoMascota    = mascotaActiva === 'pandi' ? 'avatar' : mascotaActiva
  const pathImagenMascota = `/panda/${prefijoMascota}_${sufijoEstado}.png`

  function cambiarNombre() {
    if (!newNameInput.trim()) return
    const next = { ...nombresMascotas, [mascotaActiva]: newNameInput }
    setNombresMascotas(next)
    try { localStorage.setItem('pandi_pet_names', JSON.stringify(next)) } catch {}
    setEditingName(false)
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {/* Mascota activa */}
      <div style={{ background:'rgba(255,255,255,0.65)', backdropFilter:'blur(16px)',
        borderRadius:24, padding:'24px 16px', display:'flex', flexDirection:'column', alignItems:'center' }}>
        <div style={{ textAlign:'center', marginBottom:16 }}>
          {editingName ? (
            <div style={{ display:'flex', gap:8, alignItems:'center', justifyContent:'center' }}>
              <input value={newNameInput} onChange={e => setNewNameInput(e.target.value)} maxLength={12}
                style={{ padding:'6px 12px', borderRadius:12, border:'1.5px solid rgba(0,0,0,0.1)',
                  fontSize:15, fontWeight:700, textAlign:'center', outline:'none' }} />
              <button onClick={cambiarNombre}
                style={{ padding:'6px 10px', borderRadius:10, border:'none', cursor:'pointer',
                  background:'#22C55E', color:'white' }}>
                <Check size={14} />
              </button>
            </div>
          ) : (
            <div onClick={() => { setNewNameInput(nombreActual); setEditingName(true) }}
              style={{ cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
              <p style={{ fontSize:22, fontWeight:900, color:'#1A2332', margin:0 }}>{nombreActual}</p>
              <span style={{ fontSize:12, opacity:0.5 }}>✏️</span>
            </div>
          )}
          <p style={{ fontSize:10, textTransform:'uppercase', fontWeight:700, letterSpacing:'.1em',
            color:'#9CA3AF', margin:'4px 0 0' }}>{infoMascota?.especie}</p>
        </div>

        <div style={{ position:'relative', width:180, height:200, display:'flex',
          alignItems:'center', justifyContent:'center', marginBottom:16 }}>
          <div style={{ position:'absolute', width:160, height:160, borderRadius:'50%',
            background: currentMood <= 2 ? 'rgba(249,115,22,0.15)' : 'rgba(46,196,182,0.15)',
            filter:'blur(30px)', animation:'pulse 3s infinite' }} />
          <motion.img src={pathImagenMascota} alt={nombreActual}
            initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }}
            style={{ width:160, height:160, objectFit:'contain', position:'relative', zIndex:1 }}
            onError={e => { e.target.style.display='none' }} />
        </div>

        {/* Stats */}
        <div style={{ width:'100%', display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
          {[
            { icon:'😊', label:'Mente',  value:menteStatus,  color:'#F59E0B' },
            { icon:'❤️', label:'Rutina', value:rutinaStatus, color:'#EF4444' },
            { icon:'✨', label:'Alma',   value:almaStatus,   color:'#8B5CF6' },
          ].map(({ icon, label, value, color }) => (
            <div key={label} style={{ background:'rgba(0,0,0,0.04)', borderRadius:16,
              padding:'10px 8px', display:'flex', flexDirection:'column', gap:6 }}>
              <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, fontWeight:700, color:'#1A2332' }}>
                <span style={{ fontSize:12 }}>{icon}</span> {label}
              </div>
              <div style={{ height:5, borderRadius:3, background:'rgba(0,0,0,0.08)', overflow:'hidden' }}>
                <div style={{ height:'100%', borderRadius:3, background:color,
                  width:`${value}%`, transition:'width 0.6s ease' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Coleccionables */}
      <div style={{ background:'rgba(255,255,255,0.65)', backdropFilter:'blur(16px)',
        borderRadius:24, padding:'16px' }}>
        <p style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em',
          color:'#9CA3AF', margin:'0 0 12px' }}>Tus Coleccionables</p>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {MASCOTAS_COLECCIONABLES.map(m => {
            const desbloqueado  = userLevel >= m.nivelRequerido
            const esActiva      = mascotaActiva === m.id
            const nombreMascota = nombresMascotas[m.id] || m.nombreDefault
            return (
              <div key={m.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px',
                borderRadius:18, transition:'all 0.2s', opacity:desbloqueado ? 1 : 0.6,
                background: esActiva ? `${theme.primary}10` : 'rgba(0,0,0,0.04)',
                border:`1px solid ${esActiva ? theme.primary+'40' : 'transparent'}` }}>
                <div style={{ width:48, height:48, borderRadius:14, background:'rgba(255,255,255,0.8)',
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>
                  {!desbloqueado
                    ? <Lock size={16} color="#9CA3AF" />
                    : <img src={m.id === 'pandi' ? '/panda/avatar_neutro.png' : `/panda/${m.id}_neutro.png`}
                        alt={m.id} style={{ width:36, height:36, objectFit:'contain' }}
                        onError={e => { e.target.style.display='none' }} />
                  }
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:14, fontWeight:700, color:'#1A2332', margin:'0 0 2px' }}>{nombreMascota}</p>
                  <p style={{ fontSize:11, color:'#9CA3AF', margin:0, overflow:'hidden',
                    textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.desc}</p>
                </div>
                {desbloqueado ? (
                  <button onClick={() => { setMascotaActiva(m.id); try { localStorage.setItem('pandi_active_pet', m.id) } catch {} }}
                    style={{ fontSize:12, fontWeight:700, padding:'6px 12px', borderRadius:12,
                      border:'none', cursor:'pointer',
                      background: esActiva ? theme.primary : 'rgba(0,0,0,0.06)',
                      color: esActiva ? 'white' : '#1A2332' }}>
                    {esActiva ? 'Activa' : 'Elegir'}
                  </button>
                ) : (
                  <div style={{ fontSize:10, fontWeight:700, padding:'4px 8px', borderRadius:10,
                    background:'rgba(0,0,0,0.06)', color:'#9CA3AF' }}>
                    Nivel {m.nivelRequerido}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function Mood() {
  const { theme }       = useTheme()
  const { user, profile, addXP } = useStore()
  const { recoveryLight } = usePandiState()
  const navigate = useNavigate()

  const [activeTab,     setActiveTab]     = useState(null)
  const [currentMood,   setCurrentMood]   = useState(null)
  const [habitsChecked, setHabitsChecked] = useState({})
  // ─── AJUSTES DEL TAB BAR — edita estos valores ───────────────────────────
  const TAB_BAR_BOTTOM    = 96   // px sobre el nav — sube el número para alejarlo más
  const TAB_BAR_ICON_SIZE = 36   // px tamaño del icono
  const TAB_BAR_PADDING   = '13px 16px' // padding interno de cada tab
  const TAB_BAR_MIN_WIDTH = 64   // px ancho mínimo de cada tab
  const TAB_BAR_FONT_SIZE = 10   // px tamaño del label
  // ─────────────────────────────────────────────────────────────────────────

  const [sheetOpen,     setSheetOpen]     = useState(false)
  const [pandiEditMode, setPandiEditMode] = useState(false)
  const [pandiConfig,   setPandiConfig]   = useState(() => {
    try { return JSON.parse(localStorage.getItem('pandi_mood_cfg') || 'null') || { bottom:22, size:42 } }
    catch { return { bottom:22, size:42 } }
  })
  const [showPulse,     setShowPulse]     = useState(false)
  const [showSunJourney, setShowSunJourney] = useState(false)
  const [showCalm,       setShowCalm]       = useState(false)
  const [pandiMode,     setPandiMode]     = useState('idle') // idle | meditate | celebrate

  // Pandi reacciona al tab activo
  useEffect(() => {
    if (activeTab === 'meditation') setPandiMode('meditate')
    else if (activeTab === 'breathing') setPandiMode('idle')
    else setPandiMode('idle')
  }, [activeTab])

  useEffect(() => {
    if (!user?.id) return
    const today = new Date().toISOString().split('T')[0]
    supabase.from('mood_logs').select('mood')
      .eq('user_id', user.id).eq('date', today).maybeSingle()
      .then(({ data }) => { if (data?.mood) setCurrentMood(data.mood) })
    // Limpiar TTS al salir
    return () => stopSpeech()
  }, [user?.id])

  const doneHabits  = Object.values(habitsChecked).filter(Boolean).length
  const totalHabits = Object.keys(habitsChecked).length || 1

  // Estado del santuario según mood actual
  const sanctuaryState = currentMood
    ? (currentMood >= 4 ? 'GREEN' : currentMood === 3 ? 'YELLOW' : 'RED')
    : (recoveryLight || 'GREEN')
  const sanctuaryCfg = SANCTUARY_CONFIG[sanctuaryState] || SANCTUARY_CONFIG.GREEN

  useSectionContext('mood', {
    todayMood: currentMood, activeTab,
    habitsCompleted: doneHabits, habitsTotal: totalHabits,
    habitsPct: Math.round((doneHabits / totalHabits) * 100),
    isBreathing: activeTab === 'breathing',
    isMeditating: activeTab === 'meditation',
  })

  const tabs = [
    { id: 'checkin',    label: 'Check-in',  emoji: '📝' },
    { id: 'santuario',  label: 'Santuario', emoji: '🐾' },
    { id: 'breathing',  label: 'Respirar',  emoji: '🫁' },
    { id: 'meditation', label: 'Meditar',   emoji: '🧘' },
  ]

  return (
    <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', flexDirection:'column',
      background:'#f8fafa', overflow:'hidden' }}>

      {/* ── SANTUARIO FONDO — cambia según tab activo ── */}
      <SanctuaryBg recoveryLight={recoveryLight} mood={currentMood} activeTab={activeTab} />

      {/* Overlay oscuro suave para legibilidad */}
      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.08)',
        pointerEvents:'none', zIndex:1 }} />

      {/* ── HEADER estilo imagen — fondo claro, tipografía dorada ── */}
      <div style={{ position:'relative', zIndex:10,
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'14px 16px', paddingTop:'calc(env(safe-area-inset-top) + 14px)',
        background:'rgba(255,255,255,0.82)', backdropFilter:'blur(16px)',
        borderBottom:'1px solid rgba(201,169,110,0.15)' }}>

        <motion.button whileTap={{ scale:0.94 }} onClick={() => { stopSpeech(); navigate(-1) }}
          style={{ width:38, height:38, borderRadius:12, border:'1.5px solid rgba(201,169,110,0.3)',
            cursor:'pointer', background:'rgba(255,255,255,0.65)',
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:16,
            color:'#C9A96E' }}>
          ←
        </motion.button>

        <div style={{ textAlign:'center' }}>
          <p style={{ fontSize:11, color:'#C9A96E', margin:0, fontWeight:700,
            letterSpacing:'.06em', textTransform:'uppercase' }}>
            Tu Santuario
          </p>
          <p style={{ fontSize:15, fontWeight:900, color:'#C9A96E', margin:0 }}>
            Bienestar con Pandi
          </p>
        </div>

        <div style={{ display:'flex', gap:6 }}>
          {/* Respira rápida */}
          <motion.button whileTap={{ scale:0.94 }} onClick={() => setShowPulse(true)}
            style={{ width:38, height:38, borderRadius:12, border:'1.5px solid rgba(201,169,110,0.3)',
              cursor:'pointer', background:'rgba(255,255,255,0.65)',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>
            🌬️
          </motion.button>
          {/* Viaje del Sol */}
          <motion.button whileTap={{ scale:0.94 }} onClick={() => setShowSunJourney(true)}
            style={{ width:38, height:38, borderRadius:12, border:'1.5px solid rgba(201,169,110,0.3)',
              cursor:'pointer', background:'rgba(255,255,255,0.65)',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>
            ☀️
          </motion.button>
          {/* SOS */}
          <motion.button whileTap={{ scale:0.94 }} onClick={() => setShowCalm(true)}
            style={{ width:38, height:38, borderRadius:12, border:'1.5px solid rgba(239,68,68,0.3)',
              cursor:'pointer', background:'rgba(255,255,255,0.65)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:11, fontWeight:900, color:'#EF4444' }}>
            SOS
          </motion.button>
        </div>
      </div>

      {/* ── PANDI EN EL SANTUARIO — anclada a la plataforma ── */}
      <div style={{ position:'absolute', inset:0, zIndex:5, pointerEvents:'none' }}>
        <div
          onPointerDown={() => { window._pandiPressTimer = setTimeout(() => setPandiEditMode(true), 1500) }}
          onPointerUp={() => clearTimeout(window._pandiPressTimer)}
          onPointerLeave={() => clearTimeout(window._pandiPressTimer)}
          style={{
            position:'absolute',
            bottom: pandiConfig.bottom + '%',
            left:'50%',
            transform:'translateX(-50%)',
            width: pandiConfig.size + '%',
            maxWidth: 280,
            pointerEvents:'all',
            cursor: pandiEditMode ? 'move' : 'pointer',
          }}>
          <AnimatePresence>
            {activeTab !== 'checkin' && activeTab !== 'journal' && (
              <motion.div
                initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                transition={{ duration:0.4 }}
                style={{ width:'100%' }}>
                <SanctuaryPandi mood={currentMood} pandiMode={pandiMode} cfg={sanctuaryCfg} activeTab={activeTab} recoveryLight={recoveryLight} />
              </motion.div>
            )}
          </AnimatePresence>
          {pandiEditMode && (
            <div style={{ position:'absolute', inset:-4, borderRadius:16,
              border:'2px dashed #B8924A', pointerEvents:'none' }} />
          )}
        </div>
      </div>


      {/* ── RESPIRAR / MEDITAR — opciones arriba, Pandi visible abajo ── */}
      <AnimatePresence>
        {(activeTab === 'breathing' || activeTab === 'meditation') && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            transition={{ duration:0.3 }}
            style={{ position:'fixed', inset:0, zIndex:25, pointerEvents:'none',
              display:'flex', flexDirection:'column', alignItems:'center',
              justifyContent:'flex-start',
              paddingTop:'calc(env(safe-area-inset-top,0px) + 72px)',
              paddingLeft:16, paddingRight:16 }}>
            <div style={{ pointerEvents:'all', width:'100%', maxWidth:420 }}>
              {activeTab === 'breathing'  && <BreathingTab  theme={theme} />}
              {activeTab === 'meditation' && <MeditationTab theme={theme} profile={profile} userId={user?.id} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MOOD — emojis justo encima del tab bar ── */}
      <AnimatePresence>
        {activeTab === 'checkin' && (
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
            exit={{ opacity:0, y:20 }} transition={{ duration:0.3 }}
            style={{ position:'fixed', bottom:`calc(env(safe-area-inset-bottom,0px) + ${TAB_BAR_BOTTOM + 70}px)`,
              left:0, right:0, zIndex:25, padding:'0 16px', pointerEvents:'all' }}>
            <CheckinTab theme={theme} userId={user?.id} addXP={addXP} profile={profile}
              onTabChange={setActiveTab} onMoodSaved={setCurrentMood} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CHECK-IN / DIARIO — página fullscreen, Pandi desaparece ── */}
      <AnimatePresence>
        {activeTab === 'journal' && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
            exit={{ opacity:0 }} transition={{ duration:0.4 }}
            style={{ position:'fixed', inset:0, zIndex:25,
              background: theme.background || '#f8fafa',
              paddingTop:'calc(env(safe-area-inset-top,0px) + 72px)',
              paddingBottom:`calc(env(safe-area-inset-bottom,0px) + ${TAB_BAR_BOTTOM + 70}px)`,
              overflow:'hidden' }}>
            {/* Header de la página */}
            <div style={{ padding:'0 16px 12px', borderBottom:`1px solid ${theme.border || 'rgba(0,0,0,0.06)'}`,
              display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <p style={{ fontSize:16, fontWeight:900, color: theme.text || '#1A2332', margin:0 }}>
                📖 El Diario
              </p>
              <button onClick={() => setActiveTab(null)}
                style={{ background:'none', border:'none', cursor:'pointer',
                  fontSize:13, color: theme.textMuted || '#9CA3AF', fontWeight:700 }}>
                Cerrar
              </button>
            </div>
            <div style={{ overflowY:'auto', height:'100%', padding:'16px' }}>
              <JournalEntry theme={theme} userId={user?.id} currentMood={currentMood} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {activeTab === 'habits' && (
        <div style={{ position:'fixed', bottom:`calc(env(safe-area-inset-bottom,0px) + ${TAB_BAR_BOTTOM + 70}px)`,
          left:0, right:0, zIndex:25, padding:'0 16px', textAlign:'center' }}>
          <p style={{ fontSize:28, margin:'0 0 8px' }}>✓</p>
          <p style={{ fontSize:13, color:'rgba(255,255,255,0.7)', margin:0 }}>Check-In próximamente</p>
        </div>
      )}

      {/* ── PANEL EDICIÓN DE PANDI ── */}
      <AnimatePresence>
        {pandiEditMode && (
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            style={{ position:'fixed', bottom:'calc(env(safe-area-inset-bottom,0px) + 170px)',
              left:'50%', transform:'translateX(-50%)', zIndex:60,
              background:'rgba(255,255,255,0.7)', backdropFilter:'blur(16px)',
              borderRadius:20, padding:'16px 20px', boxShadow:'0 8px 32px rgba(0,0,0,0.15)',
              minWidth:280 }}>
            <p style={{ fontSize:12, fontWeight:800, color:'#B8924A', margin:'0 0 12px',
              textAlign:'center' }}>✏️ Ajustar Pandi</p>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <div>
                <p style={{ fontSize:11, color:'#6B7280', margin:'0 0 4px', fontWeight:600 }}>
                  Altura: {pandiConfig.bottom}%
                </p>
                <input type="range" min={5} max={55} value={pandiConfig.bottom}
                  onChange={e => setPandiConfig(c => ({ ...c, bottom: +e.target.value }))}
                  style={{ width:'100%', accentColor:'#B8924A' }} />
              </div>
              <div>
                <p style={{ fontSize:11, color:'#6B7280', margin:'0 0 4px', fontWeight:600 }}>
                  Tamaño: {pandiConfig.size}%
                </p>
                <input type="range" min={20} max={80} value={pandiConfig.size}
                  onChange={e => setPandiConfig(c => ({ ...c, size: +e.target.value }))}
                  style={{ width:'100%', accentColor:'#B8924A' }} />
              </div>
            </div>
            <div style={{ display:'flex', gap:8, marginTop:12 }}>
              <button onClick={() => setPandiEditMode(false)}
                style={{ flex:1, padding:'9px', borderRadius:12, border:'none', cursor:'pointer',
                  background:'#F3F4F6', color:'#6B7280', fontWeight:700, fontSize:12 }}>
                Cancelar
              </button>
              <button onClick={() => {
                localStorage.setItem('pandi_mood_cfg', JSON.stringify(pandiConfig))
                setPandiEditMode(false)
              }}
                style={{ flex:1, padding:'9px', borderRadius:12, border:'none', cursor:'pointer',
                  background:'#B8924A', color:'white', fontWeight:700, fontSize:12 }}>
                Guardar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TAB BAR FLOTANTE ── */}
      <div style={{ position:'fixed', bottom:`calc(env(safe-area-inset-bottom,0px) + ${TAB_BAR_BOTTOM}px)`,
        left:0, right:0, zIndex:30, display:'flex', justifyContent:'center',
        pointerEvents:'none' }}>
        <motion.div initial={{ y:20, opacity:0 }} animate={{ y:0, opacity:1 }}
          transition={{ delay:0.2, type:'spring', damping:22 }}
          style={{ display:'flex', gap:0, background:'rgba(255,255,255,0.65)',
            backdropFilter:'blur(20px)', borderRadius:28,
            border:'1px solid rgba(201,169,110,0.2)',
            boxShadow:'0 8px 32px rgba(0,0,0,0.15)', overflow:'hidden',
            pointerEvents:'all' }}>
          {[
            { id:'breathing',  label:'Respirar',  icon:'tab_respirar'  },
            { id:'meditation', label:'Meditar',   icon:'tab_meditar'   },
            { id:'checkin',    label:'Mood',      icon:'tab_mood'      },
            { id:'habits',     label:'Check-In',  icon:'tab_checkin'   },
            { id:'journal',    label:'El Diario', icon:'tab_diario'    },
          ].map((t, i, arr) => {
            const active = activeTab === t.id
            return (
              <motion.button key={t.id} whileTap={{ scale:0.9 }}
                onClick={() => setActiveTab(t.id)}
                style={{ display:'flex', flexDirection:'column', alignItems:'center',
                  gap:5, padding:TAB_BAR_PADDING, border:'none', cursor:'pointer',
                  borderRight: i < arr.length-1 ? '1px solid rgba(201,169,110,0.1)' : 'none',
                  background: active ? 'rgba(201,169,110,0.12)' : 'transparent',
                  transition:'background 0.2s', minWidth:TAB_BAR_MIN_WIDTH, position:'relative' }}>
                <img src={`/panda/${t.icon}.png`} alt={t.label}
                  style={{ width:TAB_BAR_ICON_SIZE, height:TAB_BAR_ICON_SIZE, objectFit:'contain',
                    opacity: active ? 1 : 0.55,
                    filter: active ? 'none' : 'grayscale(0.3)',
                    transition:'all 0.2s' }}
                  onError={e => { e.target.style.display='none' }} />
                <span style={{ fontSize:TAB_BAR_FONT_SIZE, fontWeight:700, letterSpacing:'.03em',
                  color: active ? '#B8924A' : '#C0A870' }}>
                  {t.label}
                </span>
                {active && (
                  <div style={{ position:'absolute', bottom:5, left:'50%',
                    transform:'translateX(-50%)', width:22, height:3,
                    borderRadius:2, background:'#B8924A' }} />
                )}
              </motion.button>
            )
          })}
        </motion.div>
      </div>

      {/* El Pulso de Pandi */}
      <AnimatePresence>
        {showPulse && (
          <PandiPulse
            mode="free"
            onClose={() => setShowPulse(false)}
            onComplete={() => setShowPulse(false)}
          />
        )}
      </AnimatePresence>

      {/* El Viaje del Sol — modo libre, accesible siempre desde el header */}
      <AnimatePresence>
        {showSunJourney && (
          <SunJourney
            mode="free"
            onClose={() => setShowSunJourney(false)}
            onComplete={() => setShowSunJourney(false)}
          />
        )}
      </AnimatePresence>

      {/* Calma rápida — sonido de bosque + respiración visual */}
      <AnimatePresence>
        {showCalm && (
          <CalmScreen onClose={() => setShowCalm(false)} />
        )}
      </AnimatePresence>

    </div>
  )
}
