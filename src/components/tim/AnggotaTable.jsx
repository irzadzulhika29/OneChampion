import { useState, useMemo } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useQueryClient } from '@tanstack/react-query'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { useDeleteAnggota } from '@/hooks/useTim'
import { PERAN_ANGGOTA, cn } from '@/lib/utils'
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Edit,
  Trash2,
  Download,
  FileText,
  Search,
  Crown,
  Mail,
  Phone,
} from 'lucide-react'
import AnggotaForm from './AnggotaForm'

export default function AnggotaTable({ timId, anggota = [], loading }) {
  const { toast } = useToast()
  const qc = useQueryClient()
  const deleteAnggota = useDeleteAnggota()
  const [sorting, setSorting] = useState([])
  const [globalFilter, setGlobalFilter] = useState('')

  const handleDelete = async (a) => {
    if (!confirm(`Hapus anggota "${a.nama}"?`)) return
    try {
      await deleteAnggota.mutateAsync({ id: a.id, tim_id: timId })
      toast({ title: 'Anggota dihapus' })
    } catch (err) {
      toast({ variant: 'destructive', title: 'Gagal', description: err.message })
    }
  }

  const handleKtmView = async (a) => {
    if (!a.ktm_url) return
    try {
      const { data, error } = await supabase.storage
        .from('lampiran')
        .createSignedUrl(a.ktm_url, 3600)
      if (error) throw error
      window.open(data.signedUrl, '_blank')
    } catch (err) {
      toast({ variant: 'destructive', title: 'Gagal membuka KTM', description: err.message })
    }
  }

  const columns = useMemo(
    () => [
      {
        id: 'no',
        header: '#',
        cell: ({ row }) => <span className="text-muted-foreground text-xs">{row.index + 1}</span>,
        enableSorting: false,
      },
      {
        accessorKey: 'nama',
        header: ({ column }) => (
          <Button variant="ghost" size="sm" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="-ml-3">
            Nama <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="font-medium truncate max-w-[180px]">{row.original.nama}</span>
            {row.original.peran === 'ketua' && <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
          </div>
        ),
      },
      {
        accessorKey: 'nim',
        header: 'NIM',
        cell: ({ row }) => <span className="text-sm font-mono">{row.original.nim || '—'}</span>,
      },
      {
        accessorKey: 'prodi',
        header: 'Prodi',
        cell: ({ row }) => <span className="text-sm truncate max-w-[160px] inline-block">{row.original.prodi || '—'}</span>,
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => row.original.email ? (
          <a href={`mailto:${row.original.email}`} className="text-sm text-primary hover:underline inline-flex items-center gap-1 max-w-[180px] truncate">
            <Mail className="h-3 w-3 shrink-0" />
            <span className="truncate">{row.original.email}</span>
          </a>
        ) : <span className="text-sm text-muted-foreground">—</span>,
      },
      {
        accessorKey: 'no_hp',
        header: 'No HP',
        cell: ({ row }) => row.original.no_hp || row.original.kontak ? (
          <a href={`https://wa.me/${(row.original.no_hp || row.original.kontak).replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
            <Phone className="h-3 w-3" />
            {row.original.no_hp || row.original.kontak}
          </a>
        ) : <span className="text-sm text-muted-foreground">—</span>,
      },
      {
        accessorKey: 'ktm_url',
        header: 'KTM',
        cell: ({ row }) => row.original.ktm_url ? (
          <Button variant="ghost" size="sm" onClick={() => handleKtmView(row.original)} className="h-7 text-xs text-emerald-700 hover:text-emerald-700">
            <FileText className="h-3.5 w-3.5 mr-1" /> Lihat
          </Button>
        ) : <span className="text-xs text-muted-foreground">—</span>,
      },
      {
        accessorKey: 'peran',
        header: 'Peran',
        cell: ({ row }) => {
          const peran = row.original.peran
          const variant = peran === 'ketua' ? 'default' : peran === 'cadangan' ? 'outline' : 'secondary'
          return <Badge variant={variant} className="text-xs">{PERAN_ANGGOTA[peran]}</Badge>
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const a = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <Dialog>
                  <DialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Edit className="h-4 w-4" /> Edit
                    </DropdownMenuItem>
                  </DialogTrigger>
                  <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Edit Anggota</DialogTitle>
                    </DialogHeader>
                    <AnggotaForm timId={timId} initial={a} />
                  </DialogContent>
                </Dialog>
                {a.ktm_url && (
                  <DropdownMenuItem onClick={() => handleKtmView(a)}>
                    <Download className="h-4 w-4" /> Lihat KTM
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => handleDelete(a)} className="text-destructive focus:text-destructive">
                  <Trash2 className="h-4 w-4" /> Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
        enableSorting: false,
      },
    ],
    [timId]
  )

  const table = useReactTable({
    data: anggota,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  })

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (!anggota || anggota.length === 0) {
    return null // parent renders empty state
  }

  return (
    <div className="space-y-3">
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari anggota..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="pl-8 h-9"
        />
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id} className="whitespace-nowrap">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {table.getFilteredRowModel().rows.length} dari {anggota.length} anggota
        </span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span>Hal {table.getState().pagination.pageIndex + 1} / {Math.max(1, table.getPageCount())}</span>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
