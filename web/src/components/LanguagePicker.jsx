import { motion } from 'framer-motion'
import { useLanguage } from '../contexts/LanguageContext'
import { useStore } from '../store/useStore'
import { useTheme } from '../contexts/ThemeProvider'

const LANGS = [
  { id: 'es', flag: '🇪🇸', label: 'Español' },
  { id: 'en', flag: '🇬🇧', label: 'English' },
]

export default function LanguagePicker({ inline = false }) {
  const { lang, setLang } = useLanguage()
  const { updateProfile } = useStore()
  const { theme }         = useTheme()

  async function handleChange(newLang) {
    setLang(newLang)
    await updateProfile({ language: newLang }).catch(() => {})
  }

  if (inline) {
    return (
      <div className="flex gap-2">
        {LANGS.map(l => (
          <button key={l.id} onClick={() => handleChange(l.id)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: lang === l.id ? `${theme.primary}20` : theme.surface2,
              border: `2px solid ${lang === l.id ? theme.primary : 'transparent'}`,
              color: lang === l.id ? theme.primary : theme.textMuted,
            }}>
            <span style={{ fontSize: 18 }}>{l.flag}</span>
            {l.label}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="card mb-5 space-y-3"
      style={{ border: `1px solid ${theme.border}` }}>
      <div className="flex items-center gap-3 mb-1">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl"
          style={{ background: `${theme.primary}15` }}>
          🌍
        </div>
        <div>
          <p className="font-semibold text-sm" style={{ color: theme.text }}>Idioma / Language</p>
          <p className="text-xs" style={{ color: theme.textMuted }}>Cambia el idioma de la app</p>
        </div>
      </div>
      <div className="flex gap-2">
        {LANGS.map(l => (
          <motion.button key={l.id} whileTap={{ scale: 0.95 }}
            onClick={() => handleChange(l.id)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: lang === l.id ? `${theme.primary}20` : theme.surface2,
              border: `2px solid ${lang === l.id ? theme.primary : 'transparent'}`,
              color: lang === l.id ? theme.primary : theme.textMuted,
            }}>
            <span style={{ fontSize: 20 }}>{l.flag}</span>
            {l.label}
          </motion.button>
        ))}
      </div>
    </div>
  )
}
