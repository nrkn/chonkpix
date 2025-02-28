import { TileSheet } from './types.js';
export declare const createTileSheet: (image: ImageData, cellW: number, cellH: number, names?: string[], gap?: number, padding?: number) => TileSheet;
export declare const getTileIndex: (sheet: TileSheet, tileName: string) => number;
