import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Copy, Check, Users, Hash } from 'lucide-react'

export default function LobbyScreen({ roomCode, role, onCancel }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(roomCode).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2200)
  }, [roomCode])

  return (
    <div className="min-h-screen bg-[#0b0f17] font-sans relative overflow-hidden flex items-center justify-center px-4 py-12">
      {/* Fialová vnější záře na pozadí */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-900/20 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-8">
          <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="w-20 h-20 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(168,85,247,0.3)]">
            <Users className="w-10 h-10 text-purple-400" strokeWidth={1.5} />
          </motion.div>
          <h1 className="text-3xl font-black text-white mb-2">1v1 Souboj</h1>
          <p className="text-white/40 text-sm">{role === 'host' ? 'Pošli kód nebo odkaz svému soupeři' : 'Připojuješ se...'}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1, duration: 0.4 }}
          className="rounded-3xl border border-purple-500/20 bg-[#131124]/80 backdrop-blur-xl p-8 mb-6 shadow-2xl shadow-purple-900/40 relative overflow-hidden"
        >
          {/* Subtile inner glow */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent opacity-50" />
          
          <p className="text-xs text-purple-300/60 uppercase tracking-[0.2em] font-bold mb-4 flex items-center justify-center gap-2">
            <Hash className="w-4 h-4" /> Kód místnosti
          </p>
          
          <div className="flex items-center justify-center py-5 rounded-2xl bg-black/40 border border-purple-500/10 mb-6 shadow-inner">
            <span className="font-mono font-black text-5xl text-purple-200 tracking-[0.15em] select-all">{roomCode}</span>
          </div>

          <motion.button onClick={handleCopy} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className={`w-full py-4 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all duration-300 shadow-lg
              ${copied 
                ? 'bg-purple-600/30 border-purple-500/50 text-purple-200 shadow-purple-900/50' 
                : 'bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10 hover:border-purple-500/30'}`}
          >
            <AnimatePresence mode="wait">
              {copied
                ? <motion.span key="copied" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="flex items-center gap-2"><Check className="w-5 h-5 text-green-400" /> Zkopírováno do schránky!</motion.span>
                : <motion.span key="copy" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="flex items-center gap-2"><Copy className="w-5 h-5" /> Zkopírovat kód místnosti</motion.span>
              }
            </AnimatePresence>
          </motion.button>
        </motion.div>

        {role === 'host' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-center mb-8">
            <motion.p animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }} className="text-purple-300/80 font-medium text-sm flex items-center justify-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
              </span>
              Čekání na připojení druhého hráče...
            </motion.p>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="flex justify-center">
          <motion.button onClick={onCancel} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className="px-6 py-2.5 rounded-full border border-white/10 text-white/40 text-sm font-semibold hover:text-white/80 hover:bg-white/5 hover:border-white/20 transition-all duration-200"
          >
            Zrušit a vrátit se
          </motion.button>
        </motion.div>

      </div>
    </div>
  )
}
