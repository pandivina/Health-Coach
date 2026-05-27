// ============================================================
// HEALTH COACH — Sistema de Temas
// Cada tema define tokens de color completos
// ============================================================

export const THEMES = {

  // ── FREE THEMES ──────────────────────────────────────────

  'panda-serenity': {
    id: 'panda-serenity',
    name: 'Panda Serenity',
    description: 'Blanco limpio, turquesa y rosa suave',
    emoji: '🐼',
    pet: 'panda',
    free: true,
    dark: false,
    preview: ['#FFFFFF', '#2EC4B6', '#FF8FA3'],

    bg:       '#FFFFFF',
    surface:  '#F5F7FA',
    surface2: '#EEF1F5',
    surface3: '#E4E9EF',

    primary:   '#2EC4B6',
    secondary: '#F7CAD0',
    accent:    '#FF8FA3',

    // Texto: Ajustados grises para legibilidad UI en tarjetas
    text:      '#1F2937',
    textMuted: '#4B5563', // Antes #6B7280 (Ahora Slate-600, ideal para subtítulos)
    textLight: '#6B7280', // Antes #9CA3AF (Suficiente contraste sobre fondos claros)

    border:    '#E5E7EB',
    borderFocus: '#2EC4B6',

    success: '#10B981',
    warning: '#F59E0B',
    error:   '#EF4444',
    info:    '#3B82F6',

    gradientBrand: 'linear-gradient(135deg, #2EC4B6, #FF8FA3)',
    gradientHero:  'linear-gradient(135deg, #f0fffe, #fff0f3)',

    shadow: '0 4px 24px rgba(46, 196, 182, 0.12)',
    shadowCard: '0 2px 12px rgba(0, 0, 0, 0.06)',

    navBg:      'rgba(255,255,255,0.95)',
    navBorder:  '#E5E7EB',
    navText:    '#6B7280', // CORRECCIÓN: Antes #9CA3AF. Ahora los iconos inactivos se ven perfectos.
    navActive:  '#2EC4B6',
  },

  'midnight-focus': {
    id: 'midnight-focus',
    name: 'Midnight Focus',
    description: 'Oscuro elegante — el original',
    emoji: '🌑',
    pet: null,
    free: true,
    dark: true,
    preview: ['#0a0a12', '#6366f1', '#f97316'],

    bg:       '#0a0a12',
    surface:  '#0e0e1a',
    surface2: '#161628',
    surface3: '#1e1e35',

    primary:   '#6366f1',
    secondary: '#f97316',
    accent:    '#6366f1',

    text:      '#f0f0ff',
    textMuted: '#9CA3AF', // Más claro para resaltar en fondo oscuro
    textLight: '#6B7280',

    border:    'rgba(255,255,255,0.08)',
    borderFocus: '#6366f1',

    success: '#22c55e',
    warning: '#f59e0b',
    error:   '#ef4444',
    info:    '#3b82f6',

    gradientBrand: 'linear-gradient(135deg, #f97316, #6366f1)',
    gradientHero:  'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(249,115,22,0.05))',

    shadow: '0 4px 24px rgba(99, 102, 241, 0.15)',
    shadowCard: '0 2px 12px rgba(0, 0, 0, 0.3)',

    navBg:     'rgba(14,14,26,0.95)',
    navBorder: 'rgba(255,255,255,0.05)',
    navText:   'rgba(255,255,255,0.55)', // CORRECCIÓN: Subido el contraste en modo oscuro
    navActive: '#6366f1',
  },

  'forest-balance': {
    id: 'forest-balance',
    name: 'Forest Balance',
    description: 'Verdes naturales y tierra',
    emoji: '🌿',
    pet: null,
    free: true,
    dark: false,
    preview: ['#F0FDF4', '#16A34A', '#65A30D'],

    bg:       '#F0FDF4',
    surface:  '#DCFCE7',
    surface2: '#BBF7D0',
    surface3: '#86EFAC',

    primary:   '#16A34A',
    secondary: '#65A30D',
    accent:    '#15803D',

    text:      '#14532D',
    textMuted: '#3B6043', // Un poco más oscuro para que resalte en el fondo verde pastel
    textLight: '#4B7C59', 

    border:    '#BBF7D0',
    borderFocus: '#16A34A',

    success: '#16A34A',
    warning: '#CA8A04',
    error:   '#DC2626',
    info:    '#0284C7',

    gradientBrand: 'linear-gradient(135deg, #16A34A, #65A30D)',
    gradientHero:  'linear-gradient(135deg, #f0fdf4, #ecfdf5)',

    shadow: '0 4px 24px rgba(22, 163, 74, 0.15)',
    shadowCard: '0 2px 12px rgba(0, 0, 0, 0.06)',

    navBg:     'rgba(240,253,244,0.95)',
    navBorder: '#BBF7D0',
    navText:   '#4B7C59',
    navActive: '#16A34A',
  },

  // ── PREMIUM THEMES ───────────────────────────────────────

  'fox-energy': {
    id: 'fox-energy',
    name: 'Fox Energy',
    description: 'Naranja, ámbar y crema cálida',
    emoji: '🦊',
    pet: 'fox',
    free: false,
    dark: false,
    preview: ['#FFFBF5', '#F97316', '#FFC947'],

    bg:       '#FFFBF5',
    surface:  '#FFF3E0',
    surface2: '#FFE5C4',
    surface3: '#FFD4A0',

    primary:   '#F97316',
    secondary: '#FFC947',
    accent:    '#EA6B00',

    text:      '#1C1208',
    textMuted: '#5C4733', // Optimizado contraste
    textLight: '#78614A',

    border:    '#FFD5A8',
    borderFocus: '#F97316',

    success: '#65A30D',
    warning: '#F59E0B',
    error:   '#DC2626',
    info:    '#0284C7',

    gradientBrand: 'linear-gradient(135deg, #F97316, #FFC947)',
    gradientHero:  'linear-gradient(135deg, #fffbf5, #fff8ee)',

    shadow: '0 4px 24px rgba(249, 115, 22, 0.2)',
    shadowCard: '0 2px 12px rgba(0, 0, 0, 0.06)',

    navBg:     'rgba(255,251,245,0.95)',
    navBorder: '#FFD5A8',
    navText:   '#78614A', // CORRECCIÓN
    navActive: '#F97316',
  },

  'cat-dream': {
    id: 'cat-dream',
    name: 'Cat Dream',
    description: 'Lavanda suave y rosa místico',
    emoji: '🐱',
    pet: 'cat',
    free: false,
    dark: false,
    preview: ['#FAF5FF', '#9333EA', '#EC4899'],

    bg:       '#FAF5FF',
    surface:  '#F3E8FF',
    surface2: '#E9D5FF',
    surface3: '#D8B4FE',

    primary:   '#9333EA',
    secondary: '#EC4899',
    accent:    '#A855F7',

    text:      '#1E0540',
    textMuted: '#51376B', // Optimizado contraste
    textLight: '#6B4E8C',

    border:    '#E9D5FF',
    borderFocus: '#9333EA',

    success: '#16A34A',
    warning: '#D97706',
    error:   '#DC2626',
    info:    '#7C3AED',

    gradientBrand: 'linear-gradient(135deg, #9333EA, #EC4899)',
    gradientHero:  'linear-gradient(135deg, #faf5ff, #fdf2f8)',

    shadow: '0 4px 24px rgba(147, 51, 234, 0.18)',
    shadowCard: '0 2px 12px rgba(0, 0, 0, 0.06)',

    navBg:     'rgba(250,245,255,0.95)',
    navBorder: '#E9D5FF',
    navText:   '#6B4E8C', // CORRECCIÓN
    navActive: '#9333EA',
  },

  'dog-comfort': {
    id: 'dog-comfort',
    name: 'Dog Comfort',
    description: 'Azul cielo y beige acogedor',
    emoji: '🐶',
    pet: 'dog',
    free: false,
    dark: false,
    preview: ['#F0F9FF', '#0EA5E9', '#D4A574'],

    bg:       '#F0F9FF',
    surface:  '#E0F2FE',
    surface2: '#BAE6FD',
    surface3: '#7DD3FC',

    primary:   '#0EA5E9',
    secondary: '#D4A574',
    accent:    '#0284C7',

    text:      '#0C2340',
    textMuted: '#335270', // Optimizado contraste
    textLight: '#4A7090',

    border:    '#BAE6FD',
    borderFocus: '#0EA5E9',

    success: '#16A34A',
    warning: '#D97706',
    error:   '#DC2626',
    info:    '#0EA5E9',

    gradientBrand: 'linear-gradient(135deg, #0EA5E9, #D4A574)',
    gradientHero:  'linear-gradient(135deg, #f0f9ff, #fef9f0)',

    shadow: '0 4px 24px rgba(14, 165, 233, 0.18)',
    shadowCard: '0 2px 12px rgba(0, 0, 0, 0.06)',

    navBg:     'rgba(240,249,255,0.95)',
    navBorder: '#BAE6FD',
    navText:   '#4A7090', // CORRECCIÓN
    navActive: '#0EA5E9',
  },

  'bunny-fresh': {
    id: 'bunny-fresh',
    name: 'Bunny Fresh',
    description: 'Verde menta y marfil fresco',
    emoji: '🐰',
    pet: 'rabbit',
    free: false,
    dark: false,
    preview: ['#F0FFF8', '#10B981', '#FFFBEB'],

    bg:       '#F0FFF8',
    surface:  '#CCFBF1',
    surface2: '#99F6E4',
    surface3: '#5EEAD4',

    primary:   '#10B981',
    secondary: '#34D399',
    accent:    '#059669',

    text:      '#022C22',
    textMuted: '#1A4D35', // Optimizado contraste
    textLight: '#2D6A4F',

    border:    '#99F6E4',
    borderFocus: '#10B981',

    success: '#10B981',
    warning: '#F59E0B',
    error:   '#EF4444',
    info:    '#0EA5E9',

    gradientBrand: 'linear-gradient(135deg, #10B981, #34D399)',
    gradientHero:  'linear-gradient(135deg, #f0fff8, #f7fff5)',

    shadow: '0 4px 24px rgba(16, 185, 129, 0.18)',
    shadowCard: '0 2px 12px rgba(0, 0, 0, 0.06)',

    navBg:     'rgba(240,255,248,0.95)',
    navBorder: '#99F6E4',
    navText:   '#2D6A4F', // CORRECCIÓN
    navActive: '#10B981',
  },

  'sunset-energy': {
    id: 'sunset-energy',
    name: 'Sunset Energy',
    description: 'Corales cálidos y dorado vibrante',
    emoji: '🌅',
    pet: null,
    free: false,
    dark: false,
    preview: ['#FFF7F0', '#F43F5E', '#F97316'],

    bg:       '#FFF7F0',
    surface:  '#FFF1E6',
    surface2: '#FFE0CC',
    surface3: '#FFCBAD',

    primary:   '#F43F5E',
    secondary: '#F97316',
    accent:    '#E11D48',

    text:      '#2D0A14',
    textMuted: '#6B303C', // Optimizado contraste
    textLight: '#8B4553',

    border:    '#FFD5C0',
    borderFocus: '#F43F5E',

    success: '#16A34A',
    warning: '#D97706',
    error:   '#DC2626',
    info:      '#0284C7',

    gradientBrand: 'linear-gradient(135deg, #F43F5E, #F97316)',
    gradientHero:  'linear-gradient(135deg, #fff7f0, #fff0f3)',

    shadow: '0 4px 24px rgba(244, 63, 94, 0.2)',
    shadowCard: '0 2px 12px rgba(0, 0, 0, 0.06)',

    navBg:     'rgba(255,247,240,0.95)',
    navBorder: '#FFD5C0',
    navText:   '#8B4553', // CORRECCIÓN
    navActive: '#F43F5E',
  },

  'lavender-dream': {
    id: 'lavender-dream',
    name: 'Lavender Dream',
    description: 'Lilas delicados y rosas pastel',
    emoji: '💜',
    pet: null,
    free: false,
    dark: false,
    preview: ['#FDF4FF', '#C026D3', '#F9A8D4'],

    bg:       '#FDF4FF',
    surface:  '#FAE8FF',
    surface2: '#F5D0FE',
    surface3: '#F0ABFC',

    primary:   '#C026D3',
    secondary: '#F9A8D4',
    accent:    '#A21CAF',

    text:      '#2D0038',
    textMuted: '#5C2569', // Optimizado contraste
    textLight: '#7C3A8C',

    border:    '#F5D0FE',
    borderFocus: '#C026D3',

    success: '#16A34A',
    warning: '#D97706',
    error:   '#DC2626',
    info:    '#7C3AED',

    gradientBrand: 'linear-gradient(135deg, #C026D3, #F9A8D4)',
    gradientHero:  'linear-gradient(135deg, #fdf4ff, #fdf2f8)',

    shadow: '0 4px 24px rgba(192, 38, 211, 0.18)',
    shadowCard: '0 2px 12px rgba(0, 0, 0, 0.06)',

    navBg:     'rgba(253,244,255,0.95)',
    navBorder: '#F5D0FE',
    navText:   '#7C3A8C', // CORRECCIÓN
    navActive: '#C026D3',
  },

  'panda-noir': {
    id: 'panda-noir',
    name: 'Panda Noir',
    description: 'Negro mate con turquesa y rosa',
    emoji: '🖤',
    pet: null,
    free: false,
    dark: true,
    preview: ['#0A0A0A', '#2EC4B6', '#FF8FA3'],

    bg:       '#0A0A0A',
    surface:  '#141414',
    surface2: '#1E1E1E',
    surface3: '#2A2A2A',

    primary:   '#2EC4B6',
    secondary: '#FF8FA3',
    accent:    '#2EC4B6',

    text:      '#F5F5F5',
    textMuted: '#A3A3A3', // Un poco más claro sobre fondo negro puro
    textLight: '#737373',

    border:    'rgba(255,255,255,0.08)',
    borderFocus: '#2EC4B6',

    success: '#2EC4B6',
    warning: '#F59E0B',
    error:   '#FF8FA3',
    info:    '#2EC4B6',

    gradientBrand: 'linear-gradient(135deg, #2EC4B6, #FF8FA3)',
    gradientHero:  'linear-gradient(135deg, rgba(46,196,182,0.1), rgba(255,143,163,0.05))',

    shadow: '0 4px 24px rgba(46, 196, 182, 0.2)',
    shadowCard: '0 2px 12px rgba(0, 0, 0, 0.5)',

    navBg:     'rgba(10,10,10,0.95)',
    navBorder: 'rgba(255,255,255,0.08)',
    navText:   '#737373', // CORRECCIÓN: Antes #555555 (Invisibles en oscuridad)
    navActive: '#2EC4B6',
  },
}

