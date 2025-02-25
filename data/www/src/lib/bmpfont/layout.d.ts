import { Maybe, T2 } from '../types.js';
import { BmpFont, BmpLayout, FontPoints } from './types.js';
export declare const layoutTextLine: (font: BmpFont, line: string, x?: number, y?: number) => BmpLayout;
export declare const blitTextLayout: (dest: ImageData, dx: number, dy: number, font: BmpFont, layout: BmpLayout) => ImageData;
export declare const fontImageToPoints: (font: BmpFont) => Record<number, Maybe<T2[]>>;
export declare const textLayoutToIndices: (dest: ImageData, dx: number, dy: number, font: FontPoints, layout: BmpLayout, channels?: number) => number[];
