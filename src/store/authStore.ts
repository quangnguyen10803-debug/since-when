import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { User } from '../types'

interface AuthState {
  user: User | null
  initialized: boolean
  login: (email: string, password: string) => Promise<string | null>
  register: (email: string, password: string, name: string) => Promise<string | null>
  logout: () => Promise<void>
  initialize: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  initialized: false,

  initialize: () => {
    // Safety net: if auth doesn't resolve in 5s, unblock the UI
    let resolved = false
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true
        set({ user: null, initialized: true })
      }
    }, 5000)

    supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        if (session?.user) {
          // Try to get profile name, but don't let it block initialization
          let name = session.user.user_metadata?.name ?? session.user.email!.split('@')[0]
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('name')
              .eq('id', session.user.id)
              .single()
            if (profile?.name) name = profile.name
          } catch {
            // Profile fetch failed — use fallback name, don't block
          }

          resolved = true
          clearTimeout(timeout)
          set({
            user: {
              id: session.user.id,
              email: session.user.email!,
              name,
            },
            initialized: true,
          })
        } else {
          resolved = true
          clearTimeout(timeout)
          set({ user: null, initialized: true })
        }
      } catch (err) {
        console.error('Auth state change error:', err)
        resolved = true
        clearTimeout(timeout)
        set({ user: null, initialized: true })
      }
    })
  },

  login: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error?.message ?? null
  },

  register: async (email, password, name) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })
    return error?.message ?? null
  },

  logout: async () => {
    await supabase.auth.signOut()
  },
}))
