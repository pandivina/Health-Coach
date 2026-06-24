require('dotenv').config();
const express = require('express');
const cors    = require('cors');

// ─── IMPORTS DE RUTAS ────────────────────────────────────────────────────────
const authRoutes          = require('./routes/auth');
const coachRoutes         = require('./routes/coach');
const nutritionRoutes     = require('./routes/nutrition');
const pantryRoutes        = require('./routes/pantry');
const recipesRoutes       = require('./routes/recipes');
const reportsRoutes       = require('./routes/reports');
const workoutsRoutes      = require('./routes/workouts');
const healthRoutes        = require('./routes/health');
const labsRoutes          = require('./routes/labs');
const achievementsRoutes  = require('./routes/achievements');
const emailRoutes         = require('./routes/email');
const stripeRoutes        = require('./routes/stripe');
const notificationsRoutes = require('./routes/notifications');
const insightsRoutes      = require('./routes/insights');
const tipRoutes           = require('./routes/tip');
const challengesRoutes    = require('./routes/challenges'); // FIX: movido de inline
const pandiRoutes         = require('./routes/pandi');      // FIX: movido de inline
const recoveryRoutes      = require('./routes/recovery');   // FIX: movido de inline

const app  = express();
const PORT = process.env.PORT || 3001;

// ─── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS bloqueado: ${origin}`));
    }
  },
  credentials: true,
}));

// ─── WEBHOOK STRIPE — raw body ANTES de express.json() ───────────────────────
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

// FIX Bloquer 4: reducir body limit de 10mb a 1mb
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ─── HEALTH CHECK ────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── RUTAS ───────────────────────────────────────────────────────────────────
app.use('/api/stripe',        stripeRoutes);
app.use('/api/auth',          authRoutes);
app.use('/api/coach',         coachRoutes);
app.use('/api/nutrition',     nutritionRoutes);
app.use('/api/pantry',        pantryRoutes);
app.use('/api/recipes',       recipesRoutes);
app.use('/api/report',        reportsRoutes);
app.use('/api/workouts',      workoutsRoutes);
app.use('/api/challenges',    challengesRoutes);
app.use('/api/health',        healthRoutes);
app.use('/api/labs',          labsRoutes);
app.use('/api/achievements',  achievementsRoutes);
app.use('/api/email',         emailRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/insights',      insightsRoutes);
app.use('/api/tip',           tipRoutes);
app.use('/api/pandi',         pandiRoutes);
app.use('/api/recovery',      recoveryRoutes);

// FIX Bloquer 3: error handler no expone mensajes internos en producción
app.use((err, req, res, next) => {
  console.error('❌', err.message);
  const isDev    = process.env.NODE_ENV !== 'production';
  const message  = isDev ? err.message : 'Internal server error';
  res.status(err.status || 500).json({ error: message });
});

// FIX Deuda 13: graceful shutdown — Railway no corta requests en vuelo
const server = app.listen(PORT, () => {
  console.log(`🚀 Health Coach API running on port ${PORT}`);
});

// FIX Deuda 9: scheduler ANTES de que el servidor esté listo pero registrado
// correctamente para que el graceful shutdown pueda pararlo
const scheduler = require('./services/scheduler');

function shutdown(signal) {
  console.log(`\n⚠️  ${signal} recibido — cerrando servidor limpiamente...`);
  server.close(() => {
    console.log('✅ Servidor cerrado');
    process.exit(0);
  });
  // Forzar salida si tarda más de 10 segundos
  setTimeout(() => {
    console.error('❌ Forzando cierre tras timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
