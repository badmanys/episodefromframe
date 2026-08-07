import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy, Infinity, Users, ChevronRight,
  Copy, Check, Hash, LogIn,
} from 'lucide-react'
import bannerImg from './episodefromframebanner.png'

// ── Multiplayer expandable panel ─────────────────────────────────────────────

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

function MultiplayerPanel({ onJoin }) {
  const [roomCode,   setRoomCode]   = useState('')
  const [generated,  setGenerated]  = useState('')
  const [copied,     setCopied]     = useState(false)

  const handleCreate = () => { setGenerated(generateRoomCode()); setCopied(false) }

  const handleCopy = () => {
    navigator.clipboard.writeText(generated).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
      className="overflow-hidden"
    >
      <div className="pt-4 mt-4 border-t border-white/10 space-y-4">
        {/* Create */}
        <div>
          <p className="text-[11px] text-white/30 uppercase tracking-wider font-medium mb-2">Vytvořit místnost</p>
          {generated ? (
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10">
                <Hash className="w-4 h-4 text-teal-400 flex-shrink-0" />
                <span className="font-mono font-bold text-white tracking-widest">{generated}</span>
              </div>
              <motion.button onClick={handleCopy} whileTap={{ scale: 0.95 }}
                className={`px-3 rounded-xl border text-sm font-medium flex items-center gap-1.5 transition-all
                  ${copied ? 'bg-teal-600/30 border-teal-500/40 text-teal-400' : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'}`}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Zkopírováno' : 'Kopírovat'}
              </motion.button>
            </div>
          ) : (
            <motion.button onClick={handleCreate} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="w-full py-2.5 rounded-xl bg-teal-600/20 border border-teal-500/25
                         text-teal-300 text-sm font-semibold hover:bg-teal-600/30 transition-colors">
              Vygenerovat kód místnosti
            </motion.button>
          )}
        </div>
        {/* Join */}
        <div>
          <p className="text-[11px] text-white/30 uppercase tracking-wider font-medium mb-2">Připojit se</p>
          <div className="flex gap-2">
            <input
              type="text" value={roomCode}
              onChange={e => setRoomCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="Zadej kód místnosti…"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5
                         text-white placeholder-white/25 font-mono tracking-widest uppercase
                         focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500/40
                         transition-all placeholder:normal-case placeholder:tracking-normal"
              maxLength={6}
            />
            <motion.button
              onClick={() => roomCode.length === 6 && onJoin(roomCode)}
              disabled={roomCode.length !== 6}
              whileHover={roomCode.length === 6 ? { scale: 1.02 } : {}}
              whileTap={roomCode.length === 6 ? { scale: 0.97 } : {}}
              className="px-4 rounded-xl bg-white/10 border border-white/10 text-white text-sm
                         font-semibold disabled:opacity-30 disabled:cursor-not-allowed
                         hover:bg-white/15 transition-colors flex items-center gap-1.5"
            >
              <LogIn className="w-4 h-4" /> Vstoupit
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ── Mode data ─────────────────────────────────────────────────────────────────

const MODES = [
  {
    id: 'classic',
    Icon: Trophy,
    badge: '5 kol',
    title: 'Klasický mód',
    desc: '5 kol s vybraným anime. Nasbírej co nejvíce bodů!',
    accent: {
      icon: 'bg-violet-600',
      arrow: 'bg-violet-600',
      glow: 'hover:shadow-violet-600/20',
      border: 'hover:border-violet-500/35',
      badge: 'bg-violet-600/30 text-violet-300 border-violet-500/30',
    },
  },
  {
    id: 'endless',
    Icon: Infinity,
    badge: 'Hardcore',
    title: 'Endless Hardcore',
    desc: 'Nekonečná série. Jedna jediná chyba a začínáš od nuly!',
    accent: {
      icon: 'bg-orange-500',
      arrow: 'bg-orange-500',
      glow: 'hover:shadow-orange-500/20',
      border: 'hover:border-orange-500/35',
      badge: 'bg-orange-500/25 text-orange-300 border-orange-500/30',
    },
  },
  {
    id: 'multiplayer',
    Icon: Users,
    badge: '1v1',
    title: '1v1 Souboj',
    desc: 'Vyzvi kámoše na souboj v reálném čase přes odkaz!',
    accent: {
      icon: 'bg-teal-500',
      arrow: 'bg-teal-500',
      glow: 'hover:shadow-teal-500/20',
      border: 'hover:border-teal-500/35',
      badge: 'bg-teal-500/25 text-teal-300 border-teal-500/30',
    },
  },
]

// ── Mode card / button ────────────────────────────────────────────────────────

function ModeButton({ mode, index, selectedAnimeId, onStart, onJoin }) {
  const [expanded, setExpanded] = useState(false)
  const { Icon, badge, title, desc, accent, id } = mode

  const handleClick = () => {
    if (id === 'multiplayer') { setExpanded(e => !e); return }
    onStart(id, selectedAnimeId)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 + index * 0.08, duration: 0.4, ease: 'easeOut' }}
    >
      <motion.div
        whileHover={{ scale: 1.012, y: -1 }}
        transition={{ duration: 0.18 }}
        className={`
          relative overflow-hidden rounded-2xl border border-white/8
          bg-white/[0.04] backdrop-blur-md
          shadow-lg hover:shadow-xl transition-all duration-300
          ${accent.glow} ${accent.border}
        `}
      >
        {/* Main row */}
        <button
          onClick={handleClick}
          id={`btn-mode-${id}`}
          className="w-full flex items-center gap-4 px-5 py-4 text-left"
        >
          {/* Icon circle */}
          <div className={`w-12 h-12 rounded-xl ${accent.icon} flex items-center justify-center flex-shrink-0 shadow-lg`}>
            <Icon className="w-6 h-6 text-white" strokeWidth={1.8} />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <span className="text-white font-bold text-base leading-tight">{title}</span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${accent.badge}`}>
                {badge}
              </span>
            </div>
            <p className="text-white/40 text-sm leading-snug">{desc}</p>
          </div>

          {/* Arrow circle */}
          <div className={`w-9 h-9 rounded-full ${accent.arrow} flex items-center justify-center flex-shrink-0
                           shadow-md transition-transform duration-200 ${expanded && id === 'multiplayer' ? 'rotate-90' : ''}`}>
            <ChevronRight className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
        </button>

        {/* Multiplayer expansion */}
        {id === 'multiplayer' && (
          <AnimatePresence>
            {expanded && (
              <div className="px-5 pb-5">
                <MultiplayerPanel onJoin={onJoin} />
              </div>
            )}
          </AnimatePresence>
        )}

        {/* Subtle inner top highlight */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      </motion.div>
    </motion.div>
  )
}

// ── Anime selector pills ──────────────────────────────────────────────────────

function AnimePicker({ animes, value, onChange }) {
  if (!animes.length) return null
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {animes.map((a, i) => (
        <motion.button
          key={a.id}
          onClick={() => onChange(a.id)}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.08 + i * 0.04 }}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-200
            ${value === a.id
              ? 'bg-violet-600/40 border-violet-400/60 text-white shadow-lg shadow-violet-500/20'
              : 'bg-white/5 border-white/10 text-white/45 hover:text-white hover:border-white/25 hover:bg-white/10'
            }`}
        >
          {a.title}
        </motion.button>
      ))}
    </div>
  )
}

