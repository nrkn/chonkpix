import { T6 } from '../types.js';
import { Row } from './types.js';
export declare const blit: (src: ImageData, dest: ImageData, transfer?: T6) => ImageData;
export declare const blitRows: (src: ImageData, srcRows: Row<any>[], dest: ImageData, dx?: number, dy?: number) => void;
export declare const blitFullWidth: (src: ImageData, dest: ImageData, sy: number, sh: number, dy: number) => void;
