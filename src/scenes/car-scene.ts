import { createHeightmapI16 } from '../lib/heightmap/create.js'
import { Heightmap } from '../lib/heightmap/types.js'
import { bresenhamLine } from '../lib/image/bresenham.js'
import { createColor } from '../lib/image/color.js'
import { createImage } from '../lib/image/create.js'
import { fill } from '../lib/image/fill.js'
import { loadImage } from '../lib/image/load.js'
import { bilinearResize, pointResize } from '../lib/image/resize.js'
import { drawRotated, drawRotatedAndPointScaled } from '../lib/image/rotate.js'
import { clampRect, pset } from '../lib/image/util.js'
import { debugTextSceneHelper } from '../lib/scene/debug-text.js'
import { zoomOnWheel } from '../lib/scene/io.js'
import { textTable } from '../lib/text/table-layout.js'
import { Maybe, Scene, State, T4 } from '../lib/types.js'
import { maybe } from '../lib/util.js'
import { Bicycle, createBicycle, updateBicycle } from './car/bicycle.js'

// 2.5m wide - a little wide but needed to fit headlights lol
const carW = 5
// 4.5m long - about right
const carH = 9

const carCx = Math.floor(carW / 2)
const carCy = Math.floor(carH / 2)

const carColor = 0xffff9933
const headlightColor = 0xff00ffff

type CarConfig = {
  wheelBase: number // pixels - distance between front and back wheels
  accel_0_100: number // seconds
  maxSpeedKmph: number
  revSpeedFactor: number
  brakeFactor: number
  frictionFactor: number
  turnRate: number // rads per ms
  steerReturnSpeed: number // rads per ms
  maxSteerAngle: number
}

const carConfig: CarConfig = {
  wheelBase: 7,
  accel_0_100: 8,
  maxSpeedKmph: 180,
  revSpeedFactor: 0.5,
  brakeFactor: 2,
  frictionFactor: 1,
  turnRate: 0.0005,
  steerReturnSpeed: 0.001,
  maxSteerAngle: 0.5
}

type WorldConfig = {
  pixelsPerMeter: number
  globalFriction: number
}

const worldConfig: WorldConfig = {
  pixelsPerMeter: 2,
  globalFriction: 5
}

const minZoom = 0.75
const maxZoom = 1.5

const zoomDelta = maxZoom - minZoom

// derived from car and world config
const deg90 = Math.PI / 2
const deg270 = 3 * deg90

const kmphScale = 900 * worldConfig.pixelsPerMeter

// no rational basis -  just feels *about* right
// worth playing with!
const frictionMps2 = worldConfig.globalFriction * carConfig.frictionFactor // m/s^2
const friction = frictionMps2 * (worldConfig.pixelsPerMeter / 1e6)

const timeTo100ms = carConfig.accel_0_100 * 1000 // eg 8000ms
// 100kmph in pixels per ms
const speed100 = 100 / kmphScale

const netAccel = speed100 / timeTo100ms
const accel = netAccel + friction // ensure we take friction into account
// again - no rational basis - just feels *about* right

// car specific
const brake = accel * carConfig.brakeFactor

const maxSpeed = carConfig.maxSpeedKmph / kmphScale
const minRevSpeed = -(maxSpeed * carConfig.revSpeedFactor)

type ReverseTurning = 'arcade' | 'realistic'

type Hm = Heightmap<Int16Array>

const fillHm = (hm: Hm, rect: T4, value: number) => {
  rect = clampRect(hm.width, hm.height, rect)

  for (let y = rect[1]; y < rect[3]; y++) {
    const rowStart = y * hm.width
    for (let x = rect[0]; x < rect[2]; x++) {
      hm.data[rowStart + x] = value
    }
  }
}

