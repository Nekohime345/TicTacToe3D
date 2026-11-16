import { Canvas } from '@react-three/fiber'
import { memo, useCallback, useEffect, useState } from 'react'
import Board from './components/board/Board.jsx'
import PerformancePanel from './components/ui/PerformancePanel.jsx'
import CameraSettings from './components/scene/CameraSettings.jsx'
import PerformanceSampler from './components/scene/PerformanceSampler.jsx'
import { INITIAL_CAMERA, INITIAL_ZOOM, PLAY_CAMERA } from './game/constants.js'
import { findWinner, isBoardFull } from './game/gameLogic.js'
import {
  playBoardEntranceSound,
  playDrawSound,
  playMoveSound,
  playWinSound,
} from './game/sounds.js'
import './App.css'

const emptyBoard = () => Array(9).fill(null)
const initialPerformanceStats = { fps: 0, frameTime: 0, calls: 0, triangles: 0 }
const MOBILE_DPR = [1, 1.75]
const TABLET_DPR = [1, 1.75]
const DESKTOP_DPR = [1, 2]
const CAMERA_OPTIONS = { position: INITIAL_CAMERA.position, fov: 42, near: 0.1, far: 24 }
const WEBGL_OPTIONS = { antialias: true, alpha: false, powerPreference: 'high-performance' }
const getResponsivePlayZoom = () => Math.max(
  0.65,
  Math.min(
    1.2,
    ((window.innerHeight || 700) - 150) / 420,
    ((window.innerWidth || 375) / 500) * 1.2,
  ),
)
const getRenderDpr = () => {
  if (window.innerWidth <= 480) return MOBILE_DPR
  if (window.innerWidth <= 900) return TABLET_DPR
  return DESKTOP_DPR
}

const GameScene = memo(function GameScene({
  cameraSettings,
  cameraTransitionKey,
  renderDpr,
  pageVisible,
  sceneBackground,
  gameActive,
  boardAnimationKey,
  lastMove,
  victory,
  drawAnimationKey,
  theme,
  marks,
  onCellClick,
  onPerformanceUpdate,
}) {
  return (
    <Canvas
      shadows
      frameloop={pageVisible ? 'always' : 'never'}
      dpr={renderDpr}
      camera={CAMERA_OPTIONS}
      gl={WEBGL_OPTIONS}
    >
      <CameraSettings settings={cameraSettings} transitionKey={cameraTransitionKey} />
      <PerformanceSampler onUpdate={onPerformanceUpdate} pageVisible={pageVisible} />
      <color attach="background" args={[sceneBackground]} />
      <fog attach="fog" args={[sceneBackground, 12, 24]} />
      <ambientLight intensity={1.5} />
      <directionalLight
        castShadow
        position={[4, 8, 5]}
        intensity={2.4}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-camera-near={0.1}
        shadow-camera-far={24}
      />
      <Board
        marks={marks}
        gameActive={gameActive}
        animationKey={boardAnimationKey}
        lastMove={lastMove}
        victory={victory}
        drawKey={drawAnimationKey}
        theme={theme}
        onCellClick={onCellClick}
      />
    </Canvas>
  )
})

