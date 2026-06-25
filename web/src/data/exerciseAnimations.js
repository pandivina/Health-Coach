// AÑADIR al final de EXERCISE_ANIMATIONS en exerciseAnimations.js

// ── CALENTAMIENTO TITÁN ───────────────────────────────────────────────────
'warmup_movilidad_cadera': {
  name: 'Movilidad de cadera', fps: 700,
  frames: [
    `<g stroke="#F97316" stroke-width="4" stroke-linecap="round" fill="none">
      <circle cx="50" cy="30" r="10"/>
      <line x1="50" y1="40" x2="50" y2="95"/>
      <line x1="50" y1="60" x2="30" y2="75"/>
      <line x1="50" y1="60" x2="70" y2="75"/>
      <line x1="50" y1="95" x2="30" y2="140"/>
      <line x1="50" y1="95" x2="70" y2="140"/>
      <ellipse cx="50" cy="95" rx="18" ry="8" stroke-width="2" stroke-dasharray="4 3"/>
    </g>`,
    `<g stroke="#F97316" stroke-width="4" stroke-linecap="round" fill="none">
      <circle cx="50" cy="30" r="10"/>
      <line x1="50" y1="40" x2="50" y2="95"/>
      <line x1="50" y1="60" x2="30" y2="75"/>
      <line x1="50" y1="60" x2="70" y2="75"/>
      <line x1="50" y1="95" x2="28" y2="138"/>
      <line x1="50" y1="95" x2="72" y2="138"/>
      <ellipse cx="50" cy="95" rx="18" ry="8" stroke-width="2" stroke-dasharray="4 3" transform="rotate(30 50 95)"/>
    </g>`,
  ],
},
'warmup_puente_gluteos': {
  name: 'Puente de glúteos', fps: 900,
  frames: [
    `<g stroke="#F97316" stroke-width="4" stroke-linecap="round" fill="none">
      <circle cx="50" cy="80" r="10"/>
      <line x1="50" y1="90" x2="50" y2="125"/>
      <line x1="50" y1="105" x2="25" y2="118"/>
      <line x1="50" y1="105" x2="75" y2="118"/>
      <line x1="50" y1="125" x2="35" y2="155"/>
      <line x1="50" y1="125" x2="65" y2="155"/>
    </g>`,
    `<g stroke="#F97316" stroke-width="4" stroke-linecap="round" fill="none">
      <circle cx="50" cy="65" r="10"/>
      <line x1="50" y1="75" x2="50" y2="115"/>
      <line x1="50" y1="90" x2="20" y2="100"/>
      <line x1="50" y1="90" x2="80" y2="100"/>
      <line x1="50" y1="115" x2="35" y2="150"/>
      <line x1="50" y1="115" x2="65" y2="150"/>
    </g>`,
  ],
},
'warmup_cat_cow': {
  name: 'Cat-Cow (columna)', fps: 1000,
  frames: [
    `<g stroke="#F97316" stroke-width="4" stroke-linecap="round" fill="none">
      <circle cx="20" cy="65" r="10"/>
      <path d="M30 68 Q50 58 70 62 Q85 65 90 68" fill="none"/>
      <line x1="30" y1="68" x2="18" y2="100"/>
      <line x1="90" y1="68" x2="88" y2="100"/>
      <line x1="18" y1="100" x2="14" y2="130"/>
      <line x1="88" y1="100" x2="84" y2="130"/>
    </g>`,
    `<g stroke="#F97316" stroke-width="4" stroke-linecap="round" fill="none">
      <circle cx="20" cy="72" r="10"/>
      <path d="M30 75 Q50 88 70 84 Q85 80 90 75" fill="none"/>
      <line x1="30" y1="75" x2="18" y2="105"/>
      <line x1="90" y1="75" x2="88" y2="105"/>
      <line x1="18" y1="105" x2="14" y2="135"/>
      <line x1="88" y1="105" x2="84" y2="135"/>
    </g>`,
  ],
},
'warmup_sentadilla_corporal': {
  name: 'Sentadilla con peso corporal', fps: 800,
  frames: [
    `<g stroke="#2EC4B6" stroke-width="4" stroke-linecap="round" fill="none">
      <circle cx="50" cy="25" r="10"/>
      <line x1="50" y1="35" x2="50" y2="90"/>
      <line x1="50" y1="55" x2="30" y2="72"/>
      <line x1="50" y1="55" x2="70" y2="72"/>
      <line x1="50" y1="90" x2="38" y2="140"/>
      <line x1="50" y1="90" x2="62" y2="140"/>
    </g>`,
    `<g stroke="#2EC4B6" stroke-width="4" stroke-linecap="round" fill="none">
      <circle cx="50" cy="50" r="10"/>
      <line x1="50" y1="60" x2="50" y2="108"/>
      <line x1="50" y1="75" x2="22" y2="90"/>
      <line x1="50" y1="75" x2="78" y2="90"/>
      <line x1="50" y1="108" x2="30" y2="140"/>
      <line x1="50" y1="108" x2="70" y2="140"/>
    </g>`,
  ],
},

