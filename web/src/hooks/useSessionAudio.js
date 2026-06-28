// web/src/hooks/useSessionAudio.js
// ─── SISTEMA DE AUDIO PARA MEDITACIÓN Y RESPIRACIÓN ─────────────────────────
// Audios en /public/audio/

import { useRef, useEffect, useCallback } from 'react'

// ─── CONFIGURACIÓN DE TRACKS ─────────────────────────────────────────────────

const SOUNDS_PATH = '/audio'

// Frases de meditación — duración real en ms
const MED_TRACKS = [
  { file: 'med-01.mp3', ms: 4000 },
  { file: 'med-02.mp3', ms: 4000 },
  { file: 'med-03.mp3', ms: 4000 },
  { file: 'med-04.mp3', ms: 3000 },  // ← 3s
  { file: 'med-05.mp3', ms: 4000 },
  { file: 'med-06.mp3', ms: 4000 },
  { file: 'med-07.mp3', ms: 4000 },
  { file: 'med-08.mp3', ms: 4000 },
  { file: 'med-09.mp3', ms: 4000 },
  { file: 'med-10.mp3', ms: 6000 },  // ← 6s
]
const MED_TOTAL_MS = MED_TRACKS.reduce((s, t) => s + t.ms, 0) // 41 000 ms

// Ambientes disponibles
export const AMBIENT_OPTIONS = [
  { id: 'bowls',  label: '🔔 Cuencos',  file: 'ambient-bowls.mp3'  },
  { id: 'forest', label: '🌲 Bosque',   file: 'ambient-forest.mp3' },
  { id: 'ocean',  label: '🌊 Océano',   file: 'ambient-ocean.mp3'  },
  { id: 'rain',   label: '🌧️ Lluvia',   file: 'ambient-rain.mp3'   },
  { id: 'space',  label: '🌌 Espacio',  file: 'ambient-space.mp3'  },
]

// Construir playlist para cubrir N segundos con los tracks de meditación
function buildMedPlaylist(targetSecs) {
  const playlist = []
  let totalMs    = 0
  const targetMs = targetSecs * 1000
  let loop = 0

  while (totalMs < targetMs && loop < 30) {
    for (const track of MED_TRACKS) {
      if (totalMs >= targetMs) break
      playlist.push(track)
      totalMs += track.ms
    }
    loop++
  }
  return playlist
}

// ─── HOOK PRINCIPAL ───────────────────────────────────────────────────────────

