import {
  fontImageToPoints, layoutTextLine, textLayoutToIndices
} from '../lib/bmpfont/layout.js'

import { BmpFontM, FontPoints } from '../lib/bmpfont/types.js'
import { createColor } from '../lib/image/color.js'
import { fill, fillIndices } from '../lib/image/fill.js'
import { loadImage } from '../lib/image/load.js'
import { findSizeSlug, parseSizeSlug } from '../lib/slug.js'
import { createTerminal } from '../lib/term/index.js'
import { Scene, State } from '../lib/types.js'
import { assrt, assrtInt } from '../lib/util.js'

const fontPath = 'data'

const monoFontFiles = [
  'ATI_SmallW_6x8',
  'EverexME_5x8',
  'HP_100LX_6x8',
  'Portfolio_6x8',
  'TsengEVA_132_6x8',
  'IBM_EGA_8x8',
  'IBM_VGA_8x14',
  'IBM_VGA_8x16',
  'IBM_VGA_9x8',
  'IBM_VGA_9x14',
  'IBM_VGA_9x16'
] as const

type MonoFontName = typeof monoFontFiles[number]

const loadFontMono = async (name: MonoFontName) => {
  const image = await loadImage(`${fontPath}/Bm437_${name}.png`)
  const sizeSlug = assrt(findSizeSlug(name), 'Expected size slug')
  const [width, height] = parseSizeSlug(sizeSlug)

  const cols = assrtInt(image.width / width)
  const rows = assrtInt(image.height / height)

  const font: BmpFontM = {
    type: 'mono',
    width,
    height,
    leading: 0, // built into the bitmap glyphs
    image: image,
    rects: {},
    advance: 0, // built into the bitmap glyphs
    fallback: 127
  }

  for (let r = 0; r < rows; r++) {
    const rowIndex = r * cols
    for (let c = 0; c < cols; c++) {
      const charCode = rowIndex + c

      font.rects[charCode] = [c * width, r * height, width, height]
    }
  }

  return font
}

