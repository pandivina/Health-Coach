// ─── backend/routes/pandi.js ──────────────────────────────────────────────────
// Endpoint centralizado de sincronización del estado de Pandi
// Puede invocarse directamente desde el cliente o en background desde otros endpoints

const express          = require('express')
const router           = express.Router()
const { requireAuth }  = require('../middleware/auth')
const { syncPandiState } = require('../lib/pandiSync')

/**
 * POST /api/pandi/sync
 * Recalcula y persiste el estado de Pandi para el usuario autenticado.
 * Respuesta rápida — el cálculo real es ligero (4 queries paralelas).
 */
router.post('/sync', requireAuth, async (req, res) => {
  try {
    const result = await syncPandiState(req.user.id)
    res.json({ ok: true, ...result })
  } catch (err) {
    console.error('[pandi/sync]', err.message)
    res.status(500).json({ error: err.message })
  }
})

module.exports = router

// ═══════════════════════════════════════════════════════════════════════════════
// PATRÓN DE INVOCACIÓN EN BACKGROUND DESDE OTROS ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════════
//
// Importar en cualquier ruta que modifique datos de salud:
//
//   const { syncPandiState } = require('../lib/pandiSync')
//
// Añadir AL FINAL del handler, DESPUÉS de responder al cliente:
//
//   router.post('/save', requireAuth, async (req, res) => {
//     // 1. Lógica principal
//     await supabaseAdmin.from('meal_logs').insert({ ... })
//
//     // 2. Respuesta inmediata al cliente
//     res.json({ ok: true })
//
//     // 3. Sync de Pandi en background — no bloquea la respuesta
//     syncPandiState(req.user.id).catch(err =>
//       console.error('[pandiSync background]', err.message)
//     )
//   })
//
// Rutas donde añadirlo:
//   - POST /api/nutrition/log   (meal_logs)
//   - POST /api/hydration/log   (hydration_logs)
//   - POST /api/sleep/log       (sleep_logs)
//   - POST /api/mood/log        (mood_logs)
// ═══════════════════════════════════════════════════════════════════════════════
