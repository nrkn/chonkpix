import { T3 } from '../lib/types.js'

export const generatePalette = (
  entryCount: number,
  hueRange: number, satRange: number, lightRange: number
): GeneratedPalette => {
  // reserve at least lightRange entries for greys
  const used = hueRange * satRange * lightRange + lightRange

  if (used > entryCount) {
    throw Error('Not enough entries to generate palette')
  }

  // store as rgb palette
  const size = entryCount * 3
  const data = new Uint8Array(size)

  let entryIndex = 0

  // as hue is circular, we exclude the end of the range eg [0..1)
  const hueStep = 1 / hueRange
  // skip 0 saturation as it's greyscale
  const satStep = 1 / satRange // if 3, will be 0, 0.5, 1
  // skip 0 lightness as it's black, and 1 as it's white
  const lightStep = 1 / (lightRange + 1)

  for (let h = 0; h < hueRange; h++) {
    for (let s = 0; s < satRange; s++) {
      for (let l = 0; l < lightRange; l++) {
        const index = entryIndex * 3
        const hue = hueStep * h
        const sat = satStep * (s + 1)
        const light = lightStep * (l + 1)

        const [r, g, b] = hslToRgb([hue, sat, light])

        data[index] = r
        data[index + 1] = g
        data[index + 2] = b
        entryIndex++
      }
    }
  }

  const greyRange = entryCount - entryIndex

  const greyStep = 1 / (greyRange - 1)

  // greys - produces the values we skipped in the color steps above
  for (let l = 0; l < greyRange; l++) {
    const index = entryIndex * 3

    const [r, g, b] = hslToRgb([0, 0, l * greyStep])

    data[index] = r
    data[index + 1] = g
    data[index + 2] = b

    entryIndex++
  }

  return {
    data,
    entryCount,
    hueRange,
    satRange,
    lightRange,
    greyRange
  }
}

export type GeneratedPalette = {
  data: Uint8Array
  entryCount: number
  hueRange: number
  satRange: number
  lightRange: number
  greyRange: number
}

//

export const indexOfClosestHsl = (
  palette: GeneratedPalette, hsl: T3
): number => {
  const [h0, s0, l0] = hsl
  const { hueRange, satRange, lightRange, greyRange } = palette

  const totalColorEntries = hueRange * satRange * lightRange
  const greyStartIndex = totalColorEntries

  // map hue (circular)
  let hCandidate = Math.round(h0 * hueRange)
  if (hCandidate === hueRange) hCandidate = 0
  const hIndex = hCandidate

  // map sat
  let sCandidate = Math.round(s0 * satRange)

  if (sCandidate < 1 || sCandidate > satRange) {
    // must be grey
    const greyIndexInGreys = Math.round(l0 * (greyRange - 1))

    return greyStartIndex + greyIndexInGreys
  }

  const sIndex = sCandidate - 1

  // map lightness
  let lCandidate = Math.round(l0 * (lightRange + 1))
  if (lCandidate < 1 || lCandidate > lightRange) {
    // must be grey
    const greyIndexInGreys = Math.round(l0 * (greyRange - 1))

    return greyStartIndex + greyIndexInGreys
  }
  const lIndex = lCandidate - 1

  //valid hIndex, sIndex, and lIndex; color within the ramps
  const colorIndex = (
    hIndex * (satRange * lightRange) + sIndex * lightRange + lIndex
  )

  return colorIndex
}

export const indexOfClosestRgb = (palette: GeneratedPalette, rgb: T3): number =>
  indexOfClosestHsl(palette, rgbToHsl(rgb))

//

const { min, max, round } = Math

export const hslToRgb = ([h, s, l]: T3): T3 => {
  let r: number
  let g: number
  let b: number

  if (s === 0) {
    r = g = b = l // achromatic
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q

    r = hueToRgb(p, q, h + 1 / 3)
    g = hueToRgb(p, q, h)
    b = hueToRgb(p, q, h - 1 / 3)
  }

  return [round(r * 255), round(g * 255), round(b * 255)]
}

const hueToRgb = (p: number, q: number, t: number) => {
  if (t < 0) t += 1
  if (t > 1) t -= 1
  if (t < 1 / 6) return p + (q - p) * 6 * t
  if (t < 1 / 2) return q
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6

  return p
}

export const rgbToHsl = ([r, g, b]: T3): T3 => {
  r /= 255
  g /= 255
  b /= 255

  const vmax = max(r, g, b)
  const vmin = min(r, g, b)
  let h: number
  let s: number
  let l: number

  h = l = (vmax + vmin) / 2

  if (vmax === vmin) {
    return [0, 0, l] // achromatic
  }

  const d = vmax - vmin
  s = l > 0.5 ? d / (2 - vmax - vmin) : d / (vmax + vmin)
  if (vmax === r) h = (g - b) / d + (g < b ? 6 : 0)
  if (vmax === g) h = (b - r) / d + 2
  if (vmax === b) h = (r - g) / d + 4
  h /= 6

  return [h, s, l]
}
