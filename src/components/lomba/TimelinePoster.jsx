import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { Upload, Trash2, Loader2, ImageIcon, ExternalLink } from 'lucide-react'

/**
 * Single-image upload for lomba timeline poster.
 * Stores file at `{user_id}/{lombaId}/timeline-{timestamp}-{name}` in bucket `lampiran`.
 *
 * Props:
 *  - lombaId: current lomba id (use a stable temp id like 'new' for create flow)
 *  - value: current storage_path (string or null)
 *  - onChange: (newPath|null) => void
 *  - disabled: disable upload (e.g. while submitting)
 */
export default function TimelinePoster({ lombaId = 'new', value, onChange, disabled }) {
  const { toast } = useToast()
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)

  const handlePick = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.type.startsWith('image/')) {
      toast({ variant: 'destructive', title: 'Hanya file gambar', description: 'Upload poster harus JPG/PNG/WebP.' })
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'File terlalu besar', description: 'Maks 10MB' })
      return
    }
    uploadFile(f)
  }

  const uploadFile = async (file) => {
    setUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const path = `${user.id}/${lombaId}/timeline-${Date.now()}-${safeName}`
      const { error } = await supabase.storage
        .from('lampiran')
        .upload(path, file, { contentType: file.type, upsert: false })
      if (error) throw error

      // Show local preview immediately
      const reader = new FileReader()
      reader.onload = () => setPreviewUrl(reader.result)
      reader.readAsDataURL(file)

      onChange?.(path)
      toast({ title: 'Poster timeline diupload' })
    } catch (err) {
      toast({ variant: 'destructive', title: 'Upload gagal', description: err.message })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemove = () => {
    onChange?.(null)
    setPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleView = async () => {
    if (!value) return
    try {
      const { data, error } = await supabase.storage
        .from('lampiran')
        .createSignedUrl(value, 3600)
      if (error) throw error
      window.open(data.signedUrl, '_blank')
    } catch (err) {
      toast({ variant: 'destructive', title: 'Gagal membuka poster', description: err.message })
    }
  }

  const hasFile = !!value || !!previewUrl
  const displayUrl = previewUrl // local preview takes precedence over storage

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePick}
      />
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || disabled}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {hasFile ? 'Ganti Poster' : 'Upload Poster Timeline'}
        </Button>
        {value && !uploading && (
          <Button type="button" variant="ghost" size="sm" onClick={handleView}>
            <ExternalLink className="h-4 w-4" /> Lihat
          </Button>
        )}
        {hasFile && (
          <Button type="button" variant="ghost" size="sm" onClick={handleRemove} disabled={disabled}>
            <Trash2 className="h-4 w-4 text-destructive" /> Hapus
          </Button>
        )}
      </div>
      {displayUrl ? (
        <div className="mt-2 rounded-md border bg-muted/30 p-2 inline-block">
          <img
            src={displayUrl}
            alt="Timeline poster"
            className="max-h-64 max-w-full rounded object-contain"
          />
        </div>
      ) : (
        <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
          <ImageIcon className="h-3 w-3" /> JPG/PNG/WebP, maks 10MB. Menampilkan timeline lomba dalam bentuk poster.
        </p>
      )}
    </div>
  )
}

/**
 * Display-only: render an existing timeline poster by storage_path.
 */
export function TimelinePosterView({ storagePath, className }) {
  const [url, setUrl] = useState(null)
  const [loading, setLoading] = useState(false)

  const loadUrl = async () => {
    if (!storagePath || url) return
    setLoading(true)
    try {
      const { data, error } = await supabase.storage
        .from('lampiran')
        .createSignedUrl(storagePath, 3600)
      if (error) throw error
      setUrl(data.signedUrl)
    } catch (e) {
      console.error('timeline view load failed', e)
    } finally {
      setLoading(false)
    }
  }

  // Lazy load when path becomes available
  if (storagePath && !url && !loading) {
    loadUrl()
  }

  if (!storagePath) return null

  if (loading) {
    return (
      <div className={cn('rounded-md border bg-muted/30 p-6 text-center text-xs text-muted-foreground', className)}>
        Memuat poster...
      </div>
    )
  }

  if (!url) {
    return (
      <div className={cn('rounded-md border bg-muted/30 p-6 text-center text-xs text-muted-foreground', className)}>
        Poster tidak tersedia
      </div>
    )
  }

  return (
    <a href={url} target="_blank" rel="noreferrer" className={cn('inline-block', className)}>
      <img
        src={url}
        alt="Timeline poster"
        className="max-h-96 max-w-full rounded-md border bg-muted/30 object-contain hover:opacity-95"
      />
    </a>
  )
}
