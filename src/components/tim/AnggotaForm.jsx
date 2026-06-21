import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { anggotaSchema } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PERAN_ANGGOTA } from '@/lib/utils'
import { useAddAnggota, useUpdateAnggota } from '@/hooks/useTim'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { Loader2, Upload, Trash2, FileText, Download } from 'lucide-react'

export default function AnggotaForm({ timId: timIdProp, timList = [], initial, onSuccess, onCancel }) {
  const { toast } = useToast()
  const addAnggota = useAddAnggota()
  const updateAnggota = useUpdateAnggota()
  const isEdit = !!initial
  const fileInputRef = useRef(null)
  const [ktmUploading, setKtmUploading] = useState(false)
  const [ktmFile, setKtmFile] = useState(null)
  const [ktmUrl, setKtmUrl] = useState(initial?.ktm_url || '')
  const [ktmRemoved, setKtmRemoved] = useState(false)
  const [selectedTimId, setSelectedTimId] = useState(timIdProp || initial?.tim_id || '')

  const allowTimPick = !timIdProp && timList.length > 0

  const form = useForm({
    resolver: zodResolver(anggotaSchema),
    defaultValues: initial
      ? {
          nama: initial.nama || '',
          email: initial.email || '',
          nim: initial.nim || '',
          prodi: initial.prodi || '',
          no_hp: initial.no_hp || initial.kontak || '', // fallback to kontak for legacy data
          peran: initial.peran || 'anggota',
          ktm_url: initial.ktm_url || '',
        }
      : { nama: '', email: '', nim: '', prodi: '', no_hp: '', peran: 'anggota', ktm_url: '' },
  })

  // sync ktm_url value into form for proper validation/serialization
  useEffect(() => {
    form.setValue('ktm_url', ktmRemoved ? '' : ktmUrl)
  }, [ktmUrl, ktmRemoved, form])

  const handleKtmPick = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 10 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'File terlalu besar', description: 'Maks 10MB' })
      return
    }
    setKtmFile(f)
    setKtmRemoved(false)
  }

  const handleKtmRemove = () => {
    setKtmFile(null)
    setKtmUrl('')
    setKtmRemoved(true)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const uploadKtm = async (targetTimId) => {
    if (!ktmFile) return ktmUrl
    setKtmUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const safeName = ktmFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const path = `${user.id}/${targetTimId}/ktm-${Date.now()}-${safeName}`
      const { error } = await supabase.storage
        .from('lampiran')
        .upload(path, ktmFile, { contentType: ktmFile.type, upsert: false })
      if (error) throw error
      return path
    } catch (err) {
      toast({ variant: 'destructive', title: 'Upload KTM gagal', description: err.message })
      throw err
    } finally {
      setKtmUploading(false)
    }
  }

  const handleKtmDownload = async () => {
    try {
      const { data, error } = await supabase.storage
        .from('lampiran')
        .createSignedUrl(ktmUrl, 3600)
      if (error) throw error
      window.open(data.signedUrl, '_blank')
    } catch (err) {
      toast({ variant: 'destructive', title: 'Gagal membuka file', description: err.message })
    }
  }

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const targetTimId = timIdProp || selectedTimId
      if (!targetTimId) {
        toast({ variant: 'destructive', title: 'Pilih tim terlebih dahulu' })
        return
      }
      let uploadedUrl = values.ktm_url
      if (ktmFile) {
        uploadedUrl = await uploadKtm(targetTimId)
      }
      const payload = { ...values, ktm_url: uploadedUrl || null, kontak: values.no_hp }

      if (isEdit) {
        await updateAnggota.mutateAsync({ id: initial.id, tim_id: targetTimId, ...payload })
        toast({ title: 'Anggota diperbarui' })
      } else {
        await addAnggota.mutateAsync({ tim_id: targetTimId, ...payload })
        toast({ title: 'Anggota ditambahkan' })
      }
      setKtmFile(null)
      setKtmRemoved(false)
      setKtmUrl(uploadedUrl || '')
      onSuccess?.()
      if (!isEdit) {
        form.reset({ nama: '', email: '', nim: '', prodi: '', no_hp: '', peran: 'anggota', ktm_url: '' })
      }
    } catch (err) {
      if (!String(err.message).toLowerCase().includes('ktm')) {
        toast({ variant: 'destructive', title: 'Gagal menyimpan', description: err.message })
      }
    }
  })

  const isLoading = addAnggota.isPending || updateAnggota.isPending || ktmUploading

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="nama">Nama Lengkap *</Label>
          <Input id="nama" placeholder="Budi Santoso" {...form.register('nama')} />
          {form.formState.errors.nama && (
            <p className="text-sm text-destructive">{form.formState.errors.nama.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="nim">NIM / NIP</Label>
          <Input id="nim" placeholder="123456789" {...form.register('nim')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="prodi">Program Studi</Label>
          <Input id="prodi" placeholder="Teknik Informatika" {...form.register('prodi')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="budi@email.com" {...form.register('email')} />
          {form.formState.errors.email && (
            <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="no_hp">No HP / WhatsApp</Label>
          <Input id="no_hp" placeholder="08xxxxxxxxxx" {...form.register('no_hp')} />
        </div>

        {allowTimPick && (
          <div className="space-y-2 sm:col-span-2">
            <Label>Tim *</Label>
            <Select value={selectedTimId} onValueChange={setSelectedTimId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih tim..." />
              </SelectTrigger>
              <SelectContent>
                {timList.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.nama}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="peran">Peran</Label>
          <Select value={form.watch('peran')} onValueChange={(v) => form.setValue('peran', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PERAN_ANGGOTA).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label>KTM (opsional)</Label>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,application/pdf"
            onChange={handleKtmPick}
          />
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={ktmUploading}
            >
              {ktmUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {ktmFile ? 'Ganti File' : 'Upload KTM'}
            </Button>
            {(ktmFile || (ktmUrl && !ktmRemoved)) && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded border bg-muted/40 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="truncate max-w-[180px]">
                  {ktmFile ? ktmFile.name : 'KTM tersimpan'}
                </span>
                {ktmUrl && !ktmRemoved && !ktmFile && (
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={handleKtmDownload}>
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={handleKtmRemove}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Maks 10MB. PDF atau gambar (jpg/png).</p>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEdit ? 'Simpan' : 'Tambah'}
        </Button>
      </div>
    </form>
  )
}
