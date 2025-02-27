import { lineToRows, rectToRows, triangleToRows } from '../lib/image/rows.js'
import { polygonTriangles } from '../sandbox/util.js'
import { takeMouse, releaseMouse } from '../lib/engine.js'
import { blit, blitRows } from '../lib/image/blit.js'
import { bresenhamLine } from '../lib/image/bresenham.js'
import {
  colorToRgba, createColor, generateHues, sampleGradient
} from '../lib/image/color.js'
import { composite } from '../lib/image/composite.js'
import { fill, fillCol, fillIndices, fillRows } from '../lib/image/fill.js'
import { loadImage } from '../lib/image/load.js'
import { drawRotated } from '../lib/image/rotate.js'
import { pointsToIndices } from '../lib/image/util.js'
import { Maybe, Scene, State, T2, T3, T4, T5 } from '../lib/types.js'
import {
  generateGridLayout, generateNamedGridLayout
} from '../lib/grid/index.js'
import { Row } from '../lib/image/types.js'
import { rowQuery } from '../lib/image/query.js'
import { createImage } from '../lib/image/create.js'
import { limitedLogger, maybe } from '../lib/util.js'

const readAlpha = (state: State, ch: string, destroy = false) => {
  const upper = ch.toUpperCase()
  const lower = ch.toLowerCase()

  const keys = state.getKeys()

  const alpha = keys[upper] ? upper : keys[lower] ? lower : null

  if (destroy && alpha) {
    keys[alpha] = false
  }

  return alpha
}

