import { T3 } from '../types.js'

export const bres3 = (
  x1: number, y1: number, z1: number, x2: number, y2: number, z2: number
): T3[] => {
  x1 |= 0
  y1 |= 0
  z1 |= 0
  x2 |= 0
  y2 |= 0
  z2 |= 0

  const pts: T3[] = []

  pts.push([x1, y1, z1])

  const dx = Math.abs(x2 - x1)
  const dy = Math.abs(y2 - y1)
  const dz = Math.abs(z2 - z1)

  const sx = x2 > x1 ? 1 : -1
  const sy = y2 > y1 ? 1 : -1
  const sz = z2 > z1 ? 1 : -1

  // driving axis is x
  if (dx >= dy && dx >= dz) {
    let p1 = 2 * dy - dx
    let p2 = 2 * dz - dx

    while (x1 != x2) {
      x1 += sx
      if (p1 >= 0) {
        y1 += sy
        p1 -= 2 * dx
      }
      if (p2 >= 0) {
        z1 += sz
        p2 -= 2 * dx
      }
      p1 += 2 * dy
      p2 += 2 * dz
      pts.push([x1, y1, z1])
    }

    // driving axis is y
  } else if (dy >= dx && dy >= dz) {
    let p1 = 2 * dx - dy
    let p2 = 2 * dz - dy
    while (y1 != y2) {
      y1 += sy
      if (p1 >= 0) {
        x1 += sx
        p1 -= 2 * dy
      }
      if (p2 >= 0) {
        z1 += sz
        p2 -= 2 * dy
      }
      p1 += 2 * dx
      p2 += 2 * dz
      pts.push([x1, y1, z1])
    }

    // driving axis is z
  } else {
    let p1 = 2 * dy - dz
    let p2 = 2 * dx - dz
    while (z1 != z2) {
      z1 += sz
      if (p1 >= 0) {
        y1 += sy
        p1 -= 2 * dz
      }
      if (p2 >= 0) {
        x1 += sx
        p2 -= 2 * dz
      }
      p1 += 2 * dy
      p2 += 2 * dx
      pts.push([x1, y1, z1])
    }
  }
  
  return pts
}