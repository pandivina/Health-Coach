require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const coachRoutes = require('./routes/coach');
const nutritionRoutes = require('./routes/nutrition');
const pantryRoutes = require('./routes/pantry');
const recipesRoutes = require('./routes/recipes');
const reportsRoutes = require('./routes/reports');
const workoutsRoutes = require('./routes/workouts');
const healthRoutes  = require('./routes/health');
const labsRoutes    = require('./routes/labs');
const achievementsRoutes = require('./routes/achievements');
const emailRoutes = require('./routes/email');
app.use('/api/email', emailRoutes);

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──────────────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Health check ────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Routes ──────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/coach',     coachRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/pantry',    pantryRoutes);
app.use('/api/recipes',   recipesRoutes);
app.use('/api/report',    reportsRoutes);
app.use('/api/workouts', workoutsRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/labs',   labsRoutes);
app.use('/api/achievements', achievementsRoutes);

// ── Error handler ───────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// ── Start ───────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Health Coach API running on port ${PORT}`);
});
