import { Maybe } from '../types.js'
import { assrtPositive } from '../util.js'
import { AnimationFrame } from './types.js'

export const animator = <T = number>(frames: AnimationFrame<T>[]) => {
  if (frames.length === 0) return () => null

  const totalDuration = frames.reduce(
    (acc, [duration]) =>
      acc + assrtPositive(duration, 'Expected positive duration'),
    0
  )

  if (totalDuration === 0) return () => null

  const frameIdAt = (now: number): Maybe<T> => {
    now = assrtPositive(now, 'Expected positive time') % totalDuration

    for (let i = 0; i < frames.length; i++) {
      const [duration, id] = frames[i]

      if (now <= duration) {
        return id
      }

      now -= duration
    }

    return null
  }

  return frameIdAt
}
