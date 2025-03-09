import { V_FRONT, V_TOP, V_X, V_Y, V_Z } from './const.js'
import { Vox } from './types.js'

// painters algorithm - uses overdraw
//
// pretty fast! could be some room for improvement?
// eg should we precalculate voxels that are oob during sort phase and filter 
// them out? then we can skip two `if` checks per voxel
export const blitVoxels = (
  imageData: ImageData,
  // assumed to be already sorted by z then y
  voxels: Vox[]
) => {
  const view = new Uint32Array(imageData.data.buffer)

  for (let i = 0; i < voxels.length; i++) {
    const vox = voxels[i]

    if (vox[V_X] < 0 || vox[V_X] >= imageData.width) continue

    const dyTop = imageData.height - 1 - (vox[V_Y] + vox[V_Z])

    if (dyTop >= 0 && dyTop < imageData.height) {
      const topIndex = dyTop * imageData.width + vox[V_X]

      view[topIndex] = vox[V_TOP]
    }

    const dyFront = dyTop + 1

    if (dyFront >= 0 && dyFront < imageData.height) {
      const frontIndex = dyFront * imageData.width + vox[V_X]

      view[frontIndex] = vox[V_FRONT]
    }
  }
}
