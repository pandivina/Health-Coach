// Generador de pitidos usando la Web Audio API nativa (sin archivos .mp3 pesados)
const playTone = (freq, type, duration) => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioCtx.createOscillator()
    const gainNode = audioCtx.createGain()

    oscillator.type = type // 'sine', 'square', 'sawtooth', 'triangle'
    oscillator.frequency.value = freq
    
    // Suavizar el inicio y fin del pitido para que no sature
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration)

    oscillator.connect(gainNode)
    gainNode.connect(audioCtx.destination)

    oscillator.start()
    oscillator.stop(audioCtx.currentTime + duration)
  } catch (e) {
    console.error("AudioContext no soportado en este dispositivo", e)
  }
}

export const audioService = {
  // Pitido clásico de cuenta regresiva
  playBeepLow() {
    playTone(587.33, 'sine', 0.15) // Nota Re5 (pitido corto de aviso)
  },

  // Pitido de "¡A entrenar!" (más agudo o doble)
  playBeepHigh() {
    playTone(880, 'sine', 0.4) // Nota La5 (pitido de inicio)
  },

  // Síntesis de voz nativa (Text-to-Speech)
  speak(text) {
    if (!('speechSynthesis' in window)) return
    
    // Cancelar cualquier mensaje a medias para que no se acumulen
    window.speechSynthesis.cancel()
    
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'es-ES'
    utterance.rate = 1.0 // Velocidad
    utterance.pitch = 1.1 // Tono ligeramente animado (estilo Pandi)
    
    window.speechSynthesis.speak(utterance)
  },

  // Orquestador inteligente basado en la preferencia del usuario
  triggerFeedback({ mode, text, type }) {
    if (mode === 'silent') return

    if (mode === 'speech' && text) {
      this.speak(text)
    } else {
      // Si está en 'beeps' o la síntesis de voz falla, hacemos los pitidos
      if (type === 'warning') this.playBeepLow()
      if (type === 'success') this.playBeepHigh()
    }
  }
}
