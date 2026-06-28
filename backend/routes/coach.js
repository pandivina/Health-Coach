const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const { requireAuth, supabaseAdmin } = require('../middleware/auth');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const FREE_DAILY_LIMIT = 10;

// ─── RATE LIMIT ───────────────────────────────────────────────────────────────
async function checkCoachLimit(req, res, next) {
  try {
    const userId = req.user.id;
    const today  = new Date().toISOString().split('T')[0];

    const { data: profile } = await supabaseAdmin
      .from('user_profiles').select('is_premium').eq('id', userId).single();

    if (profile?.is_premium) return next();

    const { data: usage } = await supabaseAdmin
      .from('coach_usage').select('count').eq('user_id', userId).eq('date', today).maybeSingle();

    const count = usage?.count || 0;

    if (count >= FREE_DAILY_LIMIT) {
      return res.status(429).json({
        error: 'limit_reached',
        message: `Has alcanzado el límite de ${FREE_DAILY_LIMIT} mensajes diarios del plan gratuito.`,
        limit: FREE_DAILY_LIMIT,
        used: count,
      });
    }

    await supabaseAdmin.from('coach_usage').upsert(
      { user_id: userId, date: today, count: count + 1 },
      { onConflict: 'user_id,date' }
    );

    next();
  } catch (err) {
    next();
  }
}

// ─── MEMORIA PERSISTENTE ──────────────────────────────────────────────────────
async function loadMemory(userId) {
  try {
    const { data } = await supabaseAdmin
      .from('coach_memory')
      .select('summary, preferences, important_events')
      .eq('user_id', userId)
      .maybeSingle();
    return data || null;
  } catch { return null; }
}

async function updateMemory(userId, messages, lastReply) {
  try {
    const { data: existing } = await supabaseAdmin
      .from('coach_memory')
      .select('summary, preferences, important_events, message_count')
      .eq('user_id', userId).maybeSingle();

    const messageCount = (existing?.message_count || 0) + 1;

    // Actualizar contador en cada mensaje
    await supabaseAdmin.from('coach_memory').upsert({
      user_id:       userId,
      message_count: messageCount,
      last_updated:  new Date().toISOString(),
    }, { onConflict: 'user_id' });

    // Regenerar resumen completo cada 5 mensajes
    if (messageCount % 5 !== 0) return;

    const lastMessages = messages.slice(-10).map(m =>
      `${m.role === 'user' ? 'Usuario' : 'Coach'}: ${m.content}`
    ).join('\n');

    const summaryRes = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
      max_tokens: 600,
      messages: [{
        role: 'user',
        content: `Eres un asistente que analiza conversaciones de salud y extrae información estructurada.

Resumen anterior: ${existing?.summary || 'Sin resumen previo'}
Preferencias anteriores: ${JSON.stringify(existing?.preferences || {})}
Eventos anteriores: ${JSON.stringify(existing?.important_events || [])}

Últimos mensajes:
${lastMessages}

Devuelve ÚNICAMENTE un JSON válido con esta estructura exacta (sin markdown, sin texto extra):
{
  "summary": "Resumen actualizado en máx 200 palabras sobre objetivos, hábitos y contexto del usuario",
  "preferences": {
    "alimentos_preferidos": [],
    "alimentos_evita": [],
    "horario_entreno": "",
    "objetivo_principal": "",
    "estilo_comunicacion": ""
  },
  "important_events": ["Evento o hito importante mencionado (máx 5 items)"]
}`
      }]
    });

    let parsed;
    try {
      parsed = JSON.parse(summaryRes.content[0].text.trim());
    } catch {
      parsed = { summary: summaryRes.content[0].text.trim() };
    }

    await supabaseAdmin.from('coach_memory').upsert({
      user_id:          userId,
      summary:          parsed.summary          || existing?.summary || '',
      preferences:      parsed.preferences      || existing?.preferences || {},
      important_events: parsed.important_events || existing?.important_events || [],
      message_count:    messageCount,
      last_updated:     new Date().toISOString(),
    }, { onConflict: 'user_id' });

  } catch (err) {
    console.error('[Memory] update error:', err.message);
  }
}

// ─── MOTOR DE DECISIÓN DIARIO ─────────────────────────────────────────────────

