import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Shuffle, Users, Hash, Clock, Swords, Zap, Crosshair, Flame, Droplet, Star, Orbit, CheckCircle2, Play } from 'lucide-react'
import { ANIME_NAMES } from '../lib/frames.js'
import { playClickSound } from '../lib/audio.js'

const ANIME_ACCENTS = {
  jojo:   { from: '#b91c1c', to: '#ef4444', shadow: 'rgba(220,38,38,0.35)', icon: Star },
  naruto: { from: '#ea580c', to: '#f97316', shadow: 'rgba(234,88,12,0.35)', icon: Zap },
  hxh:    { from: '#c2410c', to: '#fb923c', shadow: 'rgba(249,115,22,0.35)', icon: Crosshair },
  aot:    { from: '#991b1b', to: '#dc2626', shadow: 'rgba(220,38,38,0.35)', icon: Swords },
  bleach: { from: '#b91c1c', to: '#f87171', shadow: 'rgba(220,38,38,0.35)', icon: Droplet },
  fma:    { from: '#b45309', to: '#fbbf24', shadow: 'rgba(245,158,11,0.35)', icon: Flame },
  dbs:    { from: '#c2410c', to: '#fcd34d', shadow: 'rgba(245,158,11,0.35)', icon: Orbit },
}
const DEFAULT_ACCENT = { from: '#b91c1c', to: '#ef4444', shadow: 'rgba(220,38,38,0.35)', icon: Star }