export const carScene = (): Scene => {
  let isActive = false
  let lastW = 0
  let lastH = 0

  let debugHelper: Maybe<Scene>
  let debugText: string[] = []

  let track: Maybe<ImageData>
  let hm: Maybe<Hm>
  let carSprite: Maybe<ImageData>

  // why bicycle? because it's a simple way to model car physics
  let car: Maybe<Bicycle>

  let reverseTurning: ReverseTurning = 'arcade'

  //

  const init = async (state: State) => {
    debugHelper = debugTextSceneHelper(() => debugText)

    await debugHelper.init(state)

    // // test tracks - worlds from other games etc
    //track = await loadImage('scenes/car/track.png')
    //track = await loadImage('scenes/car/gtav-1bpp.png')
    //track = await loadImage('scenes/car/gtav-map.png')
    //track = await loadImage('scenes/car/gtav-satellite.png')
    //track = await loadImage('scenes/car/fortnite.jpg')
    //track = await loadImage('scenes/car/fantasy-world.png')
    //track = await loadImage('scenes/car/fantasy-city.jpg')
    track = await loadImage('scenes/car/GrandTheftAuto2-Downtown.jpg')
    //track = await loadImage('scenes/car/MarioKart64-MushroomCup-KalimariDesert.jpg')
    //track = await loadImage('scenes/car/MarioKart64-MushroomCup-KoopaTroopaBeach.jpg')
    //track = await loadImage('scenes/car/MarioKart64-MushroomCup-LuigiRaceway.jpg')
    //track = await loadImage('scenes/car/MarioKart64-MushroomCup-MooMooFarm.jpg')
    //track = await loadImage('scenes/car/MarioKart64-FlowerCup-MarioRaceway.jpg')

    // custom world
    const worldW = 2048
    const worldH = 2048
    // texture
    // track = createImage(worldW, worldH)
    // heightmap
    hm = createHeightmapI16(worldW, worldH)

    // carSprite = createImage(carW, carH)

    // fill(carSprite, carColor)
    // pset(carSprite, 1, 0, headlightColor)
    // pset(carSprite, 3, 0, headlightColor)
    carSprite = await loadImage('scenes/car/car.png')

    const trackCx = Math.floor(track.width / 2)
    const trackCy = Math.floor(track.height / 2)
    //const trackCx = 5411
    //const trackCy = 14696

    car = createBicycle([trackCx, trackCy], deg270, 0, 0, carConfig.wheelBase)

    reverseTurning = 'realistic'

    isActive = true
  }

  let turn = 0
  let velocity = 0

  const io = (state: State) => {
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

    if (zoomOnWheel(state)) {
      lastW = 0
      lastH = 0
    }
  }

  const update = (state: State) => {
    if (!maybe(track)) throw Error('Expected track')
    if (!maybe(hm)) throw Error('Expected hm')

    if (!maybe(carSprite)) throw Error('Expected carSprite')
    if (!maybe(car)) throw Error('Expected car')

    if (isActive) io(state)

    const delta = state.time.getFrameTime()

    // adjust car speed and steering angle based on input

    // are we accelerating or braking?
    const a = velocity > 0 && car.speed > 0 ? accel : brake

    car.speed += velocity * delta * a

    if (car.speed > 0) {
      // apply friction
      car.speed -= friction * delta

      // enforce speed limits and ensure friction doesn't make us go backwards
      if (car.speed < 0) car.speed = 0
      if (car.speed > maxSpeed) car.speed = maxSpeed
    } else if (car.speed < 0) {
      // apply friction
      car.speed += friction * delta

      // enforce speed limits and ensure friction doesn't make us go forwards
      if (car.speed > 0) car.speed = 0
      if (car.speed < minRevSpeed) car.speed = minRevSpeed
    }

    if (turn) {
      if (reverseTurning === 'arcade' || car.speed >= 0) {
        car.steerAngle += turn * delta * carConfig.turnRate
      } else {
        // reversing - invert turn
        car.steerAngle -= turn * delta * carConfig.turnRate
      }


      // enforce steering limits
      car.steerAngle = Math.max(
        -carConfig.maxSteerAngle,
        Math.min(carConfig.maxSteerAngle, car.steerAngle)
      )
    } else {
      // return steering to center
      if (car.steerAngle > 0) {
        car.steerAngle = Math.max(
          0, car.steerAngle - delta * carConfig.steerReturnSpeed
        )
      } else if (car.steerAngle < 0) {
        car.steerAngle = Math.min(
          0, car.steerAngle + delta * carConfig.steerReturnSpeed
        )
      }
    }

    const updated = updateBicycle(car, delta)

    // collision detection
    const travel = bresenhamLine(
      car.location[0], car.location[1], updated.location[0], updated.location[1]
    )

    if (travel.length > 1) {
      let first = travel[0]

      for (let i = 1; i < travel.length; i++) {
        // todo
      }
    }

    // if no collision, update car
    car.location = updated.location
    car.heading = updated.heading

    //

    const zoom = minZoom + (1 - (Math.abs(car.speed) / maxSpeed)) * zoomDelta

    //

    const buffer = state.view.getBuffer()
    const { width, height } = buffer

    const vx = Math.floor(width / 2)
    // we place the car down the screen facing up,
    // so we can see more of the road ahead
    const vy = Math.floor(height * 0.875)

    // draw the track, centered on the car, onto the view, rotated by -carHeading
    // and then deg90 to face "up"
    drawRotatedAndPointScaled(
      track,
      car.location[0], car.location[1],
      buffer, vx, vy,
      -car.heading - deg90, zoom
    )
    // draw the car, centered on the car, onto the view
    drawRotatedAndPointScaled(
      carSprite, carCx, carCy, buffer, vx, vy, car.steerAngle, zoom
    )

    // mini map

    const mmHeight = Math.floor(height / 2)
    const mmScale = mmHeight / track.height
    const mmWidth = Math.floor(track.width * mmScale)

    const mmX = 2
    const mmY = height - mmHeight - 2

    // pointResize(
    //   track, buffer,
    //   [0, 0, track.width, track.height],
    //   [mmX, mmY, mmWidth, mmHeight]
    // )
    bilinearResize(
      track, buffer,
      [0, 0, track.width, track.height],
      [mmX, mmY, mmWidth, mmHeight]
    )

    const mmCarX = Math.floor(car.location[0] * mmScale) + mmX
    const mmCarY = Math.floor(car.location[1] * mmScale) + mmY

    const red = createColor(255, 0, 0)

    pset(buffer, mmCarX, mmCarY, red)

    if (!maybe(debugHelper)) return

    const kmph = car.speed * kmphScale

    const fps = Math.round(1000 / delta)
    const fpsText = `${fps} fps (${delta.toFixed(1)}ms)`

    const table = textTable([
      ['x:', `${car.location[0].toFixed(4)}`],
      ['y:', `${car.location[1].toFixed(4)}`],
      ['heading:', `${car.heading.toFixed(4)}`],
      ['speed:', `${car.speed.toFixed(4)}`],
      ['steer:', `${car.steerAngle.toFixed(4)}`],
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
