# Deployment Guide

## 1. Setup Supabase

1. **Buat project baru** di [supabase.com](https://supabase.com/dashboard)

2. **Jalankan migration SQL**:
   - Buka SQL Editor di Supabase Dashboard
   - Copy paste isi `supabase/migrations/0001_init.sql`
   - Klik "Run"

3. **Buat storage bucket**:
   - Buka Storage > New bucket
   - Name: `lampiran`
   - Public: **off** (private)
   - File size limit: 20 MB

4. **Setup Google OAuth** (opsional):
   - Authentication > Providers > Google
   - Ikuti instruksi untuk setup Google Cloud Console
   - Tambahkan Authorized redirect URI: `https://<project>.supabase.co/auth/v1/callback`

5. **Dapatkan credentials**:
   - Settings > API
   - Copy `URL` dan `anon public` key

## 2. Setup Environment Variables Lokal

Buat file `.env.local`:
```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-public-key>
VITE_VAPID_PUBLIC_KEY=<generate-from-step-4>
```

## 3. Jalankan Lokal

```bash
npm install
npm run dev
```

Buka http://localhost:5173

## 4. Setup Web Push (VAPID)

Generate VAPID keys:
```bash
npx web-push generate-vapid-keys
```

Output:
- Public Key → `VITE_VAPID_PUBLIC_KEY` (di Vercel)
- Private Key → `VAPID_PRIVATE_KEY` (di Supabase Edge Function secrets)

Set Supabase secrets:
```bash
supabase secrets set VAPID_PUBLIC_KEY=<public-key>
supabase secrets set VAPID_PRIVATE_KEY=<private-key>
supabase secrets set VAPID_SUBJECT=mailto:you@example.com
supabase secrets set RESEND_API_KEY=<your-resend-api-key>
```

## 5. Deploy Edge Function

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref <project-ref>

# Deploy function
supabase functions deploy send-reminder
```

## 6. Setup Cron Job

Di Supabase SQL Editor, jalankan:

```sql
-- Enable pg_cron extension
create extension if not exists pg_cron;

-- Schedule the reminder function to run every hour
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
      )
    ) as request_id;
  $$
);
```

## 7. Deploy ke Vercel

1. **Push ke GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/<user>/onechampion.git
   git push -u origin main
   ```

2. **Import di Vercel**:
   - Buka [vercel.com/new](https://vercel.com/new)
   - Import repo
   - Framework: Vite (auto-detected)
   - Tambahkan Environment Variables:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
     - `VITE_VAPID_PUBLIC_KEY`

3. **Deploy** - klik Deploy, tunggu selesai.

4. **Tambahkan domain ke Supabase Auth**:
   - Authentication > URL Configuration
   - Site URL: `https://<your-app>.vercel.app`
   - Additional Redirect URLs: `https://<your-app>.vercel.app`

5. **Test** - buka URL Vercel, register, dan coba fitur reminder.

## 8. Generate PWA Icons

Lihat `public/README-icons.md` untuk instruksi generate icon dari `favicon.svg`.

## Checklist Production

- [ ] Supabase project created
- [ ] Migration SQL applied
- [ ] Storage bucket `lampiran` created (private)
- [ ] Google OAuth configured (jika dipakai)
- [ ] VAPID keys generated
- [ ] Edge function deployed
- [ ] Cron job scheduled
- [ ] GitHub repo created
- [ ] Vercel project created with env vars
- [ ] Supabase Auth redirect URL updated
- [ ] PWA icons generated
- [ ] Test register, login, CRUD lomba, upload file
- [ ] Test reminder (set lomba dengan deadline dekat)
- [ ] Test push notification (grant permission)
- [ ] Lighthouse PWA score ≥ 90
- [ ] Mobile responsive test (Chrome DevTools)
