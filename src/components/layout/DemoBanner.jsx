import { isDemoMode } from '@/lib/supabase'
import { resetMockData } from '@/lib/mockSupabase'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { AlertTriangle, Database, RefreshCw, Info } from 'lucide-react'

export default function DemoBanner() {
  const [open, setOpen] = useState(false)
  const qc = useQueryClient()
  const { toast } = useToast()

  if (!isDemoMode) return null

  const handleReset = () => {
    if (!confirm('Reset semua data demo? Ini akan menghapus localStorage dan memuat ulang halaman.')) return
    resetMockData()
    qc.clear()
    toast({ title: 'Data demo direset' })
    setTimeout(() => window.location.reload(), 500)
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200 text-amber-900">
      <div className="px-4 py-2 flex items-center gap-2 text-sm">
        <Database className="h-4 w-4 shrink-0" />
        <span className="font-medium">Mode Demo</span>
        <span className="hidden sm:inline text-amber-800">— data disimpan di browser (localStorage), bukan Supabase.</span>
        <div className="ml-auto flex items-center gap-1">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-amber-900 hover:bg-amber-100">
                <Info className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-medium text-sm">Mode Demo</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Supabase env belum dikonfigurasi. Semua data lomba, tim, hasil, dan lampiran disimpan di browser ini saja.
                    </p>
                  </div>
                </div>
                <div className="text-xs space-y-1.5 text-muted-foreground border-t pt-2">
                  <p><strong>Untuk menghubungkan Supabase:</strong></p>
                  <ol className="list-decimal list-inside space-y-0.5 pl-1">
                    <li>Buat project di supabase.com</li>
                    <li>Salin URL & anon key</li>
                    <li>Buat file <code className="bg-muted px-1 rounded">.env.local</code>:</li>
                  </ol>
                  <pre className="bg-muted p-2 rounded text-[10px] mt-1 overflow-x-auto">
{`VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...`}
                  </pre>
                  <p className="text-[10px]">Restart dev server setelah setup.</p>
                </div>
                <Button size="sm" variant="outline" className="w-full" onClick={handleReset}>
                  <RefreshCw className="h-3.5 w-3.5" /> Reset Data Demo
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  )
}
