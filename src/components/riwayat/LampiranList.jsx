import { useState, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { Upload, FileText, Download, Trash2, Loader2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function LampiranList({ lombaId, hasilId, lampiran = [] }) {
  const { toast } = useToast()
  const qc = useQueryClient()
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 20 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'File terlalu besar', description: 'Maks 20MB' })
      return
    }
    setUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const path = `${user.id}/${lombaId}/${Date.now()}-${file.name}`
      const { error: upErr } = await supabase.storage
        .from('lampiran')
        .upload(path, file, { contentType: file.type, upsert: false })
      if (upErr) throw upErr

      const { error: metaErr } = await supabase.from('lampiran').insert({
        lomba_id: hasilId ? null : lombaId,
        hasil_id: hasilId || null,
        nama: file.name,
        storage_path: path,
        mime_type: file.type,
        ukuran: file.size,
      })
      if (metaErr) throw metaErr

      qc.invalidateQueries({ queryKey: ['lomba', lombaId] })
      toast({ title: 'File diupload' })
    } catch (err) {
      toast({ variant: 'destructive', title: 'Upload gagal', description: err.message })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDelete = async (item) => {
    if (!confirm(`Hapus lampiran "${item.nama}"?`)) return
    try {
      const { error: storageErr } = await supabase.storage
        .from('lampiran')
        .remove([item.storage_path])
      if (storageErr) throw storageErr
      const { error: metaErr } = await supabase.from('lampiran').delete().eq('id', item.id)
      if (metaErr) throw metaErr
      qc.invalidateQueries({ queryKey: ['lomba', lombaId] })
      toast({ title: 'Lampiran dihapus' })
    } catch (err) {
      toast({ variant: 'destructive', title: 'Gagal', description: err.message })
    }
  }

  const handleDownload = async (item) => {
    try {
      const { data, error } = await supabase.storage
        .from('lampiran')
        .createSignedUrl(item.storage_path, 3600)
      if (error) throw error
      window.open(data.signedUrl, '_blank')
    } catch (err) {
      toast({ variant: 'destructive', title: 'Gagal', description: err.message })
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleUpload}
          accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.zip"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Upload File
        </Button>
        <span className="text-xs text-muted-foreground">Maks 20MB. PDF / gambar / dokumen.</span>
      </div>

      {lampiran.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">Belum ada lampiran.</p>
      ) : (
        <ul className="space-y-2">
          {lampiran.map((l) => (
            <li
              key={l.id}
              className="flex items-center gap-3 p-3 rounded-md border bg-card hover:bg-muted/30"
            >
              <div className="bg-primary/10 text-primary rounded p-2 shrink-0">
                <FileText className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate text-sm">{l.nama}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(l.uploaded_at, { day: '2-digit', month: 'short', year: 'numeric' })}
                  {l.ukuran && ` • ${(l.ukuran / 1024).toFixed(0)} KB`}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleDownload(l)} aria-label="Download">
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(l)} aria-label="Hapus">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
