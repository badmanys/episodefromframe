import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Infinity, Users, ChevronRight, Copy, Check, Hash, LogIn } from 'lucide-react'

// ── Game mode definitions ────────────────────────────────────────────────────

const MODES = [
  {
    id: 'classic',
    Icon: Trophy,
    badge: '5 kol',
    title: 'Klasický mód',
    description: '5 kol s vybraným anime. Nasbírej co nejvíce bodů!',
    gradient: 'from-indigo-500 to-violet-600',
    glow: 'shadow-indigo-500/20',
    border: 'hover:border-indigo-500/40',
  },
  {
    id: 'endless',
    Icon: Infinity,
    badge: 'Hardcore',
    title: 'Endless Hardcore',
    description: 'Nekonečná série. Jedna jediná chyba a začínáš od nuly!',
    gradient: 'from-red-500 to-orange-500',
    glow: 'shadow-red-500/20',
    border: 'hover:border-red-500/40',
  },
  {
    id: 'multiplayer',
    Icon: Users,
    badge: '1v1',
    title: '1v1 Souboj',
    description: 'Vyzvi kámoše na souboj v reálném čase přes odkaz!',
    gradient: 'from-emerald-500 to-teal-500',
    glow: 'shadow-emerald-500/20',
    border: 'hover:border-emerald-500/40',
  },
]

// ── Room code helper ─────────────────────────────────────────────────────────

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

// ── Anime selector pills ─────────────────────────────────────────────────────

