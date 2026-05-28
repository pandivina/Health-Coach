// ─── BIBLIOTECA COMPLETA DE EJERCICIOS POR SENDA ─────────────────────────────

export const EXERCISE_LIBRARY = {

  titan: [
    // PECHO
    { id: 't_press_banca',      name: 'Press de Banca',           category: 'Pecho',          emoji: '🏋️', equipment: 'Barra',       desc: 'Empuje horizontal en banco plano con barra.',                    sets: 4, reps: '8-10', rest: 90 },
    { id: 't_press_mancuernas', name: 'Press con Mancuernas',     category: 'Pecho',          emoji: '💪', equipment: 'Mancuernas',  desc: 'Mayor rango de movimiento que con barra.',                       sets: 3, reps: '10-12', rest: 75 },
    { id: 't_aperturas',        name: 'Aperturas en Banco',       category: 'Pecho',          emoji: '🦅', equipment: 'Mancuernas',  desc: 'Aislamiento del pectoral con movimiento de arco.',               sets: 3, reps: '12-15', rest: 60 },
    { id: 't_fondos',           name: 'Fondos en Paralelas',      category: 'Pecho/Tríceps',  emoji: '🤸', equipment: 'Peso corporal', desc: 'Empuje en paralelas con el torso inclinado hacia adelante.',    sets: 3, reps: '10-12', rest: 75 },
    // ESPALDA
    { id: 't_dominadas',        name: 'Dominadas',                category: 'Espalda',        emoji: '🦅', equipment: 'Barra',       desc: 'Tracción colgado en barra hasta pasar la barbilla.',             sets: 4, reps: '6-10', rest: 90 },
    { id: 't_remo_barra',       name: 'Remo con Barra',           category: 'Espalda',        emoji: '🚣', equipment: 'Barra',       desc: 'Tracción horizontal con barra en posición inclinada.',           sets: 4, reps: '8-10', rest: 90 },
    { id: 't_peso_muerto',      name: 'Peso Muerto',              category: 'Espalda/Piernas',emoji: '💀', equipment: 'Barra',       desc: 'Levantamiento de barra desde el suelo bloqueando la cadera.',    sets: 4, reps: '5-6', rest: 120 },
    { id: 't_jalon',            name: 'Jalón al Pecho',           category: 'Espalda',        emoji: '🔽', equipment: 'Máquina',     desc: 'Jalón de polea alta al pecho con agarre ancho.',                 sets: 3, reps: '10-12', rest: 75 },
    // HOMBROS
    { id: 't_press_militar',    name: 'Press Militar',            category: 'Hombros',        emoji: '🪖', equipment: 'Barra',       desc: 'Empuje vertical de pie con barra sobre la cabeza.',              sets: 4, reps: '8-10', rest: 90 },
    { id: 't_elevaciones_lat',  name: 'Elevaciones Laterales',   category: 'Hombros',        emoji: '↔️', equipment: 'Mancuernas',  desc: 'Elevación de brazos al lateral hasta la horizontal.',            sets: 3, reps: '12-15', rest: 60 },
    { id: 't_face_pull',        name: 'Face Pull',                category: 'Hombros/Manguito',emoji: '🎯',equipment: 'Polea',      desc: 'Tracción de polea alta hacia la cara. Protege el manguito.',     sets: 3, reps: '15-20', rest: 60 },
    // PIERNAS
    { id: 't_sentadilla',       name: 'Sentadilla Libre',         category: 'Piernas',        emoji: '🏔️', equipment: 'Barra',       desc: 'Flexión de rodillas y cadera con barra en la espalda.',          sets: 4, reps: '6-8', rest: 120 },
    { id: 't_prensa',           name: 'Prensa de Piernas',        category: 'Piernas',        emoji: '🦵', equipment: 'Máquina',     desc: 'Empuje de plataforma inclinada con las piernas.',                sets: 4, reps: '10-12', rest: 90 },
    { id: 't_zancadas',         name: 'Zancadas',                 category: 'Piernas',        emoji: '🚶', equipment: 'Mancuernas',  desc: 'Paso adelante bajando la rodilla trasera al suelo.',             sets: 3, reps: '10-12', rest: 75 },
    { id: 't_curl_femoral',     name: 'Curl Femoral',             category: 'Isquios',        emoji: '🦿', equipment: 'Máquina',     desc: 'Flexión de rodilla tumbado en la máquina.',                      sets: 3, reps: '12-15', rest: 60 },
    // BRAZOS
    { id: 't_curl_barra',       name: 'Curl con Barra',           category: 'Bíceps',         emoji: '💪', equipment: 'Barra',       desc: 'Flexión de brazos de pie manteniendo los codos fijos.',          sets: 3, reps: '10-12', rest: 60 },
    { id: 't_tricep_polea',     name: 'Extensión Tríceps Polea',  category: 'Tríceps',        emoji: '📐', equipment: 'Polea',       desc: 'Extensión de codo en polea con agarre de cuerda.',              sets: 3, reps: '12-15', rest: 60 },
    // CORE
    { id: 't_plancha',          name: 'Plancha',                  category: 'Core',           emoji: '🧱', equipment: 'Peso corporal', desc: 'Isometría de core en posición de push-up sobre codos.',        sets: 3, reps: '45s', rest: 45 },
    { id: 't_abs_rueda',        name: 'Rueda Abdominal',          category: 'Core',           emoji: '⭕', equipment: 'Rueda',       desc: 'Extensión abdominal con rueda desde posición de rodillas.',      sets: 3, reps: '8-10', rest: 60 },
  ],

  warrior: [
    // HIIT
    { id: 'w_burpees',          name: 'Burpees',                  category: 'HIIT',           emoji: '🔥', equipment: 'Peso corporal', desc: 'Movimiento completo: flexión + salto explosivo.',              sets: 4, reps: '45s', rest: 15 },
    { id: 'w_escaladores',      name: 'Escaladores',              category: 'HIIT/Core',      emoji: '🏃', equipment: 'Peso corporal', desc: 'Rodillas al pecho alternas desde plancha de forma explosiva.', sets: 4, reps: '40s', rest: 20 },
    { id: 'w_jumping_jacks',    name: 'Jumping Jacks',            category: 'Cardio',         emoji: '✨', equipment: 'Peso corporal', desc: 'Saltos abriendo y cerrando brazos y piernas.',                 sets: 3, reps: '60s', rest: 15 },
    { id: 'w_saltos_caja',      name: 'Saltos al Cajón',          category: 'Pliometría',     emoji: '📦', equipment: 'Cajón',        desc: 'Salto explosivo a superficie elevada, amortiguando la caída.', sets: 4, reps: '10', rest: 45 },
    { id: 'w_sprints',          name: 'Sprints en Cinta',         category: 'Cardio',         emoji: '💨', equipment: 'Cinta',        desc: 'Intervalos de máxima velocidad en cinta rodante.',             sets: 8, reps: '30s', rest: 30 },
    // FUERZA EXPLOSIVA
    { id: 'w_sentadilla_salto', name: 'Sentadilla con Salto',     category: 'Pliometría',     emoji: '🚀', equipment: 'Peso corporal', desc: 'Sentadilla profunda terminando en salto explosivo.',           sets: 4, reps: '12', rest: 45 },
    { id: 'w_push_up_aplauso',  name: 'Flexiones con Aplauso',   category: 'Pliometría',     emoji: '👏', equipment: 'Peso corporal', desc: 'Flexión explosiva despegando las manos para aplaudir.',        sets: 3, reps: '8-10', rest: 60 },
    { id: 'w_battle_ropes',     name: 'Battle Ropes',             category: 'HIIT',           emoji: '🪢', equipment: 'Cuerdas',      desc: 'Ondas alternadas con cuerdas pesadas para cardio y fuerza.',   sets: 4, reps: '30s', rest: 30 },
    // AGILIDAD
    { id: 'w_escalera_agil',    name: 'Escalera de Agilidad',     category: 'Agilidad',       emoji: '🪜', equipment: 'Escalera',     desc: 'Patrones de pasos rápidos en escalera de coordinación.',       sets: 4, reps: '2 pases', rest: 30 },
    { id: 'w_lateral_shuffle',  name: 'Desplazamientos Laterales',category: 'Agilidad',       emoji: '↔️', equipment: 'Peso corporal', desc: 'Pasos laterales rápidos manteniendo posición atlética.',       sets: 4, reps: '45s', rest: 15 },
    // CORE FUNCIONAL
    { id: 'w_russian_twist',    name: 'Russian Twist',            category: 'Core',           emoji: '🔄', equipment: 'Disco/Peso corporal', desc: 'Giro de tronco en posición V con peso.',                 sets: 3, reps: '20', rest: 30 },
    { id: 'w_plank_to_pushup',  name: 'Plancha a Flexión',        category: 'Core/Funcional', emoji: '🔀', equipment: 'Peso corporal', desc: 'Transición de plancha baja a alta de forma continua.',         sets: 3, reps: '10', rest: 30 },
  ],

  zen: [
    // YOGA
    { id: 'z_saludo_sol',       name: 'Saludo al Sol A',          category: 'Yoga/Transición',emoji: '☀️', equipment: 'Esterilla',   desc: 'Secuencia fluida de 8 posturas para calentar el cuerpo.',       sets: 3, reps: '5 rondas', rest: 30 },
    { id: 'z_perro_boca_abajo', name: 'Perro Boca Abajo',         category: 'Yoga/Flexibilidad',emoji: '🐕',equipment: 'Esterilla', desc: 'V invertida. Estira isquios, espalda y abre los hombros.',      sets: 3, reps: '60s', rest: 15 },
    { id: 'z_guerrero_1',       name: 'Guerrero I',               category: 'Yoga/Equilibrio',emoji: '⚔️', equipment: 'Esterilla',   desc: 'Zancada profunda con brazos extendidos al cielo.',              sets: 2, reps: '45s c/lado', rest: 15 },
    { id: 'z_guerrero_2',       name: 'Guerrero II',              category: 'Yoga/Equilibrio',emoji: '🗡️', equipment: 'Esterilla',   desc: 'Zancada lateral con brazos extendidos horizontalmente.',        sets: 2, reps: '45s c/lado', rest: 15 },
    { id: 'z_arbol',            name: 'Postura del Árbol',        category: 'Yoga/Equilibrio',emoji: '🌳', equipment: 'Esterilla',   desc: 'Equilibrio sobre una pierna con pie en muslo contrario.',       sets: 2, reps: '60s c/lado', rest: 15 },
    { id: 'z_paloma',           name: 'Paloma',                   category: 'Yoga/Caderas',   emoji: '🕊️', equipment: 'Esterilla',   desc: 'Apertura profunda de cadera. Alivia tensión del glúteo.',       sets: 2, reps: '90s c/lado', rest: 15 },
    { id: 'z_cobra',            name: 'Cobra (Bhujangasana)',     category: 'Yoga/Espalda',   emoji: '🐍', equipment: 'Esterilla',   desc: 'Extensión de columna tumbado boca abajo con brazos.',           sets: 3, reps: '30s', rest: 15 },
    { id: 'z_child_pose',       name: 'Postura del Niño',         category: 'Yoga/Descanso',  emoji: '🌱', equipment: 'Esterilla',   desc: 'Postura de descanso profundo. Estira lumbar y caderas.',        sets: 2, reps: '60s', rest: 0 },
    // PILATES
    { id: 'p_hundred',          name: 'The Hundred',              category: 'Pilates/Core',   emoji: '💯', equipment: 'Esterilla',   desc: 'Core activado con piernas elevadas y bombeo de brazos.',        sets: 1, reps: '100 bombeos', rest: 30 },
    { id: 'p_roll_up',          name: 'Roll Up',                  category: 'Pilates/Core',   emoji: '🔄', equipment: 'Esterilla',   desc: 'Incorporación vertebral desde tumbado hasta sentado.',          sets: 3, reps: '8-10', rest: 30 },
    { id: 'p_single_leg',       name: 'Single Leg Stretch',       category: 'Pilates/Core',   emoji: '🦵', equipment: 'Esterilla',   desc: 'Alternancia de piernas con core activado en posición V.',       sets: 3, reps: '10 c/pierna', rest: 30 },
    { id: 'p_bridge',           name: 'Puente Pilates',           category: 'Pilates/Glúteos',emoji: '🌉', equipment: 'Esterilla',   desc: 'Elevación de cadera articulando la columna vértebra a vértebra.',sets: 3, reps: '10-12', rest: 30 },
    { id: 'p_swimming',         name: 'Swimming',                 category: 'Pilates/Espalda',emoji: '🏊', equipment: 'Esterilla',   desc: 'Extensión alterna de brazos y piernas boca abajo.',            sets: 3, reps: '30s', rest: 30 },
    // MEDITACIÓN EN MOVIMIENTO
    { id: 'm_respiracion',      name: 'Respiración 4-7-8',        category: 'Meditación',     emoji: '🌬️', equipment: 'Ninguno',    desc: 'Inhala 4s, retén 7s, exhala 8s. Activa el sistema parasimpático.',sets: 5, reps: '4 ciclos', rest: 0 },
    { id: 'm_savasana',         name: 'Savasana',                 category: 'Relajación',     emoji: '💆', equipment: 'Esterilla',   desc: 'Relajación final tumbado. Integra los beneficios de la sesión.', sets: 1, reps: '5 min', rest: 0 },
  ],
}

