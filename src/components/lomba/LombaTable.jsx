import { Link } from 'react-router-dom'
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { STATUS_LOMBA, KATEGORI_LOMBA, formatDate, cn } from '@/lib/utils'
import { ArrowUpDown, ChevronLeft, ChevronRight, ExternalLink, UserCircle2 } from 'lucide-react'
import { useUpdateLombaStatus } from '@/hooks/useLomba'
import { useToast } from '@/hooks/use-toast'

export default function LombaTable({ data }) {
  const updateStatus = useUpdateLombaStatus()
  const { toast } = useToast()

  const handleStatusChange = async (id, status) => {
    try {
      await updateStatus.mutateAsync({ id, status })
      toast({ title: 'Status diperbarui' })
    } catch (err) {
      toast({ variant: 'destructive', title: 'Gagal', description: err.message })
    }
  }

  const columns = [
    {
      accessorKey: 'judul',
      header: ({ column }) => (
        <Button variant="ghost" size="sm" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="-ml-3">
          Competition Name <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <Link to={`/lomba/${row.original.id}`} className="font-medium text-primary hover:underline line-clamp-1">
          {row.original.judul}
        </Link>
      ),
    },
    {
      accessorKey: 'penyelenggara',
      header: 'Organizer',
      cell: ({ row }) => <span className="text-sm">{row.original.penyelenggara || '—'}</span>,
    },
    {
      accessorKey: 'kategori',
      header: 'Kategori',
      cell: ({ row }) => <span className="text-sm">{KATEGORI_LOMBA[row.original.kategori] || '-'}</span>,
    },
    {
      accessorKey: 'tanggal_final',
      header: ({ column }) => (
        <Button variant="ghost" size="sm" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="-ml-3">
          Final <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => row.original.tanggal_final ? (
        <span className="text-xs whitespace-nowrap font-medium">
          {formatDate(row.original.tanggal_final, { day: '2-digit', month: 'short', year: '2-digit' })}
        </span>
      ) : <span className="text-xs text-muted-foreground">—</span>,
    },
    {
      accessorKey: 'deadline_pendaftaran',
      header: 'DL Register',
      cell: ({ row }) => row.original.deadline_pendaftaran ? (
        <span className="text-xs whitespace-nowrap">{formatDate(row.original.deadline_pendaftaran, { day: '2-digit', month: 'short' })}</span>
      ) : <span className="text-xs text-muted-foreground">—</span>,
    },
    {
      accessorKey: 'deadline_submission',
      header: 'DL Submission',
      cell: ({ row }) => row.original.deadline_submission ? (
        <span className="text-xs whitespace-nowrap">{formatDate(row.original.deadline_submission, { day: '2-digit', month: 'short' })}</span>
      ) : <span className="text-xs text-muted-foreground">—</span>,
    },
    {
      accessorKey: 'pic_nama',
      header: 'PIC',
      cell: ({ row }) => row.original.pic_nama ? (
        <span className="text-xs inline-flex items-center gap-1 max-w-[140px] truncate">
          <UserCircle2 className="h-3 w-3 text-muted-foreground shrink-0" />
          <span className="truncate">{row.original.pic_nama}</span>
        </span>
      ) : <span className="text-xs text-muted-foreground">—</span>,
    },
    {
      accessorKey: 'tim.nama',
      header: 'Team',
      cell: ({ row }) => row.original.tim?.nama || <span className="text-muted-foreground text-sm">—</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status
        const s = STATUS_LOMBA[status]
        return (
          <Select value={status} onValueChange={(v) => handleStatusChange(row.original.id, v)}>
            <SelectTrigger className={cn('h-7 w-fit min-w-[110px] text-xs', s?.class || '')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_LOMBA).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button asChild variant="ghost" size="icon" className="h-7 w-7">
          <Link to={`/lomba/${row.original.id}`} aria-label="Detail">
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </Button>
      ),
    },
  ]

  const table = useReactTable({
    data: data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  })

  if (!data || data.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
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
            {(() => {
              const rows = table.getRowModel().rows
              const emptyCount = Math.max(0, 10 - rows.length)
              return (
                <>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="whitespace-nowrap">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                  {Array.from({ length: emptyCount }).map((_, i) => (
                    <TableRow key={`empty-${i}`} className="hover:bg-transparent pointer-events-none">
                      {table.getVisibleLeafColumns().map((col) => (
                        <TableCell key={col.id} className="whitespace-nowrap text-muted-foreground/30 select-none">
                          —
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </>
              )
            })()}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {table.getFilteredRowModel().rows.length} lomba
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
