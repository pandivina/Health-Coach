import { NavLink, useLocation } from 'react-router-dom'
import { Home, MessageCircle, Apple, Dumbbell, CalendarDays } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTheme } from '../contexts/ThemeProvider'

const LEFT_NAV = [
  { to: '/',         icon: Home,          label: 'Inicio'    },
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
      className="flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all duration-200"
      style={({ isActive }) => ({ 
        // CAMBIO DE UI: Aseguramos que el estado inactivo use un color con suficiente contraste
        color: isActive ? theme.navActive : theme.navText 
      })}>
      {/* Añadimos un pequeño efecto de escala al pasar/pulsar para que la PWA se sienta nativa */}
      <motion.div whileTap={{ scale: 0.9 }}>
        <Icon size={22} strokeWidth={1.8} /> 
      </motion.div>
      <span className="text-[10px] font-semibold tracking-wide">{label}</span>
    </NavLink>
  )
}

export default function BottomNav() {
  const { theme }  = useTheme()
  const location   = useLocation()
  const isCalendar = location.pathname === '/calendar'

  return (
    <nav data-tour="bottom-nav" 
      className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto z-50"
      style={{
        background: theme.navBg,
        borderTop: `1px solid ${theme.navBorder}`,
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        paddingTop: '8px',
        paddingBottom: 'calc(8px + env(safe-area-inset-bottom))', // Protege pantallas de iPhone con notch inferior
      }}>
      <div className="flex items-center justify-around px-2">

        {LEFT_NAV.map(item => <NavItem key={item.to} {...item} />)}

{/* EL ORGANIZADOR MANTIENE EL TRONO CENTRAL */}
        <div className="flex-1 flex flex-col items-center justify-center h-full relative">
          <NavLink 
            to="/calendar" 
            className="flex flex-col items-center justify-center absolute -top-5 left-1/2 -translate-x-1/2 w-full text-center"
          >
            <motion.div 
              whileTap={{ scale: 0.92 }}
              style={{
                width: 58, 
                height: 58, 
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${theme.primary}, #FF8FA3)`,
                boxShadow: `0 6px 20px ${theme.primary}50`, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                border: '4px solid white', 
                margin: '0 auto',
              }}
            >
              <CalendarDays size={26} color="#fff" strokeWidth={1.8} />
            </motion.div>
            
            {/* Texto perfectamente balanceado */}
            <span 
              className="text-[10px] font-bold mt-1 block w-full"
              style={{ color: isCalendar ? theme.navActive : theme.navText }}
            >
              Organizador
            </span>
          </NavLink>
        </div>

      </nav>
    )
  }
