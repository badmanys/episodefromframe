import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Lock, Save, Trash2, UploadCloud, Image as ImageIcon, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import { fetchLocalFramesJson, ANIME_NAMES } from '../lib/frames.js'
import FrameViewer from './FrameViewer.jsx'

export default function AdminScreen({ onBack }) {
  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  
  const [frames, setFrames] = useState([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // New Frame Form
  const [newFrame, setNewFrame] = useState({
    image_url: '',
    anime_id: 'jojo',
    title: "JoJo's Bizarre Adventure",
    episode: '',
    part: ''
  })

  // Load frames when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadFrames()
    }
  }, [isAuthenticated])

  const loadFrames = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase.from('frames').select('*').order('created_at', { ascending: false })
      if (error) throw error
      setFrames(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = (e) => {
    e.preventDefault()
    if (password === import.meta.env.VITE_ADMIN_PASSWORD) {
      setIsAuthenticated(true)
    } else {
      setError('Neplatné master heslo.')
      setTimeout(() => setError(null), 3000)
    }
  }

  const handleAnimeChange = (e) => {
    const id = e.target.value
    setNewFrame(prev => ({
      ...prev,
      anime_id: id,
      title: ANIME_NAMES[id] || id
    }))
  }

  const handleAddFrame = async (e) => {
    e.preventDefault()
    setActionLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const { error } = await supabase.from('frames').insert([{
        image_url: newFrame.image_url,
        anime_id: newFrame.anime_id,
        title: newFrame.title,
        episode: Number(newFrame.episode),
        part: Number(newFrame.part)
      }])
      if (error) throw error
      setSuccess('Snímek úspěšně přidán!')
      setNewFrame(prev => ({ ...prev, image_url: '', episode: '', part: '' }))
      await loadFrames()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err.message)
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
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleMigrateJSON = async () => {
    if (!window.confirm('Tato akce nahraje všechny snímky z lokálního frames.json do databáze. Pokračovat?')) return
    setActionLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const localFrames = await fetchLocalFramesJson()
      const recordsToInsert = localFrames.map(f => ({
        image_url: f.image,
        anime_id: f.animeId,
        title: f.title,
        episode: Number(f.episode),
        part: Number(f.part)
      }))
      
      const { error } = await supabase.from('frames').insert(recordsToInsert)
      if (error) throw error
      
      setSuccess(`Úspěšně migrováno ${recordsToInsert.length} snímků!`)
      await loadFrames()
    } catch (err) {
      setError(`Migrace selhala: ${err.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 w-full max-w-md relative overflow-hidden">
          <button onClick={onBack} className="absolute top-4 left-4 p-2 text-white/50 hover:text-white rounded-full bg-white/5"><ArrowLeft className="w-5 h-5"/></button>
          <div className="flex justify-center mb-6 mt-4">
            <div className="w-16 h-16 rounded-2xl bg-red-900/30 border border-red-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(220,38,38,0.2)]">
              <Lock className="w-8 h-8 text-red-500" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-center mb-2 uppercase tracking-widest text-white">Admin Přístup</h2>
          <p className="text-white/40 text-sm text-center mb-6">Pro vstup zadej Master Heslo</p>
          
          <form onSubmit={handleLogin} className="space-y-4 relative z-10">
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="••••••••" 
              className="glass-input text-center font-mono tracking-[0.3em] text-lg"
              autoFocus
            />
            {error && <p className="text-red-400 text-sm font-semibold text-center">{error}</p>}
            <button type="submit" className="btn-primary flex items-center justify-center gap-2">
              <Lock className="w-4 h-4" /> Odemknout Panel
            </button>
          </form>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Admin Header */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 text-white/50 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5"/>
          </button>
          <div>
            <h1 className="text-xl font-black uppercase tracking-widest text-red-500">Database Dashboard</h1>
            <p className="text-white/40 text-xs font-semibold">Celkem snímků: {frames.length}</p>
          </div>
        </div>
        <button 
          onClick={handleMigrateJSON}
          disabled={actionLoading}
          className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/50 text-indigo-300 text-sm font-bold rounded-xl flex items-center gap-2 transition-all disabled:opacity-50"
        >
          {actionLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <UploadCloud className="w-4 h-4"/>}
          Migrovat z frames.json
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><ImageIcon className="w-5 h-5 text-red-400"/> Přidat nový snímek</h2>
            
            {(error || success) && (
              <div className={`p-3 mb-4 rounded-lg border text-sm font-semibold flex items-center gap-2 ${error ? 'bg-red-950/50 border-red-900/50 text-red-400' : 'bg-emerald-950/50 border-emerald-900/50 text-emerald-400'}`}>
                {error ? <AlertTriangle className="w-4 h-4"/> : <CheckCircle2 className="w-4 h-4"/>}
                {error || success}
              </div>
            )}

            <form onSubmit={handleAddFrame} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-1.5">Image URL</label>
                <input required type="url" value={newFrame.image_url} onChange={e => setNewFrame(prev => ({...prev, image_url: e.target.value}))} className="glass-input text-sm" placeholder="https://..." />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-1.5">Anime Série</label>
                <select value={newFrame.anime_id} onChange={handleAnimeChange} className="glass-input text-sm">
                  {Object.entries(ANIME_NAMES).map(([id, name]) => (
                    <option key={id} value={id}>{name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-1.5">Part</label>
                  <input required type="number" min="1" value={newFrame.part} onChange={e => setNewFrame(prev => ({...prev, part: e.target.value}))} className="glass-input text-sm" placeholder="1" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-1.5">Epizoda</label>
                  <input required type="number" min="1" value={newFrame.episode} onChange={e => setNewFrame(prev => ({...prev, episode: e.target.value}))} className="glass-input text-sm" placeholder="12" />
                </div>
              </div>

              <button type="submit" disabled={actionLoading} className="btn-primary w-full mt-4 flex items-center justify-center gap-2 py-3 text-sm">
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} Uložit do databáze
              </button>
            </form>
          </div>

          {/* Live Preview */}
          <div className="glass-card p-6">
            <h2 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-4">Živý Náhled (Preview)</h2>
            <div className="pointer-events-none">
              <FrameViewer 
                frame={newFrame.image_url ? { image: newFrame.image_url, title: newFrame.title, part: newFrame.part || '?', episode: newFrame.episode || '?' } : null}
                revealed={true} 
              />
            </div>
          </div>
        </div>

        {/* Table Column */}
        <div className="lg:col-span-2">
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-white/5 text-white/40 uppercase tracking-wider text-xs border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 font-bold">Obrázek</th>
                    <th className="px-6 py-4 font-bold">Série</th>
                    <th className="px-6 py-4 font-bold">Part/Ep</th>
                    <th className="px-6 py-4 font-bold text-right">Akce</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <tr><td colSpan="4" className="px-6 py-12 text-center text-white/40"><Loader2 className="w-6 h-6 animate-spin mx-auto"/></td></tr>
                  ) : frames.length === 0 ? (
                    <tr><td colSpan="4" className="px-6 py-12 text-center text-white/40">Zatím žádné snímky v databázi.</td></tr>
                  ) : (
                    frames.map(f => (
                      <tr key={f.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-6 py-3">
                          <div className="w-16 h-9 rounded bg-black/50 overflow-hidden border border-white/10 relative">
                            <img src={f.image_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                          </div>
                        </td>
                        <td className="px-6 py-3 font-semibold text-white/80">{f.title}</td>
                        <td className="px-6 py-3 text-white/50">
                          <span className="font-mono bg-white/5 px-2 py-1 rounded text-xs">P{f.part} E{f.episode}</span>
                        </td>
                        <td className="px-6 py-3 text-right">
                          <button onClick={() => handleDelete(f.id)} disabled={actionLoading} className="p-2 text-red-500/50 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-50">
                            <Trash2 className="w-4 h-4"/>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
