import { useParams, Link, useNavigate } from 'react-router-dom'
import { useTimDetail, useDeleteTim } from '@/hooks/useTim'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import TimForm from '@/components/tim/TimForm'
import AnggotaForm from '@/components/tim/AnggotaForm'
import AnggotaTable from '@/components/tim/AnggotaTable'
import { ArrowLeft, Plus, Trash2, Users, Crown, Mail, Phone, IdCard, GraduationCap } from 'lucide-react'
import { PERAN_ANGGOTA } from '@/lib/utils'

export default function TimDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { data: tim, isLoading } = useTimDetail(id)
  const deleteTim = useDeleteTim()

  const handleDeleteTim = async () => {
    if (!confirm(`Hapus tim "${tim.nama}"?`)) return
    try {
      await deleteTim.mutateAsync(id)
      toast({ title: 'Tim dihapus' })
      navigate('/tim')
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

  if (!tim) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Tim tidak ditemukan.</p>
        <Button asChild variant="link">
          <Link to="/tim">Kembali ke daftar tim</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link to="/tim" aria-label="Kembali">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight truncate">{tim.nama}</h1>
          {tim.deskripsi && <p className="text-sm text-muted-foreground mt-1">{tim.deskripsi}</p>}
        </div>
      </div>

      <Tabs defaultValue="anggota">
        <TabsList>
          <TabsTrigger value="anggota">
            <Users className="h-4 w-4 mr-1.5" /> Daftar Anggota ({tim.anggota_tim?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="info">Info Tim</TabsTrigger>
        </TabsList>

        <TabsContent value="anggota" className="space-y-4">
          <div className="flex justify-end">
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4" /> Tambah Anggota
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Tambah Anggota</DialogTitle>
                </DialogHeader>
                <AnggotaForm timId={id} />
              </DialogContent>
            </Dialog>
          </div>

          {!tim.anggota_tim || tim.anggota_tim.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                Belum ada anggota. Tambahkan anggota pertama.
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Desktop: full table */}
              <div className="hidden md:block">
                <AnggotaTable timId={id} anggota={tim.anggota_tim} />
              </div>

              {/* Mobile: compact card list */}
              <div className="md:hidden space-y-2">
                {tim.anggota_tim.map((a) => (
                  <Card key={a.id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-semibold truncate">{a.nama}</span>
                          {a.peran === 'ketua' && <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                        </div>
                        <Badge variant={a.peran === 'ketua' ? 'default' : 'secondary'} className="text-xs shrink-0">
                          {PERAN_ANGGOTA[a.peran]}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        {a.nim && (
                          <div className="flex items-center gap-1 truncate">
                            <IdCard className="h-3 w-3 shrink-0" />
                            <span className="font-mono truncate">{a.nim}</span>
                          </div>
                        )}
                        {a.prodi && (
                          <div className="flex items-center gap-1 truncate">
                            <GraduationCap className="h-3 w-3 shrink-0" />
                            <span className="truncate">{a.prodi}</span>
                          </div>
                        )}
                        {a.email && (
                          <div className="flex items-center gap-1 truncate col-span-2">
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">{a.email}</span>
                          </div>
                        )}
                        {(a.no_hp || a.kontak) && (
                          <div className="flex items-center gap-1 col-span-2">
                            <Phone className="h-3 w-3 shrink-0" />
                            <span>{a.no_hp || a.kontak}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-end mt-3">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">Edit</Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Edit Anggota</DialogTitle>
                            </DialogHeader>
                            <AnggotaForm timId={id} initial={a} />
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Tim</CardTitle>
              <CardDescription>Detail tim yang bisa diedit.</CardDescription>
            </CardHeader>
            <CardContent>
              <TimForm initial={tim} />
              <div className="border-t mt-6 pt-6">
                <h3 className="text-sm font-medium text-destructive mb-2">Zona Berbahaya</h3>
                <Button variant="destructive" onClick={handleDeleteTim}>
                  <Trash2 className="h-4 w-4" /> Hapus Tim
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
