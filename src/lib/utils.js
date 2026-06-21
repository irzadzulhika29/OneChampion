import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind classes with conflict resolution.
 * @param  {...any} inputs
 * @returns {string}
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Format date string to Indonesian locale.
 * @param {string|Date} date
 * @param {Intl.DateTimeFormatOptions} [options]
 * @returns {string}
 */
export function formatDate(date, options = { day: '2-digit', month: 'long', year: 'numeric' }) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('id-ID', options)
}

/**
 * Format currency to IDR.
 * @param {number} amount
 * @returns {string}
 */
export function formatCurrency(amount) {
  if (amount == null) return 'Gratis'
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount)
}

/**
 * Status color map for lomba badges.
 */
export const STATUS_LOMBA = {
  rencana: { label: 'Rencana', class: 'bg-slate-100 text-slate-700 border-slate-200' },
  terdaftar: { label: 'Terdaftar', class: 'bg-blue-100 text-blue-700 border-blue-200' },
  berlangsung: { label: 'Berlangsung', class: 'bg-amber-100 text-amber-700 border-amber-200' },
  selesai: { label: 'Selesai', class: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
}

export const KATEGORI_LOMBA = {
  programming: 'Programming',
  design: 'Design',
  'data-science': 'Data Science',
  hackathon: 'Hackathon',
  web: 'Web',
  mobile: 'Mobile',
  'ai-ml': 'AI/ML',
  other: 'Lainnya',
}

export const PERAN_ANGGOTA = {
  ketua: 'Ketua',
  anggota: 'Anggota',
  cadangan: 'Cadangan',
}
