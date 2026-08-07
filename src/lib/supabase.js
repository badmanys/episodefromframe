import { createClient } from '@supabase/supabase-js'

const supabaseUrl    = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Client is null when env vars are missing (dev without Supabase).
// App still works; leaderboard features are disabled with a console warning.
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

if (!supabase) {
  console.warn(
    '[Supabase] Env vars not set – Supabase features disabled.\n' +
    'Copy .env.example → .env and fill in VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY.'
  )
}

// ── Leaderboard ──────────────────────────────────────────────────────────────

/**
 * Saves a finished game result to the leaderboard.
 *
 * Data shape:
 * {
 *   game_mode:   'endless' | 'classic',
 *   final_score: number,
 *   created_at:  ISO-8601 string,
 * }
 *
 * Currently logs to console and returns the object.
 * Wire up the Supabase insert once the 'leaderboard' table is created.
 *
 * @param {{ game_mode: string, final_score: number, created_at: string }} gameResult
 * @returns {Promise<{ success: boolean, data?: object, error?: any }>}
 */
export async function saveScoreToLeaderboard(gameResult) {
  console.log('[Leaderboard] Saving score:', gameResult)

  if (!supabase) {
    console.warn('[Leaderboard] Supabase not configured – score not persisted.')
    return { success: false, error: 'Supabase not configured' }
  }

  // ── Uncomment when the 'leaderboard' table is ready in Supabase: ────────
  //
  // const { data, error } = await supabase
  //   .from('leaderboard')
  //   .insert([gameResult])
  //   .select()
  //
  // if (error) {
  //   console.error('[Leaderboard] Insert error:', error)
  //   return { success: false, error }
  // }
  // return { success: true, data }
  // ─────────────────────────────────────────────────────────────────────────

  // Placeholder return until Supabase table is set up
  return { success: true, data: gameResult }
}
