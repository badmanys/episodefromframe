import { supabase } from './supabase.js'

// No hardcoded series - everything is loaded dynamically

// Fetch all frames from the static JSON (used for migration in Admin & as fallback)
export async function fetchLocalFramesJson() {
  const response = await fetch('/data/frames.json')
  if (!response.ok) throw new Error(`Failed to load frames data (${response.status})`)
  const data = await response.json()
  if (!Array.isArray(data)) return []
  // Normalize local JSON — fields may be either image or image_url, animeId or anime_id
  return data.map(f => ({
    id:           f.id,
    image:        f.image || f.image_url || '',
    animeId:      f.animeId || f.anime_id || '',
    title:        f.title || '',
    episode:      f.episode ?? 0,
    part:         f.part ?? 1,
    episode_name: f.episode_name || '',
  }))
}

// Fetch all frames from Supabase Database, with automatic fallback to local JSON
export async function fetchFrames() {
  // 1) Try Supabase first (only if configured)
  if (supabase) {
    try {
      const { data, error } = await supabase.from('frames').select('*')

      if (!error && data && data.length > 0) {
        return data.map(dbFrame => ({
          id:           dbFrame.id,
          image:        dbFrame.image_url || dbFrame.image || '',
          animeId:      dbFrame.anime_id  || dbFrame.animeId || '',
          title:        dbFrame.title     || '',
          episode:      dbFrame.episode   ?? 0,
          part:         dbFrame.part      ?? 1,
          episode_name: dbFrame.episode_name || '',
        }))
      }

      // Supabase returned empty or error — fall through to local fallback
      if (error) {
        console.warn('[frames] Supabase error, using local fallback:', error.message)
      } else {
        console.warn('[frames] Supabase returned 0 rows, using local fallback.')
      }
    } catch (err) {
      console.warn('[frames] Supabase fetch threw, using local fallback:', err.message)
    }
  }

  // 2) Fallback: load from local /public/data/frames.json
  console.info('[frames] Loading frames from local frames.json…')
  return fetchLocalFramesJson()
}

// Get list of unique anime present in the dataset — fully dynamic, no hardcoded list
export function getUniqueAnimes(frames) {
  // Build a map: animeId → best display title
  const titleMap = {}
  for (const f of frames) {
    if (!f.animeId) continue
    if (!titleMap[f.animeId]) {
      // Use the frame title (strip episode info) or raw id
      titleMap[f.animeId] = f.title || f.serieName || f.animeId
    }
  }
  return Object.entries(titleMap).map(([id, title]) => ({ id, title }))
}

// Get display name for any animeId
export function getAnimeName(animeId, frames = []) {
  const frame = frames.find(f => f.animeId === animeId)
  return frame?.title || frame?.serieName || animeId
}

// Get sorted list of unique parts for a given anime
export function getPartsForAnime(frames, animeId) {
  return [...new Set(
    frames.filter(f => f.animeId === animeId).map(f => Number(f.part))
  )].sort((a, b) => a - b)
}

// Get all episodes for a given anime + part
export function getEpisodesForPart(frames, animeId, part) {
  return frames
    .filter(f => f.animeId === animeId && Number(f.part) === Number(part))
    .sort((a, b) => a.episode - b.episode)
}

// Pick a random frame (optionally filtered by animeId)
export function pickRandomFrame(frames, animeId = null) {
  const pool = animeId ? frames.filter(f => f.animeId === animeId) : frames
  if (!pool.length) return null
  return pool[Math.floor(Math.random() * pool.length)]
}

// Deterministically pick a frame based on a date string (YYYY-MM-DD)
export function getDailyFrame(frames, dateString) {
  if (!frames.length) return null
  // Simple hash function for the date string
  let hash = 0
  for (let i = 0; i < dateString.length; i++) {
    const char = dateString.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  // Use absolute value of hash to pick an index
  const index = Math.abs(hash) % frames.length
  
  // Sort by ID for stable daily picks even if frames are added
  const sortedFrames = [...frames].sort((a, b) => String(a.id).localeCompare(String(b.id)))
  return sortedFrames[index]
}

// Compare a player's guess against the actual answer
// Returns per-field match status and direction arrows
export function compareGuess(guess, answer) {
  const titleMatch = guess.animeId === answer.animeId
  const gPart = Number(guess.part)
  const aPart = Number(answer.part)
  const gEp = Number(guess.episode)
  const aEp = Number(answer.episode)

  const partMatch = gPart === aPart
  const episodeMatch = gEp === aEp
  const isCorrect = titleMatch && partMatch && episodeMatch

  return {
    guess,
    titleMatch,
    partMatch,
    // Only show arrows when anime matches (parts from different series aren't comparable)
    partDirection: titleMatch && !partMatch ? (gPart < aPart ? 'up' : 'down') : null,
    episodeMatch,
    // Only show episode arrows when anime + part both match
    episodeDirection: titleMatch && partMatch && !episodeMatch
      ? (gEp < aEp ? 'up' : 'down')
      : null,
    isCorrect,
  }
}
