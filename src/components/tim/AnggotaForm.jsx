import { useState, useRef, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { anggotaSchema } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { PERAN_ANGGOTA, cn } from '@/lib/utils'
import { useAddAnggota, useUpdateAnggota } from '@/hooks/useTim'
import { useAllProfiles } from '@/hooks/useProfiles'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { Loader2, Upload, Trash2, FileText, Download, Search, User } from 'lucide-react'

/**
 * AnggotaForm: pick an existing profile (from auth.users) and add to tim.
 * Identity (nama/email) is read from profiles, not entered manually.
 * Form fields: profile_id (picker), peran, ktm_url (optional upload).
 */
export default function AnggotaForm({ timId: timIdProp, initial, onSuccess, onCancel }) {
  const { toast } = useToast()
  const addAnggota = useAddAnggota()
  const updateAnggota = useUpdateAnggota()
  const { data: allProfiles } = useAllProfiles()
  const isEdit = !!initial
  const fileInputRef = useRef(null)
  const [ktmUploading, setKtmUploading] = useState(false)
  const [ktmFile, setKtmFile] = useState(null)
  const [ktmUrl, setKtmUrl] = useState(initial?.ktm_url || '')
  const [ktmRemoved, setKtmRemoved] = useState(false)
  const [profileSearch, setProfileSearch] = useState('')

  const form = useForm({
    resolver: zodResolver(anggotaSchema),
    defaultValues: initial
      ? {
          profile_id: initial.profile_id || '',
          peran: initial.peran || 'anggota',
          ktm_url: initial.ktm_url || '',
        }
      : { profile_id: '', peran: 'anggota', ktm_url: '' },
  })

  // sync ktm_url
  useEffect(() => {
    form.setValue('ktm_url', ktmRemoved ? '' : ktmUrl)
  }, [ktmUrl, ktmRemoved, form])

  const selectedProfileId = form.watch('profile_id')

  // Filter profiles: skip those already in this tim (unless editing this one)
  const availableProfiles = useMemo(() => {
    if (!allProfiles) return []
    // If editing: allow current selection, exclude others already in this tim
    if (isEdit) {
      return allProfiles // we don't have tim's existing members here; allow all for simplicity
    }
    // If creating: filter out profiles that already belong to a tim
    return allProfiles.filter((p) => !p.tim_id)
  }, [allProfiles, isEdit])

  const filteredProfiles = useMemo(() => {
    if (!profileSearch.trim()) return availableProfiles
    const q = profileSearch.toLowerCase()
    return availableProfiles.filter(
      (p) =>
        p.full_name?.toLowerCase().includes(q) ||
        p.nim?.toLowerCase().includes(q) ||
        p.prodi?.toLowerCase().includes(q)
    )
  }, [availableProfiles, profileSearch])

  const selectedProfile = useMemo(
    () => allProfiles?.find((p) => p.id === selectedProfileId),
    [allProfiles, selectedProfileId]
  )

  const initials = (name) =>
    (name || '?').split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase()).join('')

  const handleKtmPick = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.type.startsWith('image/') && f.type !== 'application/pdf') {
      toast({ variant: 'destructive', title: 'Hanya gambar/PDF', description: 'JPG/PNG/PDF.' })
      return
    }
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

  const uploadKtm = async () => {
    if (!ktmFile) return ktmUrl
    setKtmUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const safeName = ktmFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const path = `${user.id}/${timIdProp}/ktm-${Date.now()}-${safeName}`
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
      if (!timIdProp) {
        toast({ variant: 'destructive', title: 'Tim belum dipilih' })
        return
      }
      let uploadedUrl = values.ktm_url
      if (ktmFile) {
        uploadedUrl = await uploadKtm()
      }
      const payload = {
        profile_id: values.profile_id,
        tim_id: timIdProp,
        peran: values.peran,
        ktm_url: uploadedUrl || null,
      }

      if (isEdit) {
        await updateAnggota.mutateAsync({ id: initial.id, tim_id: timIdProp, ...payload })
        toast({ title: 'Anggota diperbarui' })
      } else {
        await addAnggota.mutateAsync(payload)
        toast({ title: 'Anggota ditambahkan' })
      }
      setKtmFile(null)
      setKtmRemoved(false)
      setKtmUrl(uploadedUrl || '')
      onSuccess?.()
      if (!isEdit) {
        form.reset({ profile_id: '', peran: 'anggota', ktm_url: '' })
        setProfileSearch('')
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
      {/* Profile picker */}
      <div className="space-y-2">
        <Label>Pilih Anggota *</Label>

        {/* Selected profile preview */}
        {selectedProfile && (
          <div className="flex items-center gap-3 p-3 rounded-md border bg-blue-50 border-blue-200">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm">
                {initials(selectedProfile.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{selectedProfile.full_name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {selectedProfile.nim && `${selectedProfile.nim} · `}
                {selectedProfile.prodi || 'Profil belum lengkap'}
              </p>
            </div>
            {!isEdit && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => form.setValue('profile_id', '')}
              >
                Ganti
              </Button>
            )}
          </div>
        )}

        {/* Search + list (only when not editing OR no selection) */}
        {!selectedProfile && (
          <>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama / NIM / prodi..."
                value={profileSearch}
                onChange={(e) => setProfileSearch(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
            {filteredProfiles.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4 border rounded bg-muted/20">
                {allProfiles?.length === 0
                  ? 'Belum ada user yang terdaftar di sistem.'
                  : 'Semua user sudah masuk tim.'}
              </p>
            ) : (
              <div className="max-h-48 overflow-y-auto border rounded divide-y">
                {filteredProfiles.slice(0, 30).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => form.setValue('profile_id', p.id)}
                    className="w-full flex items-center gap-2 p-2 text-left hover:bg-muted/40 transition-colors"
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs">
                        {initials(p.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{p.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {p.nim && `${p.nim} · `}
                        {p.prodi || '—'}
                      </p>
                    </div>
                    {p.tim_id && (
                      <Badge variant="secondary" className="text-xs shrink-0">
                        sudah di tim
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
        {form.formState.errors.profile_id && (
          <p className="text-sm text-destructive">{form.formState.errors.profile_id.message}</p>
        )}
      </div>

      {/* Peran */}
      <div className="space-y-2">
        <Label>Peran *</Label>
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

      {/* KTM Upload */}
      <div className="space-y-2">
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

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
        )}
        <Button type="submit" disabled={isLoading || !selectedProfileId}>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEdit ? 'Simpan' : 'Tambah'}
        </Button>
      </div>
    </form>
  )
}
