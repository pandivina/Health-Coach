const express = require('express')
const router  = express.Router()

// Lazy init — evita crash si las env vars no están listas al importar
let _supabase = null
function getDB() {
  if (_supabase) return _supabase
  const { createClient } = require('@supabase/supabase-js')
  _supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
  )
  return _supabase
}

async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'No autorizado' })
  const { data: { user }, error } = await getDB().auth.getUser(token)
  if (error || !user) return res.status(401).json({ error: 'Token inválido' })
  req.user = user
  next()
}

const today = () => new Date().toISOString().split('T')[0]

// GET /api/habits
router.get('/', requireAuth, async (req, res) => {
  try {
    const db = getDB()
    const { data: habits, error } = await db
      .from('habits').select('*')
      .eq('user_id', req.user.id).eq('active', true)
      .order('sort_order', { ascending: true })
    if (error) throw error

    const habitIds = (habits || []).map(h => h.id)
    let logsToday = []
    if (habitIds.length > 0) {
      const { data: logs } = await db.from('habit_logs').select('habit_id, count, date')
        .eq('user_id', req.user.id).eq('date', today()).in('habit_id', habitIds)
      logsToday = logs || []
    }
    const logMap = {}
    logsToday.forEach(l => { logMap[l.habit_id] = l.count })

    const result = await Promise.all((habits || []).map(async h => {
      const streak = await getStreak(h.id, req.user.id, db)
      return { ...h, done_today: (logMap[h.id] || 0) >= h.target_count, streak }
    }))
    res.json(result)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// POST /api/habits
router.post('/', requireAuth, async (req, res) => {
  try {
    const db = getDB()
    const { name, icon, category, frequency, target_days, target_count, color } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'name requerido' })
    const { count } = await db.from('habits').select('*', { count:'exact', head:true })
      .eq('user_id', req.user.id).eq('active', true)
    const { data, error } = await db.from('habits').insert({
      user_id: req.user.id, name: name.trim(),
      icon: icon || '⭐', category: category || 'general',
      frequency: frequency || 'daily',
      target_days: target_days || [1,2,3,4,5,6,7],
      target_count: target_count || 1,
      color: color || '#2EC4B6', sort_order: count || 0,
    }).select().single()
    if (error) throw error
    res.json({ ...data, done_today: false, streak: 0 })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// PUT /api/habits/reorder/bulk — debe ir ANTES de /:id
router.put('/reorder/bulk', requireAuth, async (req, res) => {
  try {
    const { order } = req.body
    if (!Array.isArray(order)) return res.status(400).json({ error: 'order debe ser array' })
    const db = getDB()
    await Promise.all(order.map(({ id, sort_order }) =>
      db.from('habits').update({ sort_order }).eq('id', id).eq('user_id', req.user.id)
    ))
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// PUT /api/habits/:id
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const db = getDB()
    const allowed = ['name','icon','category','frequency','target_days','target_count','color','sort_order']
    const updates = {}
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k] })
    const { data, error } = await db.from('habits').update(updates)
      .eq('id', req.params.id).eq('user_id', req.user.id).select().single()
    if (error) throw error
    res.json(data)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// DELETE /api/habits/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await getDB().from('habits').update({ active: false })
      .eq('id', req.params.id).eq('user_id', req.user.id)
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// POST /api/habits/:id/log
router.post('/:id/log', requireAuth, async (req, res) => {
  try {
    const db = getDB()
    const { data, error } = await db.from('habit_logs').upsert({
      habit_id: req.params.id, user_id: req.user.id,
      date: today(), count: 1, note: req.body.note || null,
      logged_at: new Date().toISOString(),
    }, { onConflict: 'habit_id,date' }).select().single()
    if (error) throw error
    const streak = await getStreak(req.params.id, req.user.id, db)
    res.json({ ...data, streak })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// DELETE /api/habits/:id/log
router.delete('/:id/log', requireAuth, async (req, res) => {
  try {
    await getDB().from('habit_logs').delete()
      .eq('habit_id', req.params.id).eq('user_id', req.user.id).eq('date', today())
    res.json({ success: true, streak: 0 })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

async function getStreak(habitId, userId, db) {
  try {
    const { data: logs } = await db.from('habit_logs').select('date')
      .eq('habit_id', habitId).eq('user_id', userId)
      .order('date', { ascending: false }).limit(60)
    if (!logs?.length) return 0
    const dates = logs.map(l => l.date)
    let streak = 0
    for (let i = 0; i < 60; i++) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const ds = d.toISOString().split('T')[0]
      if (dates.includes(ds)) { streak++ } else { break }
    }
    return streak
  } catch { return 0 }
}

module.exports = router
