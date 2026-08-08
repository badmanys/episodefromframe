import { memo, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Clock, XCircle, CheckCircle2 } from 'lucide-react'
import { evaluateMultiplayerRound } from '../lib/multiplayer.js'

export default memo(function RoundResultsScreen({ players, answer, isRandom, isHost, onNextRound }) {
  const results = useMemo(() => {
    if (!players || !answer) return null
    return evaluateMultiplayerRound(players, answer, isRandom)
  }, [players, answer, isRandom])

  if (!results) return null

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        className="glass-card w-full max-w-lg p-6 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-50" />
        
        <div className="relative z-10">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-black text-white uppercase tracking-widest text-shadow-glow">Výsledky kola</h2>
          </div>

          <div className="space-y-3">
            {results.sortedPlayers.map((p, idx) => {
              const isWinner = results.winners.includes(p.role)
              const isValid = p.valid
              const surrendered = p.guess?.surrendered
              
              let statusText = ''
              let statusColor = ''
              
              if (surrendered) {
                statusText = 'Vzdal to'
                statusColor = 'text-red-400/80 bg-red-400/10'
              } else if (!isValid) {
                statusText = 'Špatná série/část'
                statusColor = 'text-red-400/80 bg-red-400/10'
              } else if (p.episodeDiff === 0) {
                statusText = 'Přesná trefa!'
                statusColor = 'text-emerald-400 bg-emerald-400/10'
              } else {
                statusText = `Mimo o ${p.episodeDiff} ep.`
                statusColor = isWinner ? 'text-green-400 bg-green-400/10' : 'text-white/60 bg-white/5'
              }

              return (
                <motion.div 
                  key={p.role}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`flex items-center justify-between gap-4 p-3 rounded-xl border ${isWinner ? 'bg-indigo-900/30 border-indigo-500/30' : 'bg-black/40 border-white/5'}`}
                >
                  {/* LEVÁ STRANA: Pořadí a Jméno */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${isWinner ? 'bg-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-white/10 text-white/40'}`}>
                      {idx + 1}.
                    </div>
                    
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white truncate">{p.name}</span>
                        {isWinner && <Trophy className="w-3.5 h-3.5 text-yellow-400" />}
                      </div>
                      {p.guess && !surrendered && (
                        <div className="text-[10px] text-white/40 truncate mt-0.5">
                          Tip: Ep {p.guess.episode}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* PRAVÁ STRANA: Skóre a Status Tipu */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="px-3 py-1 text-sm font-bold text-yellow-400 border border-yellow-500/30 bg-yellow-500/10 rounded-md whitespace-nowrap shadow-[0_0_10px_rgba(234,179,8,0.15)]">
                      {p.score || 0} {(p.score || 0) === 1 ? 'bod' : ((p.score || 0) > 1 && (p.score || 0) < 5) ? 'body' : 'bodů'}
                    </div>

                    <div className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${statusColor} flex items-center gap-1`}>
                      {isValid && isWinner ? <CheckCircle2 className="w-3 h-3" /> : null}
                      {!isValid && !surrendered ? <XCircle className="w-3 h-3" /> : null}
                      {statusText}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
          
          <div className="mt-6 p-3 rounded-xl bg-white/5 border border-white/10 text-center">
            <span className="text-[10px] text-white/40 uppercase tracking-widest block mb-1">Správná odpověď</span>
            <span className="text-sm text-white font-bold">{results.answer?.title || 'Neznámé'} · Část {results.answer?.part} · Ep. {results.answer?.episode}</span>
          </div>

          <div className="mt-6">
            {isHost ? (
              <button 
                onClick={() => onNextRound && onNextRound()}
                className="flex items-center justify-center w-full py-3 bg-red-600 hover:bg-red-500 transition-colors font-bold text-center text-white rounded-lg shadow-[0_0_15px_rgba(220,38,38,0.5)]"
              >
                Spustit další kolo &gt;
              </button>
            ) : (
              <div className="flex flex-col items-center justify-center text-white/50 py-2 animate-pulse">
                <div className="w-6 h-6 border-4 border-t-transparent border-white rounded-full animate-spin mb-3"></div>
                <span className="text-sm font-semibold">Čeká se, až zakladatel spustí další kolo...</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
})
