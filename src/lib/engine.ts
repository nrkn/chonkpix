import { createImage } from './image/create.js'
import { Maybe, Scene, State } from './types.js'
import { wait } from './util.js'

// chonkpix
// a stupidly simple chonky pixel engine

// private state:

let currentScene: Maybe<Scene>

// misc 

let running = false
let rafId: number

// io

const keys: Record<string, boolean> = {}
let keyPresses: string[] = []

let viewMouseX = 0
let viewMouseY = 0

let useSystemMouse = true
let cursorInBounds = true
let frameMouseX = 0
let frameMouseY = 0

let mouseWheelDelta = 0

const mouseButtons: Record<number, boolean> = {}

// sound
// todo - plug in a small sound library like ZzFX or similar

// time

let startTime: number | null = null
let lastTime: number
let elapsed: number
let frameTime: number

// view

const minZoom = 2
const maxZoom = 16

let zoom = 5

let frameW: number
let frameH: number
let frameBuffer: ImageData
let frameCanvas: HTMLCanvasElement
let frameCtx: CanvasRenderingContext2D

// public state

const state: State = {
  // expose keys directly, that way the consumer can make decisions like
  // clearing the key state after reading etc
  getKeys: () => keys,
  getKeyPresses: () => keyPresses,

  mouse: {
    getButtons: () => mouseButtons,
    getX: () => frameMouseX,
    getY: () => frameMouseY,
    getWheel: () => {
      // destructive read
      // otherwise the delta is retained from frame to frame
      // we could have made it so the consumer can explicitly clear it after use
      // or choose to use it, but we have no use case for
      const value = mouseWheelDelta

      mouseWheelDelta = 0

      return value
    },
    isInBounds: () => cursorInBounds
  },

  time: {
    getElapsed: () => elapsed,
    getFrameTime: () => frameTime
  },

  view: {
    getZoom: () => zoom,
    setZoom: (value: number) => {
      zoom = Math.max(minZoom, Math.min(maxZoom, value))
      resize()
    },
    getBuffer: () => frameBuffer
  },

  getRunning: () => running,
  setRunning: (value: boolean) => {
    running = value
  }
}

// event handlers:

const preventDefaults = new Set<string>(['Tab'])

const keyDown = (event: KeyboardEvent) => {
  keys[event.key] = true

  if (preventDefaults.has(event.key)) {
    event.preventDefault()

    return false
  }
}

const keyUp = (event: KeyboardEvent) => {
  keys[event.key] = false

  // forward non-printable keys to keyPress
  if (event.key === 'Backspace') {
    keyPress(event)

    return
  }

  // any others in future

  // 

  if (preventDefaults.has(event.key)) {
    event.preventDefault()

    return false
  }
}

const keyPress = (event: KeyboardEvent) => {
  keyPresses.push(event.key)

  if (preventDefaults.has(event.key)) {
    event.preventDefault()

    return false
  }
}

const mouseMove = (event: MouseEvent) => {
  viewMouseX = event.clientX
  viewMouseY = event.clientY

  frameMouseX = Math.floor(viewMouseX / zoom)
  frameMouseY = Math.floor(viewMouseY / zoom)
}

const mouseWheel = (event: WheelEvent) => {
  mouseWheelDelta = event.deltaY

  if (!useSystemMouse) {
    event.preventDefault()

    return false
  }
}

const mouseButtonDown = (event: MouseEvent) => {
  mouseButtons[event.button] = true

  if (!useSystemMouse) {
    event.preventDefault()

    return false
  }
}

const mouseButtonUp = (event: MouseEvent) => {
  mouseButtons[event.button] = false

  if (!useSystemMouse) {
    event.preventDefault()

    return false
  }
}

const preventContextDefault = (event: Event) => {
  if (!useSystemMouse) {
    event.preventDefault()

    return false
  }
}

const mouseLeave = () => {
  cursorInBounds = false
}

const mouseEnter = () => {
  cursorInBounds = true
}

const resize = () => {
  frameW = Math.floor(innerWidth / zoom)
  frameH = Math.floor(innerHeight / zoom)

  frameBuffer = createImage(frameW, frameH)

  frameCanvas.width = frameW
  frameCanvas.height = frameH
}

// mouse control:

export const releaseMouse = () => {
  useSystemMouse = true
  frameCanvas.classList.toggle('hide-cursor', false)
}

export const takeMouse = () => {
  useSystemMouse = false
  frameCanvas.classList.toggle('hide-cursor', true)
}

// hard render
// in case you want to display something immediately, eg if you have a long
// running init and want to show progress or etc
export const render = async () => {
  frameCtx.putImageData(frameBuffer, 0, 0)

  // we still have to let the event loop run or it won't show anything
  await wait()
}

// runner:

// initialise the engine with a scene
export const start = async (scene: Scene) => {
  // if it already has a scene, halt it first
  if (currentScene) halt()

  currentScene = scene

  if (frameCanvas) frameCanvas.remove()

  frameCanvas = document.createElement('canvas')
  frameCanvas.id = 'viewport'
  frameCanvas.tabIndex = 0

  document.body.append(frameCanvas)

  frameCanvas.focus()

  frameCtx = frameCanvas.getContext('2d')!

  resize()

  addEventListener('resize', resize)

  frameCanvas.addEventListener('keydown', keyDown)
  frameCanvas.addEventListener('keyup', keyUp)
  frameCanvas.addEventListener('keypress', keyPress)

  frameCanvas.addEventListener('mousemove', mouseMove)
  frameCanvas.addEventListener('wheel', mouseWheel)
  frameCanvas.addEventListener('mousedown', mouseButtonDown)
  frameCanvas.addEventListener('mouseup', mouseButtonUp)
  frameCanvas.addEventListener('contextmenu', preventContextDefault)
  frameCanvas.addEventListener('mouseleave', mouseLeave)
  frameCanvas.addEventListener('mouseenter', mouseEnter)

  running = true

  await scene.init(state)

  rafId = requestAnimationFrame(tick)
}

// tidy everything up
const halt = () => {
  running = false
  cancelAnimationFrame(rafId)

  removeEventListener('resize', resize)

  frameCanvas.removeEventListener('keydown', keyDown)
  frameCanvas.removeEventListener('keyup', keyUp)
  frameCanvas.removeEventListener('keypress', keyPress)

  frameCanvas.removeEventListener('mousemove', mouseMove)
  frameCanvas.removeEventListener('wheel', mouseWheel)
  frameCanvas.removeEventListener('mousedown', mouseButtonDown)
  frameCanvas.removeEventListener('mouseup', mouseButtonUp)
  frameCanvas.removeEventListener('contextmenu', preventContextDefault)
  frameCanvas.removeEventListener('mouseleave', mouseLeave)
  frameCanvas.removeEventListener('mouseenter', mouseEnter)

  frameCanvas.remove()

  startTime = null

  releaseMouse()

  if (currentScene) {
    currentScene.quit(state).catch(console.error)

    currentScene = null
  }
}

const initTick = (time: number) => {
  if (startTime !== null) return startTime

  // first tick

  startTime = time

  elapsed = 0
  frameTime = 0
  lastTime = time

  return startTime
}

const tick = (time: number) => {
  if (!running) return

  startTime = initTick(time)
  elapsed = time - startTime
  frameTime = time - lastTime
  lastTime = time

  if (currentScene) currentScene.update(state)

  // scene may have sent a quit signal
  if (!running) {
    halt()

    return
  }

  // render

  frameCtx.putImageData(frameBuffer, 0, 0)

  //

  rafId = requestAnimationFrame(tick)
}
