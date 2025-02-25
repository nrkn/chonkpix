import { T2, T3, T5 } from '../lib/types.js';
export declare const createPentagonTriangles: (cx: number, cy: number, radius: number, angleOffset?: number) => T5<T3<T2>>;
export declare const polygonPoints: (sides: number, cx: number, cy: number, radius: number, radianOffset?: number) => T2[];
export declare const polygonTriangles: (sides: number, cx: number, cy: number, radius: number, radianOffset?: number) => T3<T2>[];
