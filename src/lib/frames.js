import { supabase } from './supabase.js'

// Human-readable names for anime IDs
export const ANIME_NAMES = {
  jojo: "JoJo's Bizarre Adventure",
  naruto: 'Naruto',
  bleach: 'Bleach',
  aot: 'Attack on Titan',
  fma: 'Fullmetal Alchemist: Brotherhood',
  hxh: 'Hunter x Hunter',
  dbs: 'Dragon Ball Super',
}

// Fetch all frames from the static JSON (used for migration in Admin)
export async function fetchLocalFramesJson() {
  const response = await fetch('/data/frames.json')
  if (!response.ok) throw new Error(`Failed to load frames data (${response.status})`)
  const data = await response.json()
  if (!Array.isArray(data) || data.length === 0) throw new Error('frames.json je prázdný nebo má špatný formát')
  return data
}

// Fetch all frames from Supabase Database
export async function fetchFrames() {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase.from('frames').select('*')
  
  if (error) throw new Error(`Supabase error: ${error.message}`)
  if (!data || data.length === 0) return []
  
  return data.map(dbFrame => ({
    id: dbFrame.id,
    image: dbFrame.image_url,
    animeId: dbFrame.anime_id,
    title: dbFrame.title,
    episode: dbFrame.episode,
    part: dbFrame.part
  }))
}

// Get list of unique anime present in the dataset
export function getUniqueAnimes(frames) {
  const ids = [...new Set(frames.map(f => f.animeId))]
  return ids.map(id => ({
    id,
    title: ANIME_NAMES[id] || id,
  }))
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
  
  // To ensure the sequence of daily frames doesn't change when frames are added,
  // we could ideally sort by ID first, but frames from DB might already be sorted.
  // For safety, let's sort a copy of frames by ID before picking.
  const sortedFrames = [...frames].sort((a, b) => a.id.localeCompare(b.id))
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
