import { Row } from './types.js'
import { T2, T4, T6 } from '../types.js'

export const clampTransfer = (
  srcW: number, srcH: number, destW: number, destH: number,
  transfer: T6
): T6 => {
  let [sx, sy, sw, sh, dx, dy] = transfer

  if (sx < 0) {
    sw += sx
    dx -= sx
    sx = 0
  }

  if (sy < 0) {
    sh += sy
    dy -= sy
    sy = 0
  }

  if (sx + sw > srcW) {
    sw = srcW - sx
  }

  if (sy + sh > srcH) {
    sh = srcH - sy
  }

  if (dx < 0) {
    sw += dx
    sx -= dx
    dx = 0
  }

  if (dy < 0) {
    sh += dy
    sy -= dy
    dy = 0
  }

  if (dx + sw > destW) {
    sw = destW - dx
  }

  if (dy + sh > destH) {
    sh = destH - dy
  }

  if (sw < 0) sw = 0
  if (sh < 0) sh = 0

  return [sx, sy, sw, sh, dx, dy]
}

export const clampRect = (srcW: number, srcH: number, rect: T4): T4 => {
  let [x, y, w, h] = rect

  if (x < 0) {
    w += x
    x = 0
  }

  if (y < 0) {
    h += y
    y = 0
  }

  if (x + w > srcW) {
    w = srcW - x
  }

  if (y + h > srcH) {
    h = srcH - y
  }

  if (w < 0) w = 0
  if (h < 0) h = 0

  return [x, y, w, h]
}

export const clampRows = <Arg>(rows: Row<Arg>[], w: number, h: number) =>
  rows.reduce((acc, [y, x0, x1, ...args]) => {
    if (y < 0 || y >= h) return acc

    let x0c = Math.max(x0, 0)
    let x1c = Math.min(x1, w)

    if (x0c > x1c) return acc

    acc.push([y, x0c, x1c, ...args])

    return acc
  }, [] as Row<Arg>[])

export const clampRow = <Arg>(row: Row<Arg>, w: number, h: number) => {
  const [y, x0, x1, ...args] = row

  if (y < 0 || y >= h) return null

  let x0c = Math.max(x0, 0)
  let x1c = Math.min(x1, w)

  if (x0c > x1c) return null

  return [y, x0c, x1c, ...args] as Row<Arg>
}


export const pointsToIndices = (w: number, h: number, channels: number) =>
  (points: T2[]) =>
    points.reduce((acc, [x, y]) => {
      if (x < 0 || x >= w || y < 0 || y >= h) return acc

      acc.push((y * w + x) * channels)

      return acc
    }, [] as number[])