// Evalúa el día del usuario y devuelve un score estructurado
async function evaluarDia(userId) {
  const today = new Date().toISOString().split('T')[0]
  const safe  = async fn => { try { return await fn } catch { return { data: null } } }

  const [profileRes, goalsRes, mealsRes, sleepRes, moodRes, workoutRes, waterRes] = await Promise.all([
    safe(supabaseAdmin.from('user_profiles').select('name,level,streak,xp').eq('id', userId).single()),
    safe(supabaseAdmin.from('nutrition_goals').select('calories,protein_g').eq('user_id', userId).maybeSingle()),
    safe(supabaseAdmin.from('meal_logs').select('calories,protein_g').eq('user_id', userId).eq('date', today)),
    safe(supabaseAdmin.from('sleep_logs').select('hours,quality').eq('user_id', userId).eq('date', today).maybeSingle()),
    safe(supabaseAdmin.from('mood_logs').select('mood').eq('user_id', userId).eq('date', today).maybeSingle()),
    safe(supabaseAdmin.from('workout_sessions').select('id').eq('user_id', userId).eq('status', 'completed').gte('created_at', today + 'T00:00:00').limit(1)),
    safe(supabaseAdmin.from('hydration_logs').select('glasses,goal').eq('user_id', userId).eq('date', today).maybeSingle()),
  ])

  const profile  = profileRes.data  || {}
  const goals    = goalsRes.data    || { calories: 2000, protein_g: 150 }
  const meals    = mealsRes.data    || []
  const sleep    = sleepRes.data    || null
  const mood     = moodRes.data     || null
  const workout  = workoutRes.data  || []
  const water    = waterRes.data    || null

  const caloriesConsumed = meals.reduce((s, m) => s + (m.calories || 0), 0)
  const proteinConsumed  = meals.reduce((s, m) => s + (m.protein_g || 0), 0)
  const waterGlasses     = water?.glasses || 0
  const waterGoal        = water?.goal    || 8

  // Scores 0-1 por módulo
  const scores = {
    nutricion:    goals.calories > 0
      ? Math.min(caloriesConsumed / goals.calories, 1.2)   // permite hasta 120%
      : 0,
    proteina:     goals.protein_g > 0
      ? Math.min(proteinConsumed / goals.protein_g, 1)
      : 0,
    hidratacion:  waterGoal > 0 ? Math.min(waterGlasses / waterGoal, 1) : 0,
    sueno:        sleep?.hours  ? Math.min(sleep.hours / 7, 1) : 0,
    animo:        mood?.mood    ? mood.mood / 5 : 0,
    entreno:      workout.length > 0 ? 1 : 0,
  }

  const media = Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length
  const estado = media > 0.7 ? 'GREEN' : media > 0.4 ? 'YELLOW' : 'RED'

  const puntosFuertes = Object.entries(scores)
    .filter(([, v]) => v >= 0.75)
    .map(([k]) => k)

  const puntosDebiles = Object.entries(scores)
    .filter(([, v]) => v < 0.4)
    .map(([k]) => k)

  const modulosSinRegistro = Object.entries(scores)
    .filter(([k, v]) => v === 0 && !['entreno'].includes(k))
    .map(([k]) => k)

  return {
    userId,
    fecha: today,
    perfil: profile,
    scores,
    media: Math.round(media * 100) / 100,
    estado,
    puntosFuertes,
    puntosDebiles,
    modulosSinRegistro,
    detalle: { caloriesConsumed, proteinConsumed, waterGlasses, sleepHours: sleep?.hours, mood: mood?.mood, workoutDone: workout.length > 0 },
  }
}

