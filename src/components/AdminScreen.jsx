import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Lock, Save, Trash2, UploadCloud, Image as ImageIcon,
  CheckCircle2, Loader2, AlertTriangle, Github, X, FolderOpen,
  Eye, EyeOff, Link2
} from 'lucide-react'
import { supabase }                        from '../lib/supabase.js'
import { fetchLocalFramesJson } from '../lib/frames.js'
import { uploadImageToGithub, checkGithubConfig } from '../lib/github.js'
import FrameViewer                          from './FrameViewer.jsx'

// ── Helpers ───────────────────────────────────────────────────────────────────
function Alert({ type, children, onDismiss }) {
  const styles = {
    error:   'bg-red-950/50 border-red-900/50 text-red-400',
    success: 'bg-emerald-950/50 border-emerald-900/50 text-emerald-400',
    info:    'bg-indigo-950/50 border-indigo-900/50 text-indigo-400',
  }
  const icons = { error: AlertTriangle, success: CheckCircle2, info: Link2 }
  const Icon = icons[type] || AlertTriangle
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className={`p-3 rounded-xl border text-sm font-semibold flex items-center gap-2 ${styles[type]}`}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1">{children}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="opacity-60 hover:opacity-100">
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </motion.div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AdminScreen({ onBack, animes = [], onFramesChanged }) {
  const [password,        setPassword]        = useState('')
  const [showPassword,    setShowPassword]    = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const [frames,        setFrames]        = useState([])
  const [loading,       setLoading]       = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [alert,         setAlert]         = useState(null) // { type, message }

  // New Frame Form
  const [newFrame, setNewFrame] = useState({
    image_url:    '',
    anime_id:     'jojo',
    title:        "JoJo's Bizarre Adventure",
    episode:      '',
    part:         '',
    episode_name: '',
  })

  // Local animes state so we can immediately show newly added series before they have frames
  const [localAnimes, setLocalAnimes] = useState([])
  useEffect(() => {
    setLocalAnimes(prev => {
      const animesIds = new Set(animes.map(a => a.id))
      const tempAnimes = prev.filter(p => !animesIds.has(p.id))
      return [...animes, ...tempAnimes]
    })
  }, [animes])

  // GitHub upload state
  const [uploadFile,        setUploadFile]        = useState(null)   // File object
  const [uploadPreviewUrl,  setUploadPreviewUrl]  = useState(null)   // local blob URL
  const [uploadSubfolder,   setUploadSubfolder]   = useState('')     // optional subfolder
  const [uploading,         setUploading]         = useState(false)
  const [githubConfigError, setGithubConfigError] = useState(null)
  const fileInputRef = useRef(null)

  // Load frames when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadFrames()
      setGithubConfigError(checkGithubConfig())
    }
  }, [isAuthenticated])

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => { if (uploadPreviewUrl) URL.revokeObjectURL(uploadPreviewUrl) }
  }, [uploadPreviewUrl])

  const showAlert = (type, message, autoDismissMs = 0) => {
    setAlert({ type, message })
    if (autoDismissMs) setTimeout(() => setAlert(null), autoDismissMs)
  }

  const loadFrames = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('frames').select('*').order('created_at', { ascending: false })
      if (error) throw error
      setFrames(data || [])
      if (onFramesChanged) onFramesChanged()
    } catch (err) {
      showAlert('error', err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = (e) => {
    e.preventDefault()
    if (password === import.meta.env.VITE_ADMIN_PASSWORD) {
      setIsAuthenticated(true)
    } else {
      showAlert('error', 'Neplatné master heslo.')
      setTimeout(() => setAlert(null), 3000)
    }
  }

  const handleAnimeChange = (e) => {
    const id = e.target.value
    const knownTitle = localAnimes.find(a => a.id === id)?.title || id
    setNewFrame(prev => ({ ...prev, anime_id: id, title: knownTitle }))
    // Auto-fill subfolder suggestion
    setUploadSubfolder(id)
  }

  const handleAddNewSeries = () => {
    const title = window.prompt('Zadejte název nové série (např. Hunter x Hunter):')
    if (!title || !title.trim()) return
    const id = title.toLowerCase().replace(/[^a-z0-9]/g, '') || 'new'
    
    if (localAnimes.some(a => a.id === id)) {
      showAlert('error', 'Tato série již existuje.')
      return
    }

    setLocalAnimes(prev => [...prev, { id, title: title.trim() }])
    setNewFrame(prev => ({ ...prev, anime_id: id, title: title.trim() }))
    setUploadSubfolder(id)
  }

  // ── File Picker ────────────────────────────────────────────────────────────
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      showAlert('error', 'Vyber obrázek (JPG, PNG, WebP, GIF).', 3000)
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      showAlert('error', 'Obrázek je příliš velký (max. 10 MB).', 3000)
      return
    }
    if (uploadPreviewUrl) URL.revokeObjectURL(uploadPreviewUrl)
    setUploadFile(file)
    setUploadPreviewUrl(URL.createObjectURL(file))
    setAlert(null)
  }

  const handleFileDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) {
      const fakeEvent = { files: [file] }
      handleFileSelect({ target: fakeEvent })
    }
  }

  // ── GitHub Upload ──────────────────────────────────────────────────────────
  const handleUploadToGithub = async () => {
    if (!uploadFile) return
    setUploading(true)
    setAlert(null)
    const result = await uploadImageToGithub(uploadFile, uploadSubfolder)
    setUploading(false)

    if (result.error) {
      showAlert('error', result.error)
      return
    }

    // Úspěch — vyplň URL do formuláře
    setNewFrame(prev => ({ ...prev, image_url: result.rawUrl }))
    showAlert('success', `Obrázek nahrán na GitHub! URL byla automaticky vložena do formuláře.`, 5000)
    // Vyčisti file picker
    setUploadFile(null)
    setUploadPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const clearUpload = () => {
    setUploadFile(null)
    if (uploadPreviewUrl) URL.revokeObjectURL(uploadPreviewUrl)
    setUploadPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Add Frame to Supabase ─────────────────────────────────────────────────
  const handleAddFrame = async (e) => {
    e.preventDefault()
    if (!newFrame.image_url) { showAlert('error', 'Nejprve nahraj obrázek nebo vlož URL.'); return }
    if (!newFrame.episode)   { showAlert('error', 'Vyplň číslo epizody.'); return }
    if (!newFrame.part)      { showAlert('error', 'Vyplň číslo části (Part).'); return }
    setActionLoading(true)
    setAlert(null)
    try {
      const { error } = await supabase.from('frames').insert([{
        image_url:    newFrame.image_url,
        anime_id:     newFrame.anime_id,
        title:        newFrame.title,
        episode:      Number(newFrame.episode),
        part:         Number(newFrame.part),
        episode_name: newFrame.episode_name || null,
      }])
      if (error) throw error
      showAlert('success', 'Snímek úspěšně přidán do databáze!', 4000)
      setNewFrame(prev => ({ ...prev, image_url: '', episode: '', part: '', episode_name: '' }))
      await loadFrames()
    } catch (err) {
      showAlert('error', err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Opravdu chceš smazat tento snímek?')) return
    setActionLoading(true)
    try {
      const { error } = await supabase.from('frames').delete().eq('id', id)
      if (error) throw error
      await loadFrames()
    } catch (err) {
      showAlert('error', err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteSeries = async () => {
    const seriesTitle = newFrame.title || newFrame.anime_id
    if (!window.confirm(`Opravdu chceš smazat sérii "${seriesTitle}" a všechny její přiřazené snímky? Tuto akci nelze vzít zpět.`)) return
    setActionLoading(true)
    try {
      const { error } = await supabase.from('frames').delete().eq('anime_id', newFrame.anime_id)
      if (error) throw error
      showAlert('success', `Série ${seriesTitle} byla úspěšně smazána.`)
      
      setLocalAnimes(prev => prev.filter(a => a.id !== newFrame.anime_id))
      setNewFrame(prev => ({ ...prev, anime_id: localAnimes[0]?.id || '', title: localAnimes[0]?.title || '' }))
      
      await loadFrames()
    } catch (err) {
      showAlert('error', err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleMigrateJSON = async () => {
    if (!window.confirm('Nahraje všechny snímky z lokálního frames.json do databáze. Pokračovat?')) return
    setActionLoading(true)
    setAlert(null)
    try {
      const localFrames = await fetchLocalFramesJson()
      const records = localFrames.map(f => ({
        image_url: f.image,
        anime_id:  f.animeId,
        title:     f.title,
        episode:   Number(f.episode),
        part:      Number(f.part),
      }))
      const { error } = await supabase.from('frames').insert(records)
      if (error) throw error
      showAlert('success', `Úspěšně migrováno ${records.length} snímků!`, 5000)
      await loadFrames()
    } catch (err) {
      showAlert('error', `Migrace selhala: ${err.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LOGIN SCREEN
  // ─────────────────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#080611]">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 w-full max-w-md relative overflow-hidden"
        >
          <button onClick={onBack} className="absolute top-4 left-4 p-2 text-white/50 hover:text-white rounded-full bg-white/5">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex justify-center mb-6 mt-4">
            <div className="w-16 h-16 rounded-2xl bg-red-900/30 border border-red-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(220,38,38,0.2)]">
              <Lock className="w-8 h-8 text-red-500" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-center mb-2 uppercase tracking-widest text-white">Admin Přístup</h2>
          <p className="text-white/40 text-sm text-center mb-6">Pro vstup zadej Master Heslo</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="glass-input text-center font-mono tracking-[0.3em] text-lg pr-12"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <AnimatePresence>
              {alert && <Alert type={alert.type}>{alert.message}</Alert>}
            </AnimatePresence>
            <button type="submit" className="btn-primary flex items-center justify-center gap-2">
              <Lock className="w-4 h-4" /> Odemknout Panel
            </button>
          </form>
        </motion.div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ADMIN DASHBOARD
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-20 bg-[#080611]">

      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#0b0c10] border-b border-white/10 px-4 md:px-6 py-4 flex items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 text-white/50 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg md:text-xl font-black uppercase tracking-widest text-red-500">Database Dashboard</h1>
            <p className="text-white/40 text-xs font-semibold">Celkem snímků: {frames.length}</p>
          </div>
        </div>
        <button
          onClick={handleMigrateJSON}
          disabled={actionLoading}
          className="px-3 md:px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/50 text-indigo-300 text-xs md:text-sm font-bold rounded-xl flex items-center gap-2 transition-colors transition-opacity transition-transform disabled:opacity-50"
        >
          {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
          <span className="hidden sm:inline">Migrovat z frames.json</span>
          <span className="sm:hidden">Migrovat</span>
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Left Column: Form ──────────────────────────────────────────── */}
        <div className="lg:col-span-1 space-y-5">

          {/* Global alert */}
          <AnimatePresence>
            {alert && (
              <Alert type={alert.type} onDismiss={() => setAlert(null)}>
                {alert.message}
              </Alert>
            )}
          </AnimatePresence>

          {/* GitHub Config Warning */}
          {githubConfigError && (
            <div className="p-3 rounded-xl border border-amber-900/50 bg-amber-950/30 text-amber-400 text-xs font-semibold flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-bold mb-0.5">GitHub není nakonfigurován</p>
                <p className="text-amber-400/70">{githubConfigError} Přidej hodnoty do .env a restartuj server.</p>
              </div>
            </div>
          )}

          {/* ── GitHub Upload Card ─────────────────────────────────────── */}
          <div className="glass-card p-5">
            <h2 className="text-sm font-black uppercase tracking-widest text-white/60 mb-4 flex items-center gap-2">
              <Github className="w-4 h-4" /> Nahrát obrázek na GitHub
            </h2>

            {/* Drag & Drop Zone */}
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={handleFileDrop}
              onClick={() => !uploadFile && fileInputRef.current?.click()}
              className={`relative rounded-xl border-2 border-dashed transition-colors transition-opacity transition-transform duration-200 overflow-hidden cursor-pointer
                ${uploadFile
                  ? 'border-emerald-500/50 bg-emerald-950/20 cursor-default'
                  : 'border-white/15 bg-white/[0.02] hover:border-white/30 hover:bg-white/[0.04]'
                }`}
            >
              {uploadPreviewUrl ? (
                <div className="relative">
                  <img
                    src={uploadPreviewUrl}
                    alt="preview"
                    className="w-full h-40 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-bold truncate">{uploadFile?.name}</p>
                      <p className="text-white/50 text-[10px]">
                        {uploadFile ? (uploadFile.size / 1024).toFixed(0) + ' KB' : ''}
                      </p>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); clearUpload() }}
                      className="ml-2 w-7 h-7 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/80 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 py-8 px-4 text-center">
                  <FolderOpen className="w-8 h-8 text-white/20" />
                  <p className="text-white/40 text-xs font-semibold">Přetáhni sem obrázek<br />nebo klikni pro výběr</p>
                  <p className="text-white/20 text-[10px]">JPG · PNG · WebP · max. 10 MB</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Subfolder input */}
            <div className="mt-3">
              <label className="block text-[10px] font-bold text-white/30 uppercase tracking-wider mb-1.5">
                Podsložka v repozitáři (volitelné)
              </label>
              <input
                type="text"
                value={uploadSubfolder}
                onChange={e => setUploadSubfolder(e.target.value)}
                placeholder="např. jojo/part3"
                className="glass-input text-sm py-2"
              />
              <p className="text-white/20 text-[10px] mt-1 font-mono break-all">
                → public/obrazky/{uploadSubfolder || '<soubor>'}/...
              </p>
            </div>

            {/* Upload Button */}
            <motion.button
              onClick={handleUploadToGithub}
              disabled={!uploadFile || uploading || !!githubConfigError}
              whileHover={uploadFile && !uploading ? { scale: 1.02 } : {}}
              whileTap={uploadFile && !uploading ? { scale: 0.98 } : {}}
              className="mt-3 w-full py-2.5 rounded-xl bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 border border-white/10 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors transition-opacity transition-transform disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
            >
              {uploading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Nahrávám na GitHub…</>
                : <><Github className="w-4 h-4" /> Nahrát na GitHub</>
              }
            </motion.button>
          </div>

          {/* ── Add Frame Form ─────────────────────────────────────────── */}
          <div className="glass-card p-5">
            <h2 className="text-sm font-black uppercase tracking-widest text-white/60 mb-4 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-red-400" /> Přidat snímek do databáze
            </h2>

            <form onSubmit={handleAddFrame} className="space-y-4">
              {/* Image URL */}
              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">
                  Image URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newFrame.image_url}
                    onChange={e => setNewFrame(prev => ({ ...prev, image_url: e.target.value }))}
                    className="glass-input text-sm flex-1 min-w-0"
                    placeholder="https://raw.githubusercontent.com/..."
                  />
                  {newFrame.image_url && (
                    <button
                      type="button"
                      onClick={() => setNewFrame(prev => ({ ...prev, image_url: '' }))}
                      className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-white/20 text-[10px] mt-1">
                  {newFrame.image_url ? '✓ URL nastavena' : 'Nejprve nahraj obrázek výše ↑, nebo vlož URL ručně'}
                </p>
              </div>

              {/* Anime Series */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider">
                    Anime Série
                  </label>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={handleAddNewSeries} className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-wider">
                      + Vytvořit novou sérii
                    </button>
                    <button type="button" onClick={handleDeleteSeries} disabled={actionLoading || !newFrame.anime_id} className="text-[10px] font-bold text-red-500 hover:text-red-400 uppercase tracking-wider disabled:opacity-30 flex items-center gap-1">
                      <Trash2 className="w-3 h-3" /> Smazat sérii
                    </button>
                  </div>
                </div>
                <select value={newFrame.anime_id} onChange={handleAnimeChange} className="glass-input text-sm">
                  {localAnimes.map(({ id, title }) => (
                    <option key={id} value={id}>{title}</option>
                  ))}
                </select>
              </div>

              {/* Part + Episode */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Part</label>
                  <input
                    required type="number" min="1"
                    value={newFrame.part}
                    onChange={e => setNewFrame(prev => ({ ...prev, part: e.target.value }))}
                    className="glass-input text-sm" placeholder="1"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Epizoda</label>
                  <input
                    required type="number" min="1"
                    value={newFrame.episode}
                    onChange={e => setNewFrame(prev => ({ ...prev, episode: e.target.value }))}
                    className="glass-input text-sm" placeholder="12"
                  />
                </div>
              </div>
              <div className="mb-5">
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Název epizody / dílu (volitelné)</label>
                <input
                  type="text"
                  value={newFrame.episode_name}
                  onChange={e => setNewFrame(prev => ({ ...prev, episode_name: e.target.value }))}
                  className="glass-input text-sm" placeholder="Např. Phantom Blood"
                />
              </div>

              <motion.button
                type="submit"
                disabled={actionLoading}
                whileHover={!actionLoading ? { scale: 1.02 } : {}}
                whileTap={!actionLoading ? { scale: 0.98 } : {}}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-sm"
              >
                {actionLoading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Ukládám…</>
                  : <><Save className="w-4 h-4" /> Uložit do databáze</>
                }
              </motion.button>
            </form>
          </div>

          {/* Live Preview */}
          <div className="glass-card p-5">
            <h2 className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-3">Živý Náhled</h2>
            <div className="pointer-events-none">
              <FrameViewer
                frame={newFrame.image_url
                  ? { image: newFrame.image_url, title: newFrame.title, part: newFrame.part || '?', episode: newFrame.episode || '?' }
                  : null
                }
                revealed={true}
              />
            </div>
          </div>
        </div>

        {/* ── Right Column: Table ────────────────────────────────────────── */}
        <div className="lg:col-span-2">
          <div className="glass-card overflow-hidden">
            <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-widest text-white/50">Snímky v databázi</h2>
              <button
                onClick={loadFrames}
                disabled={loading}
                className="text-xs text-white/30 hover:text-white/60 font-semibold transition-colors flex items-center gap-1.5"
              >
                {loading && <Loader2 className="w-3 h-3 animate-spin" />}
                Obnovit
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-white/5 text-white/40 uppercase tracking-wider text-[10px] border-b border-white/10">
                  <tr>
                    <th className="px-5 py-3 font-bold">Obrázek</th>
                    <th className="px-5 py-3 font-bold">Série</th>
                    <th className="px-5 py-3 font-bold">Part / Ep</th>
                    <th className="px-5 py-3 font-bold text-right">Akce</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <tr><td colSpan="4" className="px-5 py-12 text-center text-white/40">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                    </td></tr>
                  ) : frames.length === 0 ? (
                    <tr><td colSpan="4" className="px-5 py-12 text-center text-white/30 text-sm">
                      Žádné snímky v databázi. Přidej první výše ↑
                    </td></tr>
                  ) : frames.map(f => (
                    <tr key={f.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-5 py-3">
                        <div className="w-20 h-11 rounded-lg bg-black/50 overflow-hidden border border-white/10">
                          <img src={f.image_url} alt="" className="w-full h-full object-cover" loading="lazy"
                            onError={e => { e.target.style.display = 'none' }} />
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-semibold text-white/80 text-sm truncate max-w-[180px]">{f.title}</p>
                        {f.episode_name && (
                          <p className="text-white/50 text-xs truncate max-w-[180px]">{f.episode_name}</p>
                        )}
                        <p className="text-white/30 text-[10px] mt-0.5 font-mono">{f.anime_id}</p>
                      </td>
                      <td className="px-5 py-3 text-white/50">
                        <span className="font-mono bg-white/5 px-2 py-1 rounded text-xs">
                          P{f.part} · E{f.episode}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => handleDelete(f.id)}
                          disabled={actionLoading}
                          className="p-2 text-red-500/50 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-30"
                          title="Smazat snímek"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
