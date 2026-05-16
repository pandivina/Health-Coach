import { NavLink } from 'react-router-dom'
import { Home, MessageCircle, Apple, ShoppingBag, ChefHat, Dumbbell, Moon, Smile, Droplets, 
         Cigarette, BarChart2, Heart, User } from 'lucide-react'

const navItems = [
  { to: '/',          icon: Home,         label: 'Inicio' },
  { to: '/coach',     icon: MessageCircle,label: 'Coach' },
  { to: '/nutrition', icon: Apple,        label: 'Nutrición' },
  { to: '/workout',   icon: Dumbbell,     label: 'Entrena' },
  { to: '/report',    icon: BarChart2,    label: 'Tu Día' },
]

const moreItems = [
  { to: '/pantry',    icon: ShoppingBag,  label: 'Despensa' },
  { to: '/recipes',   icon: ChefHat,      label: 'Recetas' },
  { to: '/sleep',     icon: Moon,         label: 'Sueño' },
  { to: '/mood',      icon: Smile,        label: 'Ánimo' },
  { to: '/hydration', icon: Droplets,     label: 'Agua' },
  { to: '/smoking',   icon: Cigarette,    label: 'Tabaco' },
  { to: '/pet',       icon: Heart,        label: 'Mascota' },
  { to: '/profile',   icon: User,         label: 'Perfil' },
]

function NavItem({ to, icon: Icon, label }) {
  return (
    <NavLink to={to} className={({ isActive }) =>
      `flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-all ${
        isActive ? 'text-accent' : 'text-white/40 hover:text-white/70'
      }`
    }>
      <Icon size={20} strokeWidth={isActive => isActive ? 2.5 : 1.8} />
      <span className="text-[10px] font-medium">{label}</span>
    </NavLink>
  )
}

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto 
                    bg-surface-2/95 backdrop-blur-xl border-t border-white/5 
                    safe-area-inset-bottom z-50">
      <div className="flex items-center justify-around px-2">
        {navItems.map(item => <NavItem key={item.to} {...item} />)}
      </div>

      {/* Fila secundaria colapsable — más páginas */}
      <details className="group">
        <summary className="list-none flex justify-center pb-1 cursor-pointer">
          <span className="text-white/20 text-xs group-open:rotate-180 transition-transform">▲ más</span>
        </summary>
        <div className="flex flex-wrap justify-around px-2 pb-3 gap-y-1 border-t border-white/5 pt-2">
          {moreItems.map(item => <NavItem key={item.to} {...item} />)}
        </div>
      </details>
    </nav>
  )
}