// Mapa mascota → tema
export const PET_THEME_MAP = {
  panda:  'panda-serenity',
  fox:    'fox-energy',
  cat:    'cat-dream',
  dog:    'dog-comfort',
  rabbit: 'bunny-fresh',
}

// Tema por defecto — ¡CORREGIDO: Ahora con export explícito!
export const DEFAULT_THEME = 'panda-serenity'

// Obtener tema por id (con fallback)
export function getTheme(id) {
  return THEMES[id] || THEMES[DEFAULT_THEME]
}

// Aplicar tema al DOM (CSS variables en :root)
export function applyTheme(theme) {
  const root = document.documentElement
  const t = typeof theme === 'string' ? getTheme(theme) : theme

  root.setAttribute('data-theme', t.id)
  root.setAttribute('data-dark', t.dark ? 'true' : 'false')

  const vars = {
    '--color-bg':           t.bg,
    '--color-surface':      t.surface,
    '--color-surface-2':    t.surface2,
    '--color-surface-3':    t.surface3,
    '--color-primary':      t.primary,
    '--color-secondary':    t.secondary,
    '--color-accent':       t.accent,
    '--color-text':         t.text,
    '--color-text-muted':   t.textMuted,
    '--color-text-light':   t.textLight,
    '--color-border':       t.border,
    '--color-border-focus': t.borderFocus,
    '--color-success':      t.success,
    '--color-warning':      t.warning,
    '--color-error':        t.error,
    '--color-info':         t.info,
    '--gradient-brand':      t.gradientBrand,
    '--gradient-hero':       t.gradientHero,
    '--shadow-card':         t.shadowCard,
    '--shadow-primary':      t.shadow,
    '--color-nav-bg':        t.navBg,
    '--color-nav-border':    t.navBorder,
    '--color-nav-text':      t.navText,
    '--color-nav-active':    t.navActive,
  }

  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v))
}
