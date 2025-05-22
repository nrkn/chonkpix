import { blit } from '../../../lib/image/blit.js'
import { composite } from '../../../lib/image/composite.js'
import { Maybe, Scene, State } from '../../../lib/types.js'
import { assrt, maybe } from '../../../lib/util.js'
import { drawFps } from './fps.js'
import { rangerInit } from './init.js'
import { rangerIo } from './io.js'
import { empty, tileCx, tileCy, tileH, tileW } from './tile-data.js'
import { RangerDeps, RangerState, ViewState } from './types.js'
import { setIndices, viewState } from './view-state.js'

export const rangerScene = (): Scene => {
  let isActive = true
  let deps: Maybe<RangerDeps>
  let fstate: Maybe<RangerState>
  let vstate: Maybe<ViewState>
  let invalidate: Maybe<(w: number, h: number) => void>

  let lastW = 0
  let lastH = 0

  const init = async (state: State) => {
    const r = await rangerInit(state)

    deps = r.deps
    fstate = r.fstate

    const v = viewState(lastW, lastH, tileW, tileH)

    vstate = v.state
    invalidate = v.invalidate
  }

  const update = (state: State) => {
    if (!maybe(deps)) throw Error('Expected deps')
    if (!maybe(fstate)) throw Error('Expected fstate')
    if (!maybe(vstate)) throw Error('Expected vstate')
    if (!maybe(invalidate)) throw Error('Expected invalidate')

    if (isActive) rangerIo(state, deps, fstate)

    const buffer = state.view.getBuffer()
    const elapsed = state.time.getElapsed()

    const [, , emptyId] = empty

    const emptyRect = deps.tiles.rects[emptyId]

    const { width, height } = buffer

    if (fstate.lastW !== width || fstate.lastH !== height) {
      invalidate(width, height)
      fstate.lastW = width
      fstate.lastH = height
    }

    const tileCol = fstate.cameraX + vstate.colLeft
    const tileRow = fstate.cameraY + vstate.rowTop

    setIndices(
      deps.tileMap, vstate.currIndices,
      tileCol, tileRow, vstate.cols, vstate.rows,
      elapsed, emptyId
    )

    for (let r = 0; r < vstate.rows; r++) {
      const dy = r * tileH + vstate.vTop

      for (let c = 0; c < vstate.cols; c++) {
        const tileIndex = r * vstate.cols + c

        const prev = vstate.prevIndices[tileIndex]
        const current = vstate.currIndices[tileIndex]!

        if (prev === current) {
          continue
        }

        const dx = c * tileW + vstate.vLeft
        const rect = deps.tiles.rects[current]

        blit(deps.tiles.image, buffer, [...rect, dx, dy])
      }
    }

    //

    const cvx = Math.floor(width / 2) - tileCx
    const cvy = Math.floor(height / 2) - tileCy

    // always redraw the center tile 
    if (
      fstate.cameraY >= 0 && fstate.cameraY < deps.tileMap.height &&
      fstate.cameraX >= 0 && fstate.cameraX < deps.tileMap.width
    ) {
      const tileIndex = fstate.cameraY * deps.tileMap.width + fstate.cameraX
      const tile = deps.tileMap.data[tileIndex]
      const rectIndex = assrt(
        typeof tile === 'number' ?
          tile :
          tile(elapsed),
        'Expected rectIndex'
      )

      const rect = deps.tiles.rects[rectIndex]

      blit(deps.tiles.image, buffer, [...rect, cvx, cvy])
    } else {
      blit(deps.tiles.image, buffer, [...emptyRect, cvx, cvy])
    }

    const playerRectIndex = assrt(
      fstate.facing === 'left' ?
        deps.playerAnimLeft(elapsed) :
        deps.playerAnimRight(elapsed),
      'Expected player rect'
    )

    const playerRect = deps.sprites.rects[playerRectIndex]

    // always redraw the player
    composite(deps.sprites.image, buffer, [...playerRect, cvx, cvy])

    // show fps
    drawFps(state, deps.font, width, buffer, deps.fontPts)

    //

    vstate.prevIndices = vstate.currIndices.slice()
  }

  const quit = async (_state: State) => {
    deps = null
    fstate = null
    vstate = null
  }

  const setActive = (active: boolean) => {
    isActive = active
  }

  return { init, update, quit, setActive }
}
