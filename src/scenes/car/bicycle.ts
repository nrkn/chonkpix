// bicycle style steering for car physics

import { T2 } from '../../lib/types.js'

export type BicycleUpdate = {
  location: T2
  heading: number
}

export type Bicycle = BicycleUpdate & {
  speed: number
  steerAngle: number
  wheelBase: number
}

export const createBicycle = () => {
  const location: T2 = [0, 0]
  const heading = 0
  const speed = 0
  const steerAngle = 0
  const wheelBase = 0

  return { location, heading, speed, steerAngle, wheelBase }
}

export const frontWheel = (
  bicycle: Bicycle,
  center = bicycle.wheelBase / 2,
  cosHead = Math.cos(bicycle.heading),
  sinHead = Math.sin(bicycle.heading)
): T2 => [
    bicycle.location[0] + center * cosHead,
    bicycle.location[1] + center * sinHead
  ]


export const backWheel = (
  bicycle: Bicycle,
  center = bicycle.wheelBase / 2,
  cosHead = Math.cos(bicycle.heading),
  sinHead = Math.sin(bicycle.heading)
): T2 => [
    bicycle.location[0] - center * cosHead,
    bicycle.location[1] - center * sinHead
  ]

export const updateBicycle = (
  bicycle: Bicycle, delta: number
): BicycleUpdate => {
  const center = bicycle.wheelBase / 2
  const cosHead = Math.cos(bicycle.heading)
  const sinHead = Math.sin(bicycle.heading)

  let [bwx, bwy] = backWheel(bicycle, center, cosHead, sinHead)
  let [fwx, fwy] = frontWheel(bicycle, center, cosHead, sinHead)

  const ds = bicycle.speed * delta
  const fa = bicycle.heading + bicycle.steerAngle

  bwx += ds * cosHead
  bwy += ds * sinHead

  fwx += ds * Math.cos(fa)
  fwy += ds * Math.sin(fa)

  const location: T2 = [(fwx + bwx) / 2, (fwy + bwy) / 2]
  const heading = Math.atan2(fwy - bwy, fwx - bwx)

  return { location, heading }
}