export default function AnimeSelectModal({ animes, action = 'classic', onSelect, onClose }) {
  const [rounds, setRounds] = useState(5)
  const [maxPlayers, setMaxPlayers] = useState(2)
  const [timeLimit, setTimeLimit] = useState(0)
  const [selectedAnime, setSelectedAnime] = useState(null)

  const handleConfirm = () => {
    if (!selectedAnime) return
    playClickSound()
    if (action === 'multiplayer') {
      onSelect(selectedAnime, { rounds, maxPlayers, timeLimit })
    } else {
      onSelect(selectedAnime)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4"
      >
        <motion.div
          key="modal"
          initial={{ opacity: 0, scale: 0.88, y: 28 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 16 }}
          transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-sm glass-card max-h-[90vh] overflow-y-auto"
        >
          <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #991b1b, #dc2626, #f59e0b)' }} />

          <div className="flex items-center justify-between px-5 pt-5 pb-4">
            <div>
              <h2 className="text-white font-black text-lg leading-tight">Vyber anime</h2>
              <p className="text-white/35 text-xs mt-0.5">
                {action === 'classic' ? 'pro Klasický mód · 5 kol' : 'pro Multiplayer místnost'}
              </p>
            </div>
            <motion.button
              onClick={() => { playClickSound(); onClose(); }}
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </motion.button>
          </div>

          {action === 'multiplayer' && (
            <div className="px-5 pb-4 space-y-4 border-b border-white/5 mb-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-white/60 text-xs font-semibold flex items-center gap-1.5"><Hash className="w-3.5 h-3.5"/> Počet kol</label>
                  <span className="text-red-400 font-bold text-sm bg-red-950/40 border border-red-900/50 px-2 py-0.5 rounded shadow-[0_0_10px_rgba(220,38,38,0.3)]">{rounds}</span>
                </div>
                <input 
                  type="range" min="2" max="10" value={rounds} 
                  onChange={(e) => setRounds(parseInt(e.target.value))}
                  className="w-full accent-red-600 h-2 bg-black/50 shadow-inner rounded-lg appearance-none cursor-pointer"
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-white/60 text-xs font-semibold flex items-center gap-1.5"><Users className="w-3.5 h-3.5"/> Kapacita hráčů</label>
                  <span className="text-red-400 font-bold text-sm bg-red-950/40 border border-red-900/50 px-2 py-0.5 rounded shadow-[0_0_10px_rgba(220,38,38,0.3)]">{maxPlayers}</span>
                </div>
                <input 
                  type="range" min="2" max="4" value={maxPlayers} 
                  onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                  className="w-full accent-red-600 h-2 bg-black/50 shadow-inner rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-white/60 text-xs font-semibold flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/> Časový limit</label>
                  <span className="text-white font-bold text-sm bg-white/5 px-2 py-0.5 rounded">{timeLimit === 0 ? 'Vypnuto' : `${timeLimit}s`}</span>
                </div>
                <div className="flex gap-2">
                  {[0, 15, 30, 60].map(val => (
                    <button
                      key={val}
                      onClick={() => setTimeLimit(val)}
                      className={`flex-1 py-1.5 rounded text-xs font-semibold border transition-all duration-300 ${timeLimit === val ? 'bg-red-600/20 border-red-500 text-red-400 shadow-[0_0_15px_rgba(220,38,38,0.3)]' : 'bg-black/40 border-white/10 text-white/50 hover:bg-white/10 hover:text-white/80'}`}
                    >
                      {val === 0 ? 'Žádný' : `${val}s`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="px-5 pb-3 grid grid-cols-2 gap-2.5">
            {animes.map((anime, i) => {
              const accent = ANIME_ACCENTS[anime.id] ?? DEFAULT_ACCENT
              const isSelected = selectedAnime === anime.id
              const Icon = accent.icon
              
              return (
                <motion.button
                  key={anime.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 + i * 0.06, duration: 0.3 }}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { playClickSound(); setSelectedAnime(anime.id); }}
                  className={`relative rounded-xl border p-3.5 text-left group transition-colors duration-200 ${isSelected ? 'bg-red-950/40 border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.3)]' : 'bg-white/[0.04] border-white/8 hover:border-white/20'}`}
                  style={{ willChange: 'transform' }}
                >
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none rounded-xl"
                    style={{ boxShadow: !isSelected ? `0 4px 20px ${accent.shadow}` : 'none', willChange: 'opacity' }} 
                  />
                  <div className="w-8 h-8 rounded-lg mb-2 flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${accent.from}, ${accent.to})` }}>
                    <Icon className="w-4 h-4 text-white" strokeWidth={2} />
                  </div>
                  <p className={`font-bold text-sm leading-tight transition-colors ${isSelected ? 'text-white' : 'text-white/80 group-hover:text-white'}`}>{anime.title}</p>
                  
                  {isSelected && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-2.5 right-2.5">
                      <CheckCircle2 className="w-5 h-5 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
                    </motion.div>
                  )}
                  
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{ background: `linear-gradient(135deg, ${accent.from}15, ${accent.to}08)` }} />
                </motion.button>
              )
            })}
          </div>

          <div className="flex items-center gap-3 px-5 mb-3">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-white/20 text-[11px] font-medium">nebo</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          <div className="px-5 pb-5">
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28 }}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { playClickSound(); setSelectedAnime('random'); }}
              className={`w-full relative rounded-xl border p-4 flex items-center gap-3 group transition-colors duration-200 ${selectedAnime === 'random' ? 'bg-red-950/40 border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.3)]' : 'bg-red-950/20 border-red-500/30 hover:border-red-500/50'}`}
              style={{ willChange: 'transform' }}
            >
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none rounded-xl"
                style={{ boxShadow: selectedAnime !== 'random' ? '0 4px 24px rgba(220,38,38,0.2)' : 'none', willChange: 'opacity' }} 
              />
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-amber-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-500/20">
                <Shuffle className="w-5 h-5 text-white" strokeWidth={2} />
              </div>
              <div className="text-left">
                <p className="text-red-200 font-black text-base leading-tight">Náhodné</p>
                <p className="text-red-500/60 text-xs mt-0.5">Všechna anime · hádáš i název</p>
              </div>
              {selectedAnime === 'random' && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="ml-auto">
                  <CheckCircle2 className="w-6 h-6 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
                </motion.div>
              )}
            </motion.button>
          </div>

          <AnimatePresence>
            {selectedAnime && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="px-5 pb-5 sticky bottom-0 bg-gradient-to-t from-black via-black/90 to-transparent pt-4"
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConfirm}
                  className="w-full btn-primary flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(220,38,38,0.3)]"
                >
                  <Play className="w-5 h-5 fill-current" /> Potvrdit výběr
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
