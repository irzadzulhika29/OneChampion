import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

/**
 * List tim (teams) for current user.
 * Embeds anggota_tim with profile (nama, email) for display.
 */
export function useTim() {
  return useQuery({
    queryKey: ['tim'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tim')
        .select('*, anggota_tim(count)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })
}

/**
 * Single tim with full anggota list (each linked to a profile).
 */
export function useTimDetail(id) {
  return useQuery({
    queryKey: ['tim', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tim')
        .select(`
          *,
          anggota_tim(
            id,
            tim_id,
            profile_id,
            peran,
            ktm_url,
            created_at,
            profile:profiles(id, full_name, avatar_url, nim, prodi, no_hp)
          )
        `)
        .eq('id', id)
        .single()
      if (error) throw error
      // Normalize anggota_tim if it comes back as object instead of array
      if (data?.anggota_tim && !Array.isArray(data.anggota_tim)) {
        data.anggota_tim = [data.anggota_tim]
      }
      return data
    },
  })
}

/**
 * Create tim.
 */
export function useCreateTim() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values) => {
      const { data, error } = await supabase
        .from('tim')
        .insert(values)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tim'] }),
  })
}

/**
 * Update tim.
 */
export function useUpdateTim() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...values }) => {
      const { data, error } = await supabase
        .from('tim')
        .update(values)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['tim'] })
      qc.invalidateQueries({ queryKey: ['tim', data.id] })
    },
  })
}

/**
 * Delete tim.
 */
export function useDeleteTim() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('tim').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tim'] })
      qc.invalidateQueries({ queryKey: ['lomba'] })
    },
  })
}

/**
 * Add anggota (profile) to a tim.
 * Just inserts a row linking profile_id to tim_id with a role.
 */
export function useAddAnggota() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values) => {
      const { data, error } = await supabase
        .from('anggota_tim')
        .insert(values)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['tim', data.tim_id] })
      qc.invalidateQueries({ queryKey: ['tim'] })
    },
  })
}

/**
 * Update anggota (peran, ktm_url).
 */
export function useUpdateAnggota() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, tim_id, ...values }) => {
      const { data, error } = await supabase
        .from('anggota_tim')
        .update(values)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return { ...data, tim_id }
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['tim', data.tim_id] })
    },
  })
}

/**
 * Delete anggota (remove from tim — does not delete the profile).
 */
export function useDeleteAnggota() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, tim_id }) => {
      const { error } = await supabase.from('anggota_tim').delete().eq('id', id)
      if (error) throw error
      return { id, tim_id }
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['tim', data.tim_id] })
    },
  })
}
