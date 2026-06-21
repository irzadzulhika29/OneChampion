import { useState } from 'react'
import { Menu, Bell, Search, ChevronsRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import Sidebar from './Sidebar'

export default function Topbar({ sidebarCollapsed = false, onExpandSidebar }) {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]):bg-background/60 px-4 md:px-6">
      {/* Mobile: open drawer menu */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden -ml-2"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Desktop: expand sidebar if collapsed */}
      {sidebarCollapsed && (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="hidden md:inline-flex -ml-2"
                onClick={onExpandSidebar}
                aria-label="Buka sidebar"
              >
                <ChevronsRight className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Buka sidebar</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      <div className="flex-1 flex items-center gap-2 max-w-md">
        <div className="relative w-full hidden sm:block">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Cari lomba..." className="pl-8 h-9" />
        </div>
      </div>

      <Button variant="ghost" size="icon" aria-label="Notifikasi">
        <Bell className="h-5 w-5" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="p-0 w-72">
          <SheetHeader className="sr-only">
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <Sidebar onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </header>
  )
}
