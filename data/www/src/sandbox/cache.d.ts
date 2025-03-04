export declare const cached: <T, Hash, Result>(hash: (value: T) => Hash, create: (value: T) => Result) => (value: T) => Result;
