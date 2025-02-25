import { countCells, generateGridLayout } from '../grid/index.js'
import { T4 } from '../types.js'
import { assrt } from '../util.js'
import { Spritesheet } from './types.js'

// for sheets where all sprites are same size and laid out uniformly.
// otherwise, write a custom function for the use case
export const createSpriteSheet = (
  image: ImageData, cellW: number, cellH: number,
  names: string[] = [], gap = 0, padding = 0
) => {
  const cols = countCells(image.width, cellW, gap, padding)
  const rows = countCells(image.height, cellH, gap, padding)
  const spriteCount = cols * rows

  const grid = generateGridLayout(cellW, cellH, cols, rows, gap, padding)

  const sheet: Spritesheet = {
    image,
    rects: Array<T4>(spriteCount),
    names: new Map<string, number>()
  }

  for (let i = 0; i < spriteCount; i++) {
    const cell = grid.cells[i]

    sheet.rects[i] = [...cell, cellW, cellH]

    if (names[i]) {
      sheet.names.set(names[i], i)
    }
  }

  return sheet
}

export const getSpriteIndex = (sheet: Spritesheet, spriteName: string) =>
  assrt(sheet.names.get(spriteName), `Sprite ${spriteName} not found`)
