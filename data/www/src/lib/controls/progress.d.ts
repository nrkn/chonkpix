import { T4 } from '../types.js';
export declare const progressControl: (buffer: ImageData, total: number, [px, py, pw, ph]: T4, bg?: number, fg?: number) => (i: number) => Promise<void>;