// ── ESTIRAMIENTOS TITÁN ───────────────────────────────────────────────────
'stretch_pectoral': {
  name: 'Estiramiento de pectoral', fps: 1500,
  frames: [
    `<g stroke="#F97316" stroke-width="4" stroke-linecap="round" fill="none">
      <circle cx="50" cy="28" r="10"/>
      <line x1="50" y1="38" x2="50" y2="95"/>
      <line x1="50" y1="55" x2="15" y2="62"/>
      <line x1="50" y1="55" x2="85" y2="62"/>
      <line x1="50" y1="95" x2="38" y2="145"/>
      <line x1="50" y1="95" x2="62" y2="145"/>
    </g>`,
    `<g stroke="#F97316" stroke-width="4" stroke-linecap="round" fill="none">
      <circle cx="50" cy="28" r="10"/>
      <line x1="50" y1="38" x2="50" y2="95"/>
      <line x1="50" y1="55" x2="12" y2="55"/>
      <line x1="50" y1="55" x2="88" y2="55"/>
      <line x1="50" y1="95" x2="38" y2="145"/>
      <line x1="50" y1="95" x2="62" y2="145"/>
    </g>`,
  ],
},
'stretch_cuadriceps': {
  name: 'Flexión de cuádriceps', fps: 1500,
  frames: [
    `<g stroke="#F97316" stroke-width="4" stroke-linecap="round" fill="none">
      <circle cx="50" cy="28" r="10"/>
      <line x1="50" y1="38" x2="50" y2="90"/>
      <line x1="50" y1="58" x2="30" y2="70"/>
      <line x1="50" y1="58" x2="70" y2="70"/>
      <line x1="50" y1="90" x2="38" y2="140"/>
      <line x1="50" y1="90" x2="65" y2="80"/>
      <line x1="65" y1="80" x2="65" y2="112"/>
    </g>`,
    `<g stroke="#F97316" stroke-width="4" stroke-linecap="round" fill="none">
      <circle cx="50" cy="28" r="10"/>
      <line x1="50" y1="38" x2="50" y2="90"/>
      <line x1="50" y1="58" x2="30" y2="70"/>
      <line x1="50" y1="58" x2="70" y2="70"/>
      <line x1="50" y1="90" x2="38" y2="140"/>
      <line x1="50" y1="90" x2="68" y2="78"/>
      <line x1="68" y1="78" x2="70" y2="108"/>
    </g>`,
  ],
},
'stretch_espalda_baja': {
  name: 'Estiramiento de espalda baja', fps: 1500,
  frames: [
    `<g stroke="#F97316" stroke-width="4" stroke-linecap="round" fill="none">
      <circle cx="50" cy="75" r="10"/>
      <line x1="50" y1="85" x2="50" y2="120"/>
      <line x1="50" y1="100" x2="25" y2="112"/>
      <line x1="50" y1="100" x2="75" y2="112"/>
      <line x1="50" y1="120" x2="35" y2="150"/>
      <line x1="50" y1="120" x2="65" y2="150"/>
    </g>`,
    `<g stroke="#F97316" stroke-width="4" stroke-linecap="round" fill="none">
      <circle cx="50" cy="72" r="10"/>
      <path d="M50 82 Q35 100 50 118 Q65 100 50 82" fill="none"/>
      <line x1="50" y1="118" x2="35" y2="150"/>
      <line x1="50" y1="118" x2="65" y2="150"/>
      <line x1="50" y1="95" x2="22" y2="100"/>
      <line x1="50" y1="95" x2="78" y2="100"/>
    </g>`,
  ],
},

