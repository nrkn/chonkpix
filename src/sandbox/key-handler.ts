import { Maybe } from '../lib/types.js'

type KeyHandlerEvent = 'start' | 'end' | 'repeat'

type EventData = [type: KeyHandlerEvent, key: string, time: number]

// override the default key repeat behavior
export const keyHandler = (
  initialDelay = 500, 
  repeatDelay = 50
) => {
  let events: EventData[] = []

  const isDown: Record<string, Maybe<boolean>> = {}
  const nextRepeatTime: Record<string, Maybe<number>> = {}

  const onKeydown = (key: string, now: number) => {
    if (isDown[key]) return

    isDown[key] = true
    nextRepeatTime[key] = now + initialDelay

    events.push(['start', key, now])
  }

  const onKeyup = (key: string, now: number) => {
    isDown[key] = false
    nextRepeatTime[key] = null

    events.push(['end', key, now])
  }

  const poll = (now: number): EventData[] => {
    const out = events.slice()

    events = []

    for (const key in nextRepeatTime) {
      let nextTime = nextRepeatTime[key]

      if (!nextTime) continue

      let time = now - nextTime

      if (time < 0) continue

      out.push(['repeat', key, nextTime])

      while (time > repeatDelay) {
        nextTime += repeatDelay
        time -= repeatDelay
        out.push(['repeat', key, nextTime])
      }

      nextRepeatTime[key] = nextTime
    }

    return out
  }

  return {
    onKeydown, onKeyup, poll
  }
}
