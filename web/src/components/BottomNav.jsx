import { NavLink } from 'react-router-dom'
import { Home, MessageCircle, Apple, Dumbbell, BarChart2, User } from 'lucide-react'
import { ..., TrendingUp } from 'lucide-react'

const NAV_ITEMS = [
  { to: '/',          icon: Home,          label: 'Inicio' },
  { to: '/coach',     icon: MessageCircle, label: 'Coach' },
  { to: '/nutrition', icon: Apple,         label: 'Nutrición' },
  { to: '/workout',   icon: Dumbbell,      label: 'Entrena' },
  { to: '/report',    icon: BarChart2,     label: 'Tu Día' },
  { to: '/profile',   icon: User,          label: 'Perfil' },
  { to: '/health',    icon: TrendingUp,    label: 'Salud' }
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto
                    bg-surface-2/95 backdrop-blur-xl border-t border-white/5
                    safe-area-inset-bottom z-50">
      <div className="flex items-center justify-around px-2 py-1">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-all ${
              isActive ? 'text-accent' : 'text-white/40 hover:text-white/70'
            }`
          }>
            <Icon size={20} strokeWidth={1.8} />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
