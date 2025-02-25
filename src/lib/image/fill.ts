import { Row } from './types.js'
import { T4 } from '../types.js'
import { clampRect, clampRows } from './util.js'

export const fill = (
  dest: ImageData, color: number, rect: T4 = [0, 0, dest.width, dest.height]
) => {
  const [x, y, w, h] = clampRect(dest.width, dest.height, rect)

  const row = new Uint32Array(w).fill(color)
  const data = new Uint32Array(dest.data.buffer)

  for (let j = 0; j < h; j++) {
    const rowIndex = (y + j) * dest.width + x
    data.set(row, rowIndex)
  }

  return dest
}

export const fillIndices = ( 
  src: number[], dest: ImageData, color: number 
) => {
  const data = new Uint32Array(dest.data.buffer)

  for( let i = 0; i < src.length; i++ ) {
    data[src[i]] = color
  }

  return dest
}

export const fillRows = (
  src: Row<any>[], dest: ImageData, color: number
) => {
  src = clampRows(src, dest.width, dest.height)

  const data = new Uint32Array(dest.data.buffer)

  for (let i = 0; i < src.length; i++) {
    const [y, x0, x1] = src[i]
    const w = x1 - x0 + 1
    const row = new Uint32Array(w).fill(color)
    const rowIndex = y * dest.width + x0

    data.set(row, rowIndex)
  }

  return dest
}

export const fillRow = ( 
  dest: ImageData, color: number, 
  y: number, x0 = 0, x1 = dest.width - 1
) => {
  if( y < 0 || y >= dest.height ) {
    return
  }

  if( x0 > x1 ){
    [ x0, x1 ] = [ x1, x0 ]
  }

  x0 = x0 < 0 ? 0 : x0
  x1 = x1 >= dest.width ? dest.width - 1 : x1

  const w = x1 - x0 + 1
  const pixels = new Uint32Array(w).fill(color)
  const data = new Uint32Array(dest.data.buffer)

  data.set(pixels, y * dest.width + x0)

  return dest
}

export const fillCol = (
  dest: ImageData, color: number, 
  x: number, y0 = 0, y1 = dest.height - 1
) => {
  if( x < 0 || x >= dest.width ) {
    return
  }

  if( y0 > y1 ){
    [ y0, y1 ] = [ y1, y0 ]
  }

  y0 = y0 < 0 ? 0 : y0
  y1 = y1 >= dest.height ? dest.height - 1 : y1

  const h = y1 - y0 + 1
  const data = new Uint32Array(dest.data.buffer)

  let index = y0 * dest.width + x
  
  for( let i = 0; i < h; i++ ){
    data[index] = color
    
    index += dest.width
  }

  return dest
}