// ── CALENTAMIENTO GUERRERO ────────────────────────────────────────────────
'warmup_rodillas_pecho': {
  name: 'Rodillas al pecho (trot)', fps: 400,
  frames: [
    `<g stroke="#0EA5E9" stroke-width="4" stroke-linecap="round" fill="none">
      <circle cx="50" cy="22" r="10"/>
      <line x1="50" y1="32" x2="50" y2="88"/>
      <line x1="50" y1="52" x2="30" y2="68"/>
      <line x1="50" y1="52" x2="70" y2="68"/>
      <line x1="50" y1="88" x2="38" y2="140"/>
      <line x1="50" y1="88" x2="62" y2="65"/>
      <line x1="62" y1="65" x2="62" y2="88"/>
    </g>`,
    `<g stroke="#0EA5E9" stroke-width="4" stroke-linecap="round" fill="none">
      <circle cx="50" cy="22" r="10"/>
      <line x1="50" y1="32" x2="50" y2="88"/>
      <line x1="50" y1="52" x2="30" y2="68"/>
      <line x1="50" y1="52" x2="70" y2="68"/>
      <line x1="50" y1="88" x2="38" y2="65"/>
      <line x1="38" y1="65" x2="38" y2="88"/>
      <line x1="50" y1="88" x2="62" y2="140"/>
    </g>`,
  ],
},
'warmup_skipping': {
  name: 'Skipping lateral', fps: 400,
  frames: [
    `<g stroke="#0EA5E9" stroke-width="4" stroke-linecap="round" fill="none">
      <circle cx="50" cy="25" r="10"/>
      <line x1="50" y1="35" x2="50" y2="90"/>
      <line x1="50" y1="52" x2="28" y2="68"/>
      <line x1="50" y1="52" x2="72" y2="52"/>
      <line x1="50" y1="90" x2="30" y2="140"/>
      <line x1="50" y1="90" x2="68" y2="125"/>
    </g>`,
    `<g stroke="#0EA5E9" stroke-width="4" stroke-linecap="round" fill="none">
      <circle cx="50" cy="25" r="10"/>
      <line x1="50" y1="35" x2="50" y2="90"/>
      <line x1="50" y1="52" x2="28" y2="52"/>
      <line x1="50" y1="52" x2="72" y2="68"/>
      <line x1="50" y1="90" x2="32" y2="125"/>
      <line x1="50" y1="90" x2="70" y2="140"/>
    </g>`,
  ],
},
'stretch_isquios': {
  name: 'Estiramiento de isquios', fps: 1500,
  frames: [
    `<g stroke="#0EA5E9" stroke-width="4" stroke-linecap="round" fill="none">
      <circle cx="50" cy="60" r="10"/>
      <line x1="50" y1="70" x2="50" y2="105"/>
      <line x1="50" y1="85" x2="28" y2="95"/>
      <line x1="50" y1="85" x2="72" y2="95"/>
      <line x1="50" y1="105" x2="25" y2="105"/>
      <line x1="50" y1="105" x2="75" y2="105"/>
      <line x1="25" y1="105" x2="25" y2="155"/>
      <line x1="75" y1="105" x2="75" y2="155"/>
    </g>`,
    `<g stroke="#0EA5E9" stroke-width="4" stroke-linecap="round" fill="none">
      <circle cx="50" cy="65" r="10"/>
      <line x1="50" y1="75" x2="50" y2="108"/>
      <line x1="50" y1="88" x2="22" y2="95"/>
      <line x1="50" y1="88" x2="78" y2="95"/>
      <line x1="50" y1="108" x2="25" y2="108"/>
      <line x1="50" y1="108" x2="75" y2="108"/>
      <line x1="25" y1="108" x2="25" y2="155"/>
      <line x1="75" y1="108" x2="75" y2="155"/>
    </g>`,
  ],
},
'stretch_gemelos': {
  name: 'Estiramiento de gemelos', fps: 1500,
  frames: [
    `<g stroke="#0EA5E9" stroke-width="4" stroke-linecap="round" fill="none">
      <circle cx="50" cy="28" r="10"/>
      <line x1="50" y1="38" x2="50" y2="92"/>
      <line x1="50" y1="58" x2="30" y2="72"/>
      <line x1="50" y1="58" x2="70" y2="72"/>
      <line x1="50" y1="92" x2="30" y2="145"/>
      <line x1="50" y1="92" x2="68" y2="130"/>
      <line x1="68" y1="130" x2="68" y2="155"/>
    </g>`,
    `<g stroke="#0EA5E9" stroke-width="4" stroke-linecap="round" fill="none">
      <circle cx="50" cy="28" r="10"/>
      <line x1="50" y1="38" x2="50" y2="92"/>
      <line x1="50" y1="58" x2="30" y2="72"/>
      <line x1="50" y1="58" x2="70" y2="72"/>
      <line x1="50" y1="92" x2="32" y2="130"/>
      <line x1="32" y1="130" x2="32" y2="155"/>
      <line x1="50" y1="92" x2="70" y2="145"/>
    </g>`,
  ],
},

