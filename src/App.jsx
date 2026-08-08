import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy, Film, Sparkles,
  ArrowLeft, ChevronRight, Users, Loader2
} from 'lucide-react'
import {
  fetchFrames,
  getUniqueAnimes,
  pickRandomFrame,
  compareGuess,
  getDailyFrame,
} from './lib/frames.js'
import { createRoom, joinRoom, updateRoomState, submitGuess, evaluateMultiplayerRound, subscribeToRoom, fetchRoom } from './lib/multiplayer.js'
import { obfuscateFrame, deobfuscateFrame } from './lib/security.js'
import Homepage         from './components/Homepage.jsx'
import AnimeSelectModal from './components/AnimeSelectModal.jsx'
import NicknameModal    from './components/NicknameModal.jsx'
import LobbyScreen      from './components/LobbyScreen.jsx'
import FrameViewer      from './components/FrameViewer.jsx'
import GuessInput       from './components/GuessInput.jsx'
import GuessHistory     from './components/GuessHistory.jsx'
import WikiModal        from './components/WikiModal.jsx'
import DailySidePanel   from './components/DailySidePanel.jsx'
import AdminScreen      from './components/AdminScreen.jsx'
import RoundResultsScreen from './components/RoundResultsScreen.jsx'
import { supabase }     from './lib/supabase.js'

// ── Constants ────────────────────────────────────────────────────────────────
const ROUND_MAX_SCORE = 1000
const SCORE_PENALTY   = 100
const CLASSIC_ROUNDS  = 5

