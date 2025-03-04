"use strict";
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmFuZ2VyLXNjZW5lLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL3NjZW5lcy9yYW5nZXItc2NlbmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLDhDQUE4QztBQUM5Qyx3REFBd0Q7QUFFeEQsNERBQTREO0FBQzVELGdEQUFnRDtBQUNoRCw0Q0FBNEM7QUFDNUMsZ0RBQWdEO0FBQ2hELDRDQUE0QztBQUU1QyxXQUFXO0FBQ1gsd0NBQXdDO0FBQ3hDLGlDQUFpQztBQUVqQyx1RUFBdUU7QUFFdkUsNENBQTRDO0FBQzVDLHdCQUF3QjtBQUN4Qix1Q0FBdUM7QUFDdkMsMENBQTBDO0FBRTFDLDJDQUEyQztBQUMzQyx3Q0FBd0M7QUFFeEMsb0JBQW9CO0FBQ3BCLHdCQUF3QjtBQUN4QixNQUFNO0FBRU4sZUFBZTtBQUNmLGVBQWU7QUFDZixtQkFBbUI7QUFDbkIsbUJBQW1CO0FBQ25CLHdCQUF3QjtBQUN4Qix3QkFBd0I7QUFDeEIsaUJBQWlCO0FBQ2pCLGlCQUFpQjtBQUNqQixrQkFBa0I7QUFDbEIsaUJBQWlCO0FBRWpCLG1DQUFtQztBQUNuQyxzQ0FBc0M7QUFFdEMsMkJBQTJCO0FBQzNCLGlEQUFpRDtBQUNqRCx3Q0FBd0M7QUFDeEMsdUNBQXVDO0FBQ3ZDLFdBQVc7QUFDWCw0Q0FBNEM7QUFDNUMsMkNBQTJDO0FBRTNDLHVDQUF1QztBQUN2QyxrQ0FBa0M7QUFFbEMseUNBQXlDO0FBQ3pDLHFDQUFxQztBQUNyQyx5Q0FBeUM7QUFFekMsNkJBQTZCO0FBQzdCLHNEQUFzRDtBQUN0RCxrREFBa0Q7QUFDbEQsWUFBWTtBQUVaLDJCQUEyQjtBQUMzQix3Q0FBd0M7QUFFeEMscUJBQXFCO0FBQ3JCLFlBQVk7QUFFWiwyREFBMkQ7QUFFM0QsaURBQWlEO0FBRWpELG1DQUFtQztBQUNuQyxzRUFBc0U7QUFDdEUsaUNBQWlDO0FBQ2pDLFlBQVk7QUFFWix3Q0FBd0M7QUFDeEMsVUFBVTtBQUNWLFFBQVE7QUFDUixN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NEQ7QUFDNUQsUUFBUTtBQUVSLGtDQUFrQztBQUNsQyxrRUFBa0U7QUFFbEUsMEJBQTBCO0FBQzFCLDBCQUEwQjtBQUUxQixrQkFBa0I7QUFDbEIsbURBQW1EO0FBQ25ELE1BQU07QUFFTiw0Q0FBNEM7QUFDNUMsa0JBQWtCO0FBQ2xCLG9CQUFvQjtBQUNwQixNQUFNO0FBRU4sNENBQTRDO0FBQzVDLHVCQUF1QjtBQUN2QixNQUFNO0FBRU4sNkNBQTZDO0FBQzdDLElBQUkiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBpbXBvcnQgeyBibGl0IH0gZnJvbSAnLi4vbGliL2ltYWdlL2JsaXQuanMnXHJcbi8vIGltcG9ydCB7IGNvbXBvc2l0ZSB9IGZyb20gJy4uL2xpYi9pbWFnZS9jb21wb3NpdGUuanMnXHJcblxyXG4vLyBpbXBvcnQgeyBNYXliZSwgU2NlbmUsIFN0YXRlLCBUMyB9IGZyb20gJy4uL2xpYi90eXBlcy5qcydcclxuLy8gaW1wb3J0IHsgYXNzcnQsIG1heWJlIH0gZnJvbSAnLi4vbGliL3V0aWwuanMnXHJcbi8vIGltcG9ydCB7IGRyYXdGcHMgfSBmcm9tICcuL3Jhbmdlci9mcHMuanMnXHJcbi8vIGltcG9ydCB7IHJhbmdlckluaXQgfSBmcm9tICcuL3Jhbmdlci9pbml0LmpzJ1xyXG4vLyBpbXBvcnQgeyByYW5nZXJJbyB9IGZyb20gJy4vcmFuZ2VyL2lvLmpzJ1xyXG5cclxuLy8gaW1wb3J0IHtcclxuLy8gICB0aWxlVywgdGlsZUgsIGVtcHR5LCB0aWxlQ3gsIHRpbGVDeVxyXG4vLyB9IGZyb20gJy4vcmFuZ2VyL3RpbGUtZGF0YS5qcydcclxuXHJcbi8vIGltcG9ydCB7IFJhbmdlckRlcHMsIFJhbmdlclN0YXRlLCBUaWxlTWFwIH0gZnJvbSAnLi9yYW5nZXIvdHlwZXMuanMnXHJcblxyXG4vLyBleHBvcnQgY29uc3QgcmFuZ2VyU2NlbmUgPSAoKTogU2NlbmUgPT4ge1xyXG4vLyAgIGxldCBpc0FjdGl2ZSA9IHRydWVcclxuLy8gICBsZXQgZGVwczogTWF5YmU8UmFuZ2VyRGVwcz4gPSBudWxsXHJcbi8vICAgbGV0IGZzdGF0ZTogTWF5YmU8UmFuZ2VyU3RhdGU+ID0gbnVsbFxyXG5cclxuLy8gICBjb25zdCBpbml0ID0gYXN5bmMgKHN0YXRlOiBTdGF0ZSkgPT4ge1xyXG4vLyAgICAgY29uc3QgciA9IGF3YWl0IHJhbmdlckluaXQoc3RhdGUpXHJcblxyXG4vLyAgICAgZGVwcyA9IHIuZGVwc1xyXG4vLyAgICAgZnN0YXRlID0gci5mc3RhdGVcclxuLy8gICB9XHJcblxyXG4vLyAgIGxldCBjeCA9IDBcclxuLy8gICBsZXQgY3kgPSAwXHJcbi8vICAgbGV0IGF2YWlsVyA9IDBcclxuLy8gICBsZXQgYXZhaWxIID0gMFxyXG4vLyAgIGxldCBjb2xzUGVyU2lkZSA9IDBcclxuLy8gICBsZXQgcm93c1BlclNpZGUgPSAwXHJcbi8vICAgbGV0IGNvbHMgPSAwXHJcbi8vICAgbGV0IHJvd3MgPSAwXHJcbi8vICAgbGV0IHZMZWZ0ID0gMFxyXG4vLyAgIGxldCB2VG9wID0gMFxyXG5cclxuLy8gICBsZXQgcHJldjogTWF5YmU8bnVtYmVyPltdID0gW11cclxuLy8gICBsZXQgY3VycmVudDogTWF5YmU8bnVtYmVyPltdID0gW11cclxuXHJcbi8vICAgY29uc3QgdXBkYXRlQnVmZmVyID0gKFxyXG4vLyAgICAgYnVmZmVyOiBNYXliZTxudW1iZXI+W10sIHRpbGVNYXA6IFRpbGVNYXAsXHJcbi8vICAgICBjYW1lcmFYOiBudW1iZXIsIGNhbWVyYVk6IG51bWJlcixcclxuLy8gICAgIGVsYXBzZWQ6IG51bWJlciwgZW1wdHlJZDogbnVtYmVyXHJcbi8vICAgKSA9PiB7XHJcbi8vICAgICBjb25zdCBsZWZ0Q29sID0gY2FtZXJhWCAtIGNvbHNQZXJTaWRlXHJcbi8vICAgICBjb25zdCB0b3BSb3cgPSBjYW1lcmFZIC0gcm93c1BlclNpZGVcclxuXHJcbi8vICAgICBmb3IgKGxldCB5ID0gMDsgeSA8IHJvd3M7IHkrKykge1xyXG4vLyAgICAgICBjb25zdCBtYXBSb3cgPSB0b3BSb3cgKyB5XHJcblxyXG4vLyAgICAgICBmb3IgKGxldCB4ID0gMDsgeCA8IGNvbHM7IHgrKykge1xyXG4vLyAgICAgICAgIGNvbnN0IG1hcENvbCA9IGxlZnRDb2wgKyB4XHJcbi8vICAgICAgICAgY29uc3Qgdmlld0luZGV4ID0geSAqIGNvbHMgKyB4XHJcblxyXG4vLyAgICAgICAgIGNvbnN0IGluQm91bmRzID0gKFxyXG4vLyAgICAgICAgICAgbWFwUm93ID49IDAgJiYgbWFwUm93IDwgdGlsZU1hcC5oZWlnaHQgJiZcclxuLy8gICAgICAgICAgIG1hcENvbCA+PSAwICYmIG1hcENvbCA8IHRpbGVNYXAud2lkdGhcclxuLy8gICAgICAgICApXHJcblxyXG4vLyAgICAgICAgIGlmICghaW5Cb3VuZHMpIHtcclxuLy8gICAgICAgICAgIGJ1ZmZlclt2aWV3SW5kZXhdID0gZW1wdHlJZFxyXG5cclxuLy8gICAgICAgICAgIGNvbnRpbnVlXHJcbi8vICAgICAgICAgfVxyXG5cclxuLy8gICAgICAgICBjb25zdCBtYXBJbmRleCA9IG1hcFJvdyAqIHRpbGVNYXAud2lkdGggKyBtYXBDb2xcclxuXHJcbi8vICAgICAgICAgY29uc3QgbWFwQ2VsbCA9IHRpbGVNYXAuZGF0YVttYXBJbmRleF1cclxuXHJcbi8vICAgICAgICAgY29uc3QgcmVjdEluZGV4ID0gYXNzcnQoXHJcbi8vICAgICAgICAgICB0eXBlb2YgbWFwQ2VsbCA9PT0gJ251bWJlcicgPyBtYXBDZWxsIDogbWFwQ2VsbChlbGFwc2VkKSxcclxuLy8gICAgICAgICAgICdFeHBlY3RlZCByZWN0SW5kZXgnXHJcbi8vICAgICAgICAgKVxyXG5cclxuLy8gICAgICAgICBidWZmZXJbdmlld0luZGV4XSA9IHJlY3RJbmRleFxyXG4vLyAgICAgICB9XHJcbi8vICAgICB9XHJcbi8vICAgfVxyXG5cclxuLy8gICBjb25zdCBpbnZhbGlkYXRlZCA9ICh3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlcikgPT4ge1xyXG4vLyAgICAgY3ggPSBNYXRoLmZsb29yKHdpZHRoIC8gMilcclxuLy8gICAgIGN5ID0gTWF0aC5mbG9vcihoZWlnaHQgLyAyKVxyXG5cclxuLy8gICAgIGF2YWlsVyA9IHdpZHRoIC0gdGlsZVdcclxuLy8gICAgIGF2YWlsSCA9IGhlaWdodCAtIHRpbGVIXHJcblxyXG4vLyAgICAgY29sc1BlclNpZGUgPSBNYXRoLmNlaWwoYXZhaWxXIC8gMiAvIHRpbGVXKVxyXG4vLyAgICAgcm93c1BlclNpZGUgPSBNYXRoLmNlaWwoYXZhaWxIIC8gMiAvIHRpbGVIKVxyXG5cclxuLy8gICAgIGNvbHMgPSBjb2xzUGVyU2lkZSAqIDIgKyAxXHJcbi8vICAgICByb3dzID0gcm93c1BlclNpZGUgKiAyICsgMVxyXG5cclxuLy8gICAgIHZMZWZ0ID0gY3ggLSBjb2xzUGVyU2lkZSAqIHRpbGVXIC0gdGlsZUN4XHJcbi8vICAgICB2VG9wID0gY3kgLSByb3dzUGVyU2lkZSAqIHRpbGVIIC0gdGlsZUN5XHJcblxyXG4vLyAgICAgcHJldiA9IEFycmF5PG51bWJlcj4oY29scyAqIHJvd3MpXHJcbi8vICAgICBjdXJyZW50ID0gQXJyYXk8bnVtYmVyPihjb2xzICogcm93cylcclxuLy8gICB9XHJcblxyXG4vLyAgIGNvbnN0IHVwZGF0ZSA9IChzdGF0ZTogU3RhdGUpID0+IHtcclxuLy8gICAgIGlmICghbWF5YmUoZGVwcykpIHRocm93IEVycm9yKCdFeHBlY3RlZCBkZXBzJylcclxuLy8gICAgIGlmICghbWF5YmUoZnN0YXRlKSkgdGhyb3cgRXJyb3IoJ0V4cGVjdGVkIGZyYW1lU3RhdGUnKVxyXG5cclxuLy8gICAgIGlmIChpc0FjdGl2ZSkge1xyXG4vLyAgICAgICByYW5nZXJJbyhzdGF0ZSwgZGVwcywgZnN0YXRlKVxyXG4vLyAgICAgfVxyXG5cclxuLy8gICAgIGNvbnN0IHtcclxuLy8gICAgICAgdGlsZXMsIHRpbGVNYXAsIHNwcml0ZXMsXHJcbi8vICAgICAgIHBsYXllckFuaW1MZWZ0LCBwbGF5ZXJBbmltUmlnaHQsXHJcbi8vICAgICAgIGZvbnQsIGZvbnRQdHNcclxuLy8gICAgIH0gPSBkZXBzXHJcblxyXG4vLyAgICAgY29uc3QgWywgLCBlbXB0eUlkXSA9IGVtcHR5XHJcblxyXG4vLyAgICAgY29uc3QgZW1wdHlSZWN0ID0gdGlsZXMucmVjdHNbZW1wdHlJZF1cclxuXHJcbi8vICAgICBjb25zdCBidWZmZXIgPSBzdGF0ZS52aWV3LmdldEJ1ZmZlcigpXHJcbi8vICAgICBjb25zdCB7IHdpZHRoLCBoZWlnaHQgfSA9IGJ1ZmZlclxyXG5cclxuLy8gICAgIGlmICh3aWR0aCAhPT0gZnN0YXRlLmxhc3RXIHx8IGhlaWdodCAhPT0gZnN0YXRlLmxhc3RIKSB7XHJcbi8vICAgICAgIGZzdGF0ZS5wcmV2UmVjdEluZGljZXMuY2xlYXIoKVxyXG4vLyAgICAgfVxyXG5cclxuLy8gICAgIGlmIChmc3RhdGUucHJldlJlY3RJbmRpY2VzLnNpemUgPT09IDApIHtcclxuLy8gICAgICAgLy8gZWl0aGVyIGZpcnN0IHRpbWUsIG9yIHNpemUvem9vbSBjaGFuZ2VkXHJcbi8vICAgICAgIGludmFsaWRhdGVkKHdpZHRoLCBoZWlnaHQpXHJcbi8vICAgICB9XHJcblxyXG4vLyAgICAgZnN0YXRlLmxhc3RXID0gd2lkdGhcclxuLy8gICAgIGZzdGF0ZS5sYXN0SCA9IGhlaWdodFxyXG5cclxuLy8gICAgIGNvbnN0IGVsYXBzZWQgPSBzdGF0ZS50aW1lLmdldEVsYXBzZWQoKVxyXG5cclxuLy8gICAgIGNvbnN0IHBsYXllclJlY3RJbmRleCA9IGFzc3J0KFxyXG4vLyAgICAgICBmc3RhdGUuZmFjaW5nID09PSAnbGVmdCcgP1xyXG4vLyAgICAgICAgIHBsYXllckFuaW1MZWZ0KGVsYXBzZWQpIDpcclxuLy8gICAgICAgICBwbGF5ZXJBbmltUmlnaHQoZWxhcHNlZCksXHJcbi8vICAgICAgICdFeHBlY3RlZCBwbGF5ZXIgcmVjdCdcclxuLy8gICAgIClcclxuXHJcbi8vICAgICBjb25zdCBwbGF5ZXJSZWN0ID0gc3ByaXRlcy5yZWN0c1twbGF5ZXJSZWN0SW5kZXhdXHJcblxyXG4vLyAgICAgY29uc3QgbGVmdENvbCA9IGZzdGF0ZS5jYW1lcmFYIC0gY29sc1BlclNpZGVcclxuLy8gICAgIGNvbnN0IHRvcFJvdyA9IGZzdGF0ZS5jYW1lcmFZIC0gcm93c1BlclNpZGVcclxuXHJcbi8vICAgICAvLyBtb3ZlZCBvbiBib3RoIGF4ZXMgLSBqdXN0IHJlZHJhdyBldmVyeXRoaW5nXHJcbi8vICAgICBjb25zdCBtb3ZlZEJvdGggPSBmc3RhdGUubW92ZUNvbHMgJiYgZnN0YXRlLm1vdmVSb3dzXHJcbi8vICAgICAvLyB3ZSBjYW4gc2Nyb2xsIG1vc3Qgb2YgdGhlIHZpZXcgYW5kIGp1c3QgYmxpdCB0aGUgbmV3IHJvd3Mgb3IgY29sc1xyXG4vLyAgICAgY29uc3QgbW92ZWQgPSBmc3RhdGUubW92ZUNvbHMgfHwgZnN0YXRlLm1vdmVSb3dzXHJcbi8vICAgICAvLyBvbmx5IGFuaW1hdGlvbiBoYXMgcG90ZW50aWFsbHkgY2hhbmdlZFxyXG4vLyAgICAgY29uc3QgbW92ZWROb25lID0gIW1vdmVkXHJcblxyXG4vLyAgICAgY29uc3QgZHJhd0FsbCA9IG1vdmVkQm90aCB8fCBmc3RhdGUucHJldlJlY3RJbmRpY2VzLnNpemUgPT09IDBcclxuLy8gICAgIGNvbnN0IGRyYXdBbmltT25seSA9ICFkcmF3QWxsICYmIG1vdmVkTm9uZVxyXG4vLyAgICAgY29uc3QgZHJhd1Njcm9sbCA9ICFkcmF3QWxsICYmIG1vdmVkXHJcblxyXG4vLyAgICAgdXBkYXRlQnVmZmVyKFxyXG4vLyAgICAgICBjdXJyZW50LCB0aWxlTWFwLCBmc3RhdGUuY2FtZXJhWCwgZnN0YXRlLmNhbWVyYVksIGVsYXBzZWQsIGVtcHR5SWRcclxuLy8gICAgIClcclxuXHJcbi8vICAgICAvLyBkcmF3XHJcblxyXG4vLyAgICAgbGV0IGZpcnN0UiA9IDBcclxuLy8gICAgIGxldCBmaXJzdEMgPSAwXHJcbi8vICAgICBsZXQgbGFzdFIgPSByb3dzXHJcbi8vICAgICBsZXQgbGFzdEMgPSBjb2xzXHJcblxyXG4vLyAgICAgaWYgKGRyYXdTY3JvbGwpIHtcclxuXHJcbi8vICAgICB9XHJcblxyXG4vLyAgICAgZm9yIChsZXQgciA9IDA7IHIgPCByb3dzOyByKyspIHtcclxuLy8gICAgICAgY29uc3Qgcm93ID0gdG9wUm93ICsgclxyXG4vLyAgICAgICBjb25zdCB2eSA9IHZUb3AgKyByICogdGlsZUhcclxuXHJcbi8vICAgICAgIGZvciAobGV0IGMgPSAwOyBjIDwgY29sczsgYysrKSB7XHJcbi8vICAgICAgICAgY29uc3QgY29sID0gbGVmdENvbCArIGNcclxuLy8gICAgICAgICBjb25zdCB2eCA9IHZMZWZ0ICsgYyAqIHRpbGVXXHJcblxyXG4vLyAgICAgICAgIGNvbnN0IHZpZXdJbmRleCA9IHIgKiBjb2xzICsgY1xyXG5cclxuLy8gICAgICAgICBjb25zdCBjdXJyZW50SW5kZXggPSBhc3NydChjdXJyZW50W3ZpZXdJbmRleF0sICdFeHBlY3RlZCBjdXJyZW50SW5kZXgnKVxyXG4vLyAgICAgICAgIGNvbnN0IHJlY3QgPSB0aWxlcy5yZWN0c1tjdXJyZW50SW5kZXhdXHJcblxyXG4vLyAgICAgICAgIGlmIChkcmF3QWxsKSB7XHJcbi8vICAgICAgICAgICBibGl0KHRpbGVzLmltYWdlLCBidWZmZXIsIFsuLi5yZWN0LCB2eCwgdnldKVxyXG4gICAgICAgICAgXHJcbi8vICAgICAgICAgICBjb250aW51ZVxyXG4vLyAgICAgICAgIH1cclxuXHJcbi8vICAgICAgICAgY29uc3QgcHJldkluZGV4ID0gcHJldlt2aWV3SW5kZXhdXHJcblxyXG4vLyAgICAgICAgIGNvbnN0IHRpbGVJbmRleCA9IHJvdyAqIHRpbGVNYXAud2lkdGggKyBjb2xcclxuXHJcbi8vICAgICAgICAgbGV0IGlzRHJhdyA9IGZhbHNlXHJcblxyXG4vLyAgICAgICAgIGNvbnN0IGlzVGlsZUFuaW1hdGVkID0gZGVwcy5hbmltYXRlZFRpbGVJbmRpY2VzLmhhcyh0aWxlSW5kZXgpXHJcblxyXG4vLyAgICAgICB9XHJcbi8vICAgICB9XHJcblxyXG4vLyAgICAgcHJldiA9IGN1cnJlbnQuc2xpY2UoKVxyXG5cclxuXHJcbi8vICAgICAvLyAvLyBmb3IgcmVmZXJlbmNlLCBvbGQgY29kZTpcclxuLy8gICAgIC8vIC8vIG9sZCBkcmF3aW5nIGxvb3AgLSBub3RlIHRoYXQgaXQgd2FzIGJlZm9yZSB3ZSBtb3ZlZCBmcmFtZVN0YXRlIGludG9cclxuLy8gICAgIC8vIC8vIGZzdGF0ZSBhbmQgZGVwZW5kZW5jaWVzIGludG8gZGVwcywgc28gc29tZSBvZiB0aGUgdmFycyBiZWxvdyBzaG91bGRcclxuLy8gICAgIC8vIC8vIGJlIHJlbmFtZWQgdG8gZnN0YXRlLnh4eCwgb3IgZGVwcy54eHhcclxuLy8gICAgIC8vIGZvciAobGV0IHIgPSAwOyByIDwgcm93czsgcisrKSB7XHJcbi8vICAgICAvLyAgIGNvbnN0IHJvdyA9IHRvcFJvdyArIHJcclxuXHJcbi8vICAgICAvLyAgIGNvbnN0IHZ5ID0gdlRvcCArIHIgKiB0aWxlSFxyXG5cclxuLy8gICAgIC8vICAgZm9yIChsZXQgYyA9IDA7IGMgPCBjb2xzOyBjKyspIHtcclxuLy8gICAgIC8vICAgICBjb25zdCBjb2wgPSBsZWZ0Q29sICsgY1xyXG5cclxuLy8gICAgIC8vICAgICBjb25zdCB2eCA9IHZMZWZ0ICsgYyAqIHRpbGVXXHJcblxyXG4vLyAgICAgLy8gICAgIGNvbnN0IHZpZXdJbmRleCA9IHIgKiBjb2xzICsgY1xyXG5cclxuLy8gICAgIC8vICAgICBjb25zdCBwcmV2UmVjdEluZGV4ID0gcHJldlJlY3RJbmRpY2VzLmdldCh2aWV3SW5kZXgpXHJcblxyXG4vLyAgICAgLy8gICAgIGlmIChyb3cgPCAwIHx8IHJvdyA+PSB0aWxlTWFwLmhlaWdodCB8fCBjb2wgPCAwIHx8IGNvbCA+PSB0aWxlTWFwLndpZHRoKSB7XHJcbi8vICAgICAvLyAgICAgICBpZiAocHJldlJlY3RJbmRleCAhPT0gZW1wdHlJZCkge1xyXG4vLyAgICAgLy8gICAgICAgICBibGl0KHRpbGVzLmltYWdlLCBidWZmZXIsIFsuLi5lbXB0eVJlY3QsIHZ4LCB2eV0pXHJcbi8vICAgICAvLyAgICAgICB9XHJcblxyXG4vLyAgICAgLy8gICAgICAgcHJldlJlY3RJbmRpY2VzLnNldCh2aWV3SW5kZXgsIGVtcHR5SWQpXHJcblxyXG4vLyAgICAgLy8gICAgICAgY29udGludWVcclxuLy8gICAgIC8vICAgICB9XHJcblxyXG4vLyAgICAgLy8gICAgIGNvbnN0IHRpbGVJbmRleCA9IHJvdyAqIHRpbGVNYXAud2lkdGggKyBjb2xcclxuXHJcblxyXG4vLyAgICAgLy8gICAgIGNvbnN0IGNlbGwgPSB0aWxlTWFwLmRhdGFbdGlsZUluZGV4XVxyXG5cclxuLy8gICAgIC8vICAgICBjb25zdCByZWN0SW5kZXggPSBhc3NydChcclxuLy8gICAgIC8vICAgICAgIHR5cGVvZiBjZWxsID09PSAnbnVtYmVyJyA/IGNlbGwgOiBjZWxsKGVsYXBzZWQpLFxyXG4vLyAgICAgLy8gICAgICAgYEV4cGVjdGVkIHJlY3RJbmRleCBmb3IgY2VsbCAke2NlbGx9YFxyXG4vLyAgICAgLy8gICAgIClcclxuXHJcbi8vICAgICAvLyAgICAgY29uc3QgaXNDZW50ZXIgPSBjb2wgPT09IGNhbWVyYVggJiYgcm93ID09PSBjYW1lcmFZXHJcblxyXG4vLyAgICAgLy8gICAgIGlmIChwcmV2UmVjdEluZGV4ICE9PSByZWN0SW5kZXgpIHtcclxuLy8gICAgIC8vICAgICAgIGNvbnN0IHJlY3QgPSB0aWxlcy5yZWN0c1tyZWN0SW5kZXhdXHJcblxyXG4vLyAgICAgLy8gICAgICAgYmxpdCh0aWxlcy5pbWFnZSwgYnVmZmVyLCBbLi4ucmVjdCwgdngsIHZ5XSlcclxuLy8gICAgIC8vICAgICB9XHJcblxyXG4vLyAgICAgLy8gICAgIGlmIChpc0NlbnRlcikge1xyXG4vLyAgICAgLy8gICAgICAgY29tcG9zaXRlKHNwcml0ZXMuaW1hZ2UsIGJ1ZmZlciwgWy4uLnBsYXllclJlY3QsIHZ4LCB2eV0pXHJcbi8vICAgICAvLyAgICAgICBwcmV2UmVjdEluZGljZXMuc2V0KHZpZXdJbmRleCwgLTEpXHJcbi8vICAgICAvLyAgICAgfSBlbHNlIHtcclxuLy8gICAgIC8vICAgICAgIHByZXZSZWN0SW5kaWNlcy5zZXQodmlld0luZGV4LCByZWN0SW5kZXgpXHJcbi8vICAgICAvLyAgICAgfVxyXG4vLyAgICAgLy8gICB9XHJcbi8vICAgICAvLyB9XHJcblxyXG4vLyAgICAgLy9cclxuXHJcbi8vICAgICBjb25zdCBjdnggPSBjeCAtIHRpbGVDeFxyXG4vLyAgICAgY29uc3QgY3Z5ID0gY3kgLSB0aWxlQ3lcclxuXHJcbi8vICAgICAvLyBhbHdheXMgcmVkcmF3IHRoZSBjZW50ZXIgdGlsZSBcclxuLy8gICAgIGlmIChcclxuLy8gICAgICAgZnN0YXRlLmNhbWVyYVkgPj0gMCAmJiBmc3RhdGUuY2FtZXJhWSA8IHRpbGVNYXAuaGVpZ2h0ICYmXHJcbi8vICAgICAgIGZzdGF0ZS5jYW1lcmFYID49IDAgJiYgZnN0YXRlLmNhbWVyYVggPCB0aWxlTWFwLndpZHRoXHJcbi8vICAgICApIHtcclxuLy8gICAgICAgY29uc3QgdGlsZUluZGV4ID0gZnN0YXRlLmNhbWVyYVkgKiB0aWxlTWFwLndpZHRoICsgZnN0YXRlLmNhbWVyYVhcclxuLy8gICAgICAgY29uc3QgcmVjdEluZGV4ID0gYXNzcnQoXHJcbi8vICAgICAgICAgdHlwZW9mIHRpbGVNYXAuZGF0YVt0aWxlSW5kZXhdID09PSAnbnVtYmVyJyA/XHJcbi8vICAgICAgICAgICB0aWxlTWFwLmRhdGFbdGlsZUluZGV4XSA6XHJcbi8vICAgICAgICAgICB0aWxlTWFwLmRhdGFbdGlsZUluZGV4XShlbGFwc2VkKSxcclxuLy8gICAgICAgICAnRXhwZWN0ZWQgcmVjdEluZGV4J1xyXG4vLyAgICAgICApXHJcblxyXG4vLyAgICAgICBjb25zdCByZWN0ID0gdGlsZXMucmVjdHNbcmVjdEluZGV4XVxyXG5cclxuLy8gICAgICAgYmxpdCh0aWxlcy5pbWFnZSwgYnVmZmVyLCBbLi4ucmVjdCwgY3Z4LCBjdnldKVxyXG4vLyAgICAgfSBlbHNlIHtcclxuLy8gICAgICAgYmxpdCh0aWxlcy5pbWFnZSwgYnVmZmVyLCBbLi4uZW1wdHlSZWN0LCBjdngsIGN2eV0pXHJcbi8vICAgICB9XHJcblxyXG4vLyAgICAgLy8gYWx3YXlzIHJlZHJhdyB0aGUgcGxheWVyXHJcbi8vICAgICBjb21wb3NpdGUoc3ByaXRlcy5pbWFnZSwgYnVmZmVyLCBbLi4ucGxheWVyUmVjdCwgY3Z4LCBjdnldKVxyXG5cclxuLy8gICAgIGZzdGF0ZS5tb3ZlQ29scyA9IDBcclxuLy8gICAgIGZzdGF0ZS5tb3ZlUm93cyA9IDBcclxuXHJcbi8vICAgICAvLyBzaG93IGZwc1xyXG4vLyAgICAgZHJhd0ZwcyhzdGF0ZSwgZm9udCwgd2lkdGgsIGJ1ZmZlciwgZm9udFB0cylcclxuLy8gICB9XHJcblxyXG4vLyAgIGNvbnN0IHF1aXQgPSBhc3luYyAoX3N0YXRlOiBTdGF0ZSkgPT4ge1xyXG4vLyAgICAgZGVwcyA9IG51bGxcclxuLy8gICAgIGZzdGF0ZSA9IG51bGxcclxuLy8gICB9XHJcblxyXG4vLyAgIGNvbnN0IHNldEFjdGl2ZSA9ICh2YWx1ZTogYm9vbGVhbikgPT4ge1xyXG4vLyAgICAgaXNBY3RpdmUgPSB2YWx1ZVxyXG4vLyAgIH1cclxuXHJcbi8vICAgcmV0dXJuIHsgaW5pdCwgdXBkYXRlLCBxdWl0LCBzZXRBY3RpdmUgfVxyXG4vLyB9XHJcbiJdfQ==