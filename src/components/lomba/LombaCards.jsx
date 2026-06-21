import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, MapPin, Users, ExternalLink, UserCircle2, Trophy, FileText, Image as ImageIcon } from 'lucide-react'
import { STATUS_LOMBA, KATEGORI_LOMBA, formatDate, cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

function PosterThumb({ storagePath }) {
  const [url, setUrl] = useState(null)
  useEffect(() => {
    let active = true
    if (!storagePath) { setUrl(null); return }
    supabase.storage
      .from('lampiran')
      .createSignedUrl(storagePath, 3600)
      .then(({ data }) => { if (active) setUrl(data?.signedUrl || null) })
      .catch(() => { if (active) setUrl(null) })
    return () => { active = false }
  }, [storagePath])
  if (!url) return null
  return (
    <div className="mb-2 rounded overflow-hidden border bg-muted/30">
      <img src={url} alt="Timeline" className="w-full h-32 object-cover" />
    </div>
  )
}

/**
 * Mobile card list view for lomba. Same data as LombaTable, different layout.
 */
export default function LombaCards({ data }) {
  if (!data || data.length === 0) return null
  return (
    <div className="md:hidden space-y-3">
      {data.map((l) => {
        const status = STATUS_LOMBA[l.status]
        return (
          <Card key={l.id} className="hover:shadow-sm transition-shadow overflow-hidden">
            <PosterThumb storagePath={l.timeline_image_url} />
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <Link to={`/lomba/${l.id}`} className="font-semibold text-primary hover:underline line-clamp-2">
                  {l.judul}
                </Link>
                <span className={cn('text-xs px-2 py-0.5 rounded-full border whitespace-nowrap', status?.class)}>
                  {status?.label}
                </span>
              </div>
              {l.penyelenggara && (
                <p className="text-xs text-muted-foreground mb-2">oleh {l.penyelenggara}</p>
              )}
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs mb-3">
                {l.tanggal_final && (
                  <div className="flex items-center gap-1 text-emerald-700">
                    <Trophy className="h-3 w-3" />
                    <span>Final: {formatDate(l.tanggal_final, { day: '2-digit', month: 'short' })}</span>
                  </div>
                )}
                {l.deadline_pendaftaran && (
                  <div className="flex items-center gap-1 text-amber-700">
                    <FileText className="h-3 w-3" />
                    <span>DL: {formatDate(l.deadline_pendaftaran, { day: '2-digit', month: 'short' })}</span>
                  </div>
                )}
                {l.deadline_submission && (
                  <div className="flex items-center gap-1 text-orange-700">
                    <FileText className="h-3 w-3" />
                    <span>Submit: {formatDate(l.deadline_submission, { day: '2-digit', month: 'short' })}</span>
                  </div>
                )}
                {l.pic_nama && (
                  <div className="flex items-center gap-1 col-span-2 truncate">
                    <UserCircle2 className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="truncate">PIC: {l.pic_nama}</span>
                  </div>
                )}
                {l.lokasi && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span>{l.online ? 'Online' : l.lokasi}</span>
                  </div>
                )}
                {l.tim?.nama && (
                  <div className="flex items-center gap-1 truncate">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <span className="truncate">{l.tim.nama}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-xs">
                    {KATEGORI_LOMBA[l.kategori]}
                  </Badge>
                  {l.timeline_image_url && (
                    <span className="text-[10px] text-muted-foreground inline-flex items-center gap-0.5">
                      <ImageIcon className="h-3 w-3" /> poster
                    </span>
                  )}
                </div>
                <Link to={`/lomba/${l.id}`} className="text-xs text-primary flex items-center gap-1 hover:underline">
                  Detail <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
