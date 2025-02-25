import { T2 } from '../types.js';
import { GridKey, NamedGrid } from './types.js';
export declare const generateGrid: (cellW: number, cellH: number, cols: number, rows: number, gap?: number, padding?: number) => T2[];
export declare const generateNamedGrid: (cellW: number, cellH: number, cols: number, rows: number, gap?: number, padding?: number) => NamedGrid;
export declare const colKey: (col: number) => string;
export declare const parseColKey: (key: string) => number;
export declare const gridKey: (col: number, row: number) => GridKey;
export declare const parseGridKey: (gridKey: GridKey) => T2;
