import { Row } from './types.js';
import { T2, T4, T6 } from '../types.js';
export declare const clampTransfer: (srcW: number, srcH: number, destW: number, destH: number, transfer: T6) => T6;
export declare const clampRect: (srcW: number, srcH: number, rect: T4) => T4;
export declare const clampRows: <Arg>(rows: Row<Arg>[], w: number, h: number) => Row<Arg>[];
export declare const clampRow: <Arg>(row: Row<Arg>, w: number, h: number) => Row<Arg> | null;
export declare const pointsToIndices: (w: number, h: number, channels: number) => (points: T2[]) => number[];
