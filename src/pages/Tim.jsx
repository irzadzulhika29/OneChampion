import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTim, useDeleteTim } from '@/hooks/useTim'
import { useAllAnggota } from '@/hooks/useAllAnggota'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import TimForm from '@/components/tim/TimForm'
import AllAnggotaTable from '@/components/tim/AllAnggotaTable'
import { Plus, Users, MoreVertical, Trash2, Edit, ArrowRight, ListChecks } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { formatDate } from '@/lib/utils'

export default function TimPage() {
  const { data: tim, isLoading } = useTim()
  const { data: allAnggota, isLoading: loadingAnggota } = useAllAnggota()
  const deleteTim = useDeleteTim()
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleDelete = async (id, nama) => {
    if (!confirm(`Hapus tim "${nama}"? Semua anggota dan lomba terkait akan terpengaruh.`)) return
    try {
      await deleteTim.mutateAsync(id)
      toast({ title: 'Tim dihapus' })
    } catch (err) {
      toast({ variant: 'destructive', title: 'Gagal menghapus', description: err.message })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Tim</h1>
          <p className="text-muted-foreground text-sm mt-1">Kelola tim dan anggota untuk lomba kelompok</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Buat Tim</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Buat Tim Baru</DialogTitle>
              <DialogDescription>Tambahkan anggota setelah tim dibuat.</DialogDescription>
            </DialogHeader>
            <TimForm onSuccess={() => setDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Section 1: Daftar Tim (cards) */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Daftar Tim
          </h2>
          <span className="text-xs text-muted-foreground">({tim?.length ?? 0})</span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        ) : !tim || tim.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="bg-muted rounded-full p-4 mb-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-1">Belum ada tim</h3>
              <p className="text-sm text-muted-foreground mb-4">Buat tim pertama untuk mulai mengelola anggota.</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4" /> Buat Tim
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tim.map((t) => (
              <Card key={t.id} className="group hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{t.nama}</CardTitle>
                      {t.deskripsi && (
                        <CardDescription className="line-clamp-2 mt-1">{t.deskripsi}</CardDescription>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/tim/${t.id}`}>
                            <Edit className="h-4 w-4" /> Kelola
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(t.id, t.nama)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" /> Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Users className="h-4 w-4" />
                      {t.anggota_tim?.[0]?.count ?? 0} anggota
                    </span>
                    <span className="text-xs">{formatDate(t.created_at, { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <Button asChild variant="ghost" size="sm" className="w-full mt-3 group-hover:bg-accent">
                    <Link to={`/tim/${t.id}`}>
                      Buka <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Section 2: Daftar Semua Anggota (table) */}
      {tim && tim.length > 0 && (
        <>
          <Separator />
          <section>
            <div className="flex items-center gap-2 mb-3">
              <ListChecks className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Daftar Semua Anggota
              </h2>
              <span className="text-xs text-muted-foreground">({allAnggota?.length ?? 0})</span>
            </div>
            <AllAnggotaTable anggota={allAnggota || []} loading={loadingAnggota} />
          </section>
        </>
      )}
    </div>
  )
}
