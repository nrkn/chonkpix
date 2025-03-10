import { randInt } from '../../random.js'
import { lower, raise } from '../sculpt.js'
import { Heightmap } from '../types.js'

export const generateHeightmap = (
  width: number, height: number, times = width * height * 8
) => {
  const size = width * height
  const data = new Uint8ClampedArray(size).fill(127)
  const heightmap: Heightmap = { width, height, data }

  for (let i = 0; i < times; i++) {
    const x = randInt(width)
    const y = randInt(height)
    if (randInt(2)) {
      raise(heightmap, x, y)
    } else {
      lower(heightmap, x, y)
    }
  }

  return heightmap
}
