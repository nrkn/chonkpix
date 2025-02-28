import { T2 } from '../types.js'
import { maybe } from '../util.js'
import { NeighbourType } from './types.js'

const hashPoint = ([x, y]: T2) => (x << 16) | y

const cardCache = new Map<number, T2[]>()
const ordCache = new Map<number, T2[]>()
const allCache = new Map<number, T2[]>()

export const getNeighboursCardinal = (pt: T2): T2[] => {
  const hash = hashPoint(pt)

  let points = cardCache.get(hash)

  if (maybe(points)) return points

  const [x, y] = pt

  const t = y - 1
  const r = x + 1
  const b = y + 1
  const l = x - 1

  // t, r, b, l
  const pts: T2[] = [
    [x, t], [r, y], [x, b], [l, y]
  ]

  cardCache.set(hash, pts)

  return pts
}

export const getNeighboursOrdinal = (pt: T2): T2[] => {
  const hash = hashPoint(pt)

  let points = ordCache.get(hash)

  if (maybe(points)) return points

  const [x, y] = pt

  const t = y - 1
  const r = x + 1
  const b = y + 1
  const l = x - 1

  // tr, br, bl, tl
  const pts: T2[] = [
    [r, t], [r, b], [l, b], [l, t]
  ]

  ordCache.set(hash, pts)

  return pts
}

export const getNeighboursAll = (pt: T2): T2[] => {
  const hash = hashPoint(pt)

  let points = allCache.get(hash)

  if (maybe(points)) return points

  const [x, y] = pt

  const t = y - 1
  const r = x + 1
  const b = y + 1
  const l = x - 1

  // t, tr, r, br, b, bl, l, tl
  const pts: T2[] = [
    [x, t], [r, t], [r, y], [r, b],
    [x, b], [l, b], [l, y], [l, t]
  ]

  allCache.set(hash, pts)

  return pts
}

export const getNeighbours = (pt: T2, type: NeighbourType = 'all'): T2[] => {
  switch (type) {
    case 'cardinal': return getNeighboursCardinal(pt)
    case 'ordinal': return getNeighboursOrdinal(pt)
    case 'all': return getNeighboursAll(pt)
  }
}
