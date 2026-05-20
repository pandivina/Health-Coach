import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useStore } from '../store/useStore'
import { useTheme } from '../contexts/ThemeProvider'

// ─── RUTAS DE AUDIO ──────────────────────────────────────────────────────────
// Pon todos los archivos en web/public/audio/
// Los nombres coinciden exactamente con los archivos que tienes.

const A = {
  ambient: {
    rain:   '/audio/ambient-rain.mp3',
    ocean:  '/audio/ambient-ocean.mp3',
    forest: '/audio/ambient-forest.mp3',
    bowls:  '/audio/ambient-bowls.mp3',
    space:  '/audio/ambient-space.mp3',
  },
  breath: {
    inhale:  '/audio/breath-inhale.mp3',
    hold:    '/audio/breath-hold.mp3',
    exhale:  '/audio/breath-exhale.mp3',
    holdOut: '/audio/breath-hold.mp3',   // reutiliza hold para la pausa
  },
  med: (n) => `/audio/med-${String(n).padStart(2, '0')}.mp3`,
}

// ─── CONSTANTES ──────────────────────────────────────────────────────────────

const MOODS = [
  { v: 1, emoji: '😩', label: 'Muy mal', color: '#EF4444' },
  { v: 2, emoji: '😞', label: 'Mal',     color: '#F97316' },
  { v: 3, emoji: '😐', label: 'Regular', color: '#EAB308' },
  { v: 4, emoji: '😊', label: 'Bien',    color: '#22C55E' },
  { v: 5, emoji: '🤩', label: 'Genial',  color: '#2EC4B6' },
]

const TECHNIQUES = {
  '478':    { name: '4-7-8',  inhale: 4, hold: 7, exhale: 8, holdOut: 0, desc: 'Para ansiedad y estrés' },
  'box':    { name: 'Box',    inhale: 4, hold: 4, exhale: 4, holdOut: 4, desc: 'Para equilibrio mental' },
  'simple': { name: 'Simple', inhale: 4, hold: 0, exhale: 4, holdOut: 0, desc: 'Para principiantes'    },
}

const PHASES = {
  inhale:  { label: 'Inhala', color: '#2EC4B6', scale: 1.4 },
  hold:    { label: 'Mantén', color: '#A78BFA', scale: 1.4 },
  exhale:  { label: 'Exhala', color: '#FF8FA3', scale: 1.0 },
  holdOut: { label: 'Pausa',  color: '#FCD34D', scale: 1.0 },
}

const AMBIENT = [
  { id: 'rain',   emoji: '🌧️', label: 'Lluvia'  },
  { id: 'ocean',  emoji: '🌊', label: 'Océano'  },
  { id: 'forest', emoji: '🌲', label: 'Bosque'  },
  { id: 'bowls',  emoji: '🎵', label: 'Cuencos' },
  { id: 'space',  emoji: '🌌', label: 'Espacio' },
]

const MOOD_REC = {
  1: { tab: 'breathe',  tech: '478', msg: '🤍 La respiración 4-7-8 calma la ansiedad'         },
  2: { tab: 'breathe',  tech: 'box', msg: '💙 La respiración en caja te ayudará a centrarte'  },
  3: { tab: 'meditate', mins: 2,     msg: '🌿 2 minutos de meditación pueden cambiarlo todo'   },
  4: { tab: 'meditate', mins: 5,     msg: '✨ Mantén esta energía con una meditación de 5 min' },
  5: { tab: 'meditate', mins: 5,     msg: '🌟 ¡Estás brillando! Celebra con un momento de calma' },
}

const TABS = [
  { id: 'checkin',  icon: '😊', label: 'Ánimo'     },
  { id: 'breathe',  icon: '🫁', label: 'Respirar'  },
  { id: 'meditate', icon: '🧘', label: 'Meditar'   },
  { id: 'history',  icon: '📊', label: 'Historial' },
]

// ─── HELPERS DE AUDIO ────────────────────────────────────────────────────────

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
    if (v <= 0) {
      clearInterval(id)
      audio.pause()
      onDone?.()
    }
  }, 80)
}

