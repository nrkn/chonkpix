import { T2 } from '../types.js';
export type Row<Arg> = [
    row: number,
    startCol: number,
    endCol: number,
    ...args: Arg[]
];
export declare const pointToRow: <Arg>(x: number, y: number, ...args: Arg[]) => Row<Arg>;
export declare const lineToRows: (x0: number, y0: number, x1: number, y1: number) => Row<never>[];
export declare const rectToRows: (x: number, y: number, w: number, h: number) => Row<never>[];
export declare const triangleToRows: (a: T2, b: T2, c: T2) => Row<never>[];