// ─── SESIONES GUIADAS POR PROGRAMA ───────────────────────────────────────────

export const GUIDED_SESSIONS = {
  // TITÁN
  hyper: {
    name: 'Hipertrofia Básica',
    path: 'titan',
    exercises: ['t_press_banca','t_remo_barra','t_sentadilla','t_press_militar','t_curl_barra','t_tricep_polea','t_plancha'],
  },
  ppl_push: {
    name: 'Push (Pecho/Hombros/Tríceps)',
    path: 'titan',
    exercises: ['t_press_banca','t_press_mancuernas','t_press_militar','t_elevaciones_lat','t_aperturas','t_tricep_polea'],
  },
  ppl_pull: {
    name: 'Pull (Espalda/Bíceps)',
    path: 'titan',
    exercises: ['t_dominadas','t_remo_barra','t_jalon','t_curl_barra','t_face_pull'],
  },
  ppl_legs: {
    name: 'Legs (Piernas)',
    path: 'titan',
    exercises: ['t_sentadilla','t_prensa','t_zancadas','t_curl_femoral','t_plancha','t_abs_rueda'],
  },
  heavy: {
    name: 'Heavy Duty',
    path: 'titan',
    exercises: ['t_press_banca','t_peso_muerto','t_dominadas','t_press_militar'],
  },
  // GUERRERO
  circuit: {
    name: 'Circuito Quema-Grasa',
    path: 'warrior',
    exercises: ['w_jumping_jacks','w_burpees','w_escaladores','w_sentadilla_salto','w_russian_twist','w_lateral_shuffle'],
  },
  tabata: {
    name: 'Tabata Infernal',
    path: 'warrior',
    exercises: ['w_burpees','w_escaladores','w_saltos_caja','w_push_up_aplauso','w_sprints','w_battle_ropes','w_plank_to_pushup','w_russian_twist'],
  },
  agility: {
    name: 'Desafío de Agilidad',
    path: 'warrior',
    exercises: ['w_escalera_agil','w_lateral_shuffle','w_sentadilla_salto','w_sprints','w_escaladores','w_russian_twist'],
  },
  // ZEN
  hatha: {
    name: 'Yoga Hatha',
    path: 'zen',
    exercises: ['m_respiracion','z_saludo_sol','z_guerrero_1','z_guerrero_2','z_perro_boca_abajo','z_cobra','z_child_pose','m_savasana'],
  },
  pilates: {
    name: 'Pilates Power Core',
    path: 'zen',
    exercises: ['m_respiracion','p_hundred','p_roll_up','p_single_leg','p_bridge','p_swimming','m_savasana'],
  },
  vinyasa: {
    name: 'Vinyasa Flow',
    path: 'zen',
    exercises: ['m_respiracion','z_saludo_sol','z_guerrero_1','z_guerrero_2','z_arbol','z_paloma','z_perro_boca_abajo','m_savasana'],
  },
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

export function getExerciseById(id) {
  for (const path of Object.values(EXERCISE_LIBRARY)) {
    const found = path.find(ex => ex.id === id)
    if (found) return found
  }
  return null
}

export function getGuidedSession(programId) {
  const session = GUIDED_SESSIONS[programId]
  if (!session) return null
  return {
    ...session,
    exerciseList: session.exercises.map(id => getExerciseById(id)).filter(Boolean),
  }
}

export function getAllByPath(pathId) {
  return EXERCISE_LIBRARY[pathId] || []
}
