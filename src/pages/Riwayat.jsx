import { Link } from 'react-router-dom'
import { useLombaList } from '@/hooks/useLomba'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { History, ExternalLink, Calendar, Award } from 'lucide-react'
import { KATEGORI_LOMBA, formatDate } from '@/lib/utils'

export default function RiwayatPage() {
  const { data, isLoading } = useLombaList({ status: 'selesai' })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Riwayat Lomba</h1>
        <p className="text-muted-foreground text-sm mt-1">Lomba yang sudah selesai dan hasilnya.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-muted rounded-full p-4 mb-4">
              <History className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-1">Belum ada riwayat</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Lomba yang ditandai sebagai "Selesai" akan muncul di sini.
            </p>
            <Button asChild>
              <Link to="/lomba">Lihat Daftar Lomba</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((l) => {
            const hasil = l.hasil?.[0]
            return (
              <Card key={l.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Link to={`/lomba/${l.id}`} className="font-semibold text-primary hover:underline line-clamp-2">
                      {l.judul}
                    </Link>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1" />
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    <Badge variant="outline" className="text-xs">
                      {KATEGORI_LOMBA[l.kategori]}
                    </Badge>
                    {l.penyelenggara && (
                      <Badge variant="secondary" className="text-xs">
                        {l.penyelenggara}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" />
                      {formatDate(l.tanggal_mulai, { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                    {hasil?.peringkat && (
                      <p className="flex items-center gap-1.5">
                        <Award className="h-3 w-3 text-amber-500" />
                        <span className="font-medium text-foreground">{hasil.peringkat}</span>
                        {hasil.predikat && <span>· {hasil.predikat}</span>}
                      </p>
                    )}
                  </div>
                  {!hasil && (
                    <p className="text-xs text-amber-600 mt-3">⚠ Hasil belum dicatat</p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
