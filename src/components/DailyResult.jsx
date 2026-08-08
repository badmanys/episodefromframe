import { useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Share2, ArrowLeft, CheckCircle2, Calendar } from 'lucide-react'

export default function DailyResult({ result, onHome, answer }) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    // Generate Wordle-like emoji string
    // e.g. 🟩🟩🟩 for perfect, 🟨🟨🟨 for close (episode diff <= 5), 🟥🟥🟥 for completely wrong
    
    let emoji = '🟥🟥🟥'
    if (result.isCorrect) {
      emoji = '🟩🟩🟩'
    } else if (result.titleMatch && result.partMatch && Math.abs(Number(result.guess.episode) - Number(answer.episode)) <= 5) {
      emoji = '🟨🟨🟨'
    } else if (result.titleMatch) {
      emoji = '🟧🟧🟧'
    }

    const today = new Date().toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const textToShare = `Anime Guesser - Denní Výzva ${today}\n${answer.title}\n${emoji}`

    try {
      await navigator.clipboard.writeText(textToShare)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch (err) {
      console.error('Failed to copy', err)
      // Fallback
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
    <div className="max-w-md mx-auto pt-8 px-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-8 text-center relative overflow-hidden">
        
        {/* Decorative background glow */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[200px] rounded-full blur-[80px] pointer-events-none ${result.isCorrect ? 'bg-emerald-500/20' : 'bg-red-500/20'}`} />

        <div className="relative z-10">
          <div className="flex justify-center mb-6">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center border ${result.isCorrect ? 'bg-emerald-900/30 border-emerald-500/30 text-emerald-400' : 'bg-red-900/30 border-red-500/30 text-red-400'}`}>
              <Calendar className="w-10 h-10" />
            </div>
          </div>

          <h2 className="text-3xl font-black mb-2 uppercase tracking-widest text-white">
            Denní Výzva
          </h2>
          <p className="text-white/60 font-semibold mb-8">
            {new Date().toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>

          <div className="bg-black/50 rounded-xl p-4 mb-8 border border-white/10">
            <p className="text-sm text-white/40 uppercase tracking-widest font-bold mb-2">Správná Odpověď</p>
            <p className="text-lg font-bold text-white mb-1">{answer.title}</p>
            <p className="text-white/60 font-mono text-sm">Part {answer.part} • Epizoda {answer.episode}</p>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-bold text-white mb-2">Tvůj výsledek</h3>
            {result.isCorrect ? (
              <p className="text-emerald-400 font-bold flex items-center justify-center gap-2 text-lg">
                <Trophy className="w-5 h-5"/> Přesný zásah! 🟩🟩🟩
              </p>
            ) : (
              <p className="text-red-400 font-bold flex flex-col items-center justify-center gap-1 text-lg">
                <span>Vedle! 🟥🟥🟥</span>
                <span className="text-sm font-normal text-white/50 mt-1">Zkus to znovu zítra.</span>
              </p>
            )}
          </div>

          <div className="space-y-4">
            <button onClick={handleShare} className="btn-primary flex items-center justify-center gap-2">
              {copied ? <CheckCircle2 className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
              {copied ? 'Zkopírováno!' : 'Sdílet výsledek'}
            </button>
            <button onClick={onHome} className="btn-ghost w-full flex items-center justify-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Zpět do menu
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
