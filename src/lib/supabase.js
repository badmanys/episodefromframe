import { createClient } from '@supabase/supabase-js'

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const isConfigured =
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-supabase-url') &&
  !supabaseAnonKey.includes('your-anon-key') &&
  supabaseUrl.startsWith('https://')

export const supabaseConfigured = !!isConfigured

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, { realtime: { params: { eventsPerSecond: 10 } } })
  : null

if (!supabase && import.meta.env.DEV) {
  console.warn(
    '[Supabase] Not configured – multiplayer features disabled.\n' +
    'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env, then run the SQL migration.'
  )
}
