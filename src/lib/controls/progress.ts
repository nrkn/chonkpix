import { createColor } from '../image/color.js'
import { fill } from '../image/fill.js'
import { T4 } from '../types.js'
import { wait } from '../util.js'

export const progressControl = (
  buffer: ImageData,
  total: number,
  [px, py, pw, ph]: T4,
  bg = createColor(0x66, 0x66, 0x66),
  fg = createColor(0x33, 0x99, 0xff)
) => {
  const step = pw / total

  return async (i: number) => {
    fill(
      buffer,
      bg,
      [px, py, pw, ph]
    )

    const width = Math.round(step * i)

    fill(
      buffer,
      fg,
      [px, pw, width, ph]
    )

    await wait()
  }
}