import { T3, T4, T5 } from '../types.js'
import { lerp } from '../util.js'

export const createColor = (r: number, g: number, b: number, a = 255) =>
  (a << 24) | (b << 16) | (g << 8) | r

export const colorToRgba = (color: number): T4 => [
  color & 0xFF, (color >> 8) & 0xFF, (color >> 16) & 0xFF, color >>> 24
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