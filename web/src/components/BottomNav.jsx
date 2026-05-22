import { NavLink, useLocation } from 'react-router-dom'
import { Home, MessageCircle, Apple, Dumbbell, BarChart2, User, TrendingUp, Sparkles, CalendarDays } from 'lucide-react'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '../contexts/ThemeProvider'

const MAIN_NAV = [
  { to: '/',          icon: Home,          label: 'Inicio'    },
  { to: '/coach',     icon: MessageCircle, label: 'Coach'     },
  { to: '/nutrition', icon: Apple,         label: 'Nutrición' },
  { to: '/workout',   icon: Dumbbell,      label: 'Entrena'   },
  { to: '/report',    icon: BarChart2,     label: 'Tu Día'    },
]

const MORE_NAV = [
  { to: '/health',   icon: TrendingUp, label: 'Seguimiento' },
  { to: '/premium',  icon: Sparkles,   label: 'Premium'     },
  { to: '/profile',  icon: User,       label: 'Perfil'      },
]

function NavItem({ to, icon: Icon, label, onClick }) {
  const { theme } = useTheme()
  return (
    <NavLink to={to} onClick={onClick}
      className="flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-all"
      style={({ isActive }) => ({ color: isActive ? theme.navActive : theme.navText })}>
      <Icon size={20} strokeWidth={1.8} />
      <span className="text-[10px] font-medium">{label}</span>
    </NavLink>
  )
}

export default function BottomNav() {
  const { theme }    = useTheme()
  const location     = useLocation()
  const [showMore, setShowMore] = useState(false)
  const isCalendar   = location.pathname === '/calendar'

  // Split nav: 2 items left, calendar center, 2 items right
  const leftNav  = MAIN_NAV.slice(0, 2)   // Inicio, Coach
  const rightNav = MAIN_NAV.slice(2, 4)   // Nutrición, Entrena

  return (
    <nav data-tour="bottom-nav" className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto z-50"
      style={{
        background: theme.navBg,
        borderTop: `1px solid ${theme.navBorder}`,
        backdropFilter: 'blur(20px)',
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
      <div className="flex items-center justify-around px-2 py-1 relative">

        {/* Left items */}
        {leftNav.map(item => <NavItem key={item.to} {...item} />)}

        {/* Centro — botón Organizador */}
        <NavLink to="/calendar" className="relative flex flex-col items-center -mt-5">
          <motion.div
            whileTap={{ scale: 0.92 }}
            style={{
              width: 58, height: 58,
              borderRadius: '50%',
              background: isCalendar
                ? `linear-gradient(135deg, ${theme.primary}, #FF8FA3)`
                : `linear-gradient(135deg, ${theme.primary}, #FF8FA3)`,
              boxShadow: `0 4px 20px ${theme.primary}60`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '3px solid white',
            }}>
            <CalendarDays size={26} color="#fff" strokeWidth={1.8} />
          </motion.div>
          {/* Arco texto */}
          <span className="text-[9px] font-bold mt-0.5"
            style={{ color: isCalendar ? theme.navActive : theme.navText }}>
            Organizador
          </span>
        </NavLink>

        {/* Right items */}
        {rightNav.map(item => <NavItem key={item.to} {...item} />)}

        {/* Más */}
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
