// ============================================================
// HEALTH COACH — Definición de todos los tours guiados
// ============================================================

const PET_EMOJI = {
  panda:  '🐼',
  cat:    '🐱',
  dog:    '🐶',
  fox:    '🦊',
  rabbit: '🐰',
}

export function getPetEmoji(petType) {
  return PET_EMOJI[petType] || '🐼'
}

export function getTourSteps(tourKey, { userName = 'campeón', petName = 'Pandi', petType = 'panda' } = {}) {
  const pet = getPetEmoji(petType)

  const tours = {

    // ── HOME ──────────────────────────────────────────────
    home: [
      {
        id: 'home-welcome',
        target: null,
        position: 'center',
        mascotAnim: 'wave',
        title: `¡Hola, ${userName}! 👋`,
        message: `Soy ${petName} ${pet} y seré tu compañero de salud cada día. Déjame mostrarte cómo sacar el máximo partido a Health Coach.`,
      },
      {
        id: 'home-pet',
        target: '[data-tour="home-pet"]',
        position: 'bottom',
        mascotAnim: 'point',
        title: 'Tu mascota 🐾',
        message: `Este soy yo, ${petName}. Tócame para ver mis accesorios, cambiar mi apariencia y personalizar los colores de la app.`,
      },
      {
        id: 'home-progress',
        target: '[data-tour="home-progress"]',
        position: 'bottom',
        mascotAnim: 'happy',
        title: 'Progreso de hoy 🎯',
        message: `Estos anillos muestran tus calorías consumidas, proteína y calorías quemadas. El objetivo es llenarlos cada día.`,
      },
      {
        id: 'home-quicklinks',
        target: '[data-tour="home-quicklinks"]',
        position: 'top',
        mascotAnim: 'point',
        title: 'Accesos rápidos ⚡',
        message: `Desde aquí accedes a Agua, Recetas, Sueño y Ánimo con un solo toque. Todo lo que necesitas al alcance.`,
      },
      {
        id: 'home-coach',
        target: '[data-tour="home-coach"]',
        position: 'top',
        mascotAnim: 'happy',
        title: 'Coach IA 🤖',
        message: `Tu coach conoce tu perfil clínico completo: analíticas, tratamientos, peso y horarios. Pregúntale lo que quieras.`,
      },
      {
        id: 'home-nav',
        target: '[data-tour="bottom-nav"]',
        position: 'top',
        mascotAnim: 'point',
        title: 'Navegación 🧭',
        message: `Desde aquí accedes a Nutrición, Entrena, Tu Día y más. Cada módulo está conectado para darte una visión completa.`,
      },
      {
        id: 'home-finish',
        target: null,
        position: 'center',
        mascotAnim: 'celebrate',
        title: `¡Listo, ${userName}! 🎉`,
        message: `Ya conoces el Home. Explora cada sección y recuerda: puedo mostrarte cómo funciona cualquier parte cuando quieras.`,
      },
    ],

    // ── NUTRICIÓN ─────────────────────────────────────────
    nutrition: [
      {
        id: 'nutrition-welcome',
        target: null,
        position: 'center',
        mascotAnim: 'wave',
        title: 'Módulo de Nutrición 🍎',
        message: `¡Hola ${userName}! Este es el hub de nutrición. Tiene 6 secciones y es uno de los módulos más potentes de la app.`,
      },
      {
        id: 'nutrition-tabs',
        target: '[data-tour="nutrition-tabs"]',
        position: 'bottom',
        mascotAnim: 'point',
        title: 'Pestañas de nutrición',
        message: `Aquí tienes: Diario, Foto, Código de barras, Despensa, Recetas y Tendencias. Vamos a ver las más importantes.`,
      },
      {
        id: 'nutrition-diary',
        target: '[data-tour="nutrition-diary"]',
        position: 'bottom',
        mascotAnim: 'happy',
        title: 'Diario nutricional 📖',
        message: `Registra cada comida del día y ve tus calorías, proteína, carbos y grasa en tiempo real. El anillo muestra tu progreso.`,
      },
      {
        id: 'nutrition-library',
        target: '[data-tour="nutrition-add"]',
        position: 'bottom',
        mascotAnim: 'point',
        title: 'Biblioteca de alimentos 🔍',
        message: `Toca el botón + o "Añadir" para buscar en más de 3 millones de alimentos. Busca por nombre, elige la cantidad en gramos y los macros se calculan solos. Los alimentos que uses más aparecerán como recientes.`,
      },
      {
        id: 'nutrition-photo',
        target: '[data-tour="nutrition-photo"]',
        position: 'bottom',
        mascotAnim: 'point',
        title: 'Análisis por foto 📸',
        message: `Haz una foto de tu plato y la IA analiza automáticamente los nutrientes. No necesitas buscar nada manualmente.`,
      },
      {
        id: 'nutrition-scan',
        target: '[data-tour="nutrition-scan"]',
        position: 'bottom',
        mascotAnim: 'point',
        title: 'Escáner de código 📦',
        message: `Escanea el código de barras de cualquier producto. Consulta directamente la base de datos de Open Food Facts, elige la cantidad en gramos y listo.`,
      },
      {
        id: 'nutrition-pantry',
        target: '[data-tour="nutrition-pantry"]',
        position: 'bottom',
        mascotAnim: 'happy',
        title: 'Tu despensa 🛒',
        message: `Registra los ingredientes que tienes en casa. Puedes añadirlos manualmente o subiendo una foto del ticket de compra.`,
      },
      {
        id: 'nutrition-recipes',
        target: '[data-tour="nutrition-recipes"]',
        position: 'bottom',
        mascotAnim: 'celebrate',
        title: 'Recetas personalizadas 🍳',
        message: `Genero recetas basadas en tus ingredientes disponibles, tus calorías restantes y tus objetivos nutricionales del día.`,
      },
    ],

    // ── ENTRENAMIENTO ─────────────────────────────────────
    workout: [
      {
        id: 'workout-welcome',
        target: null,
        position: 'center',
        mascotAnim: 'wave',
        title: 'Módulo de Entrenamiento 💪',
        message: `¡Aquí es donde te pones fuerte, ${userName}! Tengo rutinas generadas por IA, seguimiento de pesos y mucho más.`,
      },
      {
        id: 'workout-generate',
        target: '[data-tour="workout-generate"]',
        position: 'bottom',
        mascotAnim: 'point',
        title: 'Genera tu rutina 🤖',
        message: `La IA crea una rutina personalizada según tu nivel, objetivos y los días que quieras entrenar. Lleva solo un segundo.`,
      },
      {
        id: 'workout-live',
        target: '[data-tour="workout-live"]',
        position: 'bottom',
        mascotAnim: 'happy',
        title: 'Entreno en vivo ⏱️',
        message: `Durante el entreno puedes registrar series, pesos y repeticiones. Hay un timer de descanso automático entre series.`,
      },
      {
        id: 'workout-exercises',
        target: '[data-tour="workout-exercises"]',
        position: 'bottom',
        mascotAnim: 'point',
        title: 'Biblioteca de ejercicios 📚',
        message: `Más de 37 ejercicios con instrucciones detalladas, agrupados por músculo. Puedes añadir cualquiera a tu rutina.`,
      },
      {
        id: 'workout-records',
        target: '[data-tour="workout-records"]',
        position: 'top',
        mascotAnim: 'celebrate',
        title: 'Récords personales 🏆',
        message: `Cada vez que superas tu marca en un ejercicio, ¡lo celebramos! Los PRs se guardan automáticamente.`,
      },
      {
        id: 'workout-stats',
        target: '[data-tour="workout-stats"]',
        position: 'top',
        mascotAnim: 'happy',
        title: 'Estadísticas 📊',
        message: `Aquí ves tu volumen total, calorías quemadas y progresión por ejercicio. Así sabes exactamente cómo mejoras.`,
      },
    ],

    // ── TU DÍA ────────────────────────────────────────────
    report: [
      {
        id: 'report-welcome',
        target: null,
        position: 'center',
        mascotAnim: 'wave',
        title: 'Tu Día — El centro del producto 📊',
        message: `¡Hola ${userName}! Esta es la sección más importante. Aquí verás un resumen completo de tu día de salud.`,
      },
      {
        id: 'report-calories',
        target: '[data-tour="report-calories"]',
        position: 'bottom',
        mascotAnim: 'point',
        title: 'Balance calórico 🔥',
        message: `El anillo muestra tus calorías consumidas vs tu objetivo. Si está verde, vas bien. Si está naranja, has superado tu meta.`,
      },
      {
        id: 'report-modules',
        target: '[data-tour="report-modules"]',
        position: 'bottom',
        mascotAnim: 'happy',
        title: 'Estado de todos los módulos ✅',
        message: `Aquí ves de un vistazo si has registrado nutrición, entreno, sueño, ánimo e hidratación. Los puntos indican el estado.`,
      },
      {
        id: 'report-coach',
        target: '[data-tour="report-coach"]',
        position: 'top',
        mascotAnim: 'celebrate',
        title: 'Insight del Coach IA 🤖',
        message: `Genera un análisis personalizado de tu día. El Coach usa todos tus datos para darte recomendaciones específicas.`,
      },
      {
        id: 'report-weekly',
        target: '[data-tour="report-weekly"]',
        position: 'top',
        mascotAnim: 'happy',
        title: 'Estadísticas semanales 📅',
        message: `Aquí ves tu consistencia esta semana: días registrados, calorías medias, entrenos y horas de sueño. La consistencia es la clave.`,
      },
    ],

    // ── PERFIL ────────────────────────────────────────────
    profile: [
      {
        id: 'profile-welcome',
        target: null,
        position: 'center',
        mascotAnim: 'wave',
        title: 'Tu Perfil 👤',
        message: `Aquí puedes gestionar tu información personal, personalizar la app y gestionar tu suscripción.`,
      },
      {
        id: 'profile-data',
        target: '[data-tour="profile-data"]',
        position: 'bottom',
        mascotAnim: 'point',
        title: 'Datos personales ✏️',
        message: `Toca "Editar" para actualizar tu nombre, peso, altura y objetivo. El Coach recalculará tus macros automáticamente.`,
      },
      {
        id: 'profile-premium',
        target: '[data-tour="profile-premium"]',
        position: 'bottom',
        mascotAnim: 'celebrate',
        title: 'Plan Premium ⭐',
        message: `Con Premium desbloqueas el Coach IA ilimitado, análisis de fotos, recetas personalizadas e interpretación de analíticas.`,
      },
      {
        id: 'profile-appearance',
        target: '[data-tour="profile-appearance"]',
        position: 'top',
        mascotAnim: 'happy',
        title: 'Apariencia 🎨',
        message: `Cambia los colores de toda la app eligiendo un tema. Cada mascota tiene su tema visual. ¡Prueba el Fox Energy!`,
      },
    ],
  }

  return tours[tourKey] || []
}

export const TOUR_KEYS   = ['home', 'nutrition', 'workout', 'report', 'profile']
export const TOUR_LABELS = {
  home:      'Home',
  nutrition: 'Nutrición',
  workout:   'Entrenamiento',
  report:    'Tu Día',
  profile:   'Perfil',
}
