import { countCells, generateGridLayout } from '../grid/index.js'
import { T4 } from '../types.js'
import { assrt } from '../util.js'
import { TileSheet } from './types.js'

// for sheets where all tiles are same size and laid out uniformly.
// otherwise, write a custom function for the use case
export const createTileSheet = (
  image: ImageData, cellW: number, cellH: number,
  names: string[] = [], gap = 0, padding = 0
) => {
  const cols = countCells(image.width, cellW, gap, padding)
  const rows = countCells(image.height, cellH, gap, padding)
  const size = cols * rows

  const grid = generateGridLayout(cellW, cellH, cols, rows, gap, padding)

  const tiles: TileSheet = {
    image,
    rects: Array<T4>(size),
    names: new Map<string, number>()
  }

  for (let i = 0; i < size; i++) {
    const cell = grid.cells[i]

    tiles.rects[i] = [...cell, cellW, cellH]

    if (names[i]) {
      tiles.names.set(names[i], i)
    }
  }

  return tiles
}

export const getTileIndex = (sheet: TileSheet, tileName: string) =>
  assrt(sheet.names.get(tileName), `Tile ${tileName} not found`)
