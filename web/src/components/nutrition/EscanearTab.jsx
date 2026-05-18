import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Hash, Search, Check, Camera, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { api } from '../../lib/api'
import { useStore } from '../../store/useStore'

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack']
const MEAL_LABELS = { breakfast: 'Desayuno', lunch: 'Comida', dinner: 'Cena', snack: 'Snack' }

function BarcodeScanner({ onDetected, onClose }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const rafRef = useRef(null)
  const [status, setStatus] = useState('Iniciando cámara…')
  const [supported, setSupported] = useState(true)

  useEffect(() => {
    let stream = null
    let detector = null
    let active = true

    async function start() {
      // Check BarcodeDetector support
      if (!('BarcodeDetector' in window)) {
        setSupported(false)
        setStatus('Tu navegador no soporta el escáner nativo. Usa Chrome en Android.')
        return
      }

      try {
        detector = new window.BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code']
        })

        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        })

        if (!active) { stream.getTracks().forEach(t => t.stop()); return }

        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setStatus('Apunta al código de barras')

        async function scan() {
          if (!active || !videoRef.current || videoRef.current.readyState < 2) {
            rafRef.current = requestAnimationFrame(scan)
            return
          }
          try {
            const barcodes = await detector.detect(videoRef.current)
            if (barcodes.length > 0 && active) {
              active = false
              stream.getTracks().forEach(t => t.stop())
              onDetected(barcodes[0].rawValue)
              return
            }
          } catch {}
          rafRef.current = requestAnimationFrame(scan)
        }
        rafRef.current = requestAnimationFrame(scan)

      } catch (err) {
        setStatus('Error: ' + (err.message || 'No se pudo acceder a la cámara'))
      }
    }

    start()

    return () => {
      active = false
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (stream) stream.getTracks().forEach(t => t.stop())
    }
  }, [])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex items-center justify-between p-4">
        <p className="text-white font-semibold">Escanear código</p>
        <button onClick={onClose}
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
          <X size={18} className="text-white" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 gap-4">
        {supported ? (
          <>
            <div className="relative w-full max-w-sm rounded-2xl overflow-hidden bg-gray-900">
              <video
                ref={videoRef}
                className="w-full h-64 object-cover"
                autoPlay playsInline muted
              />
              {/* Overlay guide */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-56 h-20 border-2 border-cyan-400 rounded-lg relative">
                  <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-cyan-400" />
                  <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-cyan-400" />
                  <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-cyan-400" />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-cyan-400" />
                  {/* Scanning line animation */}
                  <motion.div
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="absolute left-0 right-0 h-0.5 bg-cyan-400/70"
                  />
                </div>
              </div>
            </div>
            <p className="text-white/60 text-sm text-center">{status}</p>
          </>
        ) : (
          <div className="text-center px-4">
            <p className="text-white/60 text-sm mb-4">{status}</p>
            <button onClick={onClose} className="bg-white/10 text-white px-6 py-3 rounded-xl">
              Cerrar y usar teclado
            </button>
          </div>
        )}
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
  const [nativeSupported] = useState('BarcodeDetector' in window)

  async function searchBarcode(code) {
    const q = code || barcode.trim()
    if (!q) return
    setLoading(true); setError(''); setResult(null)
    try {
      const data = await api.nutrition.barcode(q)
      setResult(data); setBarcode(q)
    } catch {
      setError('Producto no encontrado. Prueba con otro código.')
    } finally { setLoading(false) }
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
      addXP(10); onSaved()
    } catch (err) { setError('Error: ' + err.message) }
    finally { setSaving(false) }
  }

  return (
    <>
      {scanning && (
        <BarcodeScanner
          onDetected={(code) => { setScanning(false); searchBarcode(code) }}
          onClose={() => setScanning(false)}
        />
      )}

      <div className="space-y-4">
        <div className="card bg-gradient-to-r from-blue-500/10 to-cyan-500/5 border-blue-500/15">
          <p className="font-semibold text-sm mb-1">📦 Escáner de código de barras</p>
          <p className="text-white/50 text-xs">
            {nativeSupported
              ? 'Escanea con la cámara o introduce el código manualmente.'
              : 'Tu navegador no soporta escaneo nativo. Introduce el código manualmente.'}
          </p>
        </div>

        {nativeSupported && (
          <button onClick={() => setScanning(true)}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl py-4 flex items-center justify-center gap-3 active:scale-98 transition-all">
            <Camera size={22} className="text-white" />
            <span className="text-white font-semibold">Escanear con cámara</span>
          </button>
        )}

        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-white/30 text-xs">código manual</span>
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
              : <Search size={18} className="text-white" />}
          </button>
        </div>

        {error && <div className="card bg-red-500/10 border-red-500/20"><p className="text-red-400 text-sm">{error}</p></div>}

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <div className="card bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border-blue-500/15">
                <p className="font-semibold mb-1">{result.food_name}</p>
                <p className="text-white/30 text-xs mb-3">Por {result.serving_size || '100g'}</p>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[['🔥',result.calories,'kcal'],['💪',result.protein_g,'g prot'],['🌾',result.carbs_g,'g carbs'],['🫒',result.fat_g,'g grasa']].map(([e,v,u]) => (
                    <div key={u} className="bg-surface-3 rounded-xl py-2">
                      <p className="text-lg">{e}</p><p className="font-bold text-sm">{Math.round(v)}</p>
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
                      className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition-all ${mealType === t ? 'bg-accent text-white' : 'bg-surface-3 text-white/40'}`}>
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
