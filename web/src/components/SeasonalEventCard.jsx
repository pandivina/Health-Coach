import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../contexts/ThemeProvider'
import { useStore } from '../store/useStore'
import { getCurrentEvent } from '../data/seasonalEvents' // 👈 Importamos el selector de lore

export default function SeasonalEventCard() {
  const { theme } = useTheme()
  const { addXP } = useStore()
  
  // 1. Cargamos dinámicamente el Lore correspondiente al día de hoy
  const [currentEvent] = useState(() => getCurrentEvent())
  
  // Calculamos el objeto de fecha real del evento activo
  const eventEndsAt = currentEvent.endsAt()
  
  // Pasamos la fecha final real al custom hook del countdown
  const countdown = useCountdown(eventEndsAt)
  const [expanded, setExpanded] = useState(false)
  const [unlocked, setUnlocked] = useState(false)
  const [particles, setParticles] = useState(false)
  
  const [progress, setProgress] = useState(() => {
    const saved = localStorage.getItem(`event_${currentEvent.id}`)
    return saved ? JSON.parse(saved) : { steel: 0, mana: 0, astral: 0 }
  })

  function saveProgress(next) {
    setProgress(next)
    localStorage.setItem(`event_${currentEvent.id}`, JSON.stringify(next))
  }

  function addMissionProgress(missionId, amount) {
    const next = { ...progress, [missionId]: Math.min(progress[missionId] + amount, getMission(missionId).target) }
    saveProgress(next)
  }

  function getMission(id) { return currentEvent.missions.find(m => m.id === id) }
  function getMissionPct(id) { return Math.min((progress[id] / getMission(id).target) * 100, 100) }
  function isMissionDone(id) { return progress[id] >= getMission(id).target }

  const completedMissions = currentEvent.missions.filter(m => isMissionDone(m.id)).length
  const totalPct = Math.round((completedMissions / currentEvent.missions.length) * 100)
  const allDone  = completedMissions === currentEvent.missions.length

  async function claimReward() {
    if (!allDone || unlocked) return
    setParticles(true)
    setUnlocked(true)
    await addXP(500)
    setTimeout(() => setParticles(false), 1500)
  }

  if (countdown.expired) return null

  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      className="relative mb-4 rounded-3xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0F0C1A, #1A0F2E, #0C1A2E)',
        border: '1.5px solid transparent',
        backgroundClip: 'padding-box',
      }}
    >
      {/* ─── BORDE CONIC DINÁMICO SEGÚN LORE ─── */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0 rounded-3xl pointer-events-none"
        style={{
          background: currentEvent.styles.borderGradient,
          padding: '1.5px',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }} 
      />

      {/* ─── RADIAL GLOW DINÁMICO SEGÚN LORE ─── */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: currentEvent.styles.bgGlow }} />

      {particles && <MysticParticles customColors={currentEvent.styles.particleColors} />}

      <div className="relative p-4">
        {/* Header */}
        <button onClick={() => setExpanded(e => !e)} className="w-full text-left">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <motion.span
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                style={{ fontSize: 28, flexShrink: 0 }}>
                {currentEvent.emoji}
              </motion.span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-extrabold text-sm text-white truncate">{currentEvent.name}</p>
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: currentEvent.styles.tagBg, color: currentEvent.styles.tagText }}>
                    TEMPORADA
                  </span>
                </div>
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {currentEvent.subtitle}
                </p>
              </div>
            </div>

            {/* Countdown */}
            <div className="flex-shrink-0 text-right">
              <p className="text-[9px] font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>TERMINA EN</p>
              <p className="font-black text-xs" style={{ color: currentEvent.styles.accentColor }}>
                {countdown.days}d {countdown.hours}h {countdown.minutes}m
              </p>
            </div>
          </div>

          {/* Progreso */}
          <div className="mb-2">
            <div className="flex justify-between items-center mb-1">
              <p className="text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.6)' }}>Progreso del evento</p>
              <p className="text-[10px] font-black" style={{ color: currentEvent.styles.accentColor }}>
                {completedMissions}/{currentEvent.missions.length} misiones · {totalPct}%
              </p>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <motion.div className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${totalPct}%` }}
                style={{ background: currentEvent.styles.accentColor }} />
            </div>
          </div>
        </button>

        {/* Misiones Expandidas */}
        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
              <div className="mt-3 space-y-2">
                {currentEvent.missions.map((mission, i) => {
                  const pct  = getMissionPct(mission.id)
                  const done = isMissionDone(mission.id)
                  return (
                    <div key={mission.id} className="rounded-2xl p-3 border" style={{ background: done ? `${mission.color}15` : 'rgba(255,255,255,0.05)', borderColor: done ? `${mission.color}40` : 'rgba(255,255,255,0.08)' }}>
                      <div className="flex items-start gap-2 mb-2">
                        <span style={{ fontSize: 18, flexShrink: 0 }}>{mission.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-xs text-white">{mission.name}</p>
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: `${mission.color}20`, color: mission.color }}>{mission.school}</span>
                          </div>
                          <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{mission.desc}</p>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden mb-1" style={{ background: 'rgba(255,255,255,0.1)' }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: mission.color }} />
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{progress[mission.id]}/{mission.target} {mission.unit}</p>
                        {!done && (
                          <button onClick={() => addMissionProgress(mission.id, Math.round(mission.target * 0.25))} className="text-[10px] font-bold px-2 py-0.5 rounded-lg" style={{ background: `${mission.color}20`, color: mission.color }}>+25%</button>
                        )}
                      </div>
                    </div>
                  )
                })}

                {/* Caja de Recompensa Final */}
                <div className="rounded-2xl p-3 mt-1 border" style={{ background: unlocked ? `linear-gradient(135deg, ${currentEvent.styles.accentColor}20, rgba(124,58,237,0.2))` : 'rgba(255,255,255,0.04)', borderColor: unlocked ? `${currentEvent.styles.accentColor}60` : 'rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center gap-3">
                    <span style={{ fontSize: 28 }}>{unlocked ? '✨' : allDone ? currentEvent.reward.emoji : '🔒'}</span>
                    <div className="flex-1">
                      <p className="font-bold text-xs" style={{ color: allDone ? currentEvent.styles.accentColor : 'rgba(255,255,255,0.3)' }}>{unlocked ? '¡Recompensa obtenida!' : currentEvent.reward.name}</p>
                      <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{unlocked ? 'Añadido a tu inventario · +500 XP' : currentEvent.reward.desc}</p>
                    </div>
                    {allDone && !unlocked && (
                      <button onClick={claimReward} className="px-3 py-1.5 rounded-xl font-black text-xs text-white" style={{ background: `linear-gradient(135deg, #7C3AED, ${currentEvent.styles.accentColor})` }}>¡Reclamar!</button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// Subcomponente de partículas adaptado para recibir los colores del Lore activo
function MysticParticles({ customColors }) {
  const particles = Array.from({ length: 12 }, (_, i) => i)
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
      {particles.map(i => (
        <motion.div key={i}
          initial={{ opacity: 1, scale: 0, x: '50%', y: '50%' }}
          animate={{ opacity: 0, scale: [0, 1.5, 0], x: `${50 + (Math.cos(i * 30 * Math.PI / 180) * 120)}%`, y: `${50 + (Math.sin(i * 30 * Math.PI / 180) * 120)}%` }}
          transition={{ duration: 1.2, delay: i * 0.05, ease: 'easeOut' }}
          className="absolute w-2 h-2 rounded-full"
          style={{ background: customColors[i % 4], filter: 'blur(1px)' }} />
      ))}
    </div>
  )
}

// (Conserva abajo tu función original `useCountdown` intacta)
