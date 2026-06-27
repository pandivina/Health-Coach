import { useState } from 'react'
import { BookOpen, ShoppingBag, ChefHat, Camera, Barcode, Plus } from 'lucide-react'
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
  { id: 'diario',   icon: BookOpen,    label: 'Diario'   },
  { id: 'despensa', icon: ShoppingBag, label: 'Despensa' },
  { id: 'recetas',  icon: ChefHat,     label: 'Recetas'  },
]

export default function Nutrition() {
  const { theme } = useTheme()
  const [tab,             setTab]             = useState('diario')
  const [showAddModal,    setShowAddModal]    = useState(false)
  const [nutritionSummary, setNutritionSummary] = useState({
    caloriesConsumed: 0, caloriesTarget: 2000,
    proteinConsumed: 0,  proteinTarget: 150,
    carbsConsumed: 0,    fatConsumed: 0, lastMeal: null,
  })

  useTour('nutrition')
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

  const ACTIONS = [
    { icon: Camera,  label: 'Foto',   action: () => setTab('analizar'), color: '#6366F1' },
    { icon: Barcode, label: 'Código', action: () => setTab('escanear'), color: '#F97316' },
    { icon: Plus,    label: 'Añadir', action: () => setShowAddModal(true), color: theme.primary },
  ]

  return (
    <div className="min-h-screen pb-24" style={{ background: theme.bg }}>

      {/* Header */}
      <div className="px-4 pt-6 pb-3">
        <h1 className="text-2xl font-extrabold" style={{ color: theme.text }}>Nutrición 🍎</h1>
        <p className="text-sm" style={{ color: theme.textMuted }}>
          {new Date().toLocaleDateString('es-ES', { weekday:'long', day:'numeric', month:'long' })}
        </p>
        <PandiContextualBubble section="nutrition" data={{
          cals:        nutritionSummary.caloriesConsumed,
          goal:        nutritionSummary.caloriesTarget,
          protein:     nutritionSummary.proteinConsumed,
          proteinGoal: nutritionSummary.proteinTarget,
        }} />
      </div>

      {/* Tab bar */}
      <div className="px-4 mb-3" data-tour="nutrition-tabs">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
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

      {/* Acciones rápidas — solo en Diario */}
      {tab === 'diario' && (
        <div className="px-4 mb-4">
          <div className="grid grid-cols-3 gap-2" data-tour="nutrition-add">
            {ACTIONS.map(({ icon: Icon, label, action, color }) => (
              <motion.button key={label} whileTap={{ scale:0.95 }} onClick={action}
                className="flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all"
                style={{ background: theme.surface, border:`1px solid ${theme.border}` }}>
                <div style={{ width:36, height:36, borderRadius:12, background: color + '18',
                  display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Icon size={18} style={{ color }} />
                </div>
                <span className="text-[11px] font-semibold" style={{ color: theme.textMuted }}>
                  {label}
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Contenido de tabs */}
      <div className="px-4">
        <AnimatePresence mode="wait">
          <motion.div key={`tab-${tab}`}
            initial={{ opacity:0 }} animate={{ opacity:1 }}
            exit={{ opacity:0 }} transition={{ duration:0.2 }}>
            {tab === 'diario'   && (
              <DiarioTab
                showAddModal={showAddModal}
                onCloseAddModal={() => setShowAddModal(false)}
                onAnalyze={() => setTab('analizar')}
                onScan={() => setTab('escanear')}
                onSummaryChange={setNutritionSummary}
              />
            )}
            {tab === 'analizar' && <AnalizarTab onSaved={() => setTab('diario')} />}
            {tab === 'escanear' && <EscanearTab onSaved={() => setTab('diario')} />}
            {tab === 'despensa' && <DespensaTab />}
            {tab === 'recetas'  && <RecetasTab />}
          </motion.div>
        </AnimatePresence>
      </div>

      <TourHelpButton tourKey="nutrition" />
      <PandiTips section="nutrition" />
    </div>
  )
}
