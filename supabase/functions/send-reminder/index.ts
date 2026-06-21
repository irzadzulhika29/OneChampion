// Supabase Edge Function: send-reminder
// Triggered hourly by pg_cron. Sends email + push notifications for due reminders.
//
// Required env vars (set via `supabase secrets set`):
//   - RESEND_API_KEY
//   - VAPID_PUBLIC_KEY
//   - VAPID_PRIVATE_KEY
//   - VAPID_SUBJECT (mailto:you@example.com)
//
// Deploy: supabase functions deploy send-reminder
// Schedule (run in SQL editor after migration):
//   select cron.schedule('send-reminders', '0 * * * *',
//     $$ select net.http_post(
//          url:='https://<project>.supabase.co/functions/v1/send-reminder',
//          headers:=jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.cron_token'))
//        ) $$);

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import webpush from 'https://esm.sh/web-push@3.6.7'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@example.com'

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Fetch due reminders with lomba + user info
    const { data: reminders, error } = await supabase
      .from('reminders')
      .select(`
        id,
        channel,
        fire_at,
        lomba:lomba_id (
          id, judul, tanggal_mulai, deadline_pendaftaran,
          owner_id
        )
      `)
      .eq('sent', false)
      .lte('fire_at', new Date().toISOString())
      .limit(100)

    if (error) throw error
    if (!reminders || reminders.length === 0) {
      return new Response(JSON.stringify({ ok: true, processed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const processed = []
    for (const r of reminders) {
      const lomba = r.lomba
      if (!lomba) continue

      // Get user email from auth (service role can do this)
      const { data: user } = await supabase.auth.admin.getUserById(lomba.owner_id)
      if (!user?.user?.email) continue

      const target = r.fire_at > lomba.tanggal_mulai ? 'pendaftaran' : 'pelaksanaan'
      const fireDate = new Date(r.fire_at)
      const eventDate = r.fire_at > lomba.tanggal_mulai ? lomba.tanggal_mulai : lomba.deadline_pendaftaran || lomba.tanggal_mulai
      const daysAway = Math.ceil((new Date(eventDate).getTime() - fireDate.getTime()) / (1000 * 60 * 60 * 24))
      const subject = `⏰ Reminder: ${lomba.judul} (${daysAway} hari lagi)`
      const body = `Hai!\n\nLomba "${lomba.judul}" ${target === 'pendaftaran' ? 'deadline pendaftarannya' : 'akan dimulai'} dalam ${daysAway} hari (${eventDate}).\n\nJangan lupa persiapkan diri Anda!\n\n— OneChampion`

      let success = false

      if (r.channel === 'email' && RESEND_API_KEY) {
        try {
          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'OneChampion <noreply@onechampion.app>',
              to: [user.user.email],
              subject,
              text: body,
            }),
          })
          success = res.ok
        } catch (e) {
          console.error('email error', e)
        }
      } else if (r.channel === 'push' && VAPID_PUBLIC_KEY) {
        try {
          const { data: subs } = await supabase
            .from('push_subscriptions')
            .select('*')
            .eq('user_id', lomba.owner_id)
          if (subs) {
            for (const s of subs) {
              await webpush.sendNotification(
                {
                  endpoint: s.endpoint,
                  keys: { p256dh: s.p256dh, auth: s.auth },
                },
                JSON.stringify({ title: subject, body })
              )
            }
            success = subs.length > 0
          }
        } catch (e) {
          console.error('push error', e)
        }
      }

      // Mark as sent
      await supabase
        .from('reminders')
        .update({ sent: true, sent_at: new Date().toISOString() })
        .eq('id', r.id)

      processed.push({ id: r.id, channel: r.channel, success })
    }

    return new Response(JSON.stringify({ ok: true, processed: processed.length, details: processed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
