import { T6 } from '../types.js'
import { Row } from './types.js'
import { clampRow, clampRows, clampTransfer } from './util.js'

// directly copy pixels from one image to another
export const blit = (
  src: ImageData, dest: ImageData,
  transfer: T6 = [
    0, 0, src.width, src.height, 0, 0
  ]
) => {
  const [sx, sy, sw, sh, dx, dy] = clampTransfer(
    src.width, src.height, dest.width, dest.height, transfer
  )

  for (let j = 0; j < sh; j++) {
    const y = j + sy
    const rowIndex = y * src.width

    const startIndex = (rowIndex + sx) * 4
    const endIndex = startIndex + sw * 4

    const row = src.data.subarray(startIndex, endIndex)

    const destRowIndex = (j + dy) * dest.width * 4
    const destStartIndex = (destRowIndex + dx * 4)

    dest.data.set(row, destStartIndex)
  }

  return dest
}

// copies rows from one image to another
// much faster than blit or composite etc when the amount of src to be copied
// is sparse
export const blitRows = (
  src: ImageData, srcRows: Row<any>[], dest: ImageData,
  dx = 0, dy = 0
) => {
  srcRows = clampRows(srcRows, src.width, src.height)

  for (let i = 0; i < srcRows.length; i++) {
    const srcRow = srcRows[i]
    const srcW = srcRow[2] - srcRow[1] + 1

    const destRow = clampRow(
      [srcRow[0] + dy, srcRow[1] + dx, srcRow[2] + dx], dest.width, dest.height
    )

    if (!destRow) continue

    const destW = destRow[2] - destRow[1] + 1

    const w = Math.min(srcW, destW)

    const srcIndex = (srcRow[0] * src.width + srcRow[1]) * 4
    const destIndex = (destRow[0] * dest.width + destRow[1]) * 4

    const srcPixels = src.data.subarray(srcIndex, srcIndex + w * 4)

    dest.data.set(srcPixels, destIndex)
  }
}
