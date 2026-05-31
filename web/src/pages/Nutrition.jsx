import { useState } from 'react'
import { BookOpen, ShoppingBag, ChefHat } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../contexts/ThemeProvider'
import { useTour } from '../hooks/useTour'
import { useSectionContext } from '../hooks/useSectionContext'
import TourHelpButton from '../components/tour/TourHelpButton'
import DiarioTab from '../components/nutrition/DiarioTab'
import AnalizarTab from '../components/nutrition/AnalizarTab'
import EscanearTab from '../components/nutrition/EscanearTab'
import DespensaTab from '../components/nutrition/DespensaTab'
import RecetasTab from '../components/nutrition/RecetasTab'
import TendenciasTab from '../components/nutrition/TendenciasTab'
import PandiContextualBubble from '../components/PandiContextualBubble'
import PandiTips from '../components/PandiTips'

const TABS = [
  { id: 'diario',   icon: BookOpen,    label: 'Diario',   tour: 'nutrition-diary'   },
  { id: 'despensa', icon: ShoppingBag, label: 'Despensa', tour: 'nutrition-pantry'  },
  { id: 'recetas',  icon: ChefHat,     label: 'Recetas',  tour: 'nutrition-recipes' },
]

export default function Nutrition() {
  const { theme } = useTheme()
  const [tab, setTab]                       = useState('diario')
  const [showTendencias, setShowTendencias] = useState(false)

  // Estado elevado desde DiarioTab para que el coach lo vea
  const [nutritionSummary, setNutritionSummary] = useState({
    caloriesConsumed: 0,
    caloriesTarget:   2000,
    proteinConsumed:  0,
    proteinTarget:    150,
    carbsConsumed:    0,
    fatConsumed:      0,
    lastMeal:         null,
  })

  useTour('nutrition')

  // ── Coach ve: sección actual + macros en tiempo real ─────────────────────
  useSectionContext('nutrition', {
    activeTab:        tab,
    caloriesConsumed: nutritionSummary.caloriesConsumed,
    caloriesTarget:   nutritionSummary.caloriesTarget,
    proteinConsumed:  nutritionSummary.proteinConsumed,
    proteinTarget:    nutritionSummary.proteinTarget,
    carbsConsumed:    nutritionSummary.carbsConsumed,
    fatConsumed:      nutritionSummary.fatConsumed,
    lastMeal:         nutritionSummary.lastMeal,
  })

  return (
    <div className="min-h-screen pb-24" style={{ background: theme.bg }}>
      <div className="px-4 pt-6 pb-3">
        <h1 className="text-2xl font-extrabold" style={{ color: theme.text }}>Nutrición 🍎</h1>
        <p className="text-sm" style={{ color: theme.textMuted }}>
          {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <PandiContextualBubble section="nutrition" data={{
          cals:        nutritionSummary.caloriesConsumed,
          goal:        nutritionSummary.caloriesTarget,
          protein:     nutritionSummary.proteinConsumed,
          proteinGoal: nutritionSummary.proteinTarget,
        }} />
      </div>

      {/* Tab bar */}
      <div className="px-4 mb-4" data-tour="nutrition-tabs">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              data-tour={t.tour || undefined}
              className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all"
              style={{
                background: tab === t.id ? theme.primary : theme.surface,
                color:      tab === t.id ? '#fff' : theme.textMuted,
                border:     tab === t.id ? 'none' : `1px solid ${theme.border}`,
                boxShadow:  tab === t.id ? `0 4px 12px ${theme.primary}30` : 'none',
              }}>
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4">
        <AnimatePresence mode="wait">
          <motion.div key={tab}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            {tab === 'diario'   && (
              <DiarioTab
                onAnalyze={() => setTab('analizar')}
                onScan={() => setTab('escanear')}
                onRecipes={() => setTab('recetas')}
                onSummaryChange={setNutritionSummary}  // ← nuevo prop
              />
            )}
            {tab === 'analizar' && <AnalizarTab onSaved={() => setTab('diario')} />}
            {tab === 'escanear' && <EscanearTab onSaved={() => setTab('diario')} />}
            {tab === 'despensa' && <DespensaTab />}
            {tab === 'recetas'  && <RecetasTab />}
          </motion.div>
        </AnimatePresence>
      </div>

      {tab === 'diario' && (
        <div className="mt-4">
          <button onClick={() => setShowTendencias(s => !s)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold"
            style={{ background: theme.surface2, color: theme.textMuted }}>
            <span>📈 Ver tendencias semanales</span>
            <span>{showTendencias ? '▲' : '▼'}</span>
          </button>
          {showTendencias && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3">
              <TendenciasTab />
            </motion.div>
          )}
        </div>
      )}

      <TourHelpButton tourKey="nutrition" />
      <PandiTips section="nutrition" />
    </div>
  )
}
