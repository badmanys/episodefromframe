import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Users, ChevronRight, LogIn, Plus, Edit2, Play, BookOpen, Calendar } from 'lucide-react'
import { sanitizeRoomCode, checkRateLimit } from '../lib/security.js'
import { playClickSound } from '../lib/audio.js'
import AudioToggle from './AudioToggle.jsx'

// ── Multiplayer panel ─────────────────────────────────────────────────────────
function MultiplayerPanel({ onCreate, onJoin }) {
  const [roomCode,  setRoomCode]  = useState('')
  const [joining,   setJoining]   = useState(false)
  const [creating,  setCreating]  = useState(false)
  const [joinError, setJoinError] = useState('')

  const handleCreate = async () => { 
    playClickSound()
    setCreating(true)
    await onCreate()
    setCreating(false)
  }
  const handleJoin = async () => {
    playClickSound()
    if (roomCode.length !== 6) return
    if (!checkRateLimit('joinRoom')) {
      setJoinError('Zpomal prosím, posíláš příliš mnoho požadavků.')
      return
    }
    setJoining(true); setJoinError('')
    const err = await onJoin(roomCode)
    if (err) setJoinError(err)
    setJoining(false)
  }

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }} className="overflow-hidden"
    >
      <div className="pt-4 mt-4 border-t border-white/10 space-y-4">
        <div>
          <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold mb-2 ml-1">Vytvořit novou místnost</p>
          <motion.button onClick={handleCreate} disabled={creating} whileHover={!creating ? { scale: 1.02 } : {}} whileTap={!creating ? { scale: 0.97 } : {}}
            className="w-full btn-primary flex items-center justify-center gap-2"
            id="btn-create-room"
          >
            {creating ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Vytváření…</> : <><Play className="w-4 h-4 fill-current" />Vytvořit Hru</>}
          </motion.button>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-white/8" />
          <span className="text-[11px] text-white/20 font-medium">nebo</span>
          <div className="flex-1 h-px bg-white/8" />
        </div>
        <div>
          <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold mb-2 ml-1">Připojit se kódem</p>
          <div className="flex gap-2">
            <input type="text" value={roomCode}
              onChange={e => { setRoomCode(sanitizeRoomCode(e.target.value)); setJoinError('') }}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              placeholder="KÓD MÍSTNOSTI"
              className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/20 font-mono tracking-[0.2em] focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-colors transition-opacity transition-transform text-center uppercase"
              maxLength={6} id="input-room-code"
            />
            <motion.button onClick={handleJoin} disabled={roomCode.length !== 6 || joining}
              whileHover={roomCode.length === 6 && !joining ? { scale: 1.02 } : {}} whileTap={roomCode.length === 6 && !joining ? { scale: 0.97 } : {}}
              className="btn-ghost flex items-center justify-center min-w-[80px]"
              id="btn-join-room"
            >
              {joining ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <LogIn className="w-5 h-5" />}
            </motion.button>
          </div>
          {joinError && <p className="text-red-400 text-xs mt-2 pl-1 font-semibold">{joinError}</p>}
        </div>
      </div>
    </motion.div>
  )
}

const MODES = [
  {
    id: 'classic', Icon: Trophy, badge: '5 kol', title: 'Klasický mód', desc: 'Samostatná hra na 5 kol. Uhodni anime!',
    accent: { icon: 'bg-red-700/20 border border-red-500/30 text-red-500', arrow: 'bg-red-500/20 text-red-400', glowShadow: 'shadow-[0_0_30px_rgba(220,38,38,0.15)]', border: 'group-hover:border-red-500/30', badge: 'bg-red-950/50 text-red-400 border-red-900/50' },
  },
  {
    id: 'multiplayer', Icon: Users, badge: 'PvP', title: 'Multiplayer', desc: 'Založ místnost a vyzvi přátele na souboj.',
    accent: { icon: 'bg-amber-600/20 border border-amber-500/30 text-amber-500', arrow: 'bg-amber-500/20 text-amber-400', glowShadow: 'shadow-[0_0_30px_rgba(245,158,11,0.15)]', border: 'group-hover:border-amber-500/30', badge: 'bg-amber-950/50 text-amber-400 border-amber-900/50' },
  },
  {
    id: 'daily', Icon: Calendar, badge: 'Již brzy...', title: 'Denní Výzva', desc: 'Jeden společný obrázek denně pro všechny.',
    accent: { icon: 'bg-gray-700/20 border border-gray-600/30 text-gray-500', arrow: 'bg-gray-700/20 text-gray-600', glowShadow: '', border: 'border-white/5', badge: 'bg-gray-900/50 text-gray-400 border-gray-800/50' },
    disabled: true,
  },
]

