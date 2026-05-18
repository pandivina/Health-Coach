import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Hash, Search, Check, Camera, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { api } from '../../lib/api'
import { useStore } from '../../store/useStore'

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack']
const MEAL_LABELS = { breakfast: 'Desayuno', lunch: 'Comida', dinner: 'Cena', snack: 'Snack' }

function BarcodeScanner({ onDetected, onClose }) {
  const scannerRef = useRef(null)
  const html5QrRef = useRef(null)

  useEffect(() => {
    let scanner = null

    async function startScanner() {
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        scanner = new Html5Qrcode('barcode-reader')
        html5QrRef.current = scanner

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 150 } },
          (decodedText) => {
            onDetected(decodedText)
            scanner.stop().catch(() => {})
          },
          () => {} // ignore errors during scan
        )
      } catch (err) {
        console.error('Scanner error:', err)
        onClose()
      }
    }

    startScanner()

    return () => {
      if (html5QrRef.current) {
        html5QrRef.current.stop().catch(() => {})
      }
    }
  }, [])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/80">
        <p className="text-white font-semibold">Escanear código de barras</p>
        <button onClick={onClose}
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
          <X size={18} className="text-white" />
        </button>
      </div>

      {/* Scanner */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div id="barcode-reader" ref={scannerRef} className="w-full max-w-sm rounded-2xl overflow-hidden" />
        <p className="text-white/50 text-sm mt-4 text-center">
          Apunta la cámara al código de barras del producto
        </p>
      </div>
    </motion.div>
  )
}

export default function EscanearTab({ onSaved }) {
  const { user, addXP } = useStore()
  const [barcode, setBarcode] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [mealType, setMealType] = useState('snack')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [scanning, setScanning] = useState(false)

  async function searchBarcode(code) {
    const barcodeToSearch = code || barcode.trim()
    if (!barcodeToSearch) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const data = await api.nutrition.barcode(barcodeToSearch)
      setResult(data)
      setBarcode(barcodeToSearch)
    } catch (err) {
      setError('Producto no encontrado. Prueba con otro código de barras.')
    } finally {
      setLoading(false)
    }
  }

  function handleScanDetected(code) {
    setScanning(false)
    setBarcode(code)
    searchBarcode(code)
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
    <>
      {scanning && (
        <BarcodeScanner
          onDetected={handleScanDetected}
          onClose={() => setScanning(false)}
        />
      )}

      <div className="space-y-4">
        <div className="card bg-gradient-to-r from-blue-500/10 to-cyan-500/5 border-blue-500/15">
          <p className="font-semibold text-sm mb-1">📦 Escáner de código de barras</p>
          <p className="text-white/50 text-xs leading-relaxed">
            Escanea el código de barras con la cámara o introdúcelo manualmente.
            Consulta millones de productos en Open Food Facts.
          </p>
        </div>

        {/* Scan button */}
        <button onClick={() => setScanning(true)}
          className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl py-4 flex items-center justify-center gap-3 active:scale-98 transition-all">
          <Camera size={22} className="text-white" />
          <span className="text-white font-semibold">Escanear con cámara</span>
        </button>

        {/* Manual input */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-white/30 text-xs">o introduce manualmente</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <div className="flex gap-2">
          <input className="input flex-1" type="text" inputMode="numeric"
            placeholder="Ej: 8410188030032"
            value={barcode} onChange={e => setBarcode(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && searchBarcode()} />
          <button onClick={() => searchBarcode()} disabled={loading || !barcode.trim()}
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
                <button onClick={save} disabled={saving}
                  className="btn-primary flex items-center justify-center gap-2 mt-2">
                  {saving ? 'Guardando…' : <><Check size={14} /> Guardar en diario</>}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!result && !error && !loading && (
          <div className="text-center py-6 text-white/20">
            <Hash size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Escanea o introduce el código del producto</p>
          </div>
        )}
      </div>
    </>
  )
}
