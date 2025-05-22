export declare const createTerminal: () => Terminal;
export type Terminal = {
    readonly bufferHeight: number;
    clear: () => void;
    backspace: () => void;
    append: (value: string) => void;
    appendLine: (value?: string) => void;
    updateLine: (line: number, value: string) => void;
    view: (cols: number, rows: number) => string[];
};
