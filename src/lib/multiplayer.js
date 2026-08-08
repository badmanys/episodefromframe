import { supabase } from './supabase.js'
import { obfuscateFrame } from './security.js'

export function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export async function createRoom(frames, animeId, settings = {}, nickname = 'Host') {
  if (!supabase) return { data: null, error: 'Supabase not configured' }
  const isRandom = animeId === 'random' || animeId === null
  const animeFrames = isRandom ? frames : frames.filter(f => f.animeId === animeId)
  if (animeFrames.length === 0) return { data: null, error: `No frames found for anime: ${animeId}` }
  
  const rounds = settings.rounds || 5
  const maxPlayers = settings.maxPlayers || 2
  const timeLimit = settings.timeLimit || 0

  const shuffled = [...animeFrames].sort(() => Math.random() - 0.5)
  const selectedFrames = shuffled.slice(0, Math.min(rounds, shuffled.length)).map(obfuscateFrame)
  const code = generateRoomCode()
  const dbAnimeId = isRandom ? 'random' : animeId
  
  const { data, error } = await supabase
    .from('rooms')
    .insert([{ 
      code, 
      anime_id: dbAnimeId, 
      frames: selectedFrames, 
      max_players: maxPlayers,
      total_rounds: rounds,
      time_limit: timeLimit,
      players: [{ role: 'player1', name: nickname, score: 0, guess: null }],
      current_round: 0, 
      status: 'waiting'
    }])
    .select().single()
  if (error) { 
    if (import.meta.env.DEV) console.error('[Multiplayer] createRoom error:', error)
    return { data: null, error: error.message || 'Failed to create room' } 
  }
  return { data, error: null }
}

export async function joinRoom(roomCode, nickname = 'Guest') {
  if (!supabase) return { data: null, error: 'Supabase not configured' }
  const { data: room, error: fetchError } = await supabase.from('rooms').select('*').eq('code', roomCode.toUpperCase()).single()
  
  if (fetchError || !room) return { data: null, error: 'Místnost nebyla nalezena. Zkontroluj kód.' }
  if (room.status === 'playing' || room.status === 'finished') return { data: null, error: 'V této místnosti již hra probíhá nebo skončila.' }
  
  const currentPlayers = room.players || []
  if (currentPlayers.length >= room.max_players) {
    return { data: null, error: 'Místnost je již plná.' }
  }

  if (currentPlayers.some(p => p.name.toLowerCase() === nickname.toLowerCase())) {
    return { data: null, error: 'Tato přezdívka je v místnosti již zabraná. Zvol si prosím jinou.' }
  }

  // Find next role (e.g. player2, player3)
  const slot = currentPlayers.length + 1
  const role = `player${slot}`
  
  const newPlayer = { role, name: nickname, score: 0, guess: null }
  const updatedPlayers = [...currentPlayers, newPlayer]

  const { data, error: updateError } = await supabase
    .from('rooms').update({ players: updatedPlayers }).eq('code', roomCode.toUpperCase()).select().single()
    
  if (updateError) { 
    if (import.meta.env.DEV) console.error('[Multiplayer] joinRoom error:', updateError)
    return { data: null, error: updateError.message || 'Připojení selhalo.' } 
  }
  
  return { data, role, error: null }
}

export function subscribeToRoom(roomCode, nickname, callback, onPlayerDisconnect) {
  if (!supabase) { console.warn('[Multiplayer] Supabase not configured'); return null }
  if (!roomCode || !nickname) return null
  try {
    const channel = supabase
      .channel(`room:${roomCode}`, {
        config: {
          presence: { key: nickname },
        },
      })
      
    channel
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `code=eq.${roomCode.toUpperCase()}` }, (payload) => { if (payload.new) callback(payload.new) })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        if (leftPresences.length > 0) {
          const leftName = leftPresences[0].name || key
          onPlayerDisconnect(leftName)
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ name: nickname, online_at: new Date().toISOString() })
          if (import.meta.env.DEV) console.log(`[Multiplayer] Subscribed & Tracked presence for ${nickname} in room ${roomCode}`)
        }
        if (import.meta.env.DEV) {
          if (status === 'CHANNEL_ERROR') console.error(`[Multiplayer] Realtime error for room ${roomCode}`)
        }
      })
    return channel
  } catch (err) {
    if (import.meta.env.DEV) console.error('[Multiplayer] subscribeToRoom exception:', err)
    return null
  }
}

export async function leaveRoom(roomCode) {
  if (!supabase) return { data: null, error: 'Supabase not configured' }
  const { data, error } = await supabase.from('rooms').update({ status: 'closed' }).eq('code', roomCode.toUpperCase()).select().single()
  return { data, error: error ? error.message : null }
}

export async function updateRoomState(roomCode, update) {
  if (!supabase) return { data: null, error: 'Supabase not configured' }
  const { data, error } = await supabase.from('rooms').update(update).eq('code', roomCode.toUpperCase()).select().single()
  if (error) { 
    if (import.meta.env.DEV) console.error('[Multiplayer] updateRoomState error:', error)
    return { data: null, error: error.message } 
  }
  return { data, error: null }
}

export async function fetchRoom(roomCode) {
  if (!supabase) return { data: null, error: 'Supabase not configured' }
  const { data, error } = await supabase.from('rooms').select('*').eq('code', roomCode.toUpperCase()).single()
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function submitGuess(roomCode, role, guessData) {
  if (!supabase) return { data: null, error: 'Supabase not configured' }
  
  // First fetch the room to get current players array
  const { data: room, error: fetchError } = await supabase.from('rooms').select('players').eq('code', roomCode.toUpperCase()).single()
  if (fetchError) return { data: null, error: fetchError.message }
  
  const updatedPlayers = (room.players || []).map(p => 
    p.role === role ? { ...p, guess: guessData } : p
  )
  
  const { data, error } = await supabase.from('rooms').update({ players: updatedPlayers }).eq('code', roomCode.toUpperCase()).select().single()
  if (error) { 
    if (import.meta.env.DEV) console.error('[Multiplayer] submitGuess error:', error)
    return { data: null, error: error.message } 
  }
  return { data, error: null }
}

// ── Bodovací logika pro 2-4 hráče ─────────────────────────────────────────
// Priorita: Anime -> Part -> Epizoda
export function evaluateMultiplayerRound(players, answer, isRandom) {
  const evaluatePlayer = (guess) => {
    if (!guess || guess.surrendered) return { valid: false, episodeDiff: Infinity }
    if (isRandom && guess.animeId !== answer.animeId) return { valid: false, episodeDiff: Infinity }
    
    const partCorrect = Number(guess.part) === Number(answer.part)
    const valid = partCorrect
    const episodeDiff = Math.abs(Number(guess.episode) - Number(answer.episode))
    
    return { valid, episodeDiff }
  }

  let bestDiff = Infinity
  const results = {}
  
  for (const p of players) {
    if (p.guess) {
      const res = evaluatePlayer(p.guess)
      results[p.role] = res
      if (res.valid && res.episodeDiff < bestDiff) {
        bestDiff = res.episodeDiff
      }
    }
  }

  const winners = []
  for (const [role, res] of Object.entries(results)) {
    if (res.valid && res.episodeDiff === bestDiff) {
      winners.push(role)
    }
  }

  return winners // pole rolí, např. ['player1'] nebo ['player1', 'player3']
}
