import { Heightmap } from './types.js';
export declare const createHeightmapU8: (width: number, height: number, data?: Uint8ClampedArray) => Heightmap;
export declare const createHeightmapU16: (width: number, height: number, data?: Uint16Array) => Heightmap<Uint16Array>;
export declare const createHeightmapI16: (width: number, height: number, data?: Int16Array) => Heightmap<Int16Array>;
