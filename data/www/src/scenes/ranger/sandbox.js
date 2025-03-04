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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2FuZGJveC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9zY2VuZXMvcmFuZ2VyL3NhbmRib3gudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGlEQUFpRDtBQUNqRCx5REFBeUQ7QUFDekQsNENBQTRDO0FBQzVDLHVDQUF1QztBQUV2QyxpQ0FBaUM7QUFDakMsbUZBQW1GO0FBQ25GLG9CQUFvQjtBQUNwQixTQUFTO0FBQ1QsdUNBQXVDO0FBRXZDLGtDQUFrQztBQUNsQyx3QkFBd0I7QUFFeEIsb0NBQW9DO0FBQ3BDLDBCQUEwQjtBQUUxQixtQ0FBbUM7QUFFbkMsbUZBQW1GO0FBQ25GLG9DQUFvQztBQUNwQyxtQkFBbUI7QUFDbkIsVUFBVTtBQUVWLG9EQUFvRDtBQUVwRCw0QkFBNEI7QUFDNUIsd0RBQXdEO0FBQ3hELHNDQUFzQztBQUN0QywwRUFBMEU7QUFDMUUsVUFBVTtBQUVWLG9DQUFvQztBQUNwQyxRQUFRO0FBQ1IsTUFBTTtBQUVOLGlCQUFpQjtBQUNqQixJQUFJO0FBRUosNkJBQTZCO0FBQzdCLHFCQUFxQjtBQUNyQixzQkFBc0I7QUFDdEIsZ0RBQWdEO0FBQ2hELHFDQUFxQztBQUNyQyxTQUFTO0FBQ1Qsa0NBQWtDO0FBQ2xDLHdCQUF3QjtBQUV4QixvQ0FBb0M7QUFDcEMsMEJBQTBCO0FBRTFCLG1DQUFtQztBQUVuQyxtRkFBbUY7QUFDbkYsb0NBQW9DO0FBQ3BDLG1CQUFtQjtBQUNuQixVQUFVO0FBRVYsb0RBQW9EO0FBRXBELDRCQUE0QjtBQUM1Qix3REFBd0Q7QUFDeEQsc0NBQXNDO0FBQ3RDLDBFQUEwRTtBQUMxRSxVQUFVO0FBRVYsb0NBQW9DO0FBQ3BDLFFBQVE7QUFDUixNQUFNO0FBQ04sSUFBSTtBQUVKLDJCQUEyQjtBQUMzQixxQ0FBcUM7QUFDckMscURBQXFEO0FBQ3JELDhEQUE4RDtBQUM5RCwyQkFBMkI7QUFDM0IsU0FBUztBQUNULHFDQUFxQztBQUNyQywrQkFBK0I7QUFDL0IsMkJBQTJCO0FBRTNCLHVDQUF1QztBQUN2Qyw4QkFBOEI7QUFDOUIsd0NBQXdDO0FBQ3hDLDhDQUE4QztBQUU5Qyx1Q0FBdUM7QUFFdkMsaUNBQWlDO0FBQ2pDLHdDQUF3QztBQUV4QywrQ0FBK0M7QUFDL0MsUUFBUTtBQUNSLE1BQU07QUFDTixJQUFJO0FBRUosc0JBQXNCO0FBQ3RCLG1DQUFtQztBQUNuQyxpQ0FBaUM7QUFDakMsU0FBUztBQUNULHlDQUF5QztBQUN6Qyx5Q0FBeUM7QUFFekMsb0JBQW9CO0FBQ3BCLGVBQWU7QUFDZixlQUFlO0FBQ2YsZ0JBQWdCO0FBQ2hCLGVBQWU7QUFDZixvQ0FBb0M7QUFDcEMsTUFBTTtBQUVOLG1EQUFtRDtBQUNuRCxnQkFBZ0I7QUFDaEIsaUJBQWlCO0FBRWpCLHVDQUF1QztBQUN2Qyx3Q0FBd0M7QUFFeEMsbUNBQW1DO0FBQ25DLG9DQUFvQztBQUVwQyx3REFBd0Q7QUFDeEQsd0RBQXdEO0FBRXhELHVDQUF1QztBQUN2Qyx1Q0FBdUM7QUFFdkMsc0RBQXNEO0FBQ3RELHFEQUFxRDtBQUVyRCxpRUFBaUU7QUFDakUsTUFBTTtBQUVOLDhCQUE4QjtBQUU5QixpQ0FBaUM7QUFDakMsSUFBSSIsInNvdXJjZXNDb250ZW50IjpbIi8vIGltcG9ydCB7IGJsaXQgfSBmcm9tICcuLi8uLi9saWIvaW1hZ2UvYmxpdC5qcydcclxuLy8gaW1wb3J0IHsgVGlsZVNoZWV0IH0gZnJvbSAnLi4vLi4vbGliL3Nwcml0ZXMvdHlwZXMuanMnXHJcbi8vIGltcG9ydCB7IGFzc3J0IH0gZnJvbSAnLi4vLi4vbGliL3V0aWwuanMnXHJcbi8vIGltcG9ydCB7IFRpbGVNYXAgfSBmcm9tICcuL3R5cGVzLmpzJ1xyXG5cclxuLy8gY29uc3QgY3VycmVudFRpbGVtYXBWYWx1ZXMgPSAoXHJcbi8vICAgdGlsZW1hcDogVGlsZU1hcCwgeDogbnVtYmVyLCB5OiBudW1iZXIsIHc6IG51bWJlciwgaDogbnVtYmVyLCBlbGFwc2VkOiBudW1iZXIsXHJcbi8vICAgZW1wdHlJZDogbnVtYmVyXHJcbi8vICkgPT4ge1xyXG4vLyAgIGNvbnN0IHZhbHVlID0gQXJyYXk8bnVtYmVyPih3ICogaClcclxuXHJcbi8vICAgZm9yIChsZXQgaiA9IDA7IGogPCBoOyBqKyspIHtcclxuLy8gICAgIGNvbnN0IHJvdyA9IGogKyB5XHJcblxyXG4vLyAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB3OyBpKyspIHtcclxuLy8gICAgICAgY29uc3QgY29sID0gaSArIHhcclxuXHJcbi8vICAgICAgIGNvbnN0IHZhbEluZGV4ID0gaiAqIHcgKyBpXHJcblxyXG4vLyAgICAgICBpZiAocm93IDwgMCB8fCByb3cgPj0gdGlsZW1hcC5oZWlnaHQgfHwgY29sIDwgMCB8fCBjb2wgPj0gdGlsZW1hcC53aWR0aCkge1xyXG4vLyAgICAgICAgIHZhbHVlW3ZhbEluZGV4XSA9IGVtcHR5SWRcclxuLy8gICAgICAgICBjb250aW51ZVxyXG4vLyAgICAgICB9XHJcblxyXG4vLyAgICAgICBjb25zdCB0aWxlSW5kZXggPSByb3cgKiB0aWxlbWFwLndpZHRoICsgY29sXHJcblxyXG4vLyAgICAgICBjb25zdCByZWN0SW5kZXggPSAoXHJcbi8vICAgICAgICAgdHlwZW9mIHRpbGVtYXAuZGF0YVt0aWxlSW5kZXhdID09PSAnbnVtYmVyJyA/XHJcbi8vICAgICAgICAgICB0aWxlbWFwLmRhdGFbdGlsZUluZGV4XSA6XHJcbi8vICAgICAgICAgICBhc3NydCh0aWxlbWFwLmRhdGFbdGlsZUluZGV4XShlbGFwc2VkKSwgJ0V4cGVjdGVkIHJlY3RJbmRleCcpXHJcbi8vICAgICAgIClcclxuXHJcbi8vICAgICAgIHZhbHVlW3ZhbEluZGV4XSA9IHJlY3RJbmRleFxyXG4vLyAgICAgfVxyXG4vLyAgIH1cclxuXHJcbi8vICAgcmV0dXJuIHZhbHVlXHJcbi8vIH1cclxuXHJcbi8vIGNvbnN0IHNldEN1cnJlbnRWYWx1ZXMgPSAoXHJcbi8vICAgdmFsdWU6IG51bWJlcltdLFxyXG4vLyAgIHRpbGVtYXA6IFRpbGVNYXAsXHJcbi8vICAgeDogbnVtYmVyLCB5OiBudW1iZXIsIHc6IG51bWJlciwgaDogbnVtYmVyLFxyXG4vLyAgIGVsYXBzZWQ6IG51bWJlciwgZW1wdHlJZDogbnVtYmVyXHJcbi8vICkgPT4ge1xyXG4vLyAgIGZvciAobGV0IGogPSAwOyBqIDwgaDsgaisrKSB7XHJcbi8vICAgICBjb25zdCByb3cgPSBqICsgeVxyXG5cclxuLy8gICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdzsgaSsrKSB7XHJcbi8vICAgICAgIGNvbnN0IGNvbCA9IGkgKyB4XHJcblxyXG4vLyAgICAgICBjb25zdCB2YWxJbmRleCA9IGogKiB3ICsgaVxyXG5cclxuLy8gICAgICAgaWYgKHJvdyA8IDAgfHwgcm93ID49IHRpbGVtYXAuaGVpZ2h0IHx8IGNvbCA8IDAgfHwgY29sID49IHRpbGVtYXAud2lkdGgpIHtcclxuLy8gICAgICAgICB2YWx1ZVt2YWxJbmRleF0gPSBlbXB0eUlkXHJcbi8vICAgICAgICAgY29udGludWVcclxuLy8gICAgICAgfVxyXG5cclxuLy8gICAgICAgY29uc3QgdGlsZUluZGV4ID0gcm93ICogdGlsZW1hcC53aWR0aCArIGNvbFxyXG5cclxuLy8gICAgICAgY29uc3QgcmVjdEluZGV4ID0gKFxyXG4vLyAgICAgICAgIHR5cGVvZiB0aWxlbWFwLmRhdGFbdGlsZUluZGV4XSA9PT0gJ251bWJlcicgP1xyXG4vLyAgICAgICAgICAgdGlsZW1hcC5kYXRhW3RpbGVJbmRleF0gOlxyXG4vLyAgICAgICAgICAgYXNzcnQodGlsZW1hcC5kYXRhW3RpbGVJbmRleF0oZWxhcHNlZCksICdFeHBlY3RlZCByZWN0SW5kZXgnKVxyXG4vLyAgICAgICApXHJcblxyXG4vLyAgICAgICB2YWx1ZVt2YWxJbmRleF0gPSByZWN0SW5kZXhcclxuLy8gICAgIH1cclxuLy8gICB9XHJcbi8vIH1cclxuXHJcbi8vIGNvbnN0IGJsaXRBbGxDaGFuZ2VzID0gKFxyXG4vLyAgIHNyYzogVGlsZVNoZWV0LCBkZXN0OiBJbWFnZURhdGEsXHJcbi8vICAgcHJldkluZGljZXM6IG51bWJlcltdLCBjdXJyZW50SW5kaWNlczogbnVtYmVyW10sXHJcbi8vICAgY29sczogbnVtYmVyLCByb3dzOiBudW1iZXIsIHRpbGVXOiBudW1iZXIsIHRpbGVIOiBudW1iZXIsXHJcbi8vICAgZHg6IG51bWJlciwgZHk6IG51bWJlclxyXG4vLyApID0+IHtcclxuLy8gICBmb3IgKGxldCBqID0gMDsgaiA8IHJvd3M7IGorKykge1xyXG4vLyAgICAgY29uc3QgeSA9IGogKiB0aWxlSCArIGR5XHJcbi8vICAgICBjb25zdCByb3cgPSBqICogY29sc1xyXG5cclxuLy8gICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcm93czsgaSsrKSB7XHJcbi8vICAgICAgIGNvbnN0IGluZGV4ID0gcm93ICsgaVxyXG4vLyAgICAgICBjb25zdCBwcmV2ID0gcHJldkluZGljZXNbaW5kZXhdXHJcbi8vICAgICAgIGNvbnN0IGN1cnJlbnQgPSBjdXJyZW50SW5kaWNlc1tpbmRleF1cclxuXHJcbi8vICAgICAgIGlmIChwcmV2ID09PSBjdXJyZW50KSBjb250aW51ZVxyXG5cclxuLy8gICAgICAgY29uc3QgeCA9IGkgKiB0aWxlVyArIGR4XHJcbi8vICAgICAgIGNvbnN0IHJlY3QgPSBzcmMucmVjdHNbY3VycmVudF1cclxuXHJcbi8vICAgICAgIGJsaXQoc3JjLmltYWdlLCBkZXN0LCBbLi4ucmVjdCwgeCwgeV0pXHJcbi8vICAgICB9XHJcbi8vICAgfVxyXG4vLyB9XHJcblxyXG4vLyBjb25zdCB2aWV3U3RhdGUgPSAoXHJcbi8vICAgd2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIsXHJcbi8vICAgdGlsZVc6IG51bWJlciwgdGlsZUg6IG51bWJlclxyXG4vLyApID0+IHtcclxuLy8gICBjb25zdCB0aWxlQ3ggPSBNYXRoLmZsb29yKHRpbGVXIC8gMilcclxuLy8gICBjb25zdCB0aWxlQ3kgPSBNYXRoLmZsb29yKHRpbGVIIC8gMilcclxuXHJcbi8vICAgY29uc3Qgc3RhdGUgPSB7XHJcbi8vICAgICBjb2xzOiAwLFxyXG4vLyAgICAgcm93czogMCxcclxuLy8gICAgIHZMZWZ0OiAwLFxyXG4vLyAgICAgdlRvcDogMCxcclxuLy8gICAgIHByZXZJbmRpY2VzOiBBcnJheTxudW1iZXI+KCksXHJcbi8vICAgfVxyXG5cclxuLy8gICBjb25zdCBpbnZhbGlkYXRlID0gKHc6IG51bWJlciwgaDogbnVtYmVyKSA9PiB7XHJcbi8vICAgICB3aWR0aCA9IHdcclxuLy8gICAgIGhlaWdodCA9IGhcclxuXHJcbi8vICAgICBjb25zdCBjeCA9IE1hdGguZmxvb3Iod2lkdGggLyAyKVxyXG4vLyAgICAgY29uc3QgY3kgPSBNYXRoLmZsb29yKGhlaWdodCAvIDIpXHJcblxyXG4vLyAgICAgY29uc3QgYXZhaWxXID0gd2lkdGggLSB0aWxlV1xyXG4vLyAgICAgY29uc3QgYXZhaWxIID0gaGVpZ2h0IC0gdGlsZUhcclxuXHJcbi8vICAgICBjb25zdCBjb2xzUGVyU2lkZSA9IE1hdGguY2VpbChhdmFpbFcgLyAyIC8gdGlsZVcpXHJcbi8vICAgICBjb25zdCByb3dzUGVyU2lkZSA9IE1hdGguY2VpbChhdmFpbEggLyAyIC8gdGlsZUgpXHJcblxyXG4vLyAgICAgc3RhdGUuY29scyA9IGNvbHNQZXJTaWRlICogMiArIDFcclxuLy8gICAgIHN0YXRlLnJvd3MgPSByb3dzUGVyU2lkZSAqIDIgKyAxXHJcblxyXG4vLyAgICAgc3RhdGUudkxlZnQgPSBjeCAtIGNvbHNQZXJTaWRlICogdGlsZVcgLSB0aWxlQ3hcclxuLy8gICAgIHN0YXRlLnZUb3AgPSBjeSAtIHJvd3NQZXJTaWRlICogdGlsZUggLSB0aWxlQ3lcclxuXHJcbi8vICAgICBzdGF0ZS5wcmV2SW5kaWNlcyA9IEFycmF5PG51bWJlcj4oc3RhdGUuY29scyAqIHN0YXRlLnJvd3MpXHJcbi8vICAgfVxyXG5cclxuLy8gICBpbnZhbGlkYXRlKHdpZHRoLCBoZWlnaHQpXHJcblxyXG4vLyAgIHJldHVybiB7IHN0YXRlLCBpbnZhbGlkYXRlIH1cclxuLy8gfSJdfQ==