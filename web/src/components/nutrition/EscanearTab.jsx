import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Hash, Search, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { api } from '../../lib/api'
import { useStore } from '../../store/useStore'

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack']
const MEAL_LABELS = { breakfast: 'Desayuno', lunch: 'Comida', dinner: 'Cena', snack: 'Snack' }

export default function EscanearTab({ onSaved }) {
  const { user, addXP } = useStore()
  const [barcode, setBarcode] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [mealType, setMealType] = useState('snack')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function search() {
    if (!barcode.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const data = await api.nutrition.barcode(barcode.trim())
      setResult(data)
    } catch (err) {
      setError('Producto no encontrado. Prueba con otro código de barras.')
    } finally {
      setLoading(false)
    }
  }

  async function save() {
    if (!result || !user) return
    setSaving(true)
    try {
      await supabase.from('meal_logs').insert({
        user_id: user.id,
        date: new Date().toISOString().split('T')[0],
        meal_type: mealType,
        food_name: result.food_name,
        calories: result.calories || 0,
        protein_g: result.protein_g || 0,
        carbs_g: result.carbs_g || 0,
        fat_g: result.fat_g || 0,
      })
      addXP(10)
      onSaved()
    } catch (err) {
      setError('Error guardando: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="card bg-gradient-to-r from-blue-500/10 to-cyan-500/5 border-blue-500/15">
        <p className="font-semibold text-sm mb-1">📦 Escáner de código de barras</p>
        <p className="text-white/50 text-xs leading-relaxed">
          Introduce el código de barras del producto (EAN-13 o similar). 
          Consulta la base de datos de Open Food Facts con millones de productos.
        </p>
      </div>

      <div className="flex gap-2">
        <input className="input flex-1" type="text" inputMode="numeric"
          placeholder="Ej: 8410188030032"
          value={barcode} onChange={e => setBarcode(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search()} />
        <button onClick={search} disabled={loading || !barcode.trim()}
          className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center active:scale-90 transition-all disabled:opacity-40 flex-shrink-0">
          {loading
            ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <Search size={18} className="text-white" />
          }
        </button>
      </div>

      {error && (
        <div className="card bg-red-500/10 border-red-500/20">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div className="card bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border-blue-500/15">
              <p className="font-semibold mb-1">{result.food_name}</p>
              <p className="text-white/30 text-xs mb-3">Por {result.serving_size || '100g'}</p>
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  ['🔥', result.calories, 'kcal'],
                  ['💪', result.protein_g, 'g prot'],
                  ['🌾', result.carbs_g, 'g carbs'],
                  ['🫒', result.fat_g, 'g grasa'],
                ].map(([e, v, u]) => (
                  <div key={u} className="bg-surface-3 rounded-xl py-2">
                    <p className="text-lg">{e}</p>
                    <p className="font-bold text-sm">{Math.round(v)}</p>
                    <p className="text-white/30 text-[9px]">{u}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="card space-y-2">
              <p className="text-sm font-medium">¿Cuándo lo comiste?</p>
              <div className="flex gap-2">
                {MEAL_TYPES.map(t => (
                  <button key={t} onClick={() => setMealType(t)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      mealType === t ? 'bg-accent text-white' : 'bg-surface-3 text-white/40'
                    }`}>
                    {MEAL_LABELS[t]}
                  </button>
                ))}
              </div>
              <button onClick={save} disabled={saving} className="btn-primary flex items-center justify-center gap-2 mt-2">
                {saving ? 'Guardando…' : <><Check size={14} /> Guardar en diario</>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tip */}
      {!result && !error && (
        <div className="text-center py-8 text-white/20">
          <Hash size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Introduce el código de barras del envase</p>
        </div>
      )}
    </div>
  )
}
