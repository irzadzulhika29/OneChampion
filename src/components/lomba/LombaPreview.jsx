import { Link } from 'react-router-dom'
import { Calendar, MapPin, Users, Award, FileText, Tag, UserCircle2, Phone, Mail, Trophy, ExternalLink } from 'lucide-react'
import { KATEGORI_LOMBA, formatDate, formatCurrency, cn } from '@/lib/utils'

/**
 * Read-only display of lomba fields. Used in LombaDetail preview mode.
 * Sections shown conditionally based on which fields have values.
 */
export default function LombaPreview({ lomba }) {
  if (!lomba) return null

  const isContact = (val) => /^[\d+\-()\s]+$/.test(val || '')
  const picWaLink = lomba.pic_kontak && isContact(lomba.pic_kontak)
    ? `https://wa.me/${lomba.pic_kontak.replace(/\D/g, '')}`
    : null
  const picMailLink = lomba.pic_kontak && lomba.pic_kontak.includes('@')
    ? `mailto:${lomba.pic_kontak}`
    : null

  return (
    <div className="space-y-4 text-sm">
      {/* === Info Utama === */}
      <Section title="Info Utama">
        <Row icon={Tag} label="Kategori" value={KATEGORI_LOMBA[lomba.kategori]} />
        {lomba.tim_id && (
          <Row
            icon={Users}
            label="Tim"
            value={
              <Link to={`/tim/${lomba.tim_id}`} className="text-primary hover:underline">
                {lomba.tim?.nama || 'Lihat tim'}
              </Link>
            }
          />
        )}
        {lomba.penyelenggara && (
          <Row icon={Tag} label="Penyelenggara" value={lomba.penyelenggara} />
        )}
        {lomba.hadiah && <Row icon={Award} label="Hadiah" value={lomba.hadiah} />}
        <Row icon={FileText} label="Biaya" value={formatCurrency(lomba.biaya_pendaftaran)} />
      </Section>

      {/* === Deadlines === */}
      {(lomba.deadline_pendaftaran || lomba.deadline_submission || lomba.tanggal_final) && (
        <Section title="Deadlines & Final">
          {lomba.deadline_pendaftaran && (
            <Row icon={Calendar} label="DL Register" value={formatDate(lomba.deadline_pendaftaran)} />
          )}
          {lomba.deadline_submission && (
            <Row icon={Calendar} label="DL Submission" value={formatDate(lomba.deadline_submission)} />
          )}
          {lomba.tanggal_final && (
            <Row icon={Trophy} label="Final" value={formatDate(lomba.tanggal_final)} />
          )}
        </Section>
      )}

      {/* === Lokasi === */}
      {(lomba.lokasi || lomba.online) && (
        <Section title="Lokasi">
          {lomba.lokasi && <Row icon={MapPin} label="Lokasi" value={lomba.lokasi} />}
          {lomba.online && <Row icon={ExternalLink} label="Mode" value="Online" />}
        </Section>
      )}

      {/* === PIC === */}
      {(lomba.pic_nama || lomba.pic_kontak) && (
        <Section title="PIC (Person In Charge)">
          {lomba.pic_nama && <Row icon={UserCircle2} label="Nama" value={lomba.pic_nama} />}
          {lomba.pic_kontak && (
            <Row
              icon={Phone}
              label="Kontak"
              value={
                <div className="flex items-center gap-2 flex-wrap">
                  <span>{lomba.pic_kontak}</span>
                  {picWaLink && (
                    <a href={picWaLink} target="_blank" rel="noreferrer" className="text-xs text-emerald-700 hover:underline">
                      WhatsApp
                    </a>
                  )}
                  {picMailLink && (
                    <a href={picMailLink} className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                      <Mail className="h-3 w-3" /> Email
                    </a>
                  )}
                </div>
              }
            />
          )}
        </Section>
      )}

      {/* === URL & Dokumen === */}
      {(lomba.url_pendaftaran || lomba.document_url) && (
        <Section title="URL & Dokumen">
          {lomba.url_pendaftaran && (
            <Row
              icon={ExternalLink}
              label="Registration URL"
              value={
                <a href={lomba.url_pendaftaran} target="_blank" rel="noreferrer" className="text-primary hover:underline break-all">
                  {lomba.url_pendaftaran}
                </a>
              }
            />
          )}
          {lomba.document_url && (
            <Row
              icon={FileText}
              label="Document URL"
              value={
                <a href={lomba.document_url} target="_blank" rel="noreferrer" className="text-primary hover:underline break-all">
                  {lomba.document_url}
                </a>
              }
            />
          )}
        </Section>
      )}

      {/* === Catatan === */}
      {lomba.catatan && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Catatan</p>
          <p className="text-muted-foreground whitespace-pre-wrap">{lomba.catatan}</p>
        </div>
      )}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{title}</p>
      <div className="space-y-2.5">{children}</div>
    </div>
  )
}

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="font-medium text-sm">{value || '—'}</div>
      </div>
    </div>
  )
}