export const debugScene = (): Scene => {
  let testImg0: ImageData
  let pattern0: ImageData
  let cursor: ImageData

  let pattern0Rows: Row<never>[]
  const patternColors = generateHues(8)
  const patternColorImage = createImage(8, 8)

  for (let x = 0; x < 8; x++) {
    const color = patternColors[x]

    fillCol(patternColorImage, color, x)
  }

  const minPolySides = 3
  const maxPolySides = 128

  // enough for one run through, then stop logging, otherwise we flood console
  // calling *every* frame
  const gradientLogger = limitedLogger(32)

  let polySides = 5
  let polyRotation = 0
  let strokePoly = false

  let isActive = true

  const init = async (_state: State) => {
    console.log('starting debug scene')

    testImg0 = await loadImage('scenes/debug/test-0.png')
    pattern0 = await loadImage('scenes/debug/pattern-0.png')
    cursor = await loadImage('scenes/debug/cursor.png')

    polyRotation = 0

    pattern0Rows = rowQuery(pattern0, r => r === 0)

    console.log('pattern0Rows', pattern0Rows)

    takeMouse()
  }

  const bgColor0: T3 = [0x33, 0x99, 0xff]
  const bgColor1: T3 = [0x11, 0x77, 0xdd]

  const paintColor: T3 = [0xff, 0x88, 0x00]
  let painting = false
  let lastPaintX: Maybe<number> = null
  let lastPaintY: Maybe<number> = null

  // nb - these are retained even when the scene exits and restarts
  // as a test for scenes holding state between runs
  //
  // if this is not desired, state should be reset in init or quit on each run
  //
  const paintPts: Record<number, Maybe<Record<number, Maybe<boolean>>>> = {}

  const getPaintRow = (y: number) => (paintPts[y] || (paintPts[y] = {}))

  const addPaintPt = (x: number, y: number) => {
    // you get gaps if you move the mouse quickly, so interpolate between last 
    // point and this point
    if (maybe(lastPaintX) && maybe(lastPaintY)) {
      const line = bresenhamLine(lastPaintX, lastPaintY, x, y)

      for (const [x, y] of line) {
        getPaintRow(y)[x] = true
      }
    } else {
      getPaintRow(y)[x] = true
    }

    lastPaintX = x
    lastPaintY = y
  }

  let frame = 0

  const _handleKeys = (state: State) => {
    const keys = state.getKeys()

    if (keys['Escape']) {
      state.setRunning(false)

      // consume the key
      keys['Escape'] = false

      return
    }

    if (keys['ArrowUp']) {
      polySides--

      keys['ArrowUp'] = false
    }

    if (keys['ArrowDown']) {
      polySides++

      keys['ArrowDown'] = false
    }

    const sState = readAlpha(state, 'S', true)

    if (sState) {
      strokePoly = !strokePoly
    }
  }

  const update = (state: State) => {
    if (isActive) {
      _handleKeys(state)

      polySides = Math.min(Math.max(polySides, minPolySides), maxPolySides)

      // capture a reference - it is a destructive read
      const wheel = state.mouse.takeWheel()
      const zoom = state.view.getZoom()

      if (wheel < 0) {
        state.view.setZoom( zoom + 1 )
      } else if (wheel > 0) {
        state.view.setZoom( zoom - 1 )
      }

      // maybe paint
      if (state.mouse.getButtons()[0]) {
        addPaintPt(state.mouse.getX(), state.mouse.getY())
        painting = true
      } else if (painting) {
        painting = false
        lastPaintX = null
        lastPaintY = null
      }
    }

    const buffer = state.view.getBuffer()
    const { width, height } = buffer

    // not very efficent - plenty of faster ways to do this - but that's a good
    // thing, we're trying to stuff as much into the debug scene as possible
    // so we can give it a bit of a stress test
    //
    // even with everything we're doing still comfortably runs at 60fps tho!

    for (let y = 0; y < height; y++) {
      const row = y * width

      for (let x = 0; x < width; x++) {
        const index = row + x
        const dataIndex = index * 4

        const isPaint = paintPts[y] && paintPts[y]![x]

        if (isPaint) {
          buffer.data[dataIndex] = paintColor[0]
          buffer.data[dataIndex + 1] = paintColor[1]
          buffer.data[dataIndex + 2] = paintColor[2]
          buffer.data[dataIndex + 3] = 0xff

          continue
        }

        const isCheck = (x + y) % 2 === 0

        buffer.data[dataIndex] = isCheck ? bgColor0[0] : bgColor1[0]
        buffer.data[dataIndex + 1] = isCheck ? bgColor0[1] : bgColor1[1]
        buffer.data[dataIndex + 2] = isCheck ? bgColor0[2] : bgColor1[2]
        buffer.data[dataIndex + 3] = 0xff
      }
    }

    // sprites, blitting, composite etc

    // a0..b7    
    const testGrid = generateNamedGridLayout(
      generateGridLayout(32, 32, 2, 8, 1, 1)
    )

    const { width: gw } = testGrid

    const offX = width - gw
    const offY = 0

    // straight blit

    const { a0 } = testGrid
    const a0X = a0[0] + offX
    const a0Y = a0[1] + offY

    blit(testImg0, buffer, [0, 0, testImg0.width, testImg0.height, a0X, a0Y])

    // testing oob on src

    const { b0 } = testGrid
    const b0X = b0[0] + offX - 16
    const b0Y = b0[1] + offY - 16

    blit(
      testImg0, buffer,
      [
        -16, -16, testImg0.width + 32, testImg0.height + 32,
        b0X, b0Y
      ]
    )

    // alpha composite

    const { a1 } = testGrid
    const a1X = a1[0] + offX
    const a1Y = a1[1] + offY

    composite(
      testImg0, buffer, [0, 0, testImg0.width, testImg0.height, a1X, a1Y], 0.5
    )

    // oob on dest

    const { b1 } = testGrid
    const b1X = b1[0] + offX + 16
    const b1Y = b1[1] + offY

    blit(
      testImg0, buffer,
      [
        0, 0, testImg0.width, testImg0.height,
        b1X, b1Y
      ]
    )

    // color fill

    const { a2 } = testGrid
    const a2X = a2[0] + offX
    const a2Y = a2[1] + offY

    const color = createColor(0x6c, 0x28, 0xbc)

    fill(
      buffer, color,
      [a2X, a2Y, testImg0.width, testImg0.height]
    )

    // sprite rotation

    const { b2 } = testGrid
    const b2X = b2[0] + offX + testImg0.width / 2
    const b2Y = b2[1] + offY + testImg0.height / 2

    drawRotated(
      testImg0, testImg0.width / 2, testImg0.height / 2,
      buffer, b2X, b2Y,
      polyRotation
    )

    // blitRows test

    const { a3 } = testGrid
    const a3X = a3[0] + offX
    const a3Y = a3[1] + offY

    fill(buffer, createColor(0, 0, 0), [a3X, a3Y, pattern0.width, pattern0.height])

    blitRows(
      patternColorImage, pattern0Rows, buffer, a3X, a3Y
    )

    // gradient test

    const { b3 } = testGrid
    const b3X = b3[0] + offX
    const b3Y = b3[1] + offY

    const gColors0 = generateHues(6)

    const step0 = 1 / (gColors0.length - 1)

    const gStops0 = gColors0.map((c, i) => {
      const rgba = colorToRgba(c)

      return [...rgba, i * step0] as T5
    })

    const gImage0 = createImage(32, 32)

    for (let x = 0; x < gImage0.width; x++) {
      const at = x / (gImage0.width - 1)
      const rgba = sampleGradient(gStops0, at)
      const color = createColor(...rgba)

      fillCol(gImage0, color, x)
    }

    blit(gImage0, buffer, [0, 0, gImage0.width, gImage0.height, b3X, b3Y])

    // gradient test 2, alpha + composite

    const { a4 } = testGrid
    const a4X = a4[0] + offX
    const a4Y = a4[1] + offY

    const gColors1 = gColors0.slice().reverse()

    const step1 = 1 / (gColors1.length - 1)

    const gstops1 = gColors1.map((c, i) => {
      const [r, g, b] = colorToRgba(c)
      const a = i * step1 * 255

      return [r, g, b, a, i * step1] as T5
    })

    const gImage1 = createImage(32, 32)

    for (let x = 0; x < gImage1.width; x++) {
      const at = x / (gImage1.width - 1)
      const rgba = sampleGradient(gstops1, at)
      const color = createColor(...rgba)

      gradientLogger.log('gradient', x, rgba)

      fillCol(gImage1, color, x)
    }

    composite(
      gImage1, buffer, [0, 0, gImage1.width, gImage1.height, a4X, a4Y]
    )

    // horizontally sloping line

    const testLineColor = createColor(0x33, 0xff, 0x99)

    const testLine: T4 = [-32, height / 2 - 32, width + 32, height / 2 + 32]

    // nb - this is only faster with the right slope - otherwise it is slower
    // it is better to use bresenham for the general case
    const testLineRows = lineToRows(...testLine)

    fillRows(testLineRows, buffer, testLineColor)

    // rect via rows

    const rectColor = createColor(0xff, 0x99, 0x33)

    const testRect: T4 = [48, 48, 32, 24]
    const testRectRows = rectToRows(...testRect)

    fillRows(testRectRows, buffer, rectColor)

    // polygon

    const minSide = Math.min(width, height)
    const fillColors = generateHues(polySides)

    const shape = polygonTriangles(
      polySides, width / 2, height / 2, minSide / 4, polyRotation
    )

    const frameTime = state.time.getFrameTime()
    const rotateBy = 0.001 * frameTime

    const strokeLine = (line: T4, color: number) => {
      const pts = bresenhamLine(...line)
      const indices = pointsToIndices(width, height, 1)(pts)

      fillIndices(indices, buffer, color)
    }

    const strokeTri = (tri: T3<T2>, color: number) => {
      const line0: T4 = [tri[0][0], tri[0][1], tri[1][0], tri[1][1]]
      const line1: T4 = [tri[1][0], tri[1][1], tri[2][0], tri[2][1]]
      const line2: T4 = [tri[2][0], tri[2][1], tri[0][0], tri[0][1]]

      strokeLine(line0, color)
      strokeLine(line1, color)
      strokeLine(line2, color)
    }

    for (let i = 0; i < polySides; i++) {
      const color = fillColors[i % fillColors.length]
      const tri = shape[i]

      const ptriRows = triangleToRows(...tri)
      fillRows(ptriRows, buffer, color)
    }

    const strokeColors = strokePoly ? generateHues(polySides, 50) : fillColors

    for (let i = 0; i < polySides; i++) {
      const color = strokeColors[i % strokeColors.length]
      const tri = shape[i]

      strokeTri(tri, color)
    }

    // show custom cursor

    if (state.mouse.isInBounds()) {
      composite(
        cursor, buffer,
        [0, 0, cursor.width, cursor.height, state.mouse.getX(), state.mouse.getY()]
      )
    }

    //

    polyRotation += rotateBy

    frame++
  }

  const quit = async (state: State) => {
    console.log('quitting debug scene')

    releaseMouse()
  }

  const setActive = (active: boolean) => {
    // we just got focus
    if (active && !isActive) {
      takeMouse()
    }

    // we just lost focus 
    if (!active && isActive) {
      releaseMouse()
    }

    isActive = active
  }

  return { init, update, quit, setActive }
}
