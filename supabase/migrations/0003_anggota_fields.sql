-- ============================================================================
-- OneChampion: anggota_tim additions
-- ============================================================================
-- Adds prodi, no_hp, ktm_url columns. Safe to run on existing databases.
-- ============================================================================

alter table public.anggota_tim
  add column if not exists prodi text,
  add column if not exists no_hp text,
  add column if not exists ktm_url text;

-- (Optional) Drop legacy kontak column if you want a clean schema.
-- alter table public.anggota_tim drop column if exists kontak;