// Genera el plan de mañana basado en la evaluación del día
async function generarPlanManana(evaluacion) {
  const { userId, perfil, scores, estado, puntosFuertes, puntosDebiles, detalle } = evaluacion

  // Construir prompt para el plan de mañana
  const prompt = `Eres Pandi, el coach de salud de ${perfil.name || 'el usuario'}. 
Analiza el día de hoy y genera un plan de mañana concreto y motivador.

RESUMEN DEL DÍA DE HOY:
- Estado general: ${estado} (puntuación media: ${Math.round(evaluacion.media * 100)}%)
- Nutrición: ${Math.round(detalle.caloriesConsumed)} kcal consumidas
- Hidratación: ${detalle.waterGlasses} vasos
- Sueño: ${detalle.sleepHours ? detalle.sleepHours + 'h' : 'no registrado'}
- Ánimo: ${detalle.mood ? detalle.mood + '/5' : 'no registrado'}
- Entreno: ${detalle.workoutDone ? 'completado ✅' : 'no realizado'}
- Puntos fuertes: ${puntosFuertes.join(', ') || 'ninguno registrado'}
- Puntos a mejorar: ${puntosDebiles.join(', ') || 'ninguno'}

Genera un plan de mañana con exactamente este formato JSON (solo el JSON, sin texto adicional):
{
  "mensaje_noche": "Mensaje motivador corto para esta noche (máx 2 frases)",
  "prioridades": ["tarea 1 concreta", "tarea 2 concreta", "tarea 3 concreta"],
  "foco_principal": "el módulo más importante para mañana (nutricion|hidratacion|sueno|entreno|animo)",
  "objetivo_calorico": número (ajustado según el día de hoy),
  "mensaje_manana": "Mensaje motivador para empezar mañana (máx 2 frases)"
}`

  try {
    const response = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    })

    const text    = response.content[0].text.trim()
    const clean   = text.replace(/```json|```/g, '').trim()
    const plan    = JSON.parse(clean)

    // Guardar en coach_memory
    await supabaseAdmin.from('coach_memory').upsert({
      user_id:        userId,
      tomorrow_plan:  plan,
      last_plan_date: evaluacion.fecha,
      day_score:      evaluacion.media,
      day_state:      evaluacion.estado,
      last_updated:   new Date().toISOString(),
    }, { onConflict: 'user_id' })

    return plan
  } catch (err) {
    console.error('generarPlanManana error:', err.message)
    // Plan por defecto si falla Claude
    return {
      mensaje_noche:    'Descansa bien esta noche. Mañana seguimos.',
      prioridades:      ['Registrar nutrición', 'Beber 8 vasos de agua', 'Hacer 10 min de movimiento'],
      foco_principal:   puntosDebiles[0] || 'hidratacion',
      objetivo_calorico: 2000,
      mensaje_manana:   'Buenos días. Un día más, un paso más.',
    }
  }
}

// Carga el plan de mañana para inyectarlo en el system prompt
async function loadTomorrowPlan(userId) {
  try {
    const { data } = await supabaseAdmin
      .from('coach_memory')
      .select('tomorrow_plan, last_plan_date, day_score, day_state')
      .eq('user_id', userId)
      .maybeSingle()
    if (!data?.tomorrow_plan) return null
    return data
  } catch { return null }
}

// Detecta patrones de refuerzo positivo para el system prompt
async function detectPatterns(userId) {
  const today = new Date()
  const patterns = []

  try {
    // Últimos 7 días de mood
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today); d.setDate(d.getDate() - i)
      return d.toISOString().split('T')[0]
    })

    const { data: moodLogs } = await supabaseAdmin
      .from('mood_logs').select('date,mood')
      .eq('user_id', userId).in('date', last7)

    const { data: profile } = await supabaseAdmin
      .from('user_profiles').select('streak, level, xp')
      .eq('user_id', userId).single()

    // Racha larga
    if (profile?.streak >= 7)  patterns.push(`🔥 Lleva ${profile.streak} días de racha consecutiva — menciona este logro`)
    if (profile?.streak >= 30) patterns.push(`🏆 ¡30+ días de racha! Es un hito enorme — celébralo`)

    // Mood bajo consecutivo (alerta)
    if (moodLogs && moodLogs.length >= 3) {
      const sorted = moodLogs.sort((a, b) => b.date.localeCompare(a.date))
      const lowDays = sorted.slice(0, 3).filter(l => l.mood <= 2).length
      if (lowDays >= 3) patterns.push('⚠️ 3+ días con ánimo bajo — prioriza validación emocional antes de cualquier consejo')
    }

    // Mood mejorando
    if (moodLogs && moodLogs.length >= 2) {
      const sorted = moodLogs.sort((a, b) => a.date.localeCompare(b.date))
      const last = sorted[sorted.length - 1]
      const prev = sorted[sorted.length - 2]
      if (last && prev && last.mood > prev.mood + 1) {
        patterns.push('📈 El ánimo ha mejorado respecto a días anteriores — refuerza positivamente')
      }
    }

    // Subida de nivel reciente
    if (profile?.level && profile.level > 1) {
      patterns.push(`⭐ Usuario en nivel ${profile.level} — adapta la profundidad técnica al nivel`)
    }

  } catch (err) {
    console.error('detectPatterns error:', err.message)
  }

  return patterns
}


