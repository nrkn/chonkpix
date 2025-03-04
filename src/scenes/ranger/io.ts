import { State } from '../../lib/types.js'
import { RangerDeps, RangerState } from './types.js'

export const rangerIo = (state: State, deps: RangerDeps, fs: RangerState) => {
  const keys = state.getKeys()

  if (keys['Escape']) {
    state.setRunning(false)

    // consume the key
    keys['Escape'] = false

    return
  }

  const wheel = state.mouse.takeWheel()
  const zoom = state.view.getZoom()

  if (wheel < 0) {
    state.view.setZoom(zoom + 1)
    fs.prevRectIndices.clear()
  } else if (wheel > 0) {
    state.view.setZoom(zoom - 1)
    fs.prevRectIndices.clear()
  }

  const presses = state.getKeyPresses()

  fs.moveCols = 0
  fs.moveRows = 0

  for (const key of presses) {
    let ocx = fs.cameraX
    let ocy = fs.cameraY

    if (key.toLowerCase() === 'w' && fs.cameraY > 0) {
      fs.cameraY--
      fs.moveRows--
    }
    if (key.toLowerCase() === 's' && fs.cameraY < deps.tileMap.height - 1) {
      fs.cameraY++
      fs.moveRows++
    }

    if (key.toLowerCase() === 'a' && fs.cameraX > 0) {
      fs.cameraX--
      fs.facing = 'left'
      fs.moveCols--
    }
    if (key.toLowerCase() === 'd' && fs.cameraX < deps.tileMap.width - 1) {
      fs.cameraX++
      fs.facing = 'right'
      fs.moveCols++
    }

    // check blocking
    const cameraTile = deps.tileMap.data[
      fs.cameraY * deps.tileMap.width + fs.cameraX
    ]

    if (deps.blocking.has(cameraTile)) {
      fs.cameraX = ocx
      fs.cameraY = ocy
      fs.moveCols = 0
      fs.moveRows = 0
    }
  }

  // consume all key presses
  presses.length = 0
}