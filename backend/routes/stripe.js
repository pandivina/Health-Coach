const express = require('express')
const router = express.Router()
const Stripe = require('stripe')
const { requireAuth, supabaseAdmin } = require('../middleware/auth')

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// POST /api/stripe/create-checkout — crear sesión de pago
router.post('/create-checkout', requireAuth, async (req, res) => {
  try {
    const { priceId } = req.body
    const userId = req.user.id

    // Obtener o crear customer de Stripe
    const { data: sub } = await supabaseAdmin
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single()

    let customerId = sub?.stripe_customer_id

    if (!customerId) {
      const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(userId)
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: userId },
      })
      customerId = customer.id
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.CORS_ORIGIN}/premium?success=true`,
      cancel_url: `${process.env.CORS_ORIGIN}/premium?canceled=true`,
      subscription_data: {
        trial_period_days: 7,
        metadata: { supabase_user_id: userId },
      },
      locale: 'es',
    })

    res.json({ url: session.url })
  } catch (err) {
    console.error('Stripe checkout error:', err)
    res.status(500).json({ error: err.message })
  }
})

// POST /api/stripe/portal — portal de gestión de suscripción
router.post('/portal', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id
    const { data: sub } = await supabaseAdmin
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single()

    if (!sub?.stripe_customer_id) {
      return res.status(400).json({ error: 'No subscription found' })
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${process.env.CORS_ORIGIN}/premium`,
    })

    res.json({ url: session.url })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/stripe/status — estado de la suscripción
router.get('/status', requireAuth, async (req, res) => {
  try {
    const { data } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', req.user.id)
      .single()
    res.json(data || { status: 'free' })
  } catch {
    res.json({ status: 'free' })
  }
})

// POST /api/stripe/webhook — eventos de Stripe
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature']
  let event

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature error:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const userId = session.subscription_data?.metadata?.supabase_user_id
          || session.metadata?.supabase_user_id
        if (!userId) break

        const subscription = await stripe.subscriptions.retrieve(session.subscription)

        await supabaseAdmin.from('subscriptions').upsert({
          user_id: userId,
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
          status: subscription.status,
          price_id: subscription.items.data[0].price.id,
          plan: subscription.items.data[0].price.recurring.interval === 'month' ? 'monthly' : 'annual',
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          trial_end: subscription.trial_end
            ? new Date(subscription.trial_end * 1000).toISOString()
            : null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })

        // Marcar como premium en user_profiles
        await supabaseAdmin.from('user_profiles')
          .update({ is_premium: true })
          .eq('id', userId)

        console.log(`✅ New subscription for user ${userId}`)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object
        const { data: sub } = await supabaseAdmin
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscription.id)
          .single()

        if (!sub) break

        await supabaseAdmin.from('subscriptions').update({
          status: subscription.status,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        }).eq('stripe_subscription_id', subscription.id)

        const isActive = ['active', 'trialing'].includes(subscription.status)
        await supabaseAdmin.from('user_profiles')
          .update({ is_premium: isActive })
          .eq('id', sub.user_id)

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        const { data: sub } = await supabaseAdmin
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscription.id)
          .single()

        if (!sub) break

        await supabaseAdmin.from('subscriptions').update({
          status: 'canceled',
          updated_at: new Date().toISOString(),
        }).eq('stripe_subscription_id', subscription.id)

        await supabaseAdmin.from('user_profiles')
          .update({ is_premium: false })
          .eq('id', sub.user_id)

        console.log(`❌ Subscription canceled for user ${sub.user_id}`)
        break
      }
    }

    res.json({ received: true })
  } catch (err) {
    console.error('Webhook handler error:', err)
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
