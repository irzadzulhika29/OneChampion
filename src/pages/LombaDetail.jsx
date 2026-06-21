import { useParams, Link, useNavigate } from 'react-router-dom'
import { useLombaDetail, useDeleteLomba } from '@/hooks/useLomba'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import LombaForm from '@/components/lomba/LombaForm'
import { TimelinePosterView } from '@/components/lomba/TimelinePoster'
import HasilForm from '@/components/riwayat/HasilForm'
import LampiranList from '@/components/riwayat/LampiranList'
import {
  ArrowLeft,
  Trash2,
  Save,
  Calendar,
  Trophy,
} from 'lucide-react'
import { STATUS_LOMBA, cn } from '@/lib/utils'

export default function LombaDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { data: lomba, isLoading } = useLombaDetail(id)
  const deleteLomba = useDeleteLomba()

  const handleDelete = async () => {
    if (!confirm(`Hapus lomba "${lomba.judul}"?`)) return
    try {
      await deleteLomba.mutateAsync(id)
      toast({ title: 'Lomba dihapus' })
      navigate('/lomba')
    } catch (err) {
      toast({ variant: 'destructive', title: 'Gagal', description: err.message })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!lomba) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Lomba tidak ditemukan.</p>
        <Button asChild variant="link">
          <Link to="/lomba">Kembali ke daftar lomba</Link>
        </Button>
      </div>
    )
  }

  const status = STATUS_LOMBA[lomba.status]
  const lampiran = lomba.lampiran?.filter((l) => !l.hasil_id) || []
  const lampiranHasil = lomba.hasil?.[0] ? (lomba.lampiran?.filter((l) => l.hasil_id === lomba.hasil[0].id) || []) : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button asChild variant="ghost" size="icon">
          <Link to="/lomba" aria-label="Kembali">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight truncate">
              {lomba.judul || 'Detail Lomba'}
            </h1>
            <span className={cn('text-xs px-2 py-0.5 rounded-full border', status?.class)}>
              {status?.label}
            </span>
          </div>
          {lomba.penyelenggara && (
            <p className="text-sm text-muted-foreground mt-1">{lomba.penyelenggara}</p>
          )}
        </div>
        <Button variant="destructive" size="sm" onClick={handleDelete}>
          <Trash2 className="h-4 w-4" />
          <span className="hidden sm:inline">Hapus</span>
        </Button>
      </div>

      {/* Inline editable form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Save className="h-4 w-4" /> Detail Lomba
          </CardTitle>
          <CardDescription>
            Edit langsung di sini. Klik "Simpan Perubahan" di bawah untuk menyimpan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LombaForm initial={lomba} onSuccess={() => window.location.reload()} />
        </CardContent>
      </Card>

      {/* Timeline Poster */}
      {lomba.timeline_image_url && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Timeline
            </CardTitle>
            <CardDescription>Poster timeline lomba</CardDescription>
          </CardHeader>
          <CardContent>
            <TimelinePosterView storagePath={lomba.timeline_image_url} />
          </CardContent>
        </Card>
      )}

      {/* Lampiran & Hasil */}
      <Tabs defaultValue="lampiran">
        <TabsList>
          <TabsTrigger value="lampiran">Lampiran ({lampiran.length})</TabsTrigger>
          <TabsTrigger value="hasil">Hasil & Sertifikat</TabsTrigger>
        </TabsList>

        <TabsContent value="lampiran">
          <Card>
            <CardContent className="pt-6">
              <LampiranList lombaId={id} lampiran={lampiran} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hasil">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-4 w-4" /> Hasil Lomba
              </CardTitle>
              <CardDescription>Catat peringkat dan upload sertifikat.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <HasilForm lombaId={id} initial={lomba.hasil?.[0]} />
              {lomba.hasil?.[0] && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium mb-2">Sertifikat & Dokumen Hasil</h3>
                    <LampiranList lombaId={id} hasilId={lomba.hasil[0].id} lampiran={lampiranHasil} />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
