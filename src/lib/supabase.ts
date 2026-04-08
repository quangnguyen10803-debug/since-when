import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  {
    auth: {
      // Persist session in localStorage across page reloads
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      fetch: (url, options) => {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 12000) // 12s timeout on every request
        return fetch(url, { ...options, signal: controller.signal })
          .finally(() => clearTimeout(timeout))
      },
    },
  }
)
