import { T3, T4, T5 } from '../types.js'
import { lerp } from '../util.js'

export const createColor = (r: number, g = r, b = r, a = 255) =>
  (a << 24) | (b << 16) | (g << 8) | r

export const createColor24 = (r: number, g = r, b = r) =>
  (b << 16) | (g << 8) | r

export const colorToRgba = (color: number): T4 => [
  color & 0xFF, (color >> 8) & 0xFF, (color >> 16) & 0xFF, color >>> 24
]

export const colorToRgb = (color: number): T3 => [
  color & 0xFF, (color >> 8) & 0xFF, (color >> 16) & 0xFF
]

export const generateHues = (count: number, v = 100) => {
  const colors = Array<number>(count)

  const hueStep = 360 / (count + 1)

  for (let i = 0; i < count; i++) {
    const hue = i * hueStep

    colors[i] = createColor(...hsvToRgb(hue, 100, v))
  }

  return colors
}

// range is 0-360, s and v are 0-100
export const hsvToRgb = (h: number, s: number, v: number): T3 => {
  const sFloat = s / 100
  const vFloat = v / 100

  const i = Math.floor(h / 60) % 6
  const f = h / 60 - i

  const p = vFloat * (1 - sFloat)
  const q = vFloat * (1 - f * sFloat)
  const t = vFloat * (1 - (1 - f) * sFloat)

  let rFloat = 0, gFloat = 0, bFloat = 0

  switch (i) {
    case 0: rFloat = vFloat; gFloat = t; bFloat = p; break
    case 1: rFloat = q; gFloat = vFloat; bFloat = p; break
    case 2: rFloat = p; gFloat = vFloat; bFloat = t; break
    case 3: rFloat = p; gFloat = q; bFloat = vFloat; break
    case 4: rFloat = t; gFloat = p; bFloat = vFloat; break
    case 5: rFloat = vFloat; gFloat = p; bFloat = q; break
  }

  const r = Math.round(rFloat * 255)
  const g = Math.round(gFloat * 255)
  const b = Math.round(bFloat * 255)

  return [r, g, b]
}

export const createColorStop = (
  r: number, g: number, b: number, a: number,
  // 0 is start, 1 is end
  stop: number
): T5 => [r, g, b, a, stop]

export const stopToRgba = (stop: T5) => stop.slice(0, 4) as T4

const AT_I = 4

export const sampleGradient = (stops: T5[], at: number): T4 => {
  if (stops.length === 0) throw Error('No stops in gradient')

  if (stops.length === 1) return stopToRgba(stops[0])

  let leftIndex = -1
  let rightIndex = -1
  let maxLeft = -Infinity
  let minRight = Infinity

  for (let i = 0; i < stops.length; i++) {
    const stopAt = stops[i][AT_I]

    if (stopAt === at) return stopToRgba(stops[i])

    if (stopAt < at && stopAt > maxLeft) {
      maxLeft = stopAt
      leftIndex = i
    }

    if (stopAt > at && stopAt < minRight) {
      minRight = stopAt
      rightIndex = i
    }
  }

  if (leftIndex === -1 && rightIndex >= 0) {
    return stopToRgba(stops[rightIndex])
  }

  if (rightIndex === -1 && leftIndex >= 0) {
    return stopToRgba(stops[leftIndex])
  }

  const left = stops[leftIndex]
  const right = stops[rightIndex]

  const range = right[AT_I] - left[AT_I]

  if (range === 0) return stopToRgba(left)

  const t = (at - left[AT_I]) / range

  return [
    lerp(left[0], right[0], t),
    lerp(left[1], right[1], t),
    lerp(left[2], right[2], t),
    lerp(left[3], right[3], t)
  ]
}

// [ 0..255, 0..255, 0..255] -> [ 0..1, 0..1, 0..1]
export const rgbToHsl = ([r, g, b]: T3): T3 => {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)

  let h = 0
  let s = 0
  let l = (max + min) / 2

  if (max == min) {
    h = s = 0
  } else {
    const d = max - min

    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }

    h /= 6
  }

  return [h, s, l]
}

// [ 0..1, 0..1, 0..1] -> [ 0..255, 0..255, 0..255]
export const hslToRgb = ([h, s, l]: T3): T3 => {
  let r = 0
  let g = 0
  let b = 0

  if (s == 0) {
    r = g = b = l // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6

      return p
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q

    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }

  r *= 255
  g *= 255
  b *= 255

  return [r | 0, g | 0, b | 0]
}