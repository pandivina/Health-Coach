import { useState } from 'react'
import { motion } from 'framer-motion'
import { LogOut, Edit2, Check, Sparkles, Palette } from 'lucide-react'
import { useStore } from '../store/useStore'
import { useNavigate, Link } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeProvider'
import { useTour } from '../hooks/useTour'
import TourHelpButton from '../components/tour/TourHelpButton'
import InstallPWA from '../components/InstallPWA'
import NotificationSetup from '../components/NotificationSetup'

const GOAL_LABELS = { lose_fat:'Perder grasa 🔥', gain_muscle:'Ganar músculo 💪', maintain:'Mantener peso ⚖️', recomp:'Recomposición 🔄', health:'Salud general ❤️' }
const ACTIVITY_LABELS = { sedentary:'Sedentario 🛋️', light:'Ligero 🚶', moderate:'Moderado 🏃', intense:'Intenso ⚡' }

export default function Profile() {
  const { profile, updateProfile, logout } = useStore()
  const { theme } = useTheme()
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

  useTour('profile')

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
          className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium active:scale-95 transition-all"
          style={{ background: theme.surface, border: `1px solid ${theme.border}`, color: theme.text }}>
          {editing ? <><Check size={14} /> Guardar</> : <><Edit2 size={14} /> Editar</>}
        </button>
      </div>

      {/* Avatar + name */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-3xl font-bold mb-3"
          style={{ background: theme.gradientBrand }}>
          {profile?.name?.[0]?.toUpperCase() || '?'}
        </div>
        <h2 className="text-xl font-bold" style={{ color: theme.text }}>{profile?.name}</h2>
        <p className="text-sm" style={{ color: theme.textMuted }}>
          Nivel {profile?.level || 1} · {profile?.xp || 0} XP
        </p>
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
            <p className="font-bold" style={{ color: theme.text }}>{v}</p>
            <p className="text-xs" style={{ color: theme.textMuted }}>{l}</p>
          </div>
        ))}
      </div>

      {/* Editable fields */}
      {editing ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="card space-y-3 mb-5" data-tour="profile-data">
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
        <div className="card mb-5 space-y-3" data-tour="profile-data">
          {[
            ['🎯', 'Objetivo', GOAL_LABELS[profile?.goal] || '–'],
            ['🏃', 'Actividad', ACTIVITY_LABELS[profile?.activity_level] || '–'],
            ['🌙', 'Sueño habitual', `${profile?.sleep_hours || '–'} h`],
            ['🔥', 'Racha actual', `${profile?.streak || 0} días`],
          ].map(([e, l, v]) => (
            <div key={l} className="flex items-center justify-between py-1">
              <span className="text-sm flex items-center gap-2" style={{ color: theme.textMuted }}>{e} {l}</span>
              <span className="text-sm font-medium" style={{ color: theme.text }}>{v}</span>
            </div>
          ))}
        </div>
      )}

      {/* Premium banner */}
      <Link to="/premium" data-tour="profile-premium">
        <motion.div whileTap={{ scale: 0.97 }}
          className="w-full flex items-center gap-3 p-4 rounded-2xl mb-3"
          style={{ background: theme.gradientBrand }}>
          <Sparkles size={20} className="text-white flex-shrink-0" />
          <div>
            <p className="font-bold text-white text-sm">Hazte Premium ⭐</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>7 días gratis · Cancela cuando quieras</p>
          </div>
          <span className="ml-auto text-white/70">›</span>
        </motion.div>
      </Link>
{/* Seguimiento menstrual — solo si sexo femenino o no especificado */}
{(profile?.sex === 'female' || !profile?.sex) && (
  <div className="card mb-5 flex items-center justify-between"
    style={{ border: `1px solid ${theme.border}` }}>
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl"
        style={{ background: '#FEE2E2' }}>
        🩸
      </div>
      <div>
        <p className="font-semibold text-sm" style={{ color: theme.text }}>
          Seguimiento del ciclo
        </p>
        <p className="text-xs" style={{ color: theme.textMuted }}>
          Calendario menstrual en Mi Bienestar
        </p>
      </div>
    </div>
    <button
      onClick={async () => {
        const next = !profile?.menstrual_tracking_enabled
        await updateProfile({ menstrual_tracking_enabled: next })
      }}
      className="w-12 h-7 rounded-full relative transition-all flex-shrink-0"
      style={{ background: profile?.menstrual_tracking_enabled ? theme.primary : theme.surface2 }}>
      <motion.div
        animate={{ x: profile?.menstrual_tracking_enabled ? 20 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute top-1.5 w-4 h-4 rounded-full bg-white shadow-sm" />
    </button>
  </div>
)}{/* Seguimiento menstrual — solo si sexo femenino o no especificado */}
{(profile?.sex === 'female' || !profile?.sex) && (
  <div className="card mb-5 flex items-center justify-between"
    style={{ border: `1px solid ${theme.border}` }}>
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl"
        style={{ background: '#FEE2E2' }}>
        🩸
      </div>
      <div>
        <p className="font-semibold text-sm" style={{ color: theme.text }}>
          Seguimiento del ciclo
        </p>
        <p className="text-xs" style={{ color: theme.textMuted }}>
          Calendario menstrual en Mi Bienestar
        </p>
      </div>
    </div>
    <button
      onClick={async () => {
        const next = !profile?.menstrual_tracking_enabled
        await updateProfile({ menstrual_tracking_enabled: next })
      }}
      className="w-12 h-7 rounded-full relative transition-all flex-shrink-0"
      style={{ background: profile?.menstrual_tracking_enabled ? theme.primary : theme.surface2 }}>
      <motion.div
        animate={{ x: profile?.menstrual_tracking_enabled ? 20 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute top-1.5 w-4 h-4 rounded-full bg-white shadow-sm" />
    </button>
  </div>
)}
      {/* Apariencia */}
      <Link to="/appearance" data-tour="profile-appearance">
        <motion.div whileTap={{ scale: 0.97 }}
          className="w-full flex items-center gap-3 p-4 rounded-2xl mb-5"
          style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: `${theme.primary}20` }}>
            <Palette size={18} style={{ color: theme.primary }} />
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: theme.text }}>Apariencia</p>
            <p className="text-xs" style={{ color: theme.textMuted }}>Temas y colores de la app</p>
          </div>
          <span className="ml-auto" style={{ color: theme.textMuted }}>›</span>
        </motion.div>
      </Link>

      {/* Instalar app */}
<div className="mb-5">
  <InstallPWA />
</div>

{/* Notificaciones */}
<div className="mb-5">
  <NotificationSetup />
</div>

{/* Logout */}
<button onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all"
        style={{ border: `1px solid ${theme.error}50`, color: theme.error }}>
        <LogOut size={14} /> Cerrar sesión
      </button>

      <TourHelpButton tourKey="profile" />
    </div>
  )
}
