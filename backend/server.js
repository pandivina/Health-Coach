require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes         = require('./routes/auth');
const coachRoutes        = require('./routes/coach');
const nutritionRoutes    = require('./routes/nutrition');
const pantryRoutes       = require('./routes/pantry');
const recipesRoutes      = require('./routes/recipes');
const reportsRoutes      = require('./routes/reports');
const workoutsRoutes     = require('./routes/workouts');
const healthRoutes       = require('./routes/health');
const labsRoutes         = require('./routes/labs');
const achievementsRoutes = require('./routes/achievements');
const emailRoutes        = require('./routes/email');
const stripeRoutes       = require('./routes/stripe');
const notificationsRoutes = require('./routes/notifications');
const insightsRoutes = require('./routes/insights')
const tipRoutes = require('./routes/tip');

const app = express();
const PORT = process.env.PORT || 3001;

// STRIPE WEBHOOK — antes de express.json() pero DESPUÉS de cors
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim())

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error(`CORS bloqueado: ${origin}`))
    }
  },
  credentials: true,
}))

// Webhook de Stripe — raw body, antes de express.json()
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rutas
app.use('/api/stripe',       stripeRoutes);
app.use('/api/auth',         authRoutes);
app.use('/api/coach',        coachRoutes);
app.use('/api/nutrition',    nutritionRoutes);
app.use('/api/pantry',       pantryRoutes);
app.use('/api/recipes',      recipesRoutes);
app.use('/api/report',       reportsRoutes);
app.use('/api/workouts',     workoutsRoutes);
app.use('/api/challenges', require('./routes/challenges'));
app.use('/api/health',       healthRoutes);
app.use('/api/labs',         labsRoutes);
app.use('/api/achievements', achievementsRoutes);
app.use('/api/email',        emailRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/insights', insightsRoutes)
app.use('/api/tip', tipRoutes);
app.use('/api/pandi', require('./routes/pandi'))

// Error handler
app.use((err, req, res, next) => {
  console.error('❌', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});
require('./services/scheduler')
app.listen(PORT, () => {
  console.log(`🚀 Health Coach API running on port ${PORT}`);
});
