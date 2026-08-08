import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Shuffle } from 'lucide-react'
import { ANIME_NAMES } from '../lib/frames.js'

const ANIME_ACCENTS = {
  jojo:   { from: '#7c3aed', to: '#a855f7', shadow: 'rgba(124,58,237,0.35)' },
  naruto: { from: '#ea580c', to: '#f97316', shadow: 'rgba(234,88,12,0.35)' },
  hxh:    { from: '#0284c7', to: '#38bdf8', shadow: 'rgba(2,132,199,0.35)' },
  aot:    { from: '#b91c1c', to: '#ef4444', shadow: 'rgba(185,28,28,0.35)' },
  bleach: { from: '#1d4ed8', to: '#60a5fa', shadow: 'rgba(29,78,216,0.35)' },
  fma:    { from: '#b45309', to: '#fbbf24', shadow: 'rgba(180,83,9,0.35)' },
  dbs:    { from: '#0369a1', to: '#7dd3fc', shadow: 'rgba(3,105,161,0.35)' },
}
const DEFAULT_ACCENT = { from: '#4f46e5', to: '#818cf8', shadow: 'rgba(79,70,229,0.35)' }

export default function AnimeSelectModal({ animes, onSelect, onClose }) {
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
          className="relative w-full max-w-sm bg-[#0e0b1e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #7c3aed, #14b8a6, #f97316)' }} />

          <div className="flex items-center justify-between px-5 pt-5 pb-4">
            <div>
              <h2 className="text-white font-black text-lg leading-tight">Vyber anime</h2>
              <p className="text-white/35 text-xs mt-0.5">pro Klasický mód · 5 kol</p>
            </div>
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              id="btn-close-anime-modal"
            >
              <X className="w-4 h-4" />
            </motion.button>
          </div>

          <div className="px-5 pb-3 grid grid-cols-2 gap-2.5">
            {animes.map((anime, i) => {
              const accent = ANIME_ACCENTS[anime.id] ?? DEFAULT_ACCENT
              return (
                <motion.button
                  key={anime.id}
                  id={`btn-anime-${anime.id}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 + i * 0.06, duration: 0.3 }}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onSelect(anime.id)}
                  className="relative overflow-hidden rounded-xl border border-white/8 bg-white/[0.04] p-3.5 text-left group"
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 4px 20px ${accent.shadow}` }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = '' }}
                >
                  <div className="w-7 h-7 rounded-lg mb-2.5" style={{ background: `linear-gradient(135deg, ${accent.from}, ${accent.to})` }} />
                  <p className="text-white font-bold text-sm leading-tight">{anime.title}</p>
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
              id="btn-anime-random"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28 }}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect('random')}
              className="w-full relative overflow-hidden rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 flex items-center gap-3 group"
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 24px rgba(245,158,11,0.2)' }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '' }}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/20">
                <Shuffle className="w-5 h-5 text-white" strokeWidth={2} />
              </div>
              <div className="text-left">
                <p className="text-amber-200 font-black text-base leading-tight">Náhodné</p>
                <p className="text-amber-500/60 text-xs mt-0.5">Všechna anime · hádáš i název</p>
              </div>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-r from-amber-500/5 to-transparent" />
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
