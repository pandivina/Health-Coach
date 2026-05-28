import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../contexts/ThemeProvider'
import { useStore } from '../store/useStore'

// ─── DATOS DEL EVENTO ────────────────────────────────────────────────────────

const EVENT = {
  id:       'yggdrasil_halloween',
  name:     'El Grimorio de Yggdrasil',
  subtitle: 'Noche de Brujas · Evento de Temporada',
  emoji:    '🎃',
  endsAt: (() => {
    const d = new Date(new Date().getFullYear() + '-10-31T23:59:59')
    return d < new Date() ? new Date((new Date().getFullYear() + 1) + '-10-31T23:59:59') : d
  })(),
  reward: {
    name: 'Tema: Magia del Bosque',
    emoji: '🔮',
    desc: 'Desbloquea el tema visual "Yggdrasil" y el accesorio Runa de Pandi',
  },
  missions: [
    {
      id:       'steel',
      school:   'Transmutación',
      path:     'titan',
      emoji:    '⚚',
      name:     'Canalizar Acero',
      desc:     'Levantar 1.0t de volumen acumulado esta semana',
      target:   1000,
      unit:     'kg',
      color:    '#F97316',
    },
    {
      id:       'mana',
      school:   'Evocación',
      path:     'warrior',
      emoji:    '⚡',
      name:     'Tormenta de Maná',
      desc:     'Quemar 300 kcal en entrenamientos HIIT',
      target:   300,
      unit:     'kcal',
      color:    '#0EA5E9',
    },
    {
      id:       'astral',
      school:   'Restauración',
      path:     'zen',
      emoji:    '🌀',
      name:     'Equilibrio Astral',
      desc:     'Completar 20 minutos de Yoga o Pilates',
      target:   20,
      unit:     'min',
      color:    '#6EE7B7',
    },
  ],
}

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

// ─── PARTICLES (recompensa desbloqueada) ─────────────────────────────────────

