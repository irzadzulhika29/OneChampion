import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

/**
 * Auth store. Manages current user + session.
 * Listens to Supabase auth changes for global sync.
 */
export const useAuthStore = create((set) => ({
  user: null,
  session: null,
  loading: true,

  setSession: (session) =>
    set({ session, user: session?.user ?? null, loading: false }),

  signOut: async () => {
    await supabase.auth.signOut()
    set({ session: null, user: null })
  },
}))

// Initialize auth state listener (call once in App)
export function initAuth() {
  supabase.auth.getSession().then(({ data: { session } }) => {
    useAuthStore.getState().setSession(session)
  })

  supabase.auth.onAuthStateChange((_event, session) => {
    useAuthStore.getState().setSession(session)
  })
}
