import { Link } from 'react-router-dom'
import { useLombaList } from '@/hooks/useLomba'
import { useTim } from '@/hooks/useTim'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar, ListChecks, Trophy, Users, Plus, ArrowRight, Clock, AlertCircle } from 'lucide-react'
import { STATUS_LOMBA, KATEGORI_LOMBA, formatDate, cn } from '@/lib/utils'
import { differenceInDays, parseISO } from 'date-fns'
import { useAuthStore } from '@/store/auth'

export default function Dashboard() {
  const { user } = useAuthStore()
  const { data: lomba, isLoading: loadingLomba } = useLombaList()
  const { data: tim, isLoading: loadingTim } = useTim()

  // stats
  const stats = {
    total: lomba?.length || 0,
    aktif: lomba?.filter((l) => ['rencana', 'terdaftar', 'berlangsung'].includes(l.status)).length || 0,
    selesai: lomba?.filter((l) => l.status === 'selesai').length || 0,
    tim: tim?.length || 0,
  }

  // upcoming (next 30 days, status != selesai) — uses effective_date
  const upcoming = (lomba || [])
    .filter((l) => l.status !== 'selesai')
    .map((l) => {
      const d = l.tanggal_final || l.deadline_submission || l.deadline_pendaftaran || l.tanggal_mulai
      return d ? { ...l, days: differenceInDays(parseISO(d), new Date()), _eventDate: d } : null
    })
    .filter(Boolean)
    .filter((l) => l.days >= -1 && l.days <= 30)
    .sort((a, b) => a.days - b.days)
    .slice(0, 5)

  // deadlines (next 14 days) — DL Register + DL Submission
  const deadlines = (lomba || [])
    .filter((l) => l.status !== 'selesai')
    .flatMap((l) => {
      const out = []
      if (l.deadline_pendaftaran) {
        const days = differenceInDays(parseISO(l.deadline_pendaftaran), new Date())
        if (days >= -1 && days <= 14) out.push({ ...l, days, deadlineType: 'DL Register', deadlineDate: l.deadline_pendaftaran })
      }
      if (l.deadline_submission) {
        const days = differenceInDays(parseISO(l.deadline_submission), new Date())
        if (days >= -1 && days <= 14) out.push({ ...l, days, deadlineType: 'DL Submission', deadlineDate: l.deadline_submission })
      }
      return out
    })
    .sort((a, b) => a.days - b.days)
    .slice(0, 6)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Halo, {user?.user_metadata?.full_name?.split(' ')[0] || 'Champ'} 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Berikut ringkasan lomba Anda.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={ListChecks} label="Total Lomba" value={stats.total} loading={loadingLomba} />
        <StatCard icon={Clock} label="Aktif" value={stats.aktif} loading={loadingLomba} accent="text-blue-600" />
        <StatCard icon={Trophy} label="Selesai" value={stats.selesai} loading={loadingLomba} accent="text-emerald-600" />
        <StatCard icon={Users} label="Tim" value={stats.tim} loading={loadingTim} accent="text-violet-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Lomba Mendatang</CardTitle>
              <CardDescription>30 hari ke depan</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/lomba">Semua <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loadingLomba ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : upcoming.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="Belum ada lomba mendatang"
                action={
                  <Button asChild size="sm">
                    <Link to="/lomba"><Plus className="h-4 w-4" /> Tambah Lomba</Link>
                  </Button>
                }
              />
            ) : (
              <ul className="space-y-2">
                {upcoming.map((l) => (
                  <li key={l.id}>
                    <Link
                      to={`/lomba/${l.id}`}
                      className="flex items-center gap-3 p-3 rounded-md hover:bg-muted transition-colors"
                    >
                      <div className="bg-primary/10 text-primary rounded p-2 shrink-0">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{l.judul}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(l._eventDate, { day: '2-digit', month: 'short' })} · {KATEGORI_LOMBA[l.kategori]}
                        </p>
                      </div>
                      <span className={cn('text-xs px-2 py-0.5 rounded-full border whitespace-nowrap', STATUS_LOMBA[l.status]?.class)}>
                        {l.days === 0 ? 'Hari ini' : l.days === 1 ? 'Besok' : `H-${l.days}`}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Deadline Mendatang</CardTitle>
            <CardDescription>14 hari ke depan</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingLomba ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : deadlines.length === 0 ? (
              <EmptyState icon={AlertCircle} title="Tidak ada deadline" />
            ) : (
              <ul className="space-y-2">
                {deadlines.map((d, i) => (
                  <li key={`${d.id}-${d.deadlineType}-${i}`}>
                    <Link
                      to={`/lomba/${d.id}`}
                      className="block p-2.5 rounded-md hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-sm truncate">{d.judul}</p>
                        <span className={cn(
                          'text-[10px] px-1.5 py-0.5 rounded border shrink-0',
                          d.deadlineType === 'DL Submission'
                            ? 'bg-orange-50 text-orange-700 border-orange-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        )}>
                          {d.deadlineType}
                        </span>
                      </div>
                      <p className={cn(
                        'text-xs mt-0.5',
                        d.deadlineType === 'DL Submission' ? 'text-orange-600' : 'text-amber-600'
                      )}>
                        {d.days === 0 ? '⏰ Hari ini!' : d.days === 1 ? '⏰ Besok' : `⏰ ${d.days} hari lagi`}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, loading, accent }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <Icon className={cn('h-4 w-4', accent || 'text-muted-foreground')} />
        </div>
        {loading ? (
          <Skeleton className="h-7 w-12" />
        ) : (
          <p className="text-2xl font-bold">{value}</p>
        )}
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </CardContent>
    </Card>
  )
}

function EmptyState({ icon: Icon, title, action }) {
  return (
    <div className="text-center py-6">
      <Icon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
      <p className="text-sm text-muted-foreground mb-3">{title}</p>
      {action}
    </div>
  )
}
