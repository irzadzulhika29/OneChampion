# SabiJuara

Website manajemen lomba pribadi untuk mengelola kompetisi IT/Tech (programming, design, hackathon, data science, dll) yang Anda ikuti.

## Stack

- **Frontend:** React 18 + Vite + Tailwind + shadcn/ui
- **Backend:** Supabase (Postgres + Auth + Storage + Edge Functions)
- **Data fetching:** TanStack Query
- **Forms:** react-hook-form + Zod
- **PWA:** vite-plugin-pwa + Web Push
- **Deployment:** Vercel

## Fitur

- ✅ Autentikasi (email/password + Google OAuth)
- 📋 Tabel lomba (sort, filter, search)
- 📅 Kalender lomba (month view)
- 👥 Manajemen tim & anggota
- 🏆 Riwayat & hasil (upload sertifikat)
- 🔔 Reminder email (H-7, H-1) + Push notification
- 📱 Responsive (PWA installable)

## Setup Lokal

1. **Clone & install**
   ```bash
   git clone <repo>
   cd SabiJuara
   npm install
   ```

2. **Setup Supabase**
   - Buat project baru di [supabase.com](https://supabase.com)
   - Copy URL dan anon key ke `.env.local`
   - Jalankan migration SQL (lihat `supabase/migrations/0001_init.sql`)

3. **Run dev server**
   ```bash
   npm run dev
   ```
   Buka http://localhost:5173

## Deployment

Lihat [DEPLOYMENT.md](./DEPLOYMENT.md) untuk langkah deploy ke Vercel.

## Struktur

```
src/
├── components/
│   ├── ui/        # shadcn/ui primitives
│   ├── layout/    # AppShell, Sidebar, Topbar
│   ├── lomba/     # LombaTable, LombaForm, dll
│   ├── kalender/  # CalendarView
│   ├── tim/       # TeamList, MemberChip
│   └── riwayat/   # HistoryTable, UploadField
├── pages/         # Route components
├── lib/           # supabase, utils, validations
└── hooks/         # React Query hooks

supabase/
├── migrations/    # SQL schema
└── functions/     # Edge Functions (reminders, push)
```

## License

MIT
