import { T2, T6 } from '../types.js';
import { Vox } from './types.js';
export declare const voxSort: (a: Vox, b: Vox) => number;
export declare const project2: (x: number, y: number, z: number) => T2;
export declare const voxInBounds: (voxels: Vox[], bounds: T6) => Vox[];
export declare const translateVox: (voxels: Vox[], dx: number, dy: number, dz: number) => Vox[];
