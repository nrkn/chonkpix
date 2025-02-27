import { T4 } from '../types.js'
import { blit } from './blit.js'
import { createImage } from './create.js'
import { clampRect } from './util.js'

export const copy = (src: ImageData, rect: T4): ImageData => {
  const [x, y, w, h] = clampRect(src.width, src.height, rect)

  return blit(src, createImage(w, h), [x, y, w, h, 0, 0])
}
