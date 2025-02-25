// fastest way to blit or fill is row-wise
export type Row<Arg> = [
  row: number, startCol: number, endCol: number, ...args: Arg[]
]
