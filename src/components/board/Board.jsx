import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, BoxGeometry, CanvasTexture, Color, EdgesGeometry, ExtrudeGeometry, LineBasicMaterial, MeshBasicMaterial, MeshStandardMaterial, Object3D, Path, Shape, SRGBColorSpace } from 'three'
import { memo, useEffect, useMemo, useRef } from 'react'
import { BOARD_CELLS, SAMPLE_MARKS } from '../../game/constants.js'

const oShape = new Shape()
oShape.absarc(0, 0, 0.34, 0, Math.PI * 2, false)
const oHole = new Path()
oHole.absarc(0, 0, 0.19, 0, Math.PI * 2, true)
oShape.holes.push(oHole)
const tileGeometry = new BoxGeometry(1, 0.22, 1)
const tileOutlineGeometry = new EdgesGeometry(new BoxGeometry(1.012, 0.232, 1.012))
const tileMaterials = {
  light: new MeshStandardMaterial({ color: '#f8fbff', roughness: 0.38 }),
  dark: new MeshStandardMaterial({ color: '#2E3339', roughness: 0.38 }),
}
const tileOutlineMaterials = {
  light: new LineBasicMaterial({ color: '#526b80', transparent: true, opacity: 0.9, toneMapped: false }),
  dark: new LineBasicMaterial({ color: '#b9e5ff', transparent: true, opacity: 0.9, toneMapped: false }),
}
const markBarGeometry = new BoxGeometry(0.19, 0.16, 0.78)
const markBarMaterial = new MeshStandardMaterial({ color: '#ff6b6b', roughness: 0.32 })
const oGeometry = new ExtrudeGeometry(oShape, { depth: 0.16, bevelEnabled: false, curveSegments: 32 })
const oMaterial = new MeshStandardMaterial({ color: '#226fe8', roughness: 0.42 })
const DRAW_TEXT_LANDING_HEIGHT = 0.28
const DRAW_IMPACT_DELAY = 0.78
const impactDistances = BOARD_CELLS.map((impactCell) => {
  const impactRow = Math.floor(impactCell / 3)
  const impactColumn = impactCell % 3
  return BOARD_CELLS.map((cell) => Math.hypot(
    Math.floor(cell / 3) - impactRow,
    cell % 3 - impactColumn,
  ))
})
const victoryParticles = Array.from({ length: 28 }, (_, index) => {
  const angle = (index / 28) * Math.PI * 2
  return { x: Math.cos(angle), z: Math.sin(angle), speed: 2.8 + (index % 5) * 0.42, lift: 2.5 + (index % 4) * 0.32 }
})
const particleGeometry = new BoxGeometry(1, 1, 1)
const particleMaterial = new MeshBasicMaterial({
  color: '#ffffff',
  transparent: true,
  opacity: 1,
  vertexColors: true,
  blending: AdditiveBlending,
  depthWrite: false,
  toneMapped: false,
})
const VICTORY_COLORS = {
  X: ['#ff1744', '#ffe600', '#ffffff'],
  O: ['#00a2ff', '#00f0ff', '#ffffff'],
  draw: ['#fff000', '#ff2674', '#00efff'],
}

