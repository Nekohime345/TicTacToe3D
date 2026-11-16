export const BOARD_CELLS = Array.from({ length: 9 }, (_, index) => index)

export const INITIAL_CAMERA = {
  position: [4, 4.3, 6.5],
  rotation: [-34, 36, 0],
}

export const INITIAL_ZOOM = 1.59

export const PLAY_CAMERA = {
  position: [0, 9, 2.2],
  rotation: [-76, 0, 0],
  zoom: 1,
}

export const SAMPLE_MARKS = { 3: 'X', 5: 'O' }
