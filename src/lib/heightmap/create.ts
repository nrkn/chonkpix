import { Heightmap } from './types.js'

export const createHeightmapU8 = (
  width: number, height: number, data?: Uint8ClampedArray
): Heightmap => {
  const size = width * height

  if (data === undefined) {
    data = new Uint8ClampedArray(size)
  } else if (data.length !== size) {
    throw Error(`Expected data length to be ${size}, got ${data.length}`)
  }

  return { width, height, data }
}

export const createHeightmapU16 = (
  width: number, height: number, data?: Uint16Array
): Heightmap<Uint16Array> => {
  const size = width * height

  if (data === undefined) {
    data = new Uint16Array(size)
  } else if (data.length !== size) {
    throw Error(`Expected data length to be ${size}, got ${data.length}`)
  }

  return { width, height, data }
}

export const createHeightmapI16 = (
  width: number, height: number, data?: Int16Array
): Heightmap<Int16Array> => {
  const size = width * height

  if (data === undefined) {
    data = new Int16Array(size)
  } else if (data.length !== size) {
    throw Error(`Expected data length to be ${size}, got ${data.length}`)
  }

  return { width, height, data }
}
