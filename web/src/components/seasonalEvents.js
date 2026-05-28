// ─── SISTEMA DE EVENTOS DE TEMPORADA ─────────────────────────────────────────
// Añade nuevos eventos aquí. SeasonalEventCard carga el activo automáticamente.

function nextOccurrence(month, day) {
  const now  = new Date()
  const year = now.getFullYear()
  const date = new Date(`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}T23:59:59`)
  return date < now ? new Date(`${year + 1}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}T23:59:59`) : date
}

export const EVENTS = {
  halloween: {
    id:       'yggdrasil_halloween',
    name:     'El Grimorio de Yggdrasil',
    subtitle: 'Noche de Brujas · Evento de Temporada',
    emoji:    '🎃',
    activeFrom: { month: 10, day: 24 }, // se activa 7 días antes
    endsAt:   nextOccurrence(10, 31),
    styles: {
      bg:        'linear-gradient(135deg, #0F0517, #1A0A2E, #0C0A1A)',
      border:    'conic-gradient(from 0deg, #7C3AED, #F97316, #1F2937, #DC2626, #7C3AED)',
      glow:      'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.3) 0%, rgba(249,115,22,0.12) 60%, transparent 100%)',
      particles: ['#F97316','#7C3AED','#DC2626','#F59E0B'],
      accent:    '#F97316',
      tagBg:     'rgba(124,58,237,0.3)',
      tagText:   '#D8B4FE',
      timerColor: '#F87171',
    },
    reward: {
      name:  'Tema: Noche de Brujas',
      emoji: '🧙',
      desc:  'Desbloquea el tema visual "Grimorio" y el accesorio Sombrero de Pandi',
    },
    missions: [
      {
        id: 'steel', school: 'Transmutación', path: 'titan',
        emoji: '⚚', name: 'Canalizar Acero',
        desc: 'Levantar 1.0t de volumen acumulado esta semana',
        target: 1000, unit: 'kg', color: '#F97316',
      },
      {
        id: 'mana', school: 'Evocación', path: 'warrior',
        emoji: '⚡', name: 'Tormenta de Maná',
        desc: 'Quemar 300 kcal en entrenamientos HIIT',
        target: 300, unit: 'kcal', color: '#7C3AED',
      },
      {
        id: 'astral', school: 'Restauración', path: 'zen',
        emoji: '🌀', name: 'Equilibrio Astral',
        desc: 'Completar 20 minutos de Yoga o Pilates',
        target: 20, unit: 'min', color: '#DC2626',
      },
    ],
  },

  christmas: {
    id:       'pandi_navidad',
    name:     'El Festín de Pandi',
    subtitle: 'Navidad · Evento de Temporada',
    emoji:    '🎄',
    activeFrom: { month: 12, day: 18 },
    endsAt:   nextOccurrence(12, 31),
    styles: {
      bg:        'linear-gradient(135deg, #0A1F0A, #1A0A0A, #0A0A1F)',
      border:    'conic-gradient(from 0deg, #16A34A, #DC2626, #F59E0B, #16A34A)',
      glow:      'radial-gradient(ellipse at 50% 0%, rgba(22,163,74,0.25) 0%, rgba(220,38,38,0.1) 60%, transparent 100%)',
      particles: ['#16A34A','#DC2626','#F59E0B','#FFFFFF'],
      accent:    '#16A34A',
      tagBg:     'rgba(22,163,74,0.3)',
      tagText:   '#86EFAC',
      timerColor: '#FCA5A5',
    },
    reward: {
      name:  'Tema: Navidad Ártica',
      emoji: '🎅',
      desc:  'Desbloquea el tema "Pandi Santa" y el accesorio Gorro de Navidad',
    },
    missions: [
      {
        id: 'steel', school: 'Fuerza Invernal', path: 'titan',
        emoji: '❄️', name: 'Voluntad de Hielo',
        desc: 'Levantar 1.0t de volumen esta semana',
        target: 1000, unit: 'kg', color: '#16A34A',
      },
      {
        id: 'mana', school: 'Resistencia Ártica', path: 'warrior',
        emoji: '🏃', name: 'Carrera del Reno',
        desc: 'Quemar 300 kcal en cardio esta semana',
        target: 300, unit: 'kcal', color: '#DC2626',
      },
      {
        id: 'astral', school: 'Paz Interior', path: 'zen',
        emoji: '🕯️', name: 'Luz de Adviento',
        desc: 'Completar 20 minutos de meditación o yoga',
        target: 20, unit: 'min', color: '#F59E0B',
      },
    ],
  },

  summer: {
    id:       'pandi_verano',
    name:     'El Solsticio de Pandi',
    subtitle: 'Verano · Evento de Temporada',
    emoji:    '☀️',
    activeFrom: { month: 6, day: 17 },
    endsAt:   nextOccurrence(6, 24),
    styles: {
      bg:        'linear-gradient(135deg, #0A1520, #1A1005, #0A1520)',
      border:    'conic-gradient(from 0deg, #F59E0B, #0EA5E9, #6EE7B7, #F59E0B)',
      glow:      'radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.25) 0%, rgba(14,165,233,0.1) 60%, transparent 100%)',
      particles: ['#F59E0B','#0EA5E9','#6EE7B7','#FDE68A'],
      accent:    '#F59E0B',
      tagBg:     'rgba(245,158,11,0.3)',
      tagText:   '#FDE68A',
      timerColor: '#FDE68A',
    },
    reward: {
      name:  'Tema: Paraíso Solar',
      emoji: '🌊',
      desc:  'Desbloquea el tema "Pandi Beach" y el accesorio Gafas de Sol',
    },
    missions: [
      {
        id: 'steel', school: 'Forja Solar', path: 'titan',
        emoji: '🔆', name: 'Calor de Acero',
        desc: 'Levantar 1.0t de volumen esta semana',
        target: 1000, unit: 'kg', color: '#F59E0B',
      },
      {
        id: 'mana', school: 'Oleaje Cardio', path: 'warrior',
        emoji: '🌊', name: 'Marea de Fuego',
        desc: 'Quemar 300 kcal en cardio',
        target: 300, unit: 'kcal', color: '#0EA5E9',
      },
      {
        id: 'astral', school: 'Flujo Zen', path: 'zen',
        emoji: '🌴', name: 'Brisa del Solsticio',
        desc: 'Completar 20 minutos de Yoga al aire libre',
        target: 20, unit: 'min', color: '#6EE7B7',
      },
    ],
  },
}

// ─── SELECCIÓN AUTOMÁTICA DEL EVENTO ACTIVO ───────────────────────────────────

export function getActiveEvent() {
  const now   = new Date()
  const month = now.getMonth() + 1
  const day   = now.getDate()

  for (const event of Object.values(EVENTS)) {
    const { activeFrom, endsAt } = event
    const start = new Date(`${now.getFullYear()}-${String(activeFrom.month).padStart(2,'0')}-${String(activeFrom.day).padStart(2,'0')}T00:00:00`)
    if (now >= start && now <= endsAt) return event
  }
  return null // sin evento activo
}
