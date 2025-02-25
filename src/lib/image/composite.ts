import { T6 } from '../types.js'
import { clampTransfer } from './util.js'

// composite normal/over 
// todo - other blend modes (see our rgba-image library for implementation)
export const composite = (
  src: ImageData, dest: ImageData,
  transfer: T6 = [
    0, 0, src.width, src.height, 0, 0
  ],
  scaleAlpha = 1
) => {
  const [sx, sy, sw, sh, dx, dy] = clampTransfer(
    src.width, src.height, dest.width, dest.height, transfer
  )

  for (let j = 0; j < sh; j++) {
    const srcY = j + sy
    const destY = j + dy

    const srcRow = srcY * src.width
    const destRow = destY * dest.width

    for (let i = 0; i < sw; i++) {
      const srcX = i + sx
      const destX = i + dx

      const srcIndex = (srcRow + srcX) * 4
      const destIndex = (destRow + destX) * 4

      const srcR = src.data[srcIndex]
      const srcG = src.data[srcIndex + 1]
      const srcB = src.data[srcIndex + 2]
      const srcA = src.data[srcIndex + 3]

      const destR = dest.data[destIndex]
      const destG = dest.data[destIndex + 1]
      const destB = dest.data[destIndex + 2]
      const destA = dest.data[destIndex + 3]

      const alpha = srcA / 255 * scaleAlpha

      dest.data[destIndex] = srcR * alpha + destR * (1 - alpha)
      dest.data[destIndex + 1] = srcG * alpha + destG * (1 - alpha)
      dest.data[destIndex + 2] = srcB * alpha + destB * (1 - alpha)
      dest.data[destIndex + 3] = srcA + destA * (1 - alpha)
    }
  }

  return dest
}
