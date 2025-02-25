import { createImage } from './image/create.js'
import { Maybe, Scene, State } from './types.js'

// stupidly simple 2d pixel game engine

// defers pretty much everything to the scene, just provides a basic harness
// for handling input, timing, rendering etc
//
// this is pretty flexible - for example you can have multiple scenes 
// concurrently by having a single scene act as a manager and dispatching to
// its child scenes, intercepting the main state and passing decorated versions
// to the children so that mouse is relative to the child scene position, they
// can have their own frame buffer which gets blitted to the main one, keys and
// mouse only go to the active scene etc etc

// state:

let currentScene: Maybe<Scene>

// misc 

let debug = false
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
  keys,
  get keyPresses() {
    return keyPresses
  },
  set keyPresses(value: string[]) {
    keyPresses = value
  },

  mouse: {
    // same as keys
    buttons: mouseButtons,
    get x() {
      return frameMouseX
    },
    get y() {
      return frameMouseY
    },
    get inBounds() {
      return cursorInBounds
    },
    // destructive read
    // otherwise the delta is retained from frame to frame
    // we could have made it so the consumer can explicitly clear it after use
    // or choose to use it, but we have no use case for that
    get wheel() {
      const value = mouseWheelDelta

      mouseWheelDelta = 0

      return value
    }
  },
  time: {
    get elapsed() {
      return elapsed
    },
    get frameTime() {
      return frameTime
    }
  },
  view: {
    get zoom() {
      return zoom
    },
    set zoom(value: number) {
      zoom = Math.max(minZoom, Math.min(maxZoom, value))
      resize()
    },
    get buffer() {
      return frameBuffer
    }
  },
  get running() {
    return running
  },
  set running(value: boolean) {
    running = value
  },
  get debug() {
    return debug
  },
  set debug(value: boolean) {
    debug = value
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

// runner:

// initialise the engine with a scene
export const start = async (scene: Scene) => {
  // if it already has a scene, halt it first
  if( currentScene ) halt()

  currentScene = scene

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

  if (currentScene){
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

  if( currentScene ) currentScene.update(state)
  
  // scene may have sent a quit signal
  if (!running) {
    halt()

    return
  }

  // render

  frameCtx.putImageData(frameBuffer, 0, 0)

  // debug

  if (!debug) {
    rafId = requestAnimationFrame(tick)
    return
  }

  frameCtx.fillStyle = `rgba(0,0,0,0.5)`
  frameCtx.fillRect(0, 0, 100, 33)

  frameCtx.fillStyle = '#ffffff'
  frameCtx.font = `10px monospace`

  let mouseBtnState = ''

  for (let i = 0; i < 3; i++) {
    mouseBtnState += mouseButtons[i] ? `${i}` : '-'
  }

  let keyState = ''

  keyState += (keys['W'] || keys['w'] ? 'W' : '-')
  keyState += (keys['A'] || keys['a'] ? 'A' : '-')
  keyState += (keys['S'] || keys['s'] ? 'S' : '-')
  keyState += (keys['D'] || keys['d'] ? 'D' : '-')

  const fps = Math.round(1000 / frameTime)

  const cursorState = useSystemMouse ? ' ON' : 'OFF'

  frameCtx.fillText(`${fps} fps (${frameTime.toFixed(1)})`, 1, 11)
  frameCtx.fillText(
    `${mouseBtnState} ${cursorState} ${frameMouseX}, ${frameMouseY}`, 1, 21
  )
  frameCtx.fillText(`${keyState}`, 1, 31)

  //

  rafId = requestAnimationFrame(tick)
}
