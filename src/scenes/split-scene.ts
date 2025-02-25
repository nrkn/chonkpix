import { blit } from '../lib/image/blit.js'
import { createColor } from '../lib/image/color.js'
import { createImage } from '../lib/image/create.js'
import { fill } from '../lib/image/fill.js'
import { strokeRect } from '../lib/image/stroke.js'
import { Scene, State, T2, T4 } from '../lib/types.js'

// renders two scenes side by side
// tab to switch between scenes
// escape to quit
//
// contains the requisite patterns for more complex composite scenes
export const splitScene = (
  left: Scene, right: Scene, 
  bgColor = createColor(0x00, 0x00, 0x00),
  activeBorderColor = createColor(0xff, 0xd7, 0x00),
  padding = 1
): Scene => {
  let active: 0 | 1 = 0

  let leftBuffer: ImageData
  let rightBuffer: ImageData

  let leftState: State
  let rightState: State

  let lastW = 0
  let lastH = 0

  // enable key/mouse handling for the active scene
  // disable key/mouse handling for the inactive scene
  const onSwitch = (state: State) => {
    if (active === 0) {
      enableIo(leftState, state)
      disableIo(rightState)
      if( left.setActive ) left.setActive(true)
      if( right.setActive ) right.setActive(false)
    } else {
      enableIo(rightState, state)
      disableIo(leftState)
      if( right.setActive ) right.setActive(true)
      if( left.setActive ) left.setActive(false)
    }
  }

  // get the rects for the left and right scenes taking into account padding
  const getRects = (): T2<T4> => {
    const w = lastW - padding * 3
    const h = lastH - padding * 2

    const halfW = Math.floor(w / 2)

    const leftR: T4 = [padding, padding, halfW, h]
    const rightR: T4 = [halfW + padding * 2, padding, halfW, h]

    return [leftR, rightR]
  }

  const resized = (state: State) => {
    lastW = state.view.buffer.width
    lastH = state.view.buffer.height

    const [leftR, rightR] = getRects()

    leftBuffer = createImage(leftR[2], leftR[3])
    rightBuffer = createImage(rightR[2], rightR[3])

    updateSize(leftState, state, leftR)
    updateSize(rightState, state, rightR)

    Object.defineProperty(leftState.view, 'buffer', {
      get() {
        return leftBuffer
      }
    })

    Object.defineProperty(rightState.view, 'buffer', {
      get() {
        return rightBuffer
      }
    })
  }

  const init = async (state: State) => {
    lastW = state.view.buffer.width
    lastH = state.view.buffer.height

    leftState = wrapState(state, leftBuffer)
    rightState = wrapState(state, rightBuffer)

    resized(state)

    await left.init(leftState)
    await right.init(rightState)

    onSwitch(state)
  }

  const update = (state: State) => {
    // note that capturing and consuming the keys here means that child scenes
    // won't be able to see them - in this case, it is intentional, but keep
    // that in mind!
    //
    // if we find a use case for *not* doing this we can add options to the 
    // splitScene factory function
    if (state.keys['Escape']) {
      state.running = false
      state.keys['Escape'] = false

      return
    }

    if (state.keys['Tab']) {
      active = active === 0 ? 1 : 0
      state.keys['Tab'] = false

      onSwitch(state)
    }

    const { buffer } = state.view
    const { width, height } = buffer

    if (width !== lastW || height !== lastH) {
      resized(state)
    }

    // update the child scenes

    left.update(leftState)
    right.update(rightState)

    // draw the split view

    const leftBorderRect: T4 = [
      0, 0,
      leftBuffer.width + padding * 2, leftBuffer.height + padding * 2
    ]

    const rightBorderRect: T4 = [
      leftBuffer.width + padding * 2 - 1, 0,
      rightBuffer.width + padding * 2, rightBuffer.height + padding * 2
    ]

    const activeRect = active === 0 ? leftBorderRect : rightBorderRect
    const inactiveRect = active === 0 ? rightBorderRect : leftBorderRect

    fill(buffer, bgColor)

    strokeRect(buffer, inactiveRect, bgColor)
    strokeRect(buffer, activeRect, activeBorderColor)

    blit(
      leftBuffer, buffer,
      [
        0, 0, leftBuffer.width, leftBuffer.height,
        padding, padding
      ]
    )

    blit(
      rightBuffer, buffer,
      [
        0, 0, rightBuffer.width, rightBuffer.height,
        leftBuffer.width + padding * 2, padding
      ]
    )
  }

  const quit = async (state: State) => {
    await left.quit(state)
    await right.quit(state)
  }

  return { init, update, quit }
}

