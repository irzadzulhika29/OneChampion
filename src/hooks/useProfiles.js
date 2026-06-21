import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

/**
 * List ALL profiles in the system (the "anggota bank").
 * Used for picking anggota when creating/editing tim.
 *
 * Note: In a real production app with multiple users, you'd want to restrict
 * this to profiles within the same organization/tenant. For personal use,
 * showing all profiles is acceptable.
 */
export function useAllProfiles() {
  return useQuery({
    queryKey: ['all-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, nim, prodi, no_hp, created_at')
        .order('full_name')
      if (error) throw error
      // Join with auth.users to get email — done client-side via /auth/admin would be unsafe;
      // use profiles.full_name + auth email from current session as needed.
      return data ?? []
    },
  })
}

/**
 * Update profile (only own profile allowed by RLS).
 */
export function useUpdateOwnProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...values }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(values)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-profiles'] })
    },
  })
}
