import { T2, T4 } from '../types.js'
import { Row } from './types.js'
import { clampRect } from './util.js'

type QueryPredicate = (
  r: number, g: number, b: number, a: number, x: number, y: number, i: number
) => boolean

export const imageQuery = (
  imageData: ImageData, predicate: QueryPredicate,
  rect: T4 = [0, 0, imageData.width, imageData.height]
): T2 | null => {
  rect = clampRect(imageData.width, imageData.height, rect)

  const [x0, y0, w, h] = rect

  const x1 = x0 + w
  const y1 = y0 + h

  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * imageData.width + x) * 4
      const r = imageData.data[i]
      const g = imageData.data[i + 1]
      const b = imageData.data[i + 2]
      const a = imageData.data[i + 3]

      if (predicate(r, g, b, a, x, y, i)) {
        return [x, y]
      }
    }
  }

  return null
}

export const imageQueryAll = (
  imageData: ImageData, predicate: QueryPredicate,
  rect: T4 = [0, 0, imageData.width, imageData.height]
): T2[] => {
  rect = clampRect(imageData.width, imageData.height, rect)

  const [x0, y0, w, h] = rect

  const x1 = x0 + w
  const y1 = y0 + h

  const pts: T2[] = []

  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * imageData.width + x) * 4
      const r = imageData.data[i]
      const g = imageData.data[i + 1]
      const b = imageData.data[i + 2]
      const a = imageData.data[i + 3]

      if (predicate(r, g, b, a, x, y, i)) {
        pts.push([x, y])
      }
    }
  }

  return pts
}

export const rowQuery = (
  imageData: ImageData, predicate: QueryPredicate,
  rect: T4 = [0, 0, imageData.width, imageData.height]
): Row<never>[] => {
  rect = clampRect(imageData.width, imageData.height, rect)

  const [x0, y0, w, h] = rect

  const x1 = x0 + w
  const y1 = y0 + h

  const rows: Row<never>[] = []

  let inRow = false
  let rowY = 0
  let rowStart = 0
  let rowEnd = 0

  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * imageData.width + x) * 4
      const r = imageData.data[i]
      const g = imageData.data[i + 1]
      const b = imageData.data[i + 2]
      const a = imageData.data[i + 3]

      if (predicate(r, g, b, a, x, y, i)) {
        if (!inRow) {
          inRow = true
          rowY = y
          rowStart = x
          rowEnd = x
        } else {
          rowEnd = x
        }
      } else {
        if (inRow) {
          rows.push([rowY, rowStart, rowEnd])
          inRow = false
        }
      }
    }

    if (inRow) {
      rows.push([rowY, rowStart, rowEnd])
      inRow = false
    }
  }

  return rows  
}
