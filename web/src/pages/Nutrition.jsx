import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Camera, Hash, ShoppingBag, ChefHat, TrendingUp } from 'lucide-react'
import { useTheme } from '../contexts/ThemeProvider'
import DiarioTab from '../components/nutrition/DiarioTab'
import AnalizarTab from '../components/nutrition/AnalizarTab'
import EscanearTab from '../components/nutrition/EscanearTab'
import DespensaTab from '../components/nutrition/DespensaTab'
import RecetasTab from '../components/nutrition/RecetasTab'
import TendenciasTab from '../components/nutrition/TendenciasTab'

const TABS = [
  { id: 'diario',     icon: BookOpen,    label: 'Diario' },
  { id: 'analizar',   icon: Camera,      label: 'Foto' },
  { id: 'escanear',   icon: Hash,        label: 'Código' },
  { id: 'despensa',   icon: ShoppingBag, label: 'Despensa' },
  { id: 'recetas',    icon: ChefHat,     label: 'Recetas' },
  { id: 'tendencias', icon: TrendingUp,  label: 'Tendencias' },
]

export default function Nutrition() {
  const { theme } = useTheme()
  const [tab, setTab] = useState('diario')

  return (
    <div className="min-h-screen pb-24" style={{ background: theme.bg }}>
      <div className="px-4 pt-6 pb-3">
        <h1 className="text-2xl font-extrabold" style={{ color: theme.text }}>Nutrición 🍎</h1>
        <p className="text-sm" style={{ color: theme.textMuted }}>
          {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      <div className="px-4 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all"
              style={{
                background: tab === t.id ? theme.primary : theme.surface,
                color: tab === t.id ? '#fff' : theme.textMuted,
                border: tab === t.id ? 'none' : `1px solid ${theme.border}`,
                boxShadow: tab === t.id ? `0 4px 12px ${theme.primary}30` : 'none',
              }}>
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            {tab === 'diario'     && <DiarioTab onAnalyze={() => setTab('analizar')} onScan={() => setTab('escanear')} onRecipes={() => setTab('recetas')} />}
            {tab === 'analizar'   && <AnalizarTab onSaved={() => setTab('diario')} />}
            {tab === 'escanear'   && <EscanearTab onSaved={() => setTab('diario')} />}
            {tab === 'despensa'   && <DespensaTab />}
            {tab === 'recetas'    && <RecetasTab />}
            {tab === 'tendencias' && <TendenciasTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
