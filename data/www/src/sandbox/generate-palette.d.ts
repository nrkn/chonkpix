import { T3 } from '../lib/types.js';
export declare const generatePalette: (entryCount: number, hueRange: number, satRange: number, lightRange: number) => GeneratedPalette;
export type GeneratedPalette = {
    data: Uint8Array;
    entryCount: number;
    hueRange: number;
    satRange: number;
    lightRange: number;
    greyRange: number;
};
export declare const indexOfClosestHsl: (palette: GeneratedPalette, hsl: T3) => number;
export declare const indexOfClosestRgb: (palette: GeneratedPalette, rgb: T3) => number;
export declare const hslToRgb: ([h, s, l]: T3) => T3;
export declare const rgbToHsl: ([r, g, b]: T3) => T3;
