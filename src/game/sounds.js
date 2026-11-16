let audioContext

function getAudioContext() {
  if (typeof window === 'undefined') return null

  const AudioContextClass = window.AudioContext ?? window.webkitAudioContext
  if (!AudioContextClass) return null

  audioContext ??= new AudioContextClass()
  if (audioContext.state === 'suspended') audioContext.resume()
  return audioContext
}

function playTone(context, { frequency, startTime, duration, volume, type = 'sine', endFrequency }) {
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, startTime)
  if (endFrequency) oscillator.frequency.exponentialRampToValueAtTime(endFrequency, startTime + duration)

  gain.gain.setValueAtTime(0.0001, startTime)
  gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.008)
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)

  oscillator.connect(gain)
  gain.connect(context.destination)
  oscillator.start(startTime)
  oscillator.stop(startTime + duration + 0.01)
}

export function playBoardEntranceSound() {
  const context = getAudioContext()
  if (!context) return

  const startTime = context.currentTime + 0.02
  for (let index = 0; index < 9; index += 1) {
    playTone(context, {
      frequency: 220 + index * 18,
      endFrequency: 130 + index * 12,
      startTime: startTime + index * 0.11,
      duration: 0.1,
      volume: 0.025,
      type: 'triangle',
    })
  }
}

export function playMoveSound(mark) {
  const context = getAudioContext()
  if (!context) return

  const startTime = context.currentTime + 0.01
  const baseFrequency = mark === 'X' ? 560 : 390
  playTone(context, {
    frequency: baseFrequency,
    startTime,
    duration: 0.16,
    volume: 0.055,
    type: mark === 'X' ? 'triangle' : 'sine',
  })

  // Quiet echo notes follow the visual ripple as it travels across the board.
  const echoDelays = [0.11, 0.22, 0.33]
  echoDelays.forEach((delay, index) => {
    playTone(context, {
      frequency: baseFrequency * (0.72 - index * 0.08),
      startTime: startTime + delay,
      duration: 0.12,
      volume: 0.012,
      type: 'sine',
    })
  })
}

export function playWinSound(mark) {
  const context = getAudioContext()
  if (!context) return

  const startTime = context.currentTime + 0.78
  playTone(context, {
    frequency: 125,
    endFrequency: 55,
    startTime,
    duration: 0.5,
    volume: 0.12,
    type: 'sine',
  })

  const notes = mark === 'X' ? [660, 880, 990] : [523, 659, 784]
  notes.forEach((frequency, index) => {
    playTone(context, {
      frequency,
      startTime: startTime + 0.08 + index * 0.12,
      duration: 0.24,
      volume: 0.035,
      type: 'triangle',
    })
  })
}

export function playDrawSound() {
  const context = getAudioContext()
  if (!context) return

  const startTime = context.currentTime + 0.02
  playTone(context, {
    frequency: 105,
    endFrequency: 38,
    startTime,
    duration: 0.58,
    volume: 0.15,
    type: 'sine',
  })
  playTone(context, {
    frequency: 260,
    endFrequency: 70,
    startTime: startTime + 0.025,
    duration: 0.32,
    volume: 0.045,
    type: 'triangle',
  })
}

