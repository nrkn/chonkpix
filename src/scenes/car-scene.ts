import { createImage } from '../lib/image/create.js'
import { fill } from '../lib/image/fill.js'
import { loadImage } from '../lib/image/load.js'
import { drawRotated } from '../lib/image/rotate.js'
import { pset } from '../lib/image/util.js'
import { debugTextSceneHelper } from '../lib/scene/debug-text.js'
import { Maybe, Scene, State, T2 } from '../lib/types.js'
import { maybe } from '../lib/util.js'
import { Bicycle, createBicycle, updateBicycle } from './car/bicycle.js'

const carW = 5 // 2.5m wide - a little over the top but needed to fit headlights lol
const carH = 9 // 4.5m long - about right

const pixelsPerMeter = 2

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

  let car: Maybe<Bicycle>

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

    car = createBicycle()
    car.location = [trackCx, trackCy]
    car.heading = 0
    car.speed = 0
    car.steerAngle = 0
    car.wheelBase = wheelBase

    isActive = true
  }

  let turn = 0
  let velocity = 0

  const io = (state: State) => {
    // don't use key presses with repeat etc - just check if down or not
    const keys = state.getKeys()

    turn = 0
    velocity = 0

    if (keys['w'] || keys['W']) {
      velocity = 1
    }

    if (keys['s'] || keys['S']) {
      velocity = -1
    }

    if (keys['a'] || keys['A']) {
      turn = -1
    }

    if (keys['d'] || keys['D']) {
      turn = 1
    }
  }

  const accel = 0.0001
  const turnRate = 0.0005
  const deg90 = Math.PI / 2
  const steerReturnSpeed = 0.001
  const friction = 0.00005
  const maxSpeed = 0.1
  const minRevSpeed = -(maxSpeed / 2)
  const maxSteerAngle = 0.5

  const update = (state: State) => {
    if (!maybe(track)) throw Error('Expected track')
    if (!maybe(carSprite)) throw Error('Expected carSprite')
    if (!maybe(car)) throw Error('Expected car')

    if (isActive) io(state)

    const delta = state.time.getFrameTime()

    //

    // adjust car speed and steering angle based on input
    car.speed += velocity * delta * accel

    if (car.speed > 0) {
      car.speed -= friction * delta

      if (car.speed < 0) car.speed = 0
      if (car.speed > maxSpeed) car.speed = maxSpeed
    } else if (car.speed < 0) {
      car.speed += friction * delta

      if (car.speed > 0) car.speed = 0
      if (car.speed < minRevSpeed) car.speed = minRevSpeed
    }

    if (turn) {
      const speedFactor = Math.min(1, Math.max(0, Math.abs(car.speed) / maxSpeed))

      car.steerAngle += turn * delta * turnRate * speedFactor

      car.steerAngle = Math.max(
        -maxSteerAngle,
        Math.min(maxSteerAngle, car.steerAngle)
      )
    } else {
      if (car.steerAngle > 0) {
        car.steerAngle = Math.max(0, car.steerAngle - delta * steerReturnSpeed)
      } else if (car.steerAngle < 0) {
        car.steerAngle = Math.min(0, car.steerAngle + delta * steerReturnSpeed)
      }
    }

    const updated = updateBicycle(car, delta)

    // we could check here for collision, that's why updated is separate from car

    // if no collision, update car
    car.location = updated.location
    car.heading = updated.heading

    //

    const buffer = state.view.getBuffer()
    const { width, height } = buffer

    const vx = Math.floor(width / 2)
    // we place the car three quarters of the way down the screen facing up,
    // so we can see more of the road
    const vy = Math.floor(height * 0.75)

    // draw the track, centered on the car, onto the view, rotated by -carHeading
    drawRotated(track, car.location[0], car.location[1], buffer, vx, vy, -car.heading - deg90)
    // draw the car, centered on the car, onto the view, pointing straight up
    drawRotated(carSprite, carCx, carCy, buffer, vx, vy, 0)

    //

    if (!maybe(debugHelper)) return

    const fps = Math.round(1000 / delta)
    const fpsText = `${fps} fps (${delta.toFixed(1)}ms)`    

    const table = textTable([
      ['carX:', `${car.location[0].toFixed(4)}`],
      ['carY:', `${car.location[1].toFixed(4)}`],
      ['carHeading:', `${car.heading.toFixed(4)}`],
      ['carSpeed:', `${car.speed.toFixed(4)}`],
      ['carSteerAngle:', `${car.steerAngle.toFixed(4)}`],
      ['kmph:', `${kmph.toFixed(4)}`],
      ['turn:', `${turn}`],
      ['velocity:', `${velocity}`]
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