import { Maybe, T2, T3, T4 } from '../types.js';
export type BmpFontBase = {
    width: number;
    height: number;
    leading: number;
    image: ImageData;
    rects: Record<number, Maybe<T4>>;
    advance: number;
    fallback: number;
};
export type BmpFontM = {
    type: 'mono';
} & BmpFontBase;
type OptNumMap = Record<number, Maybe<number>>;
type Kerning = Record<number, Maybe<OptNumMap>>;
export type BmpFontP = {
    type: 'proportional';
    widths: OptNumMap;
    kerning: Kerning;
} & BmpFontBase;
export type BmpFont = BmpFontM | BmpFontP;
export type BmpLayout = T3[];
export type FontPoints = Record<number, Maybe<T2[]>>;
export {};
