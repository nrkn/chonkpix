import { TypedArray } from '../types.js'

export type Heightmap<T extends TypedArray = Uint8ClampedArray> = {
  width: number
  height: number
  data: T
}

export type HeightmapAny = Heightmap<TypedArray>