export const textSandboxScene = (): Scene => {
  const fonts = new Map<MonoFontName, BmpFontM>()
  const term = createTerminal()

  let fontIndex = 1
  let font: BmpFontM
  let fontPts: FontPoints
  let textCols: number
  let textRows: number

  let isActive = true

  const setFont = (state: State, fontIndex: number) => {
    const fontName: MonoFontName = monoFontFiles[fontIndex]

    font = assrt(fonts.get(fontName), `Expected font ${fontName}`)
    fontPts = fontImageToPoints(font)

    const vw = state.view.buffer.width - padding * 2
    const vh = state.view.buffer.height - padding * 2

    textCols = Math.floor(vw / font.width)
    textRows = Math.floor(vh / font.height)

    term.appendLine(`FONT=${fontName}`)
  }

  const resized = () => {
    term.appendLine(`TSIZE=${textCols}x${textRows}`)
  }

  const init = async (state: State) => {
    console.log('initializing text sandbox scene')

    for (const n of monoFontFiles) {
      fonts.set(n, await loadFontMono(n))
    }

    term.clear()
    term.appendLine('Text Mode Sandbox')

    fontIndex = 1

    setFont(state, fontIndex)
    resized()
  }

  const bgColor = createColor(0x1f, 0x1f, 0x1f)
  const fgColor = createColor(0x4f, 0xc1, 0xff)

  const padding = 2

  const cursorRate = 500

  const _handleKeys = (state: State) => {
    if (state.keys['Escape']) {
      state.running = false
      // consume the key
      state.keys['Escape'] = false

      return
    }

    const fState = state.keys['F1']

    if (fState) {
      fontIndex = (fontIndex + 1) % monoFontFiles.length
      state.keys['F1'] = false
      setFont(state, fontIndex)
      resized()
    }

    for (const key of state.keyPresses) {
      if (printableKeySet.has(key as PrintableKey)) {
        term.append(key)
      }

      if (key === 'Enter') {
        term.appendLine()
      }

      if (key === 'Backspace') {
        term.backspace()
        console.log('backspace')
      }
    }

    state.keyPresses = []
  }

  const update = (state: State) => {
    if (isActive) {
      // keys
      _handleKeys(state)

      // mouse

      const wheel = state.mouse.wheel

      if (wheel < 0) {
        state.view.zoom += 1
      } else if (wheel > 0) {
        state.view.zoom -= 1
      }
    }

    // draw

    fill(state.view.buffer, bgColor)

    const vw = state.view.buffer.width - padding * 2
    const vh = state.view.buffer.height - padding * 2

    const newTextCols = Math.floor(vw / font.width)
    const newTextRows = Math.floor(vh / font.height)

    if (newTextCols !== textCols || newTextRows !== textRows) {
      textCols = newTextCols
      textRows = newTextRows

      resized()
    }

    const termView = term.view(textCols, textRows)

    const isCursor = (state.time.elapsed % (cursorRate * 2)) < cursorRate

    let cursor = isCursor ? '_' : ' '

    for (let y = 0; y < termView.length; y++) {
      let line = termView[y]

      if (y === termView.length - 1) {
        line += cursor
      }

      const lineLayout = layoutTextLine(font, line)
      const dx = padding
      const dy = padding + y * font.height

      const indices = textLayoutToIndices(
        state.view.buffer, dx, dy, fontPts, lineLayout
      )

      fillIndices(indices, state.view.buffer, fgColor)
    }

    // debug

    const fps = Math.round(1000 / state.time.frameTime)
    const fpsText = `${fps} fps (${state.time.frameTime.toFixed(1)}ms)`

    const fpsW = font.width * fpsText.length + padding * 2
    const fpsH = font.height + padding * 2
    const fpsX = state.view.buffer.width - fpsW - padding
    const fpsY = padding

    const fpsBg = createColor(0x00, 0x78, 0xd4)
    const fpsFg = createColor(0xff, 0xd7, 0x00)

    fill(state.view.buffer, fpsBg, [fpsX, fpsY, fpsW, fpsH])

    const fpsLayout = layoutTextLine(font, fpsText)

    const fpsIndices = textLayoutToIndices(
      state.view.buffer, fpsX + padding, fpsY + padding, fontPts, fpsLayout
    )

    fillIndices(fpsIndices, state.view.buffer, fpsFg)
  }

  const quit = async (_state: State) => {
    console.log('quitting text sandbox scene')
  }

  const setActive = (active: boolean) => {
    isActive = active
  }

  return { init, update, quit, setActive }
}

// keyboard handling

// this subset should be fine to start with

const modifierKeys = [
  'Alt', 'AltGraph', 'CapsLock', 'Control', 'NumLock', 'ScrollLock', 'Shift'
] as const

const whitespaceKeys = [
  'Enter', 'Tab', ' '
] as const

const navigationKeys = [
  'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'End', 'Home', 'PageDown',
  'PageUp'
] as const

const editingKeys = [
  'Backspace', 'Delete', 'Insert'
] as const

// nb Escape is used by the scene to exit so we'll never be able to trap it,
// but leaving it in anyway in case things change in future
const uiKeys = [
  'Escape', 'Help', 'Pause'
] as const

const alphaKeys = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
  'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
  'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'
] as const

const numberKeys = [
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'
] as const

const symbolKeys = [
  '!', '"', '#', '$', '%', '&', '\'', '(', ')', '*', '+', ',', '-',
  '.', '/', ':', ';', '<', '=', '>', '?', '@', '[', '\\', ']', '^',
  '_', '`', '{', '|', '}', '~'
] as const

// eg keys that will be echoed to the terminal, not control or special keys
const printableKeys = [
  ...alphaKeys, ...numberKeys, ...symbolKeys, ' '
] as const

type PrintableKey = typeof printableKeys[number]

const printableKeySet = new Set(printableKeys)

const allKeys = [
  ...modifierKeys, ...whitespaceKeys, ...navigationKeys, ...editingKeys,
  ...uiKeys, ...alphaKeys, ...numberKeys, ...symbolKeys
] as const
