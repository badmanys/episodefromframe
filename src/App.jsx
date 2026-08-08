import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy, Film, Sparkles,
  ArrowLeft, ChevronRight,
} from 'lucide-react'
import {
  fetchFrames,
  getUniqueAnimes,
  pickRandomFrame,
  compareGuess,
} from './lib/frames.js'
import { createRoom, joinRoom, updateRoomState } from './lib/multiplayer.js'
import Homepage         from './components/Homepage.jsx'
import AnimeSelectModal from './components/AnimeSelectModal.jsx'
import Lobby            from './components/Lobby.jsx'
import FrameViewer      from './components/FrameViewer.jsx'
import GuessInput       from './components/GuessInput.jsx'
import GuessHistory     from './components/GuessHistory.jsx'

// ── Constants ────────────────────────────────────────────────────────────────
const ROUND_MAX_SCORE = 1000
const SCORE_PENALTY   = 100
const CLASSIC_ROUNDS  = 5

// ── TopBanner ─────────────────────────────────────────────────────────────────
function TopBanner({ currentScreen, totalScore, gameMode, currentRound, onGoHome }) {
  const modeLabelMap = { classic: 'Classic', multiplayer: '1v1' }
  return (
    <div className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-white/8" style={{ height: '56px' }}>
      <div className="max-w-2xl mx-auto px-4 h-full flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 min-w-0">
          {currentScreen === 'game' && (
            <motion.button onClick={onGoHome} whileHover={{ scale: 1.08, x: -1 }} whileTap={{ scale: 0.92 }}
              id="btn-back-home" className="btn-ghost p-1.5 mr-0.5 flex-shrink-0" title="Zpět do menu">
              <ArrowLeft className="w-4 h-4" />
            </motion.button>
          )}
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-500/30 flex-shrink-0">
            <Film className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white leading-tight tracking-tight whitespace-nowrap">Anime Frame Guesser</p>
            {currentScreen === 'game' && gameMode
              ? <p className="text-[10px] text-white/35 leading-none">{modeLabelMap[gameMode]}{gameMode === 'classic' && ` · Kolo ${currentRound}/${CLASSIC_ROUNDS}`}{gameMode === 'multiplayer' && ` · Kolo ${currentRound}/${CLASSIC_ROUNDS}`}</p>
              : <p className="text-[10px] text-white/25 leading-none">Uhádni epizodu</p>
            }
          </div>
        </div>
        {currentScreen === 'game' && (
          <motion.div key={totalScore} initial={{ scale: 1.3 }} animate={{ scale: 1 }} transition={{ duration: 0.3, type: 'spring', stiffness: 250, damping: 20 }}
            className="glass-card px-3 py-1.5 flex items-center gap-1.5 flex-shrink-0">
            <Trophy className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-white font-bold tabular-nums text-sm">{totalScore}</span>
          </motion.div>
        )}
      </div>
    </div>
  )
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {

  // ── Data ──────────────────────────────────────────────────────────────────
  const [frames,  setFrames]  = useState([])
  const [animes,  setAnimes]  = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  // ── Navigation ─────────────────────────────────────────────────────────────
  // 'home' | 'lobby' | 'game'
  const [currentScreen,   setCurrentScreen]   = useState('home')
  const [gameMode,        setGameMode]        = useState(null)    // 'classic' | 'multiplayer'
  const [selectedAnimeId, setSelectedAnimeId] = useState(null)   // null = random
  const [isRandom,        setIsRandom]        = useState(false)  // true = random anime mode
  const [showAnimeModal,  setShowAnimeModal]  = useState(false)  // anime-pick modal

  // ── Multiplayer ────────────────────────────────────────────────────────────
  const [lobbyRoomCode,     setLobbyRoomCode]     = useState(null)
  const [playerRole,        setPlayerRole]        = useState(null)  // 'host' | 'guest'
  const [lobbyRoomData,     setLobbyRoomData]     = useState(null)
  const [multiplayerFrames, setMultiplayerFrames] = useState([])   // preset frames from room

  // ── Game ───────────────────────────────────────────────────────────────────
  const [answer,        setAnswer]        = useState(null)
  const [guesses,       setGuesses]       = useState([])
  const [totalScore,    setTotalScore]    = useState(0)
  const [roundPoints,   setRoundPoints]   = useState(ROUND_MAX_SCORE)
  const [currentRound,  setCurrentRound]  = useState(1)

  // ── Round / game status ────────────────────────────────────────────────────
  const [won,             setWon]             = useState(false)
  const [surrendered,     setSurrendered]     = useState(false)
  const [classicFinished, setClassicFinished] = useState(false)

  const roundOver = won || surrendered
  const gameOver  = classicFinished

  // ── Load frames ────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchFrames()
      .then(data => { setFrames(data); setAnimes(getUniqueAnimes(data)); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [])

  // ── Mode button click on Homepage ─────────────────────────────────────────
  const handleModeClick = useCallback((modeId) => {
    if (modeId === 'classic') setShowAnimeModal(true)
  }, [])

  // ── Anime selection from modal ─────────────────────────────────────────────
  const handleAnimeSelect = useCallback((animeId) => {
    setShowAnimeModal(false)
    const random = animeId === 'random'
    setIsRandom(random)
    const id = random ? null : animeId
    setSelectedAnimeId(id)
    startGame('classic', id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frames])

  // ── Start / restart a game session ────────────────────────────────────────
  const startGame = useCallback((mode, animeId, presetFrames) => {
    setGameMode(mode)
    setSelectedAnimeId(animeId)
    const pFrames = presetFrames && presetFrames.length > 0 ? presetFrames : []
    setMultiplayerFrames(pFrames)
    // animeId=null → random mode: pickRandomFrame selects from ALL frames
    const firstFrame = pFrames.length > 0 ? pFrames[0] : pickRandomFrame(frames, animeId)
    setAnswer(firstFrame)
    setGuesses([])
    setTotalScore(0)
    setRoundPoints(ROUND_MAX_SCORE)
    setCurrentRound(1)
    setWon(false)
    setSurrendered(false)
    setClassicFinished(false)
    setCurrentScreen('game')
  }, [frames])

  // ── Advance to next round ──────────────────────────────────────────────────
  const nextRound = useCallback(() => {
    const next = currentRound + 1
    if (next > CLASSIC_ROUNDS) { setClassicFinished(true); return }
    setCurrentRound(next)
    if (multiplayerFrames.length > 0) {
      setAnswer(multiplayerFrames[next - 1] ?? multiplayerFrames[0])
    } else {
      // null selectedAnimeId = random mode → pick truly random frame
      setAnswer(pickRandomFrame(frames, selectedAnimeId))
    }
    setGuesses([])
    setRoundPoints(ROUND_MAX_SCORE)
    setWon(false)
    setSurrendered(false)
  }, [currentRound, frames, selectedAnimeId, multiplayerFrames])

  // ── Go back to homepage ────────────────────────────────────────────────────
  const goHome = useCallback(() => {
    setCurrentScreen('home')
    setGameMode(null)
    setLobbyRoomCode(null)
    setLobbyRoomData(null)
    setPlayerRole(null)
    setMultiplayerFrames([])
    setIsRandom(false)
    setShowAnimeModal(false)
  }, [])

  // ── Handle guess ──────────────────────────────────────────────────────────
  const handleGuess = useCallback((guessData) => {
    if (roundOver || gameOver || !answer) return
    const result = compareGuess(guessData, answer)
    setGuesses(prev => [result, ...prev])
    if (result.isCorrect) {
      const newScore = Math.max(0, totalScore + roundPoints)
      setTotalScore(newScore)
      setWon(true)
      if (gameMode === 'multiplayer' && lobbyRoomCode) {
        const field = playerRole === 'host' ? 'player1_score' : 'player2_score'
        updateRoomState(lobbyRoomCode, { [field]: newScore }).catch(console.error)
      }
    } else {
      setRoundPoints(prev => Math.max(0, prev - SCORE_PENALTY))
    }
  }, [answer, roundOver, gameOver, roundPoints, totalScore, gameMode, lobbyRoomCode, playerRole])

  // ── Surrender ─────────────────────────────────────────────────────────────
  const handleSurrender = useCallback(() => {
    if (roundOver || gameOver) return
    setSurrendered(true)
  }, [roundOver, gameOver])

  // ── Multiplayer: create room ───────────────────────────────────────────────
  const handleCreateRoom = useCallback(async (animeId) => {
    const { data, error: err } = await createRoom(frames, animeId)
    if (err || !data) return typeof err === 'string' ? err : 'Nepodařilo se vytvořit místnost. Zkontroluj Supabase konfiguraci.'
    setSelectedAnimeId(animeId)
    setLobbyRoomCode(data.code)
    setLobbyRoomData(data)
    setPlayerRole('host')
    setCurrentScreen('lobby')
    return null
  }, [frames])

  // ── Multiplayer: join room ─────────────────────────────────────────────────
  const handleJoinRoom = useCallback(async (roomCode) => {
    const { data, error: err } = await joinRoom(roomCode)
    if (err || !data) return err || 'Nepodařilo se připojit. Zkontroluj kód místnosti.'
    setSelectedAnimeId(data.anime_id)
    setLobbyRoomCode(data.code)
    setLobbyRoomData(data)
    setPlayerRole('guest')
    if (data.status === 'playing' && data.current_round >= 1) {
      handleMultiplayerGameStart(data)
    } else {
      setCurrentScreen('lobby')
    }
    return null
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Multiplayer: game started from lobby ──────────────────────────────────
  const handleMultiplayerGameStart = useCallback((roomData) => {
    setIsRandom(false)
    startGame('multiplayer', roomData.anime_id, roomData.frames || [])
  }, [startGame])

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════════

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f17] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full" />
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

      {/* Fixed top banner (Game screen only) */}
      {currentScreen === 'game' && (
        <TopBanner currentScreen={currentScreen} totalScore={totalScore} gameMode={gameMode} currentRound={currentRound} onGoHome={goHome} />
      )}

      <div className={currentScreen === 'game' ? 'pt-14' : ''}>

        {/* ══ Homepage ══════════════════════════════════════════════════════ */}
        {currentScreen === 'home' && (
          <>
            <Homepage onStart={handleModeClick} onCreate={handleCreateRoom} onJoin={handleJoinRoom} />
            {showAnimeModal && (
              <AnimeSelectModal animes={animes} onSelect={handleAnimeSelect} onClose={() => setShowAnimeModal(false)} />
            )}
          </>
        )}

        {/* ══ Lobby ═════════════════════════════════════════════════════════ */}
        {currentScreen === 'lobby' && (
          <Lobby
            roomCode={lobbyRoomCode}
            role={playerRole}
            roomData={lobbyRoomData}
            onGameStart={handleMultiplayerGameStart}
            onCancel={goHome}
          />
        )}

        {/* ══ Game screen ═══════════════════════════════════════════════════ */}
        {currentScreen === 'game' && (
          <div className="relative">
            {/* Ambient glows */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-900/20 rounded-full blur-[120px]" />
              <div className="absolute top-1/3 -right-20 w-[350px] h-[350px] bg-violet-900/15 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 max-w-2xl mx-auto px-4 pt-4 pb-16">

              {/* Classic: all rounds finished */}
              <AnimatePresence>
                {classicFinished && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="glass-card p-6 mb-6 text-center border-indigo-500/30 bg-indigo-950/20"
                  >
                    <p className="text-4xl mb-3">🏆</p>
                    <p className="text-2xl font-black text-white mb-1">Hra dokončena!</p>
                    <p className="text-white/45 text-sm mb-4">{CLASSIC_ROUNDS} kol odehráno</p>
                    <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 tabular-nums mb-1">{totalScore}</p>
                    <p className="text-white/30 text-sm mb-6">celkových bodů</p>
                    <div className="flex gap-3 justify-center">
                      <motion.button onClick={() => { setShowAnimeModal(true); setCurrentScreen('home') }}
                        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="btn-primary flex items-center gap-2">
                        <Sparkles className="w-4 h-4" /> Hrát znovu
                      </motion.button>
                      <motion.button onClick={goHome} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="btn-ghost">Menu</motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Round won / surrendered banner */}
              {!gameOver && (
                <AnimatePresence>
                  {roundOver && (
                    <motion.div
                      initial={{ opacity: 0, y: -16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -16 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                      className={`glass-card p-4 mb-5 flex items-center justify-between gap-4 ${won ? 'border-green-500/30 bg-green-950/30' : 'border-red-500/20 bg-red-950/15'}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl flex-shrink-0">{won ? '🎉' : '💀'}</span>
                        <div className="min-w-0">
                          <p className="font-bold text-white text-base">{won ? 'Správně!' : 'Vzdal ses'}</p>
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

              {/* Frame viewer */}
              {!classicFinished && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }} className="mb-4">
                  <FrameViewer frame={answer} revealed={roundOver} />
                </motion.div>
              )}

              {/* Guess counter */}
              {!roundOver && !gameOver && guesses.length > 0 && (
                <p className="text-center text-white/20 text-xs mb-4">
                  Počet tipů: {guesses.length}{` · Dostupné body: ${roundPoints}`}
                </p>
              )}

              {/* Guess input */}
              <AnimatePresence>
                {!roundOver && !gameOver && (
                  <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 14 }} transition={{ delay: 0.08 }} className="mb-5">
                    <GuessInput
                      frames={frames}
                      animes={animes}
                      selectedAnimeId={selectedAnimeId || 'jojo'}
                      onAnimeChange={setSelectedAnimeId}
                      onGuess={handleGuess}
                      onSurrender={handleSurrender}
                      guessCount={guesses.length}
                      isRandom={isRandom}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Post-round actions */}
              {roundOver && !gameOver && (
                <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.18 }} className="flex gap-3 justify-center mb-6">
                  {currentRound < CLASSIC_ROUNDS
                    ? <motion.button onClick={nextRound} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="btn-primary flex items-center gap-2" id="btn-next-round">Další kolo <ChevronRight className="w-4 h-4" /></motion.button>
                    : <motion.button onClick={() => setClassicFinished(true)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="btn-primary flex items-center gap-2"><Trophy className="w-4 h-4" /> Zobrazit výsledky</motion.button>
                  }
                </motion.div>
              )}

              {/* Guess history */}
              {!gameOver && guesses.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }}>
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
