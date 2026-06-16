// ─── components/workout/FavoriteRoutines.jsx ─────────────────────────────────
// Guardar la rutina actual como favorita y repetirla con un tap

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Play, Trash2, X, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useStore } from '../../store/useStore'
import { useTheme } from '../../contexts/ThemeProvider'
import { api } from '../../lib/api'

const EMOJIS = ['💪','🔥','⚡','🏋️','🦾','🎯','💯','🚀']

// ─── GUARDAR RUTINA ACTUAL COMO FAVORITA ─────────────────────────────────────
export function SaveRoutineButton({ exercises, sessionName }) {
  const { user } = useStore()
  const [showModal, setShowModal] = useState(false)
  const [name,      setName]      = useState(sessionName || '')
  const [emoji,     setEmoji]     = useState('💪')
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)

  async function save() {
    if (!name.trim() || !exercises.length) return
    setSaving(true)
    try {
      const exerciseData = exercises.map((ex, i) => ({
        exercise_name: ex.exercise_name,
        sets:          ex.libraryData?.sets || 3,
        reps:          ex.libraryData?.reps || '8-12',
        rest:          ex.libraryData?.rest || 90,
        order_index:   i,
      }))

      await supabase.from('favorite_routines').insert({
        user_id:   user.id,
        name:      name.trim(),
        emoji,
        exercises: exerciseData,
      })

      setSaved(true)
      setTimeout(() => { setShowModal(false); setSaved(false) }, 1200)
    } catch (err) {
      console.error('Save routine error:', err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!exercises.length) return null

  return (
    <>
      <motion.button whileTap={{ scale:0.95 }} onClick={() => setShowModal(true)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
        style={{ background:'#FEF3C7', color:'#92400E' }}>
        <Star size={13} /> Guardar rutina
      </motion.button>

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center px-6"
            style={{ background:'rgba(0,0,0,0.5)' }}
            onClick={() => setShowModal(false)}>
            <motion.div initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }}
              onClick={e => e.stopPropagation()}
              style={{ background:'white', borderRadius:24, padding:24, width:'100%', maxWidth:340 }}>

              {saved ? (
                <div style={{ textAlign:'center', padding:'20px 0' }}>
                  <motion.div initial={{ scale:0 }} animate={{ scale:1 }}
                    style={{ fontSize:48, marginBottom:8 }}>⭐</motion.div>
                  <p style={{ fontWeight:800, fontSize:15, color:'#1A2332' }}>¡Rutina guardada!</p>
                </div>
              ) : (
                <>
                  <p style={{ fontWeight:800, fontSize:16, color:'#1A2332', marginBottom:16 }}>
                    Guardar como favorita
                  </p>

                  <div style={{ display:'flex', gap:6, marginBottom:14, flexWrap:'wrap' }}>
                    {EMOJIS.map(e => (
                      <button key={e} onClick={() => setEmoji(e)}
                        style={{ width:38, height:38, borderRadius:12, border:'none', cursor:'pointer',
                          fontSize:18, background: emoji===e ? '#2EC4B620' : '#F3F4F6',
                          outline: emoji===e ? '2px solid #2EC4B6' : 'none' }}>
                        {e}
                      </button>
                    ))}
                  </div>

                  <input value={name} onChange={e => setName(e.target.value)}
                    placeholder="Ej: Día de pierna, Push pesado…"
                    style={{ width:'100%', padding:'12px 14px', borderRadius:14,
                      border:'1.5px solid rgba(0,0,0,0.1)', fontSize:14, outline:'none',
                      marginBottom:16, boxSizing:'border-box' }} />

                  <div style={{ display:'flex', gap:8 }}>
                    <button onClick={() => setShowModal(false)}
                      style={{ flex:1, padding:'12px', borderRadius:14, border:'none', cursor:'pointer',
                        background:'#F3F4F6', color:'#6B7280', fontWeight:700, fontSize:13 }}>
                      Cancelar
                    </button>
                    <button onClick={save} disabled={!name.trim() || saving}
                      style={{ flex:1, padding:'12px', borderRadius:14, border:'none', cursor:'pointer',
                        background: name.trim() ? 'linear-gradient(135deg,#2EC4B6,#FF8FA3)' : '#E5E7EB',
                        color:'white', fontWeight:700, fontSize:13, opacity: saving ? 0.6 : 1 }}>
                      {saving ? 'Guardando…' : 'Guardar'}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// ─── LISTA DE RUTINAS FAVORITAS ───────────────────────────────────────────────
export function FavoriteRoutinesList({ onStartSession }) {
  const { user }  = useStore()
  const { theme } = useTheme()
  const [routines, setRoutines] = useState([])
  const [loading,   setLoading] = useState(true)
  const [starting,  setStarting] = useState(null)

  useEffect(() => {
    if (!user?.id) return
    load()
  }, [user?.id])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('favorite_routines')
      .select('*')
      .eq('user_id', user.id)
      .order('last_used_at', { ascending: false, nullsFirst: false })
    setRoutines(data || [])
    setLoading(false)
  }

  async function startRoutine(routine) {
    setStarting(routine.id)
    try {
      // Crear sesión vacía
      const session = await api.workouts.start({ name: routine.name, exercises: [] })

      // Añadir cada ejercicio de la rutina guardada
      for (const ex of routine.exercises) {
        await api.workouts.addExercise({
          session_id:    session.session.id,
          exercise_name: ex.exercise_name,
          order_index:   ex.order_index,
        })
      }

      // Actualizar contador de uso
      await supabase.from('favorite_routines').update({
        times_used:   (routine.times_used||0) + 1,
        last_used_at: new Date().toISOString(),
      }).eq('id', routine.id)

      // Recargar sesión completa con ejercicios para pasarla a LiveWorkoutScreen
      const fullSession = await api.workouts.getSession(session.session.id)
      onStartSession(fullSession)
    } catch (err) {
      console.error('Start routine error:', err.message)
      alert('No se pudo iniciar la rutina: ' + err.message)
    } finally {
      setStarting(null)
    }
  }

  async function deleteRoutine(id) {
    await supabase.from('favorite_routines').delete().eq('id', id)
    setRoutines(r => r.filter(x => x.id !== id))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div style={{ width:20, height:20, border:`2px solid ${theme.primary}`,
          borderTopColor:'transparent', borderRadius:'50%', animation:'spin 1s linear infinite' }} />
      </div>
    )
  }

  if (!routines.length) {
    return (
      <div className="text-center py-10">
        <p style={{ fontSize:36 }}>⭐</p>
        <p className="font-semibold text-sm mt-2" style={{ color: theme.text }}>
          Sin rutinas guardadas
        </p>
        <p className="text-xs mt-1" style={{ color: theme.textMuted }}>
          Termina un entreno y guárdalo para repetirlo con un tap
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {routines.map(routine => (
        <motion.div key={routine.id} initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
          className="flex items-center gap-3 p-3 rounded-2xl"
          style={{ background: theme.surface, border:`1px solid ${theme.border}` }}>
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background:`${theme.primary}15` }}>
            {routine.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate" style={{ color: theme.text }}>{routine.name}</p>
            <p className="text-[11px]" style={{ color: theme.textMuted }}>
              {routine.exercises.length} ejercicios
              {routine.times_used > 0 && ` · usada ${routine.times_used}x`}
            </p>
          </div>
          <button onClick={() => deleteRoutine(routine.id)}
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: theme.surface2 }}>
            <Trash2 size={13} style={{ color: theme.textMuted }} />
          </button>
          <motion.button whileTap={{ scale:0.92 }}
            onClick={() => startRoutine(routine)}
            disabled={starting === routine.id}
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: theme.primary, opacity: starting===routine.id ? 0.6 : 1 }}>
            <Play size={15} color="#fff" />
          </motion.button>
        </motion.div>
      ))}
    </div>
  )
}
