import { motion } from 'framer-motion'
import { Check, X, ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { ANIME_NAMES } from '../lib/frames.js'

// ── Single feedback cell ──────────────────────────────────────────────────────

function FeedbackCell({ label, value, match, direction }) {
  const isCorrect = match
  const isWrong = !match

  return (
    <div
      className={`flex-1 rounded-xl border px-3 py-2.5 text-center transition-colors
        ${isCorrect
          ? 'bg-green-500/15 border-green-500/35'
          : 'bg-red-500/10 border-red-500/15'
        }`}
    >
      <p className="text-[10px] text-white/25 uppercase tracking-wider font-medium mb-1.5">
        {label}
      </p>

      <div className="flex items-center justify-center gap-1.5">
        {/* Direction arrow */}
        {!isCorrect && direction === 'up' && (
          <ArrowUp className="w-3 h-3 text-sky-400 flex-shrink-0" />
        )}
        {!isCorrect && direction === 'down' && (
          <ArrowDown className="w-3 h-3 text-orange-400 flex-shrink-0" />
        )}
        {!isCorrect && !direction && (
          <X className="w-3 h-3 text-red-400/70 flex-shrink-0" />
        )}
        {isCorrect && (
          <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
        )}

        {/* Value */}
        <span className={`text-sm font-bold tabular-nums
          ${isCorrect ? 'text-green-400' : direction === 'up' ? 'text-sky-300' : direction === 'down' ? 'text-orange-300' : 'text-red-400/80'}
        `}>
          {value}
        </span>
      </div>
    </div>
  )
}

// ── Full guess row ────────────────────────────────────────────────────────────

function GuessRow({ result, index }) {
  const animeName = ANIME_NAMES[result.guess.animeId] || result.guess.animeId

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: 'easeOut' }}
      className="glass-card p-3.5"
    >
      {/* Anime title row */}
      <div className={`flex items-center gap-2.5 pb-3 mb-3 border-b border-white/5`}>
        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0
          ${result.titleMatch ? 'bg-green-500/25' : 'bg-red-500/20'}`}>
          {result.titleMatch
            ? <Check className="w-3 h-3 text-green-400" />
            : <X className="w-3 h-3 text-red-400" />
          }
        </div>
        <span className={`text-sm font-medium truncate
          ${result.titleMatch ? 'text-green-300' : 'text-white/50'}`}>
          {animeName}
        </span>
        {/* Guess number badge */}
        <span className="ml-auto text-[10px] text-white/15 font-mono flex-shrink-0">
          #{index + 1}
        </span>
      </div>

      {/* Part + Episode cells */}
      <div className="flex gap-2">
        <FeedbackCell
          label="Part"
          value={result.guess.part}
          match={result.partMatch}
          direction={result.partDirection}
        />
        <FeedbackCell
          label="Epizoda"
          value={result.guess.episode}
          match={result.episodeMatch}
          direction={result.episodeDirection}
        />
      </div>
    </motion.div>
  )
}

// ── Exported component ────────────────────────────────────────────────────────

export default function GuessHistory({ guesses }) {
  if (!guesses.length) return null

  return (
    <section>
      <div className="flex items-center gap-2 mb-3 px-0.5">
        <h2 className="text-white/35 text-xs font-semibold uppercase tracking-widest">
          Historie tipů
        </h2>
        <span className="text-white/20 text-xs">({guesses.length})</span>
      </div>

      <div className="space-y-2.5">
        {guesses.map((result, idx) => (
          <GuessRow key={idx} result={result} index={idx} />
        ))}
      </div>
    </section>
  )
}
