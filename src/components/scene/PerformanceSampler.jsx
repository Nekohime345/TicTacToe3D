import { useFrame } from '@react-three/fiber'
import { memo, useEffect, useRef } from 'react'

function PerformanceSampler({ onUpdate, pageVisible }) {
  const elapsed = useRef(0)
  const frames = useRef(0)

  useEffect(() => {
    elapsed.current = 0
    frames.current = 0
  }, [pageVisible])

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

export default memo(PerformanceSampler)
