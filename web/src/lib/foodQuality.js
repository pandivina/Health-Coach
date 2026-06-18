// ─── lib/foodQuality.js ───────────────────────────────────────────────────
// Heurística simple: macros + sano/procesado + combinaciones que sientan mal

const JUNK_KEYWORDS = [
  'frito','fritos','frita','patatas fritas','refresco','soda','cola',
  'bollería','bollo','donut','helado','pizza','hamburguesa','chocolate',
  'dulce','bombones','chuches','galletas','bacon','salchichón','chorizo',
  'nuggets','kebab','perrito','croquetas',
]
const HEALTHY_KEYWORDS = [
  'ensalada','verdura','brócoli','espinaca','pollo','pescado','salmón',
  'merluza','huevo','yogur','fruta','manzana','plátano','quinoa','avena',
  'legumbre','lenteja','garbanzo','tofu','aguacate',
]

function matchAny(name, list) {
  const n = name.toLowerCase()
  return list.some(k => n.includes(k))
}

// entry: { food_name, calories, protein_g }
// todayMeals: comidas ya registradas hoy (antes de esta)
export function computeMealQuality(entry, todayMeals = [], goals = {}) {
  let score = 0.6
  const reasons = []

  const isJunk    = matchAny(entry.food_name, JUNK_KEYWORDS)
  const isHealthy = matchAny(entry.food_name, HEALTHY_KEYWORDS)

  if (isJunk)    { score -= 0.3; reasons.push('procesado') }
  if (isHealthy) { score += 0.25; reasons.push('sano') }

  // Combo malo: 2+ junk en el mismo día
  const junkToday = todayMeals.filter(m => matchAny(m.food_name, JUNK_KEYWORDS)).length
  let badCombo = false
  if (isJunk && junkToday >= 1) {
    score -= 0.25
    badCombo = true
    reasons.push('combo_pesado')
  }

  // Ajuste por objetivo calórico del día
  const totalCalToday = todayMeals.reduce((s, m) => s + (m.calories || 0), 0) + (entry.calories || 0)
  const calorieGoal = goals.calories || 2000
  if (totalCalToday > calorieGoal * 1.15) { score -= 0.1; reasons.push('exceso_calorico') }

  // Proteína buena relativa a calorías
  if (entry.protein_g > 0 && entry.calories > 0 && (entry.protein_g * 4) / entry.calories > 0.3) {
    score += 0.1; reasons.push('alta_proteina')
  }

  score = Math.min(Math.max(score, 0), 1)

  let reaction
  if (score >= 0.75) reaction = 'great'
  else if (score >= 0.5) reaction = 'good'
  else if (score >= 0.3) reaction = 'neutral'
  else if (score >= 0.15) reaction = 'bad'
  else reaction = 'terrible'

  return { score, reaction, badCombo, reasons }
}

export const REACTION_CONFIG = {
  great:    { emoji:'😋', message: '¡Delicioso! Pandi está encantada',     color:'#22C55E' },
  good:     { emoji:'🙂', message: 'Buena elección',                       color:'#2EC4B6' },
  neutral:  { emoji:'😐', message: 'Pandi lo digiere sin problema',        color:'#F59E0B' },
  bad:      { emoji:'😕', message: 'A Pandi le ha sentado un poco pesado', color:'#F97316' },
  terrible: { emoji:'🤢', message: 'Uy… eso le ha sentado mal a Pandi',    color:'#EF4444' },
}

// Estado agregado del día — promedio de todas las comidas registradas hoy
export function computeDayTummyState(meals) {
  if (!meals.length) return 'neutral'
  const avg = meals.reduce((s, m) => s + (m.quality_score ?? 0.6), 0) / meals.length
  if (avg >= 0.75) return 'great'
  if (avg >= 0.5) return 'good'
  if (avg >= 0.3) return 'neutral'
  if (avg >= 0.15) return 'bad'
  return 'terrible'
}
