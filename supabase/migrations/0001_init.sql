-- ============================================================================
-- OneChampion: initial schema
-- ============================================================================
-- All tables have RLS enabled and policies keyed on auth.uid().
-- Storage bucket "lampiran" created at end.
-- ============================================================================

-- Extensions ----------------------------------------------------------------
create extension if not exists "pgcrypto";

-- profiles ------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: read own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: insert own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup ---------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- tim (teams) ---------------------------------------------------------------
create table public.tim (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  nama text not null,
  deskripsi text,
  created_at timestamptz not null default now()
);

create index tim_owner_idx on public.tim (owner_id);

alter table public.tim enable row level security;

create policy "tim: read own"
  on public.tim for select
  using (auth.uid() = owner_id);

create policy "tim: insert own"
  on public.tim for insert
  with check (auth.uid() = owner_id);

create policy "tim: update own"
  on public.tim for update
  using (auth.uid() = owner_id);

create policy "tim: delete own"
  on public.tim for delete
  using (auth.uid() = owner_id);

-- anggota_tim (team members) ------------------------------------------------
create table public.anggota_tim (
  id uuid primary key default gen_random_uuid(),
  tim_id uuid not null references public.tim(id) on delete cascade,
  nama text not null,
  email text,
  nim text,
  prodi text,                                          -- program studi
  no_hp text,                                          -- nomor HP / WhatsApp
  peran text not null default 'anggota' check (peran in ('ketua','anggota','cadangan')),
  ktm_url text,                                        -- storage path untuk file KTM
  created_at timestamptz not null default now()
);

create index anggota_tim_idx on public.anggota_tim (tim_id);

alter table public.anggota_tim enable row level security;

-- RLS: members are visible/editable if the parent tim belongs to the user
create policy "anggota: read via tim"
  on public.anggota_tim for select
  using (
    exists (select 1 from public.tim t where t.id = anggota_tim.tim_id and t.owner_id = auth.uid())
  );

create policy "anggota: insert via tim"
  on public.anggota_tim for insert
  with check (
    exists (select 1 from public.tim t where t.id = anggota_tim.tim_id and t.owner_id = auth.uid())
  );

create policy "anggota: update via tim"
  on public.anggota_tim for update
  using (
    exists (select 1 from public.tim t where t.id = anggota_tim.tim_id and t.owner_id = auth.uid())
  );

create policy "anggota: delete via tim"
  on public.anggota_tim for delete
  using (
    exists (select 1 from public.tim t where t.id = anggota_tim.tim_id and t.owner_id = auth.uid())
  );

