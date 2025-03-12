import { createImage } from '../lib/image/create.js'
import { fill } from '../lib/image/fill.js'
import { loadImage } from '../lib/image/load.js'
import { drawRotated } from '../lib/image/rotate.js'
import { pset } from '../lib/image/util.js'
import { debugTextSceneHelper } from '../lib/scene/debug-text.js'
import { Maybe, Scene, State } from '../lib/types.js'
import { maybe } from '../lib/util.js'

const carW = 5 // 2.5m wide - a little over the top but needed to fit headlights lol
const carH = 9 // 4.5m long - about right

const carCx = Math.floor(carW / 2)
const carCy = Math.floor(carH / 2)

const carColor = 0xffff9933
const headlightColor = 0xff00ffff

// per what? these are just made up numbers :(
const carTurnSpeed = 0.0001
const carAcceleration = 0.01
const carTireMinAngle = -0.35 // in rads
const carTireMaxAngle = 0.35
const carMaxSpeed = 0.05
const friction = 0.00002

export const carScene = (): Scene => {
  let isActive = false

  let debugHelper: Maybe<Scene>
  let debugText: string[] = []

  let track: Maybe<ImageData>
  let carSprite: Maybe<ImageData>

  let carX = 0
  let carY = 0

  let carAngle = 0 // generally fixed as world rotates around car, but we might want to adjust slightly for skidding or other effects
  let carTireAngle = 0 // for steering, should be in a fixed range
  let carSpeed = 0

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

    carX = trackCx
    carY = trackCy

    isActive = true
  }

  const io = (state: State) => {
    const presses = state.getKeyPresses()
    const delta = state.time.getFrameTime()
    let steeringInput = 0
    let accelInput = 0
  
    for (const key of presses) {
      const l = key.toLowerCase()

      // if (l === 'a') {
      //   trackAngle += carTurnSpeed * elapsed
      // }
      // if (l === 'd') {
      //   trackAngle -= carTurnSpeed * elapsed
      // }

      if (l === 'w') {
        accelInput = 1
      }
      if (l === 's') {
        accelInput = -1
      }

      if (l === 'a') {
        steeringInput = -1
      }
      if (l === 'd') {
        steeringInput = 1
      }
    }

    if (accelInput !== 0) {
      carSpeed += accelInput * carAcceleration * delta

      if (carSpeed > carMaxSpeed) carSpeed = carMaxSpeed
      if (carSpeed < 0) carSpeed = 0
    }

    if (steeringInput === 0) {
      // recenter the tires - would be better if there was a delay
      // 
      // commented out as it prevents the car from turning entirely :/
      // carTireAngle = 0
    } else {
      carTireAngle += steeringInput * carTurnSpeed * delta
      if (carTireAngle > carTireMaxAngle) carTireAngle = carTireMaxAngle
      if (carTireAngle < carTireMinAngle) carTireAngle = carTireMinAngle
    }

    presses.length = 0
  }

  const update = (state: State) => {
    if (!maybe(track)) throw Error('Expected track')
    if (!maybe(carSprite)) throw Error('Expected carSprite')

    if (isActive) io(state)

    const delta = state.time.getFrameTime()

    //

    if (carSpeed !== 0) {
      carAngle += (carSpeed * carTireAngle * delta)
    }

    carX += Math.sin(carAngle) * (carSpeed * delta)
    carY -= Math.cos(carAngle) * (carSpeed * delta)

    if (carSpeed > 0) {
      carSpeed -= friction * delta
    }

    if (carSpeed < 0) carSpeed = 0

    //

    const buffer = state.view.getBuffer()
    const { width, height } = buffer

    const vx = Math.floor(width / 2)
    // we place the car three quarters of the way down the screen facing up,
    // so we can see more of the road
    const vy = Math.floor(height * 0.75)

    // draw the track, centered on the car, onto the view, rotated by -carAngle
    drawRotated(track, carX, carY, buffer, vx, vy, -carAngle)
    // draw the car, centered on the car, onto the view, pointing straight up
    drawRotated(carSprite, carCx, carCy, buffer, vx, vy, carTireAngle)

    //

    if (!maybe(debugHelper)) return

    const fps = Math.round(1000 / delta)
    const fpsText = `${fps} fps (${delta.toFixed(1)}ms)`

    const table = textTable([
      ['carX:', `${carX.toFixed(4)}`],
      ['carY:', `${carY.toFixed(4)}`],
      ['carAngle:', `${carAngle.toFixed(4)}`],
      ['carTireAngle:', `${carTireAngle.toFixed(4)}`],
      ['carSpeed:', `${carSpeed.toFixed(4)}`]
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
/*
const carDebug = textTable(
  [
    ['carX', `${ carX | 0 }`],
    // etc
  ]
)
*/
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