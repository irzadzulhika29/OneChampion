import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { lombaSchema } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { KATEGORI_LOMBA, STATUS_LOMBA } from '@/lib/utils'
import { useCreateLomba, useUpdateLomba } from '@/hooks/useLomba'
import { useTim } from '@/hooks/useTim'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'
import TimelinePoster from './TimelinePoster'

const SectionLabel = ({ children }) => (
  <div className="col-span-full text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-2 first:mt-0">
    {children}
  </div>
)

export default function LombaForm({ initial, onSuccess, onCancel }) {
  const { toast } = useToast()
  const { data: timList } = useTim()
  const createLomba = useCreateLomba()
  const updateLomba = useUpdateLomba()
  const isEdit = !!initial
  const [timelineImage, setTimelineImage] = useState(initial?.timeline_image_url || '')

  const form = useForm({
    resolver: zodResolver(lombaSchema),
    defaultValues: initial
      ? {
          ...initial,
          tim_id: initial.tim_id || '',
          tanggal_mulai: initial.tanggal_mulai || '',
          tanggal_selesai: initial.tanggal_selesai || '',
          deadline_pendaftaran: initial.deadline_pendaftaran || '',
          deadline_submission: initial.deadline_submission || '',
          tanggal_final: initial.tanggal_final || '',
          pic_nama: initial.pic_nama || '',
          pic_kontak: initial.pic_kontak || '',
          document_url: initial.document_url || '',
          timeline_image_url: initial.timeline_image_url || '',
        }
      : {
          judul: '',
          penyelenggara: '',
          kategori: 'other',
          tanggal_mulai: '',
          tanggal_selesai: '',
          deadline_pendaftaran: '',
          deadline_submission: '',
          tanggal_final: '',
          lokasi: '',
          online: false,
          biaya_pendaftaran: 0,
          hadiah: '',
          status: 'rencana',
          url_pendaftaran: '',
          document_url: '',
          pic_nama: '',
          pic_kontak: '',
          catatan: '',
          tim_id: '',
          timeline_image_url: '',
        },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      // Empty date strings → null (Postgres rejects "" for date columns)
      const dateFields = [
        'tanggal_mulai',
        'tanggal_selesai',
        'deadline_pendaftaran',
        'deadline_submission',
        'tanggal_final',
      ]
      const cleaned = { ...values }
      dateFields.forEach((f) => {
        if (!cleaned[f] || cleaned[f] === '') cleaned[f] = null
      })
      // Empty URL fields → null (and trim)
      ;['url_pendaftaran', 'document_url', 'pic_kontak', 'timeline_image_url'].forEach((f) => {
        if (cleaned[f] === '') cleaned[f] = null
      })

      const payload = {
        ...cleaned,
        tim_id: cleaned.tim_id || null,
        timeline_image_url: timelineImage || null,
      }
      if (isEdit) {
        await updateLomba.mutateAsync({ id: initial.id, ...payload })
        toast({ title: 'Lomba diperbarui' })
      } else {
        await createLomba.mutateAsync(payload)
        toast({ title: 'Lomba dibuat', description: 'Reminder otomatis telah dijadwalkan.' })
      }
      onSuccess?.()
    } catch (err) {
      toast({ variant: 'destructive', title: 'Gagal menyimpan', description: err.message })
    }
  })

  const isLoading = createLomba.isPending || updateLomba.isPending

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* === INFORMASI UTAMA === */}
        <SectionLabel>Informasi Utama</SectionLabel>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="judul">Competition Name *</Label>
          <Input id="judul" placeholder="Gemastik 2026 - Programming" {...form.register('judul')} />
          {form.formState.errors.judul && (
            <p className="text-sm text-destructive">{form.formState.errors.judul.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="penyelenggara">Organizer</Label>
          <Input id="penyelenggara" placeholder="KEMENRISTEK / Kampus / Komunitas" {...form.register('penyelenggara')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="kategori">Kategori</Label>
          <Select value={form.watch('kategori')} onValueChange={(v) => form.setValue('kategori', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(KATEGORI_LOMBA).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* === TIMELINE (POSTER) === */}
        <SectionLabel>Timeline (Poster)</SectionLabel>

        <div className="space-y-2 sm:col-span-2">
          <Label>Poster Timeline</Label>
          <TimelinePoster
            lombaId={initial?.id || 'new'}
            value={timelineImage}
            onChange={(path) => {
              setTimelineImage(path || '')
              form.setValue('timeline_image_url', path || '')
            }}
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground">
            Upload gambar poster timeline lomba (mis. screenshot dari guide book). Tanggal detail tetap di input DL di bawah.
          </p>
        </div>

        {/* === DEADLINES === */}
        <SectionLabel>Deadlines & Final</SectionLabel>

        <div className="space-y-2">
          <Label htmlFor="deadline_pendaftaran">DL Register</Label>
          <Input id="deadline_pendaftaran" type="date" {...form.register('deadline_pendaftaran')} />
          <p className="text-xs text-muted-foreground">Batas waktu pendaftaran peserta</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="deadline_submission">DL Submission</Label>
          <Input id="deadline_submission" type="date" {...form.register('deadline_submission')} />
          <p className="text-xs text-muted-foreground">Batas waktu pengumpulan karya</p>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="tanggal_final">Final</Label>
          <Input id="tanggal_final" type="date" {...form.register('tanggal_final')} />
          <p className="text-xs text-muted-foreground">
            Tanggal babak final / pengumuman pemenang. <strong>Digunakan sebagai tanggal utama</strong> di kalender.
          </p>
        </div>

        {/* === LOKASI === */}
        <SectionLabel>Lokasi</SectionLabel>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="lokasi">Lokasi / Platform</Label>
          <Input id="lokasi" placeholder="Online / Kampus X / Alamat..." {...form.register('lokasi')} />
        </div>

        <div className="flex items-center gap-2 sm:col-span-2">
          <Checkbox
            id="online"
            checked={form.watch('online')}
            onCheckedChange={(v) => form.setValue('online', !!v)}
          />
          <Label htmlFor="online" className="cursor-pointer">Lomba Online</Label>
        </div>

        {/* === HADIAH & BIAYA === */}
        <SectionLabel>Hadiah & Biaya</SectionLabel>

        <div className="space-y-2">
          <Label htmlFor="biaya_pendaftaran">Biaya Pendaftaran (Rp)</Label>
          <Input id="biaya_pendaftaran" type="number" min="0" {...form.register('biaya_pendaftaran')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="hadiah">Hadiah</Label>
          <Input id="hadiah" placeholder="Rp 5.000.000 + Sertifikat" {...form.register('hadiah')} />
        </div>

        {/* === PIC (Person In Charge) === */}
        <SectionLabel>PIC (Person In Charge)</SectionLabel>

        <div className="space-y-2">
          <Label htmlFor="pic_nama">Nama PIC</Label>
          <Input id="pic_nama" placeholder="Dr. Rini Widya" {...form.register('pic_nama')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pic_kontak">Kontak PIC</Label>
          <Input id="pic_kontak" placeholder="0812... atau email@..." {...form.register('pic_kontak')} />
        </div>

        {/* === URL === */}
        <SectionLabel>URL & Dokumen</SectionLabel>

        <div className="space-y-2">
          <Label htmlFor="url_pendaftaran">Registration URL</Label>
          <Input id="url_pendaftaran" type="url" placeholder="https://..." {...form.register('url_pendaftaran')} />
          {form.formState.errors.url_pendaftaran && (
            <p className="text-sm text-destructive">{form.formState.errors.url_pendaftaran.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="document_url">Document URL</Label>
          <Input id="document_url" type="url" placeholder="https://drive.google.com/.../guidebook" {...form.register('document_url')} />
          {form.formState.errors.document_url && (
            <p className="text-sm text-destructive">{form.formState.errors.document_url.message}</p>
          )}
        </div>

        {/* === TIM === */}
        <SectionLabel>Tim</SectionLabel>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="tim_id">Tim (opsional)</Label>
          <Select value={form.watch('tim_id') || 'none'} onValueChange={(v) => form.setValue('tim_id', v === 'none' ? '' : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih tim..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— Tanpa Tim —</SelectItem>
              {timList?.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.nama}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* === STATUS === */}
        <SectionLabel>Status</SectionLabel>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="status">Status Lomba</Label>
          <Select value={form.watch('status')} onValueChange={(v) => form.setValue('status', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_LOMBA).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="catatan">Catatan</Label>
          <Textarea id="catatan" rows={3} placeholder="Notes tambahan, requirement tim, dll..." {...form.register('catatan')} />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEdit ? 'Simpan Perubahan' : 'Buat Lomba'}
        </Button>
      </div>
    </form>
  )
}
