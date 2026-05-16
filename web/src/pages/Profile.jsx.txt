import { useState } from 'react'
import { motion } from 'framer-motion'
import { LogOut, Edit2, Check } from 'lucide-react'
import { useStore } from '../store/useStore'
import { useNavigate } from 'react-router-dom'

const GOAL_LABELS = { lose_fat:'Perder grasa 🔥', gain_muscle:'Ganar músculo 💪', maintain:'Mantener peso ⚖️', recomp:'Recomposición 🔄', health:'Salud general ❤️' }
const ACTIVITY_LABELS = { sedentary:'Sedentario 🛋️', light:'Ligero 🚶', moderate:'Moderado 🏃', intense:'Intenso ⚡' }

export default function Profile() {
  const { profile, updateProfile, logout } = useStore()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    name: profile?.name || '',
    age: String(profile?.age || ''),
    weight_kg: String(profile?.weight_kg || ''),
    height_cm: String(profile?.height_cm || ''),
    goal: profile?.goal || '',
    activity_level: profile?.activity_level || '',
  })
  const navigate = useNavigate()

  async function save() {
    await updateProfile({
      ...form,
      age: parseInt(form.age) || null,
      weight_kg: parseFloat(form.weight_kg) || null,
      height_cm: parseFloat(form.height_cm) || null,
    })
    setEditing(false)
  }

  async function handleLogout() {
    await logout()
    navigate('/auth')
  }

  const imc = profile?.weight_kg && profile?.height_cm
    ? (profile.weight_kg / ((profile.height_cm / 100) ** 2)).toFixed(1)
    : null

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold">Perfil 👤</h1>
        <button onClick={() => editing ? save() : setEditing(true)}
          className="flex items-center gap-1.5 bg-surface-2 border border-white/10 rounded-xl px-4 py-2 text-sm font-medium active:scale-95 transition-all">
          {editing ? <><Check size={14} /> Guardar</> : <><Edit2 size={14} /> Editar</>}
        </button>
      </div>

      {/* Avatar + name */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-20 h-20 rounded-3xl bg-gradient-brand flex items-center justify-center text-3xl font-bold mb-3">
          {profile?.name?.[0]?.toUpperCase() || '?'}
        </div>
        <h2 className="text-xl font-bold">{profile?.name}</h2>
        <p className="text-white/40 text-sm">Nivel {profile?.level || 1} · {profile?.xp || 0} XP</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          ['⚖️', 'Peso', `${profile?.weight_kg || '–'} kg`],
          ['📏', 'Altura', `${profile?.height_cm || '–'} cm`],
          ['🔢', 'IMC', imc || '–'],
        ].map(([e, l, v]) => (
          <div key={l} className="card text-center">
            <p className="text-xl">{e}</p>
            <p className="font-bold">{v}</p>
            <p className="text-white/30 text-xs">{l}</p>
          </div>
        ))}
      </div>

      {/* Editable fields */}
      {editing ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card space-y-3 mb-5">
          {[['name','Nombre','text'],['age','Edad','number'],['weight_kg','Peso (kg)','number'],['height_cm','Altura (cm)','number']].map(([k,p,t]) => (
            <div key={k}>
              <label className="label">{p}</label>
              <input className="input" type={t} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
            </div>
          ))}
          <div>
            <label className="label">Objetivo</label>
            <select className="input" value={form.goal} onChange={e => setForm(f => ({ ...f, goal: e.target.value }))}>
              {Object.entries(GOAL_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Actividad</label>
            <select className="input" value={form.activity_level} onChange={e => setForm(f => ({ ...f, activity_level: e.target.value }))}>
              {Object.entries(ACTIVITY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        </motion.div>
      ) : (
        <div className="card mb-5 space-y-3">
          {[
            ['🎯', 'Objetivo', GOAL_LABELS[profile?.goal] || '–'],
            ['🏃', 'Actividad', ACTIVITY_LABELS[profile?.activity_level] || '–'],
            ['🌙', 'Sueño habitual', `${profile?.sleep_hours || '–'} h`],
            ['🔥', 'Racha actual', `${profile?.streak || 0} días`],
          ].map(([e, l, v]) => (
            <div key={l} className="flex items-center justify-between py-1">
              <span className="text-white/50 text-sm flex items-center gap-2">{e} {l}</span>
              <span className="text-sm font-medium">{v}</span>
            </div>
          ))}
        </div>
      )}

      {/* Logout */}
      <button onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-accent-red/30 text-accent-red text-sm font-medium active:bg-accent-red/10 transition-all">
        <LogOut size={14} /> Cerrar sesión
      </button>
    </div>
  )
}
