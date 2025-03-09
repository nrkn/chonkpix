import { bresenhamLine } from '../../image/bresenham.js'
import { Point3 } from '../types.js'

export const createWall = (
  x0: number, z0: number, x1: number, z1: number, yBottom: number, yH: number
) => {
  const pts: Point3[] = []

  const line2 = bresenhamLine(x0, z0, x1, z1)

  for (let i = 0; i < line2.length; i++) {
    const [x, z] = line2[i]

    for (let y = yBottom; y < yBottom + yH; y++) {
      pts.push([x, y, z])
    }
  }

  return pts
}

export const createPlane = (
  x0: number, y0: number, z0: number,
  w: number, d: number
) => {
  const pts: Point3[] = []

  for (let z = z0; z < z0 + d; z++) {
    for (let x = x0; x < x0 + w; x++) {
      pts.push([x, y0, z])
    }
  }

  return pts
}