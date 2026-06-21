import { supabase } from '@/lib/supabase'

/**
 * Build reminder rows for a lomba.
 * Schedules H-7 and H-1 email/push reminders for:
 *   - tanggal_mulai (event start)
 *   - deadline_pendaftaran (if set)
 *
 * Returns only future reminders.
 */
export function buildRemindersForLomba(lomba) {
  if (!lomba) return []
  const reminders = []
  const targets = []

  if (lomba.deadline_pendaftaran) {
    targets.push({ date: lomba.deadline_pendaftaran, type: 'deadline' })
  }
  if (lomba.tanggal_mulai) {
    targets.push({ date: lomba.tanggal_mulai, type: 'mulai' })
  }

  for (const t of targets) {
    for (const offsetDays of [7, 1]) {
      const fire = new Date(t.date)
      fire.setDate(fire.getDate() - offsetDays)
      // Set to 09:00 local
      fire.setHours(9, 0, 0, 0)
      if (fire > new Date()) {
        reminders.push({
          lomba_id: lomba.id,
          fire_at: fire.toISOString(),
          channel: 'email',
        })
        reminders.push({
          lomba_id: lomba.id,
          fire_at: fire.toISOString(),
          channel: 'push',
        })
      }
    }
  }
  return reminders
}

export async function deleteRemindersForLomba(lombaId) {
  await supabase.from('reminders').delete().eq('lomba_id', lombaId).eq('sent', false)
}
