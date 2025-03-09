import { State } from '../types.js'

export const exitOnEscape = (state: State): boolean => {
  const keys = state.getKeys()

  if (keys['Escape']) {
    state.setRunning(false)

    // consume the key
    keys['Escape'] = false

    return true
  }

  return false
}

export const zoomOnWheel = (state: State): boolean => {
  const wheel = state.mouse.takeWheel()
  const zoom = state.view.getZoom()

  if (wheel < 0) {
    state.view.setZoom(zoom + 1)
    return true
  } else if (wheel > 0) {
    state.view.setZoom(zoom - 1)
    return true
  }

  return false
}
