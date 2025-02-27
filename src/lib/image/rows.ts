import { bresenhamLine } from './bresenham.js'
import { Row } from './types.js'
import { T2 } from '../types.js'

const createRow = <Arg>(
  row: number, startCol: number, endCol: number, ...args: Arg[]
): Row<Arg> => [
    row, startCol, endCol, ...args
  ]

export const pointToRow = <Arg>(
  x: number, y: number, ...args: Arg[]
): Row<Arg> => [y, x, x, ...args]

// nb - if the line is not mostly horizontal, you should just use bresenhamLine
// directly - this was more experimental than anything, though it is a lot 
// faster for its limited use case
export const lineToRows = (
  x0: number, y0: number, x1: number, y1: number
): Row<never>[] => {
  x0 |= 0
  y0 |= 0
  x1 |= 0
  y1 |= 0

  const steep = Math.abs(y1 - y0) > Math.abs(x1 - x0)

  if (steep) {
    [x0, y0] = [y0, x0];[x1, y1] = [y1, x1]
  }

  if (x0 > x1) {
    [x0, x1] = [x1, x0];[y0, y1] = [y1, y0]
  }

  const dx = x1 - x0
  const dy = Math.abs(y1 - y0)

  let err = dx / 2

  const yStep = y0 < y1 ? 1 : -1

  let y = y0

  const rows: Row<never>[] = []

  let currentRow: number | null = null
  let spanStart: number | null = null
  let spanEnd: number | null = null

  for (let x = x0; x <= x1; x++) {
    const px = steep ? y : x
    const py = steep ? x : y

    // if first pixel, start new span
    if (currentRow === null) {
      currentRow = py
      spanStart = px
      spanEnd = px
    } else if (currentRow === py) {
      // if consecutive, extend span
      if (px < spanStart!) {
        spanStart = px
      }
      if (px > spanEnd!) {
        spanEnd = px
      }
    } else {
      // row changed - store last span
      rows.push(createRow(currentRow, spanStart!, spanEnd!))

      // start new span
      currentRow = py
      spanStart = px
      spanEnd = px
    }

    err -= dy

    if (err < 0) {
      y += yStep
      err += dx
    }
  }

  // maybe push last span
  if (currentRow !== null) {
    rows.push(createRow(currentRow, spanStart!, spanEnd!))
  }

  return rows
}

export const rectToRows = (
  x: number, y: number, w: number, h: number
): Row<never>[] => {
  const rows: Row<never>[] = []

  for (let j = 0; j < h; j++) {
    rows.push(createRow(y + j, x, x + w - 1))
  }

  return rows
}

// designed so that bresenham strokes can be used without gaps or overlaps.
// consider passing the bresenham lines in instead of the triangle points.
// could also be renamed and extended to fill any convex polygon.
//
// we should add a more sophisticated scanline that can handle complex polygons
// with holes etc.
export const triangleToRows = (
  a: T2, b: T2, c: T2
) => {
  const edges = [
    bresenhamLine(a[0], a[1], b[0], b[1]),
    bresenhamLine(b[0], b[1], c[0], c[1]),
    bresenhamLine(c[0], c[1], a[0], a[1])
  ] as const

  const edgeMap = new Map<number, number[]>()

  for (const edge of edges) {
    for (const [x, y] of edge) {
      if (!edgeMap.has(y)) {
        edgeMap.set(y, [])
      }

      edgeMap.get(y)!.push(x)
    }
  }

  const rows: Row<never>[] = []

  for (const [y, xs] of edgeMap) {
    const row = createRow<never>(y, Math.min(...xs), Math.max(...xs))

    rows.push(row)
  }

  return rows
}
