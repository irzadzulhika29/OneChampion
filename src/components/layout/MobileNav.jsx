import { NavLink, useLocation } from 'react-router-dom'
import { Calendar, History, Home, ListChecks, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/lomba', label: 'Lomba', icon: ListChecks },
  { to: '/kalender', label: 'Kalender', icon: Calendar },
  { to: '/tim', label: 'Tim', icon: Users },
  { to: '/riwayat', label: 'Riwayat', icon: History },
]

export default function MobileNav() {
  const location = useLocation()
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-background border-t safe-area-pb">
      <div className="grid grid-cols-5">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-1 py-2 text-xs transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
