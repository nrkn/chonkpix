// import { blit } from '../lib/image/blit.js'
// import { composite } from '../lib/image/composite.js'

// import { Maybe, Scene, State, T3 } from '../lib/types.js'
// import { assrt, maybe } from '../lib/util.js'
// import { drawFps } from './ranger/fps.js'
// import { rangerInit } from './ranger/init.js'
// import { rangerIo } from './ranger/io.js'

// import {
//   tileW, tileH, empty, tileCx, tileCy
// } from './ranger/tile-data.js'

// import { RangerDeps, RangerState, TileMap } from './ranger/types.js'

// export const rangerScene = (): Scene => {
//   let isActive = true
//   let deps: Maybe<RangerDeps> = null
//   let fstate: Maybe<RangerState> = null

//   const init = async (state: State) => {
//     const r = await rangerInit(state)

//     deps = r.deps
//     fstate = r.fstate
//   }

//   let cx = 0
//   let cy = 0
//   let availW = 0
//   let availH = 0
//   let colsPerSide = 0
//   let rowsPerSide = 0
//   let cols = 0
//   let rows = 0
//   let vLeft = 0
//   let vTop = 0

//   let prev: Maybe<number>[] = []
//   let current: Maybe<number>[] = []

//   const updateBuffer = (
//     buffer: Maybe<number>[], tileMap: TileMap,
//     cameraX: number, cameraY: number,
//     elapsed: number, emptyId: number
//   ) => {
//     const leftCol = cameraX - colsPerSide
//     const topRow = cameraY - rowsPerSide

//     for (let y = 0; y < rows; y++) {
//       const mapRow = topRow + y

//       for (let x = 0; x < cols; x++) {
//         const mapCol = leftCol + x
//         const viewIndex = y * cols + x

//         const inBounds = (
//           mapRow >= 0 && mapRow < tileMap.height &&
//           mapCol >= 0 && mapCol < tileMap.width
//         )

//         if (!inBounds) {
//           buffer[viewIndex] = emptyId

//           continue
//         }

//         const mapIndex = mapRow * tileMap.width + mapCol

//         const mapCell = tileMap.data[mapIndex]

//         const rectIndex = assrt(
//           typeof mapCell === 'number' ? mapCell : mapCell(elapsed),
//           'Expected rectIndex'
//         )

//         buffer[viewIndex] = rectIndex
//       }
//     }
//   }

//   const invalidated = (width: number, height: number) => {
//     cx = Math.floor(width / 2)
//     cy = Math.floor(height / 2)

//     availW = width - tileW
//     availH = height - tileH

//     colsPerSide = Math.ceil(availW / 2 / tileW)
//     rowsPerSide = Math.ceil(availH / 2 / tileH)

//     cols = colsPerSide * 2 + 1
//     rows = rowsPerSide * 2 + 1

//     vLeft = cx - colsPerSide * tileW - tileCx
//     vTop = cy - rowsPerSide * tileH - tileCy

//     prev = Array<number>(cols * rows)
//     current = Array<number>(cols * rows)
//   }

//   const update = (state: State) => {
//     if (!maybe(deps)) throw Error('Expected deps')
//     if (!maybe(fstate)) throw Error('Expected frameState')

//     if (isActive) {
//       rangerIo(state, deps, fstate)
//     }

//     const {
//       tiles, tileMap, sprites,
//       playerAnimLeft, playerAnimRight,
//       font, fontPts
//     } = deps

//     const [, , emptyId] = empty

//     const emptyRect = tiles.rects[emptyId]

//     const buffer = state.view.getBuffer()
//     const { width, height } = buffer

//     if (width !== fstate.lastW || height !== fstate.lastH) {
//       fstate.prevRectIndices.clear()
//     }

//     if (fstate.prevRectIndices.size === 0) {
//       // either first time, or size/zoom changed
//       invalidated(width, height)
//     }

//     fstate.lastW = width
//     fstate.lastH = height

//     const elapsed = state.time.getElapsed()

//     const playerRectIndex = assrt(
//       fstate.facing === 'left' ?
//         playerAnimLeft(elapsed) :
//         playerAnimRight(elapsed),
//       'Expected player rect'
//     )

//     const playerRect = sprites.rects[playerRectIndex]

//     const leftCol = fstate.cameraX - colsPerSide
//     const topRow = fstate.cameraY - rowsPerSide

//     // moved on both axes - just redraw everything
//     const movedBoth = fstate.moveCols && fstate.moveRows
//     // we can scroll most of the view and just blit the new rows or cols
//     const moved = fstate.moveCols || fstate.moveRows
//     // only animation has potentially changed
//     const movedNone = !moved

