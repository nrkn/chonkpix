// we will start off simple and have it be an append only terminal, no wrapping
// scrolling etc, no cursor, and we will add more features as we go
export const createTerminal = () => {
  let lineBuffer: string[] = ['']

  const clear = () => {
    lineBuffer = ['']
  }

  const append = (value: string) => {
    const lines = value.split('\n')

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      lineBuffer[lineBuffer.length - 1] += line

      if (i !== lines.length - 1) {
        lineBuffer.push('')
      }
    }
  }

  const appendLine = (value = '') => {
    append(value + '\n')
  }

  const backspace = () => {
    lineBuffer[lineBuffer.length - 1] = (
      lineBuffer[lineBuffer.length - 1].slice(0, -1)
    )
  }

  const view = (cols: number, rows: number) => {
    const lines = (
      lineBuffer.length > rows ?
        lineBuffer.slice(lineBuffer.length - rows) :
        lineBuffer
    ).map(l => {
      if (l.length > cols) {
        return l.slice(0, cols)
      }

      return l
    })

    return lines
  }

  const term: Terminal = {
    get bufferHeight() {
      return lineBuffer.length
    },

    clear,
    backspace,
    append,
    appendLine,
    view
  }

  return term
}

export type Terminal = {
  readonly bufferHeight: number
  clear: () => void
  backspace: () => void
  append: (value: string) => void
  appendLine: (value?: string) => void
  view: (cols: number, rows: number) => string[]
}