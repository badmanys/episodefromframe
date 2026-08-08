import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, SendHorizontal, Flag, ChevronDown, Check } from 'lucide-react'
import { getPartsForAnime, getEpisodesForPart, ANIME_NAMES } from '../lib/frames.js'

// ── Reusable Custom Dropdown ──────────────────────────────────────────────────

/**
 * @param {Object}   props
 * @param {string}   props.id            – unique id for accessibility
 * @param {string}   props.label         – field label above the trigger
 * @param {string}   props.value         – currently selected value ('' = nothing)
 * @param {Array}    props.options        – [{ value, label }]
 * @param {Function} props.onChange       – called with new value string
 * @param {string}   [props.placeholder]  – trigger text when nothing is selected
 * @param {boolean}  [props.disabled]
 */
function CustomDropdown({ id, label, value, options, onChange, placeholder = '— Vyber —', disabled = false }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const selectedLabel = options.find(o => String(o.value) === String(value))?.label ?? null

  const handleSelect = (val) => {
    onChange(val)
    setOpen(false)
  }

  // Stagger variants for list items
  const listVariants = {
    hidden: { height: 0, opacity: 0 },
    visible: {
      height: 'auto',
      opacity: 1,
      transition: {
        height: { duration: 0.22, ease: [0.4, 0, 0.2, 1] },
        opacity: { duration: 0.18 },
        staggerChildren: 0.035,
        delayChildren: 0.04,
      },
    },
    exit: {
      height: 0,
      opacity: 0,
      transition: {
        height: { duration: 0.18, ease: [0.4, 0, 0.2, 1] },
        opacity: { duration: 0.12 },
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: -6 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.18 } },
  }

  return (
    <div className="space-y-1.5" ref={ref}>
      <label
        htmlFor={id}
        className="block text-xs text-white/35 font-medium uppercase tracking-wider select-none"
      >
        {label}
      </label>

      {/* Trigger button */}
      <motion.button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        whileTap={!disabled ? { scale: 0.985 } : {}}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`
          w-full glass-input flex items-center justify-between gap-2 text-left
          cursor-pointer select-none
          ${disabled ? 'opacity-30 cursor-not-allowed' : 'hover:border-white/20 hover:bg-white/8'}
          ${open ? 'border-indigo-500/50 ring-2 ring-indigo-500/20' : ''}
        `}
      >
        <span className={selectedLabel ? 'text-white' : 'text-white/30'}>
          {selectedLabel ?? placeholder}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
          className="flex-shrink-0"
        >
          <ChevronDown className="w-4 h-4 text-white/40" />
        </motion.span>
      </motion.button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            variants={listVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="
              absolute z-50 w-full overflow-hidden
              backdrop-blur-md bg-slate-900/90 border border-white/10
              rounded-xl shadow-2xl shadow-black/60
              mt-1
            "
            style={{ top: '100%', left: 0, right: 0 }}
          >
            <div className="overflow-y-auto max-h-52 py-1">
              {options.map((opt) => {
                const isSelected = String(opt.value) === String(value)
                return (
                  <motion.li
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    variants={itemVariants}
                    onMouseDown={() => handleSelect(opt.value)}
                    className={`
                      flex items-center justify-between gap-3 px-4 py-2.5 cursor-pointer
                      transition-colors duration-100 group
                      ${isSelected
                        ? 'bg-indigo-600/25 text-white'
                        : 'text-white/60 hover:bg-white/8 hover:text-white'
                      }
                    `}
                  >
                    <span className="text-sm font-medium truncate">{opt.label}</span>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                    )}
                  </motion.li>
                )
              })}
            </div>
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Main GuessInput ───────────────────────────────────────────────────────────

