import { T4 } from '../types.js'
import { fillCol, fillRow } from './fill.js'

export const strokeRect = (dest: ImageData, rect: T4, color: number) => {
  const [x0, y0, w, h] = rect

  const x1 = x0 + w - 1
  const y1 = y0 + h - 1
  const y2 = y0 + 1
  const y3 = y1 - 1

  fillRow(dest, color, y0, x0, x1)
  fillRow(dest, color, y1, x0, x1)

  fillCol(dest, color, x0, y2, y3)
  fillCol(dest, color, x1, y2, y3)
}