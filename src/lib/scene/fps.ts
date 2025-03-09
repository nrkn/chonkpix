import {
  fontImageToPoints, layoutTextLine, textLayoutToIndices
} from '../bmpfont/layout.js'
import { loadFontMono } from '../bmpfont/load.js'
import { BmpFontM } from '../bmpfont/types.js'
import { createColor } from '../image/color.js'
import { fill, fillIndices } from '../image/fill.js'
import { Maybe, Scene, State, T2 } from '../types.js'
import { maybe } from '../util.js'

export const fpsSceneHelper = (): Scene => {
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

    const buffer = state.view.getBuffer()
    const { width } = buffer

    const padding = 2

    const frameTime = state.time.getFrameTime()
    const fps = Math.round(1000 / frameTime)
    const fpsText = `${fps} fps (${frameTime.toFixed(1)}ms)`

    const fpsW = font.width * fpsText.length + padding * 2
    const fpsH = font.height + padding * 2
    const fpsX = width - fpsW - padding
    const fpsY = padding

    const fpsBg = createColor(0x00, 0x78, 0xd4)
    const fpsFg = createColor(0xff, 0xd7, 0x00)

    fill(buffer, fpsBg, [fpsX, fpsY, fpsW, fpsH])

    const fpsLayout = layoutTextLine(font, fpsText)

    const fpsIndices = textLayoutToIndices(
      buffer, fpsX + padding, fpsY + padding, fontPts, fpsLayout
    )

    fillIndices(fpsIndices, buffer, fpsFg)
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
