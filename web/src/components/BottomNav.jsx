import { NavLink } from 'react-router-dom'
import { Home, MessageCircle, Apple, Dumbbell, BarChart2, User, TrendingUp, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useTheme } from '../contexts/ThemeProvider'

const MAIN_NAV = [
  { to: '/',          icon: Home,          label: 'Inicio' },
  { to: '/coach',     icon: MessageCircle, label: 'Coach' },
  { to: '/nutrition', icon: Apple,         label: 'Nutrición' },
  { to: '/workout',   icon: Dumbbell,      label: 'Entrena' },
  { to: '/report',    icon: BarChart2,     label: 'Tu Día' },
]

const MORE_NAV = [
  { to: '/health',   icon: TrendingUp, label: 'Seguimiento' },
  { to: '/premium',  icon: Sparkles,   label: 'Premium' },
  { to: '/profile',  icon: User,       label: 'Perfil' },
]

function NavItem({ to, icon: Icon, label, onClick }) {
  const { theme } = useTheme()
  return (
    <NavLink to={to} onClick={onClick} className="flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-all"
      style={({ isActive }) => ({
        color: isActive ? theme.navActive : theme.navText,
      })}>
      <Icon size={20} strokeWidth={1.8} />
      <span className="text-[10px] font-medium">{label}</span>
    </NavLink>
  )
}

export default function BottomNav() {
  const { theme } = useTheme()
  const [showMore, setShowMore] = useState(false)

  return (
  <nav data-tour="bottom-nav" className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto z-50"
    style={{
        background: theme.navBg,
        borderTop: `1px solid ${theme.navBorder}`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}>

      {/* More menu */}
      {showMore && (
        <div className="flex justify-around px-2 py-2"
          style={{ borderBottom: `1px solid ${theme.navBorder}` }}>
          {MORE_NAV.map(item => (
            <NavItem key={item.to} {...item} onClick={() => setShowMore(false)} />
          ))}
        </div>
      )}

      {/* Main nav */}
      <div className="flex items-center justify-around px-2 py-1">
        {MAIN_NAV.map(item => <NavItem key={item.to} {...item} />)}
        <button
          onClick={() => setShowMore(m => !m)}
          className="flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-all"
          style={{ color: showMore ? theme.navActive : theme.navText }}>
          <User size={20} strokeWidth={1.8} />
          <span className="text-[10px] font-medium">Más</span>
        </button>
      </div>
    </nav>
  )
}
