import { T2 } from '../types.js'
import { assrtPositive } from '../util.js'
import { GridLayout, GridKey, NamedGridLayout } from './types.js'

export const generateGridLayout = (
  cellW: number, cellH: number,
  cols: number, rows: number,
  gap = 0, padding = 0,
  dx = 0, dy = 0
): GridLayout => {
  const cellCount = cols * rows
  const data = Array<T2>(cellCount)

  const width = measureCells(cellW, cols, gap, padding)
  const height = measureCells(cellH, rows, gap, padding)

  let x = padding
  let y = padding

  for (let i = 0; i < cellCount; i++) {
    data[i] = [x + dx, y + dy]

    x += cellW + gap

    if (x + cellW > width) {
      x = padding
      y += cellH + gap
    }
  }

  return {
    cellW, cellH, cols, rows, gap, padding, width, height, cells: data
  }
}

export const measureCells = (
  size: number, count: number, gap = 0, padding = 0
) => 
  size * count + (count - 1) * gap + 2 * padding

export const generateNamedGridLayout = (grid: GridLayout) => {
  const named: NamedGridLayout = {
    ...grid
  }

  for (let y = 0; y < grid.rows; y++) {
    for (let x = 0; x < grid.cols; x++) {
      named[gridKey(x, y)] = grid.cells[y * grid.cols + x]
    }
  }

  return named
}

export const colKey = (col: number) => {
  col = assrtPositive(
    col | 0, 'Only positive integers are allowed for column keys'
  )

  let key = ''

  do {
    const mod = col % 26
    key = String.fromCharCode(97 + mod) + key
    col = Math.floor(col / 26) - 1
  } while (col >= 0)

  return key
}

export const parseColKey = (key: string) => {
  if (key.length === 0) return 0
  if (key.length === 1) return key.charCodeAt(0) - 97

  let col = 0

  for (let i = 0; i < key.length - 1; i++) {
    col = col * 26 + (key.charCodeAt(i) - 97 + 1)
  }

  col = col * 26 + (key.charCodeAt(key.length - 1) - 97)

  return col
}

export const gridKey = (col: number, row: number): GridKey =>
  `${colKey(col)}${row}`

export const parseGridKey = (gridKey: GridKey): T2 => {
  const match = gridKey.match(/^([a-z]+)(\d+)$/)

  if (!match) {
    throw Error(`Invalid grid key: ${gridKey}`)
  }

  const [, col, row] = match

  return [parseColKey(col), parseInt(row)]
}

export const countCells = (
  avail: number, each: number, gap = 0, padding = 0
) => {
  // remove the padding and add the final gap
  const inside = avail + gap - 2 * padding  

  return Math.floor( inside / (each + gap) )
}