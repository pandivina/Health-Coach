import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Upload, Check, RefreshCw } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { api } from '../../lib/api'
import { useStore } from '../../store/useStore'

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack']
const MEAL_LABELS = { breakfast: 'Desayuno', lunch: 'Comida', dinner: 'Cena', snack: 'Snack' }

export default function AnalizarTab({ onSaved }) {
  const { user, addXP } = useStore()
  const [preview, setPreview] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState(null)
  const [mealType, setMealType] = useState('lunch')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef()

  function handleFile(file) {
    if (!file) return
    setError('')
    setResult(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target.result)
    }
    reader.readAsDataURL(file)
  }

  async function analyze() {
    if (!preview) return
    setAnalyzing(true)
    setError('')
    try {
      const base64 = preview.split(',')[1]
      const mediaType = preview.split(';')[0].split(':')[1]
      const data = await api.nutrition.analyzePhoto(base64, mediaType)
      setResult(data)
    } catch (err) {
      setError('No se pudo analizar la imagen. Asegúrate de que muestra claramente un plato o producto.')
    } finally {
      setAnalyzing(false)
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
      addXP(15)
      onSaved()
    } catch (err) {
      setError('Error guardando: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  function reset() {
    setPreview(null)
    setResult(null)
    setError('')
  }

  return (
    <div className="space-y-4">
      {/* Instrucciones */}
      <div className="card bg-gradient-to-r from-violet-500/10 to-indigo-500/5 border-violet-500/15">
        <p className="font-semibold text-sm mb-1">📸 Análisis por foto</p>
        <p className="text-white/50 text-xs leading-relaxed">
          Haz una foto clara de tu plato o producto. La IA analizará los nutrientes automáticamente.
          Para mejores resultados: buena iluminación y el plato centrado.
        </p>
      </div>

      {/* Upload area */}
      {!preview ? (
        <div>
          <input ref={fileRef} type="file" accept="image/*" capture="environment"
            className="hidden" onChange={e => handleFile(e.target.files[0])} />
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => { fileRef.current.removeAttribute('capture'); fileRef.current.click() }}
              className="card flex flex-col items-center gap-3 py-8 border-dashed border-white/20 active:border-accent transition-all">
              <Upload size={24} className="text-white/40" />
              <p className="text-white/50 text-sm">Subir imagen</p>
            </button>
            <button onClick={() => { fileRef.current.setAttribute('capture', 'environment'); fileRef.current.click() }}
              className="card flex flex-col items-center gap-3 py-8 border-dashed border-white/20 active:border-accent transition-all">
              <Camera size={24} className="text-violet-400" />
              <p className="text-white/50 text-sm">Usar cámara</p>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Preview */}
          <div className="relative rounded-2xl overflow-hidden">
            <img src={preview} alt="preview" className="w-full h-52 object-cover" />
            <button onClick={reset}
              className="absolute top-3 right-3 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center">
              <RefreshCw size={14} className="text-white" />
            </button>
          </div>

          {/* Analyze button */}
          {!result && (
            <button onClick={analyze} disabled={analyzing} className="btn-primary flex items-center justify-center gap-2">
              {analyzing ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analizando con IA…</>
              ) : (
                <><Camera size={16} /> Analizar plato</>
              )}
            </button>
          )}

          {/* Error */}
          {error && (
            <div className="card bg-red-500/10 border-red-500/20">
              <p className="text-red-400 text-sm">{error}</p>
              <button onClick={reset} className="text-white/50 text-xs mt-2 underline">Intentar con otra foto</button>
            </div>
          )}

          {/* Result */}
          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="space-y-3">
                <div className="card bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border-emerald-500/15">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <Check size={12} className="text-emerald-400" />
                    </div>
                    <p className="font-semibold">{result.food_name}</p>
                    {result.confidence && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ml-auto ${
                        result.confidence === 'alta' ? 'bg-emerald-500/20 text-emerald-400' :
                        result.confidence === 'media' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        Confianza {result.confidence}
                      </span>
                    )}
                  </div>
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
                    {saving ? 'Guardando…' : <><Check size={14} /> Guardar en diario (+15 XP)</>}
                  </button>
                  <button onClick={reset} className="btn-secondary text-sm py-2">Analizar otra foto</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
