import { useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store/useStore'

const PETS = [
  { type: 'panda',  emoji: '🐼', name: 'Panda Coach', free: true,  desc: 'Tu compañero por defecto' },
  { type: 'cat',    emoji: '🐱', name: 'Gato zen',    free: false, desc: 'Sereno y sabio' },
  { type: 'dog',    emoji: '🐶', name: 'Perro atleta', free: false, desc: 'Energía infinita' },
  { type: 'fox',    emoji: '🦊', name: 'Zorro astuto', free: false, desc: 'Inteligente y ágil' },
  { type: 'rabbit', emoji: '🐰', name: 'Conejo veloz', free: false, desc: 'Rápido y consistente' },
]
const HATS = ['🎩','👒','⛑️','🎓','👑','🪖']
const BOWS = ['🎀','🎗️','🌸','⭐','🌈','💫']

export default function Pet() {
  const { profile, updateProfile } = useStore()
  const [selectedHat, setSelectedHat] = useState(null)
  const [selectedBow, setSelectedBow] = useState(null)
  const [editName, setEditName] = useState(false)
  const [petName, setPetName] = useState(profile?.pet_name || 'Panda')

  const currentPet = PETS.find(p => p.type === profile?.pet_type) || PETS[0]
  const isPremium = false // TODO: conectar con subscriptions

  async function changePet(type) {
    if (!PETS.find(p => p.type === type)?.free && !isPremium) {
      alert('🌟 Esta mascota es Premium. ¡Actualiza tu plan para desbloquearla!')
      return
    }
    await updateProfile({ pet_type: type })
  }

  async function saveName() {
    await updateProfile({ pet_name: petName })
    setEditName(false)
  }

  return (
    <div className="page text-center">
      <h1 className="text-2xl font-extrabold mb-6 text-left">Mascota 🐾</h1>

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
          <input className="input w-40 text-center text-sm" value={petName} onChange={e => setPetName(e.target.value)} autoFocus />
          <button onClick={saveName} className="bg-accent text-white text-sm px-3 py-2 rounded-xl">✓</button>
        </div>
      ) : (
        <button onClick={() => setEditName(true)} className="text-xl font-bold mb-1 hover:text-accent transition-colors">{profile?.pet_name || 'Panda'}</button>
      )}
      <p className="text-white/40 text-sm mb-6">{currentPet.desc}</p>

      {/* Level */}
      <div className="card inline-flex items-center gap-3 mb-8">
        <div>
          <p className="font-semibold text-sm">Nivel {profile?.level || 1}</p>
          <p className="text-white/40 text-xs">{profile?.xp || 0} XP</p>
        </div>
        <div className="w-24 h-1.5 bg-surface-3 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-brand rounded-full" style={{ width: `${((profile?.xp || 0) % 500) / 5}%` }} />
        </div>
        <span className="text-yellow-400 text-sm font-bold">⚡</span>
      </div>

      {/* Accessories */}
      <div className="text-left mb-6">
        <p className="section-title">Sombreros</p>
        <div className="flex gap-3 flex-wrap">
          {HATS.map(h => (
            <motion.button key={h} whileTap={{ scale: 0.85 }} onClick={() => setSelectedHat(selectedHat === h ? null : h)}
              className={`text-2xl p-2 rounded-xl border transition-all ${selectedHat === h ? 'border-accent bg-accent/10' : 'border-white/10 bg-surface-2'}`}>{h}</motion.button>
          ))}
        </div>
      </div>
      <div className="text-left mb-6">
        <p className="section-title">Pajaritas</p>
        <div className="flex gap-3 flex-wrap">
          {BOWS.map(b => (
            <motion.button key={b} whileTap={{ scale: 0.85 }} onClick={() => setSelectedBow(selectedBow === b ? null : b)}
              className={`text-2xl p-2 rounded-xl border transition-all ${selectedBow === b ? 'border-accent bg-accent/10' : 'border-white/10 bg-surface-2'}`}>{b}</motion.button>
          ))}
        </div>
      </div>

      {/* Pet selection */}
      <p className="section-title text-left">Elige tu mascota</p>
      <div className="grid grid-cols-1 gap-2">
        {PETS.map(p => (
          <motion.button key={p.type} whileTap={{ scale: 0.98 }} onClick={() => changePet(p.type)}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
              profile?.pet_type === p.type ? 'border-accent bg-accent/10' : 'border-white/10 bg-surface-2'
            }`}>
            <span className="text-3xl">{p.emoji}</span>
            <div className="flex-1">
              <p className="font-semibold text-sm">{p.name}</p>
              <p className="text-white/40 text-xs">{p.desc}</p>
            </div>
            {!p.free && <span className="text-yellow-400 text-xs font-bold">⭐ Premium</span>}
          </motion.button>
        ))}
      </div>
    </div>
  )
}
