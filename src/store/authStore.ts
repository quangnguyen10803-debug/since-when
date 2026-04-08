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

function nameFromSession(session: { user: { email?: string; user_metadata?: Record<string, string> } }) {
  return session.user.user_metadata?.name ?? session.user.email?.split('@')[0] ?? 'User'
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  initialized: false,

  initialize: () => {
    // Unblock the UI after 8s no matter what
    const fallback = setTimeout(() => {
      set((s) => s.initialized ? s : { user: null, initialized: true })
    }, 8000)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          // Use metadata name immediately — don't block on DB call
          const fallbackName = nameFromSession(session)

          // Set user right away so the app doesn't hang
          set({
            user: { id: session.user.id, email: session.user.email!, name: fallbackName },
            initialized: true,
          })
          clearTimeout(fallback)

          // Then try to enrich with profile name in the background
          void supabase
            .from('profiles')
            .select('name')
            .eq('id', session.user.id)
            .single()
            .then(({ data }) => {
              if (data?.name) {
                set((s) => s.user ? { user: { ...s.user, name: data.name } } : s)
              }
            })
        } else {
          clearTimeout(fallback)
          set({ user: null, initialized: true })
        }
      }
    )

    // Return cleanup in case component unmounts (not strictly needed for global store)
    return () => subscription.unsubscribe()
  },

  login: async (email, password) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return error.message
      return null
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('abort') || msg.includes('timeout') || msg.includes('network')) {
        return 'Connection timed out. Check your internet and try again.'
      }
      return 'Sign in failed. Please try again.'
    }
  },

  register: async (email, password, name) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      })
      if (error) return error.message
      return null
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('abort') || msg.includes('timeout') || msg.includes('network')) {
        return 'Connection timed out. Check your internet and try again.'
      }
      return 'Registration failed. Please try again.'
    }
  },

  logout: async () => {
    try {
      await supabase.auth.signOut()
    } catch {
      // Force local sign-out even if server call fails
      set({ user: null })
    }
  },
}))
