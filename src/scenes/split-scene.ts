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
    const buffer = state.view.getBuffer()

    lastW = buffer.width
    lastH = buffer.height

    const [leftR, rightR] = getRects()

    leftBuffer = createImage(leftR[2], leftR[3])
    rightBuffer = createImage(rightR[2], rightR[3])

    updateSize(leftState, state, leftR)
    updateSize(rightState, state, rightR)

    leftState.view.getBuffer = () => leftBuffer
    rightState.view.getBuffer = () => rightBuffer
  }

  const init = async (state: State) => {
    const buffer = state.view.getBuffer()

    lastW = buffer.width
    lastH = buffer.height

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
    const keys = state.getKeys()

    if (keys['Escape']) {
      //state.running = false
      state.setRunning(false)

      keys['Escape'] = false

      return
    }

    if (keys['Tab']) {
      active = active === 0 ? 1 : 0
      keys['Tab'] = false

      onSwitch(state)
    }

    const buffer = state.view.getBuffer()
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
  state.mouse.getX = () => parentState.mouse.getX() - rect[0]
  state.mouse.getY = () => parentState.mouse.getY() - rect[1]

  state.mouse.isInBounds = () => {
    const [_x, _y, w, h] = rect

    return (
      parentState.mouse.isInBounds() &&
      state.mouse.getX() >= 0 && state.mouse.getX() < w &&
      state.mouse.getY() >= 0 && state.mouse.getY() < h
    )
  }
}

// this state will no longer see or modify the parent state's io
const disableIo = (state: State) => {
  state.getKeys = () => ({})
  state.getKeyPresses = () => []
  state.mouse.getButtons = () => ({})
  state.mouse.getWheel = () => 0
}

// reattaches the parent state's io to the child state
const enableIo = (state: State, parentState: State) => {
  state.getKeys = parentState.getKeys
  state.getKeyPresses = parentState.getKeyPresses
  state.mouse.getButtons = parentState.mouse.getButtons
  state.mouse.getWheel = parentState.mouse.getWheel
}

// create a new wrapped state object with its own buffer
const wrapState = (state: State, buffer: ImageData): State => {
  const { 
    getKeys, getKeyPresses, mouse, time, view, getRunning, setRunning 
  } = state
  
  const wrapped: State = {
    getKeys,
    getKeyPresses,
    mouse: { ...mouse },
    time: { ...time },
    view: { 
      ...view,
      getBuffer: () => buffer
    },
    getRunning,
    setRunning
  }

  return wrapped
}