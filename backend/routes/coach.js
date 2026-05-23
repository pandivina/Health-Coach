const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const { requireAuth, supabaseAdmin } = require('../middleware/auth');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const FREE_DAILY_LIMIT = 10

// ─── RATE LIMIT ───────────────────────────────────────────────────────────────

async function checkCoachLimit(req, res, next) {
  try {
    const userId = req.user.id
    const today  = new Date().toISOString().split('T')[0]

    const { data: profile } = await supabaseAdmin
      .from('user_profiles').select('is_premium').eq('id', userId).single()

    if (profile?.is_premium) return next()

    const { data: usage } = await supabaseAdmin
      .from('coach_usage').select('count').eq('user_id', userId).eq('date', today).maybeSingle()

    const count = usage?.count || 0

    if (count >= FREE_DAILY_LIMIT) {
      return res.status(429).json({
        error: 'limit_reached',
        message: `Has alcanzado el límite de ${FREE_DAILY_LIMIT} mensajes diarios del plan gratuito.`,
        limit: FREE_DAILY_LIMIT,
        used: count,
      })
    }

    await supabaseAdmin.from('coach_usage').upsert(
      { user_id: userId, date: today, count: count + 1 },
      { onConflict: 'user_id,date' }
    )

    next()
  } catch (err) {
    next()
  }
}

// ─── MEMORIA PERSISTENTE ──────────────────────────────────────────────────────

async function loadMemory(userId) {
  try {
    const { data } = await supabaseAdmin
      .from('coach_memory')
      .select('summary, preferences, important_events')
      .eq('user_id', userId)
      .maybeSingle()
    return data || null
  } catch { return null }
}

async function updateMemory(userId, messages, lastReply) {
  try {
    // Solo actualizar cada 5 mensajes para no sobrecargar
    const { data: existing } = await supabaseAdmin
      .from('coach_memory').select('summary, message_count')
      .eq('user_id', userId).maybeSingle()

    const messageCount = (existing?.message_count || 0) + 1
    if (messageCount % 5 !== 0) {
      // Solo actualizar contador
      await supabaseAdmin.from('coach_memory').upsert({
        user_id: userId,
        message_count: messageCount,
        last_updated: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      return
    }

    // Cada 5 mensajes regenerar resumen con IA
    const lastMessages = messages.slice(-10).map(m =>
      `${m.role === 'user' ? 'Usuario' : 'Coach'}: ${m.content}`
    ).join('\n')

    const summaryRes = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
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
    })

    const newSummary = summaryRes.content[0].text.trim()

    await supabaseAdmin.from('coach_memory').upsert({
      user_id: userId,
      summary: newSummary,
      message_count: messageCount,
      last_updated: new Date().toISOString(),
    }, { onConflict: 'user_id' })

  } catch (err) {
    console.error('Memory update error:', err.message)
  }
}

// ─── POST /api/coach ──────────────────────────────────────────────────────────

router.post('/', requireAuth, checkCoachLimit, async (req, res) => {
  try {
    const { messages } = req.body;
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    const safe = async fn => { try { return await fn } catch { return { data: null } } }

    // Cargar datos del usuario y memoria en paralelo
    const [
      profileRes, healthRes, goalsRes, mealsRes, sleepRes,
      moodRes, workoutRes, weightRes, treatmentsRes, labsRes,
      memory
    ] = await Promise.all([
      safe(supabaseAdmin.from('user_profiles').select('name,xp,level,streak,pet_name,motivation_why').eq('id', userId).single()),
      safe(supabaseAdmin.from('health_profiles').select('*').eq('user_id', userId).single()),
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

    const profile    = profileRes.data   || {};
    const health     = healthRes.data    || {};
    const goals      = goalsRes.data     || {};
    const meals      = mealsRes.data     || [];
    const sleepLogs  = sleepRes.data     || [];
    const mood       = moodRes.data      || {};
    const workouts   = workoutRes.data   || [];
    const weightLogs = weightRes.data    || [];
    const treatments = treatmentsRes.data || [];
    const lastLab    = labsRes.data      || {};

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

    const systemPrompt = `Eres el Coach IA de Health Coach, un asistente de salud personalizado, empático, motivador y con conocimiento clínico. Conoces bien a este usuario y recuerdas vuestras conversaciones anteriores.

${memory?.summary ? `═══════════════════════════════════
MEMORIA DE CONVERSACIONES ANTERIORES
═══════════════════════════════════
${memory.summary}

` : ''}═══════════════════════════════════
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

ENTRENAMIENTO RECIENTE
${workouts.length ? workouts.map(w => `• ${w.name}: ${w.total_volume_kg}kg volumen, ${w.calories_burned} kcal`).join('\n') : 'Sin entrenamientos recientes'}

PESO (tendencia): ${weightTrend ? (weightTrend > 0 ? '+' : '') + weightTrend + 'kg en los últimos registros' : 'Sin datos de tendencia'}

TRATAMIENTOS MÉDICOS ACTIVOS
${treatments.length ? treatments.map(t => `• ${t.name} (${t.type})${t.affects_weight ? ' — afecta al peso' : ''}${t.affects_appetite ? ' — afecta al apetito' : ''}`).join('\n') : 'Ninguno'}

ANALÍTICAS (últimas recomendaciones)
${lastLab.ai_recommendations || 'Sin analíticas subidas'}

GAMIFICACIÓN
Nivel: ${profile.level || 1} | XP: ${profile.xp || 0} | Racha: ${profile.streak || 0} días

═══════════════════════════════════
REGLAS DEL COACH
═══════════════════════════════════
1. USA SOLO los datos reales del perfil. Nunca inventes valores.
2. Usa la MEMORIA para dar continuidad — recuerda lo que se ha hablado antes.
3. Ten en cuenta los TRATAMIENTOS MÉDICOS al dar consejos nutricionales.
4. Si hay analíticas, considera las recomendaciones en tus respuestas.
5. Adapta los consejos al HORARIO LABORAL del usuario.
6. Sé empático, directo y motivador.
7. Responde siempre en español.
8. Máximo 3 párrafos por respuesta.
9. Usa emojis con moderación.`;

    const response = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
      max_tokens: 800,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    });

    const reply = response.content[0].text;
    res.json({ reply });

    // Actualizar memoria en background (sin bloquear respuesta)
    const allMessages = [...messages, { role: 'assistant', content: reply }]
    updateMemory(userId, allMessages, reply).catch(() => {})

  } catch (err) {
    console.error('Coach error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