//     const drawAll = movedBoth || fstate.prevRectIndices.size === 0
//     const drawAnimOnly = !drawAll && movedNone
//     const drawScroll = !drawAll && moved

//     updateBuffer(
//       current, tileMap, fstate.cameraX, fstate.cameraY, elapsed, emptyId
//     )

//     // draw

//     let firstR = 0
//     let firstC = 0
//     let lastR = rows
//     let lastC = cols

//     if (drawScroll) {

//     }

//     for (let r = 0; r < rows; r++) {
//       const row = topRow + r
//       const vy = vTop + r * tileH

//       for (let c = 0; c < cols; c++) {
//         const col = leftCol + c
//         const vx = vLeft + c * tileW

//         const viewIndex = r * cols + c

//         const currentIndex = assrt(current[viewIndex], 'Expected currentIndex')
//         const rect = tiles.rects[currentIndex]

//         if (drawAll) {
//           blit(tiles.image, buffer, [...rect, vx, vy])
          
//           continue
//         }

//         const prevIndex = prev[viewIndex]

//         const tileIndex = row * tileMap.width + col

//         let isDraw = false

//         const isTileAnimated = deps.animatedTileIndices.has(tileIndex)

//       }
//     }

//     prev = current.slice()


//     // // for reference, old code:
//     // // old drawing loop - note that it was before we moved frameState into
//     // // fstate and dependencies into deps, so some of the vars below should
//     // // be renamed to fstate.xxx, or deps.xxx
//     // for (let r = 0; r < rows; r++) {
//     //   const row = topRow + r

//     //   const vy = vTop + r * tileH

//     //   for (let c = 0; c < cols; c++) {
//     //     const col = leftCol + c

//     //     const vx = vLeft + c * tileW

//     //     const viewIndex = r * cols + c

//     //     const prevRectIndex = prevRectIndices.get(viewIndex)

//     //     if (row < 0 || row >= tileMap.height || col < 0 || col >= tileMap.width) {
//     //       if (prevRectIndex !== emptyId) {
//     //         blit(tiles.image, buffer, [...emptyRect, vx, vy])
//     //       }

//     //       prevRectIndices.set(viewIndex, emptyId)

//     //       continue
//     //     }

//     //     const tileIndex = row * tileMap.width + col


//     //     const cell = tileMap.data[tileIndex]

//     //     const rectIndex = assrt(
//     //       typeof cell === 'number' ? cell : cell(elapsed),
//     //       `Expected rectIndex for cell ${cell}`
//     //     )

//     //     const isCenter = col === cameraX && row === cameraY

//     //     if (prevRectIndex !== rectIndex) {
//     //       const rect = tiles.rects[rectIndex]

//     //       blit(tiles.image, buffer, [...rect, vx, vy])
//     //     }

//     //     if (isCenter) {
//     //       composite(sprites.image, buffer, [...playerRect, vx, vy])
//     //       prevRectIndices.set(viewIndex, -1)
//     //     } else {
//     //       prevRectIndices.set(viewIndex, rectIndex)
//     //     }
//     //   }
//     // }

//     //

//     const cvx = cx - tileCx
//     const cvy = cy - tileCy

//     // always redraw the center tile 
//     if (
//       fstate.cameraY >= 0 && fstate.cameraY < tileMap.height &&
//       fstate.cameraX >= 0 && fstate.cameraX < tileMap.width
//     ) {
//       const tileIndex = fstate.cameraY * tileMap.width + fstate.cameraX
//       const rectIndex = assrt(
//         typeof tileMap.data[tileIndex] === 'number' ?
//           tileMap.data[tileIndex] :
//           tileMap.data[tileIndex](elapsed),
//         'Expected rectIndex'
//       )

//       const rect = tiles.rects[rectIndex]

//       blit(tiles.image, buffer, [...rect, cvx, cvy])
//     } else {
//       blit(tiles.image, buffer, [...emptyRect, cvx, cvy])
//     }

//     // always redraw the player
//     composite(sprites.image, buffer, [...playerRect, cvx, cvy])

//     fstate.moveCols = 0
//     fstate.moveRows = 0

//     // show fps
//     drawFps(state, font, width, buffer, fontPts)
//   }

//   const quit = async (_state: State) => {
//     deps = null
//     fstate = null
//   }

//   const setActive = (value: boolean) => {
//     isActive = value
//   }

//   return { init, update, quit, setActive }
// }
