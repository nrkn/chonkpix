import { T2 } from '../types.js'

export type GridLayout = {
  readonly cellW: number
  readonly cellH: number
  readonly cols: number
  readonly rows: number
  readonly gap: number
  readonly padding: number
  readonly width: number
  readonly height: number
  cells: T2[]
}

// eg a0, zc34 etc
export type GridKey = `${ string }${ number }`

export type NamedGridLayout = {
  [key in GridKey]: T2
} & GridLayout
