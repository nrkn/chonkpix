import {
  fontImageToPoints, layoutTextLine, textLayoutToIndices
} from '../lib/bmpfont/layout.js'

import { BmpFontM, FontPoints } from '../lib/bmpfont/types.js'

import {
  getNeighboursAll, getNeighboursCardinal
} from '../lib/geom/neighbours.js'

import { blit } from '../lib/image/blit.js'
import { createColor } from '../lib/image/color.js'
import { composite } from '../lib/image/composite.js'
import { fill, fillIndices } from '../lib/image/fill.js'
import { loadImage } from '../lib/image/load.js'
import { pick, randInt } from '../lib/random.js'
import { findSizeSlug, parseSizeSlug } from '../lib/slug.js'
import { animator } from '../lib/sprites/animator.js'
import { createTileSheet } from '../lib/sprites/index.js'
import { AnimationFrame, TileSheet } from '../lib/sprites/types.js'
import { Maybe, Scene, State, T2 } from '../lib/types.js'
import { assrt, assrtInt, maybe } from '../lib/util.js'

const tileW = 16
const tileH = 16

const tileCx = Math.floor(tileW / 2)
const tileCy = Math.floor(tileH / 2)

const tileCols = 100
const tileRows = 100

type AnimCell = (now: number) => Maybe<number>
type TileMapCell = number | AnimCell

type TileMap = {
  width: number
  height: number
  data: TileMapCell[]
}

const getTileMapRectId = (
  tileMap: TileMap,
  col: number, row: number, now: number
): Maybe<number> => {
  const i = row * tileMap.width + col
  const cell = tileMap.data[i]

  if (typeof cell === 'number') return cell

  return cell(now)
}

// a tile that animates
type Animation = [type: 'animation', name: string, ...AnimationFrame[]]
// a static tile
type Static = [type: 'static', name: string, id: number]
// variations of a static tile
type Variation = [type: 'variation', name: string, id: number, count: number]
// these tiles belong together
type Span = [type: 'span', name: string, id: number, count: number]

const water: Animation = ['animation', 'water', [500, 0], [500, 1]]
const filled: Static = ['static', 'filled', 2]
const grasses: Variation = ['variation', 'grass', 3, 5]
const rocks: Variation = ['variation', 'rock', 8, 3]
const trees: Variation = ['variation', 'tree', 11, 4]
const appleIcon: Static = ['static', 'apple-icon', 15]
const heartIcon: Static = ['static', 'heart-icon', 16]
const sands: Variation = ['variation', 'sand', 17, 3]
const hut: Static = ['static', 'hut', 20]
const computer: Static = ['static', 'computer', 21]
const printer: Static = ['static', 'printer', 22]
const bed: Static = ['static', 'bed', 23]
const hutFront = ['span', 'hut-front', 24, 3] as const
const empty: Static = ['static', 'empty', 27]
const ruins: Variation = ['variation', 'ruins', 28, 3]
const mountains: Variation = ['variation', 'mountain', 31, 3]
const satellite = ['animation', 'satellite', [500, 34], [500, 35]] as const
const activePortal = ['animation', 'portal', [100, 36], [100, 37]] as const
const skeleton: Static = ['static', 'skeleton', 38]
const keyIcon: Static = ['static', 'key-icon', 39]
const diskIcon: Static = ['static', 'disk-icon', 40]
const curcuitIcon: Static = ['static', 'chip-icon', 41]
const halfTone: Static = ['static', 'half-tone', 42]
const disabledPortal: Static = ['static', 'disabled-satellite', 43]
const inactivePortal: Static = ['static', 'inactive-satellite', 44]

