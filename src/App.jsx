import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy, RotateCcw, Film, Sparkles,
  ArrowLeft, ChevronRight, Zap,
} from 'lucide-react'
import {
  fetchFrames,
  getUniqueAnimes,
  pickRandomFrame,
  compareGuess,
} from './lib/frames.js'
import { saveScoreToLeaderboard } from './lib/supabase.js'
import Homepage    from './components/Homepage.jsx'
import FrameViewer from './components/FrameViewer.jsx'
import GuessInput  from './components/GuessInput.jsx'
import GuessHistory from './components/GuessHistory.jsx'

// ── Constants ────────────────────────────────────────────────────────────────
const ROUND_MAX_SCORE = 1000   // Classic: max points available per round
const SCORE_PENALTY   = 100    // Classic: deducted per wrong guess
const CLASSIC_ROUNDS  = 5      // Classic: total rounds

// ── TopBanner – fixed on every screen ────────────────────────────────────────
function TopBanner({ currentScreen, totalScore, gameMode, currentRound, onGoHome }) {
  const modeLabelMap = { classic: 'Classic', endless: 'Endless', multiplayer: '1v1' }

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50
                 backdrop-blur-md bg-slate-950/80 border-b border-white/8"
      style={{ height: '56px' }}
    >
      <div className="max-w-2xl mx-auto px-4 h-full flex items-center justify-between gap-4">

        {/* Left: logo + name (+ back button in game) */}
        <div className="flex items-center gap-2.5 min-w-0">
          {currentScreen === 'game' && (
            <motion.button
              onClick={onGoHome}
              whileHover={{ scale: 1.08, x: -1 }}
              whileTap={{ scale: 0.92 }}
              id="btn-back-home"
              className="btn-ghost p-1.5 mr-0.5 flex-shrink-0"
              title="Zpět do menu"
            >
              <ArrowLeft className="w-4 h-4" />
            </motion.button>
          )}

          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg
                          flex items-center justify-center shadow-md shadow-indigo-500/30 flex-shrink-0">
            <Film className="w-4 h-4 text-white" />
          </div>

          <div className="min-w-0">
            <p className="text-sm font-bold text-white leading-tight tracking-tight whitespace-nowrap">
              Anime Frame Guesser
            </p>
            {currentScreen === 'game' && gameMode ? (
              <p className="text-[10px] text-white/35 leading-none">
                {modeLabelMap[gameMode]}
                {gameMode === 'classic' && ` · Kolo ${currentRound}/${CLASSIC_ROUNDS}`}
                {gameMode === 'endless' && ` · Záběr #${currentRound}`}
              </p>
            ) : (
              <p className="text-[10px] text-white/25 leading-none">Uhádni epizodu</p>
            )}
          </div>
        </div>

        {/* Right: score (game only) */}
        {currentScreen === 'game' && (
          <motion.div
            key={totalScore}
            initial={{ scale: 1.3 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, type: 'spring', stiffness: 250, damping: 20 }}
            className="glass-card px-3 py-1.5 flex items-center gap-1.5 flex-shrink-0"
          >
            <Trophy className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-white font-bold tabular-nums text-sm">{totalScore}</span>
          </motion.div>
        )}
      </div>
    </div>
  )
}

