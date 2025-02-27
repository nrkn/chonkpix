import { T4 } from '../types.js'
import { clampRect } from './util.js'

// nearest neighbor scaling
export const resize = (
  src: ImageData, dest: ImageData,
  srcRect: T4 = [0, 0, src.width, src.height],
  destRect: T4 = [0, 0, dest.width, dest.height]
) => {
  const [sx, sy, sw, sh] = clampRect(src.width, src.height, srcRect)
  const [dx, dy, dw, dh] = clampRect(dest.width, dest.height, destRect)

  const scaleW = sw / dw
  const scaleH = sh / dh

  const srcData = new Uint32Array(src.data.buffer)
  const destData = new Uint32Array(dest.data.buffer)

  for (let y = 0; y < dh; y++) {
    const srcY = Math.floor(y * scaleH) + sy

    for (let x = 0; x < dw; x++) {
      const srcX = Math.floor(x * scaleW) + sx

      const srcIndex = srcY * src.width + srcX
      const destIndex = (y + dy) * dest.width + (x + dx)

      destData[destIndex] = srcData[srcIndex]
    }
  }

  return dest
}