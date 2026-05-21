import { useState } from 'react'
import { motion } from 'framer-motion'
import { Palette } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { useTheme } from '../contexts/ThemeProvider'
import { PET_THEME_MAP, THEMES } from '../lib/themes'

const PETS = [
  { type: 'panda',  emoji: '🐼', name: 'Panda',        free: true,  desc: 'Tu compañero por defecto' },
  { type: 'cat',    emoji: '🐱', name: 'Gato zen',      free: false, desc: 'Sereno y misterioso' },
  { type: 'dog',    emoji: '🐶', name: 'Perro atleta',  free: false, desc: 'Energía y lealtad' },
  { type: 'fox',    emoji: '🦊', name: 'Zorro astuto',  free: false, desc: 'Inteligente y ágil' },
  { type: 'rabbit', emoji: '🐰', name: 'Conejo veloz',  free: false, desc: 'Rápido y consistente' },
]
const HATS = ['🎩','👒','⛑️','🎓','👑','🪖']
const BOWS = ['🎀','🎗️','🌸','⭐','🌈','💫']

export default function Pet() {
  const { profile, updateProfile } = useStore()
  const { theme, followPetTheme, applyPetTheme, themeId } = useTheme()
  const [selectedHat, setSelectedHat] = useState(null)
  const [selectedBow, setSelectedBow] = useState(null)
  const [editName, setEditName] = useState(false)
  const [petName, setPetName] = useState(profile?.pet_name || 'Panda')
  const isPremium = false

  async function changePet(type) {
    if (!PETS.find(p => p.type === type)?.free && !isPremium) {
      alert('🌟 Esta mascota es Premium.')
      return
    }
    await updateProfile({ pet_type: type })
    // Aplicar tema si está activado
    if (followPetTheme) {
      await applyPetTheme(type)
    }
  }

  async function saveName() {
    await updateProfile({ pet_name: petName })
    setEditName(false)
  }

  const currentPet = PETS.find(p => p.type === profile?.pet_type) || PETS[0]
  const petThemeId = PET_THEME_MAP[currentPet.type]
  const petTheme = petThemeId ? THEMES[petThemeId] : null

  return (
    <div className="page text-center">
      <h1 className="text-2xl font-extrabold mb-6 text-left" style={{ color: theme.text }}>
        Mascota 🐾
      </h1>

      {/* Pet display */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
        className="text-8xl mb-2">
        {selectedHat || ''}{currentPet.emoji}{selectedBow || ''}
      </motion.div>

      {/* Name */}
      {editName ? (
        <div className="flex items-center gap-2 justify-center mb-6">
          <input className="input w-40 text-center text-sm" value={petName}
            onChange={e => setPetName(e.target.value)} autoFocus />
          <button onClick={saveName}
            className="px-3 py-2 rounded-xl text-white text-sm font-bold"
            style={{ background: theme.primary }}>
            ✓
          </button>
        </div>
      ) : (
        <button onClick={() => setEditName(true)}
          className="text-xl font-bold mb-1 transition-colors"
          style={{ color: theme.text }}>
          {profile?.pet_name || 'Panda'}
        </button>
      )}
      <p className="text-sm mb-2" style={{ color: theme.textMuted }}>{currentPet.desc}</p>

      {/* Tema asociado */}
      {petTheme && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-6 text-xs font-medium"
          style={{ background: `${petTheme.primary}20`, color: petTheme.primary }}>
          <Palette size={11} />
          Tema: {petTheme.name}
          {themeId === petThemeId && <span className="ml-1">✓ Activo</span>}
        </div>
      )}

      {/* Level */}
      <div className="card inline-flex items-center gap-3 mb-6" style={{ borderColor: theme.border }}>
        <div>
          <p className="font-semibold text-sm" style={{ color: theme.text }}>
            Nivel {profile?.level || 1}
          </p>
          <p className="text-xs" style={{ color: theme.textMuted }}>{profile?.xp || 0} XP</p>
        </div>
        <div className="w-24 h-1.5 rounded-full overflow-hidden"
          style={{ background: theme.surface2 }}>
          <div className="h-full rounded-full" style={{
            background: theme.gradientBrand,
            width: `${((profile?.xp || 0) % 500) / 5}%`
          }} />
        </div>
        <span className="text-yellow-400 text-sm font-bold">⚡</span>
      </div>

      {/* Vínculo con Pandi */}
{(() => {
  const BOND = [
    { level:1, name:'Conocidos',     xp:0,    next:100,  msg:'Hola, me alegra conocerte 🐼' },
    { level:2, name:'Amigos',        xp:100,  next:300,  msg:'Ya me sé tu nombre de memoria 🐾' },
    { level:3, name:'Buenos amigos', xp:300,  next:600,  msg:'Empiezo a conocer tus patrones' },
    { level:4, name:'Inseparables',  xp:600,  next:1000, msg:'Llevas mucho tiempo cuidándome 🐼' },
    { level:5, name:'Familia',       xp:1000, next:1000, msg:'No me imagino sin ti ya 🐼❤️' },
  ]
  const bondXP  = profile?.bond_xp    || 0
  const current = BOND.find(b => b.level === (profile?.bond_level || 1)) || BOND[0]
  const next    = BOND.find(b => b.level === current.level + 1)
  const pct     = next
    ? Math.min(((bondXP - current.xp) / (next.xp - current.xp)) * 100, 100)
    : 100

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
      className="card mb-6 text-left"
      style={{ background: `${theme.primary}10`, border: `1px solid ${theme.primary}20` }}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide"
            style={{ color: theme.primary }}>Vínculo con {profile?.pet_name || 'Pandi'}</p>
          <p className="font-extrabold text-base" style={{ color: theme.text }}>{current.name}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black" style={{ color: theme.primary }}>{current.level}</p>
          <p className="text-[10px]" style={{ color: theme.textMuted }}>/ 5</p>
        </div>
      </div>

      <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ background: theme.surface2 }}>
        <motion.div className="h-full rounded-full"
          style={{ background: theme.gradientBrand }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8 }} />
      </div>

      <p className="text-xs italic mb-2" style={{ color: theme.textMuted }}>
        "{current.msg}"
      </p>

      {next && (
        <p className="text-[10px]" style={{ color: theme.textLight }}>
          {next.xp - bondXP} puntos para "{next.name}"
        </p>
      )}
    </motion.div>
  )
})()}

      {/* Accessories */}
      <div className="text-left mb-5">
        <p className="section-title">Sombreros</p>
        <div className="flex gap-2 flex-wrap">
          {HATS.map(h => (
            <motion.button key={h} whileTap={{ scale: 0.85 }}
              onClick={() => setSelectedHat(selectedHat === h ? null : h)}
              className="text-2xl p-2 rounded-xl border transition-all"
              style={{
                borderColor: selectedHat === h ? theme.primary : theme.border,
                background: selectedHat === h ? `${theme.primary}15` : theme.surface,
              }}>
              {h}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="text-left mb-6">
        <p className="section-title">Pajaritas</p>
        <div className="flex gap-2 flex-wrap">
          {BOWS.map(b => (
            <motion.button key={b} whileTap={{ scale: 0.85 }}
              onClick={() => setSelectedBow(selectedBow === b ? null : b)}
              className="text-2xl p-2 rounded-xl border transition-all"
              style={{
                borderColor: selectedBow === b ? theme.primary : theme.border,
                background: selectedBow === b ? `${theme.primary}15` : theme.surface,
              }}>
              {b}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Cambiar tema */}
      <Link to="/appearance" className="card flex items-center gap-3 mb-5 text-left">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${theme.primary}20` }}>
          <Palette size={18} style={{ color: theme.primary }} />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm" style={{ color: theme.text }}>Cambiar tema visual</p>
          <p className="text-xs" style={{ color: theme.textMuted }}>Personaliza los colores de la app</p>
        </div>
        <span style={{ color: theme.textMuted }}>›</span>
      </Link>

      {/* Pet selection */}
      <p className="section-title text-left">Elige tu mascota</p>
      <div className="grid grid-cols-1 gap-2">
        {PETS.map(p => (
          <motion.button key={p.type} whileTap={{ scale: 0.98 }}
            onClick={() => changePet(p.type)}
            className="flex items-center gap-3 p-3 rounded-xl border text-left transition-all"
            style={{
              borderColor: profile?.pet_type === p.type ? theme.primary : theme.border,
              background: profile?.pet_type === p.type ? `${theme.primary}10` : theme.surface,
            }}>
            <span className="text-3xl">{p.emoji}</span>
            <div className="flex-1">
              <p className="font-semibold text-sm" style={{ color: theme.text }}>{p.name}</p>
              <p className="text-xs" style={{ color: theme.textMuted }}>{p.desc}</p>
              {PET_THEME_MAP[p.type] && (
                <span className="text-[10px]" style={{ color: theme.textLight }}>
                  🎨 {THEMES[PET_THEME_MAP[p.type]]?.name}
                </span>
              )}
            </div>
            {!p.free && (
              <span className="text-xs font-bold" style={{ color: theme.warning }}>⭐ Premium</span>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  )
}
