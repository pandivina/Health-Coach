// ─── BIBLIOTECA DE ANIMACIONES SVG POR EJERCICIO ─────────────────────────────
// Cada ejercicio tiene frames SVG que se animan secuencialmente.
// Para añadir más: genera el SVG con el prompt maestro y añade la entrada aquí.

export const EXERCISE_ANIMATIONS = {

  // ── GUERRERO ──────────────────────────────────────────────────────────────
  'w_jumping_jacks': {
    name: 'Jumping Jacks',
    fps: 600, // ms por frame
    frames: [
      // Frame 1 — posición cerrada
      `<g stroke="#2EC4B6" stroke-width="4" stroke-linecap="round" fill="none">
        <circle cx="50" cy="25" r="10"/>
        <line x1="50" y1="35" x2="50" y2="90"/>
        <line x1="50" y1="50" x2="30" y2="75"/>
        <line x1="50" y1="50" x2="70" y2="75"/>
        <line x1="50" y1="90" x2="35" y2="135"/>
        <line x1="50" y1="90" x2="65" y2="135"/>
      </g>`,
      // Frame 2 — posición abierta
      `<g stroke="#2EC4B6" stroke-width="4" stroke-linecap="round" fill="none">
        <circle cx="50" cy="25" r="10"/>
        <line x1="50" y1="35" x2="50" y2="90"/>
        <line x1="50" y1="50" x2="18" y2="28"/>
        <line x1="50" y1="50" x2="82" y2="28"/>
        <line x1="50" y1="90" x2="22" y2="140"/>
        <line x1="50" y1="90" x2="78" y2="140"/>
      </g>`,
    ],
  },

  'w_burpees': {
    name: 'Burpees',
    fps: 700,
    frames: [
      // Frame 1 — de pie
      `<g stroke="#2EC4B6" stroke-width="4" stroke-linecap="round" fill="none">
        <circle cx="50" cy="25" r="10"/>
        <line x1="50" y1="35" x2="50" y2="90"/>
        <line x1="50" y1="55" x2="30" y2="75"/>
        <line x1="50" y1="55" x2="70" y2="75"/>
        <line x1="50" y1="90" x2="38" y2="140"/>
        <line x1="50" y1="90" x2="62" y2="140"/>
      </g>`,
      // Frame 2 — agachado
      `<g stroke="#2EC4B6" stroke-width="4" stroke-linecap="round" fill="none">
        <circle cx="50" cy="55" r="10"/>
        <line x1="50" y1="65" x2="50" y2="105"/>
        <line x1="50" y1="75" x2="25" y2="90"/>
        <line x1="50" y1="75" x2="75" y2="90"/>
        <line x1="50" y1="105" x2="30" y2="130"/>
        <line x1="50" y1="105" x2="70" y2="130"/>
      </g>`,
      // Frame 3 — plancha
      `<g stroke="#2EC4B6" stroke-width="4" stroke-linecap="round" fill="none">
        <circle cx="20" cy="80" r="10"/>
        <line x1="30" y1="80" x2="80" y2="90"/>
        <line x1="25" y1="80" x2="15" y2="110"/>
        <line x1="80" y1="90" x2="70" y2="120"/>
        <line x1="80" y1="90" x2="90" y2="120"/>
      </g>`,
      // Frame 4 — salto
      `<g stroke="#2EC4B6" stroke-width="4" stroke-linecap="round" fill="none">
        <circle cx="50" cy="15" r="10"/>
        <line x1="50" y1="25" x2="50" y2="80"/>
        <line x1="50" y1="45" x2="20" y2="25"/>
        <line x1="50" y1="45" x2="80" y2="25"/>
        <line x1="50" y1="80" x2="35" y2="115"/>
        <line x1="50" y1="80" x2="65" y2="115"/>
      </g>`,
    ],
  },

  'w_escaladores': {
    name: 'Escaladores',
    fps: 400,
    frames: [
      `<g stroke="#2EC4B6" stroke-width="4" stroke-linecap="round" fill="none">
        <circle cx="20" cy="70" r="10"/>
        <line x1="30" y1="72" x2="80" y2="85"/>
        <line x1="22" y1="78" x2="10" y2="108"/>
        <line x1="80" y1="85" x2="65" y2="115"/>
        <line x1="80" y1="85" x2="90" y2="115"/>
        <line x1="45" y1="80" x2="38" y2="110"/>
      </g>`,
      `<g stroke="#2EC4B6" stroke-width="4" stroke-linecap="round" fill="none">
        <circle cx="20" cy="70" r="10"/>
        <line x1="30" y1="72" x2="80" y2="85"/>
        <line x1="22" y1="78" x2="10" y2="108"/>
        <line x1="80" y1="85" x2="65" y2="115"/>
        <line x1="80" y1="85" x2="90" y2="115"/>
        <line x1="55" y1="82" x2="48" y2="108"/>
      </g>`,
    ],
  },

  'w_sentadilla_salto': {
    name: 'Sentadilla con Salto',
    fps: 600,
    frames: [
      `<g stroke="#2EC4B6" stroke-width="4" stroke-linecap="round" fill="none">
        <circle cx="50" cy="45" r="10"/>
        <line x1="50" y1="55" x2="50" y2="105"/>
        <line x1="50" y1="70" x2="25" y2="85"/>
        <line x1="50" y1="70" x2="75" y2="85"/>
        <line x1="50" y1="105" x2="30" y2="135"/>
        <line x1="50" y1="105" x2="70" y2="135"/>
      </g>`,
      `<g stroke="#2EC4B6" stroke-width="4" stroke-linecap="round" fill="none">
        <circle cx="50" cy="15" r="10"/>
        <line x1="50" y1="25" x2="50" y2="80"/>
        <line x1="50" y1="45" x2="22" y2="30"/>
        <line x1="50" y1="45" x2="78" y2="30"/>
        <line x1="50" y1="80" x2="38" y2="110"/>
        <line x1="50" y1="80" x2="62" y2="110"/>
      </g>`,
    ],
  },

  // ── TITÁN ─────────────────────────────────────────────────────────────────
  't_sentadilla': {
    name: 'Sentadilla Libre',
    fps: 800,
    frames: [
      `<g stroke="#F97316" stroke-width="4" stroke-linecap="round" fill="none">
        <circle cx="50" cy="25" r="10"/>
        <line x1="50" y1="35" x2="50" y2="90"/>
        <line x1="50" y1="55" x2="30" y2="72"/>
        <line x1="50" y1="55" x2="70" y2="72"/>
        <line x1="50" y1="90" x2="38" y2="140"/>
        <line x1="50" y1="90" x2="62" y2="140"/>
        <line x1="28" y1="45" x2="72" y2="45"/>
      </g>`,
      `<g stroke="#F97316" stroke-width="4" stroke-linecap="round" fill="none">
        <circle cx="50" cy="48" r="10"/>
        <line x1="50" y1="58" x2="50" y2="108"/>
        <line x1="50" y1="72" x2="22" y2="88"/>
        <line x1="50" y1="72" x2="78" y2="88"/>
        <line x1="50" y1="108" x2="28" y2="138"/>
        <line x1="50" y1="108" x2="72" y2="138"/>
        <line x1="28" y1="60" x2="72" y2="60"/>
      </g>`,
    ],
  },

  't_press_banca': {
    name: 'Press de Banca',
    fps: 900,
    frames: [
      `<g stroke="#F97316" stroke-width="4" stroke-linecap="round" fill="none">
        <circle cx="50" cy="55" r="10"/>
        <line x1="50" y1="65" x2="50" y2="110"/>
        <line x1="50" y1="80" x2="15" y2="60"/>
        <line x1="50" y1="80" x2="85" y2="60"/>
        <line x1="50" y1="110" x2="38" y2="145"/>
        <line x1="50" y1="110" x2="62" y2="145"/>
        <line x1="10" y1="150" x2="90" y2="150"/>
      </g>`,
      `<g stroke="#F97316" stroke-width="4" stroke-linecap="round" fill="none">
        <circle cx="50" cy="55" r="10"/>
        <line x1="50" y1="65" x2="50" y2="110"/>
        <line x1="50" y1="80" x2="15" y2="80"/>
        <line x1="50" y1="80" x2="85" y2="80"/>
        <line x1="50" y1="110" x2="38" y2="145"/>
        <line x1="50" y1="110" x2="62" y2="145"/>
        <line x1="10" y1="150" x2="90" y2="150"/>
      </g>`,
    ],
  },

  't_dominadas': {
    name: 'Dominadas',
    fps: 900,
    frames: [
      `<g stroke="#F97316" stroke-width="4" stroke-linecap="round" fill="none">
        <line x1="10" y1="15" x2="90" y2="15"/>
        <circle cx="50" cy="40" r="10"/>
        <line x1="50" y1="50" x2="50" y2="105"/>
        <line x1="50" y1="55" x2="25" y2="25"/>
        <line x1="50" y1="55" x2="75" y2="25"/>
        <line x1="50" y1="105" x2="38" y2="145"/>
        <line x1="50" y1="105" x2="62" y2="145"/>
      </g>`,
      `<g stroke="#F97316" stroke-width="4" stroke-linecap="round" fill="none">
        <line x1="10" y1="15" x2="90" y2="15"/>
        <circle cx="50" cy="30" r="10"/>
        <line x1="50" y1="40" x2="50" y2="95"/>
        <line x1="50" y1="45" x2="25" y2="25"/>
        <line x1="50" y1="45" x2="75" y2="25"/>
        <line x1="50" y1="95" x2="38" y2="135"/>
        <line x1="50" y1="95" x2="62" y2="135"/>
      </g>`,
    ],
  },

  't_plancha': {
    name: 'Plancha',
    fps: 1200,
    frames: [
      `<g stroke="#F97316" stroke-width="4" stroke-linecap="round" fill="none">
        <circle cx="18" cy="75" r="10"/>
        <line x1="28" y1="77" x2="82" y2="88"/>
        <line x1="20" y1="83" x2="12" y2="115"/>
        <line x1="82" y1="88" x2="72" y2="118"/>
        <line x1="82" y1="88" x2="92" y2="118"/>
        <line x1="12" y1="115" x2="12" y2="120"/>
        <line x1="72" y1="118" x2="72" y2="123"/>
        <line x1="92" y1="118" x2="92" y2="123"/>
      </g>`,
      `<g stroke="#F97316" stroke-width="4" stroke-linecap="round" fill="none">
        <circle cx="18" cy="72" r="10"/>
        <line x1="28" y1="74" x2="82" y2="84"/>
        <line x1="20" y1="80" x2="12" y2="112"/>
        <line x1="82" y1="84" x2="72" y2="114"/>
        <line x1="82" y1="84" x2="92" y2="114"/>
        <line x1="12" y1="112" x2="12" y2="120"/>
        <line x1="72" y1="114" x2="72" y2="123"/>
        <line x1="92" y1="114" x2="92" y2="123"/>
      </g>`,
    ],
  },

  // ── ZEN ───────────────────────────────────────────────────────────────────
  'm_respiracion': {
    name: 'Respiración 4-7-8',
    fps: 1500,
    frames: [
      `<g stroke="#6EE7B7" stroke-width="4" stroke-linecap="round" fill="none">
        <circle cx="50" cy="30" r="10"/>
        <line x1="50" y1="40" x2="50" y2="100"/>
        <line x1="50" y1="60" x2="35" y2="85"/>
        <line x1="50" y1="60" x2="65" y2="85"/>
        <line x1="50" y1="100" x2="40" y2="140"/>
        <line x1="50" y1="100" x2="60" y2="140"/>
        <circle cx="50" cy="70" r="8" stroke-width="2" stroke-dasharray="3 3"/>
      </g>`,
      `<g stroke="#6EE7B7" stroke-width="4" stroke-linecap="round" fill="none">
        <circle cx="50" cy="30" r="10"/>
        <line x1="50" y1="40" x2="50" y2="100"/>
        <line x1="50" y1="60" x2="28" y2="80"/>
        <line x1="50" y1="60" x2="72" y2="80"/>
        <line x1="50" y1="100" x2="40" y2="140"/>
        <line x1="50" y1="100" x2="60" y2="140"/>
        <circle cx="50" cy="70" r="14" stroke-width="2" stroke-dasharray="3 3"/>
      </g>`,
    ],
  },

  'z_guerrero_1': {
    name: 'Guerrero I',
    fps: 1000,
    frames: [
      `<g stroke="#6EE7B7" stroke-width="4" stroke-linecap="round" fill="none">
        <circle cx="50" cy="25" r="10"/>
        <line x1="50" y1="35" x2="50" y2="90"/>
        <line x1="50" y1="55" x2="30" y2="72"/>
        <line x1="50" y1="55" x2="70" y2="72"/>
        <line x1="50" y1="90" x2="38" y2="140"/>
        <line x1="50" y1="90" x2="62" y2="140"/>
      </g>`,
      `<g stroke="#6EE7B7" stroke-width="4" stroke-linecap="round" fill="none">
        <circle cx="50" cy="30" r="10"/>
        <line x1="50" y1="40" x2="50" y2="90"/>
        <line x1="50" y1="55" x2="25" y2="30"/>
        <line x1="50" y1="55" x2="75" y2="30"/>
        <line x1="50" y1="90" x2="28" y2="130"/>
        <line x1="50" y1="90" x2="72" y2="130"/>
        <line x1="72" y1="130" x2="72" y2="155"/>
      </g>`,
    ],
  },

  'z_perro_boca_abajo': {
    name: 'Perro Boca Abajo',
    fps: 1200,
    frames: [
      `<g stroke="#6EE7B7" stroke-width="4" stroke-linecap="round" fill="none">
        <circle cx="50" cy="55" r="10"/>
        <line x1="50" y1="65" x2="50" y2="110"/>
        <line x1="50" y1="80" x2="25" y2="120"/>
        <line x1="50" y1="80" x2="75" y2="120"/>
        <line x1="50" y1="110" x2="30" y2="150"/>
        <line x1="50" y1="110" x2="70" y2="150"/>
      </g>`,
      `<g stroke="#6EE7B7" stroke-width="4" stroke-linecap="round" fill="none">
        <circle cx="50" cy="35" r="10"/>
        <line x1="50" y1="45" x2="50" y2="100"/>
        <line x1="50" y1="60" x2="18" y2="110"/>
        <line x1="50" y1="60" x2="82" y2="110"/>
        <line x1="50" y1="100" x2="32" y2="148"/>
        <line x1="50" y1="100" x2="68" y2="148"/>
      </g>`,
    ],
  },

  // ── CALENTAMIENTOS ────────────────────────────────────────────────────────
  'warmup_rotacion_hombros': {
    name: 'Rotación de hombros',
    fps: 500,
    frames: [
      `<g stroke="#2EC4B6" stroke-width="4" stroke-linecap="round" fill="none">
        <circle cx="50" cy="30" r="10"/>
        <line x1="50" y1="40" x2="50" y2="95"/>
        <line x1="50" y1="55" x2="25" y2="45"/>
        <line x1="50" y1="55" x2="75" y2="65"/>
        <line x1="50" y1="95" x2="38" y2="140"/>
        <line x1="50" y1="95" x2="62" y2="140"/>
      </g>`,
      `<g stroke="#2EC4B6" stroke-width="4" stroke-linecap="round" fill="none">
        <circle cx="50" cy="30" r="10"/>
        <line x1="50" y1="40" x2="50" y2="95"/>
        <line x1="50" y1="55" x2="25" y2="65"/>
        <line x1="50" y1="55" x2="75" y2="45"/>
        <line x1="50" y1="95" x2="38" y2="140"/>
        <line x1="50" y1="95" x2="62" y2="140"/>
      </g>`,
    ],
  },

  'warmup_saltos_tijera': {
    name: 'Saltos de tijera',
    fps: 500,
    frames: [
      `<g stroke="#0EA5E9" stroke-width="4" stroke-linecap="round" fill="none">
        <circle cx="50" cy="25" r="10"/>
        <line x1="50" y1="35" x2="50" y2="90"/>
        <line x1="50" y1="50" x2="30" y2="75"/>
        <line x1="50" y1="50" x2="70" y2="75"/>
        <line x1="50" y1="90" x2="35" y2="135"/>
        <line x1="50" y1="90" x2="65" y2="135"/>
      </g>`,
      `<g stroke="#0EA5E9" stroke-width="4" stroke-linecap="round" fill="none">
        <circle cx="50" cy="25" r="10"/>
        <line x1="50" y1="35" x2="50" y2="90"/>
        <line x1="50" y1="50" x2="18" y2="28"/>
        <line x1="50" y1="50" x2="82" y2="28"/>
        <line x1="50" y1="90" x2="22" y2="140"/>
        <line x1="50" y1="90" x2="78" y2="140"/>
      </g>`,
    ],
  },
}

// Helper para obtener animación por ID o nombre
export function getAnimation(exerciseId) {
  return EXERCISE_ANIMATIONS[exerciseId] || null
}

export function getAnimationByName(name) {
  return Object.values(EXERCISE_ANIMATIONS).find(a =>
    a.name.toLowerCase() === name.toLowerCase()
  ) || null
}
