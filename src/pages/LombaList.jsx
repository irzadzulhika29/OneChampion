import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLombaList, useDeleteLomba } from '@/hooks/useLomba'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import LombaForm from '@/components/lomba/LombaForm'
import LombaTable from '@/components/lomba/LombaTable'
import LombaCards from '@/components/lomba/LombaCards'
import { Plus, ListChecks, Search } from 'lucide-react'
import { KATEGORI_LOMBA, STATUS_LOMBA } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

export default function LombaListPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    kategori: 'all',
  })

  const { data, isLoading } = useLombaList(filters)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Daftar Lomba</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {data ? `${data.length} lomba` : 'Memuat...'}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Lomba Baru</span>
              <span className="sm:hidden">Baru</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tambah Lomba</DialogTitle>
              <DialogDescription>Detail lomba yang ingin Anda ikuti.</DialogDescription>
            </DialogHeader>
            <LombaForm onSuccess={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari judul / penyelenggara..."
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            className="pl-8"
          />
        </div>
        <Select value={filters.status} onValueChange={(v) => setFilters((f) => ({ ...f, status: v }))}>
          <SelectTrigger className="sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            {Object.entries(STATUS_LOMBA).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filters.kategori} onValueChange={(v) => setFilters((f) => ({ ...f, kategori: v }))}>
          <SelectTrigger className="sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kategori</SelectItem>
            {Object.entries(KATEGORI_LOMBA).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-muted rounded-full p-4 mb-4">
              <ListChecks className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-1">Belum ada lomba</h3>
            <p className="text-sm text-muted-foreground mb-4">Tambahkan lomba pertama Anda.</p>
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> Tambah Lomba
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="hidden md:block">
            <LombaTable data={data} />
          </div>
          <LombaCards data={data} />
        </>
      )}
    </div>
  )
}
