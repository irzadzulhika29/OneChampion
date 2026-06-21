import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

/**
 * Flatten all anggota across all tim owned by the user.
 * Returns anggota joined with tim info (id, nama).
 */
export function useAllAnggota() {
  return useQuery({
    queryKey: ['all-anggota'],
    queryFn: async () => {
      // Fetch tim owned by user (RLS in real supabase)
      const { data: timData, error: timErr } = await supabase
        .from('tim')
        .select('id, nama')
      if (timErr) throw timErr

      const timMap = new Map((timData || []).map((t) => [t.id, t]))

      // Fetch all anggota. RLS in real Supabase will already restrict to user's tim.
      const { data: anggotaData, error: aErr } = await supabase
        .from('anggota_tim')
        .select('*')
        .order('nama')
      if (aErr) throw aErr

      // For mock mode (no RLS), filter manually
      const timIds = new Set(timMap.keys())
      return (anggotaData || [])
        .filter((a) => timIds.has(a.tim_id))
        .map((a) => {
          const t = timMap.get(a.tim_id)
          return {
            ...a,
            tim_id: a.tim_id,
            tim_nama: t?.nama || '—',
            tim: t,
          }
        })
    },
  })
}
