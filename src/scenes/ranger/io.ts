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
    fs.lastW = 0
    fs.lastH = 0
  } else if (wheel > 0) {
    state.view.setZoom(zoom - 1)
    fs.lastW = 0
    fs.lastH = 0
  }

  const presses = state.getKeyPresses()

  for (const key of presses) {
    let ocx = fs.cameraX
    let ocy = fs.cameraY

    const isLeft = key.toLowerCase() === 'a' || key === 'ArrowLeft'
    const isRight = key.toLowerCase() === 'd' || key === 'ArrowRight'
    const isUp = key.toLowerCase() === 'w' || key === 'ArrowUp'
    const isDown = key.toLowerCase() === 's' || key === 'ArrowDown'

    if (isUp && fs.cameraY > 0) {
      fs.cameraY--
    }
    if (isDown && fs.cameraY < deps.tileMap.height - 1) {
      fs.cameraY++
    }

    if (isLeft && fs.cameraX > 0) {
      fs.cameraX--
    }
    if (isRight && fs.cameraX < deps.tileMap.width - 1) {
      fs.cameraX++
    }

    // change facing even if blocked/oob
    fs.facing = isLeft ? 'left' : isRight ? 'right' : fs.facing

    // check blocking
    const cameraTile = deps.tileMap.data[
      fs.cameraY * deps.tileMap.width + fs.cameraX
    ]

    if (deps.blocking.has(cameraTile)) {
      fs.cameraX = ocx
      fs.cameraY = ocy
    }
  }

  // consume all key presses
  presses.length = 0
}