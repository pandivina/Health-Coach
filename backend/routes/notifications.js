const express  = require('express')
const router   = express.Router()
const webpush  = require('web-push')
const { requireAuth, supabaseAdmin } = require('../middleware/auth')

webpush.setVapidDetails(
  'mailto:hola@pandihealthcoach.app',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

// POST /api/notifications/subscribe
router.post('/subscribe', requireAuth, async (req, res) => {
  try {
    const { subscription } = req.body
    if (!subscription) return res.status(400).json({ error: 'No subscription' })
    await supabaseAdmin.from('push_subscriptions').upsert(
      { user_id: req.user.id, subscription },
      { onConflict: 'user_id' }
    )
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// DELETE /api/notifications/unsubscribe
router.delete('/unsubscribe', requireAuth, async (req, res) => {
  try {
    await supabaseAdmin.from('push_subscriptions').delete().eq('user_id', req.user.id)
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

module.exports = router
