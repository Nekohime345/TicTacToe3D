import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'

function CameraSettings({ settings, transitionKey }) {
  const { camera } = useThree()
  const transitionRef = useRef(null)
  const previousTransitionKey = useRef(transitionKey)

  useEffect(() => {
    if (transitionKey !== previousTransitionKey.current) {
      previousTransitionKey.current = transitionKey
      transitionRef.current = {
        start: null,
        fromPosition: camera.position.toArray(),
        fromRotation: [camera.rotation.x, camera.rotation.y, camera.rotation.z],
        fromZoom: camera.zoom,
        toPosition: settings.position,
        toRotation: settings.rotation.map((angle) => (angle * Math.PI) / 180),
        toZoom: settings.zoom,
      }
      return
    }

    transitionRef.current = null
    camera.position.set(...settings.position)
    camera.rotation.set(...settings.rotation.map((angle) => (angle * Math.PI) / 180))
    camera.zoom = settings.zoom
    camera.updateProjectionMatrix()
  }, [camera, settings, transitionKey])

  useFrame(({ clock }) => {
    const transition = transitionRef.current
    if (!transition) return

    if (transition.start === null) transition.start = clock.elapsedTime
    const progress = Math.min(1, (clock.elapsedTime - transition.start) / 1.1)
    const eased = progress * progress * (3 - 2 * progress)

    camera.position.set(
      ...transition.fromPosition.map((value, index) => value + (transition.toPosition[index] - value) * eased),
    )
    camera.rotation.set(
      ...transition.fromRotation.map((value, index) => value + (transition.toRotation[index] - value) * eased),
    )
    camera.zoom = transition.fromZoom + (transition.toZoom - transition.fromZoom) * eased
    camera.updateProjectionMatrix()

    if (progress >= 1) transitionRef.current = null
  })

  return null
}

export default CameraSettings