function MysticParticles() {
  const particles = Array.from({ length: 12 }, (_, i) => i)
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
            background: ['#F97316','#7C3AED','#DC2626','#F59E0B'][i % 4],
            filter: 'blur(1px)',
          }} />
      ))}
    </div>
  )
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function SeasonalEventCard() {
  const { theme }         = useTheme()
  const { profile, addXP } = useStore()
  const countdown         = useCountdown(EVENT.endsAt)
  const [expanded,      setExpanded]      = useState(false)
  const [unlocked,      setUnlocked]      = useState(false)
  const [particles,     setParticles]     = useState(false)
  const [progress,      setProgress]      = useState(() => {
    const saved = localStorage.getItem(`event_${EVENT.id}`)
    return saved ? JSON.parse(saved) : { steel: 0, mana: 0, astral: 0 }
  })

  function saveProgress(next) {
    setProgress(next)
    localStorage.setItem(`event_${EVENT.id}`, JSON.stringify(next))
  }

  function addMissionProgress(missionId, amount) {
    const next = { ...progress, [missionId]: Math.min(progress[missionId] + amount, getMission(missionId).target) }
    saveProgress(next)
  }

  function getMission(id) { return EVENT.missions.find(m => m.id === id) }
  function getMissionPct(id) { return Math.min((progress[id] / getMission(id).target) * 100, 100) }
  function isMissionDone(id) { return progress[id] >= getMission(id).target }

  const completedMissions = EVENT.missions.filter(m => isMissionDone(m.id)).length
  const totalPct = Math.round((completedMissions / EVENT.missions.length) * 100)
  const allDone  = completedMissions === EVENT.missions.length

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
      {/* Borde animado rúnico (Actualizado a tonos Halloween) */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0 rounded-3xl pointer-events-none"
        style={{
          background: 'conic-gradient(from 0deg, #7C3AED, #F97316, #1F2937, #DC2626, #7C3AED)',
          padding: '1.5px',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }} 
      />

      {/* Glow de fondo (Actualizado a tonos Halloween) */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.25) 0%, rgba(249,115,22,0.1) 60%, transparent 100%)' }} />

      {particles && <MysticParticles />}

      <div className="relative p-4">

        {/* Header */}
        <button onClick={() => setExpanded(e => !e)} className="w-full text-left">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <motion.span
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                style={{ fontSize: 28, flexShrink: 0 }}>
                {EVENT.emoji}
              </motion.span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-extrabold text-sm text-white truncate">{EVENT.name}</p>
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: 'rgba(124,58,237,0.3)', color: '#D8B4FE' }}>
                    TEMPORADA
                  </span>
                </div>
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {EVENT.subtitle}
                </p>
              </div>
            </div>

            {/* Countdown */}
            <motion.div
              animate={countdown.urgent ? { opacity: [1, 0.4, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
              className="flex-shrink-0 text-right">
              <p className="text-[9px] font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>
                TERMINA EN
              </p>
              <p className="font-black text-xs"
                style={{ color: countdown.urgent ? '#F87171' : '#F97316' }}>
                {countdown.days}d {countdown.hours}h {countdown.minutes}m
              </p>
            </motion.div>
          </div>

          {/* Barra progreso general */}
          <div className="mb-2">
            <div className="flex justify-between items-center mb-1">
              <p className="text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Progreso del evento
              </p>
              <p className="text-[10px] font-black" style={{ color: '#F97316' }}>
                {completedMissions}/{EVENT.missions.length} misiones · {totalPct}%
              </p>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <motion.div className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${totalPct}%` }}
                transition={{ duration: 0.8 }}
                style={{ background: 'linear-gradient(90deg, #7C3AED, #F97316, #DC2626)' }} />
            </div>
          </div>

          {/* Toggle */}
          <div className="flex items-center justify-between">
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {expanded ? 'Ocultar misiones' : 'Ver misiones del evento'}
            </p>
            <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}
              style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>▾</motion.span>
          </div>
        </button>

        {/* Misiones expandidas */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden' }}>
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
                        background: done
                          ? `${mission.color}15`
                          : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${done ? mission.color + '40' : 'rgba(255,255,255,0.08)'}`,
                      }}>
                      <div className="flex items-start gap-2 mb-2">
                        <span style={{ fontSize: 18, flexShrink: 0 }}>{mission.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
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
                        {done && (
                          <span className="text-green-400 text-sm flex-shrink-0">✓</span>
                        )}
                      </div>

                      <div className="h-1.5 rounded-full overflow-hidden mb-1"
                        style={{ background: 'rgba(255,255,255,0.1)' }}>
                        <motion.div className="h-full rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6 }}
                          style={{ background: mission.color }} />
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          {progress[mission.id]}/{mission.target} {mission.unit}
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
                    ? { boxShadow: ['0 0 0px rgba(249,115,22,0)', '0 0 20px rgba(249,115,22,0.5)', '0 0 0px rgba(249,115,22,0)'] }
                    : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="rounded-2xl p-3 mt-1"
                  style={{
                    background: unlocked
                      ? 'linear-gradient(135deg, rgba(249,115,22,0.2), rgba(124,58,237,0.2))'
                      : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${unlocked ? '#F9731660' : allDone ? '#F9731640' : 'rgba(255,255,255,0.06)'}`,
                  }}>
                  <div className="flex items-center gap-3">
                    <motion.span
                      animate={allDone ? { rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                      style={{ fontSize: 28, flexShrink: 0 }}>
                      {unlocked ? '✨' : allDone ? EVENT.reward.emoji : '🔒'}
                    </motion.span>
                    <div className="flex-1">
                      <p className="font-bold text-xs" style={{ color: allDone ? '#F97316' : 'rgba(255,255,255,0.3)' }}>
                        {unlocked ? '¡Recompensa reclamada!' : EVENT.reward.name}
                      </p>
                      <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        {unlocked ? 'Tema Yggdrasil activado · +500 XP' : EVENT.reward.desc}
                      </p>
                    </div>
                    {allDone && !unlocked && (
                      <motion.button whileTap={{ scale: 0.95 }} onClick={claimReward}
                        className="px-3 py-1.5 rounded-xl font-black text-xs text-white flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #7C3AED, #F97316)' }}>
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
