import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../contexts/ThemeProvider'
import { useStore } from '../store/useStore'
import { getCurrentEvent } from '../data/seasonalEvents'

// ─── COUNTDOWN HOOK ──────────────────────────────────────────────────────────
function useCountdown(targetDate) {
  const [timeLeft, setTimeLeft] = useState({})

  useEffect(() => {
    function calc() {
      const diff = targetDate - Date.now()
      if (diff <= 0) return setTimeLeft({ expired: true })
      setTimeLeft({
        days:    Math.floor(diff / 86400000),
        hours:   Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
        urgent:  diff < 86400000,
      })
    }
    calc()
    const t = setInterval(calc, 1000)
    return () => clearInterval(t)
  }, [targetDate])

  return timeLeft
}

// ─── PARTICLES SUB-COMPONENT ─────────────────────────────────────────────────
function MysticParticles({ customColors }) {
  const particles = Array.from({ length: 12 }, (_, i) => i)
  const colors = customColors || ['#F97316', '#7C3AED', '#DC2626', '#F59E0B']
  
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
      {particles.map(i => (
        <motion.div key={i}
          initial={{ opacity: 1, scale: 0, x: '50%', y: '50%' }}
          animate={{
            opacity: 0, scale: [0, 1.5, 0],
            x: `${50 + (Math.cos(i * 30 * Math.PI / 180) * 120)}%`,
            y: `${50 + (Math.sin(i * 30 * Math.PI / 180) * 120)}%`,
          }}
          transition={{ duration: 1.2, delay: i * 0.05, ease: 'easeOut' }}
          className="absolute w-2 h-2 rounded-full"
          style={{
            background: colors[i % colors.length],
            filter: 'blur(1px)',
          }} />
      ))}
    </div>
  )
}

// ─── MAIN COMPONENT (EXPORT DEFAULT EXPLÍCITO) ───────────────────────────────
export default function SeasonalEventCard() {
  const { theme }         = useTheme()
  const { addXP }         = useStore()
  
  // Captura el evento dinámico según el mes actual del año
  const [currentEvent]    = useState(() => getCurrentEvent())
  const eventEndsAt       = currentEvent.endsAt()
  const countdown         = useCountdown(eventEndsAt)
  
  const [expanded,   setExpanded]   = useState(false)
  const [unlocked,   setUnlocked]   = useState(false)
  const [particles,  setParticles]  = useState(false)
  
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
      {/* Borde dinámico según estación */}
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

      {/* Radial Glow dinámico según estación */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: currentEvent.styles.bgGlow }} />

      {particles && <MysticParticles customColors={currentEvent.styles.borderGradient} />}

      <div className="relative p-4">

        {/* Botón Header */}
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

            {/* Contador */}
            <div className="flex-shrink-0 text-right">
              <p className="text-[9px] font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>TERMINA EN</p>
              <p className="font-black text-xs" style={{ color: currentEvent.styles.accentColor }}>
                {countdown.days}d {countdown.hours}h {countdown.minutes}m
              </p>
            </div>
          </div>

          {/* Barra de Progreso Global */}
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
                transition={{ duration: 0.8 }}
                style={{ background: currentEvent.styles.accentColor }} />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {expanded ? 'Ocultar detalles' : 'Ver misiones, rutinas y dietas'}
            </p>
            <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}
              style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>▾</motion.span>
          </div>
        </button>

        {/* Contenido Expandido */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden' }}>
              <div className="mt-3 space-y-2">
                
                {/* 🏋️‍♂️ ENFOQUE DE WORKOUT ADAPTADO */}
                <div className="rounded-2xl p-3 border" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)' }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span style={{ fontSize: 14 }}>🏋️‍♂️</span>
                    <p className="font-bold text-xs text-white">Objetivo Workout: {currentEvent.workoutFocus.goal}</p>
                  </div>
                  <p className="text-[10px] text-gray-400 leading-relaxed">{currentEvent.workoutFocus.desc}</p>
                </div>

                {/* 🍎 DIETA Y ALIMENTOS DE TEMPORADA */}
                <div className="rounded-2xl p-3 border" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)' }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span style={{ fontSize: 14 }}>🍎</span>
                    <p className="font-bold text-xs text-white">Nutrición: {currentEvent.dietFocus.strategy}</p>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {currentEvent.dietFocus.foods.map((food, idx) => (
                      <span key={idx} className="text-[9px] font-medium px-2 py-0.5 rounded-md bg-white/5 text-gray-300 border border-white/10">
                        {food}
                      </span>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-400 bg-black/20 p-2 rounded-xl italic border border-white/5">
                    <strong>Tip:</strong> {currentEvent.dietFocus.tip}
                  </p>
                </div>

                {/* LISTA DE MISIONES DEL LORE */}
                {currentEvent.missions.map((mission, i) => {
                  const pct  = getMissionPct(mission.id)
                  const done = isMissionDone(mission.id)
                  return (
                    <motion.div key={mission.id}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="rounded-2xl p-3"
                      style={{
                        background: done ? `${mission.color}15` : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${done ? mission.color + '40' : 'rgba(255,255,255,0.08)'}`,
                      }}>
                      <div className="flex items-start gap-2 mb-2">
                        <span style={{ fontSize: 18, flexShrink: 0 }}>{mission.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-xs text-white">{mission.name}</p>
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: `${mission.color}20`, color: mission.color }}>
                              {mission.school}
                            </span>
                          </div>
                          <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{mission.desc}</p>
                        </div>
                        {done && <span className="text-green-400 text-sm flex-shrink-0">✓</span>}
                      </div>

                      <div className="h-1.5 rounded-full overflow-hidden mb-1" style={{ background: 'rgba(255,255,255,0.1)' }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: mission.color }} />
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{progress[mission.id]}/{mission.target} {mission.unit}</p>
                        {!done && (
                          <button onClick={() => addMissionProgress(mission.id, Math.round(mission.target * 0.25))}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
                            style={{ background: `${mission.color}20`, color: mission.color }}>
                            +25%
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )
                })}

                {/* RECOMPENSA FINAL */}
                <div className="rounded-2xl p-3 mt-1 border"
                  style={{
                    background: unlocked ? 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(124,58,237,0.1))' : 'rgba(255,255,255,0.04)',
                    borderColor: unlocked ? `${currentEvent.styles.accentColor}60` : 'rgba(255,255,255,0.06)'
                  }}>
                  <div className="flex items-center gap-3">
                    <span style={{ fontSize: 28 }}>{unlocked ? '✨' : allDone ? currentEvent.reward.emoji : '🔒'}</span>
                    <div className="flex-1">
                      <p className="font-bold text-xs" style={{ color: allDone ? currentEvent.styles.accentColor : 'rgba(255,255,255,0.3)' }}>
                        {unlocked ? '¡Recompensa Reclamada!' : currentEvent.reward.name}
                      </p>
                      <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        {unlocked ? 'Plan estacional desbloqueado · +500 XP' : currentEvent.reward.desc}
                      </p>
                    </div>
                    {allDone && !unlocked && (
                      <button onClick={claimReward} className="px-3 py-1.5 rounded-xl font-black text-xs text-white"
                        style={{ background: `linear-gradient(135deg, #7C3AED, ${currentEvent.styles.accentColor})` }}>
                        ¡Reclamar!
                      </button>
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
