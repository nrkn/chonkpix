import { AnimationTile, SpanTile, StaticTile, VariationTile } from './types.js'


export const tileW = 16
export const tileH = 16

export const tileCx = Math.floor(tileW / 2)
export const tileCy = Math.floor(tileH / 2)

export const tileCols = 256
export const tileRows = 256

export const water: AnimationTile = ['animation', 'water', [500, 0], [500, 1]]
export const filled: StaticTile = ['static', 'filled', 2]
export const grasses: VariationTile = ['variation', 'grass', 3, 5]
export const rocks: VariationTile = ['variation', 'rock', 8, 3]
export const trees: VariationTile = ['variation', 'tree', 11, 4]
export const appleIcon: StaticTile = ['static', 'apple-icon', 15]
export const heartIcon: StaticTile = ['static', 'heart-icon', 16]
export const sands: VariationTile = ['variation', 'sand', 17, 3]
export const hut: StaticTile = ['static', 'hut', 20]
export const computer: StaticTile = ['static', 'computer', 21]
export const printer: StaticTile = ['static', 'printer', 22]
export const bed: StaticTile = ['static', 'bed', 23]
export const hutFront: SpanTile = ['span', 'hut-front', 24, 3]
export const empty: StaticTile = ['static', 'empty', 27]
export const ruins: VariationTile = ['variation', 'ruins', 28, 3]
export const mountains: VariationTile = ['variation', 'mountain', 31, 3]

export const satellite: AnimationTile = [
  'animation', 'satellite', [500, 34], [500, 35]
]

export const activePortal: AnimationTile = [
  'animation', 'portal', [100, 36], [100, 37]
]

export const skeleton: StaticTile = ['static', 'skeleton', 38]
export const keyIcon: StaticTile = ['static', 'key-icon', 39]
export const diskIcon: StaticTile = ['static', 'disk-icon', 40]
export const curcuitIcon: StaticTile = ['static', 'chip-icon', 41]
export const halfTone: StaticTile = ['static', 'half-tone', 42]
export const disabledPortal: StaticTile = ['static', 'disabled-satellite', 43]
export const inactivePortal: StaticTile = ['static', 'inactive-satellite', 44]
