import { NavLink, useLocation } from 'react-router-dom'
import { Home, MessageCircle, Apple, Dumbbell, CalendarDays } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTheme } from '../contexts/ThemeProvider'

const LEFT_NAV  = [
  { to: '/',          icon: Home,          label: 'Inicio'    },
  { to: '/coach',     icon: MessageCircle, label: 'Coach'     },
]
const RIGHT_NAV = [
  { to: '/nutrition', icon: Apple,         label: 'Nutrición' },
  { to: '/workout',   icon: Dumbbell,      label: 'Entrena'   },
]

function NavItem({ to, icon: Icon, label }) {
  const { theme } = useTheme()
  return (
    <NavLink to={to}
      className="flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-all"
      style={({ isActive }) => ({ color: isActive ? theme.navActive : theme.navText })}>
      <Icon size={20} strokeWidth={1.8} />
      <span className="text-[10px] font-medium">{label}</span>
    </NavLink>
  )
}

export default function BottomNav() {
  const { theme }  = useTheme()
  const location   = useLocation()
  const isCalendar = location.pathname === '/calendar'

  return (
    <nav data-tour="bottom-nav" className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto z-50"
      style={{
        background: theme.navBg,
        borderTop: `1px solid ${theme.navBorder}`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}>
      <div className="flex items-center justify-around px-2 py-1">

        {LEFT_NAV.map(item => <NavItem key={item.to} {...item} />)}

        {/* Centro — Organizador */}
        <NavLink to="/calendar" className="flex flex-col items-center justify-center -mt-5">
          <motion.div whileTap={{ scale: 0.92 }}
            style={{
              width: 58, height: 58, borderRadius: '50%',
              background: `linear-gradient(135deg, ${theme.primary}, #FF8FA3)`,
              boxShadow: `0 4px 20px ${theme.primary}60`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '3px solid white',
            }}>
            <CalendarDays size={26} color="#fff" strokeWidth={1.8} />
          </motion.div>
          <span className="text-[9px] font-bold mt-0.5"
            style={{ color: isCalendar ? theme.navActive : theme.navText }}>
            Organizador
          </span>
        </NavLink>

        {RIGHT_NAV.map(item => <NavItem key={item.to} {...item} />)}

      </div>
    </nav>
  )
}
