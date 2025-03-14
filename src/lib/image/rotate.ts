import { T4 } from '../types.js'
import { clampRect } from './util.js'

export const drawRotated = (
  src: ImageData, srcCx: number, srcCy: number,
  dest: ImageData, destCx: number, destCy: number,
  radians: number
) => {
  const srcData = src.data
  const destData = dest.data

  const srcWidth = src.width
  const srcHeight = src.height
  const destWidth = dest.width
  const destHeight = dest.height

  const cos = Math.cos(radians)
  const sin = Math.sin(radians)

  const [minX, minY, maxX, maxY] = computeRotatedBoundingBox(
    srcWidth, srcHeight, srcCx, srcCy, destCx, destCy, radians,
    destWidth, destHeight
  )

  for (let dy = minY; dy < maxY; dy++) {
    for (let dx = minX; dx < maxX; dx++) {
      const x = dx - destCx
      const y = dy - destCy

      const sxFloat = x * cos + y * sin + srcCx
      const syFloat = -x * sin + y * cos + srcCy

      const sx = Math.round(sxFloat)
      const sy = Math.round(syFloat)

      if (sx >= 0 && sx < srcWidth && sy >= 0 && sy < srcHeight) {
        const srcIndex = (sy * srcWidth + sx) * 4
        const destIndex = (dy * destWidth + dx) * 4

        destData[destIndex + 0] = srcData[srcIndex + 0]
        destData[destIndex + 1] = srcData[srcIndex + 1]
        destData[destIndex + 2] = srcData[srcIndex + 2]
        destData[destIndex + 3] = srcData[srcIndex + 3]
      }
    }
  }

  return dest
}

export const computeRotatedBoundingBox = (
  srcWidth: number,
  srcHeight: number,
  srcCx: number,
  srcCy: number,
  destCx: number,
  destCy: number,
  radians: number,
  destWidth: number,
  destHeight: number
) => {
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)

  const corners = [
    [0, 0],
    [srcWidth, 0],
    [srcWidth, srcHeight],
    [0, srcHeight]
  ]

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const corner of corners) {
    const lx = corner[0] - srcCx
    const ly = corner[1] - srcCy

    const rx = lx * cos - ly * sin
    const ry = lx * sin + ly * cos

    const dx = rx + destCx
    const dy = ry + destCy

    if (dx < minX) minX = dx
    if (dx > maxX) maxX = dx
    if (dy < minY) minY = dy
    if (dy > maxY) maxY = dy
  }

  let intMinX = Math.floor(minX)
  let intMinY = Math.floor(minY)
  let intMaxX = Math.ceil(maxX)
  let intMaxY = Math.ceil(maxY)

  intMinX = Math.max(0, Math.min(intMinX, destWidth - 1))
  intMinY = Math.max(0, Math.min(intMinY, destHeight - 1))
  intMaxX = Math.max(0, Math.min(intMaxX, destWidth))
  intMaxY = Math.max(0, Math.min(intMaxY, destHeight))

  return [intMinX, intMinY, intMaxX, intMaxY]
}