// ── ZEN ───────────────────────────────────────────────────────────────────
'z_pranayama': {
  name: 'Respiración Pranayama', fps: 2000,
  frames: [
    `<g stroke="#6EE7B7" stroke-width="4" stroke-linecap="round" fill="none">
      <circle cx="50" cy="30" r="10"/>
      <line x1="50" y1="40" x2="50" y2="95"/>
      <line x1="50" y1="60" x2="32" y2="82"/>
      <line x1="50" y1="60" x2="68" y2="82"/>
      <line x1="50" y1="95" x2="35" y2="140"/>
      <line x1="50" y1="95" x2="65" y2="140"/>
      <circle cx="50" cy="68" r="6" stroke-width="2" opacity="0.5"/>
    </g>`,
    `<g stroke="#6EE7B7" stroke-width="4" stroke-linecap="round" fill="none">
      <circle cx="50" cy="30" r="10"/>
      <line x1="50" y1="40" x2="50" y2="95"/>
      <line x1="50" y1="60" x2="32" y2="82"/>
      <line x1="50" y1="60" x2="68" y2="82"/>
      <line x1="50" y1="95" x2="35" y2="140"/>
      <line x1="50" y1="95" x2="65" y2="140"/>
      <circle cx="50" cy="68" r="12" stroke-width="2" opacity="0.5"/>
    </g>`,
  ],
},
'z_saludo_sol': {
  name: 'Saludo al sol suave', fps: 1200,
  frames: [
    `<g stroke="#6EE7B7" stroke-width="4" stroke-linecap="round" fill="none">
      <circle cx="50" cy="28" r="10"/>
      <line x1="50" y1="38" x2="50" y2="92"/>
      <line x1="50" y1="55" x2="50" y2="25"/>
      <line x1="50" y1="25" x2="40" y2="35"/>
      <line x1="50" y1="25" x2="60" y2="35"/>
      <line x1="50" y1="92" x2="38" y2="145"/>
      <line x1="50" y1="92" x2="62" y2="145"/>
    </g>`,
    `<g stroke="#6EE7B7" stroke-width="4" stroke-linecap="round" fill="none">
      <circle cx="50" cy="55" r="10"/>
      <line x1="50" y1="65" x2="50" y2="110"/>
      <line x1="50" y1="80" x2="18" y2="60"/>
      <line x1="50" y1="80" x2="82" y2="60"/>
      <line x1="50" y1="110" x2="30" y2="155"/>
      <line x1="50" y1="110" x2="70" y2="155"/>
    </g>`,
  ],
},
'z_postura_nino': {
  name: 'Postura del niño (Balasana)', fps: 2000,
  frames: [
    `<g stroke="#6EE7B7" stroke-width="4" stroke-linecap="round" fill="none">
      <circle cx="30" cy="95" r="8"/>
      <line x1="30" y1="103" x2="50" y2="115"/>
      <line x1="50" y1="115" x2="75" y2="112"/>
      <line x1="50" y1="115" x2="45" y2="148"/>
      <line x1="45" y1="148" x2="35" y2="155"/>
      <line x1="45" y1="148" x2="55" y2="155"/>
      <line x1="30" y1="103" x2="20" y2="118"/>
      <line x1="20" y1="118" x2="25" y2="122"/>
    </g>`,
    `<g stroke="#6EE7B7" stroke-width="4" stroke-linecap="round" fill="none">
      <circle cx="28" cy="98" r="8"/>
      <line x1="28" y1="106" x2="52" y2="118"/>
      <line x1="52" y1="118" x2="78" y2="115"/>
      <line x1="52" y1="118" x2="48" y2="148"/>
      <line x1="48" y1="148" x2="38" y2="155"/>
      <line x1="48" y1="148" x2="58" y2="155"/>
      <line x1="28" y1="106" x2="18" y2="120"/>
      <line x1="18" y1="120" x2="22" y2="125"/>
    </g>`,
  ],
},
'z_mariposa': {
  name: 'Mariposa sentada', fps: 1500,
  frames: [
    `<g stroke="#6EE7B7" stroke-width="4" stroke-linecap="round" fill="none">
      <circle cx="50" cy="35" r="10"/>
      <line x1="50" y1="45" x2="50" y2="95"/>
      <line x1="50" y1="65" x2="30" y2="78"/>
      <line x1="50" y1="65" x2="70" y2="78"/>
      <line x1="50" y1="95" x2="22" y2="115"/>
      <line x1="50" y1="95" x2="78" y2="115"/>
      <line x1="22" y1="115" x2="50" y2="120"/>
      <line x1="78" y1="115" x2="50" y2="120"/>
    </g>`,
    `<g stroke="#6EE7B7" stroke-width="4" stroke-linecap="round" fill="none">
      <circle cx="50" cy="38" r="10"/>
      <line x1="50" y1="48" x2="50" y2="98"/>
      <line x1="50" y1="68" x2="30" y2="80"/>
      <line x1="50" y1="68" x2="70" y2="80"/>
      <line x1="50" y1="98" x2="20" y2="112"/>
      <line x1="50" y1="98" x2="80" y2="112"/>
      <line x1="20" y1="112" x2="50" y2="125"/>
      <line x1="80" y1="112" x2="50" y2="125"/>
    </g>`,
  ],
},
'z_savasana': {
  name: 'Savasana (relajación)', fps: 3000,
  frames: [
    `<g stroke="#6EE7B7" stroke-width="4" stroke-linecap="round" fill="none">
      <circle cx="50" cy="80" r="10"/>
      <line x1="50" y1="90" x2="50" y2="130"/>
      <line x1="50" y1="108" x2="20" y2="118"/>
      <line x1="50" y1="108" x2="80" y2="118"/>
      <line x1="50" y1="130" x2="32" y2="162"/>
      <line x1="50" y1="130" x2="68" y2="162"/>
    </g>`,
    `<g stroke="#6EE7B7" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.7">
      <circle cx="50" cy="80" r="10"/>
      <line x1="50" y1="90" x2="50" y2="130"/>
      <line x1="50" y1="108" x2="20" y2="118"/>
      <line x1="50" y1="108" x2="80" y2="118"/>
      <line x1="50" y1="130" x2="32" y2="162"/>
      <line x1="50" y1="130" x2="68" y2="162"/>
      <circle cx="50" cy="80" r="20" stroke-width="1" stroke-dasharray="3 4" opacity="0.4"/>
    </g>`,
  ],
},
