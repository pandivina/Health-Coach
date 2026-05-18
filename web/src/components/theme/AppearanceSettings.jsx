import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Lock, RotateCcw, Palette } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeProvider'
import { THEMES, DEFAULT_THEME } from '../../lib/themes'

// ── THEME PREVIEW CARD ──────────────────────────────────────
function ThemePreviewCard({ theme, isActive, onSelect, isPremium }) {
  const locked = !theme.free && !isPremium

  return (
    <motion.div
      whileTap={{ scale: locked ? 1 : 0.96 }}
      onClick={() => !locked && onSelect(theme.id)}
      className="relative cursor-pointer"
    >
      {/* Card preview */}
      <div className={`rounded-2xl overflow-hidden border-2 transition-all ${
        isActive ? 'border-[var(--color-primary)]' : 'border-transparent'
      }`}
        style={{ boxShadow: isActive ? `0 0 0 3px ${theme.primary}30` : 'none' }}
      >
        {/* Preview miniatura */}
        <div className="h-20 relative overflow-hidden"
          style={{ background: theme.bg }}>
          {/* Nav bar mini */}
          <div className="absolute bottom-0 left-0 right-0 h-5"
            style={{ background: theme.navBg, borderTop: `1px solid ${theme.navBorder}` }}>
            <div className="flex justify-around items-center h-full px-2">
              {[theme.navActive, theme.navText, theme.navText, theme.navText].map((c, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />
              ))}
            </div>
          </div>
          {/* Card mini */}
          <div className="absolute top-3 left-3 right-3 h-7 rounded-lg"
            style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>
            <div className="flex items-center gap-1.5 px-2 h-full">
              <div className="w-3 h-3 rounded-full" style={{ background: theme.primary }} />
              <div className="flex-1 h-1.5 rounded-full" style={{ background: theme.surface2 }} />
              <div className="w-5 h-3 rounded" style={{ background: theme.gradientBrand }} />
            </div>
          </div>
          {/* Gradient dots */}
          <div className="absolute top-1 right-2 flex gap-0.5">
            {theme.preview.map((c, i) => (
              <div key={i} className="w-2 h-2 rounded-full border border-white/20" style={{ background: c }} />
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="px-3 py-2.5"
          style={{ background: theme.surface, borderTop: `1px solid ${theme.border}` }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold" style={{ color: theme.text }}>
                {theme.emoji} {theme.name}
              </p>
              <p className="text-[10px]" style={{ color: theme.textMuted }}>
                {theme.description}
              </p>
            </div>
            {isActive && (
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: theme.primary }}>
                <Check size={10} color="#fff" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lock overlay */}
      {locked && (
        <div className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center gap-1"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }}>
          <Lock size={16} color="#fff" />
          <span className="text-white text-[10px] font-bold">Premium</span>
        </div>
      )}
    </motion.div>
  )
}

// ── APPEARANCE SETTINGS ─────────────────────────────────────
export default function AppearanceSettings({ isPremium = false }) {
  const { themeId, theme, followPetTheme, changeTheme, toggleFollowPetTheme } = useTheme()
  const [changed, setChanged] = useState(null)

  async function handleSelect(id) {
    await changeTheme(id)
    setChanged(id)
    setTimeout(() => setChanged(null), 1500)
  }

  async function handleReset() {
    await changeTheme(DEFAULT_THEME)
  }

  const freeThemes = Object.values(THEMES).filter(t => t.free)
  const premiumThemes = Object.values(THEMES).filter(t => !t.free)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: `${theme.primary}20` }}>
            <Palette size={16} style={{ color: theme.primary }} />
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: theme.text }}>Apariencia</p>
            <p className="text-xs" style={{ color: theme.textMuted }}>Personaliza tu experiencia visual</p>
          </div>
        </div>
        <button onClick={handleReset}
          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full transition-all"
          style={{ background: theme.surface2, color: theme.textMuted }}>
          <RotateCcw size={11} /> Restablecer
        </button>
      </div>

      {/* Follow pet theme toggle */}
      <div className="rounded-2xl p-4 flex items-center justify-between"
        style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">🐾</span>
          <div>
            <p className="text-sm font-medium" style={{ color: theme.text }}>Seguir tema de mi mascota</p>
            <p className="text-xs" style={{ color: theme.textMuted }}>El tema cambia al cambiar de mascota</p>
          </div>
        </div>
        <button onClick={() => toggleFollowPetTheme(!followPetTheme)}
          className="w-12 h-6 rounded-full transition-all duration-300 relative flex-shrink-0"
          style={{ background: followPetTheme ? theme.primary : theme.surface3 }}>
          <motion.div
            animate={{ x: followPetTheme ? 24 : 2 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
          />
        </button>
      </div>

      {/* Tema actual */}
      <AnimatePresence>
        {changed && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-2xl p-3 flex items-center gap-2"
            style={{ background: `${theme.success}15`, border: `1px solid ${theme.success}30` }}>
            <Check size={14} style={{ color: theme.success }} />
            <p className="text-sm font-medium" style={{ color: theme.success }}>
              Tema aplicado: {THEMES[changed]?.name}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Temas gratuitos */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider mb-3"
          style={{ color: theme.textMuted }}>Gratuitos</p>
        <div className="grid grid-cols-2 gap-3">
          {freeThemes.map(t => (
            <ThemePreviewCard key={t.id} theme={t} isActive={themeId === t.id}
              onSelect={handleSelect} isPremium={isPremium} />
          ))}
        </div>
      </div>

      {/* Temas premium */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <p className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: theme.textMuted }}>Premium</p>
          {!isPremium && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: `${theme.accent}20`, color: theme.accent }}>
              ⭐ Desbloquear
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {premiumThemes.map(t => (
            <ThemePreviewCard key={t.id} theme={t} isActive={themeId === t.id}
              onSelect={handleSelect} isPremium={isPremium} />
          ))}
        </div>
      </div>
    </div>
  )
}
