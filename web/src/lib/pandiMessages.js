// ─── PERSONALIDAD Y MENSAJES DE PANDI ────────────────────────────────────────
// Todos los textos que Pandi dice en la sección Mi Bienestar.
// Cambiar aquí afecta a toda la app — mantener tono: cálido, concreto, sin genéricos.

export const PANDI_MOOD_MESSAGES = {
  first: {
    1: 'Aquí estoy 🤍 No hace falta hacer nada grande hoy. ¿Respiramos juntos?',
    2: 'Entiendo. A veces los días empiezan así. ¿Qué ha pasado?',
    3: 'Un día normal también vale. ¿Qué necesitas ahora mismo?',
    4: 'Me alegra verte así 😊 ¿Aprovechamos esta energía?',
    5: '¡Eso se nota desde aquí! 🌟 ¿Qué lo ha hecho especial hoy?',
  },
  already_saved: {
    1: 'Ya guardamos cómo te sentías. Sigo aquí si me necesitas 🤍',
    2: 'Registrado. Puedes actualizar si cambia algo.',
    3: 'Anotado. ¿Cómo va el resto del día?',
    4: '¡Bien guardado! Sigue así 😊',
    5: '¡Registrado! Qué buen día llevas 🌟',
  },
  consecutive_low:
    'Llevas unos días difíciles. No te voy a decir que sonrías. ¿Has dormido bien? ¿Has comido algo hoy?',
  recovery:
    'Parece que hoy está mejor el día ☀️ Me alegra verte así.',
}

export const PANDI_ACTIONS = {
  1: { label: '🫁 Respiremos juntos — 4-7-8', tab: 'breathe', tech: '478'  },
  2: { label: '🫁 Respiración en caja',        tab: 'breathe', tech: 'box'  },
  3: { label: '🧘 5 min de meditación',         tab: 'meditate', mins: 5    },
  4: { label: '🧘 10 min para mantener el bien',tab: 'meditate', mins: 10   },
  5: { label: '✨ Celebra con una meditación',  tab: 'meditate', mins: 5    },
}

// Frame de Pandi a mostrar según mood
// Temporal: emoji | Definitivo: /panda/<frame>.png
export const PANDI_MOOD_FRAME = {
  1: { file: 'love_1',      fallback: '🥺' },
  2: { file: 'sad_1',       fallback: '😔' },
  3: { file: 'talk_1',      fallback: '🐼' },
  4: { file: 'happy_1',     fallback: '😊' },
  5: { file: 'celebrate_1', fallback: '🤩' },
}

// Saludos de entrada — rotan aleatoriamente
export const PANDI_GREETINGS = (name = '', hour = new Date().getHours()) => [
  `Hola ${name} 🐼 ¿Cómo llegamos hoy?`,
  `${hour < 12 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches'}, ${name} 🌿`,
  `Aquí estamos otra vez. ¿Qué tal el día, ${name}?`,
  `Me alegra verte por aquí 🐾`,
]

// Hábitos predefinidos
export const DEFAULT_HABITS = [
  { id: 'med_am',   icon: '💊', label: 'Medicación mañana',  time: 'mañana'  },
  { id: 'water_am', icon: '💧', label: 'Agua al levantarme', time: 'mañana'  },
  { id: 'vitamins', icon: '🌿', label: 'Vitaminas/suplementos', time: 'mañana' },
  { id: 'breath',   icon: '🫁', label: 'Respiración diaria', time: 'tarde'   },
  { id: 'med_pm',   icon: '💊', label: 'Medicación noche',   time: 'noche'   },
  { id: 'reflect',  icon: '📓', label: 'Momento de reflexión', time: 'noche' },
]
