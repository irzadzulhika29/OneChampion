import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { timSchema } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useCreateTim, useUpdateTim } from '@/hooks/useTim'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

export default function TimForm({ initial, onSuccess, onCancel }) {
  const { toast } = useToast()
  const createTim = useCreateTim()
  const updateTim = useUpdateTim()
  const isEdit = !!initial

  const form = useForm({
    resolver: zodResolver(timSchema),
    defaultValues: initial || { nama: '', deskripsi: '' },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (isEdit) {
        await updateTim.mutateAsync({ id: initial.id, ...values })
        toast({ title: 'Tim diperbarui' })
      } else {
        await createTim.mutateAsync(values)
        toast({ title: 'Tim dibuat' })
      }
      onSuccess?.()
    } catch (err) {
      toast({ variant: 'destructive', title: 'Gagal menyimpan', description: err.message })
    }
  })

  const isLoading = createTim.isPending || updateTim.isPending

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nama">Nama Tim</Label>
        <Input id="nama" placeholder="Tim Cendekia" {...form.register('nama')} />
        {form.formState.errors.nama && (
          <p className="text-sm text-destructive">{form.formState.errors.nama.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="deskripsi">Deskripsi (opsional)</Label>
        <Textarea id="deskripsi" rows={3} placeholder="Tentang tim ini..." {...form.register('deskripsi')} />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Batal
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEdit ? 'Simpan Perubahan' : 'Buat Tim'}
        </Button>
      </div>
    </form>
  )
}
