import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Plus, Camera, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { api } from '../../lib/api'
import { useStore } from '../../store/useStore'

const CATEGORIES = ['lácteos','carnes','verduras','frutas','cereales','bebidas','otros']

export default function DespensaTab() {
  const { user } = useStore()
  const [items, setItems] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [form, setForm] = useState({ ingredient: '', quantity: '1', unit: 'unidad', category: 'otros' })
  const fileRef = useRef()

  async function load() {
    const { data } = await supabase.from('pantry_items').select('*')
      .eq('user_id', user.id).order('category')
    setItems(data || [])
  }
  useEffect(() => { if (user) load() }, [user])

  async function add() {
    if (!form.ingredient) return
    await supabase.from('pantry_items').insert({
      ...form, user_id: user.id, quantity: parseFloat(form.quantity) || 1
    })
    setForm({ ingredient: '', quantity: '1', unit: 'unidad', category: 'otros' })
    setShowForm(false)
    load()
  }

  async function remove(id) {
    await supabase.from('pantry_items').delete().eq('id', id)
    load()
  }

  async function scanReceipt(e) {
    const file = e.target.files[0]; if (!file) return
    setScanning(true)
    try {
      const reader = new FileReader()
      reader.onload = async (ev) => {
        const base64 = ev.target.result.split(',')[1]
        const result = await api.pantry.uploadReceipt(base64, file.type)
        alert(`✅ Se añadieron ${result.inserted} ingredientes`)
        load()
      }
      reader.readAsDataURL(file)
    } catch { alert('No se pudo procesar el ticket') }
    finally { setScanning(false) }
  }

  const grouped = CATEGORIES.reduce((acc, cat) => {
    const catItems = items.filter(i => i.category === cat)
    if (catItems.length) acc[cat] = catItems
    return acc
  }, {})

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center justify-center gap-2 flex-1">
          <Plus size={15} /> Añadir
        </button>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={scanReceipt} />
        <button onClick={() => fileRef.current?.click()} disabled={scanning}
          className="btn-secondary flex items-center justify-center gap-2 flex-1">
          <Camera size={15} /> {scanning ? 'Leyendo…' : 'Ticket'}
        </button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card space-y-3">
          <input className="input" placeholder="Ingrediente" value={form.ingredient}
            onChange={e => setForm(f => ({ ...f, ingredient: e.target.value }))} autoFocus />
          <div className="flex gap-2">
            <input className="input flex-1" type="number" placeholder="Cantidad" value={form.quantity}
              onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
            <select className="input" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
              {['unidad','kg','g','l','ml'].map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
          <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="btn-secondary text-sm py-2">Cancelar</button>
            <button onClick={add} className="btn-primary text-sm py-2">Añadir</button>
          </div>
        </motion.div>
      )}

      {Object.entries(grouped).map(([cat, catItems]) => (
        <div key={cat}>
          <p className="text-white/40 text-xs uppercase tracking-wider font-semibold mb-2">{cat}</p>
          <div className="space-y-2">
            {catItems.map(item => (
              <div key={item.id} className="card flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-sm">{item.ingredient}</p>
                  <p className="text-white/30 text-xs">{item.quantity} {item.unit}</p>
                </div>
                <button onClick={() => remove(item.id)} className="text-white/20 hover:text-red-400 p-2 transition-all">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
      {items.length === 0 && (
        <div className="text-center py-10 text-white/30">
          <p className="text-4xl mb-3">🛒</p>
          <p>Tu despensa está vacía</p>
        </div>
      )}
    </div>
  )
}