export function useSessionAudio() {
  const ambientRef   = useRef(null)  // Audio ambient (loop)
  const voiceRef     = useRef(null)  // Audio voz/meditación
  const breathRef    = useRef(null)  // Audio respiración (cues)
  const playlistRef  = useRef([])
  const trackIdxRef  = useRef(0)
  const timerRef     = useRef(null)
  const activeRef    = useRef(false)

  // ── Limpiar todo ─────────────────────────────────────────────────────────
  const stopAll = useCallback(() => {
    activeRef.current = false
    clearTimeout(timerRef.current)

    if (ambientRef.current) {
      ambientRef.current.pause()
      ambientRef.current.currentTime = 0
    }
    if (voiceRef.current) {
      voiceRef.current.pause()
      voiceRef.current.currentTime = 0
    }
    if (breathRef.current) {
      breathRef.current.pause()
      breathRef.current.currentTime = 0
    }
  }, [])

  useEffect(() => () => stopAll(), [stopAll])

  // ── Crear/obtener elemento Audio ─────────────────────────────────────────
  function getAudio(ref, src, loop = false, volume = 1) {
    if (!ref.current || ref.current.src !== src) {
      if (ref.current) ref.current.pause()
      ref.current = new Audio(src)
      ref.current.loop   = loop
      ref.current.volume = volume
    }
    return ref.current
  }

  // ── Iniciar ambiente ─────────────────────────────────────────────────────
  const startAmbient = useCallback((ambientId = 'forest', volume = 0.35) => {
    const opt = AMBIENT_OPTIONS.find(a => a.id === ambientId) || AMBIENT_OPTIONS[1]
    const src = `${SOUNDS_PATH}/${opt.file}`
    const amb = getAudio(ambientRef, src, true, volume)
    amb.play().catch(() => {})
  }, [])

  const setAmbientVolume = useCallback((vol) => {
    if (ambientRef.current) ambientRef.current.volume = Math.max(0, Math.min(1, vol))
  }, [])

  // ── MEDITACIÓN ────────────────────────────────────────────────────────────
  // targetSecs: 60, 120, 300 o 600
  const startMeditation = useCallback((targetSecs = 60, ambientId = 'bowls', onEnd) => {
    stopAll()
    activeRef.current  = true
    trackIdxRef.current = 0
    playlistRef.current = buildMedPlaylist(targetSecs)

    startAmbient(ambientId, 0.3)

    function playNext() {
      if (!activeRef.current) return
      const track = playlistRef.current[trackIdxRef.current]
      if (!track) { onEnd?.(); return }

      const src = `${SOUNDS_PATH}/${track.file}`
      const voice = getAudio(voiceRef, src, false, 0.85)
      voice.currentTime = 0
      voice.play().catch(() => {})

      trackIdxRef.current++
      timerRef.current = setTimeout(playNext, track.ms + 400) // 400ms pausa entre frases
    }

    // Pequeña pausa inicial de 1.5s antes de empezar las frases
    timerRef.current = setTimeout(playNext, 1500)
  }, [startAmbient, stopAll])

  // ── RESPIRACIÓN ───────────────────────────────────────────────────────────
  // phases: array de { phase: 'inhale'|'hold'|'exhale', secs: N }
  // Ej: [{ phase:'inhale', secs:4 }, { phase:'hold', secs:4 }, { phase:'exhale', secs:4 }]
  const startBreathing = useCallback((phases, ambientId = 'ocean', onPhaseChange, onEnd) => {
    stopAll()
    activeRef.current = true
    startAmbient(ambientId, 0.25)

    const BREATH_FILES = {
      inhale: 'breath-inhale.mp3',
      hold:   'breath-hold.mp3',
      exhale: 'breath-exhale.mp3',
    }

    let cycleIdx   = 0
    let phaseIdx   = 0
    let totalCycles = 999  // infinito hasta que el usuario pare

    function playPhase() {
      if (!activeRef.current) return

      const phase = phases[phaseIdx]
      if (!phase) { phaseIdx = 0; cycleIdx++; if (cycleIdx >= totalCycles) { onEnd?.(); return }; playPhase(); return }

      // Reproducir cue de audio de la fase
      const src   = `${SOUNDS_PATH}/${BREATH_FILES[phase.phase]}`
      const audio = getAudio(breathRef, src, false, 0.75)
      audio.currentTime = 0
      audio.play().catch(() => {})

      // Notificar al componente de la fase actual
      onPhaseChange?.(phase.phase, phase.secs, phaseIdx, cycleIdx)

      phaseIdx++
      timerRef.current = setTimeout(playPhase, phase.secs * 1000)
    }

    setTimeout(playPhase, 800)
  }, [startAmbient, stopAll])

  // ── Reproducir sonido UI puntual ─────────────────────────────────────────
  const playUI = useCallback((filename, volume = 0.6) => {
    try {
      const a = new Audio(`${SOUNDS_PATH}/${filename}`)
      a.volume = volume
      a.play().catch(() => {})
    } catch {}
  }, [])

  return { startMeditation, startBreathing, startAmbient, setAmbientVolume, stopAll, playUI }
}

// ─── CONFIGURACIONES DE RESPIRACIÓN PREDEFINIDAS ─────────────────────────────

export const BREATH_PATTERNS = {
  '4-4-4': {
    label:  'Respiración cuadrada',
    desc:   '4s inhala · 4s retén · 4s exhala',
    phases: [
      { phase:'inhale', secs:4 },
      { phase:'hold',   secs:4 },
      { phase:'exhale', secs:4 },
    ]
  },
  '4-7-8': {
    label:  '4-7-8 Relajante',
    desc:   '4s inhala · 7s retén · 8s exhala',
    phases: [
      { phase:'inhale', secs:4 },
      { phase:'hold',   secs:7 },
      { phase:'exhale', secs:8 },
    ]
  },
  '3-0-5': {
    label:  'Calma rápida',
    desc:   '3s inhala · 5s exhala',
    phases: [
      { phase:'inhale', secs:3 },
      { phase:'exhale', secs:5 },
    ]
  },
}

export const MED_DURATIONS = [
  { secs: 60,  label: '1 min'  },
  { secs: 120, label: '2 min'  },
  { secs: 300, label: '5 min'  },
  { secs: 600, label: '10 min' },
]
