import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, Check, X, ChevronUp, ChevronDown } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeProvider'
import { supabase } from '../../lib/supabase'

const API = import.meta.env.VITE_API_URL

const ICONS  = ['⭐','💪','🧘','🥗','💧','😴','🚶','📚','🧠','🏃','🍎','🎯','🔥','❤️','🌿']
const COLORS = ['#2EC4B6','#F97316','#6366F1','#22C55E','#EC4899','#F59E0B','#3B82F6','#8B5CF6']
const CATS   = [
  { v:'general',   label:'General',    emoji:'⭐' },
  { v:'fitness',   label:'Fitness',    emoji:'💪' },
  { v:'nutrition', label:'Nutrición',  emoji:'🥗' },
  { v:'wellness',  label:'Bienestar',  emoji:'🧘' },
  { v:'sleep',     label:'Sueño',      emoji:'😴' },
]

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  return { 'Content-Type':'application/json', Authorization:`Bearer ${session?.access_token}` }
}

// ─── MODAL CREAR / EDITAR HÁBITO ─────────────────────────────────────────────
function HabitModal({ habit, onSave, onClose }) {
  const { theme } = useTheme()
  const [name,    setName]    = useState(habit?.name   || '')
  const [icon,    setIcon]    = useState(habit?.icon   || '⭐')
  const [color,   setColor]   = useState(habit?.color  || '#2EC4B6')
  const [cat,     setCat]     = useState(habit?.category || 'general')
  const [saving,  setSaving]  = useState(false)
  const isEdit = !!habit?.id

  async function save() {
    if (!name.trim()) return
    setSaving(true)
    try {
      const headers = await authHeaders()
      const url  = isEdit ? `${API}/api/habits/${habit.id}` : `${API}/api/habits`
      const res  = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers,
        body: JSON.stringify({ name: name.trim(), icon, color, category: cat }),
      })
      const data = await res.json()
      onSave(data, isEdit)
    } finally { setSaving(false) }
  }

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      style={{ position:'fixed', inset:0, zIndex:400, background:'rgba(0,0,0,0.4)',
        backdropFilter:'blur(4px)', display:'flex', alignItems:'flex-end' }}
      onClick={onClose}>
      <motion.div initial={{ y:'100%' }} animate={{ y:0 }} exit={{ y:'100%' }}
        transition={{ type:'spring', damping:28, stiffness:300 }}
        onClick={e => e.stopPropagation()}
        style={{ width:'100%', background: theme.background || 'white',
          borderRadius:'24px 24px 0 0', padding:'20px 20px 48px',
          boxShadow:'0 -8px 32px rgba(0,0,0,0.15)' }}>

        {/* Handle */}
        <div style={{ width:36, height:4, borderRadius:2, background:'rgba(0,0,0,0.1)',
          margin:'0 auto 20px' }} />

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <p style={{ fontSize:17, fontWeight:900, color: theme.text, margin:0 }}>
            {isEdit ? 'Editar hábito' : 'Nuevo hábito'}
          </p>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer' }}>
            <X size={20} color={theme.textMuted} />
          </button>
        </div>

        {/* Preview */}
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:20,
          padding:14, borderRadius:16, background: theme.surface || '#F9FAFB' }}>
          <div style={{ width:48, height:48, borderRadius:16, background: color + '22',
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>
            {icon}
          </div>
          <div>
            <p style={{ fontSize:15, fontWeight:800, color: theme.text, margin:0 }}>
              {name || 'Nombre del hábito'}
            </p>
            <p style={{ fontSize:11, color: theme.textMuted, margin:'2px 0 0' }}>
              {CATS.find(c => c.v === cat)?.emoji} {CATS.find(c => c.v === cat)?.label}
            </p>
          </div>
        </div>

        {/* Nombre */}
        <input value={name} onChange={e => setName(e.target.value)}
          placeholder="¿Qué hábito quieres crear?"
          style={{ width:'100%', padding:'12px 16px', borderRadius:14, marginBottom:16,
            border:`1.5px solid ${theme.border || 'rgba(0,0,0,0.1)'}`,
            fontSize:14, outline:'none', background: theme.surface || 'white',
            color: theme.text, boxSizing:'border-box' }} />

        {/* Categoría */}
        <p style={{ fontSize:12, fontWeight:700, color: theme.textMuted,
          marginBottom:8, textTransform:'uppercase', letterSpacing:'.06em' }}>Categoría</p>
        <div style={{ display:'flex', gap:6, marginBottom:16, flexWrap:'wrap' }}>
          {CATS.map(c => (
            <button key={c.v} onClick={() => setCat(c.v)}
              style={{ padding:'7px 12px', borderRadius:12, border:'none', cursor:'pointer',
                fontSize:12, fontWeight:700,
                background: cat === c.v ? color + '22' : theme.surface || '#F9FAFB',
                color: cat === c.v ? color : theme.textMuted,
                outline: cat === c.v ? `2px solid ${color}40` : 'none' }}>
              {c.emoji} {c.label}
            </button>
          ))}
        </div>

        {/* Iconos */}
        <p style={{ fontSize:12, fontWeight:700, color: theme.textMuted,
          marginBottom:8, textTransform:'uppercase', letterSpacing:'.06em' }}>Icono</p>
        <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
          {ICONS.map(ic => (
            <button key={ic} onClick={() => setIcon(ic)}
              style={{ width:40, height:40, borderRadius:12, border:'none', cursor:'pointer',
                fontSize:20, background: icon === ic ? color + '22' : theme.surface || '#F9FAFB',
                outline: icon === ic ? `2px solid ${color}` : 'none' }}>
              {ic}
            </button>
          ))}
        </div>

        {/* Colores */}
        <p style={{ fontSize:12, fontWeight:700, color: theme.textMuted,
          marginBottom:8, textTransform:'uppercase', letterSpacing:'.06em' }}>Color</p>
        <div style={{ display:'flex', gap:8, marginBottom:24 }}>
          {COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)}
              style={{ width:30, height:30, borderRadius:'50%', border:'none', cursor:'pointer',
                background: c,
                outline: color === c ? `3px solid ${c}` : '3px solid transparent',
                outlineOffset: 2 }} />
          ))}
        </div>

        {/* Guardar */}
        <motion.button whileTap={{ scale:0.97 }} onClick={save} disabled={!name.trim() || saving}
          style={{ width:'100%', padding:'14px', borderRadius:16, border:'none', cursor:'pointer',
            background: name.trim() ? color : theme.surface2 || '#E5E7EB',
            color: name.trim() ? 'white' : theme.textMuted,
            fontSize:15, fontWeight:800, opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear hábito'}
        </motion.button>
      </motion.div>
    </motion.div>
  )
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function HabitsEditor({ userId }) {
  const { theme }               = useTheme()
  const [habits,   setHabits]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [editing,  setEditing]  = useState(null)  // null | 'new' | habit objeto
  const [deleting, setDeleting] = useState(null)  // id a confirmar

  useEffect(() => { if (userId) load() }, [userId])

  async function load() {
    setLoading(true)
    try {
      const headers = await authHeaders()
      const res  = await fetch(`${API}/api/habits`, { headers })
      const data = await res.json()
      setHabits(Array.isArray(data) ? data : [])
    } finally { setLoading(false) }
  }

  // ── Toggle completado hoy ──────────────────────────────────────────────────
  async function toggle(habit) {
    // Optimistic
    setHabits(h => h.map(x => x.id === habit.id
      ? { ...x, done_today: !x.done_today, streak: x.done_today ? Math.max(0, x.streak-1) : x.streak+1 }
      : x))
    try {
      const headers = await authHeaders()
      const method  = habit.done_today ? 'DELETE' : 'POST'
      await fetch(`${API}/api/habits/${habit.id}/log`, { method, headers })
    } catch { load() }
  }

  // ── Guardar desde modal ────────────────────────────────────────────────────
  function handleSave(data, isEdit) {
    if (isEdit) {
      setHabits(h => h.map(x => x.id === data.id ? { ...x, ...data } : x))
    } else {
      setHabits(h => [...h, { ...data, done_today: false, streak: 0 }])
    }
    setEditing(null)
  }

  // ── Eliminar ───────────────────────────────────────────────────────────────
  async function confirmDelete(id) {
    setHabits(h => h.filter(x => x.id !== id))
    setDeleting(null)
    try {
      const headers = await authHeaders()
      await fetch(`${API}/api/habits/${id}`, { method:'DELETE', headers })
    } catch { load() }
  }

  // ── Reordenar ──────────────────────────────────────────────────────────────
  async function move(index, dir) {
    const next = [...habits]
    const swap = index + dir
    if (swap < 0 || swap >= next.length) return
    ;[next[index], next[swap]] = [next[swap], next[index]]
    setHabits(next)
    try {
      const headers = await authHeaders()
      await fetch(`${API}/api/habits/reorder/bulk`, {
        method: 'PUT', headers,
        body: JSON.stringify({ order: next.map((h, i) => ({ id: h.id, sort_order: i })) }),
      })
    } catch {}
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
        marginBottom:16 }}>
        <div>
          <p style={{ fontSize:16, fontWeight:900, color: theme.text, margin:0 }}>Mis hábitos</p>
          <p style={{ fontSize:12, color: theme.textMuted, margin:'2px 0 0' }}>
            {habits.filter(h => h.done_today).length}/{habits.length} completados hoy
          </p>
        </div>
        <motion.button whileTap={{ scale:0.93 }} onClick={() => setEditing('new')}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 14px',
            borderRadius:14, border:'none', cursor:'pointer', fontWeight:700, fontSize:13,
            background: theme.primary || '#2EC4B6', color:'white' }}>
          <Plus size={15} /> Añadir
        </motion.button>
      </div>

      {/* Lista */}
      {loading ? (
        <div style={{ textAlign:'center', padding:'32px 0', color: theme.textMuted }}>
          <p style={{ fontSize:24, margin:'0 0 8px' }}>🐾</p>
          <p style={{ fontSize:13 }}>Cargando hábitos…</p>
        </div>
      ) : habits.length === 0 ? (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
          style={{ textAlign:'center', padding:'40px 20px',
            background: theme.surface || '#F9FAFB', borderRadius:20 }}>
          <p style={{ fontSize:40, margin:'0 0 12px' }}>🌱</p>
          <p style={{ fontSize:15, fontWeight:800, color: theme.text, margin:'0 0 6px' }}>
            Sin hábitos aún
          </p>
          <p style={{ fontSize:13, color: theme.textMuted, margin:'0 0 16px' }}>
            Crea tu primer hábito y empieza a construir tu rutina
          </p>
          <button onClick={() => setEditing('new')}
            style={{ padding:'10px 20px', borderRadius:14, border:'none', cursor:'pointer',
              background: theme.primary || '#2EC4B6', color:'white',
              fontSize:13, fontWeight:700 }}>
            Crear hábito
          </button>
        </motion.div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          <AnimatePresence>
            {habits.map((h, i) => (
              <motion.div key={h.id}
                layout
                initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                exit={{ opacity:0, x:-40 }}
                style={{ display:'flex', alignItems:'center', gap:12,
                  padding:'12px 14px', borderRadius:18,
                  background: h.done_today ? (h.color || '#2EC4B6') + '12' : (theme.surface || '#F9FAFB'),
                  border:`1.5px solid ${h.done_today ? (h.color||'#2EC4B6')+'40' : (theme.border||'rgba(0,0,0,0.06)')}`,
                  transition:'all 0.2s' }}>

                {/* Check */}
                <motion.button whileTap={{ scale:0.85 }} onClick={() => toggle(h)}
                  style={{ width:40, height:40, borderRadius:14, border:'none', cursor:'pointer',
                    flexShrink:0, fontSize:22,
                    background: h.done_today ? (h.color || '#2EC4B6') : (h.color || '#2EC4B6') + '18',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    transition:'all 0.2s' }}>
                  {h.done_today
                    ? <Check size={18} color="white" strokeWidth={3} />
                    : <span>{h.icon}</span>
                  }
                </motion.button>

                {/* Info */}
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:14, fontWeight:700, margin:0,
                    color: h.done_today ? (h.color || '#2EC4B6') : (theme.text || '#1A2332'),
                    textDecoration: h.done_today ? 'line-through' : 'none',
                    opacity: h.done_today ? 0.7 : 1 }}>
                    {h.name}
                  </p>
                  {h.streak > 0 && (
                    <p style={{ fontSize:11, color: theme.textMuted, margin:'2px 0 0' }}>
                      🔥 {h.streak} día{h.streak !== 1 ? 's' : ''} seguidos
                    </p>
                  )}
                </div>

                {/* Acciones */}
                <div style={{ display:'flex', alignItems:'center', gap:4, flexShrink:0 }}>
                  <button onClick={() => move(i, -1)} disabled={i === 0}
                    style={{ width:26, height:26, borderRadius:8, border:'none', cursor:'pointer',
                      background: theme.surface2 || '#F3F4F6', opacity: i===0 ? 0.3 : 1,
                      display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <ChevronUp size={12} color={theme.textMuted} />
                  </button>
                  <button onClick={() => move(i, 1)} disabled={i === habits.length-1}
                    style={{ width:26, height:26, borderRadius:8, border:'none', cursor:'pointer',
                      background: theme.surface2 || '#F3F4F6', opacity: i===habits.length-1 ? 0.3 : 1,
                      display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <ChevronDown size={12} color={theme.textMuted} />
                  </button>
                  <button onClick={() => setEditing(h)}
                    style={{ width:26, height:26, borderRadius:8, border:'none', cursor:'pointer',
                      background: theme.surface2 || '#F3F4F6',
                      display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Pencil size={12} color={theme.textMuted} />
                  </button>
                  <button onClick={() => setDeleting(h.id)}
                    style={{ width:26, height:26, borderRadius:8, border:'none', cursor:'pointer',
                      background: '#FEF2F2',
                      display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Trash2 size={12} color="#EF4444" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modal crear/editar */}
      <AnimatePresence>
        {editing && (
          <HabitModal
            habit={editing === 'new' ? null : editing}
            onSave={handleSave}
            onClose={() => setEditing(null)} />
        )}
      </AnimatePresence>

      {/* Confirmar eliminar */}
      <AnimatePresence>
        {deleting && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:'fixed', inset:0, zIndex:400, background:'rgba(0,0,0,0.4)',
              display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
            <motion.div initial={{ scale:0.9 }} animate={{ scale:1 }}
              style={{ background: theme.background || 'white', borderRadius:24,
                padding:24, maxWidth:320, width:'100%',
                boxShadow:'0 8px 40px rgba(0,0,0,0.2)' }}>
              <p style={{ fontSize:16, fontWeight:800, color: theme.text, margin:'0 0 8px' }}>
                ¿Eliminar este hábito?
              </p>
              <p style={{ fontSize:13, color: theme.textMuted, margin:'0 0 20px' }}>
                Se archivará y perderás su racha. Esta acción no se puede deshacer.
              </p>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={() => setDeleting(null)}
                  style={{ flex:1, padding:12, borderRadius:14, border:'none', cursor:'pointer',
                    background: theme.surface2 || '#F3F4F6', fontWeight:700, fontSize:14,
                    color: theme.textMuted }}>
                  Cancelar
                </button>
                <button onClick={() => confirmDelete(deleting)}
                  style={{ flex:1, padding:12, borderRadius:14, border:'none', cursor:'pointer',
                    background:'#EF4444', color:'white', fontWeight:700, fontSize:14 }}>
                  Eliminar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