// ── Main Homepage ─────────────────────────────────────────────────────────────

export default function Homepage({ animes, onStart, onJoin }) {
  const [selectedAnimeId, setSelectedAnimeId] = useState(
    animes.length > 0 ? animes[0].id : 'jojo'
  )

  return (
    <div className="min-h-screen bg-[#080611] font-sans relative overflow-hidden">

      {/* ── Deep-void radial gradient background ──────────────────────────── */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% -10%, rgba(109,40,217,0.22) 0%, transparent 70%),
            radial-gradient(ellipse 50% 40% at 80% 80%, rgba(30,27,75,0.4) 0%, transparent 60%),
            radial-gradient(ellipse 40% 30% at 10% 90%, rgba(15,10,50,0.5) 0%, transparent 60%)
          `,
        }}
      />

      {/* Subtle grid pattern */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* ── Content ──────────────────────────────────────────────────────────── */}
      {/* pt-14 accounts for the fixed TopBanner (56px) */}
      <div className="relative z-10 max-w-lg mx-auto px-4 pt-6 pb-16 flex flex-col min-h-[calc(100vh-56px)]">

        {/* ── Banner logo ──────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="flex justify-center mb-8 mt-2"
        >
          <div
            className="relative"
            style={{
              filter: 'drop-shadow(0 0 28px rgba(139,92,246,0.55)) drop-shadow(0 0 60px rgba(109,40,217,0.35))',
            }}
          >
            <img
              src={bannerImg}
              alt="episodefromframe"
              className="w-full max-w-[420px] object-contain select-none"
              draggable={false}
            />
          </div>
        </motion.div>

        {/* ── Tagline ──────────────────────────────────────────────────────── */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center text-white/30 text-sm mb-6"
        >
          Uhádni, ze které epizody pochází záběr
        </motion.p>

        {/* ── Anime picker ──────────────────────────────────────────────────── */}
        {animes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22 }}
            className="mb-7"
          >
            <p className="text-center text-[11px] text-white/20 font-semibold uppercase tracking-widest mb-3">
              Vyber anime
            </p>
            <AnimePicker animes={animes} value={selectedAnimeId} onChange={setSelectedAnimeId} />
          </motion.div>
        )}

        {/* ── Mode buttons ─────────────────────────────────────────────────── */}
        <div className="space-y-3 flex-1">
          {MODES.map((mode, i) => (
            <ModeButton
              key={mode.id}
              mode={mode}
              index={i}
              selectedAnimeId={selectedAnimeId}
              onStart={onStart}
              onJoin={onJoin}
            />
          ))}
        </div>

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="text-center text-white/15 text-xs mt-10"
        >
          v0.1.0
        </motion.p>
      </div>
    </div>
  )
}
