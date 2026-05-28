import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../contexts/ThemeProvider'
import { useStore } from '../store/useStore'
import { getActiveEvent } from '../data/seasonalEvents'

// ─── COUNTDOWN ───────────────────────────────────────────────────────────────

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
        urgent:  diff < 86400000,
      })
    }
    calc()
    const t = setInterval(calc, 1000)
    return () => clearInterval(t)
  }, [targetDate])
  return timeLeft
}

// ─── PARTÍCULAS MÍSTICAS ─────────────────────────────────────────────────────

function MysticParticles({ colors }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
      {Array.from({ length: 12 }, (_, i) => (
        <motion.div key={i}
          initial={{ opacity: 1, scale: 0, x: '50%', y: '50%' }}
          animate={{
            opacity: 0, scale: [0, 1.5, 0],
            x: `${50 + Math.cos(i * 30 * Math.PI / 180) * 120}%`,
            y: `${50 + Math.sin(i * 30 * Math.PI / 180) * 120}%`,
          }}
          transition={{ duration: 1.2, delay: i * 0.05, ease: 'easeOut' }}
          className="absolute w-2 h-2 rounded-full"
          style={{ background: colors[i % colors.length], filter: 'blur(1px)' }} />
      ))}
    </div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function SeasonalEventCard() {
  const { theme }      = useTheme()
  const { addXP }      = useStore()
  const EVENT          = getActiveEvent()
  const countdown      = useCountdown(EVENT?.endsAt || new Date())
  const [expanded,     setExpanded]     = useState(false)
  const [unlocked,     setUnlocked]     = useState(false)
  const [particles,    setParticles]    = useState(false)
  const [progress,     setProgress]     = useState(() => {
    if (!EVENT) return {}
    const saved = localStorage.getItem(`event_${EVENT.id}`)
    return saved ? JSON.parse(saved) : Object.fromEntries(EVENT.missions.map(m => [m.id, 0]))
  })

  // No mostrar si no hay evento activo
  if (!EVENT || countdown.expired) return null

  const S = EVENT.styles

  function saveProgress(next) {
    setProgress(next)
    localStorage.setItem(`event_${EVENT.id}`, JSON.stringify(next))
  }

  function addMissionProgress(missionId, amount) {
    const mission = EVENT.missions.find(m => m.id === missionId)
    const next    = { ...progress, [missionId]: Math.min((progress[missionId] || 0) + amount, mission.target) }
    saveProgress(next)
  }

  function getMissionPct(id)  { const m = EVENT.missions.find(m => m.id === id); return Math.min(((progress[id] || 0) / m.target) * 100, 100) }
  function isMissionDone(id)  { const m = EVENT.missions.find(m => m.id === id); return (progress[id] || 0) >= m.target }

  const completedMissions = EVENT.missions.filter(m => isMissionDone(m.id)).length
  const totalPct          = Math.round((completedMissions / EVENT.missions.length) * 100)
  const allDone           = completedMissions === EVENT.missions.length

  async function claimReward() {
    if (!allDone || unlocked) return
    setParticles(true)
    setUnlocked(true)
    await addXP(500)
    setTimeout(() => setParticles(false), 1500)
  }

  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      className="relative mb-4 rounded-3xl overflow-hidden">

      {/* Fondo oscuro del evento */}
      <div className="absolute inset-0 rounded-3xl" style={{ background: S.bg }} />

      {/* Borde rúnico animado */}
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0 rounded-3xl pointer-events-none"
        style={{
          background: S.border, padding: '1.5px',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor', maskComposite: 'exclude',
        }} />

      {/* Glow */}
      <div className="absolute inset-0 pointer-events-none rounded-3xl"
        style={{ background: S.glow }} />

      {particles && <MysticParticles colors={S.particles} />}

      <div className="relative p-4">

        {/* Header */}
        <button onClick={() => setExpanded(e => !e)} className="w-full text-left">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <motion.span
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                style={{ fontSize: 28, flexShrink: 0 }}>{EVENT.emoji}</motion.span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-extrabold text-sm text-white truncate">{EVENT.name}</p>
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: S.tagBg, color: S.tagText }}>TEMPORADA</span>
                </div>
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>{EVENT.subtitle}</p>
              </div>
            </div>

            {/* Countdown */}
            <motion.div animate={countdown.urgent ? { opacity: [1, 0.4, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
              className="flex-shrink-0 text-right">
              <p className="text-[9px] font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>TERMINA EN</p>
              <p className="font-black text-xs"
                style={{ color: countdown.urgent ? S.timerColor : S.accent }}>
                {countdown.days}d {countdown.hours}h {countdown.minutes}m
              </p>
            </motion.div>
          </div>

          {/* Barra progreso general */}
          <div className="mb-2">
            <div className="flex justify-between items-center mb-1">
              <p className="text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.6)' }}>Progreso del evento</p>
              <p className="text-[10px] font-black" style={{ color: S.accent }}>
                {completedMissions}/{EVENT.missions.length} · {totalPct}%
              </p>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <motion.div className="h-full rounded-full"
                initial={{ width: 0 }} animate={{ width: `${totalPct}%` }}
                transition={{ duration: 0.8 }}
                style={{ background: S.border }} />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {expanded ? 'Ocultar misiones' : 'Ver misiones del evento'}
            </p>
            <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}
              style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>▾</motion.span>
          </div>
        </button>

        {/* Misiones */}
        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
              <div className="mt-3 space-y-2">
                {EVENT.missions.map((mission, i) => {
                  const pct  = getMissionPct(mission.id)
                  const done = isMissionDone(mission.id)
                  return (
                    <motion.div key={mission.id}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07 }}
                      className="rounded-2xl p-3"
                      style={{
                        background: done ? `${mission.color}15` : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${done ? mission.color + '40' : 'rgba(255,255,255,0.08)'}`,
                      }}>
                      <div className="flex items-start gap-2 mb-2">
                        <span style={{ fontSize: 18, flexShrink: 0 }}>{mission.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-xs text-white">{mission.name}</p>
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full"
                              style={{ background: `${mission.color}20`, color: mission.color }}>
                              {mission.school}
                            </span>
                          </div>
                          <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                            {mission.desc}
                          </p>
                        </div>
                        {done && <span className="text-green-400 text-sm flex-shrink-0">✓</span>}
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden mb-1"
                        style={{ background: 'rgba(255,255,255,0.1)' }}>
                        <motion.div className="h-full rounded-full"
                          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6 }} style={{ background: mission.color }} />
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          {progress[mission.id] || 0}/{mission.target} {mission.unit}
                        </p>
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

                {/* Recompensa */}
                <motion.div
                  animate={allDone && !unlocked
                    ? { boxShadow: ['0 0 0px rgba(0,0,0,0)', `0 0 20px ${S.accent}80`, '0 0 0px rgba(0,0,0,0)'] }
                    : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="rounded-2xl p-3"
                  style={{
                    background: unlocked
                      ? `linear-gradient(135deg, ${S.particles[0]}20, ${S.particles[1]}20)`
                      : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${unlocked ? S.accent + '60' : allDone ? S.accent + '40' : 'rgba(255,255,255,0.06)'}`,
                  }}>
                  <div className="flex items-center gap-3">
                    <motion.span
                      animate={allDone ? { rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                      style={{ fontSize: 28, flexShrink: 0 }}>
                      {unlocked ? '✨' : allDone ? EVENT.reward.emoji : '🔒'}
                    </motion.span>
                    <div className="flex-1">
                      <p className="font-bold text-xs" style={{ color: allDone ? S.accent : 'rgba(255,255,255,0.3)' }}>
                        {unlocked ? '¡Recompensa reclamada!' : EVENT.reward.name}
                      </p>
                      <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        {unlocked ? `${EVENT.reward.desc} · +500 XP` : EVENT.reward.desc}
                      </p>
                    </div>
                    {allDone && !unlocked && (
                      <motion.button whileTap={{ scale: 0.95 }} onClick={claimReward}
                        className="px-3 py-1.5 rounded-xl font-black text-xs text-white flex-shrink-0"
                        style={{ background: S.border }}>
                        ¡Reclamar!
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
