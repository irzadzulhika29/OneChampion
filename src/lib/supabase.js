import { createClient } from '@supabase/supabase-js'
import { createMockClient } from '@/lib/mockSupabase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isDemoMode = !supabaseUrl || !supabaseAnonKey

if (isDemoMode) {
  console.info(
    '%c[SabiJuara] Mode Demo aktif',
    'background:#fbbf24;color:#000;padding:2px 6px;border-radius:3px;font-weight:bold',
    '\nSupabase env tidak ditemukan. Data disimpan di localStorage browser.\nUntuk menghubungkan Supabase: buat .env.local dengan VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY.'
  )
}

export const supabase = isDemoMode
  ? createMockClient()
  : createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