// overwrite mouseX, mouseY and inBounds for new size
const updateSize = (state: State, parentState: State, rect: T4) => {
  Object.defineProperty(state.mouse, 'x', {
    get() {
      return parentState.mouse.x - rect[0]
    }
  })

  Object.defineProperty(state.mouse, 'y', {
    get() {
      return parentState.mouse.y - rect[1]
    }
  })

  Object.defineProperty(state.mouse, 'inBounds', {
    get() {
      const [_x, _y, w, h] = rect

      return (
        parentState.mouse.inBounds &&
        state.mouse.x >= 0 && state.mouse.x < w &&
        state.mouse.y >= 0 && state.mouse.y < h
      )
    }
  })
}

// this state will no longer see or modify the parent state's io
const disableIo = (state: State) => {
  Object.defineProperty(state, 'keys', {
    get() {
      return {}
    },
    set(_value: Record<string, boolean>) {
      // ignore
    }
  })

  Object.defineProperty(state, 'keyPresses', {
    get() {
      return []
    },
    set(_value: string[]) {
      // ignore
    }
  })

  Object.defineProperty(state.mouse, 'buttons', {
    get() {
      return {}
    },
    set(_value: Record<number, boolean>) {
      // ignore
    }
  })

  Object.defineProperty(state.mouse, 'wheel', {
    get() {
      return 0
    }
  })
}

// reattaches the parent state's io to the child state
const enableIo = (state: State, parentState: State) => {
  Object.defineProperty(state, 'keys', {
    get() {
      return parentState.keys
    },
    set(value: Record<string, boolean>) {
      parentState.keys = value
    }
  })

  Object.defineProperty(state, 'keyPresses', {
    get() {
      return parentState.keyPresses
    },
    set(value: string[]) {
      parentState.keyPresses = value
    }
  })

  Object.defineProperty(state.mouse, 'buttons', {
    get() {
      return parentState.mouse.buttons
    },
    set(value: Record<number, boolean>) {
      parentState.mouse.buttons = value
    }
  })

  Object.defineProperty(state.mouse, 'wheel', {
    get() {
      return parentState.mouse.wheel
    }
  })
}

// create a new wrapped state object with its own buffer
const wrapState = (state: State, buffer: ImageData): State => {
  const wrapped: State = {
    get keys() {
      return state.keys
    },
    set keys(value) {
      state.keys = value
    },
    get keyPresses() {
      return state.keyPresses
    },
    set keyPresses(value) {
      state.keyPresses = value
    },

    mouse: {
      get buttons() {
        return state.mouse.buttons
      },
      set buttons(value) {
        state.mouse.buttons = value
      },
      get x() {
        return state.mouse.x
      },
      get y() {
        return state.mouse.y
      },
      get inBounds() {
        return state.mouse.inBounds
      },
      get wheel() {
        return state.mouse.wheel
      }
    },

    time: {
      get elapsed() {
        return state.time.elapsed
      },
      get frameTime() {
        return state.time.frameTime
      }
    },

    view: {
      get zoom() {
        return state.view.zoom
      },
      set zoom(value) {
        state.view.zoom = value
      },
      get buffer() {
        return buffer
      }
    },

    get running() {
      return state.running
    },
    set running(value) {
      state.running = value
    },
    get debug() {
      return state.debug
    },
    set debug(value) {
      state.debug = value
    }
  }

  return wrapped
}