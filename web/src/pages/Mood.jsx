import {
  PANDI_MOOD_MESSAGES, PANDI_ACTIONS, PANDI_MOOD_FRAME, DEFAULT_HABITS,
} from '../lib/pandiMessages'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, RotateCcw, Volume2, VolumeX, Check, Smile, Heart, Sparkles, Lock } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useStore } from '../store/useStore'
import { useTheme } from '../contexts/ThemeProvider'
import { useSectionContext } from '../hooks/useSectionContext'
import CycleTab from '../components/mood/CycleTab'
import WellnessCalendar from '../components/mood/WellnessCalendar'
import PandiContextualBubble from '../components/PandiContextualBubble'
import PandiTips from '../components/PandiTips'

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
    holdOut: '/audio/breath-hold.mp3',
  },
  med: (n) => `/audio/med-${String(n).padStart(2, '0')}.mp3`,
}

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
  { id: 'pandi',  nombreDefault: 'Pandi',  especie: 'Oso Panda',  desc: 'Tu compañero fiel inicial. Le encanta la meditación.', nivelRequerido: 1 },
  { id: 'slothi', nombreDefault: 'Slothi', especie: 'Perezoso',   desc: 'Experto en calma profunda y rutinas sin prisas.',       nivelRequerido: 4 },
  { id: 'lumi',   nombreDefault: 'Lumi',   especie: 'Luciérnaga', desc: 'Brilla con fuerza en tus momentos más oscuros.',        nivelRequerido: 8 },
]

const MED_SESSIONS = { 2: [1,2,3], 5: [4,5,6,7], 10: [8,9,10] }
const pickSession  = (m) => { const p = MED_SESSIONS[m] ?? [1]; return p[Math.floor(Math.random()*p.length)] }

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

function PandaImg({ name, size = 48, fallback = '🐼', className = '', style = {} }) {
  const [err, setErr] = useState(false)
  if (err) return (
    <span style={{ fontSize: size * 0.65, lineHeight: 1, display: 'flex',
      alignItems: 'center', justifyContent: 'center', width: size, height: size, ...style }}
      className={className}>{fallback}</span>
  )
  return (
    <img src={`/panda/${name}.png`} alt="Pandi"
      style={{ width: size, height: size, objectFit: 'contain', ...style }}
      className={className} onError={() => setErr(true)} />
  )
}

function PandiResponse({ mood, message, action, onAction, theme, loadingCoach }) {
  const moodData  = MOODS.find(m => m.v === mood)
  const frameInfo = PANDI_MOOD_FRAME[mood] || { file: 'avatar_neutro', fallback: '🐼' }
  return (
    <motion.div key={mood} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }} className="card"
      style={{ borderLeft: `4px solid ${moodData?.color}` }}>
      <div className="flex items-start gap-3 mb-3">
        <motion.div animate={loadingCoach ? { rotate: [0, 15, -15, 0] } : { scale: [1, 1.06, 1] }}
          transition={loadingCoach
            ? { duration: 0.5, repeat: Infinity }
            : { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}>
          <PandaImg name={mood >= 4 ? 'avatar_happy' : 'avatar_neutro'} size={48}
            fallback={frameInfo.fallback} style={{ borderRadius: 12 }} />
        </motion.div>
        <div className="flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wide mb-1"
            style={{ color: theme.primary }}>Pandi Coach (IA)</p>
          {loadingCoach ? (
            <div className="flex flex-col gap-1.5 pt-1">
              <div className="h-3 rounded animate-pulse w-3/4" style={{ backgroundColor: theme.surface2 }} />
              <div className="h-3 rounded animate-pulse w-5/6" style={{ backgroundColor: theme.surface2 }} />
            </div>
          ) : (
            <p className="text-sm leading-relaxed" style={{ color: theme.text }}>{message}</p>
          )}
        </div>
      </div>
      {action && !loadingCoach && (
        <motion.button whileTap={{ scale: 0.96 }} onClick={() => onAction(action)}
          className="w-full py-2.5 rounded-xl text-sm font-bold text-white"
          style={{ background: `linear-gradient(135deg, ${moodData?.color}, #FF8FA3)` }}>
          {action.label}
        </motion.button>
      )}
    </motion.div>
  )
}