-- lomba (competitions) ------------------------------------------------------
create table public.lomba (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  tim_id uuid references public.tim(id) on delete set null,
  judul text not null,                                          -- Competition Name
  penyelenggara text,                                           -- Organizer
  kategori text not null default 'other' check (kategori in ('programming','design','data-science','hackathon','web','mobile','ai-ml','other')),
  tanggal_mulai date not null,                                  -- Timeline (start)
  tanggal_selesai date,                                         -- Timeline (end)
  deadline_pendaftaran date,                                    -- DL Register
  deadline_submission date,                                     -- DL Submission (pengumpulan karya)
  tanggal_final date,                                           -- Final (babak final / pengumuman)
  lokasi text,
  online boolean not null default false,
  biaya_pendaftaran numeric default 0,
  hadiah text,
  status text not null default 'rencana' check (status in ('rencana','terdaftar','berlangsung','selesai')),
  url_pendaftaran text,                                         -- Registration URL
  document_url text,                                            -- Document URL (proposal / guide book link)
  pic_nama text,                                                -- PIC (Person In Charge)
  pic_kontak text,                                              -- PIC contact (WA / email)
  catatan text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index lomba_owner_idx on public.lomba (owner_id);
create index lomba_status_idx on public.lomba (status);
create index lomba_tanggal_idx on public.lomba (tanggal_mulai);
create index lomba_deadline_idx on public.lomba (deadline_pendaftaran);

alter table public.lomba enable row level security;

create policy "lomba: read own"
  on public.lomba for select
  using (auth.uid() = owner_id);

create policy "lomba: insert own"
  on public.lomba for insert
  with check (auth.uid() = owner_id);

create policy "lomba: update own"
  on public.lomba for update
  using (auth.uid() = owner_id);

create policy "lomba: delete own"
  on public.lomba for delete
  using (auth.uid() = owner_id);

-- updated_at trigger --------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger lomba_set_updated_at
  before update on public.lomba
  for each row execute function public.set_updated_at();

-- hasil (results) -----------------------------------------------------------
create table public.hasil (
  id uuid primary key default gen_random_uuid(),
  lomba_id uuid not null unique references public.lomba(id) on delete cascade,
  peringkat text,
  predikat text,
  poin integer,
  catatan text,
  created_at timestamptz not null default now()
);

alter table public.hasil enable row level security;

create policy "hasil: read via lomba"
  on public.hasil for select
  using (
    exists (select 1 from public.lomba l where l.id = hasil.lomba_id and l.owner_id = auth.uid())
  );

create policy "hasil: insert via lomba"
  on public.hasil for insert
  with check (
    exists (select 1 from public.lomba l where l.id = hasil.lomba_id and l.owner_id = auth.uid())
  );

create policy "hasil: update via lomba"
  on public.hasil for update
  using (
    exists (select 1 from public.lomba l where l.id = hasil.lomba_id and l.owner_id = auth.uid())
  );

create policy "hasil: delete via lomba"
  on public.hasil for delete
  using (
    exists (select 1 from public.lomba l where l.id = hasil.lomba_id and l.owner_id = auth.uid())
  );

-- lampiran (attachments metadata) -------------------------------------------
create table public.lampiran (
  id uuid primary key default gen_random_uuid(),
  lomba_id uuid references public.lomba(id) on delete cascade,
  hasil_id uuid references public.hasil(id) on delete cascade,
  nama text not null,
  storage_path text not null,
  mime_type text,
  ukuran integer,
  uploaded_at timestamptz not null default now(),
  constraint lampiran_one_parent check (lomba_id is not null or hasil_id is not null)
);

create index lampiran_lomba_idx on public.lampiran (lomba_id);
create index lampiran_hasil_idx on public.lampiran (hasil_id);

alter table public.lampiran enable row level security;

create policy "lampiran: read via lomba"
  on public.lampiran for select
  using (
    (lomba_id is not null and exists (select 1 from public.lomba l where l.id = lampiran.lomba_id and l.owner_id = auth.uid()))
    or (hasil_id is not null and exists (
      select 1 from public.hasil h
      join public.lomba l on l.id = h.lomba_id
      where h.id = lampiran.hasil_id and l.owner_id = auth.uid()
    ))
  );

create policy "lampiran: insert via lomba"
  on public.lampiran for insert
  with check (
    (lomba_id is not null and exists (select 1 from public.lomba l where l.id = lampiran.lomba_id and l.owner_id = auth.uid()))
    or (hasil_id is not null and exists (
      select 1 from public.hasil h
      join public.lomba l on l.id = h.lomba_id
      where h.id = lampiran.hasil_id and l.owner_id = auth.uid()
    ))
  );

create policy "lampiran: delete via lomba"
  on public.lampiran for delete
  using (
    (lomba_id is not null and exists (select 1 from public.lomba l where l.id = lampiran.lomba_id and l.owner_id = auth.uid()))
    or (hasil_id is not null and exists (
      select 1 from public.hasil h
      join public.lomba l on l.id = h.lomba_id
      where h.id = lampiran.hasil_id and l.owner_id = auth.uid()
    ))
  );

-- reminders ----------------------------------------------------------------
create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  lomba_id uuid not null references public.lomba(id) on delete cascade,
  fire_at timestamptz not null,
  channel text not null check (channel in ('email','push')),
  sent boolean not null default false,
  sent_at timestamptz
);

create index reminders_due_idx on public.reminders (fire_at) where sent = false;

alter table public.reminders enable row level security;

create policy "reminders: read via lomba"
  on public.reminders for select
  using (
    exists (select 1 from public.lomba l where l.id = reminders.lomba_id and l.owner_id = auth.uid())
  );

create policy "reminders: insert via lomba"
  on public.reminders for insert
  with check (
    exists (select 1 from public.lomba l where l.id = reminders.lomba_id and l.owner_id = auth.uid())
  );

create policy "reminders: delete via lomba"
  on public.reminders for delete
  using (
    exists (select 1 from public.lomba l where l.id = reminders.lomba_id and l.owner_id = auth.uid())
  );

-- push_subscriptions (web push endpoints per user) --------------------------
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index push_subs_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

create policy "push: manage own"
  on public.push_subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Storage: lampiran bucket (private) ----------------------------------------
-- Created via SQL is not directly supported. Run this in Supabase Studio:
--   Storage > New bucket > "lampiran" > Private
-- Or via CLI:
--   supabase storage create lampiran --public=false
