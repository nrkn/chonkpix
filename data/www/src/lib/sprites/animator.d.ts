import { Maybe } from '../types.js';
import { AnimationFrame } from './types.js';
export declare const animator: <T = number>(frames: AnimationFrame<T>[]) => (now: number) => Maybe<T>;
