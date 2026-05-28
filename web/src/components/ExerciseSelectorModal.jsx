import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search } from 'lucide-react'
import { useTheme } from '../contexts/ThemeProvider'
import { getAllByPath } from '../data/exerciseLibrary'

const PATH_LABELS = { titan: '🦍 Titán', warrior: '⚡ Guerrero', zen: '🧘 Zen' }

export default function ExerciseSelectorModal({ isOpen, onClose, currentPath = 'titan', onSelectExercise }) {
  const { theme }    = useTheme()
  const [search,     setSearch]     = useState('')
  const [activePath, setActivePath] = useState(currentPath)

  const exercises = getAllByPath(activePath)
  const filtered  = exercises.filter(ex =>
    ex.name.toLowerCase().includes(search.toLowerCase()) ||
    ex.category.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={onClose}>
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="w-full max-w-lg rounded-t-3xl flex flex-col"
            style={{ background: theme.bg, maxHeight: '85vh' }}
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-center justify-between p-4 pb-2">
              <p className="font-extrabold text-base" style={{ color: theme.text }}>
                📖 Añadir ejercicio
              </p>
              <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: theme.surface2 }}>
                <X size={15} style={{ color: theme.textMuted }} />
              </button>
            </div>

            {/* Selector de senda */}
            <div className="flex gap-2 px-4 pb-2">
              {Object.entries(PATH_LABELS).map(([id, label]) => (
                <button key={id} onClick={() => setActivePath(id)}
                  className="flex-1 py-1.5 rounded-xl text-xs font-bold transition-all"
                  style={{
                    background: activePath === id ? theme.primary : theme.surface2,
                    color:      activePath === id ? '#fff' : theme.textMuted,
                  }}>
                  {label}
                </button>
              ))}
            </div>

            {/* Búsqueda */}
            <div className="px-4 pb-2">
              <div className="flex items-center gap-2 rounded-xl px-3 py-2"
                style={{ background: theme.surface2 }}>
                <Search size={14} style={{ color: theme.textMuted, flexShrink: 0 }} />
                <input
                  type="text" placeholder="Buscar ejercicio o grupo muscular…"
                  value={search} onChange={e => setSearch(e.target.value)}
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: theme.text }} />
              </div>
            </div>

            {/* Lista */}
            <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-2">
              {filtered.length === 0 ? (
                <p className="text-center py-8 text-sm" style={{ color: theme.textMuted }}>
                  No se encontraron ejercicios
                </p>
              ) : (
                filtered.map(ex => (
                  <motion.button key={ex.id} whileTap={{ scale: 0.98 }}
                    onClick={() => { onSelectExercise(ex); onClose() }}
                    className="w-full text-left rounded-2xl p-3 flex items-center gap-3 transition-all"
                    style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ background: theme.surface2 }}>
                      {ex.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-sm" style={{ color: theme.text }}>{ex.name}</p>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full"
                          style={{ background: `${theme.primary}20`, color: theme.primary }}>
                          {ex.category}
                        </span>
                      </div>
                      <p className="text-[11px] mt-0.5 leading-tight" style={{ color: theme.textMuted }}>
                        {ex.desc}
                      </p>
                      <p className="text-[10px] mt-0.5 font-semibold" style={{ color: theme.textLight }}>
                        {ex.equipment} · {ex.sets} series × {ex.reps} · {ex.rest}s descanso
                      </p>
                    </div>
                  </motion.button>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
