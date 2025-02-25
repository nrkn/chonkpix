export type State = {
    keys: Record<string, boolean>;
    keyPresses: string[];
    mouse: {
        buttons: Record<number, boolean>;
        readonly x: number;
        readonly y: number;
        readonly wheel: number;
        readonly inBounds: boolean;
    };
    time: {
        readonly elapsed: number;
        readonly frameTime: number;
    };
    view: {
        zoom: number;
        readonly buffer: ImageData;
    };
    running: boolean;
    debug: boolean;
};
export type Scene = {
    init: (state: State) => Promise<void>;
    update: (state: State) => void;
    quit: (state: State) => Promise<void>;
    setActive?: (value: boolean) => void;
};
export type T2<T = number> = [T, T];
export type T3<T = number> = [T, T, T];
export type T4<T = number> = [T, T, T, T];
export type T5<T = number> = [T, T, T, T, T];
export type T6<T = number> = [T, T, T, T, T, T];
export type Maybe<T> = T | null | undefined;
export type SizeSlug = `${number}x${number}`;
