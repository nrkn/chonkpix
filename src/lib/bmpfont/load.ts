import { loadImage } from '../image/load.js'
import { findSizeSlug, parseSizeSlug } from '../slug.js'
import { assrt, assrtInt } from '../util.js'
import { BmpFontM } from './types.js'

const fontPath = 'data'

export const monoFontFiles = [
  'ATI_SmallW_6x8',
  'EverexME_5x8',
  'HP_100LX_6x8',
  'Portfolio_6x8',
  'TsengEVA_132_6x8',
  'IBM_EGA_8x8',
  'IBM_VGA_8x14',
  'IBM_VGA_8x16',
  'IBM_VGA_9x8',
  'IBM_VGA_9x14',
  'IBM_VGA_9x16'
] as const

export type MonoFontName = typeof monoFontFiles[number]

export const loadFontMono = async (name: MonoFontName) => {
  const image = await loadImage(`${fontPath}/Bm437_${name}.png`)
  const sizeSlug = assrt(findSizeSlug(name), 'Expected size slug')
  const [width, height] = parseSizeSlug(sizeSlug)

  const cols = assrtInt(image.width / width)
  const rows = assrtInt(image.height / height)

  const font: BmpFontM = {
    type: 'mono',
    width,
    height,
    leading: 0, // built into the bitmap glyphs
    image: image,
    rects: {},
    advance: 0, // built into the bitmap glyphs
    fallback: 127
  }

  for (let r = 0; r < rows; r++) {
    const rowIndex = r * cols
    for (let c = 0; c < cols; c++) {
      const charCode = rowIndex + c

      font.rects[charCode] = [c * width, r * height, width, height]
    }
  }

  return font
}