// ── TopBanner ─────────────────────────────────────────────────────────────────
function TopBanner({ currentScreen, totalScore, gameMode, currentRound, onGoHome, opponentScore, lobbyRoomData }) {
  const totalRounds = gameMode === 'multiplayer' ? (lobbyRoomData?.total_rounds || 4) : CLASSIC_ROUNDS
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-[#0f111a] border-b border-white/8" style={{ height: '56px' }}>
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
              ? <p className="text-[10px] text-white/35 leading-none">Kolo {currentRound}/{totalRounds}</p>
              : <p className="text-[10px] text-white/25 leading-none">Uhádni epizodu</p>
            }
          </div>
        </div>
        {currentScreen === 'game' && (
          <div className="flex items-center gap-3">
            {gameMode === 'multiplayer' && (
              <div className="glass-card px-3 py-1.5 flex items-center gap-1.5 flex-shrink-0 opacity-60">
                <Users className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-white font-bold tabular-nums text-sm">{opponentScore ?? 0}</span>
              </div>
            )}
            <motion.div key={totalScore} initial={{ scale: 1.3 }} animate={{ scale: 1 }} transition={{ duration: 0.3, type: 'spring', stiffness: 250, damping: 20 }}
              className="glass-card px-3 py-1.5 flex items-center gap-1.5 flex-shrink-0">
              <Trophy className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-white font-bold tabular-nums text-sm">{totalScore}</span>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {

  // ── Admin mode (přístup přes ?admin v URL) ───────────────────────────────
  const [isAdminMode, setIsAdminMode] = useState(
    () => new URLSearchParams(window.location.search).has('admin')
  )

  // ── Data ──────────────────────────────────────────────────────────────────
  const [frames,  setFrames]  = useState([])
  const [animes,  setAnimes]  = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  // ── Nickname ───────────────────────────────────────────────────────────────
  const [nickname,          setNickname]          = useState(() => localStorage.getItem('nickname') || '')
  const [showNicknameModal, setShowNicknameModal] = useState(false)
  const [pendingAction,     setPendingAction]     = useState(null) // action to run after nickname set

  const handleSaveNickname = useCallback((name) => {
    localStorage.setItem('nickname', name)
    setNickname(name)
    setShowNicknameModal(false)
    // Execute the action that was blocked by missing nickname
    if (pendingAction) {
      pendingAction()
      setPendingAction(null)
    }
  }, [pendingAction])

  // Require nickname before any game action
  const requireNickname = useCallback((action) => {
    if (!nickname) {
      setPendingAction(() => action)
      setShowNicknameModal(true)
      return false
    }
    return true
  }, [nickname])

  // ── Navigation ─────────────────────────────────────────────────────────────
  // 'home' | 'lobby' | 'game'
  const [currentScreen,   setCurrentScreen]   = useState('home')
  const [gameMode,        setGameMode]        = useState(null)    // 'classic' | 'multiplayer'
  const [selectedAnimeId, setSelectedAnimeId] = useState(null)   // null = random
  const [isRandom,        setIsRandom]        = useState(false)  // true = random anime mode
  const [showAnimeModal,  setShowAnimeModal]  = useState(false)  // anime-pick modal
  const [showWiki,        setShowWiki]        = useState(false)  // wiki modal
  const [animeModalAction,setAnimeModalAction]= useState('classic') // 'classic' | 'multiplayer'
  const [isJoiningRoom,   setIsJoiningRoom]   = useState(false)

  // ── Multiplayer ────────────────────────────────────────────────────────────
  const [lobbyRoomCode,     setLobbyRoomCode]     = useState(null)
  const [playerRole,        setPlayerRole]        = useState(null)  // 'host' | 'guest'
  const [lobbyRoomData,     setLobbyRoomData]     = useState(null)
  const [multiplayerFrames, setMultiplayerFrames] = useState([])   // preset frames from room
  const [waitingForOpponent, setWaitingForOpponent] = useState(false)
  const [multiplayerResult,  setMultiplayerResult]  = useState(null) // 'win' | 'lose' | 'draw' | null

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

  const roundOver = won || surrendered || multiplayerResult !== null
  const gameOver  = classicFinished

  const opponentScore = lobbyRoomData ? (playerRole === 'host' ? lobbyRoomData.player2_score : lobbyRoomData.player1_score) : 0
  const myScore = lobbyRoomData ? (playerRole === 'host' ? lobbyRoomData.player1_score : lobbyRoomData.player2_score) : totalScore

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
    setWaitingForOpponent(false)
    setMultiplayerResult(null)
    setError(null)
    setIsJoiningRoom(false)
    
    // Zrušíme případný parametr z URL, abychom nezůstali zacyklení
    const url = new URL(window.location)
    if (url.searchParams.has('room')) {
      url.searchParams.delete('room')
      window.history.replaceState({}, '', url)
    }
  }, [])

  // ── Load frames ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetchFrames()
      .then(data => { setFrames(data); setAnimes(getUniqueAnimes(data)); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [])

  // ── Auto-show nickname modal on first visit ────────────────────────────────
  useEffect(() => {
    if (!loading && !nickname) {
      setShowNicknameModal(true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  // ── Auto-join from URL ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!loading && frames.length > 0 && currentScreen === 'home') {
      const url = new URL(window.location)
      const roomParam = url.searchParams.get('room')
      if (roomParam && !isJoiningRoom && !lobbyRoomCode) {
        handleJoinRoom(roomParam)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, frames, currentScreen, lobbyRoomCode])

  // ── Realtime Multiplayer Subscription & Fallback Polling ─────────────────
  useEffect(() => {
    if (!lobbyRoomCode || !nickname) return
    let channel = null
    try {
      channel = subscribeToRoom(lobbyRoomCode, nickname, (updatedRoom) => {
        setLobbyRoomData(updatedRoom)
      }, (leftName) => {
        console.log('[Multiplayer] Odpojil se hráč:', leftName)
      })
    } catch (err) {
      console.error('[Multiplayer] Failed to subscribe:', err)
    }

    // Fallback polling v případě selhání Realtime spojení
    const interval = setInterval(async () => {
      // Polling běží jen pokud jsme v čekárně (Lobby)
      if (lobbyRoomCode) {
        const { data } = await fetchRoom(lobbyRoomCode)
        if (data) {
          setLobbyRoomData(data)
        }
      }
    }, 2500)

    return () => {
      if (channel) {
        try { supabase.removeChannel(channel) } catch (err) { console.error('[Multiplayer] removeChannel error:', err) }
      }
      clearInterval(interval)
    }
  }, [lobbyRoomCode, nickname])


  // ── Effect: Game logic from room updates ──────────────────────────────────
  useEffect(() => {
    if (!lobbyRoomData || gameMode !== 'multiplayer' || !answer) return

    const players = lobbyRoomData.players || []
    const allGuessed = players.length > 0 && players.every(p => p.guess !== null)

    // 1. Advance round if host progressed it
    if (lobbyRoomData.current_round > currentRound) {
      nextRoundLocal()
    }

    // 2. Only Host evaluates and updates Supabase state when all guess
    if (playerRole === 'host' && allGuessed && lobbyRoomData.status === 'playing') {
      const results = evaluateMultiplayerRound(players, answer, isRandom)
      
      const updatedPlayers = players.map(p => {
        const playerResult = results.sortedPlayers.find(r => r.role === p.role)
        let roundScore = 0
        
        if (playerResult?.valid) {
          roundScore += 1 // Krok 2 (Základní bod za Part/Sérii)
          if (results.winners.includes(p.role)) {
            roundScore += 1 // Krok 3 (Bonus za nejbližší Epizodu)
          }
        }
        
        return { ...p, score: (p.score || 0) + roundScore }
      })
      
      updateRoomState(lobbyRoomCode, { 
        status: 'round_results', 
        players: updatedPlayers
      })
    }
  }, [lobbyRoomData, gameMode, answer, isRandom, playerRole, currentRound, lobbyRoomCode])

  // Timer byl přesunut do RoundResultsScreen jako mount-based timer pro maximální spolehlivost

  // ── Start / restart a game session ────────────────────────────────────────
  const startGame = useCallback((mode, animeId, presetFrames) => {
    const pFrames = presetFrames && Array.isArray(presetFrames) ? presetFrames : []
    
    // Pokud je to multiplayer a nemáme data o framerch ze Supabase, vyhodíme chybu
    if (mode === 'multiplayer' && pFrames.length === 0) {
      setError('Chyba: Nepodařilo se načíst snímky z místnosti. Zkus se připojit znovu.')
      return
    }

    setGameMode(mode)
    setSelectedAnimeId(animeId)
    const deobfuscatedPFrames = pFrames.map(deobfuscateFrame)
    setMultiplayerFrames(deobfuscatedPFrames)
    
    let firstFrame = null;
    if (mode === 'daily') {
      const today = new Date().toISOString().split('T')[0]
      firstFrame = getDailyFrame(frames, today)
    } else {
      firstFrame = deobfuscatedPFrames.length > 0 ? deobfuscatedPFrames[0] : pickRandomFrame(frames, animeId)
    }

    if (!firstFrame) {
      setError('Omlouváme se, nenašli jsme žádné snímky pro hru.')
      return
    }

    setAnswer(firstFrame)
    setGuesses([])
    setTotalScore(0)
    setRoundPoints(ROUND_MAX_SCORE)
    setCurrentRound(1)
    setWon(false)
    setSurrendered(false)
    setClassicFinished(false)
    setWaitingForOpponent(false)
    setMultiplayerResult(null)
    setCurrentScreen('game')
  }, [frames])

  // ── Mode button click on Homepage ─────────────────────────────────────────
  const handleModeClick = useCallback((modeId) => {
    const action = () => {
      if (modeId === 'daily') {
        startGame('daily')
      } else if (modeId === 'classic' || modeId === 'multiplayer') {
        setAnimeModalAction(modeId)
        setShowAnimeModal(true)
      }
    }
    // If no nickname → show modal, store action to run after save; otherwise run now
    if (!requireNickname(action)) return
    action()
  }, [startGame, requireNickname])

  // ── Anime selection from modal ─────────────────────────────────────────────
  const handleAnimeSelect = useCallback(async (animeId, options) => {
    setShowAnimeModal(false)
    const random = animeId === 'random'
    const id = random ? null : animeId
    setIsRandom(random)
    setSelectedAnimeId(id)

    if (animeModalAction === 'classic') {
      startGame('classic', id)
    } else {
      const err = await handleCreateRoom(id, options)
      if (err) alert(err)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frames, animeModalAction, startGame])

  // ── Advance to next round locally ──────────────────────────────────────────
  const nextRoundLocal = useCallback(() => {
    const next = currentRound + 1
    const maxRounds = gameMode === 'multiplayer' ? (lobbyRoomData?.total_rounds || 4) : CLASSIC_ROUNDS

    if (next > maxRounds || gameMode === 'daily') { setClassicFinished(true); return }
    setCurrentRound(next)
    
    if (multiplayerFrames.length > 0) {
      setAnswer(multiplayerFrames[next - 1] ?? multiplayerFrames[0])
    } else {
      setAnswer(pickRandomFrame(frames, selectedAnimeId))
    }
    
    setGuesses([])
    setRoundPoints(ROUND_MAX_SCORE)
    setWon(false)
    setSurrendered(false)
    setWaitingForOpponent(false)
    setMultiplayerResult(null)
  }, [currentRound, gameMode, frames, selectedAnimeId, multiplayerFrames])

  const handleNextRoundButton = useCallback(async () => {
    if (gameMode === 'multiplayer') {
      if (playerRole === 'host') {
        try {
          const next = currentRound + 1
          const maxR = lobbyRoomData?.total_rounds || 4
          if (next > maxR) {
            await updateRoomState(lobbyRoomCode, { status: 'finished' })
            setClassicFinished(true)
          } else {
            // Clear all guesses for the next round
            const players = lobbyRoomData?.players || []
            const clearedPlayers = players.map(p => ({ ...p, guess: null }))
            await updateRoomState(lobbyRoomCode, { status: 'playing', current_round: next, players: clearedPlayers })
          }
        } catch (error) {
          console.error("Chyba posunu kola:", error)
        }
      }
    } else {
      nextRoundLocal()
    }
  }, [gameMode, currentRound, lobbyRoomCode, playerRole, lobbyRoomData, nextRoundLocal])


  // ── Handle guess ──────────────────────────────────────────────────────────
  const handleGuess = useCallback(async (guessData) => {
    if (roundOver || gameOver || !answer) return

    if (gameMode === 'multiplayer') {
      setWaitingForOpponent(true)
      await submitGuess(lobbyRoomCode, playerRole, guessData)
    } else {
      const result = compareGuess(guessData, answer)
      setGuesses(prev => [result, ...prev])
      if (result.isCorrect) {
        const newScore = Math.max(0, totalScore + roundPoints)
        setTotalScore(newScore)
        setWon(true)
      } else {
        setRoundPoints(prev => Math.max(0, prev - SCORE_PENALTY))
      }
    }
  }, [answer, roundOver, gameOver, roundPoints, totalScore, gameMode, lobbyRoomCode, playerRole])

  // ── Surrender ─────────────────────────────────────────────────────────────
  const handleSurrender = useCallback(async () => {
    if (roundOver || gameOver) return
    if (gameMode === 'multiplayer') {
      setWaitingForOpponent(true)
      await submitGuess(lobbyRoomCode, playerRole, { surrendered: true })
    } else {
      setSurrendered(true)
    }
  }, [roundOver, gameOver, gameMode, lobbyRoomCode, playerRole])

  // ── Multiplayer: create room ───────────────────────────────────────────────
  const handleCreateRoom = useCallback(async (animeId, options) => {
    setIsJoiningRoom(true)
    const { data, role, error: err } = await createRoom(frames, animeId, options, nickname)
    setIsJoiningRoom(false)
    
    if (err || !data) return typeof err === 'string' ? err : 'Nepodařilo se vytvořit místnost. Zkontroluj Supabase konfiguraci.'
    
    console.log('[1v1] Room created:', data)
    
    setLobbyRoomCode(data.code)
    setLobbyRoomData(data)
    setPlayerRole(role)
    setCurrentScreen('lobby')
    
    console.log('[1v1] Current state updated to: lobby')
    
    return null
  }, [frames, nickname])

  // ── Multiplayer: join room ─────────────────────────────────────────────────
  const handleJoinRoom = useCallback(async (roomCode) => {
    // Gate behind nickname — auto-join from URL might run before nickname is set
    if (!nickname) {
      setPendingAction(() => () => handleJoinRoom(roomCode))
      setShowNicknameModal(true)
      return 'Nejprve zadej přezdívku.'
    }
    setIsJoiningRoom(true)
    const { data, role, error: err } = await joinRoom(roomCode, nickname)
    setIsJoiningRoom(false)
    
    if (err || !data) {
      setError(err || 'Nepodařilo se připojit. Zkontroluj kód místnosti.')
      return err
    }
    
    const isR = data.anime_id === 'random'
    setIsRandom(isR)
    setSelectedAnimeId(isR ? null : data.anime_id)
    setLobbyRoomCode(data.code)
    setLobbyRoomData(data)
    setPlayerRole(role)
    
    if (data.status === 'playing' && data.current_round >= 1) {
      startGame('multiplayer', isR ? null : data.anime_id, data.frames || [])
    } else {
      setCurrentScreen('lobby')
    }
    return null
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startGame, nickname])

  // ── Multiplayer: game started from lobby (host triggers) ──────────────────
  const handleMultiplayerGameStart = useCallback((roomData) => {
    const isR = roomData.anime_id === 'random'
    setIsRandom(isR)
    setSelectedAnimeId(isR ? null : roomData.anime_id)
    startGame('multiplayer', isR ? null : roomData.anime_id, roomData.frames || [])
  }, [startGame])

  // ── Effect: Auto-starts game when room is playing ────────────────────────
  useEffect(() => {
    if (
      currentScreen === 'lobby' &&
      lobbyRoomData?.status === 'playing' &&
      lobbyRoomData?.current_round >= 1
    ) {
      handleMultiplayerGameStart(lobbyRoomData)
    }
  }, [currentScreen, playerRole, lobbyRoomData, handleMultiplayerGameStart])

  const handleHostStartGame = useCallback(() => {
    if (playerRole === 'host' && lobbyRoomCode) {
      updateRoomState(lobbyRoomCode, { status: 'playing', current_round: 1 })
    }
  }, [playerRole, lobbyRoomCode])

  const handleUpdateRoomSettings = useCallback((newSettings) => {
    if (playerRole !== 'host' || !lobbyRoomCode || !lobbyRoomData) return
    
    const updates = { ...newSettings }
    
    if (newSettings.anime_id !== undefined || newSettings.total_rounds !== undefined) {
       const newAnimeId = newSettings.anime_id !== undefined ? newSettings.anime_id : lobbyRoomData.anime_id;
       const newRounds = newSettings.total_rounds !== undefined ? newSettings.total_rounds : lobbyRoomData.total_rounds;
       
       const isRandom = newAnimeId === 'random' || newAnimeId === null
       const animeFrames = isRandom ? frames : frames.filter(f => f.animeId === newAnimeId)
       if (animeFrames.length > 0) {
         const shuffled = [...animeFrames].sort(() => Math.random() - 0.5)
         updates.frames = shuffled.slice(0, Math.min(newRounds, shuffled.length)).map(obfuscateFrame)
       }
    }
    
    updateRoomState(lobbyRoomCode, updates)
  }, [playerRole, lobbyRoomCode, lobbyRoomData, frames])

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

  if (isJoiningRoom) {
    return (
      <div className="min-h-screen bg-[#0b0f17] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-teal-500/20 border-t-teal-500 rounded-full" />
          <p className="text-white/30 text-sm font-medium">Připojování do místnosti...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0b0f17] flex items-center justify-center px-4">
        <div className="glass-card p-8 text-center max-w-md border border-red-500/20 bg-red-950/10">
          <p className="text-4xl mb-4">⚠️</p>
          <p className="text-white font-bold text-lg mb-2">Jejda, něco se pokazilo</p>
          <p className="text-white/50 text-sm mb-6 leading-relaxed">{error}</p>
          <button onClick={goHome} className="btn-primary flex items-center justify-center gap-2 w-full">
            <ArrowLeft className="w-4 h-4" /> Zpět na hlavní stránku
          </button>
        </div>
      </div>
    )
  }

  // Admin mode — early return, nic jineho se nerenderuje
  if (isAdminMode) {
    return (
      <AdminScreen
        animes={animes}
        onBack={() => {
          setIsAdminMode(false)
          const url = new URL(window.location)
          url.searchParams.delete('admin')
          window.history.replaceState({}, '', url)
        }}
        onFramesChanged={() => {
          fetchFrames()
            .then(data => { setFrames(data); setAnimes(getUniqueAnimes(data)) })
            .catch(console.error)
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#0b0f17] font-sans">

      {/* Fixed top banner (Game screen only) */}
      {currentScreen === 'game' && (
        <TopBanner currentScreen={currentScreen} totalScore={myScore} gameMode={gameMode} currentRound={currentRound} onGoHome={goHome} opponentScore={opponentScore} lobbyRoomData={lobbyRoomData} />
      )}


      <div className={currentScreen === 'game' ? 'pt-14' : ''}>

        {/* ══ Homepage ══════════════════════════════════════════════════════ */}
        {currentScreen === 'home' && (
          <>
            <Homepage
              onStart={handleModeClick}
              onCreate={() => handleModeClick('multiplayer')}
              onJoin={handleJoinRoom}
              onRequestWiki={() => setShowWiki(true)}
              nickname={nickname}
              onRequestChangeNickname={() => setShowNicknameModal(true)}
            />
            {showAnimeModal && (
              <AnimeSelectModal animes={animes} onSelect={handleAnimeSelect} onClose={() => setShowAnimeModal(false)} />
            )}
            <AnimatePresence>
              {showNicknameModal && (
                <NicknameModal
                  onSave={handleSaveNickname}
                  onCancel={() => { setShowNicknameModal(false); setPendingAction(null) }}
                  allowCancel={!!nickname}
                />
              )}
            </AnimatePresence>
          </>
        )}

        {/* ══ Lobby ═════════════════════════════════════════════════════════ */}
        {currentScreen === 'lobby' && (
          <LobbyScreen
            roomCode={lobbyRoomCode}
            role={playerRole}
            roomData={lobbyRoomData}
            onStartEarly={handleHostStartGame}
            onCancel={goHome}
            animes={animes}
            onUpdateSettings={handleUpdateRoomSettings}
          />
        )}

        {/* ══ Game screen ═══════════════════════════════════════════════════ */}
        {currentScreen === 'game' && (
          <div className="relative">
            {lobbyRoomData?.status === 'round_results' && gameMode === 'multiplayer' && (
              <RoundResultsScreen 
                players={lobbyRoomData.players}
                answer={answer}
                isRandom={isRandom}
                isHost={playerRole === 'host'}
                onNextRound={handleNextRoundButton}
              />
            )}
            {/* Ambient glows */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-900/20 rounded-full blur-[120px]" />
              <div className="absolute top-1/3 -right-20 w-[350px] h-[350px] bg-violet-900/15 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 max-w-2xl mx-auto px-4 pt-4 pb-16">

              {/* Classic / Multiplayer: all rounds finished */}
              <AnimatePresence>
                {classicFinished && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="glass-card p-6 mb-6 text-center border-indigo-500/30 bg-indigo-950/20"
                  >
                    <p className="text-4xl mb-3">🏆</p>
                    <p className="text-2xl font-black text-white mb-1">Hra dokončena!</p>
                    <p className="text-white/45 text-sm mb-4">{gameMode === 'multiplayer' ? (lobbyRoomData?.total_rounds || 4) : CLASSIC_ROUNDS} kol odehráno</p>
                    <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 tabular-nums mb-1">{myScore}</p>
                    <p className="text-white/30 text-sm mb-6">{gameMode === 'multiplayer' ? 'tvých bodů' : 'celkových bodů'}</p>
                    
                    {gameMode === 'multiplayer' && (
                       <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
                         <p className="text-sm text-white/50 mb-1">Výsledek</p>
                         <p className={`text-xl font-bold ${myScore > opponentScore ? 'text-green-400' : myScore < opponentScore ? 'text-red-400' : 'text-yellow-400'}`}>
                           {myScore > opponentScore ? 'Vyhrál jsi! 🎉' : myScore < opponentScore ? 'Prohrál jsi 💀' : 'Remíza 🤝'}
                         </p>
                       </div>
                    )}

                    <div className="flex flex-col items-center justify-center w-full max-w-xs mx-auto gap-4 mt-2">
                      <motion.button onClick={() => { setShowAnimeModal(true); setCurrentScreen('home') }}
                        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="btn-primary flex items-center justify-center gap-2">
                        <Sparkles className="w-4 h-4" /> Hrát znovu
                      </motion.button>
                      <motion.button onClick={goHome} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="btn-ghost w-full">Zpět do menu</motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Round won / surrendered banner (Classic) OR Multiplayer Result */}
              {!gameOver && (
                <AnimatePresence>
                  {(roundOver || multiplayerResult) && (
                    <motion.div
                      initial={{ opacity: 0, y: -16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -16 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                      className={`glass-card p-4 mb-5 flex items-center justify-between gap-4 ${won || multiplayerResult === 'win' ? 'border-green-500/30 bg-green-950/30' : multiplayerResult === 'draw' ? 'border-yellow-500/30 bg-yellow-950/30' : 'border-red-500/20 bg-red-950/15'}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl flex-shrink-0">{won || multiplayerResult === 'win' ? '🎉' : multiplayerResult === 'draw' ? '🤝' : '💀'}</span>
                        <div className="min-w-0">
                          <p className="font-bold text-white text-base">
                            {gameMode === 'multiplayer' 
                              ? (multiplayerResult === 'win' ? 'Získáváš bod!' : multiplayerResult === 'draw' ? 'Remíza - nikdo nemá bod' : 'Soupeř získal bod!')
                              : (won ? 'Správně!' : 'Vzdal ses')
                            }
                          </p>
                          <p className="text-white/50 text-xs mt-0.5 truncate">
                            <span className="font-semibold text-white/80">{answer?.title}</span>
                            {' · '}Part {answer?.part} · Ep.&nbsp;{answer?.episode}{answer?.episode_name ? ` – ${answer?.episode_name}` : ''}
                          </p>
                        </div>
                      </div>
                      {gameMode !== 'multiplayer' && won && (
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
                  <FrameViewer frame={answer} revealed={roundOver || multiplayerResult} />
                </motion.div>
              )}

              {/* Guess counter (Classic) */}
              {!roundOver && !gameOver && guesses.length > 0 && gameMode === 'classic' && (
                <p className="text-center text-white/20 text-xs mb-4">
                  Počet tipů: {guesses.length}{` · Dostupné body: ${roundPoints}`}
                </p>
              )}

              {/* Guess input */}
              <AnimatePresence>
                {!roundOver && !gameOver && (
                  <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 14 }} transition={{ delay: 0.08 }} className="mb-5">
                    {waitingForOpponent ? (
                      <div className="glass-card p-6 flex flex-col items-center justify-center gap-3 text-white/60">
                         <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                         <p className="text-sm font-medium">Tip odeslán. Čekám na soupeře...</p>
                      </div>
                    ) : (
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
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Post-round actions */}
              {(roundOver || multiplayerResult) && !gameOver && (
                <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.18 }} className="flex gap-3 justify-center mb-6">
                  {gameMode === 'multiplayer' && playerRole === 'guest' ? (
                     <p className="text-sm text-white/40">Čekání na hostitele...</p>
                  ) : gameMode === 'daily' ? (
                     <p className="text-sm text-white/40">Zítra tě čeká nová výzva!</p>
                  ) : (
                    currentRound < (gameMode === 'multiplayer' ? (lobbyRoomData?.total_rounds || 4) : CLASSIC_ROUNDS)
                      ? <motion.button onClick={handleNextRoundButton} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="btn-primary flex items-center justify-center text-center w-full gap-2" id="btn-next-round">Další kolo <ChevronRight className="w-4 h-4" /></motion.button>
                      : <motion.button onClick={handleNextRoundButton} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="btn-primary flex items-center justify-center text-center w-full gap-2"><Trophy className="w-4 h-4" /> Zobrazit výsledky</motion.button>
                  )}
                </motion.div>
              )}

              {/* Guess history (Classic) */}
              {!gameOver && guesses.length > 0 && gameMode === 'classic' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }}>
                  <GuessHistory guesses={guesses} animes={animes} />
                </motion.div>
              )}
            </div>
          </div>
        )}

        {/* ── Wiki & Daily Challenge Panels ── */}
        <WikiModal 
          isOpen={showWiki} 
          onClose={() => setShowWiki(false)} 
        />

        {gameMode === 'daily' && guesses.length > 0 && currentScreen === 'game' && (
          <DailySidePanel 
            result={guesses[0]} 
            answer={answer} 
          />
        )}
      </div>
    </div>
  )
}
