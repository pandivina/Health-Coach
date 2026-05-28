import { useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, Flame, Check, ChevronRight } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeProvider'

const INGREDIENT_EMOJIS = {
  pollo: '🍗', salmon: '🐟', atún: '🐟', ternera: '🥩', cerdo: '🥩',
  huevo: '🥚', huevos: '🥚', arroz: '🍚', pasta: '🍝', quinoa: '🌾',
  avena: '🌾', pan: '🍞', patata: '🥔', boniato: '🍠',
  brócoli: '🥦', espinacas: '🥬', lechuga: '🥬', tomate: '🍅',
  zanahoria: '🥕', pepino: '🥒', cebolla: '🧅', ajo: '🧄',
  aguacate: '🥑', aceite: '🫒', limón: '🍋', naranja: '🍊',
  manzana: '🍎', plátano: '🍌', fresas: '🍓', arándanos: '🫐',
  leche: '🥛', yogur: '🥛', queso: '🧀', mantequilla: '🧈',
  almendras: '🥜', nueces: '🥜', semillas: '🌱', proteína: '💪',
  chocolate: '🍫', miel: '🍯', default: '🥘',
}

function getEmoji(ingredientName) {
  const lower = ingredientName.toLowerCase()
  for (const [key, emoji] of Object.entries(INGREDIENT_EMOJIS)) {
    if (lower.includes(key)) return emoji
  }
  return INGREDIENT_EMOJIS.default
}

// Parsea ingredientes en formato string a objeto {name, qty, emoji}
function parseIngredients(ingredients) {
  if (!ingredients || !Array.isArray(ingredients)) return []
  return ingredients.map(ing => {
    if (typeof ing === 'object' && ing.name) {
      return { ...ing, emoji: ing.emoji || getEmoji(ing.name) }
    }
    // Si es string "150g de pollo" → parsear
    const str = String(ing)
    const match = str.match(/^(\d+[\w.]*)\s+(?:de\s+)?(.+)$/)
    if (match) return { qty: match[1], name: match[2], emoji: getEmoji(match[2]) }
    return { name: str, qty: '', emoji: getEmoji(str) }
  })
}

