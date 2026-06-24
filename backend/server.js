require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');

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
const challengesRoutes    = require('./routes/challenges');
const pandiRoutes         = require('./routes/pandi');
const recoveryRoutes      = require('./routes/recovery');

const app  = express();
const PORT = process.env.PORT || 3001;

// ─── SEGURIDAD: HELMET — headers HTTP seguros ─────────────────────────────────
// Protege contra clickjacking, XSS via headers, MIME sniffing, etc.
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // permite assets desde CDN
  contentSecurityPolicy: false, // desactivado — la app React maneja su propio CSP
}));

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

// ─── SEGURIDAD: RATE LIMITING ─────────────────────────────────────────────────

// General: 120 req/min por IP — protege todas las rutas
const generalLimiter = rateLimit({
  windowMs:        60 * 1000,
  max:             120,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { error: 'Demasiadas peticiones. Espera un momento.' },
  skip: (req) => req.path === '/health', // el health check no cuenta
});

// Coach IA: 15 req/min — cada petición consume tokens de Claude
const coachLimiter = rateLimit({
  windowMs:        60 * 1000,
  max:             15,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { error: 'Límite de consultas al coach alcanzado. Espera un minuto.' },
  keyGenerator:    (req) => req.headers['x-user-id'] || req.ip, // por usuario, no por IP
});

// Auth: 10 intentos/15min — previene brute force de login
const authLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             10,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { error: 'Demasiados intentos. Espera 15 minutos.' },
});

app.use(generalLimiter);

// ─── WEBHOOK STRIPE — raw body ANTES de express.json() ───────────────────────
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

// Body limit reducido a 1mb (era 10mb — vector DoS)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ─── HEALTH CHECK ────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── RUTAS ───────────────────────────────────────────────────────────────────
app.use('/api/stripe',        stripeRoutes);
app.use('/api/auth',          authLimiter, authRoutes);      // rate limit estricto
app.use('/api/coach',         coachLimiter, coachRoutes);    // rate limit por usuario
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

// ─── ERROR HANDLER — no expone internos en producción ────────────────────────
app.use((err, req, res, next) => {
  console.error('❌', err.message);
  const isDev   = process.env.NODE_ENV !== 'production';
  const message = isDev ? err.message : 'Internal server error';
  res.status(err.status || 500).json({ error: message });
});

// ─── SERVIDOR + GRACEFUL SHUTDOWN ────────────────────────────────────────────
require('./services/scheduler');

const server = app.listen(PORT, () => {
  console.log(`🚀 Health Coach API running on port ${PORT}`);
});

function shutdown(signal) {
  console.log(`\n⚠️  ${signal} — cerrando servidor limpiamente...`);
  server.close(() => {
    console.log('✅ Servidor cerrado');
    process.exit(0);
  });
  setTimeout(() => {
    console.error('❌ Forzando cierre tras timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
