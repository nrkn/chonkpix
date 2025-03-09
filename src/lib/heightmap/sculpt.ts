import { clampRect } from '../image/util.js'
import { T4 } from '../types.js'
import { Heightmap } from './types.js'
import { enqueueNeighbours } from './util.js'

export const raise = (heightmap: Heightmap, x: number, y: number) => {
  const { width, height, data } = heightmap

  const i = y * width + x

  const v = data[i] + 1

  if (v > 255) return

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

export const lower = (heightmap: Heightmap, x: number, y: number) => {
  const { width, height, data } = heightmap

  const i = y * width + x

  const v = data[i] - 1

  if (v < 0) return

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


// raise every point in rect to highest value in rect
export const raiseRect = (
  heightmap: Heightmap, x: number, y: number, w: number, h: number
) => {
  let highest = 0

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
        raise(heightmap, i, j)
        v++
      }
    }
  }

  return highest
}

// lower every point in rect to lowest value in rect
export const lowerRect = (
  heightmap: Heightmap, x: number, y: number, w: number, h: number
) => {
  let lowest = 255

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
        lower(heightmap, i, j)
        v--
      }
    }
  }

  return lowest
}

// average the values in the rect, then raise or lower each point to match
export const flattenRect = (
  heightmap: Heightmap, x: number, y: number, w: number, h: number
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
        raise(heightmap, i, j)
        v++
      }
      while (v > avg) {
        lower(heightmap, i, j)
        v--
      }
    }
  }

  return avg
}

export const smooth = (
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
