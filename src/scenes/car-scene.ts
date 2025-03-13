import { createImage } from '../lib/image/create.js'
import { fill } from '../lib/image/fill.js'
import { loadImage } from '../lib/image/load.js'
import { drawRotated } from '../lib/image/rotate.js'
import { pset } from '../lib/image/util.js'
import { debugTextSceneHelper } from '../lib/scene/debug-text.js'
import { Maybe, Scene, State, T2 } from '../lib/types.js'
import { maybe } from '../lib/util.js'

const carW = 5 // 2.5m wide - a little over the top but needed to fit headlights lol
const carH = 9 // 4.5m long - about right

const wheelBase = 7 // difference between two axles

const carCx = Math.floor(carW / 2)
const carCy = Math.floor(carH / 2)

const carColor = 0xffff9933
const headlightColor = 0xff00ffff

export const carScene = (): Scene => {
  let isActive = false

  let debugHelper: Maybe<Scene>
  let debugText: string[] = []

  let track: Maybe<ImageData>
  let carSprite: Maybe<ImageData>

  //

  let carLocation: T2 = [0, 0]
  let carHeading = 0
  let carSpeed = 0
  let steerAngle = 0


  let frontWheel: T2 = [0, 0]
  let rearWheel: T2 = [0, 0]

  //

  const init = async (state: State) => {
    debugHelper = debugTextSceneHelper(() => debugText)

    await debugHelper.init(state)

    //

    track = await loadImage('scenes/car/track.png')

    carSprite = createImage(carW, carH)

    fill(carSprite, carColor)
    pset(carSprite, 1, 0, headlightColor)
    pset(carSprite, 3, 0, headlightColor)

    const trackCx = Math.floor(track.width / 2)
    const trackCy = Math.floor(track.height / 2)

    carLocation = [trackCx, trackCy]

    isActive = true
  }

  let turn = 0
  let velocity = 0

  const io = (state: State) => {
    const presses = state.getKeyPresses()
    const delta = state.time.getFrameTime()

    turn = 0
    velocity = 0

    for (const key of presses) {
      const l = key.toLowerCase()

      if (l === 'w') {
        velocity = 1
      }

      if (l === 's') {
        velocity = -1
      }

      if (l === 'a') {
        turn--
      }

      if (l === 'd') {
        turn++
      }
    }

    // todo - apply 

    presses.length = 0
  }

  const update = (state: State) => {
    if (!maybe(track)) throw Error('Expected track')
    if (!maybe(carSprite)) throw Error('Expected carSprite')

    if (isActive) io(state)

    const delta = state.time.getFrameTime()

    //

    // update car physics here

    //

    const buffer = state.view.getBuffer()
    const { width, height } = buffer

    const vx = Math.floor(width / 2)
    // we place the car three quarters of the way down the screen facing up,
    // so we can see more of the road
    const vy = Math.floor(height * 0.75)

    // draw the track, centered on the car, onto the view, rotated by -carHeading
    drawRotated(track, carLocation[0], carLocation[1], buffer, vx, vy, -carHeading)
    // draw the car, centered on the car, onto the view, pointing straight up
    drawRotated(carSprite, carCx, carCy, buffer, vx, vy, 0)

    //

    if (!maybe(debugHelper)) return

    const fps = Math.round(1000 / delta)
    const fpsText = `${fps} fps (${delta.toFixed(1)}ms)`

    const table = textTable([
      ['carX:', `${carLocation[0].toFixed(4)}`],
      ['carY:', `${carLocation[1].toFixed(4)}`],
      ['carHeading:', `${carHeading.toFixed(4)}`],
    ])

    debugText = [
      fpsText,
      ...table
    ]

    debugHelper.update(state)
  }

  const quit = async (state: State) => {
    isActive = false

    if (maybe(debugHelper)) await debugHelper.quit(state)

    debugHelper = null
  }

  const setActive = (active: boolean) => {
    isActive = active
  }

  return { init, update, quit, setActive }
}

const textTable = (cells: string[][]): string[] => {
  const colWidths = new Map<number, number>()

  // measure
  for (let row = 0; row < cells.length; row++) {
    for (let col = 0; col < cells[row].length; col++) {
      const cell = cells[row][col]
      const width = cell.length

      let existingW = colWidths.get(col)

      if (!maybe(existingW)) {
        existingW = 0
      }

      if (width > existingW) {
        colWidths.set(col, width)
      }
    }
  }

  // format
  const formatted: string[] = []

  for (let row = 0; row < cells.length; row++) {
    let line = ''

    for (let col = 0; col < cells[row].length; col++) {
      const cell = cells[row][col]
      const width = colWidths.get(col) || 0

      const isLast = col === cells[row].length - 1

      if (isLast) {
        line += cell.padStart(width)
      } else {
        line += cell.padEnd(width + 1)
      }
    }

    formatted.push(line)
  }

  return formatted
}