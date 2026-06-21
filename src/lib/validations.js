import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Minimal 6 karakter'),
})

export const registerSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Minimal 6 karakter'),
  full_name: z.string().min(2, 'Nama minimal 2 karakter'),
})

export const timSchema = z.object({
  nama: z.string().min(2, 'Nama tim minimal 2 karakter'),
  deskripsi: z.string().optional(),
})

export const anggotaSchema = z.object({
  nama: z.string().min(2, 'Nama anggota minimal 2 karakter'),
  email: z.string().email('Email tidak valid').optional().or(z.literal('')),
  nim: z.string().optional(),
  prodi: z.string().optional(),
  no_hp: z.string().optional(),
  peran: z.enum(['ketua', 'anggota', 'cadangan']).default('anggota'),
  ktm_url: z.string().optional(),
})

export const lombaSchema = z.object({
  judul: z.string().min(2, 'Judul lomba minimal 2 karakter'),
  penyelenggara: z.string().optional(),
  kategori: z.enum(['programming', 'design', 'data-science', 'hackathon', 'web', 'mobile', 'ai-ml', 'other']).default('other'),
  // Timeline (now uploaded as poster image; legacy dates kept nullable for back-compat)
  tanggal_mulai: z.string().optional().or(z.literal('')),
  tanggal_selesai: z.string().optional().or(z.literal('')),
  timeline_image_url: z.string().optional().or(z.literal('')),
  // Deadlines
  deadline_pendaftaran: z.string().optional().or(z.literal('')),
  deadline_submission: z.string().optional().or(z.literal('')),
  tanggal_final: z.string().optional().or(z.literal('')),
  // Location
  lokasi: z.string().optional(),
  online: z.boolean().default(false),
  // Reward
  biaya_pendaftaran: z.coerce.number().min(0, 'Biaya tidak boleh negatif').default(0),
  hadiah: z.string().optional(),
  // Status
  status: z.enum(['rencana', 'terdaftar', 'berlangsung', 'selesai']).default('rencana'),
  // URLs
  url_pendaftaran: z.string().url('URL tidak valid').optional().or(z.literal('')),
  document_url: z.string().url('URL tidak valid').optional().or(z.literal('')),
  // PIC (Person In Charge)
  pic_nama: z.string().optional(),
  pic_kontak: z.string().optional(),
  // Team + notes
  tim_id: z.string().uuid().optional().or(z.literal('')),
  catatan: z.string().optional(),
})

export const hasilSchema = z.object({
  peringkat: z.string().optional(),
  predikat: z.string().optional(),
  poin: z.coerce.number().int().min(0).optional(),
  catatan: z.string().optional(),
})