export default function BentoRecipeCard({ recipe, onCook, saving }) {
  const { theme } = useTheme()
  const [checked, setChecked] = useState({})
  const [cooked,  setCooked]  = useState(recipe?.cooked || false)

  const ingredients = parseIngredients(recipe?.ingredients)
  const checkedCount = Object.values(checked).filter(Boolean).length

  async function handleCook() {
    if (cooked || saving) return
    setCooked(true)
    await onCook?.()
  }

  return (
    <div className="w-full p-1">
      <div className="rounded-3xl p-3 grid grid-cols-6 gap-2.5 overflow-hidden"
        style={{
          backgroundColor: theme.surface2,
          border: `2px solid ${theme.border}`,
          opacity: cooked ? 0.7 : 1,
        }}>

        {/* Celda principal — título + stats */}
        <div className="col-span-4 row-span-2 rounded-2xl p-3 flex flex-col justify-between relative overflow-hidden h-44"
          style={{ backgroundColor: theme.surface, border: `1.5px solid ${theme.border}` }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.05), transparent)' }} />
          <div className="z-10">
            <span className="text-2xl mb-1 block">🍱</span>
            <h3 className="font-extrabold text-sm leading-tight" style={{ color: theme.text }}>
              {recipe?.title || 'Receta del día'}
            </h3>
            {recipe?.description && (
              <p className="text-[10px] mt-1 leading-relaxed line-clamp-2"
                style={{ color: theme.textMuted }}>{recipe.description}</p>
            )}
          </div>
          <div className="flex gap-2 z-10 flex-wrap">
            <div className="flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-bold"
              style={{ background: 'rgba(249,115,22,0.1)', color: '#F97316' }}>
              <Flame size={11} /> {recipe?.calories || '–'} kcal
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-bold"
              style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6' }}>
              <Clock size={11} /> {recipe?.prep_time || '–'} min
            </div>
          </div>
        </div>

        {/* Celda macros */}
        <div className="col-span-2 row-span-2 rounded-2xl p-2.5 flex flex-col justify-around text-center h-44"
          style={{ backgroundColor: theme.surface, border: `1.5px solid ${theme.border}` }}>
          <p className="text-[9px] font-black uppercase tracking-wider" style={{ color: theme.textLight }}>
            Macros
          </p>
          {[
            { label: 'P', value: recipe?.protein_g ? `${Math.round(recipe.protein_g)}g` : '–', color: '#F97316' },
            { label: 'H', value: recipe?.carbs_g   ? `${Math.round(recipe.carbs_g)}g`   : '–', color: '#EAB308' },
            { label: 'G', value: recipe?.fat_g     ? `${Math.round(recipe.fat_g)}g`     : '–', color: '#22C55E' },
          ].map((m, i) => (
            <div key={i}>
              {i > 0 && <div className="w-full h-px rounded-full mb-1" style={{ background: theme.border }} />}
              <span className="text-[10px] font-bold block" style={{ color: m.color }}>{m.label}</span>
              <span className="text-xs font-black" style={{ color: theme.text }}>{m.value}</span>
            </div>
          ))}
        </div>

        {/* Ingredientes */}
        {ingredients.length > 0 && (
          <div className="col-span-6 mt-1">
            <p className="text-[10px] font-black uppercase tracking-wider mb-2 px-1"
              style={{ color: theme.textLight }}>
              Ingredientes · {checkedCount}/{ingredients.length}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {ingredients.map((ing, i) => {
                const isChecked = checked[i]
                return (
                  <motion.button key={i} whileTap={{ scale: 0.97 }}
                    onClick={() => setChecked(c => ({ ...c, [i]: !c[i] }))}
                    className="rounded-xl p-2 flex items-center justify-between text-left transition-all"
                    style={{
                      backgroundColor: isChecked ? `${theme.primary}10` : theme.surface,
                      border: `1.5px solid ${isChecked ? theme.primary + '50' : theme.border}`,
                    }}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base flex-shrink-0">{ing.emoji}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate leading-tight"
                          style={{
                            color: isChecked ? theme.textMuted : theme.text,
                            textDecoration: isChecked ? 'line-through' : 'none',
                          }}>
                          {ing.name}
                        </p>
                        {ing.qty && (
                          <p className="text-[10px]" style={{ color: theme.textLight }}>{ing.qty}</p>
                        )}
                      </div>
                    </div>
                    <div className="w-4 h-4 rounded-lg flex items-center justify-center flex-shrink-0 ml-1"
                      style={{
                        backgroundColor: isChecked ? theme.primary : theme.surface2,
                        border: isChecked ? 'none' : `1px solid ${theme.border}`,
                      }}>
                      {isChecked && <Check size={10} color="#fff" strokeWidth={3} />}
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </div>
        )}

        {/* Botón cocinar */}
        <motion.button whileTap={{ scale: 0.98 }} onClick={handleCook}
          disabled={cooked || saving}
          className="col-span-6 mt-1 py-2.5 rounded-xl font-extrabold text-xs text-white flex items-center justify-center gap-2 transition-all disabled:opacity-60"
          style={{
            background: cooked
              ? theme.success
              : `linear-gradient(135deg, #F97316, #FF8FA3)`,
            boxShadow: cooked ? 'none' : '0 4px 12px rgba(249,115,22,0.25)',
          }}>
          {cooked ? (
            <><Check size={13} strokeWidth={2.5} /> ¡Ya la cociné! (+30 XP) 🐼</>
          ) : saving ? (
            '…'
          ) : (
            <>¡Cocinar este Bento! <ChevronRight size={13} /></>
          )}
        </motion.button>
      </div>
    </div>
  )
}
