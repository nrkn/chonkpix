import { fontImageToPoints, layoutTextLine, textLayoutToIndices } from '../bmpfont/layout.js'
import { loadFontMono } from '../bmpfont/load.js'
import { BmpFontM } from '../bmpfont/types.js'
import { createColor } from '../image/color.js'
import { fill, fillIndices } from '../image/fill.js'
import { Maybe, Scene, State, T2 } from '../types.js'
import { maybe } from '../util.js'

export const debugTextSceneHelper = (
  getCurrentText: () => string[]
): Scene => {
  let isActive = false
  let font: Maybe<BmpFontM>
  let fontPts: Record<number, Maybe<T2[]>> = {}

  const init = async (_state: State) => {
    font = await loadFontMono('EverexME_5x8')
    fontPts = fontImageToPoints(font)

    isActive = true
  }

  const update = (state: State) => {
    if (!maybe(font)) throw Error('Expected font')
    if (!maybe(fontPts)) throw Error('Expected fontPts')

    const text = getCurrentText()

    if (text.length === 0) return

    const buffer = state.view.getBuffer()
    const { width } = buffer

    const padding = 2

    let longest = 0

    for (let i = 0; i < text.length; i++) {
      const len = text[i].length

      if (len > longest) longest = len
    }

    const textW = font.width * longest + padding * 2
    const textH = font.height * text.length + padding * 2
    const textX = width - textW - padding
    const textY = padding

    const textBg = createColor(0x00, 0x78, 0xd4)
    const textFg = createColor(0xff, 0xd7, 0x00)

    fill(buffer, textBg, [textX, textY, textW, textH])

    for (let i = 0; i < text.length; i++) {
      const textLayout = layoutTextLine(font, text[i])

      const textIndices = textLayoutToIndices(
        buffer,
        textX + padding, textY + padding + i * font.height,
        fontPts, textLayout
      )

      fillIndices(textIndices, buffer, textFg)
    }
  }

  const quit = async (_state: State) => {
    font = null
    fontPts = {}

    isActive = false
  }

  const setActive = (active: boolean) => {
    isActive = active
  }

  return { init, update, quit, setActive }
}