export default function GuessInput({
  frames,
  animes,
  selectedAnimeId,    // used as fixed anime when isRandom=false
  onAnimeChange,
  onGuess,
  onSurrender,
  guessCount,
  isRandom = false,   // true → player must also guess the anime
}) {
  const [localAnimeId,    setLocalAnimeId]    = useState('')
  const [selectedPart,    setSelectedPart]    = useState('')
  const [episodeQuery,    setEpisodeQuery]    = useState('')
  const [selectedEpisode, setSelectedEpisode] = useState(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef(null)

  // The active anime ID: when random mode the player picks it; otherwise it's fixed
  const activeAnimeId = isRandom ? localAnimeId : selectedAnimeId

  // ── Derived data ─────────────────────────────────────────────────────────

  const parts = useMemo(
    () => activeAnimeId ? getPartsForAnime(frames, activeAnimeId) : [],
    [frames, activeAnimeId]
  )

  const allEpisodes = useMemo(
    () => (selectedPart && activeAnimeId ? getEpisodesForPart(frames, activeAnimeId, selectedPart) : []),
    [frames, activeAnimeId, selectedPart]
  )

  const filteredEpisodes = useMemo(() => {
    if (!episodeQuery.trim()) return allEpisodes
    const q = episodeQuery.trim().toLowerCase()
    return allEpisodes.filter(ep =>
      String(ep.episode).startsWith(q) ||
      ep.title.toLowerCase().includes(q)
    )
  }, [allEpisodes, episodeQuery])

  // Dropdown option shapes
  const animeOptions = useMemo(
    () => animes.map(a => ({ value: a.id, label: a.title })),
    [animes]
  )

  const partOptions = useMemo(
    () => parts.map(p => ({ value: String(p), label: `Part ${p}` })),
    [parts]
  )

  // ── Effects ──────────────────────────────────────────────────────────────

  // Reset part + episode when the active anime changes (in random mode the player changes it)
  useEffect(() => {
    setSelectedPart('')
    setEpisodeQuery('')
    setSelectedEpisode(null)
    setShowSuggestions(false)
  }, [activeAnimeId])

  // Reset everything when a round resets (guessCount drops to 0)
  useEffect(() => {
    if (guessCount === 0) {
      setLocalAnimeId('')
      setSelectedPart('')
      setEpisodeQuery('')
      setSelectedEpisode(null)
      setShowSuggestions(false)
    }
  }, [guessCount])

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleSelectEpisode = useCallback((ep) => {
    setSelectedEpisode(ep)
    setEpisodeQuery(`Ep. ${ep.episode} – ${ep.title}`)
    setShowSuggestions(false)
    setHighlightedIndex(-1)
  }, [])

  const handleEpisodeKeyDown = (e) => {
    if (!showSuggestions || !filteredEpisodes.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex(i => Math.min(i + 1, filteredEpisodes.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault()
      handleSelectEpisode(filteredEpisodes[highlightedIndex])
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  const handleSubmit = () => {
    if (!canSubmit) return
    onGuess({
      animeId: activeAnimeId,
      part: Number(selectedPart),
      episode: Number(selectedEpisode.episode),
    })
    // Reset form
    if (isRandom) setLocalAnimeId('')
    setSelectedPart('')
    setEpisodeQuery('')
    setSelectedEpisode(null)
    setShowSuggestions(false)
  }

  // In random mode the player must also pick an anime before submitting
  const canSubmit = (isRandom ? !!localAnimeId : true) && !!selectedPart && !!selectedEpisode

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="glass-card p-5 space-y-4">

      {/* Header */}
      <div className="flex items-center gap-2 text-white/40 text-xs font-semibold uppercase tracking-widest">
        <Search className="w-3.5 h-3.5" />
        <span>Tip #{guessCount + 1}</span>
      </div>

      {/* ── Anime dropdown (only in Random mode) ────────────────────────────── */}
      {isRandom && (
        <div className="relative">
          <CustomDropdown
            id="select-anime"
            label="Anime"
            value={localAnimeId}
            options={animeOptions}
            onChange={(val) => { setLocalAnimeId(val); setSelectedPart('') }}
            placeholder="— Vyber anime —"
          />
        </div>
      )}

      {/* ── Part custom dropdown ──────────────────────────────────────────── */}
      <div className="relative">
        <CustomDropdown
          id="select-part"
          label="Part / Série"
          value={selectedPart}
          options={partOptions}
          onChange={setSelectedPart}
          placeholder="— Vyber part —"
          disabled={parts.length === 0}
        />
      </div>

      {/* ── Episode autocomplete ──────────────────────────────────────────── */}
      <div className="space-y-1.5 relative">
        <label className="block text-xs text-white/35 font-medium uppercase tracking-wider">
          Epizoda
        </label>
        <input
          ref={inputRef}
          type="text"
          value={episodeQuery}
          onChange={e => {
            setEpisodeQuery(e.target.value)
            setSelectedEpisode(null)
            setShowSuggestions(true)
            setHighlightedIndex(-1)
          }}
          onFocus={() => { if (selectedPart) setShowSuggestions(true) }}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 160)}
          onKeyDown={handleEpisodeKeyDown}
          placeholder={
            isRandom && !localAnimeId ? 'Nejdřív vyber anime'
            : !selectedPart          ? 'Nejdřív vyber part'
            : 'Hledej číslo nebo název epizody…'
          }
          disabled={!selectedPart || (isRandom && !localAnimeId)}
          className="glass-input disabled:opacity-30 disabled:cursor-not-allowed"
          autoComplete="off"
          id="input-episode"
        />

        {/* Episode suggestions */}
        <AnimatePresence>
          {showSuggestions && filteredEpisodes.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 right-0 mt-1.5 z-50
                         backdrop-blur-md bg-slate-900/90 border border-white/10
                         rounded-xl shadow-2xl shadow-black/60
                         overflow-hidden max-h-52 overflow-y-auto"
            >
              {filteredEpisodes.slice(0, 12).map((ep, idx) => (
                <motion.button
                  key={ep.id}
                  onMouseDown={() => handleSelectEpisode(ep)}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className={`
                    w-full text-left px-4 py-2.5 flex items-center justify-between gap-3
                    transition-colors group
                    ${idx === highlightedIndex ? 'bg-indigo-600/30' : 'hover:bg-white/8'}
                  `}
                >
                  <span className={`text-sm truncate transition-colors
                    ${idx === highlightedIndex ? 'text-white' : 'text-white/60 group-hover:text-white'}`}>
                    {ep.title}
                  </span>
                  <span className="text-indigo-400 font-mono font-bold text-sm flex-shrink-0">
                    {ep.episode}
                  </span>
                </motion.button>
              ))}
              {filteredEpisodes.length > 12 && (
                <p className="text-center text-white/20 text-xs py-2 border-t border-white/5">
                  + {filteredEpisodes.length - 12} dalších výsledků
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Action buttons ────────────────────────────────────────────────── */}
      <div className="flex gap-3 pt-1">
        <motion.button
          id="btn-submit-guess"
          onClick={handleSubmit}
          disabled={!canSubmit}
          whileHover={canSubmit ? { scale: 1.02 } : {}}
          whileTap={canSubmit ? { scale: 0.97 } : {}}
          className="flex-1 btn-primary flex items-center justify-center gap-2"
        >
          <SendHorizontal className="w-4 h-4" />
          Potvrdit tip
        </motion.button>

        <motion.button
          id="btn-surrender"
          onClick={onSurrender}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="btn-ghost flex items-center gap-1.5 text-red-400/60 hover:text-red-400
                     border-red-500/10 hover:border-red-500/25 hover:bg-red-950/30"
        >
          <Flag className="w-4 h-4" />
          <span className="text-sm">Vzdát se</span>
        </motion.button>
      </div>
    </div>
  )
}
