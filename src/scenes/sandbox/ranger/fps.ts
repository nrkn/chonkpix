import {
  layoutTextLine, textLayoutToIndices
} from '../../../lib/bmpfont/layout.js'

import { BmpFontM, FontPoints } from '../../../lib/bmpfont/types.js'
import { createColor } from '../../../lib/image/color.js'
import { fill, fillIndices } from '../../../lib/image/fill.js'
import { State } from '../../../lib/types.js'

export const drawFps = (
  state: State, font: BmpFontM, width: number, buffer: ImageData,
  fontPts: FontPoints
) => {
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
