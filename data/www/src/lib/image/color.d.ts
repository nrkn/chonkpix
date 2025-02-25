import { T3, T4, T5 } from '../types.js';
export declare const createColor: (r: number, g: number, b: number, a?: number) => number;
export declare const colorToRgba: (color: number) => T4;
export declare const generateHues: (count: number, v?: number) => number[];
export declare const hsvToRgb: (h: number, s: number, v: number) => T3;
export declare const createColorStop: (r: number, g: number, b: number, a: number, stop: number) => T5;
export declare const stopToRgba: (stop: T5) => T4;
export declare const sampleGradient: (stops: T5[], at: number) => T4;
