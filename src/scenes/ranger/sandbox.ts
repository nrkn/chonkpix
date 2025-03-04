// import { blit } from '../../lib/image/blit.js'
// import { TileSheet } from '../../lib/sprites/types.js'
// import { assrt } from '../../lib/util.js'
// import { TileMap } from './types.js'

// const currentTilemapValues = (
//   tilemap: TileMap, x: number, y: number, w: number, h: number, elapsed: number,
//   emptyId: number
// ) => {
//   const value = Array<number>(w * h)

//   for (let j = 0; j < h; j++) {
//     const row = j + y

//     for (let i = 0; i < w; i++) {
//       const col = i + x

//       const valIndex = j * w + i

//       if (row < 0 || row >= tilemap.height || col < 0 || col >= tilemap.width) {
//         value[valIndex] = emptyId
//         continue
//       }

//       const tileIndex = row * tilemap.width + col

//       const rectIndex = (
//         typeof tilemap.data[tileIndex] === 'number' ?
//           tilemap.data[tileIndex] :
//           assrt(tilemap.data[tileIndex](elapsed), 'Expected rectIndex')
//       )

//       value[valIndex] = rectIndex
//     }
//   }

//   return value
// }

// const setCurrentValues = (
//   value: number[],
//   tilemap: TileMap,
//   x: number, y: number, w: number, h: number,
//   elapsed: number, emptyId: number
// ) => {
//   for (let j = 0; j < h; j++) {
//     const row = j + y

//     for (let i = 0; i < w; i++) {
//       const col = i + x

//       const valIndex = j * w + i

//       if (row < 0 || row >= tilemap.height || col < 0 || col >= tilemap.width) {
//         value[valIndex] = emptyId
//         continue
//       }

//       const tileIndex = row * tilemap.width + col

//       const rectIndex = (
//         typeof tilemap.data[tileIndex] === 'number' ?
//           tilemap.data[tileIndex] :
//           assrt(tilemap.data[tileIndex](elapsed), 'Expected rectIndex')
//       )

//       value[valIndex] = rectIndex
//     }
//   }
// }

// const blitAllChanges = (
//   src: TileSheet, dest: ImageData,
//   prevIndices: number[], currentIndices: number[],
//   cols: number, rows: number, tileW: number, tileH: number,
//   dx: number, dy: number
// ) => {
//   for (let j = 0; j < rows; j++) {
//     const y = j * tileH + dy
//     const row = j * cols

//     for (let i = 0; i < rows; i++) {
//       const index = row + i
//       const prev = prevIndices[index]
//       const current = currentIndices[index]

//       if (prev === current) continue

//       const x = i * tileW + dx
//       const rect = src.rects[current]

//       blit(src.image, dest, [...rect, x, y])
//     }
//   }
// }

// const viewState = (
//   width: number, height: number,
//   tileW: number, tileH: number
// ) => {
//   const tileCx = Math.floor(tileW / 2)
//   const tileCy = Math.floor(tileH / 2)

//   const state = {
//     cols: 0,
//     rows: 0,
//     vLeft: 0,
//     vTop: 0,
//     prevIndices: Array<number>(),
//   }

//   const invalidate = (w: number, h: number) => {
//     width = w
//     height = h

//     const cx = Math.floor(width / 2)
//     const cy = Math.floor(height / 2)

//     const availW = width - tileW
//     const availH = height - tileH

//     const colsPerSide = Math.ceil(availW / 2 / tileW)
//     const rowsPerSide = Math.ceil(availH / 2 / tileH)

//     state.cols = colsPerSide * 2 + 1
//     state.rows = rowsPerSide * 2 + 1

//     state.vLeft = cx - colsPerSide * tileW - tileCx
//     state.vTop = cy - rowsPerSide * tileH - tileCy

//     state.prevIndices = Array<number>(state.cols * state.rows)
//   }

//   invalidate(width, height)

//   return { state, invalidate }
// }