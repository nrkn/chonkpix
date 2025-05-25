import { clampRect } from '../image/util.js'
import { T4 } from '../types.js'
import { Heightmap, HeightmapAny } from './types.js'
import { enqueueNeighbours } from './util.js'

// excl max
const MAX_U8 = 256
const MAX_U16 = 65536
const MAX_I16 = 32768

// incl min
const MIN_U8 = 0
const MIN_U16 = 0
const MIN_I16 = -32768

export const raiseHmPt = (
  heightmap: HeightmapAny, x: number, y: number, max = MAX_U8
) => {
  const { width, height, data } = heightmap

  const i = y * width + x

  const v = data[i] + 1

  if (v >= max) return

  data[i] = v

  const queue: [number, number, number][] = []

  enqueueNeighbours(queue, x, y, v)

  while (queue.length) {
    const [nx, ny, nv] = queue.shift()!

    if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
      continue
    }

    const n = ny * width + nx

    if (data[n] >= nv) {
      continue
    }

    if (data[n] === nv - 1) {
      continue
    }

    data[n] = nv - 1

    enqueueNeighbours(queue, nx, ny, nv - 1)
  }
}

export const raiseHmPtU16 = (
  heightmap: Heightmap<Uint16Array>, x: number, y: number, max = MAX_U16
) => raiseHmPt(heightmap, x, y, max)

export const raiseHmPtI16 = (
  heightmap: Heightmap<Int16Array>, x: number, y: number, max = MAX_I16
) => raiseHmPt(heightmap, x, y, max)

export const lowerHmPt = (
  heightmap: HeightmapAny, x: number, y: number, min = MIN_U8
) => {
  const { width, height, data } = heightmap

  const i = y * width + x

  const v = data[i] - 1

  if (v < min) return

  data[i] = v

  const queue: [number, number, number][] = []

  enqueueNeighbours(queue, x, y, v)

  while (queue.length) {
    const [nx, ny, nv] = queue.shift()!

    if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
      continue
    }

    const n = ny * width + nx

    if (data[n] <= nv) {
      continue
    }

    if (data[n] === nv + 1) {
      continue
    }

    data[n] = nv + 1

    enqueueNeighbours(queue, nx, ny, nv + 1)
  }
}

export const lowerHmPtU16 = (
  heightmap: Heightmap<Uint16Array>, x: number, y: number, min = MIN_U16
) => lowerHmPt(heightmap, x, y, min)

export const lowerHmPtI16 = (
  heightmap: Heightmap<Int16Array>, x: number, y: number, min = MIN_I16
) => lowerHmPt(heightmap, x, y, min)

// raise every point in rect to highest value in rect
export const raiseHmRect = (
  heightmap: HeightmapAny, x: number, y: number, w: number, h: number,
  max = MAX_U8
) => {
  let highest = Number.NEGATIVE_INFINITY

  // find highest value in rect
  for (let j = y; j < y + h; j++) {
    if (j < 0 || j >= heightmap.height) continue

    const rowStart = j * heightmap.width

    for (let i = x; i < x + w; i++) {
      if (i < 0 || i >= heightmap.width) continue

      const index = rowStart + i

      const v = heightmap.data[index]

      if (v > highest) highest = v
    }
  }

  // for each point in rect < highest, raise until matches highest
  for (let j = y; j < y + h; j++) {
    if (j < 0 || j >= heightmap.height) continue

    const rowStart = j * heightmap.width

    for (let i = x; i < x + w; i++) {
      if (i < 0 || i >= heightmap.width) continue

      const index = rowStart + i

      let v = heightmap.data[index]

      while (v < highest) {
        raiseHmPt(heightmap, i, j, max)
        v++
      }
    }
  }

  return highest
}

export const raiseHmRectU16 = (
  heightmap: Heightmap<Uint16Array>, x: number, y: number, w: number, h: number,
  max = MAX_U16
) => raiseHmRect(heightmap, x, y, w, h, max)

export const raiseHmRectI16 = (
  heightmap: Heightmap<Int16Array>, x: number, y: number, w: number, h: number,
  max = MAX_I16
) => raiseHmRect(heightmap, x, y, w, h, max)

