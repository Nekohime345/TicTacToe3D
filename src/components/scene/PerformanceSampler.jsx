import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'

export default function PerformanceSampler({ onUpdate }) {
  const elapsed = useRef(0)
  const frames = useRef(0)

  useFrame(({ gl }, delta) => {
    elapsed.current += delta
    frames.current += 1

    if (elapsed.current >= 0.5) {
      onUpdate({
        fps: Math.round(frames.current / elapsed.current),
        frameTime: (elapsed.current / frames.current) * 1000,
        calls: gl.info.render.calls,
        triangles: gl.info.render.triangles,
      })
      elapsed.current = 0
      frames.current = 0
    }
  })

  return null
}
