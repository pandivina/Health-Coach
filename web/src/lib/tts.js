// ─── lib/tts.js ──────────────────────────────────────────────────────────────
// Capa de abstracción TTS — cambia solo aquí cuando tengas ElevenLabs
// Uso: import { speak, stopSpeech } from '../lib/tts'
//      await speak('Hola, ¿cómo estás hoy?', { rate: 0.9 })

// Detecta el idioma preferido del usuario (navegador → es-ES como fallback)
function detectLang() {
  const lang = navigator.language || navigator.languages?.[0] || 'es-ES'
  // Si el idioma base es español, usar es-ES
  if (lang.startsWith('es')) return 'es-ES'
  return lang
}

// Encuentra la mejor voz disponible para el idioma dado
function getBestVoice(lang) {
  const voices = speechSynthesis.getVoices()
  if (!voices.length) return null

  // Intentar coincidencia exacta primero (ej: es-ES)
  let voice = voices.find(v => v.lang === lang && !v.localService === false)
  // Fallback: coincidencia parcial (ej: es)
  if (!voice) voice = voices.find(v => v.lang.startsWith(lang.split('-')[0]))
  // Fallback final: cualquier voz
  if (!voice) voice = voices[0]
  return voice
}

// Cola interna para evitar solapamientos
let _currentUtterance = null

export function stopSpeech() {
  if (typeof speechSynthesis !== 'undefined') {
    speechSynthesis.cancel()
    _currentUtterance = null
  }
}

export function speak(text, options = {}) {
  return new Promise((resolve, reject) => {
    // ── FUTURO: ElevenLabs ────────────────────────────────────────────────
    // if (window.__ELEVENLABS_KEY__) {
    //   return speakElevenLabs(text, options).then(resolve).catch(reject)
    // }
    // ─────────────────────────────────────────────────────────────────────

    if (typeof speechSynthesis === 'undefined') { resolve(); return }

    stopSpeech()

    const lang      = options.lang || detectLang()
    const utterance = new SpeechSynthesisUtterance(text)

    utterance.lang   = lang
    utterance.rate   = options.rate   ?? 0.88   // un poco más lento para meditación
    utterance.pitch  = options.pitch  ?? 1.0
    utterance.volume = options.volume ?? 0.9

    // Asignar voz al cargar — puede no estar disponible inmediatamente
    const assignVoice = () => {
      const voice = getBestVoice(lang)
      if (voice) utterance.voice = voice
    }

    if (speechSynthesis.getVoices().length) {
      assignVoice()
    } else {
      speechSynthesis.addEventListener('voiceschanged', assignVoice, { once: true })
    }

    utterance.onend   = () => { _currentUtterance = null; resolve() }
    utterance.onerror = (e) => { _currentUtterance = null; resolve() } // no rechazar — TTS no es crítico

    _currentUtterance = utterance
    speechSynthesis.speak(utterance)
  })
}

// Versión no-blocking — para frases cortas sin await
export function sayAsync(text, options = {}) {
  speak(text, options).catch(() => {})
}

// ── Mensajes de Pandi para cada momento ─────────────────────────────────────
export const PANDI_VOICE = {
  greeting: (name) => [
    `Hola ${name}, aquí estoy contigo.`,
    `${name}, qué bueno que hayas venido.`,
    `Bienvenido al santuario, ${name}.`,
  ][Math.floor(Math.random() * 3)],

  moodResponse: {
    1: 'Lo siento. Estoy aquí contigo. Respira conmigo un momento.',
    2: 'Entiendo. A veces los días pesan. Vamos paso a paso.',
    3: 'Un día normal también es un día válido. Sigues aquí.',
    4: 'Me alegra escuchar eso. Aprovechemos esta energía.',
    5: '¡Qué bien! Esa energía se nota. Sigamos así.',
  },

  breathPhase: {
    inhale:  'Inhala...',
    hold:    'Mantén...',
    exhale:  'Exhala...',
    holdOut: 'Pausa...',
  },

  meditationStart: (duration) =>
    `Vamos a meditar ${duration} minutos juntos. Cierra los ojos y respira.`,

  meditationEnd: (name) =>
    `Lo has hecho muy bien, ${name}. Lleva esta calma contigo.`,

  habitsDone: (name) =>
    `${name}, has completado todos tus hábitos de hoy. Estoy muy orgulloso de ti.`,

  nightCheckin: (name) =>
    `Buenas noches, ${name}. ¿Cuáles son tus tres logros de hoy?`,
}
