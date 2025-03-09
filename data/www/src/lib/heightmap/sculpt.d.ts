import { T4 } from '../types.js';
import { Heightmap } from './types.js';
export declare const raise: (heightmap: Heightmap, x: number, y: number) => void;
export declare const lower: (heightmap: Heightmap, x: number, y: number) => void;
export declare const raiseRect: (heightmap: Heightmap, x: number, y: number, w: number, h: number) => number;
export declare const lowerRect: (heightmap: Heightmap, x: number, y: number, w: number, h: number) => number;
export declare const flattenRect: (heightmap: Heightmap, x: number, y: number, w: number, h: number) => number;
export declare const smooth: (heightmap: Heightmap, rect: T4, times: number) => Heightmap;
