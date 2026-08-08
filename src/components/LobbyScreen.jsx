import { useState, useCallback, useEffect, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Copy, Check, Users, Hash, Play, Clock, Share2, LogOut } from 'lucide-react'
import { playClickSound } from '../lib/audio.js'

export default memo(function LobbyScreen({ roomCode, roomData, role, onCancel, onStartEarly, animes = [], onUpdateSettings }) {
  const [copied, setCopied] = useState(false)
  const [countdown, setCountdown] = useState(null) // null = inaktivní, 3, 2, 1, 0

  const handleCopy = useCallback(() => {
    playClickSound()
    navigator.clipboard.writeText(roomCode).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2200)
  }, [roomCode])

  const handleShare = useCallback(() => {
    playClickSound()
    if (navigator.share) {
      navigator.share({
        title: 'Anime Frame Guesser',
        text: `Připoj se do mé místnosti! Kód: ${roomCode}`,
        url: window.location.href
      }).catch(() => {})
    } else {
      handleCopy()
    }
  }, [roomCode, handleCopy])

  const maxPlayers = roomData?.max_players || 2
  const players = roomData?.players || []
  const isHost = role === 'host' || role === 'player1'
  const isFull = players.length >= maxPlayers
  const canStartEarly = isHost && players.length >= 2 && !isFull && countdown === null

  // Spuštění odpočtu, když je plno
  useEffect(() => {
    if (isFull && countdown === null) {
      setCountdown(3)
    }
  }, [isFull, countdown])

  // Průběh odpočtu
  useEffect(() => {
    if (countdown === null) return
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
      return () => clearTimeout(timer)
    } else if (countdown === 0 && isHost) {
      onStartEarly()
    }
  }, [countdown, isHost, onStartEarly])

  return (
    <div className="min-h-screen bg-[#090a0f] font-sans relative overflow-hidden flex items-center justify-center px-4 py-12">
      <div className="bg-film-grain" />
      {/* Červená vnější záře na pozadí */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-red-900/10 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-8">
          <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="w-20 h-20 rounded-2xl bg-red-950/40 border border-red-500/30 flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(220,38,38,0.2)]">
            {countdown !== null ? (
              <Clock className="w-10 h-10 text-red-500" strokeWidth={1.5} />
            ) : (
              <Users className="w-10 h-10 text-red-500" strokeWidth={1.5} />
            )}
          </motion.div>
          {countdown !== null ? (
            <>
              <h1 className="text-3xl font-black text-white mb-2 tracking-wide uppercase">Hra začíná za</h1>
              <motion.p 
                key={countdown}
                initial={{ opacity: 0, scale: 1.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-red-500 to-orange-400 drop-shadow-[0_0_20px_rgba(220,38,38,0.6)]"
              >
                {countdown}
              </motion.p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-black text-white mb-2 tracking-widest uppercase text-shadow-glow">Lobby</h1>
              <p className="text-white/40 text-xs tracking-wider uppercase font-bold">{isHost ? 'Pošli kód nebo odkaz svým soupeřům' : 'Čeká se na hostitele nebo další hráče...'}</p>
            </>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1, duration: 0.4 }}
          className="glass-card p-8 mb-6 relative overflow-hidden"
        >
          {/* Subtile inner glow */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent opacity-50" />
          
          <p className="text-[10px] text-red-500/80 uppercase tracking-[0.3em] font-black mb-4 flex items-center justify-center gap-2">
            <Hash className="w-3.5 h-3.5" /> Kód místnosti
          </p>
          
          <div className="flex items-center justify-center py-6 rounded-xl bg-black/60 border border-white/5 mb-6 shadow-inner relative overflow-hidden group">
            <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <span className="font-mono font-black text-6xl text-white tracking-[0.2em] select-all drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] ml-3">{roomCode}</span>
          </div>

          <div className="flex gap-3 mb-8">
            <motion.button onClick={handleCopy} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className={`flex-1 py-4 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-colors transition-opacity transition-transform duration-300 shadow-lg
                ${copied 
                  ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]' 
                  : 'bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10 hover:border-red-500/30'}`}
            >
              <AnimatePresence mode="wait">
                {copied
                  ? <motion.span key="copied" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="flex items-center gap-2"><Check className="w-5 h-5 text-green-400" /> Zkopírováno!</motion.span>
                  : <motion.span key="copy" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="flex items-center gap-2"><Copy className="w-5 h-5" /> Zkopírovat kód</motion.span>
                }
              </AnimatePresence>
            </motion.button>
            <motion.button onClick={handleShare} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="w-14 bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 hover:border-red-500/30 rounded-xl flex items-center justify-center shadow-lg transition-colors transition-opacity transition-transform"
              title="Sdílet"
            >
              <Share2 className="w-5 h-5" />
            </motion.button>
          </div>

          {isHost && (
            <div className="border-t border-white/10 pt-6 mb-6">
              <span className="text-white/40 text-[10px] uppercase tracking-widest font-black block mb-4 px-1">Nastavení místnosti</span>
              <div className="space-y-4 px-1">
                <div>
                  <label className="text-white/60 text-xs font-semibold mb-1.5 block">Anime Série</label>
                  <select 
                    value={roomData?.anime_id || 'random'}
                    onChange={(e) => onUpdateSettings && onUpdateSettings({ anime_id: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500/50"
                  >
                    <option value="random">Náhodný mix všech</option>
                    {animes.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                  </select>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-white/60 text-xs font-semibold mb-1.5 block">Počet kol</label>
                    <select
                      value={roomData?.total_rounds || 5}
                      onChange={(e) => onUpdateSettings && onUpdateSettings({ total_rounds: parseInt(e.target.value) })}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500/50"
                    >
                      <option value={2}>2</option>
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={15}>15</option>
                      <option value={20}>20</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-white/60 text-xs font-semibold mb-1.5 block">Max. hráčů</label>
                    <select
                      value={maxPlayers}
                      onChange={(e) => onUpdateSettings && onUpdateSettings({ max_players: parseInt(e.target.value) })}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500/50"
                    >
                      {[2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="border-t border-white/10 pt-6">
            <div className="flex items-center justify-between mb-4 px-1">
              <span className="text-white/40 text-[10px] uppercase tracking-widest font-black">Hráči</span>
              <span className="text-red-400 font-bold bg-red-950/40 border border-red-900/50 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">{players.length} / {maxPlayers}</span>
            </div>
            <div className="space-y-3">
              {players.map((p, idx) => (
                <div key={idx} className="flex items-center gap-4 bg-black/40 border border-white/10 rounded-xl p-3 border-l-4 relative overflow-hidden" style={{ borderLeftColor: idx === 0 ? '#ef4444' : '#6b7280' }}>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent pointer-events-none" />
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center border border-white/5 shadow-inner ${idx === 0 ? 'bg-red-900/30' : 'bg-gray-800/50'}`}>
                    <Users className={`w-5 h-5 ${idx === 0 ? 'text-red-400' : 'text-gray-400'}`} />
                  </div>
                  <span className="text-white font-bold tracking-wide">{p.name}</span>
                  {idx === 0 && <span className="ml-auto text-[10px] text-red-500 font-black uppercase tracking-widest bg-red-950/50 px-2 py-1 rounded">Host</span>}
                </div>
              ))}
              {Array.from({ length: maxPlayers - players.length }).map((_, idx) => (
                <div key={`empty-${idx}`} className="flex items-center gap-4 bg-black/20 border border-white/5 rounded-xl p-3 border-dashed">
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center border border-white/5 shadow-inner">
                    <div className="w-2.5 h-2.5 rounded-full bg-white/20 animate-pulse" />
                  </div>
                  <span className="text-white/30 font-bold uppercase tracking-wider text-xs">Čekání na hráče...</span>
                </div>
              ))}
            </div>
          </div>
          
          {canStartEarly && (
            <motion.button onClick={() => { playClickSound(); onStartEarly(); }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="mt-8 w-full btn-primary flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 fill-current" /> Spustit hru nyní
            </motion.button>
          )}

        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="flex justify-center mt-6">
          <motion.button onClick={() => { playClickSound(); onCancel(); }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className="px-6 py-2.5 rounded-full border border-red-500/10 text-red-400/60 text-sm font-semibold hover:text-red-400 hover:bg-red-950/30 hover:border-red-500/30 transition-colors transition-opacity transition-transform duration-200 flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Opustit hru
          </motion.button>
        </motion.div>

      </div>
    </div>
  )
})
