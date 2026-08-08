// ── GitHub Image Upload Utility ───────────────────────────────────────────────
// Nahrává obrázky do GitHub repozitáře přes GitHub Contents API.
// Obrázky jsou poté dostupné na adrese:
//   https://raw.githubusercontent.com/{OWNER}/{REPO}/{BRANCH}/public/obrazky/{filename}

const GITHUB_TOKEN  = import.meta.env.VITE_GITHUB_TOKEN
const GITHUB_OWNER  = import.meta.env.VITE_GITHUB_OWNER
const GITHUB_REPO   = import.meta.env.VITE_GITHUB_REPO
const GITHUB_BRANCH = import.meta.env.VITE_GITHUB_BRANCH || 'main'

// Složka v repozitáři, kam se budou obrázky nahrávat
const IMAGES_PATH = 'public/obrazky'

/**
 * Zkonvertuje File objekt na base64 string (bez prefixu data:...)
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Sanitizuje název souboru — odstraní diakritiku a nebezpečné znaky.
 */
function sanitizeFilename(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // odstraní diakritiku
    .replace(/[^a-zA-Z0-9._-]/g, '_') // nahradí speciální znaky podtržítkem
    .toLowerCase()
}

/**
 * Zkontroluje, zda jsou nastaveny všechny potřebné GitHub env proměnné.
 * @returns {string|null} Chybová zpráva nebo null pokud je vše OK.
 */
export function checkGithubConfig() {
  if (!GITHUB_TOKEN) return 'Chybí VITE_GITHUB_TOKEN v .env souboru.'
  if (!GITHUB_OWNER)  return 'Chybí VITE_GITHUB_OWNER v .env souboru.'
  if (!GITHUB_REPO)   return 'Chybí VITE_GITHUB_REPO v .env souboru.'
  return null
}

/**
 * Nahraje obrázek (File objekt) do GitHub repozitáře.
 * @param {File}   file       - Soubor k nahrání
 * @param {string} subfolder  - Volitelná podsložka (např. 'jojo/p3')
 * @returns {Promise<{url: string, rawUrl: string} | {error: string}>}
 */
export async function uploadImageToGithub(file, subfolder = '') {
  // Ověř konfiguraci
  const configError = checkGithubConfig()
  if (configError) return { error: configError }

  // Připrav cestu a název souboru
  const safeName    = sanitizeFilename(file.name)
  const timestamp   = Date.now()
  const filename    = `${timestamp}_${safeName}`
  const repoPath    = subfolder
    ? `${IMAGES_PATH}/${subfolder}/${filename}`
    : `${IMAGES_PATH}/${filename}`

  // Zkonvertuj na base64
  let base64Content
  try {
    base64Content = await fileToBase64(file)
  } catch {
    return { error: 'Nepodařilo se přečíst soubor.' }
  }

  // Zavolej GitHub API
  const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${repoPath}`
  try {
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Content-Type':  'application/json',
        'Accept':        'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        message: `feat: add frame image ${filename}`,
        content: base64Content,
        branch:  GITHUB_BRANCH,
      }),
    })

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}))
      return { error: `GitHub API chyba ${response.status}: ${errData.message || response.statusText}` }
    }

    const result = await response.json()
    const rawUrl = result.content?.download_url ||
      `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${repoPath}`

    return { url: rawUrl, rawUrl }
  } catch (err) {
    return { error: `Síťová chyba: ${err.message}` }
  }
}
