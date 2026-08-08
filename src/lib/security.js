// src/lib/security.js

// ── 1. Sanitizace ─────────────────────────────────────────────────────────────
export function sanitizeNickname(input) {
  if (!input) return ''
  // Odstraní všechny znaky kromě písmen, číslic, mezer a diakritiky
  return input
    .replace(/[^a-zA-Z0-9 ěščřžýáíéúůťďň]/g, '')
    .trim()
    .slice(0, 15) // Max 15 znaků
}

export function sanitizeRoomCode(input) {
  if (!input) return ''
  return input
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 6)
}

// ── 2. Rate Limiting ─────────────────────────────────────────────────────────
const rateLimits = {} // memory store: { [action]: [timestamps] }

export function checkRateLimit(action, maxRequests = 5, windowMs = 3000) {
  const now = Date.now()
  if (!rateLimits[action]) rateLimits[action] = []
  
  // Odstraní staré timestampy mimo okno
  rateLimits[action] = rateLimits[action].filter(t => now - t < windowMs)
  
  if (rateLimits[action].length >= maxRequests) {
    return false // Rate limit překročen
  }
  
  rateLimits[action].push(now)
  return true // Akce povolena
}

// ── 3. Room Creation Cooldown ────────────────────────────────────────────────
export function canCreateRoom() {
  const lastCreated = sessionStorage.getItem('last_room_created')
  const now = Date.now()
  
  if (lastCreated && (now - parseInt(lastCreated, 10)) < 10000) {
    return false // Může vytvořit místnost max jednou za 10 vteřin
  }
  
  sessionStorage.setItem('last_room_created', now.toString())
  return true
}

// ── 4. Data Obfuscation (Zatemnění proti F12) ──────────────────────────────
export function obfuscateFrame(frame) {
  // Převede citlivá data (epizoda, part, název) do Base64 
  // aby nebyly na první pohled čitelné v Network tabu.
  return {
    ...frame,
    _o_episode: btoa(frame.episode.toString()),
    _o_part: btoa(frame.part.toString()),
    _o_title: btoa(encodeURIComponent(frame.title || '')),
    // Odstraníme původní čitelné hodnoty
    episode: undefined,
    part: undefined,
    title: undefined
  }
}

export function deobfuscateFrame(frame) {
  if (!frame._o_episode) return frame // Není obfuskováno
  try {
    return {
      ...frame,
      episode: parseInt(atob(frame._o_episode), 10),
      part: parseInt(atob(frame._o_part), 10),
      title: decodeURIComponent(atob(frame._o_title)),
      // Odstraníme dočasné hodnoty
      _o_episode: undefined,
      _o_part: undefined,
      _o_title: undefined
    }
  } catch (e) {
    console.error('Failed to deobfuscate frame', e)
    return frame
  }
}
