import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Camera, Hash, ShoppingBag, ChefHat, TrendingUp } from 'lucide-react'
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
  const [tab, setTab] = useState('diario')

  return (
    <div className="min-h-screen bg-[#0a0a12] pb-24">
      {/* Header */}
      <div className="px-4 pt-6 pb-3">
        <h1 className="text-2xl font-extrabold">Nutrición 🍎</h1>
        <p className="text-white/40 text-sm">
          {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Tab bar horizontal scroll */}
      <div className="px-4 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                tab === t.id
                  ? 'bg-accent text-white shadow-lg shadow-accent/30'
                  : 'bg-surface-2 text-white/50 border border-white/5'
              }`}>
              <t.icon size={14} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4">
        <AnimatePresence mode="wait">
          <motion.div key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}>
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
