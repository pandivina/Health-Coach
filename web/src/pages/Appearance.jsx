import AppearanceSettings from '../components/theme/AppearanceSettings'
import { useTheme } from '../contexts/ThemeProvider'

export default function Appearance() {
  const { theme } = useTheme()
  const isPremium = false // TODO: conectar con subscriptions

  return (
    <div className="page">
      <h1 className="text-2xl font-extrabold mb-1" style={{ color: theme.text }}>
        Apariencia 🎨
      </h1>
      <p className="text-sm mb-6" style={{ color: theme.textMuted }}>
        Elige el tema visual de tu app
      </p>
      <AppearanceSettings isPremium={isPremium} />
    </div>
  )
}
