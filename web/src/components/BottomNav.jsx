import { NavLink, useLocation } from 'react-router-dom'
import { Home, MessageCircle, Apple, Dumbbell, CalendarDays } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTheme } from '../contexts/ThemeProvider'

// CAMBIO DE UX: Intercambiamos 'Entrena' al centro-derecha y dejamos 'Organizador' (Calendario) accesible
const LEFT_NAV = [
  { to: '/',         icon: Home,          label: 'Inicio'    },
  { to: '/calendar', icon: CalendarDays,  label: 'Organizador' }, // Se integra fluidamente
]

const RIGHT_NAV = [
  { to: '/nutrition', icon: Apple,         label: 'Nutrición' },
  { to: '/coach',     icon: MessageCircle, label: 'Coach'     }, // Coach pasa a la derecha
]

function NavItem({ to, icon: Icon, label }) {
  const { theme } = useTheme()
  return (
    <NavLink to={to}
      className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all duration-200 hover:scale-105"
      style={({ isActive }) => ({ color: isActive ? theme.navActive : theme.navText })}>
      <Icon size={22} strokeWidth={1.8} /> {/* Un pelín más grande para usabilidad táctil */}
      <span className="text-[10px] font-semibold tracking-wide">{label}</span>
    </NavLink>
  )
}

export default function BottomNav() {
  const { theme }  = useTheme()
  const location   = useLocation()
  const isWorkout  = location.pathname === '/workout'

  return (
    <nav data-tour="bottom-nav" 
      className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto z-50 pb-safe-bottom" // pb-safe-bottom ayuda en iOS sin marcos
      style={{
        background: theme.navBg,
        borderTop: `1px solid ${theme.navBorder}`,
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        paddingTop: '6px',
        paddingBottom: '8px' // Un poco más de aire abajo
      }}>
      <div className="flex items-center justify-around px-2">

        {LEFT_NAV.map(item => <NavItem key={item.to} {...item} />)}

        {/* EL BOTÓN CENTRAL ESTRELLA: "ENTRENA" */}
        {/* Ahora el núcleo de acción de la app (ir a entrenar) está en la posición más ergonómica */}
        <NavLink to="/workout" className="flex flex-col items-center justify-center -mt-5">
          <motion.div whileTap={{ scale: 0.92 }}
            style={{
              width: 56, height: 56, borderRadius: '50%',
              // Usamos el degradado temático de tu app para hacerlo resaltar
              background: `linear-gradient(135deg, ${theme.primary}, #FF8FA3)`,
              boxShadow: `0 6px 20px ${theme.primary}50`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '4px solid white', // El borde blanco le da el efecto flotante limpio
              margin: '0 auto',
            }}>
            <Dumbbell size={26} color="#fff" strokeWidth={2} />
          </motion.div>
          <span className="text-[10px] font-bold mt-1"
            style={{ color: isWorkout ? theme.navActive : theme.navText }}>
            Entrena
          </span>
        </NavLink>

        {RIGHT_NAV.map(item => <NavItem key={item.to} {...item} />)}

      </div>
    </nav>
  )
}
