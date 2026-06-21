import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

/**
 * List tim (teams) for current user.
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
 * Single tim with anggota.
 */
export function useTimDetail(id) {
  return useQuery({
    queryKey: ['tim', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tim')
        .select('*, anggota_tim(*)')
        .eq('id', id)
        .single()
      if (error) throw error
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
 * Add anggota to a tim.
 * Accepts either a partial anggota object (with tim_id) OR
 *   { tim_id, anggota_id_to_link } to COPY an existing anggota row into this tim.
 */
export function useAddAnggota() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values) => {
      // If "link existing" mode: read source row then insert a copy into the target tim.
      if (values.anggota_id_to_link && !values.nama) {
        const { data: src, error: srcErr } = await supabase
          .from('anggota_tim')
          .select('*')
          .eq('id', values.anggota_id_to_link)
          .single()
        if (srcErr) throw srcErr
        const { id, created_at, tim_id, ...copy } = src
        const { data, error } = await supabase
          .from('anggota_tim')
          .insert({ ...copy, tim_id: values.tim_id })
          .select()
          .single()
        if (error) throw error
        return data
      }
      // Normal insert
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
      qc.invalidateQueries({ queryKey: ['all-anggota'] })
    },
  })
}

/**
 * Update anggota.
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
 * Delete anggota.
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