// ── Endless Game-Over Modal ───────────────────────────────────────────────────
function EndlessGameOverModal({ score, frameCount, answer, onRetry, onHome }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 flex items-center justify-center px-4
                 bg-black/70 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.88, y: 24, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.92, y: 16, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 24 }}
        className="w-full max-w-sm glass-card p-6 border-red-500/20 bg-red-950/10"
      >
        {/* Title */}
        <div className="text-center mb-5">
          <p className="text-4xl mb-2">💀</p>
          <h2 className="text-2xl font-black text-white mb-1">Game Over</h2>
          <p className="text-white/45 text-sm">
            Uhádl jsi <span className="text-white font-bold">{frameCount}</span> záběrů v řadě
          </p>
        </div>

        {/* Score */}
        <div className="text-center mb-5 py-4 rounded-xl bg-white/5 border border-white/8">
          <p className="text-xs text-white/30 uppercase tracking-widest mb-1">Finální skóre</p>
          <p className="text-5xl font-black text-transparent bg-clip-text
                         bg-gradient-to-r from-yellow-400 to-orange-400 tabular-nums">
            {score}
          </p>
          <p className="text-white/30 text-xs mt-1">bodů</p>
        </div>

        {/* Revealed answer */}
        {answer && (
          <div className="mb-5 rounded-xl overflow-hidden border border-white/10">
            <FrameViewer frame={answer} revealed={true} />
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <motion.button
            onClick={onRetry}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            className="flex-1 btn-primary flex items-center justify-center gap-2"
            id="btn-endless-retry"
          >
            <RotateCcw className="w-4 h-4" />
            Zkusit znovu
          </motion.button>
          <motion.button
            onClick={onHome}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            className="btn-ghost px-4 flex items-center gap-1.5"
            id="btn-endless-home"
          >
            <ArrowLeft className="w-4 h-4" />
            Menu
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── App ──────────────────────────────────────────────────────────────────────
export default function App() {

  // ── Data ──────────────────────────────────────────────────────────────────
  const [frames,  setFrames]  = useState([])
  const [animes,  setAnimes]  = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  // ── Navigation ─────────────────────────────────────────────────────────────
  const [currentScreen,   setCurrentScreen]   = useState('home')   // 'home' | 'game'
  const [gameMode,        setGameMode]        = useState(null)      // 'classic' | 'endless'
  const [selectedAnimeId, setSelectedAnimeId] = useState('jojo')

  // ── Game ───────────────────────────────────────────────────────────────────
  const [answer,        setAnswer]        = useState(null)
  const [guesses,       setGuesses]       = useState([])
  const [totalScore,    setTotalScore]    = useState(0)   // starts at 0, accumulates
  const [roundPoints,   setRoundPoints]   = useState(ROUND_MAX_SCORE) // Classic only
  const [currentRound,  setCurrentRound]  = useState(1)

  // ── Round/game status ──────────────────────────────────────────────────────
  const [won,             setWon]             = useState(false)
  const [surrendered,     setSurrendered]     = useState(false)
  const [classicFinished, setClassicFinished] = useState(false)
  const [endlessGameOver, setEndlessGameOver] = useState(false)
  // Endless: brief "correct" flash before loading next frame
  const [endlessCorrect,  setEndlessCorrect]  = useState(false)

  const roundOver = won || surrendered
  const gameOver  = classicFinished || endlessGameOver

  // ── Load frames ────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchFrames()
      .then(data => {
        setFrames(data)
        setAnimes(getUniqueAnimes(data))
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  // ── Start / restart a game session ────────────────────────────────────────
  const startGame = useCallback((mode, animeId) => {
    setGameMode(mode)
    setSelectedAnimeId(animeId)
    setAnswer(pickRandomFrame(frames, animeId))
    setGuesses([])
    setTotalScore(0)
    setRoundPoints(ROUND_MAX_SCORE)
    setCurrentRound(1)
    setWon(false)
    setSurrendered(false)
    setClassicFinished(false)
    setEndlessGameOver(false)
    setEndlessCorrect(false)
    setCurrentScreen('game')
  }, [frames])

  // ── Classic: advance to next round ────────────────────────────────────────
  const nextRound = useCallback(() => {
    const next = currentRound + 1
    if (next > CLASSIC_ROUNDS) { setClassicFinished(true); return }
    setCurrentRound(next)
    setAnswer(pickRandomFrame(frames, selectedAnimeId))
    setGuesses([])
    setRoundPoints(ROUND_MAX_SCORE)
    setWon(false)
    setSurrendered(false)
  }, [currentRound, frames, selectedAnimeId])

  // ── Go back to homepage ────────────────────────────────────────────────────
  const goHome = useCallback(() => {
    setCurrentScreen('home')
    setGameMode(null)
    setEndlessGameOver(false)
  }, [])

  // ── Handle guess ──────────────────────────────────────────────────────────
  const handleGuess = useCallback((guessData) => {
    if (roundOver || gameOver || !answer) return

    const result = compareGuess(guessData, answer)
    setGuesses(prev => [result, ...prev])

    if (result.isCorrect) {

      if (gameMode === 'endless') {
        // ── Endless correct: +1 score, flash, then next frame ────────────
        const newScore = Math.max(0, totalScore + 1)
        setTotalScore(newScore)
        setEndlessCorrect(true)
        setTimeout(() => {
          setEndlessCorrect(false)
          setCurrentRound(prev => prev + 1)
          setAnswer(pickRandomFrame(frames, selectedAnimeId))
          setGuesses([])
        }, 900)

      } else {
        // ── Classic correct: bank remaining round points ──────────────────
        setTotalScore(prev => Math.max(0, prev + roundPoints))
        setWon(true)
      }

    } else {

      if (gameMode === 'endless') {
        // ── Endless wrong: immediate game over, save to leaderboard ──────
        const gameResult = {
          game_mode:   'endless',
          final_score: totalScore,           // score before this miss
          frames_count: currentRound - 1,   // frames correctly guessed
          created_at: new Date().toISOString(),
        }
        saveScoreToLeaderboard(gameResult)
        setEndlessGameOver(true)

      } else {
        // ── Classic wrong: reduce round potential, floor at 0 ───────────
        setRoundPoints(prev => Math.max(0, prev - SCORE_PENALTY))
      }
    }
  }, [answer, roundOver, gameOver, roundPoints, gameMode, totalScore, currentRound, frames, selectedAnimeId])

  // ── Surrender ─────────────────────────────────────────────────────────────
  const handleSurrender = useCallback(() => {
    if (roundOver || gameOver) return
    setSurrendered(true)
    if (gameMode === 'endless') setEndlessGameOver(true)
  }, [roundOver, gameOver, gameMode])

  // ── Multiplayer placeholder ───────────────────────────────────────────────
  const handleJoinRoom = (code) => {
    alert(`Připojování k místnosti: ${code} (zatím není implementováno)`)
  }

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════════

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f17] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full"
          />
          <p className="text-white/30 text-sm">Načítám záběry…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0b0f17] flex items-center justify-center px-4">
        <div className="glass-card p-6 text-center max-w-md">
          <p className="text-2xl mb-3">⚠️</p>
          <p className="text-white font-semibold mb-1">Chyba při načítání</p>
          <p className="text-white/40 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0b0f17] font-sans">

      {/* ── Fixed top banner – always visible ──────────────────────────────── */}
      <TopBanner
        currentScreen={currentScreen}
        totalScore={totalScore}
        gameMode={gameMode}
        currentRound={currentRound}
        onGoHome={goHome}
      />

      {/* ── Page content – offset 56px for the banner ───────────────────────── */}
      <div className="pt-14">

        {/* ══ Homepage ═══════════════════════════════════════════════════════ */}
        {currentScreen === 'home' && (
          <Homepage
            animes={animes}
            onStart={startGame}
            onJoin={handleJoinRoom}
          />
        )}

        {/* ══ Game screen ════════════════════════════════════════════════════ */}
        {currentScreen === 'game' && (
          <div className="relative">

            {/* Ambient glows */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px]
                              bg-indigo-900/20 rounded-full blur-[120px]" />
              <div className="absolute top-1/3 -right-20 w-[350px] h-[350px]
                              bg-violet-900/15 rounded-full blur-[100px]" />
            </div>

            {/* Endless game-over modal */}
            <AnimatePresence>
              {endlessGameOver && (
                <EndlessGameOverModal
                  score={totalScore}
                  frameCount={currentRound - 1}
                  answer={answer}
                  onRetry={() => startGame('endless', selectedAnimeId)}
                  onHome={goHome}
                />
              )}
            </AnimatePresence>

            <div className="relative z-10 max-w-2xl mx-auto px-4 pt-4 pb-16">

              {/* ── Classic: all rounds finished ──────────────────────────── */}
              <AnimatePresence>
                {classicFinished && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-card p-6 mb-6 text-center border-indigo-500/30 bg-indigo-950/20"
                  >
                    <p className="text-4xl mb-3">🏆</p>
                    <p className="text-2xl font-black text-white mb-1">Hra dokončena!</p>
                    <p className="text-white/45 text-sm mb-4">
                      {CLASSIC_ROUNDS} kol odehráno
                    </p>
                    <p className="text-5xl font-black text-transparent bg-clip-text
                                   bg-gradient-to-r from-yellow-400 to-orange-400 tabular-nums mb-1">
                      {totalScore}
                    </p>
                    <p className="text-white/30 text-sm mb-6">celkových bodů</p>
                    <div className="flex gap-3 justify-center">
                      <motion.button
                        onClick={() => startGame('classic', selectedAnimeId)}
                        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        className="btn-primary flex items-center gap-2"
                      >
                        <Sparkles className="w-4 h-4" /> Hrát znovu
                      </motion.button>
                      <motion.button
                        onClick={goHome}
                        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        className="btn-ghost"
                      >
                        Menu
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Endless: correct flash indicator ─────────────────────── */}
              <AnimatePresence>
                {endlessCorrect && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="glass-card px-4 py-2.5 mb-4 flex items-center gap-2
                               border-green-500/30 bg-green-950/20"
                  >
                    <Zap className="w-4 h-4 text-green-400" />
                    <span className="text-green-300 font-semibold text-sm">
                      Správně! Načítám další záběr…
                    </span>
                    <span className="ml-auto text-green-400 font-bold tabular-nums">
                      +1
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Round won / surrendered banner (Classic) ──────────────── */}
              {!gameOver && !endlessCorrect && (
                <AnimatePresence>
                  {roundOver && (
                    <motion.div
                      initial={{ opacity: 0, y: -16, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -16 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                      className={`glass-card p-4 mb-5 flex items-center justify-between gap-4
                        ${won
                          ? 'border-green-500/30 bg-green-950/30'
                          : 'border-red-500/20 bg-red-950/15'
                        }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl flex-shrink-0">{won ? '🎉' : '💀'}</span>
                        <div className="min-w-0">
                          <p className="font-bold text-white text-base">
                            {won ? 'Správně!' : 'Vzdal ses'}
                          </p>
                          <p className="text-white/50 text-xs mt-0.5 truncate">
                            <span className="font-semibold text-white/80">{answer?.title}</span>
                            {' · '}Part {answer?.part} · Ep.&nbsp;{answer?.episode}
                          </p>
                        </div>
                      </div>
                      {won && (
                        <div className="text-right flex-shrink-0">
                          <p className="text-2xl font-black text-white tabular-nums">+{roundPoints}</p>
                          <p className="text-xs text-white/30">bodů</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              )}

              {/* ── Frame viewer ──────────────────────────────────────────── */}
              {!classicFinished && !endlessGameOver && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 }}
                  className="mb-4"
                >
                  <FrameViewer
                    frame={answer}
                    revealed={roundOver || endlessCorrect}
                  />
                </motion.div>
              )}

              {/* Guess counter */}
              {!roundOver && !endlessCorrect && !gameOver && guesses.length > 0 && (
                <p className="text-center text-white/20 text-xs mb-4">
                  Počet tipů: {guesses.length}
                  {gameMode === 'classic' && ` · Dostupné body: ${roundPoints}`}
                </p>
              )}

              {/* ── Guess input ────────────────────────────────────────────── */}
              <AnimatePresence>
                {!roundOver && !endlessCorrect && !gameOver && (
                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 14 }}
                    transition={{ delay: 0.08 }}
                    className="mb-5"
                  >
                    <GuessInput
                      frames={frames}
                      animes={animes}
                      selectedAnimeId={selectedAnimeId}
                      onAnimeChange={setSelectedAnimeId}
                      onGuess={handleGuess}
                      onSurrender={handleSurrender}
                      guessCount={guesses.length}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Classic post-round actions ─────────────────────────────── */}
              {roundOver && !gameOver && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.18 }}
                  className="flex gap-3 justify-center mb-6"
                >
                  {currentRound < CLASSIC_ROUNDS ? (
                    <motion.button
                      onClick={nextRound}
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      className="btn-primary flex items-center gap-2"
                      id="btn-next-round"
                    >
                      Další kolo <ChevronRight className="w-4 h-4" />
                    </motion.button>
                  ) : (
                    <motion.button
                      onClick={() => setClassicFinished(true)}
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      className="btn-primary flex items-center gap-2"
                    >
                      <Trophy className="w-4 h-4" /> Zobrazit výsledky
                    </motion.button>
                  )}
                </motion.div>
              )}

              {/* ── Guess history ──────────────────────────────────────────── */}
              {!gameOver && guesses.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.12 }}
                >
                  <GuessHistory guesses={guesses} />
                </motion.div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
