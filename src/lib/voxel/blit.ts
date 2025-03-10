import { V_FRONT, V_TOP, V_X, V_Y, V_Z } from './const.js'
import { Vox } from './types.js'

// painters algorithm - uses overdraw
//
// pretty fast! could be some room for improvement?
// eg should we precalculate voxels that are oob during sort phase and filter 
// them out? then we can skip three `if` checks per voxel
export const blitVoxels = (
  imageData: ImageData,
  // assumed to be already sorted by z then y
  voxels: Vox[]
) => {
  const view = new Uint32Array(imageData.data.buffer)

  for (let i = 0; i < voxels.length; i++) {
    const vox = voxels[i]
    const vx = vox[V_X]
    const vy = vox[V_Y]
    const vz = vox[V_Z]
    const vt = vox[V_TOP]
    const vf = vox[V_FRONT]

    if (vx < 0 || vx >= imageData.width) continue

    const dyTop = imageData.height - 1 - (vy + vz)

    if (dyTop >= 0 && dyTop < imageData.height) {
      const topIndex = dyTop * imageData.width + vx

      view[topIndex] = vt
    }

    const dyFront = dyTop + 1

    if (dyFront >= 0 && dyFront < imageData.height) {
      const frontIndex = dyFront * imageData.width + vx

      view[frontIndex] = vf
    }
  }
}
