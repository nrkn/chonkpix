import { T4 } from '../types.js'
import { clampRect } from './util.js'

export const pointResize = (
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

export const bilinearResize = (
  src: ImageData,
  dest: ImageData,
  srcRect: [number, number, number, number] = [0, 0, src.width, src.height],
  destRect: [number, number, number, number] = [0, 0, dest.width, dest.height]
) => {
  const [sx, sy, sw, sh] = clampRect(src.width, src.height, srcRect)
  const [dx, dy, dw, dh] = clampRect(dest.width, dest.height, destRect)

  const srcData = new Uint32Array(src.data.buffer)
  const destData = new Uint32Array(dest.data.buffer)

  const scaleW = sw / dw
  const scaleH = sh / dh

  const getPixel = (x: number, y: number) => {
    x = Math.max(0, Math.min(src.width - 1, x))
    y = Math.max(0, Math.min(src.height - 1, y))

    return srcData[y * src.width + x]
  }

  for (let y = 0; y < dh; y++) {
    const srcY = (y + 0.5) * scaleH - 0.5 + sy

    const y0 = Math.floor(srcY)
    const yFrac = srcY - y0
    const y1 = y0 + 1

    for (let x = 0; x < dw; x++) {
      const srcX = (x + 0.5) * scaleW - 0.5 + sx

      const x0 = Math.floor(srcX)
      const xFrac = srcX - x0
      const x1 = x0 + 1

      const c00 = getPixel(x0, y0)
      const c10 = getPixel(x1, y0)
      const c01 = getPixel(x0, y1)
      const c11 = getPixel(x1, y1)

      const r00 = c00 & 0xff
      const g00 = (c00 >> 8) & 0xff
      const b00 = (c00 >> 16) & 0xff
      const a00 = (c00 >> 24) & 0xff

      const r10 = c10 & 0xff
      const g10 = (c10 >> 8) & 0xff
      const b10 = (c10 >> 16) & 0xff
      const a10 = (c10 >> 24) & 0xff

      const r01 = c01 & 0xff
      const g01 = (c01 >> 8) & 0xff
      const b01 = (c01 >> 16) & 0xff
      const a01 = (c01 >> 24) & 0xff

      const r11 = c11 & 0xff
      const g11 = (c11 >> 8) & 0xff
      const b11 = (c11 >> 16) & 0xff
      const a11 = (c11 >> 24) & 0xff

      const r = Math.round(
        r00 * (1 - xFrac) * (1 - yFrac) +
        r10 * (xFrac) * (1 - yFrac) +
        r01 * (1 - xFrac) * (yFrac) +
        r11 * (xFrac) * (yFrac)
      )

      const g = Math.round(
        g00 * (1 - xFrac) * (1 - yFrac) +
        g10 * (xFrac) * (1 - yFrac) +
        g01 * (1 - xFrac) * (yFrac) +
        g11 * (xFrac) * (yFrac)
      )

      const b = Math.round(
        b00 * (1 - xFrac) * (1 - yFrac) +
        b10 * (xFrac) * (1 - yFrac) +
        b01 * (1 - xFrac) * (yFrac) +
        b11 * (xFrac) * (yFrac)
      )

      const a = Math.round(
        a00 * (1 - xFrac) * (1 - yFrac) +
        a10 * (xFrac) * (1 - yFrac) +
        a01 * (1 - xFrac) * (yFrac) +
        a11 * (xFrac) * (yFrac)
      )

      const rgba =
        (a << 24) |
        (b << 16) |
        (g << 8) |
        (r)

      const destIndex = (y + dy) * dest.width + (x + dx)

      destData[destIndex] = rgba
    }
  }

  return dest
}
