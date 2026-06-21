import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  addMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  isBefore,
  startOfDay,
} from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useLombaInRange } from '@/hooks/useLomba'
import { STATUS_LOMBA, KATEGORI_LOMBA, cn } from '@/lib/utils'

const HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

export default function KalenderView() {
  const navigate = useNavigate()
  const [cursor, setCursor] = useState(() => new Date())

  const monthStart = useMemo(() => startOfMonth(cursor), [cursor])
  const monthEnd = useMemo(() => endOfMonth(cursor), [cursor])
  const gridStart = useMemo(() => startOfWeek(monthStart, { weekStartsOn: 0 }), [monthStart])
  const gridEnd = useMemo(() => endOfWeek(monthEnd, { weekStartsOn: 0 }), [monthEnd])

  // query range with buffer for grid
  const startStr = format(gridStart, 'yyyy-MM-dd')
  const endStr = format(gridEnd, 'yyyy-MM-dd')
  const { data: events, isLoading } = useLombaInRange(startStr, endStr)

  // group by date — use effective_date (tanggal_final → DL Submission → DL Register → tanggal_mulai)
  const eventsByDate = useMemo(() => {
    const map = new Map()
    if (!events) return map
    for (const e of events) {
      const dateStr = e.effective_date
      if (!dateStr) continue
      const key = typeof dateStr === 'string' && dateStr.length === 10
        ? dateStr
        : format(new Date(dateStr), 'yyyy-MM-dd')
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(e)
    }
    return map
  }, [events])

  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })
  const today = startOfDay(new Date())

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Kalender</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {format(cursor, 'LLLL yyyy', { locale: localeId })}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={() => setCursor(addMonths(cursor, -1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>
            Hari Ini
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCursor(addMonths(cursor, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-7 border-b">
            {HARI.map((h) => (
              <div key={h} className="text-center text-xs font-medium text-muted-foreground py-2 border-r last:border-r-0">
                {h}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day) => {
              const key = format(day, 'yyyy-MM-dd')
              const dayEvents = eventsByDate.get(key) || []
              const inMonth = isSameMonth(day, cursor)
              const isPast = isBefore(day, today)
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => dayEvents[0] && navigate(`/lomba/${dayEvents[0].id}`)}
                  className={cn(
                    'min-h-[80px] md:min-h-[100px] p-1.5 border-r border-b last:border-r-0 text-left transition-colors',
                    !inMonth && 'bg-slate-50 text-muted-foreground',
                    inMonth && 'hover:bg-slate-50',
                    isToday(day) && 'bg-amber-50'
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={cn(
                        'text-xs md:text-sm font-medium',
                        isToday(day) && 'bg-primary text-primary-foreground rounded-full w-6 h-6 inline-flex items-center justify-center',
                        isPast && inMonth && 'text-muted-foreground'
                      )}
                    >
                      {format(day, 'd')}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 2).map((e) => {
                      const status = STATUS_LOMBA[e.status]
                      return (
                        <div
                          key={e.id}
                          className={cn(
                            'text-[10px] md:text-xs px-1.5 py-0.5 rounded border truncate cursor-pointer hover:opacity-80',
                            status?.class
                          )}
                          title={`${e.judul} (${KATEGORI_LOMBA[e.kategori]})`}
                        >
                          {e.judul}
                        </div>
                      )
                    })}
                    {dayEvents.length > 2 && (
                      <div className="text-[10px] text-muted-foreground">+{dayEvents.length - 2} lagi</div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 14 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      )}

      {!isLoading && events && events.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-sm font-medium mb-3">Event di bulan ini</h3>
            <ul className="space-y-2">
              {events.map((e) => (
                <li
                  key={e.id}
                  onClick={() => navigate(`/lomba/${e.id}`)}
                  className="flex items-center justify-between p-2 rounded hover:bg-muted cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={cn('w-2 h-2 rounded-full shrink-0', STATUS_LOMBA[e.status]?.class)} />
                    <span className="font-medium truncate">{e.judul}</span>
                    <span className="text-xs text-muted-foreground">{KATEGORI_LOMBA[e.kategori]}</span>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {e.effective_date && format(new Date(e.effective_date), 'd MMM', { locale: localeId })}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
