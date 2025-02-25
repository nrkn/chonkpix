export type Row<Arg> = [
    row: number,
    startCol: number,
    endCol: number,
    ...args: Arg[]
];
