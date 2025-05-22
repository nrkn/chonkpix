import {
  fontImageToPoints, layoutTextLine, textLayoutToCharIndices
} from '../../../lib/bmpfont/layout.js'

import { loadFontMono, MonoFontName } from '../../../lib/bmpfont/load.js'
import { BmpFontM, FontPoints } from '../../../lib/bmpfont/types.js'
import { createColor } from '../../../lib/image/color.js'
import { fill, fillIndices } from '../../../lib/image/fill.js'
import { createTerminal } from '../../../lib/term/index.js'
import { Maybe, Scene, State } from '../../../lib/types.js'
import { maybe } from '../../../lib/util.js'

//

const _0 = 0
const _1 = 0x55
const _2 = 0xAA
const _3 = 0xFF

const _black = createColor(_0, _0, _0)
const _blue = createColor(_0, _0, _2)
const _green = createColor(_0, _2, _0)
const _cyan = createColor(_0, _2, _2)
const _red = createColor(_2, _0, _0)
const _magenta = createColor(_2, _0, _2)
const _brown = createColor(_2, _1, _0)
const _lightGray = createColor(_2, _2, _2)
const _darkGray = createColor(_1, _1, _1)
const _lightBlue = createColor(_1, _1, _3)
const _lightGreen = createColor(_1, _3, _1)
const _lightCyan = createColor(_1, _3, _3)
const _lightRed = createColor(_3, _1, _1)
const _lightMagenta = createColor(_3, _1, _3)
const _lightYellow = createColor(_3, _3, _1)
const _white = createColor(_3, _3, _3)

const cgaPalette = [
  _black, // 0
  _blue, // 1
  _green, // 2
  _cyan, // 3
  _red, // 4
  _magenta, // 5
  _brown, // 6
  _lightGray, // 7
  _darkGray, // 8
  _lightBlue, // 9
  _lightGreen, // 10
  _lightCyan, // 11
  _lightRed, // 12
  _lightMagenta, // 13
  _lightYellow, // 14
  _white // 15
]

const BLACK = 0
const BLUE = 1
const GREEN = 2
const CYAN = 3
const RED = 4
const MAGENTA = 5
const BROWN = 6
const LIGHT_GRAY = 7
const DARK_GRAY = 8
const LIGHT_BLUE = 9
const LIGHT_GREEN = 10 // a
const LIGHT_CYAN = 11 // b
const LIGHT_RED = 12 // c 
const LIGHT_MAGENTA = 13 // d
const LIGHT_YELLOW = 14 // e
const WHITE = 15 // f

//

// 4MB
const ramTestKb = 4096

const ramTestSpeedKbPerMs = 0.5

//

export const dosScene = (): Scene => {
  const padding = 2
  const cursorRate = 500

  let isActive = false
  let font: Maybe<BmpFontM>
  let fontPts: Maybe<FontPoints>
  let textCols = 0
  let textRows = 0

  let bg = BLACK
  let fg = LIGHT_GRAY

  let ramTestedKb = 0

  const ramTestWidth = String(ramTestKb).length

  const term = createTerminal()

  const setFont = async (state: State, fontName: MonoFontName) => {
    font = await loadFontMono(fontName)
    fontPts = fontImageToPoints(font)

    const buffer = state.view.getBuffer()

    const vw = buffer.width - padding * 2
    const vh = buffer.height - padding * 2

    textCols = Math.floor(vw / font.width)
    textRows = Math.floor(vh / font.height)
  }

  const init = async (state: State) => {
    isActive = true

    state.view.setZoom(3)

    await setFont(state, 'IBM_VGA_8x14')

    term.clear()
    // line 0
    term.appendLine(
      '`c\x20\x1e\x20  `fAvalon   `7Released: 12/01/93'
    )
    // line 1
    term.appendLine(
      '`c\x1f\x20\x1f `fMastadon  `7AMCBIOS (C)1993 Avalon Mastadon Corp.,'
    )
    // line 2
    term.appendLine('UC666C')
    // line 3
    term.appendLine()
    // line 4
    const messageRam = String(ramTestedKb | 0).padStart(ramTestWidth, ' ')
    term.appendLine(`${messageRam}KB OK`)
  }

  const resized = () => {
    console.log(`TSIZE=${textCols}x${textRows}`)
  }

  const update = (state: State) => {
    if (!isActive) return

    if (!maybe(font)) throw Error('Font not loaded')
    if (!maybe(fontPts)) throw Error('Font points not loaded')

    if (ramTestedKb < ramTestKb) {
      const thisFrame = ramTestSpeedKbPerMs * state.time.getFrameTime()

      ramTestedKb = Math.min(ramTestedKb + thisFrame, ramTestKb)

      const messageRam = String(ramTestedKb | 0).padStart(ramTestWidth, ' ')
      term.updateLine(4, `${messageRam}KB OK`)

      if (ramTestedKb >= ramTestKb) {
        term.appendLine()
        term.appendLine('WAIT...')
      }
    }

    const buffer = state.view.getBuffer()

    fill(buffer, cgaPalette[bg])

    const vw = buffer.width - padding * 2
    const vh = buffer.height - padding * 2

    const newTextCols = Math.floor(vw / font.width)
    const newTextRows = Math.floor(vh / font.height)

    if (newTextCols !== textCols || newTextRows !== textRows) {
      textCols = newTextCols
      textRows = newTextRows

      resized()
    }

    const termView = term.view(textCols, textRows)

    const isCursor = (state.time.getElapsed() % (cursorRate * 2)) < cursorRate

    let cursor = isCursor ? '_' : ' '

    for (let y = 0; y < termView.length; y++) {
      let rawLine = termView[y]

      const cc = handleColorCodes(rawLine)

      let line = cc.clean

      if (y === termView.length - 1) {
        line += cursor
      }

      // lay out the version with color codes removed
      const lineLayout = layoutTextLine(font, line)
      const dx = padding
      const dy = padding + y * font.height

      const indices = textLayoutToCharIndices(
        buffer, dx, dy, fontPts, lineLayout
      )

      for (let i = 0; i < indices.length; i++) {
        const ch = indices[i]
        const code = cc.codes[i]

        if (maybe(code)) {
          fg = code
        }

        fillIndices(ch, buffer, cgaPalette[fg])
      }
    }
  }

  const quit = async (_state: State) => {
    isActive = false
  }

  const setActive = (active: boolean) => {
    isActive = active
  }

  return { init, update, quit, setActive }
}

// a color code is like eg `c or `C or `2 etc.  
// `` is an escaped backtick, so a single backtick is emitted
const handleColorCodes = (line: string) => {
  const codes: (number | null)[] = []
  let clean = ''
  let currentCode: number | null = null

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]

    if (ch === '`') {
      const next = line[i + 1]

      // `` escaped backtick
      if (next === '`') {
        clean += '`'
        codes.push(currentCode)
        i++            // swallow second `
        continue
      }

      // `c, `F, `2 etc change colour
      if (next !== undefined && /[0-9a-fA-F]/.test(next)) {
        currentCode = parseInt(next, 16)
        i++            // swallow color
        continue
      }

      // single ` falls through
    }

    // ordinary character
    clean += ch
    codes.push(currentCode)
  }

  return { clean, codes }
}