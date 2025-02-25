import { Maybe, T2, T3, T4 } from '../types.js'

export type BmpFontBase = {
  width: number // width of the glyphs - for proportional fonts, this is the default width if not found in widths
  height: number // height of the glyphs
  leading: number // added to the height of the glyphs for line height
  image: ImageData // the image containing the glyphs
  rects: Record<number, Maybe<T4>> // location of each glyph in the image
  advance: number // space between each glyph
  fallback: number // glyph to use when a character is not found
}

export type BmpFontM = {
  type: 'mono'
} & BmpFontBase

type OptNumMap = Record<number, Maybe<number>>
type Kerning = Record<number, Maybe<OptNumMap>>

export type BmpFontP = {
  type: 'proportional'
  widths: OptNumMap // width of each glyph
  kerning: Kerning // kerning between each pair of glyphs
} & BmpFontBase

export type BmpFont = BmpFontM | BmpFontP

// [ charCode: number, x: number, y: number ]
export type BmpLayout = T3[]

export type FontPoints = Record<number, Maybe<T2[]>>