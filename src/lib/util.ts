import { Maybe, T2, T3, T4, T5, T6 } from './types.js'

export const assrt = <T>(
  value: Maybe<T>, message = 'Expected value, saw null or undefined'
): T => {
  if (value === null || value === undefined) throw Error(message)

  return value
}

export const maybe = <T>(value: Maybe<T>): value is T =>
  value !== null && value !== undefined

export const assrtInt = (
  value: number, message = `Expected integer, saw ${value}`
): number => {
  if (!Number.isInteger(value)) throw Error(message)

  return value
}

export const assrtPositive = (
  value: number, message = `Expected positive number, saw ${value}`
): number => {
  if (value < 0) throw Error(message)

  return value
}

// tuple factories
export const t2Factory = <T>(defaultValue: T) =>
  (a = defaultValue, b = a): T2<T> => [a, b]

export const t3Factory = <T>(defaultValue: T) =>
  (a = defaultValue, b = a, c = a): T3<T> => [a, b, c]

export const t4Factory = <T>(defaultValue: T) =>
  (a = defaultValue, b = a, c = a, d = a): T4<T> => [a, b, c, d]

export const t5Factory = <T>(defaultValue: T) =>
  (a = defaultValue, b = a, c = a, d = a, e = a): T5<T> => [a, b, c, d, e]

export const t6Factory = <T>(defaultValue: T) =>
  (a = defaultValue, b = a, c = a, d = a, e = a, f = a): T6<T> => [
    a, b, c, d, e, f
  ]

// for number tuples
export const t2N = t2Factory(0)
export const t3N = t3Factory(0)
export const t4N = t4Factory(0)
export const t5N = t5Factory(0)
export const t6N = t6Factory(0)

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export const wait = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms))

// for debugging - eg when inside a raf - we only want first few logs, not for
// it to keep spewing multiple logs out every frame
export const limitedLogger = (maxLogs = 10, logger = console.log) => {
  let logs = 0
  let paused = false

  const pause = () => {
    paused = true
  }

  const resume = () => {
    paused = false
  }

  const reset = (max = 10) => {
    maxLogs = max
    logs = 0
  }

  const log = (...data: any[]) => {
    if (paused || (logs === maxLogs)) {
      return
    }

    logger(logs, ...data)
    logs++
  }

  return { pause, resume, reset, log }
}
