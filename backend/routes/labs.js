const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const { requireAuth, supabaseAdmin } = require('../middleware/auth');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// POST /api/labs/analyze — subir analítica (texto o imagen) y analizar con IA
router.post('/analyze', requireAuth, async (req, res) => {
  try {
    const { rawText, imageBase64, mediaType, reportDate, title } = req.body;
    const userId = req.user.id;

    // Crear el informe
    const { data: report, error: rErr } = await supabaseAdmin.from('lab_reports').insert({
      user_id: userId,
      report_date: reportDate || new Date().toISOString().split('T')[0],
      title: title || 'Analítica',
      raw_text: rawText || '',
      status: 'pending',
    }).select().single();
    if (rErr) throw rErr;

    // Obtener perfil del usuario
    const { data: profile } = await supabaseAdmin
      .from('health_profiles').select('sex,birth_date,goal').eq('user_id', userId).single();

    const age = profile?.birth_date
      ? Math.floor((new Date() - new Date(profile.birth_date)) / (365.25 * 24 * 3600 * 1000))
      : null;

    // Preparar contenido para Claude
    const userContent = []
    if (imageBase64 && mediaType) {
      userContent.push({ type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } })
    }
    userContent.push({
      type: 'text',
      text: `Analiza esta analítica de sangre/orina. El paciente tiene ${age ? age + ' años' : 'edad desconocida'}, sexo: ${profile?.sex || 'desconocido'}, objetivo: ${profile?.goal || 'salud general'}.

${rawText ? 'Texto de la analítica:\n' + rawText : 'Analiza la imagen de la analítica.'}

Devuelve SOLO JSON válido con este formato exacto:
{
  "interpretation": "resumen claro y empático de los resultados (2-3 párrafos)",
  "recommendations": "recomendaciones nutricionales y de estilo de vida basadas en los resultados",
  "markers": [
    {
      "name": "nombre del marcador",
      "value": número,
      "unit": "unidad",
      "reference_min": número o null,
      "reference_max": número o null,
      "status": "low|normal|high|critical",
      "category": "hierro|vitaminas|glucosa|colesterol|tiroides|renal|hepatico|general"
    }
  ]
}
Sin texto extra, solo JSON.`
    })

    const response = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-opus-4-5',
      max_tokens: 2000,
      messages: [{ role: 'user', content: userContent }],
    });

    const raw = response.content[0].text.trim().replace(/```json|```/g, '').trim();
    const result = JSON.parse(raw);

    // Actualizar informe con interpretación
    await supabaseAdmin.from('lab_reports').update({
      ai_interpretation: result.interpretation,
      ai_recommendations: result.recommendations,
      status: 'analyzed',
    }).eq('id', report.id);

    // Guardar marcadores
    if (result.markers?.length) {
      const markers = result.markers.map(m => ({
        ...m,
        report_id: report.id,
        user_id: userId,
      }));
      await supabaseAdmin.from('lab_markers').insert(markers);
    }

    res.json({ report: { ...report, ...result }, markers: result.markers });
  } catch (err) {
    console.error('Labs error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/labs/reports
router.get('/reports', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('lab_reports')
      .select('*, lab_markers(*)')
      .eq('user_id', req.user.id)
      .order('report_date', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/labs/reports/:id
router.delete('/reports/:id', requireAuth, async (req, res) => {
  try {
    await supabaseAdmin.from('lab_reports').delete()
      .eq('id', req.params.id).eq('user_id', req.user.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
