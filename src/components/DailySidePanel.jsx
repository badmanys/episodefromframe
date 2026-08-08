import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Share2, CheckCircle2, Trophy, XCircle } from 'lucide-react'

export default function DailySidePanel({ result, answer }) {
  const [copied, setCopied] = useState(false)

  if (!result || !answer) return null

  // Wordle-style evaluation
  const seriesEmoji = result.titleMatch ? '🟩' : '🟥'
  const episodeDiff = Math.abs(Number(result.guess?.episode || 0) - Number(answer.episode))
  let episodeEmoji = '🟥'
  if (result.titleMatch && result.partMatch && result.guess?.episode === answer.episode) episodeEmoji = '🟩'
  else if (result.titleMatch && result.partMatch && episodeDiff <= 5) episodeEmoji = '🟨'
  const partEmoji = result.partMatch ? '🟩' : '🟥'

  const handleShare = async () => {
    const today = new Date().toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const textToShare = `Anime Guesser - Denní Výzva ${today}\n${answer.title}\n${seriesEmoji} Série\n${episodeEmoji} Epizoda\n${partEmoji} Part`

    try {
      await navigator.clipboard.writeText(textToShare)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch (err) {
      const textArea = document.createElement("textarea")
      textArea.value = textToShare
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("Copy")
      textArea.remove()
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 100 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="fixed right-4 top-1/2 -translate-y-1/2 z-40 w-64 glass-card bg-black/60 border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.8)] overflow-hidden hidden md:block"
      >
        {/* Glow behind */}
        <div className={`absolute inset-0 pointer-events-none opacity-20 ${result.isCorrect ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ filter: 'blur(40px)' }} />

        <div className="relative z-10 p-5">
          <div className="flex flex-col items-center mb-6 text-center">
            {result.isCorrect ? (
              <Trophy className="w-10 h-10 text-emerald-400 mb-2 drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
            ) : (
              <XCircle className="w-10 h-10 text-red-400 mb-2 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
            )}
            <h3 className="text-white font-black uppercase tracking-widest text-sm">
              {result.isCorrect ? 'Skvělá práce!' : 'Denní Výzva'}
            </h3>
            <p className="text-white/40 text-[10px] font-bold tracking-[0.2em] mt-1">
              Rozpad tvého tipu
            </p>
          </div>

          <div className="space-y-3 mb-6 bg-white/5 rounded-xl p-4 border border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-white/60 font-bold uppercase tracking-wider text-xs">Série</span>
              <span className="text-2xl drop-shadow-md">{seriesEmoji}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60 font-bold uppercase tracking-wider text-xs">Epizoda</span>
              <span className="text-2xl drop-shadow-md">{episodeEmoji}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60 font-bold uppercase tracking-wider text-xs">Part</span>
              <span className="text-2xl drop-shadow-md">{partEmoji}</span>
            </div>
          </div>

          <button 
            onClick={handleShare}
            className="w-full btn-primary flex items-center justify-center gap-2 py-3 bg-white hover:bg-white/90 text-black border-none shadow-[0_0_15px_rgba(255,255,255,0.3)]"
          >
            {copied ? <CheckCircle2 className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            {copied ? 'Zkopírováno' : 'Sdílet výsledek'}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
