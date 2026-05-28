// src/data/seasonalEvents.js

export const EVENT_REGISTRY = {
  // 🎃 OTOÑO / HALLOWEEN: El Grimorio y la Cosecha de Fuerza
  yggdrasil_halloween: {
    id: 'yggdrasil_halloween',
    name: 'El Grimorio de Yggdrasil',
    subtitle: 'Noche de Brujas · Cosecha de Fuerza',
    emoji: '🎃',
    isActive: (now) => now.getMonth() >= 8 && now.getMonth() <= 10, // Septiembre, Octubre, Noviembre
    endsAt: () => new Date(new Date().getFullYear() + '-10-31T23:59:59'),
    
    // 🏋️‍♂️ ENFOQUE DE WORKOUT (Hipertrofia / Volumen / Fuerza)
    workoutFocus: {
      goal: 'Hipertrofia y Ganancia de Fuerza',
      desc: 'El otoño es tiempo de recolectar energía y canalizarla en los hierros. Enfócate en ejercicios multiarticulares pesados para construir masa rúnica.',
    },
    
    // 🍎 ENFOQUE DE DIETA (Productos de temporada)
    dietFocus: {
      strategy: 'Superávit Calórico Controlado (Volumen)',
      foods: ['Calabaza', 'Boniato / Camote', 'Castañas y Frutos Secos', 'Setas / Hongos silvestres', 'Granadas'],
      tip: 'Aprovecha los carbohidratos complejos de la calabaza y el boniato post-entreno para recargar el glucógeno muscular y levantar más pesado.'
    },

    styles: {
      borderGradient: 'conic-gradient(from 0deg, #7C3AED, #F97316, #1F2937, #DC2626, #7C3AED)',
      bgGlow: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.25) 0%, rgba(249,115,22,0.1) 60%, transparent 100%)',
      accentColor: '#F97316',
      tagBg: 'rgba(124,58,237,0.3)',
      tagText: '#D8B4FE'
    },
    reward: {
      name: 'Aquelarre de Sombras',
      emoji: '🔮',
      desc: 'Desbloquea el plan nutricional "Pócimas de Otoño" y la skin "Pandi Vampiro"',
    },
    missions: [
      {
        id: 'steel',
        school: 'Nigromancia',
        emoji: '💀',
        name: 'Levantar a los Muertos',
        desc: 'Mover 2.0t acumuladas en Peso Muerto o Sentadillas pesadas',
        target: 2000,
        unit: 'kg',
        color: '#7C3AED',
      },
      {
        id: 'mana',
        school: 'Alquimia',
        emoji: '🍲',
        name: 'Festín del Aquelarre',
        desc: 'Registrar 5 comidas ricas en alimentos de otoño (Calabaza/Boniato)',
        target: 5,
        unit: 'comidas',
        color: '#F97316',
      },
      {
        id: 'astral',
        school: 'Restauración',
        emoji: '👁️',
        name: 'Trance Regenerativo',
        desc: 'Completar 40 min de estiramientos pesados para liberar fascias',
        target: 40,
        unit: 'min',
        color: '#DC2626',
      },
    ],
  },

  // ❄️ INVIERNO: El Fimbulwinter y la Resistencia al Frío
  yggdrasil_winter: {
    id: 'yggdrasil_winter',
    name: 'Supervivencia: Fimbulwinter',
    subtitle: 'El Invierno Mitológico · Resistencia Extrema',
    emoji: '❄️',
    isActive: (now) => now.getMonth() === 11 || now.getMonth() <= 1, // Diciembre, Enero, Febrero
    endsAt: () => new Date(new Date().getFullYear() + '-02-28T23:59:59'),
    
    workoutFocus: {
      goal: 'Termogénesis y Resistencia Cardiovascular',
      desc: 'Combate el frío helado de Midgard. El objetivo es mantener el núcleo activo: entrenamientos HIIT, circuitos metabólicos cortos y máxima intensidad cardiovascular.',
    },
    
    dietFocus: {
      strategy: 'Mantenimiento / Definición e Inmunidad',
      foods: ['Naranjas y Mandarinas (Vit C)', 'Brócoli y Coliflor', 'Espinacas', 'Caldos óseos / Sopas', 'Alcachofas'],
      tip: 'Usa los caldos calientes densos en nutrientes antes de entrenar para aclimatar el cuerpo y blinda tus defensas con los cítricos de temporada.'
    },

    styles: {
      borderGradient: 'conic-gradient(from 0deg, #0EA5E9, #38BDF8, #1E293B, #E2E8F0, #0EA5E9)',
      bgGlow: 'radial-gradient(ellipse at 50% 0%, rgba(14,165,233,0.25) 0%, rgba(56,189,248,0.1) 60%, transparent 100%)',
      accentColor: '#0EA5E9',
      tagBg: 'rgba(14,165,233,0.3)',
      tagText: '#7DD3FC'
    },
    reward: {
      name: 'Aura de Jötunheim',
      emoji: '🛡️',
      desc: 'Desbloquea recetas de "Caldos de Poder" y el título de perfil "Inmune al Frío"',
    },
    missions: [
      {
        id: 'steel',
        school: 'Fuerza de Escarcha',
        emoji: '🏔️',
        name: 'Romper el Permafrost',
        desc: 'Completar 100 repeticiones totales de zancadas o prensa (fuerza de piernas)',
        target: 100,
        unit: 'reps',
        color: '#0EA5E9',
      },
      {
        id: 'mana',
        school: 'Termogénesis',
        emoji: '🏃‍♂️',
        name: 'Encender el Núcleo',
        desc: 'Quemar 600 kcal en sesiones de cardio/HIIT de alta intensidad para sudar el frío',
        target: 600,
        unit: 'kcal',
        color: '#38BDF8',
      },
      {
        id: 'astral',
        school: 'Inmunidad',
        emoji: '🍵',
        name: 'Elixir de Odín',
        desc: 'Tomar 3 infusiones/caldos vegetales de temporada ricos en micronutrientes',
        target: 3,
        unit: 'tazas',
        color: '#E2E8F0',
      },
    ],
  },
}

export function getCurrentEvent() {
  const now = new Date()
  const found = Object.values(EVENT_REGISTRY).find(event => event.isActive(now))
  return found || EVENT_REGISTRY.yggdrasil_halloween
}
