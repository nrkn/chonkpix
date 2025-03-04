import { BmpFontM } from './types.js';
export declare const monoFontFiles: readonly ["ATI_SmallW_6x8", "EverexME_5x8", "HP_100LX_6x8", "Portfolio_6x8", "TsengEVA_132_6x8", "IBM_EGA_8x8", "IBM_VGA_8x14", "IBM_VGA_8x16", "IBM_VGA_9x8", "IBM_VGA_9x14", "IBM_VGA_9x16"];
export type MonoFontName = typeof monoFontFiles[number];
export declare const loadFontMono: (name: MonoFontName) => Promise<BmpFontM>;
