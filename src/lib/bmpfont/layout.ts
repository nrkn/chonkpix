import { blit } from '../image/blit.js'
import { imageQueryAll } from '../image/query.js'
import { Maybe, T2, T3, T4, T6 } from '../types.js'
import { assrt } from '../util.js'
import { BmpFont, BmpLayout, FontPoints } from './types.js'

export const layoutTextLine = (
  font: BmpFont, line: string, x = 0, y = 0
): BmpLayout => {
  const layout = Array<T3>(line.length)

  let dx = x

  for (let i = 0; i < line.length; i++) {
    const charCode = line.charCodeAt(i)

    layout[i] = [charCode, dx, y]

    let width = font.width

    if (font.type === 'proportional') {
      width = font.widths[charCode] || font.width

      if (i < line.length - 1) {
        const kernFrom = font.kerning[charCode]

        if (kernFrom) {
          const kernTo = kernFrom[line.charCodeAt(i + 1)]

          if (kernTo) {
            width += kernTo
          }
        }
      }
    }

    dx += width + font.advance
  }

  return layout
}

export const blitTextLayout = (
  dest: ImageData, dx: number, dy: number, font: BmpFont, layout: BmpLayout
) => {
  for (let i = 0; i < layout.length; i++) {
    const glyphLayout = layout[i]
    const charCode = glyphLayout[0]
    const x = glyphLayout[1]
    const y = glyphLayout[2]

    const glyphRect = assrt(
      font.rects[charCode], `Expected rect for charCode ${charCode}`
    )

    const transfer: T6 = [...glyphRect, x + dx, y + dy]

    blit(font.image, dest, transfer)
  }

  return dest
}

export const fontImageToPoints = (
  font: BmpFont
): Record<number, Maybe<T2[]>> => {
  const charCodes = Object.keys(font.rects).map(Number)

  const fontPts: Record<number, Maybe<T2[]>> = {}

  for (let c = 0; c < charCodes.length; c++) {
    const ch = charCodes[c]
    const rect = font.rects[ch]

    if (!rect) continue

    const sheetPoints = imageQueryAll(font.image, r => r !== 0, rect)
    const pts = sheetPoints.map(([x, y]): T2 => [x - rect[0], y - rect[1]])

    fontPts[ch] = pts
  }

  return fontPts
}

export const textLayoutToIndices = (
  dest: ImageData, dx: number, dy: number, font: FontPoints, layout: BmpLayout,
  channels = 1
): number[] => {
  const indices: number[] = []

  for (let i = 0; i < layout.length; i++) {
    const glyphLayout = layout[i]
    const charCode = glyphLayout[0]
    const cpts = font[charCode]

    if (!cpts) continue

    const x = glyphLayout[1]
    const y = glyphLayout[2]

    for( let i = 0; i < cpts.length; i++ ){
      let [ px, py ] = cpts[i]

      px = px + dx + x
      py = py + dy + y

      if( px < 0 || px >= dest.width || py < 0 || py >= dest.height ) continue

      const index = (py * dest.width + px) * channels

      indices.push(index)
    }
  }

  return indices
}