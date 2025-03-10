import { T2, T6 } from '../types.js'
import { Vox } from './types.js'

export const voxSort = (a: Vox, b: Vox) => {
  // sort on z - bigger is further away
  const zDelta = b[2] - a[2]

  if (zDelta !== 0) {
    return zDelta
  }

  // tie break on y - we want to sort smaller y first
  // so that the "tops" of voxels overlay correctly
  return a[1] - b[1]
}

// this leaves y unscaled, eg it is still bottom to top rather than top to bottom
export const project2 = (x: number, y: number, z: number): T2 => [x, y + z]

const B_X = 0
const B_Y = 1
const B_Z = 2
const B_W = 3
const B_H = 4
const B_D = 5

export const voxInBounds = (voxels: Vox[], bounds: T6) =>
  voxels.filter(
    ([vx, vy, vz]) => (
      vx >= bounds[B_X] && vx < bounds[B_X] + bounds[B_W] &&
      vy >= bounds[B_Y] && vy < bounds[B_Y] + bounds[B_H] &&
      vz >= bounds[B_Z] && vz < bounds[B_Z] + bounds[B_D]
    )
  )

export const translateVox = ( voxels: Vox[], dx: number, dy: number, dz: number ) =>
  voxels.map(
    ([vx, vy, vz, vt, vf]) => [vx + dx, vy + dy, vz + dz, vt, vf] as Vox
  )