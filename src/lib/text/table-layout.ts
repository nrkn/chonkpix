import { maybe } from '../util.js'

export const textTable = (cells: string[][]): string[] => {
  const colWidths = new Map<number, number>()

  // measure
  for (let row = 0; row < cells.length; row++) {
    for (let col = 0; col < cells[row].length; col++) {
      const cell = cells[row][col]
      const width = cell.length

      let existingW = colWidths.get(col)

      if (!maybe(existingW)) {
        existingW = 0
      }

      if (width > existingW) {
        colWidths.set(col, width)
      }
    }
  }

  // format
  const formatted: string[] = []

  for (let row = 0; row < cells.length; row++) {
    let line = ''

    for (let col = 0; col < cells[row].length; col++) {
      const cell = cells[row][col]
      const width = colWidths.get(col) || 0

      const isLast = col === cells[row].length - 1

      if (isLast) {
        line += cell.padStart(width)
      } else {
        line += cell.padEnd(width + 1)
      }
    }

    formatted.push(line)
  }

  return formatted
}