export default function App() {
  const initialGameState = window.innerWidth <= 900 ? 'playing' : 'idle'
  const [cameraSettings, setCameraSettings] = useState(() => initialGameState === 'idle'
    ? { ...INITIAL_CAMERA, zoom: INITIAL_ZOOM }
    : { ...PLAY_CAMERA, zoom: getResponsivePlayZoom() })
  const [marks, setMarks] = useState(emptyBoard)
  const [currentPlayer, setCurrentPlayer] = useState('X')
  const [gameState, setGameState] = useState(initialGameState)
  const [winner, setWinner] = useState(null)
  const [boardAnimationKey, setBoardAnimationKey] = useState(0)
  const [lastMove, setLastMove] = useState(null)
  const [victory, setVictory] = useState(null)
  const [drawAnimationKey, setDrawAnimationKey] = useState(0)
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 })
  const [cameraTransitionKey, setCameraTransitionKey] = useState(0)
  const [performanceStats, setPerformanceStats] = useState(initialPerformanceStats)
  const [renderDpr, setRenderDpr] = useState(getRenderDpr)
  const [pageVisible, setPageVisible] = useState(() => document.visibilityState === 'visible')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [theme, setTheme] = useState('light')
  const sceneBackground = theme === 'dark' ? '#111820' : '#8ed8ff'

  const startNewGame = useCallback(() => {
    if (soundEnabled) playBoardEntranceSound()
    setMarks(emptyBoard())
    setCurrentPlayer('X')
    setWinner(null)
    setGameState('playing')
    setCameraSettings({ ...PLAY_CAMERA, zoom: getResponsivePlayZoom() })
    setBoardAnimationKey((key) => key + 1)
    setCameraTransitionKey((key) => key + 1)
    setLastMove(null)
    setVictory(null)
    setDrawAnimationKey(0)
  }, [soundEnabled])

  useEffect(() => {
    const updateDpr = () => setRenderDpr(getRenderDpr())
    window.addEventListener('resize', updateDpr)
    return () => window.removeEventListener('resize', updateDpr)
  }, [])

  useEffect(() => {
    const updateVisibility = () => setPageVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', updateVisibility)
    return () => document.removeEventListener('visibilitychange', updateVisibility)
  }, [])

  useEffect(() => {
    if (gameState === 'idle') return undefined

    let resizeTimer
    const resizeCamera = () => {
      window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(() => {
        setCameraSettings((current) => ({ ...current, zoom: getResponsivePlayZoom() }))
      }, 1200)
    }
    window.addEventListener('resize', resizeCamera)
    return () => {
      window.clearTimeout(resizeTimer)
      window.removeEventListener('resize', resizeCamera)
    }
  }, [gameState])

  const playCell = useCallback((cell) => {
    if (gameState === 'idle') return
    if (gameState !== 'playing' || marks[cell]) return

    const nextMarks = [...marks]
    nextMarks[cell] = currentPlayer
    setMarks(nextMarks)
    setLastMove((previous) => ({ cell, key: (previous?.key ?? 0) + 1 }))
    if (soundEnabled) playMoveSound(currentPlayer)

    const nextWinner = findWinner(nextMarks)
    if (nextWinner) {
      setWinner(nextWinner)
      setGameState('won')
      setVictory((previous) => ({ mark: nextWinner, key: (previous?.key ?? 0) + 1 }))
      setScores((current) => ({ ...current, [nextWinner]: current[nextWinner] + 1 }))
      if (soundEnabled) playWinSound(nextWinner)
    } else if (isBoardFull(nextMarks)) {
      setGameState('draw')
      setDrawAnimationKey((key) => key + 1)
      setScores((current) => ({ ...current, draws: current.draws + 1 }))
      if (soundEnabled) playDrawSound()
    } else {
      setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X')
    }
  }, [currentPlayer, gameState, marks, soundEnabled])

  return (
    <main className={`game-screen${theme === 'dark' ? ' game-screen-dark' : ''}${gameState !== 'idle' ? ' game-screen-in-game' : ''}`} aria-label="3D tic-tac-toe game">
      <GameScene
        cameraSettings={cameraSettings}
        cameraTransitionKey={cameraTransitionKey}
        renderDpr={renderDpr}
        pageVisible={pageVisible}
        sceneBackground={sceneBackground}
        gameActive={gameState !== 'idle'}
        boardAnimationKey={boardAnimationKey}
        lastMove={lastMove}
        victory={victory}
        drawAnimationKey={drawAnimationKey}
        theme={theme}
        marks={marks}
        onCellClick={playCell}
        onPerformanceUpdate={setPerformanceStats}
      />

      <div className="left-content">
        <header className="game-heading">
          <h1>Tic Tac Toe 3D</h1>
          <p>A classic game in a whole new dimension.</p>
        </header>
        {gameState === 'idle' && (
          <footer className="game-footer">
            <button
              className="sound-toggle"
              type="button"
              aria-pressed={soundEnabled}
              aria-label={soundEnabled ? 'Mute game sounds' : 'Enable game sounds'}
              onClick={() => setSoundEnabled((enabled) => !enabled)}
            >
              {soundEnabled ? 'Sound on' : 'Sound off'}
            </button>
            <button className="play-button" type="button" onClick={startNewGame}>
              <span aria-hidden="true">{'\u25b6'}</span>
              Play
            </button>
            <button
              className="theme-toggle"
              type="button"
              aria-pressed={theme === 'dark'}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              onClick={() => setTheme((current) => current === 'light' ? 'dark' : 'light')}
            >
              <span aria-hidden="true">{theme === 'dark' ? '\u2600' : '\u263e'}</span>
              <span className="theme-toggle-label">{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
          </footer>
        )}
      </div>

      {gameState !== 'idle' && (
        <div className="game-status" aria-live="polite">
          {gameState === 'playing' && <><span className={`turn-mark turn-${currentPlayer.toLowerCase()}`}>{currentPlayer}</span>'s turn</>}
          {gameState === 'won' && <><span className={`turn-mark turn-${winner.toLowerCase()}`}>{winner}</span> wins!</>}
          {gameState === 'draw' && "It's a draw!"}
        </div>
      )}

      <PerformancePanel stats={performanceStats} />

      {gameState !== 'idle' && (
        <footer className="game-footer">
          <section className="scoreboard" aria-label="Match scoreboard" aria-live="polite">
            <div className="score-card score-card-x"><span>X wins</span><strong>{scores.X}</strong></div>
            <div className="score-card score-card-o"><span>O wins</span><strong>{scores.O}</strong></div>
            <div className="score-card score-card-draw"><span>Draws</span><strong>{scores.draws}</strong></div>
          </section>
          <div className="game-controls">
            <button
              className="sound-toggle"
              type="button"
              aria-pressed={soundEnabled}
              aria-label={soundEnabled ? 'Mute game sounds' : 'Enable game sounds'}
              onClick={() => setSoundEnabled((enabled) => !enabled)}
            >
              {soundEnabled ? 'Sound on' : 'Sound off'}
            </button>
            <button className="play-button" type="button" onClick={startNewGame}>
              <span aria-hidden="true">{'\u25b6'}</span>
              New Game
            </button>
            <button
              className="theme-toggle"
              type="button"
              aria-pressed={theme === 'dark'}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              onClick={() => setTheme((current) => current === 'light' ? 'dark' : 'light')}
            >
              <span aria-hidden="true">{theme === 'dark' ? '\u2600' : '\u263e'}</span>
              <span className="theme-toggle-label">{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
          </div>
        </footer>
      )}

    </main>
  )
}
