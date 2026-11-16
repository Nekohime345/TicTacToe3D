export const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
]

export function findWinner(marks) {
  const winningLine = WINNING_LINES.find((line) =>
    line.every((cell) => marks[cell] && marks[cell] === marks[line[0]]),
  )

  return winningLine ? marks[winningLine[0]] : null
}

export function isBoardFull(marks) {
  return marks.every(Boolean)
}
