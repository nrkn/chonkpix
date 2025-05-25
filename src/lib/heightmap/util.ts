import { createColor } from '../image/color.js'
import { createImage } from '../image/create.js'
import { T3 } from '../types.js'
import { Point3 } from '../voxel/types.js'
import { Heightmap, HeightmapAny } from './types.js'

export const enqueueNeighbours = (
  q: T3[], x: number, y: number, parentV: number
) => {
  q.push([x - 1, y, parentV])
  q.push([x + 1, y, parentV])
  q.push([x, y - 1, parentV])
  q.push([x, y + 1, parentV])
}

export const minHeight = (heightmap: HeightmapAny) => Math.min(...heightmap.data)

export const maxHeight = (heightmap: HeightmapAny) => Math.max(...heightmap.data)

export const hmU8ToImageData = (
  heightmap: Heightmap<Uint8ClampedArray | Uint8Array>,
  isScaled = false
) => {
  const { width, height, data } = heightmap
  const size = width * height

  const img = createImage(width, height)
  const view = new Uint32Array(img.data.buffer)

  let min = 0
  let max = 0
  let delta = 0
  let scale = 0

  if (isScaled) {
    min = minHeight(heightmap)
    max = maxHeight(heightmap)
    delta = max - min
    scale = 255 / delta
  }

  for (let i = 0; i < size; i++) {
    const v = data[i]

    const value = isScaled ? Math.floor((v - min) * scale) : v

    view[i] = createColor(value)
  }

  return img
}

// make the lowest value === 0
export const normalizeHmU8C = (heightmap: Heightmap) => {
  const min = minHeight(heightmap)
  const { width, height, data } = heightmap
  const size = width * height

  const result: Heightmap = {
    width,
    height,
    data: new Uint8ClampedArray(size)
  }

  for (let i = 0; i < size; i++) {
    result.data[i] = data[i] - min
  }

  return result
}

export const heightmapToPoint3 = (heightmap: HeightmapAny): Point3[] => {
  const { width, height, data } = heightmap

  const vox: Point3[] = []

  for (let sy = 0; sy < height; sy++) {
    const rowStart = sy * width
    const dz = height - 1 - sy

    for (let sx = 0; sx < width; sx++) {
      const i = rowStart + sx
      const dx = sx
      const dy = data[i]

      vox.push([dx, dy, dz])
    }
  }

  return vox
}

export const heightmapToString = (heightmap: HeightmapAny, cellW = 4) => {
  const { width, height, data } = heightmap

  const rows: string[] = []

  for (let y = 0; y < height; y++) {
    const rowStart = y * width
    let row = ''

    for (let x = 0; x < width; x++) {
      const i = rowStart + x

      row += data[i].toString().padStart(cellW, ' ')
    }

    rows.push(row)
  }

  return rows.join('\n')
}
