import { useFrame } from '@react-three/fiber'
import { Path, Shape } from 'three'
import { useEffect, useRef } from 'react'
import { BOARD_CELLS, SAMPLE_MARKS } from '../../game/constants.js'

const oShape = new Shape()
oShape.absarc(0, 0, 0.34, 0, Math.PI * 2, false)
const oHole = new Path()
oHole.absarc(0, 0, 0.19, 0, Math.PI * 2, true)
oShape.holes.push(oHole)

function Cell({ row, column, index, animationKey, impactKey, impactCell }) {
  const cellRef = useRef(null)
  const entranceStart = useRef(null)
  const impactStart = useRef(null)
  const targetX = (column - 1) * 1.08
  const targetZ = (row - 1) * 1.08
  const startX = targetX + Math.sin(index * 1.7 + 0.4) * 1.7
  const startY = 1.8 + (index % 3) * 0.35
  const startZ = targetZ + Math.cos(index * 1.4 + 0.2) * 1.7
  const startRotation = (index % 2 === 0 ? 1 : -1) * 0.65

  useEffect(() => {
    entranceStart.current = null
    if (animationKey > 0) {
      cellRef.current.position.set(startX, startY, startZ)
      cellRef.current.rotation.y = startRotation
    }
  }, [animationKey, startX, startY, startZ, startRotation])

  useEffect(() => {
    impactStart.current = null
  }, [impactKey])

  useFrame(({ clock }) => {
    const phase = clock.elapsedTime * 1.6 - (row + column) * 0.65
    const cell = cellRef.current
    let impactLift = 0

    if (impactKey > 0 && impactCell !== null) {
      if (impactStart.current === null) impactStart.current = clock.elapsedTime
      const impactRow = Math.floor(impactCell / 3)
      const impactColumn = impactCell % 3
      const distance = Math.hypot(row - impactRow, column - impactColumn)
      const localTime = clock.elapsedTime - impactStart.current - distance * 0.11
      if (localTime >= 0 && localTime < 0.8) {
        impactLift = Math.sin(localTime * 15) * Math.exp(-localTime * 3.6) * 0.2
      }
    }

    if (animationKey > 0) {
      if (entranceStart.current === null) entranceStart.current = clock.elapsedTime
      const progress = Math.max(0, Math.min(1, (clock.elapsedTime - entranceStart.current - index * 0.11) / 0.7))
      const eased = 1 - (1 - progress) ** 3
      cell.position.x = startX + (targetX - startX) * eased
      cell.position.y = startY * (1 - eased) + Math.sin(phase) * 0.1 + impactLift
      cell.position.z = startZ + (targetZ - startZ) * eased
      cell.rotation.y = startRotation * (1 - eased)
    } else {
      cell.position.y = Math.sin(phase) * 0.1 + impactLift
    }
  })

  return (
    <mesh
      ref={cellRef}
      position={[(column - 1) * 1.08, 0, (row - 1) * 1.08]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[1, 0.22, 1]} />
      <meshStandardMaterial color="#f8fbff" roughness={0.38} />
    </mesh>
  )
}

function Mark({ row, column, type, impact = false }) {
  const markRef = useRef(null)
  const impactStart = useRef(null)

  useFrame(({ clock }) => {
    const phase = clock.elapsedTime * 1.6 - (row + column) * 0.65
    markRef.current.position.y = Math.sin(phase) * 0.1

    if (!impact) return
    if (impactStart.current === null) impactStart.current = clock.elapsedTime
    const progress = Math.min(1, (clock.elapsedTime - impactStart.current) / 0.42)
    const scale = progress < 0.65
      ? 0.12 + 1.08 * (1 - (1 - progress / 0.65) ** 3)
      : 1.2 - 0.2 * ((progress - 0.65) / 0.35)
    markRef.current.scale.setScalar(scale)
  })

  return (
    <group
      ref={markRef}
      scale={impact ? 0.12 : 1}
      position={[(column - 1) * 1.08, 0, (row - 1) * 1.08]}
    >
      {type === 'X' ? (
        <group position={[0, 0.22, 0]}>
          <mesh rotation={[0, Math.PI / 4, 0]} castShadow>
            <boxGeometry args={[0.19, 0.16, 0.78]} />
            <meshStandardMaterial color="#ff6b6b" roughness={0.32} />
          </mesh>
          <mesh rotation={[0, -Math.PI / 4, 0]} castShadow>
            <boxGeometry args={[0.19, 0.16, 0.78]} />
            <meshStandardMaterial color="#ff6b6b" roughness={0.32} />
          </mesh>
        </group>
      ) : (
        <mesh position={[0, 0.11, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
          <extrudeGeometry args={[oShape, { depth: 0.16, bevelEnabled: false, curveSegments: 32 }]} />
          <meshStandardMaterial color="#226fe8" roughness={0.42} />
        </mesh>
      )}
    </group>
  )
}

export default function Board({ marks, gameActive, animationKey, lastMove, onCellClick }) {
  return (
    <group>
      {BOARD_CELLS.map((cell) => {
        const row = Math.floor(cell / 3)
        const column = cell % 3
        const mark = marks[cell] ?? (!gameActive ? SAMPLE_MARKS[cell] : null)

        return (
          <group
            key={cell}
            onClick={(event) => {
              event.stopPropagation()
              onCellClick(cell)
            }}
          >
            <Cell
              key={animationKey}
              row={row}
              column={column}
              index={cell}
              animationKey={animationKey}
              impactKey={lastMove?.key ?? 0}
              impactCell={lastMove?.cell ?? null}
            />
            {mark && <Mark row={row} column={column} type={mark} impact={lastMove?.cell === cell} />}
          </group>
        )
      })}
    </group>
  )
}