const generateMap = (width: number, height: number) => {
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

export const rangerScene = (): Scene => {
  let isActive = true
  let tiles: Maybe<TileSheet>
  let sprites: Maybe<TileSheet>
  let font: Maybe<BmpFontM>
  let fontPts: Maybe<FontPoints>
  let tileMap: Maybe<TileMap>
  let blocking: Maybe<Set<TileMapCell>>
  let playerAnimLeft: Maybe<(now: number) => Maybe<number>>
  let playerAnimRight: Maybe<(now: number) => Maybe<number>>
  let facing = 'right'

  let cameraX = 0
  let cameraY = 0

  const init = async (state: State) => {
    const tileSheet = await loadImage('scenes/ranger/tiles.png')

    tiles = createTileSheet(tileSheet, tileW, tileH)

    const spriteSheet = await loadImage('scenes/ranger/sprites.png')

    sprites = createTileSheet(spriteSheet, tileW, tileH)

    playerAnimRight = animator([[500, 0], [500, 1]])
    playerAnimLeft = animator([[500, 2], [500, 3]])

    const map = generateMap(tileCols, tileRows)

    tileMap = map.tileMap
    blocking = map.blocking

    cameraX = Math.floor(tileCols / 2)
    cameraY = Math.floor(tileRows / 2)

    font = await loadFontMono('EverexME_5x8')
    fontPts = fontImageToPoints(font)
  }

  const _io = (state: State) => {
    if (!isActive) return

    const keys = state.getKeys()

    if (keys['Escape']) {
      state.setRunning(false)

      // consume the key
      keys['Escape'] = false

      return
    }

    const wheel = state.mouse.takeWheel()
    const zoom = state.view.getZoom()

    if (wheel < 0) {
      state.view.setZoom(zoom + 1)
    } else if (wheel > 0) {
      state.view.setZoom(zoom - 1)
    }

    const presses = state.getKeyPresses()

    let ocx = cameraX
    let ocy = cameraY

    for (const key of presses) {
      if (key.toLowerCase() === 'w' && cameraY > 0) cameraY--
      if (key.toLowerCase() === 's' && cameraY < tileRows - 1) cameraY++

      if (key.toLowerCase() === 'a' && cameraX > 0) {
        cameraX--
        facing = 'left'
      }
      if (key.toLowerCase() === 'd' && cameraX < tileCols - 1) {
        cameraX++
        facing = 'right'
      }
    }

    // consume all key presses
    presses.length = 0

    // check blocking
    const cameraTile = tileMap!.data[cameraY * tileCols + cameraX]

    if (blocking!.has(cameraTile)) {
      cameraX = ocx
      cameraY = ocy
    }
  }

  const update = (state: State) => {
    _io(state)

    if (!maybe(tiles)) throw Error('Expected tiles')
    if (!maybe(tileMap)) throw Error('Expected tileMap')
    if (!maybe(blocking)) throw Error('Expected blocking')
    if (!maybe(sprites)) throw Error('Expected sprites')
    if (!maybe(playerAnimRight)) throw Error('Expected playerAnimRight')
    if (!maybe(playerAnimLeft)) throw Error('Expected playerAnimLeft')
    if (!maybe(font)) throw Error('Expected font')
    if (!maybe(fontPts)) throw Error('Expected fontPts')

    const buffer = state.view.getBuffer()
    const { width, height } = buffer

    const elapsed = state.time.getElapsed()

    const cx = Math.floor(width / 2)
    const cy = Math.floor(height / 2)

    // we will center the view on the camera
    const availW = width - tileW
    const availH = height - tileH

    const colsPerSide = Math.ceil(availW / 2 / tileW)
    const rowsPerSide = Math.ceil(availH / 2 / tileH)

    const cols = colsPerSide * 2 + 1
    const rows = rowsPerSide * 2 + 1

    const leftCol = cameraX - colsPerSide
    const topRow = cameraY - rowsPerSide

    // in pixels relative to the view
    const vLeft = cx - colsPerSide * tileW - tileCx
    const vTop = cy - rowsPerSide * tileH - tileCy

    const playerRectIndex = assrt(
      facing === 'left' ? playerAnimLeft(elapsed) : playerAnimRight(elapsed),
      'Expected player rect'
    )

    const playerRect = sprites.rects[playerRectIndex]

    fill(buffer, createColor(0x00, 0x00, 0x00))

    for (let r = 0; r < rows; r++) {
      const row = topRow + r

      if (row < 0 || row >= tileRows) continue

      const vy = vTop + r * tileH

      for (let c = 0; c < cols; c++) {
        const col = leftCol + c

        if (col < 0 || col >= tileCols) continue

        const vx = vLeft + c * tileW

        const tileIndex = row * tileCols + col

        const cell = tileMap.data[tileIndex]

        const rectIndex = assrt(
          typeof cell === 'number' ? cell : cell(elapsed),
          `Expected rectIndex for cell ${cell}`
        )

        const rect = tiles.rects[rectIndex]

        blit(tiles.image, buffer, [...rect, vx, vy])

        if (col === cameraX && row === cameraY) {
          composite(sprites.image, buffer, [...playerRect, vx, vy])
        }
      }
    }

    //

    const padding = 2

    const frameTime = state.time.getFrameTime()
    const fps = Math.round(1000 / frameTime)
    const fpsText = `${fps} fps (${frameTime.toFixed(1)}ms)`

    const fpsW = font.width * fpsText.length + padding * 2
    const fpsH = font.height + padding * 2
    const fpsX = width - fpsW - padding
    const fpsY = padding

    const fpsBg = createColor(0x00, 0x78, 0xd4)
    const fpsFg = createColor(0xff, 0xd7, 0x00)

    fill(buffer, fpsBg, [fpsX, fpsY, fpsW, fpsH])

    const fpsLayout = layoutTextLine(font, fpsText)

    const fpsIndices = textLayoutToIndices(
      buffer, fpsX + padding, fpsY + padding, fontPts, fpsLayout
    )

    fillIndices(fpsIndices, buffer, fpsFg)
  }

  const quit = async (_state: State) => {
    tiles = null
    tileMap = null
    cameraX = 0
    cameraY = 0
  }

  const setActive = (value: boolean) => {
    isActive = value
  }

  return { init, update, quit, setActive }
}


const fontPath = 'data'

const monoFontFiles = [
  'ATI_SmallW_6x8',
  'EverexME_5x8',
  'HP_100LX_6x8',
  'Portfolio_6x8',
  'TsengEVA_132_6x8',
  'IBM_EGA_8x8',
  'IBM_VGA_8x14',
  'IBM_VGA_8x16',
  'IBM_VGA_9x8',
  'IBM_VGA_9x14',
  'IBM_VGA_9x16'
] as const

type MonoFontName = typeof monoFontFiles[number]

const loadFontMono = async (name: MonoFontName) => {
  const image = await loadImage(`${fontPath}/Bm437_${name}.png`)
  const sizeSlug = assrt(findSizeSlug(name), 'Expected size slug')
  const [width, height] = parseSizeSlug(sizeSlug)

  const cols = assrtInt(image.width / width)
  const rows = assrtInt(image.height / height)

  const font: BmpFontM = {
    type: 'mono',
    width,
    height,
    leading: 0, // built into the bitmap glyphs
    image: image,
    rects: {},
    advance: 0, // built into the bitmap glyphs
    fallback: 127
  }

  for (let r = 0; r < rows; r++) {
    const rowIndex = r * cols
    for (let c = 0; c < cols; c++) {
      const charCode = rowIndex + c

      font.rects[charCode] = [c * width, r * height, width, height]
    }
  }

  return font
}