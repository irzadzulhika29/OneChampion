import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { timSchema } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { useCreateTim, useUpdateTim, useAddAnggota, useDeleteAnggota } from '@/hooks/useTim'
import { useAllAnggota } from '@/hooks/useAllAnggota'
import { useToast } from '@/hooks/use-toast'
import { useQueryClient } from '@tanstack/react-query'
import { PERAN_ANGGOTA, cn } from '@/lib/utils'
import { Loader2, Search, Users, X, UserPlus } from 'lucide-react'

/**
 * TimForm with two modes:
 *  - "create" (default): plain form to create tim
 *  - "select": pick existing anggota to add to the tim (used inside Tambah Tim dialog on /tim)
 */
export default function TimForm({
  initial,
  mode = 'create',
  availableAnggota = [],
  timId: timIdProp,
  onSuccess,
  onCancel,
}) {
  const { toast } = useToast()
  const qc = useQueryClient()
  const createTim = useCreateTim()
  const updateTim = useUpdateTim()
  const addAnggota = useAddAnggota()
  const deleteAnggota = useDeleteAnggota()
  const { data: allAnggotaList } = useAllAnggota()
  const isEdit = !!initial
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [creating, setCreating] = useState(false)

  const form = useForm({
    resolver: zodResolver(timSchema),
    defaultValues: initial || { nama: '', deskripsi: '' },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (isEdit) {
        await updateTim.mutateAsync({ id: initial.id, ...values })
        toast({ title: 'Tim diperbarui' })
        onSuccess?.()
      } else {
        const created = await createTim.mutateAsync(values)
        // If mode='select' and user picked members, link them now
        if (mode === 'select' && selectedIds.size > 0) {
          const timId = created.id
          await Promise.all(
            Array.from(selectedIds).map((anggotaId) =>
              addAnggota.mutateAsync({ tim_id: timId, anggota_id_to_link: anggotaId })
            )
          )
          toast({ title: 'Tim dibuat', description: `${selectedIds.size} anggota ditambahkan ke tim.` })
        } else {
          toast({ title: 'Tim dibuat' })
        }
        onSuccess?.()
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Gagal menyimpan', description: err.message })
    }
  })

  const isLoading = createTim.isPending || updateTim.isPending || addAnggota.isPending

  // Filter available anggota by search (exclude those already in this tim when editing)
  const filtered = useMemo(() => {
    if (!isEdit && mode !== 'select') return []
    const list = availableAnggota.length > 0 ? availableAnggota : (allAnggotaList || [])
    // When editing: exclude anggota already in this tim
    const existingIds = new Set()
    if (isEdit && initial?.anggota_tim) {
      initial.anggota_tim.forEach((a) => existingIds.add(a.id))
    }
    return list.filter((a) => !existingIds.has(a.id)).filter((a) => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        a.nama?.toLowerCase().includes(q) ||
        a.nim?.toLowerCase().includes(q) ||
        a.prodi?.toLowerCase().includes(q) ||
        a.email?.toLowerCase().includes(q)
      )
    })
  }, [availableAnggota, allAnggotaList, search, isEdit, initial, mode])

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleRemoveAnggota = async (anggota) => {
    if (!confirm(`Keluarkan "${anggota.nama}" dari tim ini?`)) return
    try {
      await deleteAnggota.mutateAsync({ id: anggota.id, tim_id: anggota.tim_id })
      toast({ title: 'Anggota dikeluarkan dari tim' })
    } catch (err) {
      toast({ variant: 'destructive', title: 'Gagal', description: err.message })
    }
  }

  // ============ EDIT MODE — show current members with remove + add more ============
  if (isEdit && mode === 'select') {
    return (
      <div className="space-y-4">
        {/* Current members */}
        <div>
          <Label className="mb-2 block">Anggota Saat Ini</Label>
          {initial.anggota_tim?.length > 0 ? (
            <ul className="space-y-2">
              {initial.anggota_tim.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between p-2 rounded border bg-muted/30"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-medium shrink-0">
                      {a.nama?.split(' ').slice(0, 2).map((s) => s[0]).join('')}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{a.nama}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {a.nim && `${a.nim} · `}
                        {PERAN_ANGGOTA[a.peran] || a.peran}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:bg-red-50"
                    onClick={() => handleRemoveAnggota(a)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground py-2">Belum ada anggota.</p>
          )}
        </div>

        <div className="border-t pt-4">
          <Label className="mb-2 block">Tambah Anggota (dari bank data)</Label>
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama / NIM / prodi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {allAnggotaList?.length === 0
                ? 'Belum ada anggota di bank data. Tambah anggota dulu.'
                : 'Semua anggota sudah ada di tim ini.'}
            </p>
          ) : (
            <div className="max-h-60 overflow-y-auto border rounded divide-y">
              {filtered.slice(0, 50).map((a) => (
                <label
                  key={a.id}
                  className="flex items-center gap-2 p-2 hover:bg-muted/40 cursor-pointer"
                >
                  <Checkbox
                    checked={selectedIds.has(a.id)}
                    onCheckedChange={() => toggleSelect(a.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{a.nama}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {a.nim && `${a.nim} · `}
                      {a.prodi || a.email || ''}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
          )}
          <Button
            type="button"
            disabled={selectedIds.size === 0 || addAnggota.isPending}
            onClick={async () => {
              try {
                await Promise.all(
                  Array.from(selectedIds).map((id) =>
                    addAnggota.mutateAsync({ tim_id: initial.id, anggota_id_to_link: id })
                  )
                )
                toast({ title: `${selectedIds.size} anggota ditambahkan` })
                setSelectedIds(new Set())
                onSuccess?.()
              } catch (err) {
                toast({ variant: 'destructive', title: 'Gagal', description: err.message })
              }
            }}
          >
            {addAnggota.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Tambah {selectedIds.size > 0 && `(${selectedIds.size})`}
          </Button>
        </div>
      </div>
    )
  }

  // ============ CREATE MODE — pick anggota to link ============
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nama">Nama Tim *</Label>
        <Input id="nama" placeholder="Tim Cendekia" {...form.register('nama')} />
        {form.formState.errors.nama && (
          <p className="text-sm text-destructive">{form.formState.errors.nama.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="deskripsi">Deskripsi (opsional)</Label>
        <Textarea id="deskripsi" rows={2} placeholder="Tentang tim ini..." {...form.register('deskripsi')} />
      </div>

      {mode === 'select' && (
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-2">
            <Label>Pilih Anggota (opsional)</Label>
            {allAnggotaList && (
              <Badge variant="secondary" className="text-xs">
                <Users className="h-3 w-3 mr-1" />
                {allAnggotaList.length} di bank data
              </Badge>
            )}
          </div>
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama / NIM / prodi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
          {filtered.length === 0 ? (
            <div className="text-center py-4 border rounded bg-muted/20">
              <UserPlus className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
              <p className="text-sm text-muted-foreground">
                {allAnggotaList?.length === 0
                  ? 'Belum ada anggota di bank data.'
                  : 'Tidak ada hasil pencarian.'}
              </p>
            </div>
          ) : (
            <>
              <div className="max-h-56 overflow-y-auto border rounded divide-y">
                {filtered.slice(0, 50).map((a) => (
                  <label
                    key={a.id}
                    className={cn(
                      'flex items-center gap-2 p-2 cursor-pointer transition-colors',
                      selectedIds.has(a.id) ? 'bg-blue-50' : 'hover:bg-muted/40'
                    )}
                  >
                    <Checkbox
                      checked={selectedIds.has(a.id)}
                      onCheckedChange={() => toggleSelect(a.id)}
                    />
                    <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-[10px] font-medium shrink-0">
                      {a.nama?.split(' ').slice(0, 2).map((s) => s[0]).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{a.nama}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {a.nim && `${a.nim} · `}
                        {a.prodi || a.email || ''}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedIds.size > 0
                  ? `${selectedIds.size} anggota dipilih`
                  : 'Bisa dipilih nanti dari halaman detail tim'}
              </p>
            </>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEdit ? 'Simpan Perubahan' : 'Buat Tim'}
        </Button>
      </div>
    </form>
  )
}
