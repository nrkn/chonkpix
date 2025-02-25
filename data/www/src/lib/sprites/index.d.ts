import { Spritesheet } from './types.js';
export declare const createSpriteSheet: (image: ImageData, cellW: number, cellH: number, names?: string[], gap?: number, padding?: number) => Spritesheet;
export declare const getSpriteIndex: (sheet: Spritesheet, spriteName: string) => number;