// lower every point in rect to lowest value in rect
export const lowerHmRect = (
  heightmap: HeightmapAny, x: number, y: number, w: number, h: number,
  min = MIN_U8
) => {
  let lowest = Number.POSITIVE_INFINITY

  // find lowest value in rect
  for (let j = y; j < y + h; j++) {
    if (j < 0 || j >= heightmap.height) continue

    const rowStart = j * heightmap.width

    for (let i = x; i < x + w; i++) {
      if (i < 0 || i >= heightmap.width) continue

      const index = rowStart + i

      const v = heightmap.data[index]

      if (v < lowest) lowest = v
    }
  }

  // for each point in rect > lowest, lower until matches lowest
  for (let j = y; j < y + h; j++) {
    if (j < 0 || j >= heightmap.height) continue

    const rowStart = j * heightmap.width

    for (let i = x; i < x + w; i++) {
      if (i < 0 || i >= heightmap.width) continue

      const index = rowStart + i

      let v = heightmap.data[index]

      while (v > lowest) {
        lowerHmPt(heightmap, i, j, min)
        v--
      }
    }
  }

  return lowest
}

export const lowerHmRectU16 = (
  heightmap: Heightmap<Uint16Array>, x: number, y: number, w: number, h: number,
  min = MIN_U16
) => lowerHmRect(heightmap, x, y, w, h, min)

export const lowerHmRectI16 = (
  heightmap: Heightmap<Int16Array>, x: number, y: number, w: number, h: number,
  min = MIN_I16
) => lowerHmRect(heightmap, x, y, w, h, min)

// average the values in the rect, then raise or lower each point to match
export const flattenHmRect = (
  heightmap: HeightmapAny, x: number, y: number, w: number, h: number,
  min = MIN_U8, max = MAX_U8
) => {
  let sum = 0
  let count = 0

  // sum values in rect
  for (let j = y; j < y + h; j++) {
    if (j < 0 || j >= heightmap.height) continue

    const rowStart = j * heightmap.width

    for (let i = x; i < x + w; i++) {
      if (i < 0 || i >= heightmap.width) continue

      const index = rowStart + i

      sum += heightmap.data[index]
      count++
    }
  }

  const avg = Math.floor(sum / count)

  // for each point in rect, raise or lower to match avg
  for (let j = y; j < y + h; j++) {
    if (j < 0 || j >= heightmap.height) continue

    const rowStart = j * heightmap.width

    for (let i = x; i < x + w; i++) {
      if (i < 0 || i >= heightmap.width) continue

      const index = rowStart + i

      let v = heightmap.data[index]

      while (v < avg) {
        raiseHmPt(heightmap, i, j, max)
        v++
      }
      while (v > avg) {
        lowerHmPt(heightmap, i, j, min)
        v--
      }
    }
  }

  return avg
}

export const flattenHmRectU16 = (
  heightmap: Heightmap<Uint16Array>, x: number, y: number, w: number, h: number,
  min = MIN_U16, max = MAX_U16
) => flattenHmRect(heightmap, x, y, w, h, min, max)

export const flattenHmRectI16 = (
  heightmap: Heightmap<Int16Array>, x: number, y: number, w: number, h: number,
  min = MIN_I16, max = MAX_I16
) => flattenHmRect(heightmap, x, y, w, h, min, max)

export const smoothHmU8C = (
  heightmap: Heightmap,
  rect: T4,
  times: number
) => {
  rect = clampRect(heightmap.width, heightmap.height, rect)

  const { width, height, data: srcData } = heightmap

  const size = width * height

  const result: Heightmap = {
    width,
    height,
    data: new Uint8ClampedArray(size)
  }

  const [sx, sy, sw, sh] = rect

  for (let t = 0; t < times; t++) {
    for (let y = sy; y < sy + sh; y++) {
      for (let x = sx; x < sx + sw; x++) {
        const i = y * width + x

        let sum = srcData[i]
        let count = 1

        if (x > 0) {
          const l = i - 1

          sum += srcData[l]
          count++
        }

        if (x < width - 1) {
          const r = i + 1

          sum += srcData[r]
          count++
        }

        if (y > 0) {
          const u = i - width

          sum += srcData[u]
          count++
        }

        if (y < height - 1) {
          const d = i + width

          sum += srcData[d]
          count++
        }

        result.data[i] = Math.floor(sum / count)
      }
    }
  }

  return result
}
