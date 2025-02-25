import { T2 } from '../types.js'

export const bresenhamLine = (
  x0: number, y0: number, x1: number, y1: number
): T2[] => {
  x0 |= 0
  y0 |= 0
  x1 |= 0
  y1 |= 0

  const dx = Math.abs(x1 - x0)
  const sx = x0 < x1 ? 1 : -1

  const dy = -Math.abs(y1 - y0)
  const sy = y0 < y1 ? 1 : -1

  let err = dx + dy

  const points: T2[] = []

  while (true) {
    points.push([x0, y0])

    if (x0 === x1 && y0 === y1) {
      break
    }

    const e2 = 2 * err

    if (e2 >= dy) {
      err += dy
      x0 += sx
    }

    if (e2 <= dx) {
      err += dx
      y0 += sy
    }
  }

  return points
}