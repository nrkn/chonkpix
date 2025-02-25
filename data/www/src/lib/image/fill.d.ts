import { Row } from './types.js';
import { T4 } from '../types.js';
export declare const fill: (dest: ImageData, color: number, rect?: T4) => ImageData;
export declare const fillIndices: (src: number[], dest: ImageData, color: number) => ImageData;
export declare const fillRows: (src: Row<any>[], dest: ImageData, color: number) => ImageData;
export declare const fillRow: (dest: ImageData, color: number, y: number, x0?: number, x1?: number) => ImageData | undefined;
export declare const fillCol: (dest: ImageData, color: number, x: number, y0?: number, y1?: number) => ImageData | undefined;
