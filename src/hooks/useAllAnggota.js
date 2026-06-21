import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

/**
 * "All anggota" view — now based on profiles (auth users), not anggota_tim rows.
 * Shows every profile in the system with their current tim membership (if any).
 *
 * Use case: pick existing profiles to add to a tim. Source of truth = profiles.
 */
export function useAllAnggota() {
  return useQuery({
    queryKey: ['all-anggota'],
    queryFn: async () => {
      // Get all profiles
      const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, nim, prodi, no_hp, created_at')
        .order('full_name')
      if (pErr) throw pErr

      // Get all anggota_tim rows to know which tim each profile is in
      const { data: memberships, error: mErr } = await supabase
        .from('anggota_tim')
        .select('id, tim_id, profile_id, peran, ktm_url')
      if (mErr) throw mErr

      // Build tim_id -> tim name map for display
      const { data: timList, error: tErr } = await supabase
        .from('tim')
        .select('id, nama')
      if (tErr) throw tErr
      const timMap = new Map((timList || []).map((t) => [t.id, t]))

      // Annotate profiles with their tim membership
      return (profiles || []).map((p) => {
        const membership = (memberships || []).find((m) => m.profile_id === p.id)
        return {
          ...p,
          tim_id: membership?.tim_id || null,
          tim_nama: membership?.tim_id ? (timMap.get(membership.tim_id)?.nama || '—') : null,
          tim: membership?.tim_id ? timMap.get(membership.tim_id) || null : null,
          // keep these for backwards-compat with kode lama
          nama: p.full_name,
          peran: membership?.peran || 'anggota',
          ktm_url: membership?.ktm_url || null,
          anggota_tim_id: membership?.id || null,
        }
      })
    },
  })
}
