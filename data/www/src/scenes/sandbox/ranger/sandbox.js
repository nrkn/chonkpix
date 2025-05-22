"use strict";
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2FuZGJveC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9zY2VuZXMvc2FuZGJveC9yYW5nZXIvc2FuZGJveC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsaURBQWlEO0FBQ2pELHlEQUF5RDtBQUN6RCw0Q0FBNEM7QUFDNUMsdUNBQXVDO0FBRXZDLGlDQUFpQztBQUNqQyxtRkFBbUY7QUFDbkYsb0JBQW9CO0FBQ3BCLFNBQVM7QUFDVCx1Q0FBdUM7QUFFdkMsa0NBQWtDO0FBQ2xDLHdCQUF3QjtBQUV4QixvQ0FBb0M7QUFDcEMsMEJBQTBCO0FBRTFCLG1DQUFtQztBQUVuQyxtRkFBbUY7QUFDbkYsb0NBQW9DO0FBQ3BDLG1CQUFtQjtBQUNuQixVQUFVO0FBRVYsb0RBQW9EO0FBRXBELDRCQUE0QjtBQUM1Qix3REFBd0Q7QUFDeEQsc0NBQXNDO0FBQ3RDLDBFQUEwRTtBQUMxRSxVQUFVO0FBRVYsb0NBQW9DO0FBQ3BDLFFBQVE7QUFDUixNQUFNO0FBRU4saUJBQWlCO0FBQ2pCLElBQUk7QUFFSiw2QkFBNkI7QUFDN0IscUJBQXFCO0FBQ3JCLHNCQUFzQjtBQUN0QixnREFBZ0Q7QUFDaEQscUNBQXFDO0FBQ3JDLFNBQVM7QUFDVCxrQ0FBa0M7QUFDbEMsd0JBQXdCO0FBRXhCLG9DQUFvQztBQUNwQywwQkFBMEI7QUFFMUIsbUNBQW1DO0FBRW5DLG1GQUFtRjtBQUNuRixvQ0FBb0M7QUFDcEMsbUJBQW1CO0FBQ25CLFVBQVU7QUFFVixvREFBb0Q7QUFFcEQsNEJBQTRCO0FBQzVCLHdEQUF3RDtBQUN4RCxzQ0FBc0M7QUFDdEMsMEVBQTBFO0FBQzFFLFVBQVU7QUFFVixvQ0FBb0M7QUFDcEMsUUFBUTtBQUNSLE1BQU07QUFDTixJQUFJO0FBRUosMkJBQTJCO0FBQzNCLHFDQUFxQztBQUNyQyxxREFBcUQ7QUFDckQsOERBQThEO0FBQzlELDJCQUEyQjtBQUMzQixTQUFTO0FBQ1QscUNBQXFDO0FBQ3JDLCtCQUErQjtBQUMvQiwyQkFBMkI7QUFFM0IsdUNBQXVDO0FBQ3ZDLDhCQUE4QjtBQUM5Qix3Q0FBd0M7QUFDeEMsOENBQThDO0FBRTlDLHVDQUF1QztBQUV2QyxpQ0FBaUM7QUFDakMsd0NBQXdDO0FBRXhDLCtDQUErQztBQUMvQyxRQUFRO0FBQ1IsTUFBTTtBQUNOLElBQUk7QUFFSixzQkFBc0I7QUFDdEIsbUNBQW1DO0FBQ25DLGlDQUFpQztBQUNqQyxTQUFTO0FBQ1QseUNBQXlDO0FBQ3pDLHlDQUF5QztBQUV6QyxvQkFBb0I7QUFDcEIsZUFBZTtBQUNmLGVBQWU7QUFDZixnQkFBZ0I7QUFDaEIsZUFBZTtBQUNmLG9DQUFvQztBQUNwQyxNQUFNO0FBRU4sbURBQW1EO0FBQ25ELGdCQUFnQjtBQUNoQixpQkFBaUI7QUFFakIsdUNBQXVDO0FBQ3ZDLHdDQUF3QztBQUV4QyxtQ0FBbUM7QUFDbkMsb0NBQW9DO0FBRXBDLHdEQUF3RDtBQUN4RCx3REFBd0Q7QUFFeEQsdUNBQXVDO0FBQ3ZDLHVDQUF1QztBQUV2QyxzREFBc0Q7QUFDdEQscURBQXFEO0FBRXJELGlFQUFpRTtBQUNqRSxNQUFNO0FBRU4sOEJBQThCO0FBRTlCLGlDQUFpQztBQUNqQyxJQUFJIiwic291cmNlc0NvbnRlbnQiOlsiLy8gaW1wb3J0IHsgYmxpdCB9IGZyb20gJy4uLy4uL2xpYi9pbWFnZS9ibGl0LmpzJ1xuLy8gaW1wb3J0IHsgVGlsZVNoZWV0IH0gZnJvbSAnLi4vLi4vbGliL3Nwcml0ZXMvdHlwZXMuanMnXG4vLyBpbXBvcnQgeyBhc3NydCB9IGZyb20gJy4uLy4uL2xpYi91dGlsLmpzJ1xuLy8gaW1wb3J0IHsgVGlsZU1hcCB9IGZyb20gJy4vdHlwZXMuanMnXG5cbi8vIGNvbnN0IGN1cnJlbnRUaWxlbWFwVmFsdWVzID0gKFxuLy8gICB0aWxlbWFwOiBUaWxlTWFwLCB4OiBudW1iZXIsIHk6IG51bWJlciwgdzogbnVtYmVyLCBoOiBudW1iZXIsIGVsYXBzZWQ6IG51bWJlcixcbi8vICAgZW1wdHlJZDogbnVtYmVyXG4vLyApID0+IHtcbi8vICAgY29uc3QgdmFsdWUgPSBBcnJheTxudW1iZXI+KHcgKiBoKVxuXG4vLyAgIGZvciAobGV0IGogPSAwOyBqIDwgaDsgaisrKSB7XG4vLyAgICAgY29uc3Qgcm93ID0gaiArIHlcblxuLy8gICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdzsgaSsrKSB7XG4vLyAgICAgICBjb25zdCBjb2wgPSBpICsgeFxuXG4vLyAgICAgICBjb25zdCB2YWxJbmRleCA9IGogKiB3ICsgaVxuXG4vLyAgICAgICBpZiAocm93IDwgMCB8fCByb3cgPj0gdGlsZW1hcC5oZWlnaHQgfHwgY29sIDwgMCB8fCBjb2wgPj0gdGlsZW1hcC53aWR0aCkge1xuLy8gICAgICAgICB2YWx1ZVt2YWxJbmRleF0gPSBlbXB0eUlkXG4vLyAgICAgICAgIGNvbnRpbnVlXG4vLyAgICAgICB9XG5cbi8vICAgICAgIGNvbnN0IHRpbGVJbmRleCA9IHJvdyAqIHRpbGVtYXAud2lkdGggKyBjb2xcblxuLy8gICAgICAgY29uc3QgcmVjdEluZGV4ID0gKFxuLy8gICAgICAgICB0eXBlb2YgdGlsZW1hcC5kYXRhW3RpbGVJbmRleF0gPT09ICdudW1iZXInID9cbi8vICAgICAgICAgICB0aWxlbWFwLmRhdGFbdGlsZUluZGV4XSA6XG4vLyAgICAgICAgICAgYXNzcnQodGlsZW1hcC5kYXRhW3RpbGVJbmRleF0oZWxhcHNlZCksICdFeHBlY3RlZCByZWN0SW5kZXgnKVxuLy8gICAgICAgKVxuXG4vLyAgICAgICB2YWx1ZVt2YWxJbmRleF0gPSByZWN0SW5kZXhcbi8vICAgICB9XG4vLyAgIH1cblxuLy8gICByZXR1cm4gdmFsdWVcbi8vIH1cblxuLy8gY29uc3Qgc2V0Q3VycmVudFZhbHVlcyA9IChcbi8vICAgdmFsdWU6IG51bWJlcltdLFxuLy8gICB0aWxlbWFwOiBUaWxlTWFwLFxuLy8gICB4OiBudW1iZXIsIHk6IG51bWJlciwgdzogbnVtYmVyLCBoOiBudW1iZXIsXG4vLyAgIGVsYXBzZWQ6IG51bWJlciwgZW1wdHlJZDogbnVtYmVyXG4vLyApID0+IHtcbi8vICAgZm9yIChsZXQgaiA9IDA7IGogPCBoOyBqKyspIHtcbi8vICAgICBjb25zdCByb3cgPSBqICsgeVxuXG4vLyAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB3OyBpKyspIHtcbi8vICAgICAgIGNvbnN0IGNvbCA9IGkgKyB4XG5cbi8vICAgICAgIGNvbnN0IHZhbEluZGV4ID0gaiAqIHcgKyBpXG5cbi8vICAgICAgIGlmIChyb3cgPCAwIHx8IHJvdyA+PSB0aWxlbWFwLmhlaWdodCB8fCBjb2wgPCAwIHx8IGNvbCA+PSB0aWxlbWFwLndpZHRoKSB7XG4vLyAgICAgICAgIHZhbHVlW3ZhbEluZGV4XSA9IGVtcHR5SWRcbi8vICAgICAgICAgY29udGludWVcbi8vICAgICAgIH1cblxuLy8gICAgICAgY29uc3QgdGlsZUluZGV4ID0gcm93ICogdGlsZW1hcC53aWR0aCArIGNvbFxuXG4vLyAgICAgICBjb25zdCByZWN0SW5kZXggPSAoXG4vLyAgICAgICAgIHR5cGVvZiB0aWxlbWFwLmRhdGFbdGlsZUluZGV4XSA9PT0gJ251bWJlcicgP1xuLy8gICAgICAgICAgIHRpbGVtYXAuZGF0YVt0aWxlSW5kZXhdIDpcbi8vICAgICAgICAgICBhc3NydCh0aWxlbWFwLmRhdGFbdGlsZUluZGV4XShlbGFwc2VkKSwgJ0V4cGVjdGVkIHJlY3RJbmRleCcpXG4vLyAgICAgICApXG5cbi8vICAgICAgIHZhbHVlW3ZhbEluZGV4XSA9IHJlY3RJbmRleFxuLy8gICAgIH1cbi8vICAgfVxuLy8gfVxuXG4vLyBjb25zdCBibGl0QWxsQ2hhbmdlcyA9IChcbi8vICAgc3JjOiBUaWxlU2hlZXQsIGRlc3Q6IEltYWdlRGF0YSxcbi8vICAgcHJldkluZGljZXM6IG51bWJlcltdLCBjdXJyZW50SW5kaWNlczogbnVtYmVyW10sXG4vLyAgIGNvbHM6IG51bWJlciwgcm93czogbnVtYmVyLCB0aWxlVzogbnVtYmVyLCB0aWxlSDogbnVtYmVyLFxuLy8gICBkeDogbnVtYmVyLCBkeTogbnVtYmVyXG4vLyApID0+IHtcbi8vICAgZm9yIChsZXQgaiA9IDA7IGogPCByb3dzOyBqKyspIHtcbi8vICAgICBjb25zdCB5ID0gaiAqIHRpbGVIICsgZHlcbi8vICAgICBjb25zdCByb3cgPSBqICogY29sc1xuXG4vLyAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCByb3dzOyBpKyspIHtcbi8vICAgICAgIGNvbnN0IGluZGV4ID0gcm93ICsgaVxuLy8gICAgICAgY29uc3QgcHJldiA9IHByZXZJbmRpY2VzW2luZGV4XVxuLy8gICAgICAgY29uc3QgY3VycmVudCA9IGN1cnJlbnRJbmRpY2VzW2luZGV4XVxuXG4vLyAgICAgICBpZiAocHJldiA9PT0gY3VycmVudCkgY29udGludWVcblxuLy8gICAgICAgY29uc3QgeCA9IGkgKiB0aWxlVyArIGR4XG4vLyAgICAgICBjb25zdCByZWN0ID0gc3JjLnJlY3RzW2N1cnJlbnRdXG5cbi8vICAgICAgIGJsaXQoc3JjLmltYWdlLCBkZXN0LCBbLi4ucmVjdCwgeCwgeV0pXG4vLyAgICAgfVxuLy8gICB9XG4vLyB9XG5cbi8vIGNvbnN0IHZpZXdTdGF0ZSA9IChcbi8vICAgd2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIsXG4vLyAgIHRpbGVXOiBudW1iZXIsIHRpbGVIOiBudW1iZXJcbi8vICkgPT4ge1xuLy8gICBjb25zdCB0aWxlQ3ggPSBNYXRoLmZsb29yKHRpbGVXIC8gMilcbi8vICAgY29uc3QgdGlsZUN5ID0gTWF0aC5mbG9vcih0aWxlSCAvIDIpXG5cbi8vICAgY29uc3Qgc3RhdGUgPSB7XG4vLyAgICAgY29sczogMCxcbi8vICAgICByb3dzOiAwLFxuLy8gICAgIHZMZWZ0OiAwLFxuLy8gICAgIHZUb3A6IDAsXG4vLyAgICAgcHJldkluZGljZXM6IEFycmF5PG51bWJlcj4oKSxcbi8vICAgfVxuXG4vLyAgIGNvbnN0IGludmFsaWRhdGUgPSAodzogbnVtYmVyLCBoOiBudW1iZXIpID0+IHtcbi8vICAgICB3aWR0aCA9IHdcbi8vICAgICBoZWlnaHQgPSBoXG5cbi8vICAgICBjb25zdCBjeCA9IE1hdGguZmxvb3Iod2lkdGggLyAyKVxuLy8gICAgIGNvbnN0IGN5ID0gTWF0aC5mbG9vcihoZWlnaHQgLyAyKVxuXG4vLyAgICAgY29uc3QgYXZhaWxXID0gd2lkdGggLSB0aWxlV1xuLy8gICAgIGNvbnN0IGF2YWlsSCA9IGhlaWdodCAtIHRpbGVIXG5cbi8vICAgICBjb25zdCBjb2xzUGVyU2lkZSA9IE1hdGguY2VpbChhdmFpbFcgLyAyIC8gdGlsZVcpXG4vLyAgICAgY29uc3Qgcm93c1BlclNpZGUgPSBNYXRoLmNlaWwoYXZhaWxIIC8gMiAvIHRpbGVIKVxuXG4vLyAgICAgc3RhdGUuY29scyA9IGNvbHNQZXJTaWRlICogMiArIDFcbi8vICAgICBzdGF0ZS5yb3dzID0gcm93c1BlclNpZGUgKiAyICsgMVxuXG4vLyAgICAgc3RhdGUudkxlZnQgPSBjeCAtIGNvbHNQZXJTaWRlICogdGlsZVcgLSB0aWxlQ3hcbi8vICAgICBzdGF0ZS52VG9wID0gY3kgLSByb3dzUGVyU2lkZSAqIHRpbGVIIC0gdGlsZUN5XG5cbi8vICAgICBzdGF0ZS5wcmV2SW5kaWNlcyA9IEFycmF5PG51bWJlcj4oc3RhdGUuY29scyAqIHN0YXRlLnJvd3MpXG4vLyAgIH1cblxuLy8gICBpbnZhbGlkYXRlKHdpZHRoLCBoZWlnaHQpXG5cbi8vICAgcmV0dXJuIHsgc3RhdGUsIGludmFsaWRhdGUgfVxuLy8gfSJdfQ==