import { supabase } from './supabase.js'

export function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export async function createRoom(frames, animeId) {
  if (!supabase) return { data: null, error: 'Supabase not configured' }
  const animeFrames = frames.filter(f => f.animeId === animeId)
  if (animeFrames.length === 0) return { data: null, error: `No frames found for anime: ${animeId}` }
  const shuffled = [...animeFrames].sort(() => Math.random() - 0.5)
  const selectedFrames = shuffled.slice(0, Math.min(5, shuffled.length))
  const code = generateRoomCode()
  const { data, error } = await supabase
    .from('rooms')
    .insert([{ code, anime_id: animeId, frames: selectedFrames, player1_score: 0, player2_score: 0, current_round: 0, status: 'waiting' }])
    .select().single()
  if (error) { console.error('[Multiplayer] createRoom error:', error); return { data: null, error: error.message || 'Failed to create room' } }
  return { data, error: null }
}

export async function joinRoom(roomCode) {
  if (!supabase) return { data: null, error: 'Supabase not configured' }
  const { data: room, error: fetchError } = await supabase.from('rooms').select('*').eq('code', roomCode.toUpperCase()).single()
  if (fetchError || !room) return { data: null, error: 'Místnost nebyla nalezena. Zkontroluj kód.' }
  if (room.status === 'playing') return { data: null, error: 'Místnost je plná – hra již probíhá.' }
  if (room.status === 'finished') return { data: null, error: 'Tato hra již skončila.' }
  const { data, error: updateError } = await supabase
    .from('rooms').update({ status: 'playing', current_round: 1 }).eq('code', roomCode.toUpperCase()).select().single()
  if (updateError) { console.error('[Multiplayer] joinRoom error:', updateError); return { data: null, error: updateError.message || 'Připojení selhalo.' } }
  return { data, error: null }
}

export function subscribeToRoom(roomCode, callback) {
  if (!supabase) { console.warn('[Multiplayer] Supabase not configured'); return null }
  const channel = supabase
    .channel(`room:${roomCode}`)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `code=eq.${roomCode.toUpperCase()}` }, (payload) => { if (payload.new) callback(payload.new) })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') console.log(`[Multiplayer] Subscribed to room ${roomCode}`)
      if (status === 'CHANNEL_ERROR') console.error(`[Multiplayer] Realtime error for room ${roomCode}`)
    })
  return channel
}

export async function updateRoomState(roomCode, update) {
  if (!supabase) return { data: null, error: 'Supabase not configured' }
  const { data, error } = await supabase.from('rooms').update(update).eq('code', roomCode.toUpperCase()).select().single()
  if (error) { console.error('[Multiplayer] updateRoomState error:', error); return { data: null, error: error.message } }
  return { data, error: null }
}

export async function fetchRoom(roomCode) {
  if (!supabase) return { data: null, error: 'Supabase not configured' }
  const { data, error } = await supabase.from('rooms').select('*').eq('code', roomCode.toUpperCase()).single()
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}