// ── Mode button ───────────────────────────────────────────────────────────────
function ModeButton({ mode, index, onStart, onCreate, onJoin }) {
  const [expanded, setExpanded] = useState(false)
  const { Icon, badge, title, desc, accent, id } = mode
  const handleClick = () => { 
    playClickSound()
    if (id === 'multiplayer') { setExpanded(e => !e); return } 
    onStart(id) 
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 + index * 0.08, duration: 0.4, ease: 'easeOut' }}>
      <motion.div whileHover={{ scale: 1.012, y: -1 }} transition={{ duration: 0.18 }}
        className={`group relative overflow-hidden rounded-2xl border border-white/8 bg-[#1a1d2d]/40 shadow-lg transition-colors transform-gpu duration-300 ${accent.border}`}
      >
        {/* Shadow glow layer animated ONLY via opacity for 60fps performance */}
        {!mode.disabled && <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity transform-gpu duration-300 pointer-events-none rounded-2xl ${accent.glowShadow}`} />}
        <button disabled={mode.disabled} onClick={handleClick} id={`btn-mode-${id}`} className={`w-full flex items-center gap-4 px-5 py-5 text-left relative z-10 ${mode.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}>
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg ${accent.icon}`}>
            <Icon className="w-7 h-7" strokeWidth={1.5} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <span className="text-white font-bold text-base leading-tight">{title}</span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${accent.badge}`}>{badge}</span>
            </div>
            <p className="text-white/40 text-sm leading-snug">{desc}</p>
          </div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-300 ${accent.arrow} ${expanded && id === 'multiplayer' ? 'rotate-90' : ''}`}>
            <ChevronRight className="w-6 h-6" strokeWidth={2} />
          </div>
        </button>
        {id === 'multiplayer' && (
          <AnimatePresence>
            {expanded && <div className="px-5 pb-5"><MultiplayerPanel onCreate={onCreate} onJoin={onJoin} /></div>}
          </AnimatePresence>
        )}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      </motion.div>
    </motion.div>
  )
}

// ── Profile Widget ──────────────────────────────────────────────────────────────
function ProfileWidget({ nickname, onRequestChangeNickname, onRequestWiki }) {
  if (!nickname) return null

  return (
    <div className="fixed top-4 right-4 md:top-1/2 md:right-auto md:left-6 md:-translate-y-1/2 z-50 pointer-events-none">
      
      {/* ── Mobile View ── */}
      <div className="md:hidden glass-card pointer-events-auto p-2 flex items-center gap-3 shadow-[0_0_20px_rgba(0,0,0,0.5)] border-white/10">
        <div className="flex items-center gap-2 pl-1">
          <div className="w-8 h-8 rounded-full bg-black/50 border border-white/10 flex items-center justify-center relative shadow-inner">
            <Users className="w-4 h-4 text-white/70" />
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#12131a]" />
          </div>
          <span className="text-white font-bold text-xs tracking-wider truncate max-w-[80px]">{nickname}</span>
        </div>
        <div className="flex items-center gap-1.5 border-l border-white/10 pl-3">
          <AudioToggle className="w-8 h-8 !rounded-lg" />
          <button 
            onClick={() => { playClickSound(); onRequestChangeNickname(); }}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-white/50 hover:text-white transition-colors transition-opacity transition-transform flex items-center justify-center shadow-md"
            title="Upravit profil"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        </div>
        
        {/* Mobile Wiki Button */}
        <div className="w-full mt-2 pt-2 border-t border-white/5">
          <button 
            onClick={() => { playClickSound(); onRequestWiki(); }}
            className="w-full py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 transition-colors transition-opacity transition-transform text-[10px] font-bold tracking-widest uppercase flex items-center justify-center gap-1.5 shadow-[0_0_10px_rgba(220,38,38,0.1)]"
          >
            <BookOpen className="w-3.5 h-3.5" /> Herní Wiki / Pravidla
          </button>
        </div>
      </div>

      {/* ── Desktop View ── */}
      <div className="hidden md:flex glass-card pointer-events-auto p-4 flex-col items-center gap-3 relative overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.8)] border-white/5 w-36">
        
        {/* Svítící linka nahoře */}
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-70" />
        
        <div className="relative mt-2">
          <div className="w-14 h-14 rounded-full bg-black/50 border border-white/10 flex items-center justify-center shadow-inner relative z-10">
            <Users className="w-6 h-6 text-white/70" />
            {/* Online indikátor */}
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#12131a] shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
          </div>
        </div>

        <div className="text-center w-full px-2 mb-2">
          <p className="text-white/30 text-[9px] uppercase tracking-[0.2em] font-black mb-1">Hráč</p>
          <p className="text-white font-bold text-sm tracking-wider truncate w-full">{nickname}</p>
        </div>

        <div className="flex gap-2 w-full mt-1">
          <AudioToggle className="flex-1" />
          <button 
            onClick={() => { playClickSound(); onRequestChangeNickname(); }}
            className="flex-[2] py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-white/50 hover:text-white transition-colors transition-opacity transition-transform text-xs font-semibold flex items-center justify-center gap-2 shadow-lg"
            title="Upravit profil"
          >
            <Edit2 className="w-3 h-3" /> Upravit
          </button>
        </div>
        
        {/* Desktop Wiki Button */}
        <div className="w-full mt-1">
          <button 
            onClick={() => { playClickSound(); onRequestWiki(); }}
            className="w-full py-2 rounded-xl bg-gradient-to-r from-red-950/80 to-red-900/40 hover:from-red-900/80 hover:to-red-800/60 border border-red-500/30 text-red-400 hover:text-red-300 transition-colors transition-opacity transition-transform text-[9px] font-black tracking-widest uppercase flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(220,38,38,0.15)]"
          >
            <BookOpen className="w-3.5 h-3.5" /> Herní Wiki
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Homepage ─────────────────────────────────────────────────────────────
export default function Homepage({ onStart, onCreate, onJoin, nickname, onRequestChangeNickname, onRequestWiki }) {
  return (
    <div className="min-h-screen bg-[#090a0f] font-sans relative overflow-hidden">
      <div className="bg-film-grain" />
      <div className="fixed inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse 60% 50% at 50% 0%, rgba(220,38,38,0.08) 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 50% 100%, rgba(220,38,38,0.05) 0%, transparent 60%)` }} />
      <div className="fixed inset-0 pointer-events-none opacity-20" style={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
      
      <ProfileWidget nickname={nickname} onRequestChangeNickname={onRequestChangeNickname} onRequestWiki={onRequestWiki} />

      <div className="relative z-10 max-w-lg mx-auto px-4 pt-16 pb-16 flex flex-col min-h-screen">
        <motion.div initial={{ opacity: 0, y: -20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} className="flex flex-col items-center justify-center mb-12 mt-4">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 tracking-tighter uppercase drop-shadow-[0_0_30px_rgba(220,38,38,0.5)] text-center leading-none mb-2">
            Anime Frame<br/><span className="text-red-500 drop-shadow-[0_0_20px_rgba(220,38,38,0.8)]">Guesser</span>
          </h1>
          <p className="text-white/40 text-sm tracking-[0.3em] font-bold uppercase">Dokážeš uhodnout epizodu?</p>
        </motion.div>
        
        <div className="space-y-4 flex-1">
          {MODES.map((mode, i) => <ModeButton key={mode.id} mode={mode} index={i} onStart={onStart} onCreate={onCreate} onJoin={onJoin} />)}
        </div>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="text-center text-white/20 text-[10px] tracking-widest uppercase mt-12 font-bold">Verze 0.2.0 • Cinematic Update</motion.p>
      </div>
    </div>
  )
}
