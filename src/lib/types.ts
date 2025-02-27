export type State = {
  getKeys: () => Record<string, boolean>
  getKeyPresses: () => string[]

  mouse: {
    getButtons: () => Record<number, boolean>
    getX: () => number
    getY: () => number
    takeWheel: () => number
    isInBounds: () => boolean
  }

  time: {
    getElapsed: () => number
    getFrameTime: () => number
  }

  view: {
    getZoom: () => number
    setZoom: ( value: number ) => void
    getBuffer: () => ImageData
  }

  getRunning: () => boolean 
  setRunning: ( value: boolean ) => void
}

export type Scene = {
  init: ( state: State ) => Promise<void>
  update: ( state: State ) => void
  quit: ( state: State ) => Promise<void>
  setActive?: ( value: boolean ) => void
}

export type T2<T = number> = [T, T]
export type T3<T = number> = [T, T, T]
export type T4<T = number> = [T, T, T, T]
export type T5<T = number> = [T, T, T, T, T]
export type T6<T = number> = [T, T, T, T, T, T]

export type Maybe<T> = T | null | undefined

export type SizeSlug = `${ number }x${ number}`
