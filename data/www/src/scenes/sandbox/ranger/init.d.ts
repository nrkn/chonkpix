import { State } from '../../../lib/types.js';
import { RangerDeps, RangerState } from './types.js';
export declare const rangerInit: (_state: State) => Promise<{
    deps: RangerDeps;
    fstate: RangerState;
}>;
