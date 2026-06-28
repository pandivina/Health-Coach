// backend/lib/nutriscore.js
// Calcula Nutri-Score estimado basado en macros /100g
// Algoritmo simplificado cuando no hay datos completos (azúcares, saturadas, sodio)

function calcNutriScore({ calories = 0, protein = 0, carbs = 0, fat = 0, fiber = 0, sugar = null, saturatedFat = null, sodium = null }) {
  // ── Puntos negativos ──────────────────────────────────────────────────────
  // Energía (kcal/100g)
  const energyPoints = energyScore(calories)
  // Azúcares: si no hay dato, estimamos 50% de los carbos
  const sugarVal = sugar !== null ? sugar : carbs * 0.5
  const sugarPoints = sugarScore(sugarVal)
  // Grasa saturada: si no hay dato, estimamos 40% de la grasa total
  const satFatVal = saturatedFat !== null ? saturatedFat : fat * 0.4
  const satFatPoints = satFatScore(satFatVal)
  // Sodio: si no hay dato usamos 0 (no penaliza pero es estimado)
  const sodiumPoints = sodium !== null ? sodiumScore(sodium) : 0

  const negative = energyPoints + sugarPoints + satFatPoints + sodiumPoints

  // ── Puntos positivos ──────────────────────────────────────────────────────
  const fiberPoints   = fiberScore(fiber || 0)
  const proteinPoints = proteinScore(protein || 0)
  // Frutas/verduras: sin dato = 0
  const fruitsPoints  = 0

  // Si puntos negativos >= 11 y frutas < 5, proteína no cuenta
  let positive = fiberPoints + fruitsPoints
  if (negative < 11) positive += proteinPoints

  const score = negative - positive

  // ── Grado ─────────────────────────────────────────────────────────────────
  let grade, color, bg
  if      (score <= -1)  { grade='A'; color='#1A7A4A'; bg='#D1FAE5' }
  else if (score <= 2)   { grade='B'; color='#4CAF50'; bg='#DCFCE7' }
  else if (score <= 10)  { grade='C'; color='#F59E0B'; bg='#FEF9C3' }
  else if (score <= 18)  { grade='D'; color='#F97316'; bg='#FFEDD5' }
  else                   { grade='E'; color='#EF4444'; bg='#FEE2E2' }

  return { grade, score, color, bg,
    estimated: sugar === null || saturatedFat === null }
}

function energyScore(kcal) {
  const thresholds = [335,670,1005,1340,1675,2010,2345,2680,3015,3350]
  return thresholds.findIndex(t => kcal < t) === -1 ? 10 : thresholds.findIndex(t => kcal < t)
}
function sugarScore(g) {
  const t = [4.5,9,13.5,18,22.5,27,31,36,40,45]
  return t.findIndex(v => g < v) === -1 ? 10 : t.findIndex(v => g < v)
}
function satFatScore(g) {
  const t = [1,2,3,4,5,6,7,8,9,10]
  return t.findIndex(v => g < v) === -1 ? 10 : t.findIndex(v => g < v)
}
function sodiumScore(mg) {
  const t = [90,180,270,360,450,540,630,720,810,900]
  return t.findIndex(v => mg < v) === -1 ? 10 : t.findIndex(v => mg < v)
}
function fiberScore(g) {
  const t = [0.9,1.9,2.8,3.7,4.7]
  return t.findIndex(v => g < v) === -1 ? 5 : t.findIndex(v => g < v)
}
function proteinScore(g) {
  const t = [1.6,3.2,4.8,6.4,8.0]
  return t.findIndex(v => g < v) === -1 ? 5 : t.findIndex(v => g < v)
}

module.exports = { calcNutriScore }