function CheckinTab({ theme, userId, addXP, onTabChange, onMoodSaved }) {
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

  useEffect(() => { if (userId) load() }, [userId])

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
    try {
      const moodLabel = MOODS.find(m => m.v === mood)?.label || 'Desconocido'
      const promptOculto = `[SISTEMA: El usuario acaba de hacer Check-in de salud mental en la app. Ha marcado su estado de ánimo hoy como "${moodLabel}" (${mood}/5). Notas contextuales que ha escrito sobre lo que influye en su día: "${notes || 'Sin notas escritas'}". Actúa inmediatamente como su Psicólogo y Terapeuta TCC/ACT. Dame una respuesta corta, de máximo 3 líneas, súper empática, validando su estado emocional y dándole un reencuadre o consejo útil sin rodeos ni introducciones corporativas.]`
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

  return (
    <div className="space-y-4">
      <div className="card">
        <p className="font-bold text-center mb-5" style={{ color: theme.text }}>¿Cómo llegamos hoy?</p>
        <div className="flex justify-around mb-4">
          {MOODS.map(m => (
            <motion.button key={m.v} whileTap={{ scale: 0.85 }}
              onClick={() => { setMood(m.v); setSaved(false); setPandiMessage('') }}
              className="flex flex-col items-center gap-1 p-3 rounded-2xl transition-all"
              style={{
                background: mood === m.v ? `${m.color}20` : 'transparent',
                border:     mood === m.v ? `2px solid ${m.color}60` : '2px solid transparent',
                opacity:    mood && mood !== m.v ? 0.35 : 1,
              }}>
              <span className="text-3xl">{m.emoji}</span>
              <span className="text-[10px] font-semibold"
                style={{ color: mood === m.v ? m.color : theme.textMuted }}>{m.label}</span>
            </motion.button>
          ))}
        </div>
        <input className="input mb-3" placeholder="¿Qué ha influido? (opcional)…"
          value={notes} onChange={e => setNotes(e.target.value)} disabled={loadingCoach} />
        <button onClick={save} disabled={!mood || saved || loadingCoach}
          className="btn-primary w-full disabled:opacity-40">
          {loadingCoach ? '🧠 Pandi analizando...' : saved ? '✅ Guardado hoy' : '💾 Guardar (+10 XP)'}
        </button>
      </div>
      <AnimatePresence>
        {mood && (finalMessage || loadingCoach) && (
          <PandiResponse mood={mood} message={finalMessage} action={action}
            onAction={(a) => a.tab && onTabChange(a.tab)} theme={theme} loadingCoach={loadingCoach} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {consecutiveLow && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="card text-center py-4"
            style={{ background: '#FEF3C7', border: '1px solid #FCD34D' }}>
            <p className="text-sm font-semibold" style={{ color: '#92400E' }}>Llevas varios días difíciles 🤍</p>
            <p className="text-xs mt-1" style={{ color: '#78350F' }}>
              Si lo necesitas, hablar con alguien de confianza siempre ayuda.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function BreathingTab({ theme }) {
  const [tech,    setTech]    = useState('478')
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
    const key = k === 'holdOut' ? 'hold' : k
    const a   = breathAudio.current[key]
    if (!a) return
    a.currentTime = 0; a.volume = 0.8; a.play().catch(() => {})
  }

  function buildSeq(tk) {
    const t = TECHNIQUES[tk]
    return [
      { key: 'inhale',  dur: t.inhale },
      ...(t.hold    > 0 ? [{ key: 'hold',    dur: t.hold    }] : []),
      { key: 'exhale',  dur: t.exhale },
      ...(t.holdOut > 0 ? [{ key: 'holdOut', dur: t.holdOut }] : []),
    ]
  }

  function stop() {
    clearTimeout(timerRef.current); clearInterval(intervalRef.current)
    setRunning(false); setPhase('inhale'); setCount(0)
  }

  function runPhase(seq, idx, rc) {
    const p = seq[idx]
    setPhase(p.key); setCount(p.dur); playCue(p.key)
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
    stop()
    const seq = buildSeq(tech)
    setRunning(true); setRounds(0); runPhase(seq, 0, 0)
  }

  useEffect(() => () => stop(), [])

  const t         = TECHNIQUES[tech]
  const phaseInfo = PHASES[phase]
  const animDur   = phase === 'inhale' ? t.inhale : phase === 'exhale' ? t.exhale
                  : phase === 'hold'   ? t.hold   : t.holdOut
  const breathFrame = phaseInfo.breathFrame || 1

  return (
    <div className="space-y-4">
      <div className="card">
        <p className="text-sm font-bold mb-3" style={{ color: theme.text }}>Técnica</p>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(TECHNIQUES).map(([k, v]) => (
            <button key={k} onClick={() => { if (running) stop(); setTech(k) }}
              className="rounded-2xl p-3 text-center transition-all"
              style={{
                background: tech === k ? 'linear-gradient(135deg,#2EC4B6,#FF8FA3)' : theme.surface2,
                color:      tech === k ? '#fff' : theme.textMuted,
              }}>
              <p className="font-bold text-sm">{v.name}</p>
              <p className="text-[10px] mt-0.5">{v.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="card flex flex-col items-center gap-5 py-7">
        <div className="relative flex items-center justify-center" style={{ width: 170, height: 170 }}>
          <motion.div
            animate={{ scale: running ? phaseInfo.scale : 1, opacity: running ? 0.2 : 0.1 }}
            transition={{ duration: animDur, ease: 'easeInOut' }}
            style={{ position: 'absolute', width: 170, height: 170, borderRadius: '50%', background: phaseInfo.color }} />
          <motion.div
            animate={{ scale: running ? phaseInfo.scale * 0.72 : 0.72, opacity: running ? 0.38 : 0.12 }}
            transition={{ duration: animDur, ease: 'easeInOut' }}
            style={{ position: 'absolute', width: 170, height: 170, borderRadius: '50%', background: phaseInfo.color }} />
          <motion.div
            animate={{ scale: running ? (phase === 'inhale' || phase === 'hold' ? 1.13 : 0.9) : 1 }}
            transition={{ duration: animDur, ease: 'easeInOut' }}
            style={{ position: 'relative', zIndex: 2, width: 78, height: 78, borderRadius: '50%',
              background: '#fff', boxShadow: `0 4px 24px ${phaseInfo.color}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AnimatePresence mode="wait">
              <motion.div key={breathFrame}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}>
                <PandaImg name={`breath_${breathFrame}`} size={62} fallback="🐼"
                  style={{ borderRadius: '50%' }} />
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
        <div className="text-center min-h-[64px] flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p key={phase}
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
              className="text-xl font-extrabold" style={{ color: phaseInfo.color }}>
              {running ? phaseInfo.label : 'Listo para empezar'}
            </motion.p>
          </AnimatePresence>
          {running && (
            <motion.p key={count} initial={{ scale: 1.4, opacity: 0.6 }} animate={{ scale: 1, opacity: 1 }}
              className="text-5xl font-black mt-1" style={{ color: theme.text }}>{count}</motion.p>
          )}
          {rounds > 0 && (
            <p className="text-xs mt-1" style={{ color: theme.textMuted }}>
              {rounds} {rounds === 1 ? 'ronda' : 'rondas'} completadas 🔄
            </p>
          )}
        </div>
        {!running ? (
          <motion.button whileTap={{ scale: 0.94 }} onClick={start}
            className="flex items-center gap-2 px-8 py-3 rounded-2xl font-bold text-white"
            style={{ background: 'linear-gradient(135deg,#2EC4B6,#FF8FA3)' }}>
            <Play size={16} /> Iniciar
          </motion.button>
        ) : (
          <motion.button whileTap={{ scale: 0.94 }} onClick={stop}
            className="flex items-center gap-2 px-8 py-3 rounded-2xl font-bold"
            style={{ background: theme.surface2, color: theme.text }}>
            <Pause size={16} /> Pausar
          </motion.button>
        )}
        <p className="text-[11px] text-center" style={{ color: theme.textMuted }}>
          {t.inhale}s inhala
          {t.hold    > 0 ? ` · ${t.hold}s mantén`  : ''}
          {` · ${t.exhale}s exhala`}
          {t.holdOut > 0 ? ` · ${t.holdOut}s pausa` : ''}
        </p>
      </div>
    </div>
  )
}

function PandaFrame({ running }) {
  const [frame,         setFrame]         = useState(1)
  const [imgError,      setImgError]      = useState(false)
  const [transitioning, setTransitioning] = useState(false)

  useEffect(() => {
    if (!running) { setFrame(1); setTransitioning(false); return }
    const id = setTimeout(() => {
      setTransitioning(true)
      setTimeout(() => {
        setFrame(2)
        setTimeout(() => setTransitioning(false), 1800)
      }, 600)
    }, 15000)
    return () => clearTimeout(id)
  }, [running])

  if (imgError) return (
    <motion.span animate={running ? { scale: [1, 1.06, 1] } : {}}
      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      style={{ fontSize: 100 }}>🧘</motion.span>
  )

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div
        animate={
          transitioning ? { scale: 1.4, opacity: 0.85 }
          : running && frame === 2 ? { scale: [1.1, 1.28, 1.1], opacity: [0.6, 0.78, 0.6] }
          : running ? { scale: [1, 1.15, 1], opacity: [0.35, 0.55, 0.35] }
          : { scale: 1, opacity: 0.2 }
        }
        transition={transitioning ? { duration: 1.2 } : { duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', width: '85%', height: '85%', borderRadius: '50%',
          background: 'radial-gradient(circle, #e9d5ff 0%, #c084fc 35%, #a855f7 60%, transparent 80%)',
          filter: transitioning ? 'blur(45px)' : frame === 2 ? 'blur(38px)' : 'blur(28px)',
          zIndex: 0, transition: 'filter 2s ease-in-out',
        }} />
      <motion.div
        animate={running ? { scale: [1, 1.055, 1] } : { scale: 1 }}
        transition={running ? { duration: 5, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.4 }}
        style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 280, height: 280 }}>
        <AnimatePresence mode="wait">
          <motion.img key={frame} src={`/panda/meditate_${frame}.png`} alt="Pandi meditando"
            initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 1.8, ease: 'easeInOut' }}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            onError={() => setImgError(true)} />
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

function MeditationTab({ theme }) {
  const [duration, setDuration] = useState(5)
  const [sound,    setSound]    = useState(null)
  const [running,  setRunning]  = useState(false)
  const [elapsed,  setElapsed]  = useState(0)
  const [muted,    setMuted]    = useState(false)
  const [done,     setDone]     = useState(false)
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
    const med = medAudioRef.current
    if (med) { fadeOut(med); medAudioRef.current = null }
  }

  function start() {
    stopAll()
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
          return total
        }
        return e + 1
      })
    }, 1000)
  }

  function reset() {
    stopAll(); setRunning(false); setElapsed(0); setDone(false); setMuted(false)
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
    <div className="space-y-4">
      <div className="card">
        <p className="text-sm font-bold mb-3" style={{ color: theme.text }}>Duración</p>
        <div className="grid grid-cols-3 gap-2">
          {[2, 5, 10].map(d => (
            <button key={d} onClick={() => !running && setDuration(d)} disabled={running}
              className="py-3 rounded-xl font-bold text-sm transition-all"
              style={{
                background: duration === d ? 'linear-gradient(135deg,#2EC4B6,#FF8FA3)' : theme.surface2,
                color:      duration === d ? '#fff' : theme.textMuted,
              }}>{d} min</button>
          ))}
        </div>
      </div>
      <div className="card">
        <p className="text-sm font-bold mb-3" style={{ color: theme.text }}>Sonido ambiental</p>
        <div className="grid grid-cols-5 gap-2">
          {AMBIENT.map(a => (
            <button key={a.id} onClick={() => !running && setSound(s => s === a.id ? null : a.id)}
              disabled={running}
              className="flex flex-col items-center gap-1 py-2.5 rounded-2xl transition-all"
              style={{
                background: sound === a.id ? '#2EC4B618' : theme.surface2,
                border:     `2px solid ${sound === a.id ? '#2EC4B6' : 'transparent'}`,
              }}>
              <span className="text-xl">{a.emoji}</span>
              <span className="text-[9px] font-semibold"
                style={{ color: sound === a.id ? '#2EC4B6' : theme.textMuted }}>{a.label}</span>
            </button>
          ))}
        </div>
        {!sound && <p className="text-[11px] mt-2 text-center" style={{ color: theme.textMuted }}>Sin sonido ambiental</p>}
      </div>
      <div className="card flex flex-col items-center gap-4 pb-6 pt-4 overflow-hidden">
        <div className="w-full flex items-center justify-center" style={{ minHeight: 300 }}>
          {done
            ? <motion.span initial={{ scale: 1 }} animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 0.6 }} style={{ fontSize: 100 }}>🎉</motion.span>
            : <PandaFrame running={running} />
          }
        </div>
        <div className="w-full px-2">
          <div className="h-2 rounded-full overflow-hidden" style={{ background: theme.surface2 }}>
            <motion.div className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg,#2EC4B6,#FF8FA3)' }}
              animate={{ width: `${progress * 100}%` }} transition={{ duration: 1, ease: 'linear' }} />
          </div>
        </div>
        <p className="font-black text-4xl tracking-tight" style={{ color: theme.text }}>
          {done ? '¡Completado!' : `${mm}:${ss}`}
        </p>
        <div className="flex gap-3 items-center">
          {!running && !done && (
            <motion.button whileTap={{ scale: 0.94 }} onClick={start}
              className="flex items-center gap-2 px-8 py-3 rounded-2xl font-bold text-white"
              style={{ background: 'linear-gradient(135deg,#2EC4B6,#FF8FA3)' }}>
              <Play size={16} /> Iniciar
            </motion.button>
          )}
          {running && (
            <>
              <motion.button whileTap={{ scale: 0.94 }} onClick={reset}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold"
                style={{ background: theme.surface2, color: theme.text }}>
                <RotateCcw size={15} /> Reiniciar
              </motion.button>
              <button onClick={toggleMute}
                className="w-11 h-11 rounded-2xl flex items-center justify-center"
                style={{ background: theme.surface2 }}>
                {muted ? <VolumeX size={18} color={theme.textMuted} /> : <Volume2 size={18} color="#2EC4B6" />}
              </button>
            </>
          )}
          {done && (
            <motion.button initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              whileTap={{ scale: 0.94 }} onClick={reset}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-white"
              style={{ background: 'linear-gradient(135deg,#2EC4B6,#FF8FA3)' }}>
              <RotateCcw size={15} /> Nueva sesión
            </motion.button>
          )}
        </div>
        {running && (
          <p className="text-[11px]" style={{ color: theme.textMuted }}>
            {sound ? `${AMBIENT.find(a => a.id === sound)?.emoji} ${AMBIENT.find(a => a.id === sound)?.label} · ` : ''}
            Sesión en curso
          </p>
        )}
        {done && (
          <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className="text-sm font-semibold" style={{ color: '#2EC4B6' }}>
            ✨ ¡{duration} minutos completados!
          </motion.p>
        )}
      </div>
    </div>
  )
}

function HabitsTab({ theme, userId, onHabitsUpdate }) {
  const today      = new Date().toISOString().split('T')[0]
  const storageKey = `pandi_habits_${today}`
  const configKey  = 'pandi_habit_config'

  const [habits,     setHabits]     = useState(() => {
    const saved = localStorage.getItem(configKey)
    return saved ? JSON.parse(saved) : DEFAULT_HABITS.map(h => ({ ...h, enabled: true }))
  })
  const [checked,    setChecked]    = useState(() => {
    const saved = localStorage.getItem(storageKey)
    return saved ? JSON.parse(saved) : {}
  })
  const [celebrated, setCelebrated] = useState(false)

  const active    = habits.filter(h => h.enabled)
  const doneCount = active.filter(h => checked[h.id]).length
  const allDone   = active.length > 0 && doneCount === active.length

  useEffect(() => { onHabitsUpdate?.(checked) }, [checked])

  function toggle(id) {
    const next = { ...checked, [id]: !checked[id] }
    setChecked(next)
    localStorage.setItem(storageKey, JSON.stringify(next))
    if (!checked[id] && active.every(h => h.id === id ? true : checked[h.id])) {
      setCelebrated(true)
      useStore.getState().addBondXP?.(5)
      setTimeout(() => setCelebrated(false), 3000)
    }
  }

  return (
    <div className="space-y-4">
      <div className="card flex items-center gap-3"
        style={{ background: `${theme.primary}10`, border: `1px solid ${theme.primary}20` }}>
        <AnimatePresence mode="wait">
          {allDone
            ? <motion.div key="celebrate" initial={{ scale: 0.5 }} animate={{ scale: 1 }}>
                <PandaImg name="avatar_celebrate" size={48} fallback="🎉" />
              </motion.div>
            : <motion.div key="normal">
                <PandaImg name="avatar_neutro" size={48} fallback="🐼" />
              </motion.div>
          }
        </AnimatePresence>
        <div className="flex-1">
          <p className="font-bold text-sm" style={{ color: theme.text }}>
            {allDone ? '¡Todo listo hoy! 🎉' : `${doneCount} de ${active.length} hábitos`}
          </p>
          <p className="text-xs" style={{ color: theme.textMuted }}>
            {allDone ? 'Pandi está proud de ti 🐾' : 'Cada hábito cuenta. Uno a la vez.'}
          </p>
        </div>
        {active.length > 0 && (
          <p className="font-extrabold text-xl" style={{ color: theme.primary }}>
            {Math.round((doneCount / active.length) * 100)}%
          </p>
        )}
      </div>
      <AnimatePresence>
        {celebrated && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }} className="card text-center py-4"
            style={{ background: 'linear-gradient(135deg,#f0fffe,#fff5f7)' }}>
            <p className="text-2xl mb-1">🎊</p>
            <p className="font-bold" style={{ color: theme.text }}>¡Todos los hábitos completados!</p>
            <p className="text-xs mt-1" style={{ color: theme.textMuted }}>Pandi está muy orgulloso 🐼</p>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="card space-y-2">
        <p className="text-sm font-bold mb-2" style={{ color: theme.text }}>Hoy</p>
        {active.map(h => (
          <motion.button key={h.id} whileTap={{ scale: 0.97 }} onClick={() => toggle(h.id)}
            className="w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left"
            style={{
              background: checked[h.id] ? `${theme.primary}12` : theme.surface2,
              border:     `2px solid ${checked[h.id] ? theme.primary + '60' : 'transparent'}`,
            }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
              style={{ background: checked[h.id] ? `${theme.primary}20` : theme.surface }}>
              {h.icon}
            </div>
            <p className="flex-1 text-sm font-semibold"
              style={{
                color:          checked[h.id] ? theme.primary : theme.text,
                textDecoration: checked[h.id] ? 'line-through' : 'none',
              }}>{h.name}</p>
            <div className="w-5 h-5 rounded-full border flex items-center justify-center"
              style={{
                borderColor: checked[h.id] ? theme.primary : theme.textMuted,
                background:  checked[h.id] ? theme.primary : 'transparent',
              }}>
              {checked[h.id] && <Check size={12} className="text-white" />}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  )
}

function SantuarioTab({ theme, userLevel, currentMood, habitsChecked }) {
  const [mascotaActiva,    setMascotaActiva]    = useState(() => localStorage.getItem('pandi_active_pet') || 'pandi')
  const [nombresMascotas,  setNombresMascotas]  = useState(() => {
    const saved = localStorage.getItem('pandi_pet_names')
    return saved ? JSON.parse(saved) : { pandi: 'Pandi', slothi: 'Slothi', lumi: 'Lumi' }
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
  if (currentMood >= 4)    sufijoEstado = 'happy'
  if (rutinaStatus === 100) sufijoEstado = 'celebrate'

  const prefijoMascota    = mascotaActiva === 'pandi' ? 'avatar' : mascotaActiva
  const pathImagenMascota = `/panda/${prefijoMascota}_${sufijoEstado}.png`

  function cambiarNombre() {
    if (!newNameInput.trim()) return
    const next = { ...nombresMascotas, [mascotaActiva]: newNameInput }
    setNombresMascotas(next)
    localStorage.setItem('pandi_pet_names', JSON.stringify(next))
    setEditingName(false)
  }

  return (
    <div className="space-y-4">
      <div className="card relative overflow-hidden flex flex-col items-center pt-8 pb-6 bg-gradient-to-b from-sky-100/40 via-transparent to-transparent">
        <div className="text-center z-10">
          {editingName ? (
            <div className="flex gap-2 items-center justify-center">
              <input className="input py-1 text-center font-bold text-sm" value={newNameInput}
                onChange={e => setNewNameInput(e.target.value)} maxLength={12} style={{ maxWidth: 140 }} />
              <button onClick={cambiarNombre} className="p-1.5 rounded-xl bg-emerald-500 text-white">
                <Check size={14} />
              </button>
            </div>
          ) : (
            <div className="cursor-pointer group flex items-center justify-center gap-1.5"
              onClick={() => { setNewNameInput(nombreActual); setEditingName(true) }}>
              <p className="text-xl font-black tracking-tight" style={{ color: theme.text }}>{nombreActual}</p>
              <span className="text-[10px] opacity-0 group-hover:opacity-60 transition-opacity">✏️</span>
            </div>
          )}
          <p className="text-[10px] uppercase font-bold tracking-widest mt-0.5"
            style={{ color: theme.textMuted }}>{infoMascota?.especie}</p>
        </div>
        <div className="relative my-6 flex items-center justify-center" style={{ minHeight: 200, width: '100%' }}>
          <div className="absolute w-44 h-44 rounded-full filter blur-3xl opacity-20 animate-pulse"
            style={{ backgroundColor: currentMood <= 2 ? '#F97316' : '#2EC4B6' }} />
          <motion.img key={pathImagenMascota} src={pathImagenMascota} alt={nombreActual}
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }} transition={{ duration: 0.3 }}
            className="w-44 h-44 object-contain z-10" />
        </div>
        <div className="w-full grid grid-cols-3 gap-2 px-2">
          {[
            { icon: <Smile size={12} className="text-amber-500" />,   label: 'Mente',  value: menteStatus,  color: 'bg-amber-500'  },
            { icon: <Heart size={12} className="text-rose-500" />,    label: 'Rutina', value: rutinaStatus, color: 'bg-rose-500'   },
            { icon: <Sparkles size={12} className="text-purple-500"/>, label: 'Alma',   value: almaStatus,   color: 'bg-purple-500' },
          ].map(({ icon, label, value, color }) => (
            <div key={label} className="bg-white/40 dark:bg-black/10 p-2 rounded-xl border border-black/5 flex flex-col gap-1">
              <div className="flex items-center gap-1 text-[10px] font-bold" style={{ color: theme.text }}>
                {icon} {label}
              </div>
              <div className="h-1.5 w-full bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: theme.textMuted }}>
          Tus Coleccionables
        </p>
        <div className="space-y-2.5">
          {MASCOTAS_COLECCIONABLES.map(m => {
            const desbloqueado  = userLevel >= m.nivelRequerido
            const esActiva      = mascotaActiva === m.id
            const nombreMascota = nombresMascotas[m.id] || m.nombreDefault
            return (
              <div key={m.id} className="flex items-center gap-3 p-2.5 rounded-xl transition-all"
                style={{
                  backgroundColor: esActiva ? `${theme.primary}10` : theme.surface2,
                  border:   esActiva ? `1px solid ${theme.primary}40` : '1px solid transparent',
                  opacity:  desbloqueado ? 1 : 0.6,
                }}>
                <div className="w-12 h-12 rounded-xl bg-white/60 dark:bg-black/20 flex items-center justify-center text-2xl">
                  {!desbloqueado
                    ? <Lock size={16} className="text-neutral-400" />
                    : <img src={m.id === 'pandi' ? '/panda/avatar_neutro.png' : `/panda/${m.id}_neutro.png`}
                        alt={m.id} className="w-9 h-9 object-contain"
                        onError={e => { e.target.style.display = 'none' }} />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <p className="text-sm font-bold truncate" style={{ color: theme.text }}>{nombreMascota}</p>
                    <span className="text-[9px] font-medium opacity-60">({m.especie})</span>
                  </div>
                  <p className="text-[11px] truncate" style={{ color: theme.textMuted }}>{m.desc}</p>
                </div>
                {desbloqueado ? (
                  <button onClick={() => { setMascotaActiva(m.id); localStorage.setItem('pandi_active_pet', m.id) }}
                    className="text-xs font-bold px-3 py-1.5 rounded-xl"
                    style={{ backgroundColor: esActiva ? theme.primary : theme.surface, color: esActiva ? '#fff' : theme.text }}>
                    {esActiva ? 'Activa' : 'Elegir'}
                  </button>
                ) : (
                  <div className="text-[10px] font-bold px-2 py-1 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-500">
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
  const { theme }        = useTheme()
  const { user, addXP }  = useStore()
  const [activeTab,      setActiveTab]      = useState('checkin')
  const [currentMood,    setCurrentMood]    = useState(null)
  const [habitsChecked,  setHabitsChecked]  = useState({})

  useEffect(() => {
    if (!user?.id) return
    const today = new Date().toISOString().split('T')[0]
    supabase.from('mood_logs').select('mood')
      .eq('user_id', user.id).eq('date', today).maybeSingle()
      .then(({ data }) => { if (data?.mood) setCurrentMood(data.mood) })
  }, [user?.id, activeTab])

  const doneHabits  = Object.values(habitsChecked).filter(Boolean).length
  const totalHabits = Object.keys(habitsChecked).length || 1

  // ── Coach ve: ánimo actual, tab activo, progreso de hábitos ─────────────
  useSectionContext('mood', {
    todayMood:       currentMood,
    activeTab,
    habitsCompleted: doneHabits,
    habitsTotal:     totalHabits,
    habitsPct:       Math.round((doneHabits / totalHabits) * 100),
    isBreathing:     activeTab === 'breathing',
    isMeditating:    activeTab === 'meditation',
  })

  const tabs = [
    { id: 'checkin',    label: 'Check-in',  emoji: '📝' },
    { id: 'santuario',  label: 'Santuario', emoji: '🐾' },
    { id: 'breathing',  label: 'Respirar',  emoji: '🫁' },
    { id: 'meditation', label: 'Meditar',   emoji: '🧘' },
    { id: 'habits',     label: 'Hábitos',   emoji: '⚡' },
    { id: 'calendar',   label: 'Historial', emoji: '📅' },
    { id: 'cycles',     label: 'Ciclos',    emoji: '🌙' },
  ]

  return (
    <div className="max-w-md mx-auto pb-24 px-2 pt-4">
      <PandiContextualBubble theme={theme} currentTab={activeTab} />
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-3 mb-2 mask-linear-edge">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className="flex items-center gap-1 px-3 py-2 rounded-2xl text-xs font-bold transition-all flex-shrink-0"
            style={{
              background: activeTab === t.id ? theme.primary : theme.surface,
              color:      activeTab === t.id ? '#fff' : theme.textMuted,
              boxShadow:  activeTab === t.id ? `0 4px 12px ${theme.primary}30` : 'none',
            }}>
            <span>{t.emoji}</span><span>{t.label}</span>
          </button>
        ))}
      </div>
      <motion.div key={activeTab} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }} className="min-h-[400px]">
        {activeTab === 'checkin' && (
          <CheckinTab theme={theme} userId={user?.id} addXP={addXP}
            onTabChange={setActiveTab} onMoodSaved={setCurrentMood} />
        )}
        {activeTab === 'santuario' && (
          <SantuarioTab theme={theme} userLevel={user?.level || 1}
            currentMood={currentMood} habitsChecked={habitsChecked} />
        )}
        {activeTab === 'breathing'  && <BreathingTab  theme={theme} />}
        {activeTab === 'meditation' && <MeditationTab theme={theme} />}
        {activeTab === 'habits'     && (
          <HabitsTab theme={theme} userId={user?.id} onHabitsUpdate={setHabitsChecked} />
        )}
        {activeTab === 'calendar' && <WellnessCalendar theme={theme} userId={user?.id} />}
        {activeTab === 'cycles'   && <CycleTab theme={theme} userId={user?.id} />}
      </motion.div>
      <div className="mt-4"><PandiTips theme={theme} /></div>
    </div>
  )
}