function AnimePicker({ animes, value, onChange }) {
  if (!animes.length) return null
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {animes.map((a, i) => (
        <motion.button
          key={a.id}
          onClick={() => onChange(a.id)}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + i * 0.05 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-200
            ${value === a.id
              ? 'bg-indigo-600/40 border-indigo-400/60 text-white shadow-lg shadow-indigo-500/20'
              : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-white/25 hover:bg-white/10'
            }`}
        >
          {a.title}
        </motion.button>
      ))}
    </div>
  )
}

// ── Multiplayer expandable panel ─────────────────────────────────────────────

function MultiplayerPanel({ onJoin }) {
  const [roomCode, setRoomCode]       = useState('')
  const [generatedCode, setGenerated] = useState('')
  const [copied, setCopied]           = useState(false)

  const handleCreate = () => {
    setGenerated(generateRoomCode())
    setCopied(false)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="overflow-hidden"
    >
      <div className="pt-4 mt-4 border-t border-white/10 space-y-4">

        {/* Create */}
        <div>
          <p className="text-[11px] text-white/35 uppercase tracking-wider font-medium mb-2">Vytvořit místnost</p>
          {generatedCode ? (
            <div className="flex gap-2">
              <div className="flex-1 glass-input flex items-center gap-2 py-2.5">
                <Hash className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="font-mono font-bold text-white tracking-widest">{generatedCode}</span>
              </div>
              <motion.button
                onClick={handleCopy}
                whileTap={{ scale: 0.95 }}
                className={`px-3 rounded-xl border transition-all text-sm font-medium flex items-center gap-1.5
                  ${copied
                    ? 'bg-emerald-600/30 border-emerald-500/40 text-emerald-400'
                    : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
                  }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Zkopírováno' : 'Kopírovat'}
              </motion.button>
            </div>
          ) : (
            <motion.button
              onClick={handleCreate}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="w-full py-2.5 rounded-xl bg-emerald-600/20 border border-emerald-500/25
                         text-emerald-300 text-sm font-semibold hover:bg-emerald-600/30 transition-colors"
            >
              Vygenerovat kód místnosti
            </motion.button>
          )}
        </div>

        {/* Join */}
        <div>
          <p className="text-[11px] text-white/35 uppercase tracking-wider font-medium mb-2">Připojit se</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={roomCode}
              onChange={e => setRoomCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="Zadej kód místnosti…"
              className="flex-1 glass-input py-2.5 font-mono tracking-widest uppercase placeholder:normal-case placeholder:tracking-normal"
              maxLength={6}
            />
            <motion.button
              onClick={() => roomCode.length === 6 && onJoin(roomCode)}
              disabled={roomCode.length !== 6}
              whileHover={roomCode.length === 6 ? { scale: 1.02 } : {}}
              whileTap={roomCode.length === 6 ? { scale: 0.97 } : {}}
              className="px-4 rounded-xl bg-white/10 border border-white/10 text-white text-sm font-semibold
                         disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/15 transition-colors
                         flex items-center gap-1.5"
            >
              <LogIn className="w-4 h-4" />
              Vstoupit
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ── Mode card ────────────────────────────────────────────────────────────────

function ModeCard({ mode, index, selectedAnimeId, onStart, onJoin }) {
  const [expanded, setExpanded] = useState(false)
  const { Icon, badge, title, description, gradient, glow, border, id } = mode

  const handleAction = () => {
    if (id === 'multiplayer') {
      setExpanded(e => !e)
    } else {
      onStart(id, selectedAnimeId)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.07, duration: 0.35 }}
      className={`glass-card p-5 border transition-all duration-300 ${border}`}
    >
      <div className="flex items-start gap-4">

        {/* Icon */}
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex-shrink-0
                          flex items-center justify-center shadow-lg ${glow}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h2 className="font-bold text-white text-base leading-tight">{title}</h2>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${gradient} text-white`}>
              {badge}
            </span>
          </div>
          <p className="text-white/45 text-sm leading-relaxed">{description}</p>
        </div>

        {/* Action */}
        <motion.button
          onClick={handleAction}
          whileHover={{ scale: 1.06, x: 1 }}
          whileTap={{ scale: 0.94 }}
          id={`btn-mode-${id}`}
          className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center
                      bg-gradient-to-br ${gradient} text-white shadow-md ${glow}
                      hover:shadow-lg transition-shadow`}
          title={id === 'multiplayer' ? 'Multiplayer' : `Hrát ${title}`}
        >
          <ChevronRight className={`w-5 h-5 transition-transform duration-200 ${id === 'multiplayer' && expanded ? 'rotate-90' : ''}`} />
        </motion.button>
      </div>

      {/* Multiplayer expansion */}
      {id === 'multiplayer' && (
        <AnimatePresence>
          {expanded && <MultiplayerPanel onJoin={onJoin} />}
        </AnimatePresence>
      )}
    </motion.div>
  )
}

// ── Main Homepage ─────────────────────────────────────────────────────────────

export default function Homepage({ animes, onStart, onJoin }) {
  const [selectedAnimeId, setSelectedAnimeId] = useState(
    animes.length > 0 ? animes[0].id : 'jojo'
  )

  return (
    <div className="min-h-screen bg-[#0b0f17] font-sans">

      {/* Ambient glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px]
                        bg-indigo-900/25 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 -right-20 w-[350px] h-[350px]
                        bg-violet-900/15 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px]
                        bg-blue-900/10 rounded-full blur-[100px]" />
      </div>

      {/* Content – offset for fixed TopBanner (h-14 = 56px) */}
      <div className="relative z-10 max-w-2xl mx-auto px-4 pt-8 pb-20">

        {/* Sub-heading (banner handles main title) */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="text-center mb-8"
        >
          <p className="text-white/35 text-sm font-medium">
            Vyber anime a zvol herní mód
          </p>
        </motion.div>

        {/* Anime picker */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mb-6"
        >
          <p className="text-center text-[11px] text-white/25 font-semibold uppercase tracking-widest mb-3">
            Anime
          </p>
          <AnimePicker
            animes={animes}
            value={selectedAnimeId}
            onChange={setSelectedAnimeId}
          />
        </motion.div>

        {/* Mode cards */}
        <div className="space-y-3">
          {MODES.map((mode, i) => (
            <ModeCard
              key={mode.id}
              mode={mode}
              index={i}
              selectedAnimeId={selectedAnimeId}
              onStart={onStart}
              onJoin={onJoin}
            />
          ))}
        </div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-white/12 text-xs mt-10"
        >
          v0.1.0
        </motion.p>
      </div>
    </div>
  )
}
