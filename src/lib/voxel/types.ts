import { T3 } from '../types.js'

/*
  voxel space is left-handed: 
     
  Y  Z
  | /
  |/
  0--X

*/

export type Point3 = T3

// if we allow rotations later, potentially scale to:
// [
//    x: number, y: number, z: number, 
//    topC: number, frontC: number, leftC: number, rightC: number, backC: number
// ]
// nb bottom is never visible 
export type Vox = [
  x: number, y: number, z: number, topC: number, frontC: number
]
