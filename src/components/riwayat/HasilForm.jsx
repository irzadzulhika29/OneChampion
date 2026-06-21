import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { hasilSchema } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'

export default function HasilForm({ lombaId, initial, onSuccess }) {
  const { toast } = useToast()
  const qc = useQueryClient()
  const form = useForm({
    resolver: zodResolver(hasilSchema),
    defaultValues: initial || { peringkat: '', predikat: '', poin: 0, catatan: '' },
  })

  // Reset form when initial prop changes (e.g., after refetch)
  useEffect(() => {
    if (initial) {
      form.reset(initial)
    }
  }, [initial?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      // Clean empty numeric
      const cleaned = {
        ...values,
        poin: values.poin == null || values.poin === '' ? null : Number(values.poin),
      }
      if (initial) {
        const { error } = await supabase
          .from('hasil')
          .update(cleaned)
          .eq('id', initial.id)
        if (error) throw error
        toast({ title: 'Hasil diperbarui' })
      } else {
        const { error } = await supabase
          .from('hasil')
          .insert({ ...cleaned, lomba_id: lombaId })
        if (error) throw error
        toast({ title: 'Hasil dicatat' })
      }
      // Invalidate detail + list caches so refetch picks up new state
      qc.invalidateQueries({ queryKey: ['lomba', lombaId] })
      qc.invalidateQueries({ queryKey: ['lomba'] })
      onSuccess?.()
    } catch (err) {
      toast({ variant: 'destructive', title: 'Gagal', description: err.message })
    }
  })

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="peringkat">Peringkat</Label>
          <Input id="peringkat" placeholder="Juara 1 / Top 10 / Finalis" {...form.register('peringkat')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="predikat">Predikat</Label>
          <Input id="predikat" placeholder="Gold / Silver / Honorable" {...form.register('predikat')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="poin">Poin / Skor</Label>
          <Input id="poin" type="number" min="0" {...form.register('poin')} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="catatan">Catatan Hasil</Label>
        <Textarea id="catatan" rows={3} placeholder="Lesson learned, feedback, dll..." {...form.register('catatan')} />
      </div>
      <div className="flex justify-end">
        <Button type="submit">
          {form.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {initial ? 'Simpan Perubahan' : 'Catat Hasil'}
        </Button>
      </div>
    </form>
  )
}
