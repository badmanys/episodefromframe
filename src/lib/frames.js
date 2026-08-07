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

// Fetch all frames from the static JSON
export async function fetchFrames() {
  const response = await fetch('/data/frames.json')
  if (!response.ok) throw new Error(`Failed to load frames data (${response.status})`)
  const data = await response.json()
  if (!Array.isArray(data) || data.length === 0) throw new Error('frames.json je prázdný nebo má špatný formát')
  return data
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
