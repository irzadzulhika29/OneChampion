import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { buildRemindersForLomba, deleteRemindersForLomba } from '@/lib/reminders'

/**
 * List lomba with filters.
 */
export function useLombaList(filters = {}) {
  return useQuery({
    queryKey: ['lomba', filters],
    queryFn: async () => {
      let q = supabase
        .from('lomba')
        .select('*, tim(nama), hasil(*)')
        .order('tanggal_mulai', { ascending: false })
      if (filters.status && filters.status !== 'all') {
        q = q.eq('status', filters.status)
      }
      if (filters.kategori && filters.kategori !== 'all') {
        q = q.eq('kategori', filters.kategori)
      }
      if (filters.search) {
        q = q.or(`judul.ilike.%${filters.search}%,penyelenggara.ilike.%${filters.search}%`)
      }
      const { data, error } = await q
      if (error) throw error
      // Normalize nested 1-to-1 embeds: PostgREST may return object instead of array
      const rows = data ?? []
      return rows.map((row) => {
        if (row.hasil && !Array.isArray(row.hasil)) row.hasil = [row.hasil]
        if (row.tim && !Array.isArray(row.tim)) row.tim = [row.tim]
        return row
      })
    },
  })
}

/**
 * Single lomba with tim, hasil, lampiran.
 */
export function useLombaDetail(id) {
  return useQuery({
    queryKey: ['lomba', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lomba')
        .select('*, tim(nama,deskripsi), hasil(*), lampiran(*)')
        .eq('id', id)
        .single()
      if (error) throw error
      // Normalize embedded relations: PostgREST sometimes returns
      // single related row as object (1-to-1) instead of array.
      // Coerce to array so consumer code is consistent.
      if (data) {
        if (data.hasil && !Array.isArray(data.hasil)) data.hasil = [data.hasil]
        if (data.lampiran && !Array.isArray(data.lampiran)) data.lampiran = [data.lampiran]
        if (data.tim && !Array.isArray(data.tim)) data.tim = [data.tim]
      }
      return data
    },
  })
}

/**
 * Lomba by month (for calendar).
 * Primary date for calendar = `tanggal_final` (when set).
 * Falls back to `deadline_submission`, then `deadline_pendaftaran`, then `tanggal_mulai`.
 * Server-side: fetch all upcoming/deadline windows in range; client filters by effective date.
 */
export function useLombaInRange(start, end) {
  return useQuery({
    queryKey: ['lomba', 'range', start, end],
    enabled: !!start && !!end,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lomba')
        .select('id, judul, kategori, status, tanggal_mulai, tanggal_selesai, tanggal_final, deadline_pendaftaran, deadline_submission')
        .or(
          // tanggal_final in range
          `and(tanggal_final.gte.${start},tanggal_final.lte.${end}),` +
          // submission deadline in range
          `and(deadline_submission.gte.${start},deadline_submission.lte.${end}),` +
          // register deadline in range
          `and(deadline_pendaftaran.gte.${start},deadline_pendaftaran.lte.${end}),` +
          // legacy tanggal_mulai range overlap
          `and(tanggal_mulai.gte.${start},tanggal_mulai.lte.${end}),` +
          `and(tanggal_selesai.gte.${start},tanggal_selesai.lte.${end})`
        )
        .order('tanggal_final', { ascending: true, nullsFirst: false })
      if (error) throw error
      // Pick the effective event date per lomba
      return (data ?? []).map((l) => ({
        ...l,
        effective_date: l.tanggal_final || l.deadline_submission || l.deadline_pendaftaran || l.tanggal_mulai || null,
      }))
    },
  })
}

/**
 * Create lomba + auto-generate reminders.
 */
export function useCreateLomba() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values) => {
      const { data, error } = await supabase
        .from('lomba')
        .insert(values)
        .select()
        .single()
      if (error) throw error
      // generate reminders
      const reminders = buildRemindersForLomba(data)
      if (reminders.length > 0) {
        await supabase.from('reminders').insert(reminders)
      }
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lomba'] })
    },
  })
}

/**
 * Update lomba. Also refreshes reminders.
 */
export function useUpdateLomba() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...values }) => {
      const { data, error } = await supabase
        .from('lomba')
        .update(values)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      // regenerate reminders
      await deleteRemindersForLomba(id)
      const reminders = buildRemindersForLomba(data)
      if (reminders.length > 0) {
        await supabase.from('reminders').insert(reminders)
      }
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['lomba'] })
      qc.invalidateQueries({ queryKey: ['lomba', data.id] })
    },
  })
}

/**
 * Quick status update (e.g. from table dropdown).
 */
export function useUpdateLombaStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }) => {
      const { data, error } = await supabase
        .from('lomba')
        .update({ status })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['lomba'] })
      qc.invalidateQueries({ queryKey: ['lomba', data.id] })
    },
  })
}

/**
 * Delete lomba.
 */
export function useDeleteLomba() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      await deleteRemindersForLomba(id)
      const { error } = await supabase.from('lomba').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lomba'] })
    },
  })
}
