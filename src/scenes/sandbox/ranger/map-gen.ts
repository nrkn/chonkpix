import {
  getNeighboursCardinal, getNeighboursAll
} from '../../../lib/geom/neighbours.js'

import { pick, randInt } from '../../../lib/random.js'
import { animator } from '../../../lib/sprites/animator.js'
import { T2 } from '../../../lib/types.js'
import { assrt } from '../../../lib/util.js'

import {
  grasses, hut, mountains, rocks, ruins, sands, skeleton, trees, water
} from './tile-data.js'

import { TileMap, TileMapCell } from './types.js'

// doesn't have to be good, just has to be ok for testing
export const generateMap = (width: number, height: number) => {
  const size = width * height

  const [_type, _name, ...waterFrames] = water

  const waterAnim = animator(waterFrames)

  const tileMap: TileMap = {
    width, height,
    data: Array<TileMapCell>(size).fill(waterAnim)
  }

  const blocking = new Set<TileMapCell>()

  const indexMap = new Map<number, T2>()

  const landCount = Math.floor(size * 0.7)

  const landIndices = new Set<number>()
  const landIndicesArr: number[] = []

  let landPlaced = 0

  let currentLand: T2 = [Math.floor(width / 2), Math.floor(height / 2)]

  const canPlaceLand = ([x, y]: T2) => {
    // leave edges clear for water
    if (x === 0) return false
    if (y === 0) return false
    if (x === width - 1) return false
    if (y === height - 1) return false

    const i = y * width + x

    // can't already be land
    return !landIndices.has(i)
  }

  const maxTries = 100

  const addLand = () => {
    let [lx, ly] = currentLand
    let li = ly * width + lx

    indexMap.set(li, [lx, ly])
    landIndices.add(li)
    landIndicesArr.push(li)

    let tries = 0
    let neighbours = getNeighboursCardinal(currentLand).filter(canPlaceLand)

    while (neighbours.length < 1) {
      const i = pick(landIndicesArr)
      const existingLand = assrt(indexMap.get(i), `Expected land at ${i}`)

      neighbours = getNeighboursCardinal(existingLand).filter(canPlaceLand)

      tries++

      if (tries >= maxTries) {
        console.log('Failed to place land')

        return false
      }
    }

    currentLand = pick(neighbours)

    return true
  }

  while (landPlaced < landCount) {
    if (!addLand()) break

    landPlaced++
  }

  const [, , grassStart, grassCount] = grasses
  const [, , sandStart, sandCount] = sands
  const [, , rockStart, rockCount] = rocks
  const [, , treeStart, treeCount] = trees
  const [, , ruinsStart, ruinsCount] = ruins
  const [, , mountainStart, mountainCount] = mountains

  const [, , hutIndex] = hut
  const [, , skeletonIndex] = skeleton

  for (const i of landIndices) {
    const grass = randInt(grassCount) + grassStart

    tileMap.data[i] = grass
  }

  for (const i of landIndices) {
    if (tileMap.data[i] === waterAnim) continue

    const pt = assrt(indexMap.get(i), `Expected point at ${i}`)

    let seaNeighbours = 0

    const neighbours = getNeighboursAll(pt)

    for (const n of neighbours) {
      const [nx, ny] = n

      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue

      const ni = ny * width + nx

      if (tileMap.data[ni] === waterAnim) seaNeighbours++
    }

    if (seaNeighbours > 0) {
      const sand = randInt(sandCount) + sandStart

      tileMap.data[i] = sand

      continue
    }

    if (!randInt(10)) {
      const rock = randInt(rockCount) + rockStart

      tileMap.data[i] = rock

      continue
    }

    if (!randInt(10)) {
      const tree = randInt(treeCount) + treeStart

      tileMap.data[i] = tree

      continue
    }

    if (!randInt(100)) {
      const ruins = randInt(ruinsCount) + ruinsStart

      tileMap.data[i] = ruins

      continue
    }

    if (!randInt(50)) {
      const mountain = randInt(mountainCount) + mountainStart

      tileMap.data[i] = mountain

      continue
    }

    if (!randInt(500)) {
      tileMap.data[i] = hutIndex

      continue
    }

    if (!randInt(1000)) {
      tileMap.data[i] = skeletonIndex

      continue
    }
  }

  blocking.add(waterAnim)
  // trees
  for (let i = treeStart; i < treeStart + treeCount; i++) {
    blocking.add(i)
  }
  // mountains
  for (let i = mountainStart; i < mountainStart + mountainCount; i++) {
    blocking.add(i)
  }

  return { tileMap, blocking }
}
