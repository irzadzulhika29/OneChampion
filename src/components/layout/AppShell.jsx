import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { ChevronsRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import MobileNav from './MobileNav'
import DemoBanner from './DemoBanner'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'onechampion_sidebar_collapsed'

export default function AppShell() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0')
    } catch {}
  }, [collapsed])

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside
        className={cn(
          'hidden md:block shrink-0 sticky top-0 h-screen transition-[width] duration-200',
          collapsed ? 'w-20' : 'w-64'
        )}
      >
        <Sidebar
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed((v) => !v)}
        />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <DemoBanner />
        <Topbar sidebarCollapsed={collapsed} onExpandSidebar={() => setCollapsed(false)} />
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6 overflow-x-hidden">
          <Outlet />
        </main>
        <MobileNav />
      </div>
    </div>
  )
}
