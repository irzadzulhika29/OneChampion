import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  History,
  Home,
  ListChecks,
  LogOut,
  Search as SearchIcon,
  Settings as SettingsIcon,
  Trophy,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

/**
 * Navigation items. `badge` is optional — shown as small pill (or "9+" when > 9).
 * Active state comes from React Router NavLink (no manual activeItem state needed).
 */
const NAV = [
  { to: '/', label: 'Dashboard', icon: Home, end: true },
  { to: '/lomba', label: 'Daftar Lomba', icon: ListChecks },
  { to: '/kalender', label: 'Kalender', icon: Calendar },
  { to: '/tim', label: 'Tim', icon: Users },
  { to: '/riwayat', label: 'Riwayat', icon: History },
  { to: '/settings', label: 'Pengaturan', icon: SettingsIcon },
]

export default function Sidebar({ collapsed = false, onToggleCollapsed, onNavigate, badges = {} }) {
  const { signOut } = useAuthStore()
  const [search, setSearch] = useState('')

  // Filter nav by search (only when expanded)
  const filteredNav = search.trim()
    ? NAV.filter((item) => item.label.toLowerCase().includes(search.toLowerCase()))
    : NAV

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-col h-full bg-white border-r border-slate-200 text-slate-700 overflow-hidden">
        {/* Header */}
        <div
          className={cn(
            'flex items-center border-b border-slate-200 bg-slate-50/60 shrink-0',
            collapsed ? 'justify-center h-16 px-2' : 'justify-between px-5 py-4'
          )}
        >
          {!collapsed && (
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-9 h-9 bg-amber-400 text-slate-900 rounded-lg flex items-center justify-center shadow-sm shrink-0">
                <Trophy className="h-5 w-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-slate-800 text-sm leading-tight truncate">
                  SabiJuara
                </span>
                <span className="text-[10px] text-slate-500 leading-tight truncate">
                  Lomba Manager
                </span>
              </div>
            </div>
          )}

          {collapsed && (
            <div className="w-9 h-9 bg-amber-400 text-slate-900 rounded-lg flex items-center justify-center shadow-sm">
              <Trophy className="h-5 w-5" />
            </div>
          )}

          {!collapsed && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onToggleCollapsed}
                  className="hidden md:flex p-1.5 rounded-md hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-700"
                  aria-label="Tutup sidebar"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Tutup sidebar</TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Expand button when collapsed */}
        {collapsed && (
          <div className="px-2 py-2 border-b border-slate-100 shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onToggleCollapsed}
                  className="w-full flex items-center justify-center p-2 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                  aria-label="Buka sidebar"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Buka sidebar</TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Search Bar */}
        {!collapsed && (
          <div className="px-4 py-3 shrink-0">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari menu..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto">
          {filteredNav.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">
              Tidak ada menu
            </p>
          ) : (
            <ul className="space-y-0.5">
              {filteredNav.map((item) => {
                const badge = badges[item.to]
                return (
                  <li key={item.to}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <NavLink
                          to={item.to}
                          end={item.end}
                          onClick={onNavigate}
                          className={({ isActive }) =>
                            cn(
                              'relative w-full flex items-center rounded-md text-left transition-all duration-150 group',
                              collapsed
                                ? 'justify-center px-2 py-2.5 mx-auto w-12 h-11'
                                : 'gap-2.5 px-3 py-2.5',
                              isActive
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                            )
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <div className="flex items-center justify-center min-w-[20px]">
                                <item.icon
                                  className={cn(
                                    'h-[18px] w-[18px] shrink-0 transition-colors',
                                    isActive ? 'text-blue-600' : 'text-slate-500 group-hover:text-slate-700'
                                  )}
                                />
                              </div>

                              {!collapsed && (
                                <span
                                  className={cn(
                                    'flex-1 text-sm',
                                    isActive ? 'font-medium' : 'font-normal'
                                  )}
                                >
                                  {item.label}
                                </span>
                              )}

                              {!collapsed && badge && (
                                <span
                                  className={cn(
                                    'px-1.5 py-0.5 text-[10px] font-semibold rounded-full',
                                    isActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                                  )}
                                >
                                  {parseInt(badge) > 9 ? '9+' : badge}
                                </span>
                              )}

                              {collapsed && badge && (
                                <span className="absolute top-1 right-1 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-blue-500 text-white text-[9px] font-bold px-1">
                                  {parseInt(badge) > 9 ? '9+' : badge}
                                </span>
                              )}
                            </>
                          )}
                        </NavLink>
                      </TooltipTrigger>
                      {collapsed && <TooltipContent side="right">{item.label}</TooltipContent>}
                    </Tooltip>
                  </li>
                )
              })}
            </ul>
          )}
        </nav>

        {/* Logout — single button, no profile block */}
        <div className="mt-auto border-t border-slate-200 shrink-0 p-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={signOut}
                className={cn(
                  'w-full flex items-center rounded-md text-left transition-all duration-150 group',
                  'text-red-600 hover:bg-red-50 hover:text-red-700',
                  collapsed ? 'justify-center p-2.5 mx-auto w-12 h-10' : 'gap-2.5 px-3 py-2.5'
                )}
                aria-label="Keluar"
              >
                <LogOut className="h-[18px] w-[18px] shrink-0 text-red-500 group-hover:text-red-600" />
                {!collapsed && <span className="text-sm">Keluar</span>}
              </button>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">Keluar</TooltipContent>}
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  )
}
