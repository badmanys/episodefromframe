import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Copy, Check, Users, Hash, Wifi, WifiOff, ExternalLink, AlertTriangle } from 'lucide-react'
import { subscribeToRoom } from '../lib/multiplayer.js'
import { supabase, supabaseConfigured } from '../lib/supabase.js'

function WaitingDots() {
  return (
    <span className="inline-flex gap-1 ml-1.5 align-middle">
      {[0, 1, 2].map(i => (
        <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-teal-400 inline-block"
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.22 }}
        />
      ))}
    </span>
  )
}

function SetupGuide() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-amber-500/25 bg-amber-950/15 p-5 mb-4"
    >
      <div className="flex items-start gap-3 mb-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-amber-300 font-semibold text-sm">Supabase není nakonfigurovaný</p>
          <p className="text-white/40 text-xs mt-0.5 leading-relaxed">Pro 1v1 multiplayer je potřeba nastavit Supabase:</p>
        </div>
      </div>
      <ol className="space-y-2 text-xs text-white/50 pl-2">
        <li className="flex gap-2"><span className="text-teal-400 font-bold flex-shrink-0">1.</span>
          <span>Jdi na <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-teal-400 underline hover:text-teal-300 inline-flex items-center gap-0.5">supabase.com/dashboard <ExternalLink className="w-3 h-3" /></a> → Settings → <strong className="text-white/70">API</strong></span>
        </li>
        <li className="flex gap-2"><span className="text-teal-400 font-bold flex-shrink-0">2.</span>
          <span>Zkopíruj <strong className="text-white/70">Project URL</strong> do <code className="text-violet-300 bg-white/5 px-1 rounded">VITE_SUPABASE_URL</code> v <code className="text-violet-300 bg-white/5 px-1 rounded">.env</code></span>
        </li>
        <li className="flex gap-2"><span className="text-teal-400 font-bold flex-shrink-0">3.</span>
          <span>Zkopíruj <strong className="text-white/70">anon key</strong> do <code className="text-violet-300 bg-white/5 px-1 rounded">VITE_SUPABASE_ANON_KEY</code></span>
        </li>
        <li className="flex gap-2"><span className="text-teal-400 font-bold flex-shrink-0">4.</span>
          <span>Spusť SQL z <code className="text-violet-300 bg-white/5 px-1 rounded">supabase/migrations/20240101000000_create_rooms.sql</code> v SQL Editoru</span>
        </li>
        <li className="flex gap-2"><span className="text-teal-400 font-bold flex-shrink-0">5.</span>
          <span>Restart: <code className="text-violet-300 bg-white/5 px-1 rounded">npm run dev</code></span>
        </li>
      </ol>
    </motion.div>
  )
}

export default function Lobby({ roomCode, role, roomData: initialRoomData, onGameStart, onCancel }) {
  const [copied,   setCopied]   = useState(false)
  const [roomData, setRoomData] = useState(initialRoomData)
  const [realtimeError, setRealtimeError] = useState(null)

  const shareText = `Kód: ${roomCode} | ${window.location.origin}${window.location.pathname}?room=${roomCode}`

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(shareText).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2200)
  }, [shareText])

  useEffect(() => {
    if (initialRoomData?.status === 'playing' && initialRoomData?.current_round >= 1) {
      onGameStart(initialRoomData)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!supabaseConfigured) return
    const channel = subscribeToRoom(roomCode, (updated) => {
      setRoomData(updated)
      if (updated.status === 'playing' && updated.current_round >= 1) onGameStart(updated)
    })
    if (!channel) { setRealtimeError('Realtime připojení selhalo.'); return }
    return () => { supabase.removeChannel(channel) }
  }, [roomCode, onGameStart])

  return (
    <div className="min-h-screen bg-[#080611] font-sans relative overflow-hidden flex items-center justify-center px-4 py-12">
      <div className="fixed inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse 70% 50% at 50% -5%, rgba(20,184,166,0.15) 0%, transparent 70%)` }} />
      <div className="relative z-10 w-full max-w-sm">
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="text-center mb-6">
          <motion.div animate={{ scale: [1, 1.07, 1] }} transition={{ duration: 2.4, repeat: Infinity }}
            className="w-16 h-16 rounded-2xl bg-teal-600/20 border border-teal-500/30 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-teal-400" strokeWidth={1.6} />
          </motion.div>
          <h1 className="text-xl font-black text-white mb-1">1v1 Souboj</h1>
          <p className="text-white/35 text-sm">{role === 'host' ? 'Sdílej kód se soupeřem' : 'Připojuješ se jako hráč 2'}</p>
        </motion.div>

        {!supabaseConfigured && <SetupGuide />}

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md p-5 mb-3"
        >
          <p className="text-[11px] text-white/25 uppercase tracking-widest font-semibold mb-3 flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5" /> Kód místnosti
          </p>
          <div className="flex items-center justify-center py-3 rounded-xl bg-teal-950/40 border border-teal-500/20 mb-4">
            <span className="font-mono font-black text-3xl text-teal-300 tracking-[0.3em] select-all">{roomCode}</span>
          </div>
          <motion.button onClick={handleCopy} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} id="btn-copy-room-link"
            className={`w-full py-2.5 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200
              ${copied ? 'bg-teal-600/25 border-teal-500/40 text-teal-300' : 'bg-white/5 border-white/10 text-white/55 hover:text-white hover:bg-white/10 hover:border-white/20'}`}
          >
            <AnimatePresence mode="wait">
              {copied
                ? <motion.span key="copied" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2"><Check className="w-4 h-4" /> Zkopírováno!</motion.span>
                : <motion.span key="copy" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2"><Copy className="w-4 h-4" /> Kopírovat kód + odkaz</motion.span>
              }
            </AnimatePresence>
          </motion.button>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.22 }}
          className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 mb-4"
        >
          {realtimeError
            ? <div className="flex items-start gap-3"><WifiOff className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" /><div><p className="text-red-300 text-sm font-semibold mb-0.5">Chyba Realtime</p><p className="text-white/30 text-xs">{realtimeError}</p></div></div>
            : supabaseConfigured
              ? <div className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <motion.div animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 1.8, repeat: Infinity }} className="absolute inset-0 rounded-full bg-teal-400" />
                    <div className="w-4 h-4 rounded-full bg-teal-500 border-2 border-teal-300 relative z-10" />
                  </div>
                  <div><p className="text-white text-sm font-semibold flex items-center">Čekání na soupeře<WaitingDots /></p><p className="text-white/25 text-xs mt-0.5">Hra začne automaticky po připojení hráče 2</p></div>
                </div>
              : <div className="flex items-center gap-3"><WifiOff className="w-5 h-5 text-white/20 flex-shrink-0" /><p className="text-white/30 text-xs">Realtime není aktivní – nakonfiguruj Supabase</p></div>
          }
        </motion.div>

        {supabaseConfigured && !realtimeError && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="flex items-center justify-center gap-1.5 mb-5">
            <Wifi className="w-3.5 h-3.5 text-teal-500/50" />
            <span className="text-[11px] text-white/15">Supabase Realtime aktivní</span>
          </motion.div>
        )}

        <motion.button onClick={onCancel} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} id="btn-lobby-cancel"
          className="w-full py-2.5 rounded-xl border border-white/8 text-white/25 text-sm font-medium hover:text-white/50 hover:border-white/15 transition-all duration-200"
        >
          Zrušit a vrátit se
        </motion.button>
      </div>
    </div>
  )
}