function playAmbient(soundId, ref) {
  stopAmbient(ref)
  const audio = new Audio(A.ambient[soundId])
  audio.loop = true
  ref.current = audio
  audio.play().catch(() => {})
  fadeIn(audio)
}

function stopAmbient(ref) {
  const audio = ref.current
  if (!audio) return
  ref.current = null
  fadeOut(audio)
}

// ─── TAB: CHECK-IN ────────────────────────────────────────────────────────────

function CheckinTab({ theme, userId, addXP }) {
  const [logs,  setLogs]  = useState([])
  const [mood,  setMood]  = useState(null)
  const [notes, setNotes] = useState('')
  const [saved, setSaved] = useState(false)
  const today = new Date().toISOString().split('T')[0]

  async function load() {
    const { data } = await supabase.from('mood_logs').select('*')
      .eq('user_id', userId).order('date', { ascending: false }).limit(7)
    setLogs(data || [])
    const t = data?.find(l => l.date === today)
    if (t) { setMood(t.mood); setNotes(t.notes || ''); setSaved(true) }
  }
  useEffect(() => { if (userId) load() }, [userId])

  async function save() {
    if (!mood) return
    await supabase.from('mood_logs').upsert(
      { user_id: userId, date: today, mood, notes },
      { onConflict: 'user_id,date' }
    )
    await addXP(10); setSaved(true); load()
  }

  const moodData = MOODS.find(m => m.v === mood)
  const rec      = mood ? MOOD_REC[mood] : null

  return (
    <div className="space-y-4">
      <div className="card">
        <p className="font-bold text-center mb-5" style={{ color: theme.text }}>¿Cómo te sientes hoy?</p>
        <div className="flex justify-around mb-4">
          {MOODS.map(m => (
            <motion.button key={m.v} whileTap={{ scale: 0.85 }}
              onClick={() => { setMood(m.v); setSaved(false) }}
              className="flex flex-col items-center gap-1 p-3 rounded-2xl transition-all"
              style={{
                background: mood === m.v ? `${m.color}20` : 'transparent',
                border:     mood === m.v ? `2px solid ${m.color}60` : '2px solid transparent',
                opacity:    mood && mood !== m.v ? 0.35 : 1,
              }}>
              <span className="text-3xl">{m.emoji}</span>
              <span className="text-[10px] font-semibold" style={{ color: mood === m.v ? m.color : theme.textMuted }}>
                {m.label}
              </span>
            </motion.button>
          ))}
        </div>
        <input className="input mb-3" placeholder="¿Qué ha influido? (opcional)…"
          value={notes} onChange={e => setNotes(e.target.value)} />
        <button onClick={save} disabled={!mood} className="btn-primary w-full disabled:opacity-40">
          {saved ? '✅ Guardado hoy' : '💾 Guardar (+10 XP)'}
        </button>
      </div>

      <AnimatePresence>
        {mood && rec && (
          <motion.div key={mood} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="card" style={{ borderLeft: `4px solid ${moodData?.color}` }}>
            <p className="text-sm font-semibold" style={{ color: theme.text }}>{rec.msg}</p>
            <p className="text-xs mt-1" style={{ color: theme.textMuted }}>
              👆 Ve a la pestaña {rec.tab === 'breathe' ? 'Respirar' : 'Meditar'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── TAB: RESPIRACIÓN ────────────────────────────────────────────────────────

function BreathingTab({ theme }) {
  const [tech,    setTech]    = useState('478')
  const [running, setRunning] = useState(false)
  const [phase,   setPhase]   = useState('inhale')
  const [count,   setCount]   = useState(0)
  const [rounds,  setRounds]  = useState(0)
  const timerRef    = useRef(null)
  const intervalRef = useRef(null)
  // Reutiliza los objetos Audio — no los recrea en cada fase
  const breathAudio = useRef({
    inhale:  new Audio(A.breath.inhale),
    hold:    new Audio(A.breath.hold),
    exhale:  new Audio(A.breath.exhale),
  })

  function playCue(phaseKey) {
    const key   = phaseKey === 'holdOut' ? 'hold' : phaseKey
    const audio = breathAudio.current[key]
    if (!audio) return
    audio.currentTime = 0
    audio.volume = 0.8
    audio.play().catch(() => {})
  }

  function buildSeq(techKey) {
    const t = TECHNIQUES[techKey]
    return [
      { key: 'inhale',  dur: t.inhale },
      ...(t.hold    > 0 ? [{ key: 'hold',    dur: t.hold    }] : []),
      { key: 'exhale',  dur: t.exhale },
      ...(t.holdOut > 0 ? [{ key: 'holdOut', dur: t.holdOut }] : []),
    ]
  }

  function stop() {
    clearTimeout(timerRef.current)
    clearInterval(intervalRef.current)
    setRunning(false); setPhase('inhale'); setCount(0)
  }

  function runPhase(seq, idx, roundCount) {
    const p = seq[idx]
    setPhase(p.key)
    setCount(p.dur)
    playCue(p.key)

    let c = p.dur
    intervalRef.current = setInterval(() => {
      c--; setCount(c)
      if (c <= 0) {
        clearInterval(intervalRef.current)
        const nextIdx   = (idx + 1) % seq.length
        const nextRound = nextIdx === 0 ? roundCount + 1 : roundCount
        if (nextIdx === 0) setRounds(nextRound)
        timerRef.current = setTimeout(() => runPhase(seq, nextIdx, nextRound), 300)
      }
    }, 1000)
  }

  function start() {
    stop()
    const seq = buildSeq(tech)
    setRunning(true); setRounds(0)
    runPhase(seq, 0, 0)
  }

  useEffect(() => () => stop(), [])

  const t         = TECHNIQUES[tech]
  const phaseInfo = PHASES[phase]
  const animDur   = phase === 'inhale' ? t.inhale
                  : phase === 'exhale' ? t.exhale
                  : phase === 'hold'   ? t.hold
                  : t.holdOut

  return (
    <div className="space-y-4">
      {/* Técnica */}
      <div className="card">
        <p className="text-sm font-bold mb-3" style={{ color: theme.text }}>Técnica de respiración</p>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(TECHNIQUES).map(([k, v]) => (
            <button key={k} onClick={() => { if (running) stop(); setTech(k) }}
              className="rounded-2xl p-3 text-center transition-all"
              style={{
                background: tech === k ? 'linear-gradient(135deg,#2EC4B6,#FF8FA3)' : theme.surface2,
                color:      tech === k ? '#fff' : theme.textMuted,
              }}>
              <p className="font-bold text-sm">{v.name}</p>
              <p className="text-[10px] mt-0.5 leading-tight">{v.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Animación */}
      <div className="card flex flex-col items-center gap-5 py-7">
        <div className="relative flex items-center justify-center" style={{ width: 170, height: 170 }}>
          <motion.div
            animate={{ scale: running ? phaseInfo.scale : 1, opacity: running ? 0.2 : 0.1 }}
            transition={{ duration: animDur, ease: 'easeInOut' }}
            style={{ position: 'absolute', width: 170, height: 170, borderRadius: '50%', background: phaseInfo.color }}
          />
          <motion.div
            animate={{ scale: running ? phaseInfo.scale * 0.72 : 0.72, opacity: running ? 0.38 : 0.12 }}
            transition={{ duration: animDur, ease: 'easeInOut' }}
            style={{ position: 'absolute', width: 170, height: 170, borderRadius: '50%', background: phaseInfo.color }}
          />
          <motion.div
            animate={{ scale: running ? (phase === 'inhale' || phase === 'hold' ? 1.13 : 0.9) : 1 }}
            transition={{ duration: animDur, ease: 'easeInOut' }}
            style={{
              position: 'relative', zIndex: 2,
              width: 78, height: 78, borderRadius: '50%', background: '#fff',
              boxShadow: `0 4px 24px ${phaseInfo.color}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 42,
            }}>
            🐼
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
              className="text-5xl font-black mt-1" style={{ color: theme.text }}>
              {count}
            </motion.p>
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

// ─── TAB: MEDITACIÓN ─────────────────────────────────────────────────────────

// Sesiones agrupadas por duración estimada.
// Ajusta los arrays si sabes qué duración tiene cada archivo.
const MED_SESSIONS = {
  2:  [1, 2, 3],
  5:  [4, 5, 6, 7],
  10: [8, 9, 10],
}

function pickSession(mins) {
  const pool = MED_SESSIONS[mins] ?? [1]
  return pool[Math.floor(Math.random() * pool.length)]
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
  const circum   = 2 * Math.PI * 56

  function stopAll() {
    clearInterval(intervalRef.current)
    stopAmbient(ambientRef)
    const med = medAudioRef.current
    if (med) { fadeOut(med); medAudioRef.current = null }
  }

  function start() {
    stopAll()
    // Sonido ambiental
    if (sound) playAmbient(sound, ambientRef)
    // Audio de meditación guiada
    const session = pickSession(duration)
    const med = new Audio(A.med(session))
    med.volume = 0.75
    med.play().catch(() => {})
    medAudioRef.current = med

    setElapsed(0); setRunning(true); setDone(false)

    intervalRef.current = setInterval(() => {
      setElapsed(e => {
        if (e + 1 >= total) {
          clearInterval(intervalRef.current)
          setRunning(false); setDone(true)
          stopAll()
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
    const amb = ambientRef.current
    const med = medAudioRef.current
    if (!amb && !med) return
    const newMuted = !muted
    if (amb) amb.volume = newMuted ? 0 : 0.45
    if (med) med.volume = newMuted ? 0 : 0.75
    setMuted(newMuted)
  }

  useEffect(() => () => stopAll(), [])

  return (
    <div className="space-y-4">
      {/* Duración */}
      <div className="card">
        <p className="text-sm font-bold mb-3" style={{ color: theme.text }}>Duración</p>
        <div className="grid grid-cols-3 gap-2">
          {[2, 5, 10].map(d => (
            <button key={d} onClick={() => !running && setDuration(d)} disabled={running}
              className="py-3 rounded-xl font-bold text-sm transition-all"
              style={{
                background: duration === d ? 'linear-gradient(135deg,#2EC4B6,#FF8FA3)' : theme.surface2,
                color:      duration === d ? '#fff' : theme.textMuted,
              }}>
              {d} min
            </button>
          ))}
        </div>
      </div>

      {/* Sonido ambiental */}
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
                style={{ color: sound === a.id ? '#2EC4B6' : theme.textMuted }}>
                {a.label}
              </span>
            </button>
          ))}
        </div>
        {!sound && (
          <p className="text-[11px] mt-2 text-center" style={{ color: theme.textMuted }}>
            Sin sonido ambiental
          </p>
        )}
      </div>

      {/* Timer */}
      <div className="card flex flex-col items-center gap-5 py-7">
        <div className="relative" style={{ width: 158, height: 158 }}>
          <svg width="158" height="158"
            style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
            <circle cx="79" cy="79" r="56" fill="none" stroke={theme.surface2} strokeWidth="8" />
            <motion.circle cx="79" cy="79" r="56" fill="none" stroke="#2EC4B6" strokeWidth="8"
              strokeLinecap="round" strokeDasharray={circum}
              animate={{ strokeDashoffset: circum * (1 - progress) }}
              transition={{ duration: 1, ease: 'linear' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
  {done ? (
    <span style={{ fontSize: 36 }}>🎉</span>
  ) : (
    <PandaFrame running={running} theme={theme} />
  )}
  <p className="font-black text-xl leading-none" style={{ color: theme.text }}>
    {done ? '¡Listo!' : `${mm}:${ss}`}
  </p>
</div>
        </div>

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
                {muted
                  ? <VolumeX size={18} color={theme.textMuted} />
                  : <Volume2 size={18} color="#2EC4B6" />}
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
            className="text-sm font-semibold text-center" style={{ color: '#2EC4B6' }}>
            ✨ ¡{duration} minutos completados!
          </motion.p>
        )}
      </div>
    </div>
  )
}

// ─── TAB: HISTORIAL ──────────────────────────────────────────────────────────

function HistoryTab({ theme, userId }) {
  const [logs, setLogs] = useState([])

  useEffect(() => {
    if (!userId) return
    supabase.from('mood_logs').select('*').eq('user_id', userId)
      .order('date', { ascending: false }).limit(30)
      .then(({ data }) => setLogs(data || []))
  }, [userId])

  const avg  = logs.length ? (logs.reduce((s, l) => s + l.mood, 0) / logs.length).toFixed(1) : null
  const avgM = MOODS.find(m => m.v === Math.round(parseFloat(avg)))
  const streak = (() => {
    let s = 0
    const today = new Date()
    for (let i = 0; i < 30; i++) {
      const d = new Date(today); d.setDate(d.getDate() - i)
      if (logs.find(l => l.date === d.toISOString().split('T')[0])) s++; else break
    }
    return s
  })()

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {[
          { val: avg ?? '-', sub: 'Media 30d',  icon: avgM?.emoji || '😐' },
          { val: logs.length, sub: 'Registros', icon: '📅' },
          { val: streak,      sub: 'Racha días', icon: '🔥' },
        ].map((s, i) => (
          <div key={i} className="card text-center py-4">
            <p className="text-2xl font-black" style={{ color: '#2EC4B6' }}>{s.val}</p>
            <p className="text-[10px] mt-0.5" style={{ color: theme.textMuted }}>{s.sub}</p>
            <p className="text-lg mt-1">{s.icon}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <p className="text-sm font-bold mb-3" style={{ color: theme.text }}>Últimos 7 días</p>
        <div className="flex gap-2">
          {[...Array(7)].map((_, i) => {
            const d = new Date(); d.setDate(d.getDate() - (6 - i))
            const ds  = d.toISOString().split('T')[0]
            const log = logs.find(l => l.date === ds)
            const m   = MOODS.find(x => x.v === log?.mood)
            const isToday = i === 6
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full aspect-square rounded-xl flex items-center justify-center text-xl"
                  style={{
                    background: m ? `${m.color}20` : theme.surface2,
                    border: `2px solid ${isToday ? (m?.color || '#2EC4B6') + '80' : 'transparent'}`,
                  }}>
                  {m?.emoji || <span style={{ color: theme.textMuted, fontSize: 11 }}>·</span>}
                </div>
                <span className="text-[9px] font-semibold"
                  style={{ color: isToday ? '#2EC4B6' : theme.textLight }}>
                  {isToday ? 'Hoy' : d.getDate()}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="card">
        <p className="text-sm font-bold mb-3" style={{ color: theme.text }}>Reciente</p>
        {!logs.length && (
          <p className="text-sm text-center py-5" style={{ color: theme.textMuted }}>Aún no hay registros</p>
        )}
        <div className="space-y-2.5">
          {logs.slice(0, 12).map(l => {
            const m = MOODS.find(x => x.v === l.mood)
            return (
              <div key={l.id} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: `${m?.color}18` }}>
                  {m?.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold" style={{ color: theme.text }}>{m?.label}</p>
                  {l.notes && <p className="text-[10px] truncate" style={{ color: theme.textMuted }}>{l.notes}</p>}
                </div>
                <span className="text-[10px] flex-shrink-0" style={{ color: theme.textLight }}>
                  {new Date(l.date + 'T12:00:00').toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── PÁGINA PRINCIPAL ─────────────────────────────────────────────────────────

export default function Mood() {
  const { user, addXP } = useStore()
  const { theme }       = useTheme()
  const [activeTab, setActiveTab] = useState('checkin')

  return (
    <div className="page">
      <h1 className="text-2xl font-extrabold mb-4" style={{ color: theme.text }}>
        Estado emocional 💛
      </h1>

      <div className="flex gap-1 mb-5 p-1 rounded-2xl" style={{ background: theme.surface2 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className="flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl transition-all"
            style={{
              background: activeTab === t.id ? theme.surface : 'transparent',
              color:      activeTab === t.id ? theme.primary : theme.textMuted,
              boxShadow:  activeTab === t.id ? '0 1px 8px rgba(0,0,0,0.08)' : 'none',
            }}>
            <span className="text-base">{t.icon}</span>
            <span className="text-[9px] font-bold">{t.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab}
          initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -14 }} transition={{ duration: 0.16 }}>
          {activeTab === 'checkin'  && <CheckinTab  theme={theme} userId={user?.id} addXP={addXP} />}
          {activeTab === 'breathe'  && <BreathingTab theme={theme} />}
          {activeTab === 'meditate' && <MeditationTab theme={theme} />}
          {activeTab === 'history'  && <HistoryTab  theme={theme} userId={user?.id} />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
