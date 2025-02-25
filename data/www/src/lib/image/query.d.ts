import { T2, T4 } from '../types.js';
import { Row } from './types.js';
type QueryPredicate = (r: number, g: number, b: number, a: number, x: number, y: number, i: number) => boolean;
export declare const imageQuery: (imageData: ImageData, predicate: QueryPredicate, rect?: T4) => T2 | null;
export declare const imageQueryAll: (imageData: ImageData, predicate: QueryPredicate, rect?: T4) => T2[];
export declare const rowQuery: (imageData: ImageData, predicate: QueryPredicate, rect?: T4) => Row<never>[];
export {};
