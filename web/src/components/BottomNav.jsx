import { NavLink } from 'react-router-dom'
import { Home, MessageCircle, Apple, Dumbbell, BarChart2, User, TrendingUp } from 'lucide-react'
import { useState } from 'react'

const MAIN_NAV = [
  { to: '/',          icon: Home,          label: 'Inicio' },
  { to: '/coach',     icon: MessageCircle, label: 'Coach' },
  { to: '/nutrition', icon: Apple,         label: 'Nutrición' },
  { to: '/workout',   icon: Dumbbell,      label: 'Entrena' },
  { to: '/report',    icon: BarChart2,     label: 'Tu Día' },
]

const MORE_NAV = [
  { to: '/health',   icon: TrendingUp, label: 'Seguimiento' },
  { to: '/profile',  icon: User,       label: 'Perfil' },
]

function NavItem({ to, icon: Icon, label, onClick }) {
  return (
    <NavLink to={to} onClick={onClick} className={({ isActive }) =>
      `flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-all ${
        isActive ? 'text-accent' : 'text-white/40 hover:text-white/70'
      }`
    }>
      <Icon size={20} strokeWidth={1.8} />
      <span className="text-[10px] font-medium">{label}</span>
    </NavLink>
  )
}

export default function BottomNav() {
  const [showMore, setShowMore] = useState(false)

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto
                    bg-surface-2/95 backdrop-blur-xl border-t border-white/5
                    safe-area-inset-bottom z-50">

      {/* More menu */}
      {showMore && (
        <div className="flex justify-around px-2 py-2 border-b border-white/5">
          {MORE_NAV.map(item => (
            <NavItem key={item.to} {...item} onClick={() => setShowMore(false)} />
          ))}
        </div>
      )}

      {/* Main nav */}
      <div className="flex items-center justify-around px-2 py-1">
        {MAIN_NAV.map(item => (
          <NavItem key={item.to} {...item} />
        ))}
        <button
          onClick={() => setShowMore(m => !m)}
          className={`flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-all ${
            showMore ? 'text-accent' : 'text-white/40'
          }`}>
          <User size={20} strokeWidth={1.8} />
          <span className="text-[10px] font-medium">Más</span>
        </button>
      </div>
    </nav>
  )
}
