import { bresenhamLine } from '../../lib/image/bresenham.js'
import { createColor, hslToRgb } from '../../lib/image/color.js'
import { clampTransfer } from '../../lib/image/util.js'
import { debugTextSceneHelper } from '../../lib/scene/debug-text.js'
import { exitOnEscape, zoomOnWheel } from '../../lib/scene/io.js'
import { Maybe, Scene, State, T2, T3, T4, T6 } from '../../lib/types.js'
import { maybe } from '../../lib/util.js'

type PMode = 'paint' | 'fill'

export const hslScene = (): Scene => {
  let isActive = false
  let debugHelper: Maybe<Scene>
  let lastW = 0
  let lastH = 0
  let hsla16: Maybe<Hsla16>
  let selectedColor = hmidgrey
  let drawRect: T4 = [0, 0, 0, 0]
  // x, y, hsla color
  let paintPts: T3[] = []
  let pmode: PMode = 'paint'

  let lastMx: Maybe<number> = null
  let lastMy: Maybe<number> = null
  let lastMb = false

  let debugText: string[] = []

  const init = async (state: State) => {
    debugHelper = debugTextSceneHelper(() => debugText)

    await debugHelper.init(state)

    paintPts = []

    isActive = true
  }

  const onResize = () => {
    hsla16 = createHsla16(lastW, lastH)
  }

  const io = (state: State) => {
    if (exitOnEscape(state)) return

    if (zoomOnWheel(state)) {
      lastW = 0
      lastH = 0
    }

    const keys = state.getKeyPresses()

    for (let i = 0; i < keys.length; i++) {
      const lkey = keys[i].toLowerCase()

      if (lkey === 'p') {
        pmode = 'paint'
      }

      if (lkey === 'f') {
        pmode = 'fill'
      }
    }

    keys.length = 0

    if (!maybe(hsla16)) return

    const mbuts = state.mouse.getButtons()
    const mx = state.mouse.getX()
    const my = state.mouse.getY()

    const [rx, ry, rw, rh] = drawRect

    const inDrawRect = (
      mx >= rx && mx < rx + rw &&
      my >= ry && my < ry + rh
    )

    if (mbuts[0]) {
      if (inDrawRect) {
        if (pmode === 'paint') {
          if (!maybe(lastMx) || !maybe(lastMy)) {
            paintPts.push([mx - rx, my - ry, selectedColor])
          } else {
            const line = bresenhamLine(lastMx, lastMy, mx, my)

            for (let l = 0; l < line.length; l++) {
              const [lx, ly] = line[l]

              paintPts.push([lx - rx, ly - ry, selectedColor])
            }
          }

          lastMx = mx
          lastMy = my
        } else {
          lastMx = null
          lastMy = null
        }
      } else {
        const index = my * hsla16.width + mx

        selectedColor = hsla16.data[index]
      }

      lastMb = true
    } else {
      lastMx = null
      lastMy = null

      if (lastMb && pmode === 'fill') {
        const fillPts = floodFill(hsla16, selectedColor, mx, my)

        for (let i = 0; i < fillPts.length; i++) {
          const [fx, fy, fh] = fillPts[i]

          paintPts.push([fx - rx, fy - ry, fh])
        }
      }

      lastMb = false
    }
  }

  const update = (state: State) => {
    if (!maybe(debugHelper)) throw Error('debugHelper not initialized')

    if (isActive) io(state)

    const buffer = state.view.getBuffer()
    const { width, height } = buffer

    if (width !== lastW || height !== lastH) {
      lastW = width
      lastH = height
      onResize()
    }

    // draw to hsl buffer

    if (!maybe(hsla16)) throw Error('hsla16 not initialized')

    hsla16.data.fill(selectedColor)

    const padding = 1
    const cellW = 16
    const cellH = 16
    const advX = cellW + padding
    const advY = cellH + padding

    let dx = padding
    let dy = padding

    for (let h = 0; h < 16; h++) {
      //

      for (let s = 0; s < 16; s++) {
        const destY = s + dy
        const rowStart = destY * hsla16.width

        for (let l = 0; l < 16; l++) {
          const destX = l + dx
          const index = destX + rowStart

          const color = createHslaColor(h, s, l)

          hsla16.data[index] = color
        }
      }

      //

      dy += advY

      const remY = height - dy

      if (remY < cellH) {
        dy = padding
        dx += advX

        const remX = width - dx

        if (remX < cellW) break
      }
    }

    dx += advX

    const rightX = dx
    const rightY = padding
    const rightW = width - dx - padding
    const rightH = height - padding * 2

    for (let ry = 0; ry < rightH; ry++) {
      const rectY = ry + rightY
      const rowStart = rectY * hsla16.width

      for (let rx = 0; rx < rightW; rx++) {
        const rectX = rx + rightX
        const index = rectX + rowStart

        hsla16.data[index] = hblack
      }
    }

    drawRect = [rightX, rightY, rightW, rightH]

    for (let i = 0; i < paintPts.length; i++) {
      const [px, py, ph] = paintPts[i]

      const rectX = rightX + px
      const rectY = rightY + py

      if (rectX < 0 || rectX >= width || rectY < 0 || rectY >= height) continue

      const index = rectY * hsla16.width + rectX

      hsla16.data[index] = ph
    }

    //

    blitHsla(hsla16, buffer)

    //

    const frameTime = state.time.getFrameTime()
    const fps = Math.round(1000 / frameTime)
    const fpsText = `${fps} fps (${frameTime.toFixed(1)}ms)`

    debugText = [fpsText, pmode]

    debugHelper.update(state)
  }

  const quit = async (state: State) => {
    isActive = false
  }

  const setActive = (active: boolean) => {
    isActive = active
  }

  return { init, update, quit, setActive }
}