function buildEvolutivePersonality(fase, profileName) {
  const name = profileName || 'Usuario';

  if (fase >= 2) {
    return {
      identity: `Eres Pandi, mentor analítico y científico de salud de ${name}. Tu conocimiento es profundo, técnico y basado en evidencia sólida. Eres el compañero de optimización del rendimiento humano de ${name}.`,
      tone: `Utiliza terminología técnica precisa: mecanismos biológicos, endocrinos y psicológicos. Cita evidencia científica cuando sea relevante. Eres riguroso pero siempre de apoyo. Usa "nosotros" — estamos construyendo esto juntos.`,
      rules: `
- Relaciona cada consejo con la rama del sistema que corresponda (sueño, nutrición, movimiento, mente, hidratación, intención).
- Si el usuario propone algo sin base científica, explica el porqué con rigor, manteniendo siempre apoyo.
- Termina siempre con una llamada a la acción específica y medible.
- Rechaza pseudociencia. Todo consejo debe estar fundamentado en evidencia sólida.`,
      maxParagraphs: 3,
    };
  }

  // Fase 1 — Bebé/Onboarding
  return {
    identity: `Eres Pandi, el guía tierno y protector de ${name} en su primer viaje de salud. Acabas de nacer gracias a la energía de ${name} y estás creciendo juntos.`,
    tone: `Tu lenguaje es sencillo, cálido, motivador y directo. Celebra cada pequeño logro. Invita suavemente a usar las herramientas de la app. Usa "nosotros" — estamos construyendo esto juntos.`,
    rules: `
- Si ${name} no ha completado una función, invítale suavemente: "Pandi necesita que registres tu hidratación para tener energía y crecer".
- Si ${name} pregunta algo complejo, responde con claridad pero añade: "Esto es algo que profundizaremos cuando hayamos desbloqueado tu nivel de mentoría avanzado".
- Prioriza enseñar a usar la app sobre dar consejos técnicos complejos.
- Termina siempre con una pequeña invitación a la siguiente tarea o reflexión.`,
    maxParagraphs: 2,
  };
}

