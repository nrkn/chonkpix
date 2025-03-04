import { fontImageToPoints } from '../../lib/bmpfont/layout.js'
import { loadFontMono } from '../../lib/bmpfont/load.js'
import { loadImage } from '../../lib/image/load.js'
import { animator } from '../../lib/sprites/animator.js'
import { createTileSheet } from '../../lib/sprites/index.js'
import { State } from '../../lib/types.js'
import { generateMap } from './map-gen.js'
import { tileW, tileH, tileCols, tileRows } from './tile-data.js'
import { RangerDeps, RangerState } from './types.js'

export const rangerInit = async (state: State) => {
  const tileSheet = await loadImage('scenes/ranger/tiles.png')

  const tiles = createTileSheet(tileSheet, tileW, tileH)

  const spriteSheet = await loadImage('scenes/ranger/sprites.png')

  const sprites = createTileSheet(spriteSheet, tileW, tileH)

  const playerAnimRight = animator([[500, 0], [500, 1]])
  const playerAnimLeft = animator([[500, 2], [500, 3]])

  const map = generateMap(tileCols, tileRows)

  const { tileMap, blocking } = map

  const cameraX = Math.floor(tileMap.width / 2)
  const cameraY = Math.floor(tileMap.height / 2)

  const font = await loadFontMono('EverexME_5x8')
  const fontPts = fontImageToPoints(font)

  const prevRectIndices = new Map<number, number>()
  const animatedTileIndices = new Set<number>()

  for (let y = 0; y < tileMap.height; y++) {
    for (let x = 0; x < tileMap.width; x++) {
      const i = y * tileMap.width + x
      const cell = tileMap.data[i]

      if (typeof cell === 'function') {
        animatedTileIndices.add(i)
      }
    }
  }

  const buffer = state.view.getBuffer()

  const lastW = buffer.width
  const lastH = buffer.height

  const deps: RangerDeps = {
    tiles, sprites, font, fontPts, tileMap, blocking,
    playerAnimLeft, playerAnimRight, animatedTileIndices
  }

  const fstate: RangerState = {
    facing: 'right',
    cameraX, cameraY, lastW, lastH,
    moveCols: 0, moveRows: 0,
    prevRectIndices
  }

  return { deps, fstate }
}
