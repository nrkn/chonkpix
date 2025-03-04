import { Maybe } from '../../lib/types.js'
import { assrt } from '../../lib/util.js'
import { TileMap, ViewState } from './types.js'

export const viewState = (
  width: number, height: number,
  tileW: number, tileH: number
) => {
  const tileCx = Math.floor(tileW / 2)
  const tileCy = Math.floor(tileH / 2)

  const state: ViewState = {
    cols: 0,
    rows: 0,
    vLeft: 0,
    vTop: 0,
    colLeft: 0,
    rowTop: 0,
    prevIndices: Array<Maybe<number>>(),
    currIndices: Array<Maybe<number>>()
  }

  const invalidate = (w: number, h: number) => {
    width = w
    height = h

    const cx = Math.floor(width / 2)
    const cy = Math.floor(height / 2)

    const availW = width - tileW
    const availH = height - tileH

    const colsPerSide = Math.ceil(availW / 2 / tileW)
    const rowsPerSide = Math.ceil(availH / 2 / tileH)

    state.cols = colsPerSide * 2 + 1
    state.rows = rowsPerSide * 2 + 1

    state.vLeft = cx - colsPerSide * tileW - tileCx
    state.vTop = cy - rowsPerSide * tileH - tileCy

    state.prevIndices = Array<Maybe<number>>(state.cols * state.rows)
    state.currIndices = Array<Maybe<number>>(state.cols * state.rows)

    state.colLeft = -colsPerSide
    state.rowTop = -rowsPerSide
  }

  invalidate(width, height)

  return { state, invalidate }
}

export const setIndices = (
  tilemap: TileMap,
  indices: Maybe<number>[],
  x: number, y: number, w: number, h: number,
  elapsed: number, emptyId: number
) => {
  for (let j = 0; j < h; j++) {
    const row = j + y

    for (let i = 0; i < w; i++) {
      const col = i + x

      const valIndex = j * w + i

      if (row < 0 || row >= tilemap.height || col < 0 || col >= tilemap.width) {
        indices[valIndex] = emptyId

        continue
      }

      const tileIndex = row * tilemap.width + col
      const tile = tilemap.data[tileIndex]

      let rectIndex: number

      if (typeof tile === 'function') {
        rectIndex = assrt(tile(elapsed), 'Expected rectIndex')
      } else {
        rectIndex = tile
      }

      indices[valIndex] = rectIndex
    }
  }
}

export const clearIndicesForRow = (
  indices: Maybe<number>[],
  row: number,
  w: number
) => {
  const rowStart = row * w

  for (let i = 0; i < w; i++) {
    const valIndex = rowStart + i

    indices[valIndex] = null
  }
}

export const clearIndicesForCol = (
  indices: Maybe<number>[],
  col: number,
  w: number, h: number
) => {
  for (let j = 0; j < h; j++) {
    const valIndex = j * w + col

    indices[valIndex] = null
  }
}

export const scrollIndices = (
  src: Maybe<number>[],
  dest: Maybe<number>[],
  w: number, h: number,
  x: number, y: number
) => {
  for (let destY = 0; destY < h; destY++) {
    const srcY = destY + y

    for (let destX = 0; destX < w; destX++) {
      const srcX = destX + x

      if (srcY < 0 || srcY >= h || srcX < 0 || srcX >= w) {
        dest[destY * w + destX] = null
        continue
      }

      dest[destY * w + destX] = src[srcY * w + srcX]
    }
  }
}