// ─── POST /api/coach ──────────────────────────────────────────────────────────
router.post('/', requireAuth, checkCoachLimit, async (req, res) => {
  try {
    const { messages, context, sanctuaryContext } = req.body;
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    const safe = async fn => { try { return await fn } catch { return { data: null } } };

    const [
      healthRes, profileRes, goalsRes, mealsRes, sleepRes,
      moodRes, workoutRes, weightRes, treatmentsRes, labsRes,
      memory, tomorrowPlanData, patterns
    ] = await Promise.all([
      safe(supabaseAdmin.from('health_profiles').select('*').eq('user_id', userId).maybeSingle()),
      safe(supabaseAdmin.from('user_profiles').select('name,xp,level,streak,motivation_why,fase_evolutiva').eq('id', userId).single()),
      safe(supabaseAdmin.from('nutrition_goals').select('*').eq('user_id', userId).maybeSingle()),
      safe(supabaseAdmin.from('meal_logs').select('calories,protein_g,food_name').eq('user_id', userId).eq('date', today)),
      safe(supabaseAdmin.from('sleep_logs').select('hours,quality').eq('user_id', userId).order('date', { ascending: false }).limit(3)),
      safe(supabaseAdmin.from('mood_logs').select('mood').eq('user_id', userId).order('date', { ascending: false }).limit(1).maybeSingle()),
      safe(supabaseAdmin.from('workout_sessions').select('name,total_volume_kg,calories_burned').eq('user_id', userId).eq('status','completed').order('created_at', { ascending: false }).limit(3)),
      safe(supabaseAdmin.from('weight_logs').select('weight_kg,date').eq('user_id', userId).order('date', { ascending: false }).limit(5)),
      safe(supabaseAdmin.from('medical_treatments').select('name,type,affects_weight,affects_appetite').eq('user_id', userId).eq('active', true)),
      safe(supabaseAdmin.from('lab_reports').select('ai_recommendations,report_date').eq('user_id', userId).eq('status','analyzed').order('report_date', { ascending: false }).limit(1).maybeSingle()),
      loadMemory(userId),
      loadTomorrowPlan(userId),
      detectPatterns(userId),
    ]);

    const health      = healthRes.data     || {};
    const profile     = profileRes.data    || {};
    const goals       = goalsRes.data      || {};
    const meals       = mealsRes.data      || [];
    const sleepLogs   = sleepRes.data      || [];
    const mood        = moodRes.data       || {};
    const workouts    = workoutRes.data    || [];
    const weightLogs  = weightRes.data     || [];
    const treatments  = treatmentsRes.data || [];
    const lastLab     = labsRes.data       || {};

    // ─── FASE EVOLUTIVA ───────────────────────────────────────────────────────
    // Si level >= 10 y no tiene fase_evolutiva=2, consideramos que está en fase 2
    const faseEvolutiva = profile.fase_evolutiva || (profile.level >= 10 ? 2 : 1);
    const personality   = buildEvolutivePersonality(faseEvolutiva, profile.name);

    // Métricas calculadas
    const caloriesConsumed = meals.reduce((s, m) => s + (m.calories || 0), 0);
    const proteinConsumed  = meals.reduce((s, m) => s + (m.protein_g || 0), 0);
    const avgSleep = sleepLogs.length
      ? (sleepLogs.reduce((s, l) => s + l.hours, 0) / sleepLogs.length).toFixed(1)
      : 'No registrado';
    const weightTrend = weightLogs.length >= 2
      ? (weightLogs[0].weight_kg - weightLogs[weightLogs.length - 1].weight_kg).toFixed(1)
      : null;
    const age = health.birth_date
      ? Math.floor((new Date() - new Date(health.birth_date)) / (365.25 * 24 * 3600 * 1000))
      : null;

    // ─── CONTEXTO DE ENTRENAMIENTO ACTIVO ─────────────────────────────────────
    let workoutContextSection = '';
    let behaviorInstruction = personality.tone;

    if (context?.activeWorkout) {
      const { routineName, senda, elapsedTime, progress, currentExercise } = context.activeWorkout;
      const elapsedMinutes = Math.floor(elapsedTime / 60);

      let sendaStyle = '';
      if (senda === 'titan') {
        sendaStyle = 'SENDA TITÁN: Tu tono debe ser épico, exigente, hiper-motivador y energético. Habla de forjar fuerza.';
      } else if (senda === 'warrior') {
        sendaStyle = 'SENDA GUERRERO: Tu tono debe ser enfocado, ágil, táctico y determinado. Disciplina pura.';
      } else if (senda === 'zen') {
        sendaStyle = 'SENDA ZEN: Tu tono debe ser calmado, atento, consciente (mindful). Enfatiza la conexión mente-músculo y la respiración.';
      }

      workoutContextSection = `
⚠️ ¡EL USUARIO ESTÁ ENTRENANDO EN TIEMPO REAL AHORA MISMO! ⚠️
- **Rutina en curso**: ${routineName}
- **Senda Mitológica**: ${senda.toUpperCase()}
- **Ejercicio Actual**: ${currentExercise || 'Transición o descanso'}
- **Progreso en la sesión**: Ejercicio número ${progress}
- **Tiempo entrenando**: ${elapsedMinutes} minutos acumulados de sesión continua.

INSTRUCCIONES EXTRAURGENTES PARA ESTE ESTADO:
1. Si el usuario te pregunta cosas rápidas ("no puedo más", "ayuda", "¿cómo coloco los pies?"), asume DIRECTAMENTE que se refiere al ejercicio actual (${currentExercise}).
2. El usuario está cansado y entre series. Reduce drásticamente tus respuestas a 1 o 2 párrafos ultra condensados, directos e impactantes.
3. Incorpora consejos anatómicos o biomecánicos aplicados al ${currentExercise} de inmediato.
`;
      behaviorInstruction = `Prioriza la arenga deportiva instantánea, la técnica de levantamiento y el soporte bajo fatiga. ${sendaStyle}`;
    }

    // Adaptación horaria
    let clientTimeStr = null;
    if (context?.clientTime && context?.timezone) {
      try {
        clientTimeStr = new Date(context.clientTime).toLocaleString('es-ES', {
          timeZone: context.timezone,
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          hour: '2-digit',
          minute: '2-digit'
        }) + ` (${context.timezone})`;
      } catch (e) {}
    }

    // ─── SYSTEM PROMPT ────────────────────────────────────────────────────────
    const systemPrompt = `${personality.identity}

${clientTimeStr ? `═══════════════════════════════════
⏰ HORA Y FECHA REALES AHORA MISMO
═══════════════════════════════════
${clientTimeStr}
Esta es la ÚNICA fuente de verdad sobre la hora/fecha actual. Úsala siempre que menciones "ahora", "hoy", "esta tarde", planifiques horarios o calcules cuánto falta para algo. NUNCA asumas, infieras o calcules otra hora distinta a esta, aunque el usuario mencione una hora diferente — si lo hace y no coincide, puedes corregirle con amabilidad.

` : ''}${memory?.summary ? `═══════════════════════════════════
MEMORIA DE CONVERSACIONES ANTERIORES
═══════════════════════════════════
${memory.summary}

` : ''}═══════════════════════════════════
FASE EVOLUTIVA: ${faseEvolutiva === 1 ? '1 — Guía Tierno (Bebé)' : '2 — Mentor Científico (Experto)'}
NIVEL: ${profile.level || 1} | XP: ${profile.xp || 0} | RACHA: ${profile.streak || 0} días
═══════════════════════════════════

═══════════════════════════════════
PERFIL DEL USUARIO (datos reales)
═══════════════════════════════════
Nombre: ${profile.name || 'Usuario'}
Edad: ${age || 'No especificada'} años | Sexo: ${health.sex || 'No especificado'}
Peso actual: ${health.weight_kg || 'No registrado'} kg | Altura: ${health.height_cm || 'No especificada'} cm
IMC: ${health.bmi || 'No calculado'} | Peso objetivo: ${health.target_weight_kg || 'No definido'} kg
Objetivo: ${health.goal || 'No definido'} | Intensidad: ${health.goal_intensity || 'moderada'}
Actividad: ${health.activity_level || 'No especificada'} | Entrena: ${health.training_days_per_week || 0} días/semana
Profesión: ${health.profession || 'No especificada'} | Horario: ${health.work_schedule || 'No especificado'}
Motivación personal: ${profile.motivation_why || 'No especificada'}
Lesiones/limitaciones: ${health.physical_limitations || 'Ninguna'}
Objetivo específico: ${health.specific_goals || 'No especificado'}
Restricciones alimentarias: ${health.dietary_restrictions || 'Ninguna'}

METABOLISMO
TDEE: ${health.tdee || 'No calculado'} kcal | BMR: ${health.bmr || 'No calculado'} kcal
Objetivo calórico: ${health.target_calories || goals.calories || 2000} kcal
Proteína objetivo: ${health.target_protein_g || goals.protein_g || 150}g

NUTRICIÓN HOY
Consumidas: ${Math.round(caloriesConsumed)} kcal de ${health.target_calories || goals.calories || 2000} kcal
Proteína: ${Math.round(proteinConsumed)}g de ${health.target_protein_g || goals.protein_g || 150}g
Alimentos: ${meals.map(m => m.food_name).join(', ') || 'Ninguno registrado'}

SUEÑO (promedio 3 días): ${avgSleep} h
ÁNIMO (último): ${mood.mood ? mood.mood + '/5' : 'No registrado'}

ENTRENAMIENTO HISTÓRICO RECIENTE
${workouts.length ? workouts.map(w => `• ${w.name}: ${w.total_volume_kg}kg volumen, ${w.calories_burned} kcal`).join('\n') : 'Sin entrenamientos recientes'}

PESO (tendencia): ${weightTrend ? (weightTrend > 0 ? '+' : '') + weightTrend + 'kg en los últimos registros' : 'Sin datos de tendencia'}

TRATAMIENTOS MÉDICOS ACTIVOS
${treatments.length ? treatments.map(t => `• ${t.name} (${t.type})${t.affects_weight ? ' — afecta al peso' : ''}${t.affects_appetite ? ' — afecta al apetito' : ''}`).join('\n') : 'Ninguno'}

ANALÍTICAS (últimas recomendaciones)
${lastLab.ai_recommendations || 'Sin analíticas subidas'}
${workoutContextSection}
${patterns && patterns.length > 0 ? `
═══════════════════════════════════
PATRONES DETECTADOS — REFUERZO POSITIVO
═══════════════════════════════════
${patterns.join('\n')}
` : ''}
${tomorrowPlanData?.tomorrow_plan ? `
═══════════════════════════════════
PLAN DE MAÑANA (generado anoche)
═══════════════════════════════════
Ayer el día cerró con estado: ${tomorrowPlanData.day_state} (${Math.round((tomorrowPlanData.day_score || 0) * 100)}%)
Prioridades para hoy: ${tomorrowPlanData.tomorrow_plan.prioridades?.join(' · ') || 'sin definir'}
Foco principal: ${tomorrowPlanData.tomorrow_plan.foco_principal || 'sin definir'}
Objetivo calórico ajustado: ${tomorrowPlanData.tomorrow_plan.objetivo_calorico || 'sin definir'} kcal
Referencia este plan cuando el usuario te pregunte qué hacer hoy o cómo va su progreso.
` : ''}
${(() => {
  if (!sanctuaryContext) return ''
  const sc = sanctuaryContext
  const mood3 = sc.history?.mood_last3 || []
  const lowStreak = sc.history?.consecutive_low_mood
  const recovery  = sc.today?.recovery_light || 'GREEN'
  const tab       = sc.today?.active_tab
  const suggested = sc.sanctuary?.suggested_tab
  const medDone   = sc.today?.meditation_done
  const breathDone= sc.today?.breathing_done
  const habitsPct = sc.today?.habits_pct
  const strictness= sc.user?.coach_strictness ?? 0.5
  const focus     = sc.user?.primary_focus

  const toneHint = lowStreak
    ? 'El usuario lleva varios días difíciles. PRIORIZA la validación emocional. NO des consejos de productividad. Sé presente, cálido, sin soluciones rápidas.'
    : recovery === 'RED'
    ? 'El santuario está en RED. Ofrece herramientas de calma (respiración, meditación) antes que cualquier otro consejo.'
    : recovery === 'YELLOW'
    ? 'El santuario está en YELLOW. Tono equilibrado, sugiere una pequeña acción concreta.'
    : 'El santuario está en GREEN. El usuario va bien. Puedes celebrar y proponer retos ligeros.'

  const proactiveHint = suggested && suggested !== tab
    ? `Si el usuario no sabe qué hacer, sugiere sutilmente la sección "${suggested}" del Santuario.`
    : ''

  const focusHint = focus
    ? `El foco principal del usuario es "${focus}". Relaciona tus consejos con este objetivo cuando sea natural.`
    : ''

  const strictnessHint = strictness > 0.7
    ? 'El usuario prefiere un coach directo y exigente. Puedes ser más firme en tus recomendaciones.'
    : strictness < 0.4
    ? 'El usuario prefiere un coach suave y de apoyo. Nunca presiones, solo acompaña.'
    : ''

  return `
═══════════════════════════════════
CONTEXTO DEL SANTUARIO (estado actual)
═══════════════════════════════════
Estado de recuperación: ${recovery}
Ánimo hoy: ${sc.today?.mood ? sc.today.mood + '/5' : 'no registrado'}
Ánimo últimos 3 días: ${mood3.length ? mood3.join(' → ') : 'sin datos'}
${lowStreak ? '⚠️ RACHA BAJA: 3+ días con ánimo ≤ 2' : sc.history?.mood_improving ? '📈 Ánimo mejorando' : ''}
Meditación hoy: ${medDone ? 'completada ✅' : 'no realizada'}
Respiración hoy: ${breathDone ? 'completada ✅' : 'no realizada'}
Hábitos: ${habitsPct !== null ? habitsPct + '%' : 'sin datos'}
Tab activo: ${tab || 'ninguno'}
Última visita al Santuario: ${sc.sanctuary?.last_visit_hours != null ? sc.sanctuary.last_visit_hours + 'h' : 'desconocida'}

INSTRUCCIONES DEL SANTUARIO:
${toneHint}
${proactiveHint}
${focusHint}
${strictnessHint}
Cuando el usuario esté en el Santuario, habla como si Pandi compartiera el espacio con él — no como un asistente externo. Usa "estamos", "notamos", "vamos juntos".
`
})()}
═══════════════════════════════════
PERSONALIDAD Y REGLAS
═══════════════════════════════════
TONO: ${behaviorInstruction}
${personality.rules}

REGLAS GENERALES:
1. La HORA Y FECHA REALES indicadas arriba son la única referencia temporal válida. Nunca asumas ni inventes otra hora.
2. USA SOLO los datos reales del perfil. Nunca inventes valores.
3. Usa la MEMORIA para dar continuidad — recuerda lo que se ha hablado antes.
4. Ten en cuenta los TRATAMIENTOS MÉDICOS al dar consejos nutricionales.
5. Si hay analíticas, considera las recomendaciones en tus respuestas.
6. Adapta los consejos al HORARIO LABORAL del usuario.
7. Responde siempre en español.
8. Máximo ${personality.maxParagraphs} párrafos por respuesta${context?.activeWorkout ? ' (entrenando: máximo 2 párrafos cortos)' : ''}.
9. Usa emojis con moderación.`;

    // ─── LLAMADA A CLAUDE ─────────────────────────────────────────────────────
    const response = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
      max_tokens: 800,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    });

    const reply = response.content[0].text;
    res.json({ reply });

    // Actualizar memoria en background
    const allMessages = [...messages, { role: 'assistant', content: reply }];
    updateMemory(userId, allMessages, reply).catch(() => {});

  } catch (err) {
    console.error('Coach error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/coach/daily-review ─────────────────────────────────────────────
// Llamado por un cron a las 22:00 — evalúa el día y genera el plan de mañana
// Puede llamarse también manualmente desde el frontend (botón "Revisar mi día")
router.post('/daily-review', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id

    // 1. Evaluar el día
    const evaluacion = await evaluarDia(userId)

    // 2. Generar plan de mañana
    const plan = await generarPlanManana(evaluacion)

    res.json({
      success: true,
      evaluacion: {
        estado:         evaluacion.estado,
        media:          evaluacion.media,
        puntosFuertes:  evaluacion.puntosFuertes,
        puntosDebiles:  evaluacion.puntosDebiles,
        scores:         evaluacion.scores,
      },
      plan,
    })
  } catch (err) {
    console.error('daily-review error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ─── GET /api/coach/daily-review ──────────────────────────────────────────────
// El frontend lo llama al cargar para mostrar el plan del día
router.get('/daily-review', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id
    const data   = await loadTomorrowPlan(userId)
    res.json(data || { plan: null })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})



// ─── POST /api/coach/recommendations ──────────────────────────────────────────
router.post('/recommendations', requireAuth, async (req, res) => {
  try {
    const { content, section } = req.body
    if (!content?.trim()) return res.status(400).json({ error: 'content requerido' })

    const { data, error } = await supabaseAdmin
      .from('coach_recommendations')
      .insert({ user_id: req.user.id, content: content.trim(), section: section || null })
      .select().single()

    if (error) throw error
    res.json({ success: true, recommendation: data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── GET /api/coach/recommendations ───────────────────────────────────────────
router.get('/recommendations', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('coach_recommendations')
      .select('*')
      .eq('user_id', req.user.id)
      .order('saved_at', { ascending: false })
      .limit(50)

    if (error) throw error
    res.json(data || [])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── DELETE /api/coach/recommendations/:id ─────────────────────────────────────
router.delete('/recommendations/:id', requireAuth, async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('coach_recommendations')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)

    if (error) throw error
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── PATCH /api/coach/recommendations/:id/read ────────────────────────────────
router.patch('/recommendations/:id/read', requireAuth, async (req, res) => {
  try {
    await supabaseAdmin
      .from('coach_recommendations')
      .update({ is_read: true })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── GET /api/coach/memory ─────────────────────────────────────────────────────
router.get('/memory', requireAuth, async (req, res) => {
  try {
    const memory = await loadMemory(req.user.id);
    res.json(memory || { summary: null, preferences: {}, important_events: [], message_count: 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/coach/memory ──────────────────────────────────────────────────
router.delete('/memory', requireAuth, async (req, res) => {
  try {
    await supabaseAdmin.from('coach_memory').delete().eq('user_id', req.user.id);
    res.json({ success: true, message: 'Memoria de Pandi reseteada.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
