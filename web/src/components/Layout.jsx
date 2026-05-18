import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'
import { useTheme } from '../contexts/ThemeProvider'

export default function Layout() {
  const { theme } = useTheme()
  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto relative"
      style={{ background: theme.bg }}>
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
