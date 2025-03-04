import { BmpFontM, FontPoints } from '../../lib/bmpfont/types.js'
import { AnimationFrame, TileSheet } from '../../lib/sprites/types.js'
import { Maybe } from '../../lib/types.js'

import {
  MOVE_DOWN, MOVE_LEFT, MOVE_NONE, MOVE_RIGHT, MOVE_UP
} from './const.js'

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

export type Move = (
  typeof MOVE_NONE | typeof MOVE_UP | typeof MOVE_RIGHT | typeof MOVE_DOWN |
  typeof MOVE_LEFT
)

export type RangerDeps = {
  tiles: TileSheet
  sprites: TileSheet
  font: BmpFontM
  fontPts: FontPoints
  tileMap: TileMap
  blocking: Set<TileMapCell>
  playerAnimLeft: (now: number) => Maybe<number>
  playerAnimRight: (now: number) => Maybe<number>
  animatedTileIndices: Set<number>
}

export type RangerState = {
  facing: 'left' | 'right'
  cameraX: number
  cameraY: number
  lastW: number
  lastH: number
  moveCols: number
  moveRows: number
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
  animated: Set<number>
}
