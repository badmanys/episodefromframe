import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Users, ChevronRight, LogIn, Plus } from 'lucide-react'
import bannerImg from './episodefromframebanner.png'

// ── Multiplayer panel ─────────────────────────────────────────────────────────
function MultiplayerPanel({ onCreate, onJoin }) {
  const [roomCode,  setRoomCode]  = useState('')
  const [joining,   setJoining]   = useState(false)
  const [creating,  setCreating]  = useState(false)
  const [joinError, setJoinError] = useState('')

  const handleCreate = async () => { setCreating(true); await onCreate(); setCreating(false) }
  const handleJoin = async () => {
    if (roomCode.length !== 6) return
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
          <p className="text-[11px] text-white/30 uppercase tracking-wider font-medium mb-2">Vytvořit novou místnost</p>
          <motion.button onClick={handleCreate} disabled={creating} whileHover={!creating ? { scale: 1.02 } : {}} whileTap={!creating ? { scale: 0.97 } : {}}
            className="w-full py-2.5 rounded-xl bg-teal-600/20 border border-teal-500/25 text-teal-300 text-sm font-semibold hover:bg-teal-600/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            id="btn-create-room"
          >
            {creating ? <><span className="w-4 h-4 border-2 border-teal-400/30 border-t-teal-400 rounded-full animate-spin" />Vytváření…</> : <><Plus className="w-4 h-4" />Vytvořit novou místnost</>}
          </motion.button>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-white/8" />
          <span className="text-[11px] text-white/20 font-medium">nebo</span>
          <div className="flex-1 h-px bg-white/8" />
        </div>
        <div>
          <p className="text-[11px] text-white/30 uppercase tracking-wider font-medium mb-2">Připojit se kódem</p>
          <div className="flex gap-2">
            <input type="text" value={roomCode}
              onChange={e => { setRoomCode(e.target.value.toUpperCase().slice(0, 6)); setJoinError('') }}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              placeholder="Zadej kód místnosti…"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/25 font-mono tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500/40 transition-all placeholder:normal-case placeholder:tracking-normal"
              maxLength={6} id="input-room-code"
            />
            <motion.button onClick={handleJoin} disabled={roomCode.length !== 6 || joining}
              whileHover={roomCode.length === 6 && !joining ? { scale: 1.02 } : {}} whileTap={roomCode.length === 6 && !joining ? { scale: 0.97 } : {}}
              className="px-4 rounded-xl bg-white/10 border border-white/10 text-white text-sm font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/15 transition-colors flex items-center gap-1.5"
              id="btn-join-room"
            >
              {joining ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <><LogIn className="w-4 h-4" /> Vstoupit</>}
            </motion.button>
          </div>
          {joinError && <p className="text-red-400 text-xs mt-1.5 pl-1">{joinError}</p>}
        </div>
      </div>
    </motion.div>
  )
}

// ── Mode data ─────────────────────────────────────────────────────────────────
const MODES = [
  {
    id: 'classic', Icon: Trophy, badge: '5 kol', title: 'Klasický mód', desc: '5 kol s vybraným anime. Nasbírej co nejvíce bodů!',
    accent: { icon: 'bg-violet-600', arrow: 'bg-violet-600', glow: 'hover:shadow-violet-600/20', border: 'hover:border-violet-500/35', badge: 'bg-violet-600/30 text-violet-300 border-violet-500/30' },
  },
  {
    id: 'multiplayer', Icon: Users, badge: '1v1', title: '1v1 Souboj', desc: 'Vyzvi kámoše na souboj v reálném čase přes odkaz!',
    accent: { icon: 'bg-teal-500', arrow: 'bg-teal-500', glow: 'hover:shadow-teal-500/20', border: 'hover:border-teal-500/35', badge: 'bg-teal-500/25 text-teal-300 border-teal-500/30' },
  },
]

// ── Mode button ───────────────────────────────────────────────────────────────
function ModeButton({ mode, index, onStart, onCreate, onJoin }) {
  const [expanded, setExpanded] = useState(false)
  const { Icon, badge, title, desc, accent, id } = mode
  const handleClick = () => { if (id === 'multiplayer') { setExpanded(e => !e); return } onStart(id) }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 + index * 0.08, duration: 0.4, ease: 'easeOut' }}>
      <motion.div whileHover={{ scale: 1.012, y: -1 }} transition={{ duration: 0.18 }}
        className={`relative overflow-hidden rounded-2xl border border-white/8 bg-white/[0.04] backdrop-blur-md shadow-lg hover:shadow-xl transition-all duration-300 ${accent.glow} ${accent.border}`}
      >
        <button onClick={handleClick} id={`btn-mode-${id}`} className="w-full flex items-center gap-4 px-5 py-4 text-left">
          <div className={`w-12 h-12 rounded-xl ${accent.icon} flex items-center justify-center flex-shrink-0 shadow-lg`}>
            <Icon className="w-6 h-6 text-white" strokeWidth={1.8} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <span className="text-white font-bold text-base leading-tight">{title}</span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${accent.badge}`}>{badge}</span>
            </div>
            <p className="text-white/40 text-sm leading-snug">{desc}</p>
          </div>
          <div className={`w-9 h-9 rounded-full ${accent.arrow} flex items-center justify-center flex-shrink-0 shadow-md transition-transform duration-200 ${expanded && id === 'multiplayer' ? 'rotate-90' : ''}`}>
            <ChevronRight className="w-5 h-5 text-white" strokeWidth={2.5} />
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

// ── Main Homepage ─────────────────────────────────────────────────────────────
export default function Homepage({ onStart, onCreate, onJoin }) {
  return (
    <div className="min-h-screen bg-[#080611] font-sans relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse 80% 50% at 50% -10%, rgba(109,40,217,0.22) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 80% 80%, rgba(30,27,75,0.4) 0%, transparent 60%), radial-gradient(ellipse 40% 30% at 10% 90%, rgba(15,10,50,0.5) 0%, transparent 60%)` }} />
      <div className="fixed inset-0 pointer-events-none opacity-[0.025]" style={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`, backgroundSize: '60px 60px' }} />
      <div className="relative z-10 max-w-lg mx-auto px-4 pt-8 pb-16 flex flex-col min-h-screen">
        <motion.div initial={{ opacity: 0, y: -12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.55, ease: 'easeOut' }} className="flex justify-center mb-10 mt-2">
          <img src={bannerImg} alt="episodefromframe" className="max-w-[500px] w-full h-auto mx-auto object-contain select-none drop-shadow-[0_0_25px_rgba(168,85,247,0.4)]" draggable={false} />
        </motion.div>
        <div className="space-y-3 flex-1">
          {MODES.map((mode, i) => <ModeButton key={mode.id} mode={mode} index={i} onStart={onStart} onCreate={onCreate} onJoin={onJoin} />)}
        </div>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }} className="text-center text-white/15 text-xs mt-10">v0.1.0</motion.p>
      </div>
    </div>
  )
}
