import { BmpFontM, FontPoints } from '../../lib/bmpfont/types.js'
import { AnimationFrame, TileSheet } from '../../lib/sprites/types.js'
import { Maybe } from '../../lib/types.js'

export type AnimCell = (now: number) => Maybe<number>
export type TileMapCell = number | AnimCell

export type TileMap = {
  width: number
  height: number
  data: TileMapCell[]
}

// a tile that animates
export type AnimationTile = [
  type: 'animation', name: string, ...AnimationFrame[]
]
// a static tile
export type StaticTile = [type: 'static', name: string, id: number]
// variations of a static tile
export type VariationTile = [
  type: 'variation', name: string, id: number, count: number
]
// these tiles belong together
export type SpanTile = [type: 'span', name: string, id: number, count: number]

export type RangerDeps = {
  tiles: TileSheet
  sprites: TileSheet
  font: BmpFontM
  fontPts: FontPoints
  tileMap: TileMap
  blocking: Set<TileMapCell>
  playerAnimLeft: (now: number) => Maybe<number>
  playerAnimRight: (now: number) => Maybe<number>
}

export type RangerState = {
  facing: 'left' | 'right'
  cameraX: number
  cameraY: number
  lastW: number
  lastH: number
  prevRectIndices: Map<number, number>
}

export type ViewState = {
  cols: number
  rows: number
  vLeft: number
  vTop: number
  colLeft: number
  rowTop: number
  prevIndices: Maybe<number>[]
  currIndices: Maybe<number>[]
}
