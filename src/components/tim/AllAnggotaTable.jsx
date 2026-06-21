import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { supabase } from '@/lib/supabase'
import { PERAN_ANGGOTA } from '@/lib/utils'
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Crown,
  Mail,
  Phone,
  Plus,
  Users,
} from 'lucide-react'
import { useAllProfiles } from '@/hooks/useProfiles'

/**
 * "Daftar Semua Anggota" table — now reads from profiles (auth.users)
 * and annotates with their current tim membership.
 */
export default function AllAnggotaTable({ loading }) {
  const { data: profiles } = useAllProfiles()
  const [sorting, setSorting] = useState([])
  const [globalFilter, setGlobalFilter] = useState('')

  const rows = profiles || []

  const columns = useMemo(
    () => [
      {
        id: 'no',
        header: '#',
        cell: ({ row }) => <span className="text-muted-foreground text-xs">{row.index + 1}</span>,
        enableSorting: false,
      },
      {
        accessorKey: 'full_name',
        header: ({ column }) => (
          <Button variant="ghost" size="sm" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="-ml-3">
            Nama <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="font-medium truncate max-w-[160px]">{row.original.full_name}</span>
            {row.original.tim_id && row.original.peran === 'ketua' && <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
          </div>
        ),
      },
      {
        id: 'tim',
        accessorFn: (row) => row.tim_nama,
        header: ({ column }) => (
          <Button variant="ghost" size="sm" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="-ml-3">
            Tim <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => row.original.tim_id ? (
          <Link to={`/tim/${row.original.tim_id}`} className="text-sm text-primary hover:underline truncate max-w-[160px] inline-block">
            {row.original.tim_nama}
          </Link>
        ) : <span className="text-xs text-muted-foreground italic">belum masuk tim</span>,
      },
      {
        accessorKey: 'nim',
        header: 'NIM',
        cell: ({ row }) => <span className="text-sm font-mono">{row.original.nim || '—'}</span>,
      },
      {
        accessorKey: 'prodi',
        header: 'Prodi',
        cell: ({ row }) => <span className="text-sm truncate max-w-[140px] inline-block">{row.original.prodi || '—'}</span>,
      },
      {
        accessorKey: 'no_hp',
        header: 'No HP',
        cell: ({ row }) => row.original.no_hp ? (
          <a
            href={`https://wa.me/${row.original.no_hp.replace(/\D/g, '')}`}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-primary hover:underline inline-flex items-center gap-1"
          >
            <Phone className="h-3 w-3" />
            {row.original.no_hp}
          </a>
        ) : <span className="text-sm text-muted-foreground">—</span>,
      },
      {
        accessorKey: 'peran',
        header: 'Peran',
        cell: ({ row }) => row.original.tim_id ? (
          <Badge variant={row.original.peran === 'ketua' ? 'default' : 'secondary'} className="text-xs">
            {PERAN_ANGGOTA[row.original.peran] || row.original.peran}
          </Badge>
        ) : <span className="text-xs text-muted-foreground">—</span>,
      },
    ],
    []
  )

  const table = useReactTable({
    data: rows,
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

  if (rows.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground border rounded bg-muted/10">
        <Users className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
        Belum ada user terdaftar di sistem.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama / NIM / prodi..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
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
          {table.getFilteredRowModel().rows.length} dari {rows.length} user
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
