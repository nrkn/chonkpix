import { SizeSlug, T2 } from './types.js';
export declare const parseSizeSlug: (slug: SizeSlug) => T2;
export declare const createSizeSlug: (width: number, height: number) => SizeSlug;
export declare const sizeToSlug: (size: T2) => `${number}x${number}`;
export declare const findSizeSlug: (text: string) => SizeSlug | null;