type Hsla16 = {
  width: number
  height: number
  data: Uint16Array
}

const hMask = 0b1111000000000000
const sMask = 0b0000111100000000
const lMask = 0b0000000011110000
const aMask = 0b0000000000001111

const createHslaColor = (h: number, s: number, l: number, a = 15): number =>
  (h << 12) | (s << 8) | (l << 4) | a


//

const hwhite = createHslaColor(0, 0, 15)
const hmidgrey = createHslaColor(0, 0, 8)
const hblack = createHslaColor(0, 0, 0)

//

const hslaColorToTuple = (color: number): T4 => [
  (color & hMask) >> 12,
  (color & sMask) >> 8,
  (color & lMask) >> 4,
  color & aMask
]

const createHsla16 = (width: number, height: number): Hsla16 => {
  const size = width * height
  const data = new Uint16Array(size)

  return { width, height, data }
}

const totalHsla = 16 ** 4

const hslaToRgbaLut = new Uint32Array(totalHsla)

for (let i = 0; i < totalHsla; i++) {
  let [h, s, l, a] = hslaColorToTuple(i)

  h /= 15
  s /= 15
  l /= 15
  a *= 17 // /= 15 * 255

  const [r, g, b] = hslToRgb([h, s, l])

  const rgbaColor = createColor(r, g, b, a)

  hslaToRgbaLut[i] = rgbaColor
}

const blitHsla = (
  src: Hsla16, dest: ImageData,
  transfer: T6 = [0, 0, src.width, src.height, 0, 0]
) => {
  const [sx, sy, sw, sh, dx, dy] = clampTransfer(
    src.width, src.height, dest.width, dest.height, transfer
  )

  const destView = new Uint32Array(dest.data.buffer)

  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const srcIndex = x + sx + (y + sy) * src.width
      const destIndex = x + dx + (y + dy) * dest.width

      const hslaColor = src.data[srcIndex]
      const rgbaColor = hslaToRgbaLut[hslaColor]

      destView[destIndex] = rgbaColor
    }
  }

  return dest
}

const floodFill = (dest: Hsla16, color: number, x: number, y: number) => {
  const pts: T3[] = []
  const seen = new Set<number>()

  if (x < 0 || x >= dest.width || y < 0 || y >= dest.height) return pts

  const index = y * dest.width + x

  const oldColor = dest.data[index]

  if (oldColor === color) return pts

  const queue: T2[] = []

  queue.push([x, y])

  while (queue.length > 0) {
    const [cx, cy] = queue.shift()!

    if (cx < 0 || cx >= dest.width || cy < 0 || cy >= dest.height) continue

    const index = cy * dest.width + cx

    if (seen.has(index)) continue
    if (dest.data[index] !== oldColor) continue

    pts.push([cx, cy, color])
    seen.add(index)

    queue.push([cx, cy - 1])
    queue.push([cx + 1, cy])
    queue.push([cx, cy + 1])
    queue.push([cx - 1, cy])
  }

  return pts
}