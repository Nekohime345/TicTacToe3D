import { Canvas } from '@react-three/fiber'
import { useState } from 'react'
import Board from './components/board/Board.jsx'
import CameraPanel from './components/ui/CameraPanel.jsx'
import PerformancePanel from './components/ui/PerformancePanel.jsx'
import CameraSettings from './components/scene/CameraSettings.jsx'
import PerformanceSampler from './components/scene/PerformanceSampler.jsx'
import { INITIAL_CAMERA, INITIAL_ZOOM, PLAY_CAMERA } from './game/constants.js'
import { findWinner, isBoardFull } from './game/gameLogic.js'
import './App.css'

const emptyBoard = () => Array(9).fill(null)
const initialPerformanceStats = { fps: 0, frameTime: 0, calls: 0, triangles: 0 }

export default function App() {
  const [cameraSettings, setCameraSettings] = useState({ ...INITIAL_CAMERA, zoom: INITIAL_ZOOM })
  const [marks, setMarks] = useState(emptyBoard)
  const [currentPlayer, setCurrentPlayer] = useState('X')
  const [gameState, setGameState] = useState('idle')
  const [winner, setWinner] = useState(null)
  const [boardAnimationKey, setBoardAnimationKey] = useState(0)
  const [lastMove, setLastMove] = useState(null)
  const [cameraTransitionKey, setCameraTransitionKey] = useState(0)
  const [performanceStats, setPerformanceStats] = useState(initialPerformanceStats)

  const startNewGame = () => {
    setMarks(emptyBoard())
    setCurrentPlayer('X')
    setWinner(null)
    setGameState('playing')
    setCameraSettings(PLAY_CAMERA)
    setBoardAnimationKey((key) => key + 1)
    setCameraTransitionKey((key) => key + 1)
    setLastMove(null)
  }

  const playCell = (cell) => {
    if (gameState !== 'playing' || marks[cell]) return

    const nextMarks = [...marks]
    nextMarks[cell] = currentPlayer
    setMarks(nextMarks)
    setLastMove((previous) => ({ cell, key: (previous?.key ?? 0) + 1 }))

    const nextWinner = findWinner(nextMarks)
    if (nextWinner) {
      setWinner(nextWinner)
      setGameState('won')
    } else if (isBoardFull(nextMarks)) {
      setGameState('draw')
    } else {
      setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X')
    }
  }

  const updateCamera = (group, axis, value) => {
    const key = group === 'Position' ? 'position' : 'rotation'
    setCameraSettings((current) => ({
      ...current,
      [key]: current[key].map((currentValue, index) => index === axis ? value : currentValue),
    }))
  }

  const resetCamera = () => {
    setCameraSettings(gameState === 'idle' ? { ...INITIAL_CAMERA, zoom: INITIAL_ZOOM } : PLAY_CAMERA)
  }

  return (
    <main className="game-screen" aria-label="3D tic-tac-toe game">
      <Canvas shadows dpr={[1, 2]} camera={{ position: INITIAL_CAMERA.position, fov: 42 }} gl={{ antialias: true }}>
        <CameraSettings settings={cameraSettings} transitionKey={cameraTransitionKey} />
        <PerformanceSampler onUpdate={setPerformanceStats} />
        <color attach="background" args={['#8ed8ff']} />
        <fog attach="fog" args={['#8ed8ff', 12, 24]} />
        <ambientLight intensity={1.5} />
        <directionalLight castShadow position={[4, 8, 5]} intensity={2.4} shadow-mapSize={1024} />
        <Board
          marks={marks}
          gameActive={gameState !== 'idle'}
          animationKey={boardAnimationKey}
          lastMove={lastMove}
          onCellClick={playCell}
        />
      </Canvas>

      <header className="game-heading">
        <h1>Tic Tac Toe 3D</h1>
        <p>A classic game in a whole new dimension.</p>
      </header>

      {gameState !== 'idle' && (
        <div className="game-status" aria-live="polite">
          {gameState === 'playing' && <><span className={`turn-mark turn-${currentPlayer.toLowerCase()}`}>{currentPlayer}</span>'s turn</>}
          {gameState === 'won' && <><span className={`turn-mark turn-${winner.toLowerCase()}`}>{winner}</span> wins!</>}
          {gameState === 'draw' && "It's a draw!"}
        </div>
      )}

      <CameraPanel
        settings={cameraSettings}
        onChange={updateCamera}
        onZoomChange={(zoom) => setCameraSettings((current) => ({ ...current, zoom }))}
        onReset={resetCamera}
      />
      <PerformancePanel stats={performanceStats} />

      <footer className="game-footer">
        <button className="play-button" type="button" onClick={startNewGame}>
          <span aria-hidden="true">{'\u25b6'}</span>
          {gameState === 'idle' ? 'Play' : 'New Game'}
        </button>
      </footer>
    </main>
  )
}
