let audioContext
let masterGain
let limiter

function getAudioContext() {
  if (typeof window === 'undefined') return null

  const AudioContextClass = window.AudioContext ?? window.webkitAudioContext
  if (!AudioContextClass) return null

  if (!audioContext) {
    audioContext = new AudioContextClass()
    masterGain = audioContext.createGain()
    masterGain.gain.value = 1.12
    limiter = audioContext.createDynamicsCompressor()
    limiter.threshold.value = -3
    limiter.knee.value = 0
    limiter.ratio.value = 12
    limiter.attack.value = 0.003
    limiter.release.value = 0.12
    masterGain.connect(limiter)
    limiter.connect(audioContext.destination)
  }
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
  gain.connect(masterGain)
  oscillator.start(startTime)
  oscillator.stop(startTime + duration + 0.01)
}

function playNoiseImpact(context, startTime) {
  const buffer = context.createBuffer(1, Math.floor(context.sampleRate * 0.16), context.sampleRate)
  const samples = buffer.getChannelData(0)
  for (let index = 0; index < samples.length; index += 1) {
    samples[index] = (Math.random() * 2 - 1) * (1 - index / samples.length)
  }

  const source = context.createBufferSource()
  const filter = context.createBiquadFilter()
  const gain = context.createGain()
  source.buffer = buffer
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(1100, startTime)
  gain.gain.setValueAtTime(0.0001, startTime)
  gain.gain.exponentialRampToValueAtTime(0.2, startTime + 0.006)
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.15)
  source.connect(filter)
  filter.connect(gain)
  gain.connect(masterGain)
  source.start(startTime)
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
      volume: 0.07,
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
    volume: 0.16,
    type: mark === 'X' ? 'triangle' : 'sine',
  })

  // Quiet echo notes follow the visual ripple as it travels across the board.
  const echoDelays = [0.11, 0.22, 0.33]
  echoDelays.forEach((delay, index) => {
    playTone(context, {
      frequency: baseFrequency * (0.72 - index * 0.08),
      startTime: startTime + delay,
      duration: 0.12,
      volume: 0.035,
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
    volume: 0.3,
    type: 'sine',
  })

  const notes = mark === 'X' ? [660, 880, 990] : [523, 659, 784]
  notes.forEach((frequency, index) => {
    playTone(context, {
      frequency,
      startTime: startTime + 0.08 + index * 0.12,
      duration: 0.24,
      volume: 0.11,
      type: 'triangle',
    })
  })
}

export function playDrawSound() {
  const context = getAudioContext()
  if (!context) return

  const startTime = context.currentTime + 0.02
  // A hollow, descending impact gives the draw its own character, separate
  // from the rising three-note victory fanfare.
  playTone(context, {
    frequency: 145,
    endFrequency: 48,
    startTime,
    duration: 0.72,
    volume: 0.34,
    type: 'sine',
  })
  playTone(context, {
    frequency: 390,
    endFrequency: 155,
    startTime: startTime + 0.015,
    duration: 0.46,
    volume: 0.13,
    type: 'triangle',
  })
  playTone(context, {
    frequency: 310,
    endFrequency: 185,
    startTime: startTime + 0.07,
    duration: 0.38,
    volume: 0.09,
    type: 'sine',
  })
  playNoiseImpact(context, startTime)
}

