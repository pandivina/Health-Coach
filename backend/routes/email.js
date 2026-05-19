const express = require('express');
const router = express.Router();
const { Resend } = require('resend');
const { requireAuth, supabaseAdmin } = require('../middleware/auth');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'Health Coach <hola@pandihealthcoach.app>';

// ── TEMPLATES ────────────────────────────────────────────────

function welcomeEmail({ name, goal, calories }) {
  const GOAL_LABELS = {
    lose_fat: 'perder grasa 🔥',
    gain_muscle: 'ganar músculo 💪',
    define: 'definición ✂️',
    recomp: 'recomposición 🔄',
    maintain: 'mantener peso ⚖️',
    health: 'salud general ❤️',
  }
  const goalLabel = GOAL_LABELS[goal] || 'mejorar tu salud'

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenido a Health Coach</title>
</head>
<body style="margin:0;padding:0;background:#F5F7FA;font-family:'Segoe UI',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F7FA;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- HEADER -->
        <tr><td style="background:linear-gradient(135deg,#2EC4B6,#FF8FA3);border-radius:20px 20px 0 0;padding:40px;text-align:center;">
          <div style="font-size:52px;margin-bottom:12px;">🐼</div>
          <h1 style="color:#fff;margin:0;font-size:26px;font-weight:800;letter-spacing:-0.5px;">
            ¡Bienvenido a Health Coach!
          </h1>
          <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:15px;">
            Tu coach de salud con IA está listo
          </p>
        </td></tr>

        <!-- BODY -->
        <tr><td style="background:#fff;padding:36px 40px;">
          <p style="color:#1F2937;font-size:16px;margin:0 0 16px;">
            Hola <strong>${name || 'campeón'}</strong> 👋
          </p>
          <p style="color:#6B7280;font-size:15px;line-height:1.7;margin:0 0 24px;">
            Tu perfil está listo. Hemos configurado tu plan personalizado para
            <strong style="color:#1F2937;">${goalLabel}</strong>
            ${calories ? `con un objetivo de <strong style="color:#2EC4B6;">${calories} kcal/día</strong>` : ''}.
          </p>

          <!-- STEPS -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
            ${[
              ['🍎', 'Registra tu primera comida', 'Usa el diario, la cámara o el escáner de código de barras.'],
              ['🤖', 'Habla con tu Coach IA', 'Pregúntale lo que quieras — conoce tu perfil completo.'],
              ['💪', 'Completa tu primer entreno', 'Rutinas personalizadas con seguimiento de récords.'],
            ].map(([emoji, title, desc]) => `
            <tr><td style="padding:12px 0;border-bottom:1px solid #F3F4F6;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:24px;padding-right:14px;vertical-align:middle;">${emoji}</td>
                  <td>
                    <p style="margin:0;color:#1F2937;font-weight:600;font-size:14px;">${title}</p>
                    <p style="margin:4px 0 0;color:#6B7280;font-size:13px;">${desc}</p>
                  </td>
                </tr>
              </table>
            </td></tr>`).join('')}
          </table>

          <!-- CTA -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding:8px 0 28px;">
              <a href="https://pandihealthcoach.app/home"
                style="display:inline-block;background:linear-gradient(135deg,#2EC4B6,#FF8FA3);color:#fff;
                text-decoration:none;font-weight:700;font-size:15px;padding:14px 36px;
                border-radius:12px;letter-spacing:0.2px;">
                Abrir Health Coach →
              </a>
            </td></tr>
          </table>

          <!-- PREMIUM -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0FFFE;border:1px solid #2EC4B620;border-radius:12px;margin-bottom:24px;">
            <tr><td style="padding:18px 20px;">
              <p style="margin:0 0 6px;color:#1F2937;font-weight:700;font-size:14px;">⭐ 7 días Premium incluidos</p>
              <p style="margin:0;color:#6B7280;font-size:13px;line-height:1.5;">
                Tienes acceso completo a todas las funciones Premium durante 7 días:
                análisis de fotos, escáner, recetas con IA e interpretación de analíticas.
              </p>
            </td></tr>
          </table>

          <!-- DISCLAIMER -->
          <p style="color:#9CA3AF;font-size:12px;line-height:1.6;margin:0;">
            ⚕️ <em>Health Coach es una herramienta de apoyo al bienestar personal.
            La información generada por la IA es orientativa y no sustituye el consejo
            de un profesional de la salud.</em>
          </p>
        </td></tr>

        <!-- FOOTER -->
        <tr><td style="background:#F5F7FA;border-radius:0 0 20px 20px;padding:24px 40px;text-align:center;">
          <p style="color:#9CA3AF;font-size:12px;margin:0 0 8px;">
            Hecho con ❤️ en España · Powered by Anthropic Claude
          </p>
          <p style="color:#9CA3AF;font-size:12px;margin:0;">
            <a href="https://pandihealthcoach.app/privacy" style="color:#2EC4B6;text-decoration:none;">Privacidad</a>
            &nbsp;·&nbsp;
            <a href="https://pandihealthcoach.app/terms" style="color:#2EC4B6;text-decoration:none;">Términos</a>
            &nbsp;·&nbsp;
            <a href="https://pandihealthcoach.app/disclaimer" style="color:#2EC4B6;text-decoration:none;">Aviso médico</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ── ENDPOINTS ────────────────────────────────────────────────

// POST /api/email/welcome — llamado desde el frontend tras completar onboarding
router.post('/welcome', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id

    // Obtener datos del usuario
    const [profileRes, healthRes] = await Promise.all([
      supabaseAdmin.from('user_profiles').select('name').eq('id', userId).single(),
      supabaseAdmin.from('health_profiles').select('goal, target_calories').eq('user_id', userId).single(),
    ])

    const name = profileRes.data?.name || 'Campeón'
    const goal = healthRes.data?.goal
    const calories = healthRes.data?.target_calories

    // Obtener email del usuario
    const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(userId)
    const email = user?.email

    if (!email) return res.status(400).json({ error: 'No email found' })

    const { data, error } = await resend.emails.send({
      from: FROM,
      to: email,
      subject: `¡Bienvenido a Health Coach, ${name}! 🐼`,
      html: welcomeEmail({ name, goal, calories }),
    })

    if (error) throw error

    res.json({ success: true, id: data.id })
  } catch (err) {
    console.error('Email error:', err)
    res.status(500).json({ error: err.message })
  }
})

// POST /api/email/test — para probar desde Postman o Railway
router.post('/test', async (req, res) => {
  try {
    const { to } = req.body
    if (!to) return res.status(400).json({ error: 'Missing to' })

    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject: '✅ Test email — Health Coach',
      html: welcomeEmail({ name: 'Tester', goal: 'lose_fat', calories: 1800 }),
    })

    if (error) throw error
    res.json({ success: true, id: data.id })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
