-- ============================================================================
-- OneChampion: pg_cron schedule for reminder edge function
-- ============================================================================
-- Run this AFTER deploying the send-reminder Edge Function.
-- Replace <project> with your Supabase project ref and <cron_token> with a
-- secure random token (also set as Supabase secret "CRON_TOKEN" if you choose
-- to verify the function via Authorization header).
-- ============================================================================

create extension if not exists pg_net;
create extension if not exists pg_cron;

-- Remove existing schedule (safe)
select cron.unschedule('send-reminders') where exists (
  select 1 from cron.job where jobname = 'send-reminders'
);

-- Run every hour at minute 0
select cron.schedule(
  'send-reminders',
  '0 * * * *',
  $$
  select
    net.http_post(
      url := 'https://<project>.supabase.co/functions/v1/send-reminder',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.cron_token', true)
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);
