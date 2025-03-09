import { Heightmap } from './types.js'

export const createHeightmap = (
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
