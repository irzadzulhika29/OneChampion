-- ============================================================================
-- OneChampion: lomba additions
-- ============================================================================
-- Adds DL Submission, Final date, PIC, and Document URL columns.
-- Safe to run on existing databases.
-- ============================================================================

alter table public.lomba
  add column if not exists deadline_submission date,
  add column if not exists tanggal_final date,
  add column if not exists pic_nama text,
  add column if not exists pic_kontak text,
  add column if not exists document_url text;
