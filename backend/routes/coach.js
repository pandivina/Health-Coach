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
      .from('coach_memory').select('summary, message_count')
      .eq('user_id', userId).maybeSingle();

    const messageCount = (existing?.message_count || 0) + 1;
    if (messageCount % 5 !== 0) {
      await supabaseAdmin.from('coach_memory').upsert({
        user_id: userId,
        message_count: messageCount,
        last_updated: new Date().toISOString(),
      }, { onConflict: 'user_id' });
      return;
    }

    const lastMessages = messages.slice(-10).map(m =>
      `${m.role === 'user' ? 'Usuario' : 'Coach'}: ${m.content}`
    ).join('\n');

    const summaryRes = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5',
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: `Eres un asistente que resume conversaciones de salud. 
Resumen anterior: ${existing?.summary || 'Sin resumen previo'}

Últimos mensajes:
${lastMessages}

Genera un resumen actualizado MUY CONCISO (máx 200 palabras) que incluya:
- Objetivos y preocupaciones del usuario
- Preferencias detectadas (alimentos, rutinas, horarios)
- Eventos importantes mencionados
- Contexto relevante para futuras conversaciones

Solo el texto del resumen, sin introducción.`
      }]
    });

    const newSummary = summaryRes.content[0].text.trim();

    await supabaseAdmin.from('coach_memory').upsert({
      user_id: userId,
      summary: newSummary,
      message_count: messageCount,
      last_updated: new Date().toISOString(),
    }, { onConflict: 'user_id' });

  } catch (err) {
    console.error('Memory update error:', err.message);
  }
}

// ─── SYSTEM PROMPT EVOLUTIVO ──────────────────────────────────────────────────
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
    const { messages, context } = req.body;
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    const safe = async fn => { try { return await fn } catch { return { data: null } } };

    const [
      healthRes, profileRes, goalsRes, mealsRes, sleepRes,
      moodRes, workoutRes, weightRes, treatmentsRes, labsRes,
      memory
    ] = await Promise.all([
      safe(supabaseAdmin.from('health_profiles').select('*').eq('user_id', userId).maybeSingle()),
      // ← Añadido fase_evolutiva y level al select
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
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5',
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

module.exports = router;
