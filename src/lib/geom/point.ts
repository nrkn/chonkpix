import { T2, T4 } from '../types.js'
import { BoundsHandling } from './types.js'

export const ensurePointBounds = (
  rect: T4, mode: BoundsHandling
) => {
  const [rx, ry, rw, rh] = rect

  const rx2 = rx + rw
  const ry2 = ry + rh

  return (pts: T2[]): T2[] => {
    if (mode === 'none') return pts

    if (mode === 'clamp') {
      return pts.filter(([x, y]) => x >= rx && x < rx2 && y >= ry && y < ry2)
    }

    if (mode === 'wrap') {
      return pts.map(([x, y]) => {
        return [
          (x - rx) % rw + rx,
          (y - ry) % rh + ry
        ]
      })
    }

    throw Error(`Invalid mode: ${mode}`)
  }
}