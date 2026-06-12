import { Outlet, useLocation } from 'react-router-dom'
import BottomNav from './BottomNav'
import CoachFAB from './CoachFAB'
import { useTheme } from '../contexts/ThemeProvider'

// Rutas donde el FAB no aparece (el coach ya tiene su propia UI ahí)
const FAB_EXCLUDED = ['/coach', '/onboarding', '/auth', '/']

// Rutas a pantalla completa: sin BottomNav ni chrome del layout
const NAV_EXCLUDED = ['/onboarding', '/auth']

export default function Layout() {
  const { theme }    = useTheme()
  const { pathname } = useLocation()
  const showFAB = !FAB_EXCLUDED.includes(pathname)
  const showNav = !NAV_EXCLUDED.includes(pathname)

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto relative"
      style={{ background: theme.bg }}>
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      {showNav && <BottomNav />}
      {showFAB && <CoachFAB />}
    </div>
  )
}