function Cell({ row, column, index, animationKey, impactKey, impactCell, victoryKey, drawKey, theme, onCellClick }) {
  const cellRef = useRef(null)
  const entranceStart = useRef(null)
  const impactStart = useRef(null)
  const victoryStart = useRef(null)
  const targetX = (column - 1) * 1.08
  const targetZ = (row - 1) * 1.08
  const startX = targetX + Math.sin(index * 1.7 + 0.4) * 1.7
  const startY = 1.8 + (index % 3) * 0.35
  const startZ = targetZ + Math.cos(index * 1.4 + 0.2) * 1.7
  const startRotation = (index % 2 === 0 ? 1 : -1) * 0.65
  const phaseOffset = (row + column) * 0.65
  const centerDistance = Math.hypot(row - 1, column - 1)

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

  useEffect(() => {
    victoryStart.current = null
  }, [victoryKey, drawKey])

  useFrame(({ clock }) => {
    const time = clock.elapsedTime
    const phase = time * 1.6 - phaseOffset
    const cell = cellRef.current
    let impactLift = 0

    if (impactKey > 0 && impactCell !== null) {
      if (impactStart.current === null) impactStart.current = time
      const distance = impactDistances[impactCell][index]
      const localTime = time - impactStart.current - distance * 0.11
      if (localTime >= 0 && localTime < 0.8) impactLift = Math.sin(localTime * 15) * Math.exp(-localTime * 3.6) * 0.2
    }

    const finaleKey = drawKey || victoryKey
    if (finaleKey > 0) {
      if (victoryStart.current === null) victoryStart.current = time
      const delay = drawKey > 0 ? DRAW_IMPACT_DELAY : 0.78
      const localTime = time - victoryStart.current - delay - centerDistance * 0.045
      if (localTime >= 0 && localTime < 1) {
        impactLift += Math.sin(localTime * 21) * Math.exp(-localTime * 2.2) * (drawKey > 0 ? 1.15 : 0.9)
      }
    }

    if (animationKey > 0) {
      if (entranceStart.current === null) entranceStart.current = time
      const progress = Math.max(0, Math.min(1, (time - entranceStart.current - index * 0.11) / 0.7))
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
      geometry={tileGeometry}
      material={tileMaterials[theme]}
      position={[targetX, 0, targetZ]}
      onClick={(event) => {
        event.stopPropagation()
        onCellClick(index)
      }}
      castShadow
      receiveShadow
      dispose={null}
    >
      <lineSegments
        geometry={tileOutlineGeometry}
        material={tileOutlineMaterials[theme]}
        raycast={() => null}
        dispose={null}
      />
    </mesh>
  )
}

function MarkShape({ type }) {
  return type === 'X' ? (
    <group position={[0, 0.22, 0]} dispose={null}>
      <mesh geometry={markBarGeometry} material={markBarMaterial} rotation={[0, Math.PI / 4, 0]} castShadow />
      <mesh geometry={markBarGeometry} material={markBarMaterial} rotation={[0, -Math.PI / 4, 0]} castShadow />
    </group>
  ) : (
    <mesh
      geometry={oGeometry}
      material={oMaterial}
      position={[0, 0.11, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      castShadow
      dispose={null}
    />
  )
}

function Mark({ row, column, index, type, impact = false, victoryKey = 0, drawKey = 0 }) {
  const markRef = useRef(null)
  const impactStart = useRef(null)
  const victoryStart = useRef(null)
  const physics = useRef(null)

  useEffect(() => {
    victoryStart.current = null
    physics.current = null
  }, [victoryKey, drawKey])

  useFrame(({ clock }, delta) => {
    const phase = clock.elapsedTime * 1.6 - (row + column) * 0.65
    const mark = markRef.current

    const isDraw = drawKey > 0
    const finaleKey = isDraw ? drawKey : victoryKey
    if (finaleKey > 0) {
      if (victoryStart.current === null) victoryStart.current = clock.elapsedTime
      const timeSinceWin = clock.elapsedTime - victoryStart.current
      const launchDelay = isDraw ? DRAW_IMPACT_DELAY : 0.78

      if (timeSinceWin >= launchDelay) {
        if (!physics.current) {
          const x = (column - 1) * 1.08
          const z = (row - 1) * 1.08
          const distance = Math.hypot(x, z)
          const directionX = distance ? x / distance : Math.cos(index * 2.4)
          const directionZ = distance ? z / distance : Math.sin(index * 2.4)
          physics.current = {
            velocityX: directionX * (isDraw ? 8 : 5.5),
            velocityY: (isDraw ? 6.2 : 5) + (index % 3) * 0.45,
            velocityZ: directionZ * (isDraw ? 8 : 5.5),
            angularVelocityX: (index % 2 ? 1 : -1) * (isDraw ? 5 : 3.2),
            angularVelocityZ: (index % 3 ? -1 : 1) * (isDraw ? 5.8 : 3.8),
          }
        }

        const movement = physics.current
        const step = Math.min(delta, 0.04)
        movement.velocityY -= 9.8 * step
        mark.position.x += movement.velocityX * step
        mark.position.y += movement.velocityY * step
        mark.position.z += movement.velocityZ * step
        mark.rotation.x += movement.angularVelocityX * step
        mark.rotation.z += movement.angularVelocityZ * step

        if (mark.position.y < 0) {
          mark.position.y = 0
          if (Math.abs(movement.velocityY) > 0.8) {
            movement.velocityY *= -0.32
          } else {
            movement.velocityY = 0
          }
          movement.velocityX *= 0.88
          movement.velocityZ *= 0.88
          movement.angularVelocityX *= 0.78
          movement.angularVelocityZ *= 0.78
        }
        return
      }
    }

    mark.position.y = Math.sin(phase) * 0.1

    if (impact) {
      if (impactStart.current === null) impactStart.current = clock.elapsedTime
      const progress = Math.min(1, (clock.elapsedTime - impactStart.current) / 0.42)
      const scale = progress < 0.65
        ? 0.12 + 1.08 * (1 - (1 - progress / 0.65) ** 3)
        : 1.2 - 0.2 * ((progress - 0.65) / 0.35)
      mark.scale.setScalar(scale)
    }
  })

  return (
    <group
      ref={markRef}
      dispose={null}
      scale={impact ? 0.12 : 1}
      position={[(column - 1) * 1.08, 0, (row - 1) * 1.08]}
    >
      <MarkShape type={type} />
    </group>
  )
}

function FallingWinnerMark({ type }) {
  const markRef = useRef(null)
  const motion = useRef({ velocityY: 0, impactTime: null, impactRotation: 0 })

  useFrame(({ clock }, delta) => {
    const mark = markRef.current
    const step = Math.min(delta, 0.04)
    const movement = motion.current

    if (movement.impactTime !== null) {
      const timeSinceImpact = clock.elapsedTime - movement.impactTime
      const squash = 1 - 0.18 * Math.exp(-timeSinceImpact * 20) * Math.cos(timeSinceImpact * 24)
      mark.scale.set(2.6, 2.6 * squash, 2.6)
      mark.rotation.z = movement.impactRotation * Math.exp(-timeSinceImpact * 12)
      return
    }

    movement.velocityY -= 18 * step
    mark.position.y += movement.velocityY * step
    mark.rotation.z += 0.8 * step

    if (mark.position.y <= -0.18) {
      mark.position.set(0, -0.18, 0)
      movement.velocityY = 0
      movement.impactTime = clock.elapsedTime
      movement.impactRotation = mark.rotation.z
    }
  })

  return (
    <group ref={markRef} position={[0, 5.5, 0]} scale={2.6} dispose={null}>
      <MarkShape type={type} />
    </group>
  )
}

function createDrawTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 960
  canvas.height = 260
  const context = canvas.getContext('2d')
  context.clearRect(0, 0, canvas.width, canvas.height)
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.font = '900 174px Bungee, Arial Black, sans-serif'
  context.lineJoin = 'round'
  context.lineWidth = 24
  context.strokeStyle = '#10243a'
  context.shadowColor = '#ffcf4a'
  context.shadowBlur = 30
  context.strokeText('DRAW', canvas.width / 2, canvas.height / 2)
  context.fillStyle = '#ffffff'
  context.fillText('DRAW', canvas.width / 2, canvas.height / 2)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}

function FallingDrawText() {
  const textRef = useRef(null)
  const textMaterialRef = useRef(null)
  const startTime = useRef(null)
  const velocityY = useRef(0)
  const texture = useMemo(createDrawTexture, [])

  useEffect(() => () => texture.dispose(), [texture])

  useFrame(({ clock }, delta) => {
    const text = textRef.current
    const step = Math.min(delta, 0.04)
    if (startTime.current === null) startTime.current = clock.elapsedTime

    if (text.position.y > DRAW_TEXT_LANDING_HEIGHT) {
      velocityY.current -= 18 * step
      text.position.y += velocityY.current * step
      if (text.position.y <= DRAW_TEXT_LANDING_HEIGHT) {
        text.position.y = DRAW_TEXT_LANDING_HEIGHT
        velocityY.current = 0
        startTime.current = clock.elapsedTime
      }
      return
    }

    const impactTime = clock.elapsedTime - startTime.current
    const bounce = Math.exp(-impactTime * 13) * Math.cos(impactTime * 19)
    text.scale.set(1 + Math.max(0, bounce) * 0.12, 1, 1 - Math.max(0, bounce) * 0.18)
    textMaterialRef.current.opacity = 1
  })

  return (
    <group ref={textRef} position={[0, 5.5, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.2, 0.88]} />
        <meshBasicMaterial ref={textMaterialRef} map={texture} transparent opacity={1} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  )
}

function VictoryEffects({ type, delay = 0.78 }) {
  const ringRef = useRef(null)
  const ringMaterialRef = useRef(null)
  const outerRingRef = useRef(null)
  const outerRingMaterialRef = useRef(null)
  const particlesRef = useRef(null)
  const startTime = useRef(null)
  const particleTransform = useMemo(() => new Object3D(), [])
  const particleColor = useMemo(() => new Color(), [])
  const colors = VICTORY_COLORS[type]

  useEffect(() => {
    victoryParticles.forEach((_, index) => {
      particlesRef.current.setColorAt(index, particleColor.set(colors[index % colors.length]))
    })
    particlesRef.current.instanceColor.needsUpdate = true
  }, [colors, particleColor])

  useFrame(({ clock }) => {
    if (startTime.current === null) startTime.current = clock.elapsedTime
    const elapsed = clock.elapsedTime - startTime.current - delay
    const ring = ringRef.current
    if (elapsed < 0) {
      ring.visible = false
      outerRingRef.current.visible = false
      particlesRef.current.visible = false
      return
    }

    const ringProgress = Math.min(1, elapsed / 0.92)
    ring.visible = ringProgress < 1
    ring.scale.setScalar(0.3 + ringProgress * (type === 'draw' ? 6.1 : 5.5))
    ringMaterialRef.current.opacity = (1 - ringProgress) * 1.15

    const outerProgress = Math.max(0, Math.min(1, (elapsed - 0.08) / 0.95))
    outerRingRef.current.visible = elapsed >= 0.12 && outerProgress < 1
    outerRingRef.current.scale.setScalar(0.25 + outerProgress * (type === 'draw' ? 6.8 : 6.1))
    outerRingMaterialRef.current.opacity = (1 - outerProgress) * 0.9

    const particleDuration = 1.15
    const particleTime = Math.min(elapsed, particleDuration)
    const particleScale = Math.max(0, 1 - particleTime / particleDuration)
    const burst = type === 'draw' ? 1.3 : 1
    particlesRef.current.visible = elapsed < particleDuration
    particleMaterial.opacity = Math.max(0, 1 - particleTime / particleDuration)
    victoryParticles.forEach((direction, index) => {
      particleTransform.position.set(
        direction.x * direction.speed * particleTime * burst,
        0.22 + direction.lift * particleTime * burst - 2 * particleTime ** 2,
        direction.z * direction.speed * particleTime * burst,
      )
      particleTransform.rotation.set(particleTime * (index % 3), particleTime, particleTime * (index % 2 ? 2 : -2))
      particleTransform.scale.set(0.2 * particleScale, 0.28 * particleScale, 0.2 * particleScale)
      particleTransform.updateMatrix()
      particlesRef.current.setMatrixAt(index, particleTransform.matrix)
    })
    particlesRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <mesh ref={ringRef} position={[0, 0.14, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <torusGeometry args={[0.45, 0.045, 8, 48]} />
        <meshBasicMaterial ref={ringMaterialRef} color={colors[0]} transparent opacity={0} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh ref={outerRingRef} position={[0, 0.13, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <torusGeometry args={[0.45, 0.025, 8, 48]} />
        <meshBasicMaterial ref={outerRingMaterialRef} color={colors[1]} transparent opacity={0} depthWrite={false} toneMapped={false} />
      </mesh>
      <instancedMesh
        ref={particlesRef}
        args={[particleGeometry, particleMaterial, victoryParticles.length]}
        visible={false}
        dispose={null}
      />
    </group>
  )
}

function Board({ marks, gameActive, animationKey, lastMove, victory, drawKey = 0, theme = 'light', onCellClick }) {
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
              row={row}
              column={column}
              index={cell}
              animationKey={animationKey}
              impactKey={lastMove?.key ?? 0}
              impactCell={lastMove?.cell ?? null}
              victoryKey={victory?.key ?? 0}
              drawKey={drawKey}
              theme={theme}
              onCellClick={onCellClick}
            />
            {mark && <Mark row={row} column={column} index={cell} type={mark} impact={lastMove?.cell === cell} victoryKey={victory?.key ?? 0} drawKey={drawKey} />}
          </group>
        )
      })}
      {victory && (
        <group key={victory.key}>
          <FallingWinnerMark type={victory.mark} />
          <VictoryEffects type={victory.mark} />
        </group>
      )}
      {drawKey > 0 && (
        <group key={`draw-${drawKey}`}>
          <FallingDrawText />
          <VictoryEffects type="draw" delay={DRAW_IMPACT_DELAY} />
        </group>
      )}
    </group>
  )
}

export default memo(Board)

