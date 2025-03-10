import { progressControl } from '../lib/controls/progress.js'
import { generateHeightmap } from '../lib/heightmap/generate/index.js'
import { flattenRect, lowerRect, raiseRect } from '../lib/heightmap/sculpt.js'
import { heightmapToPoint3, maxHeight, minHeight, normalizeHeightmap } from '../lib/heightmap/util.js'
import { randInt } from '../lib/random.js'
import { fpsSceneHelper } from '../lib/scene/fps.js'
import { exitOnEscape, zoomOnWheel } from '../lib/scene/io.js'
import { Maybe, Scene, State } from '../lib/types.js'
import { maybe } from '../lib/util.js'
import { blitVoxels } from '../lib/voxel/blit.js'
import { createPlane, createWall } from '../lib/voxel/generate/create.js'
import { Vox } from '../lib/voxel/types.js'

const mapW = 192
const mapH = 192

const mapCx = mapW / 2
const mapCy = mapH / 2

export const voxelScene = (): Scene => {
  let isActive = false
  let voxels: Maybe<Vox[]>
  let dirty = true
  let fpsHelper: Maybe<Scene>

  const init = async (state: State) => {
    voxels = await generateVoxels(state)
    fpsHelper = fpsSceneHelper()

    await fpsHelper.init(state)

    isActive = true
  }

  const io = (state: State) => {
    if (exitOnEscape(state)) return

    if (zoomOnWheel(state)) {
      dirty = true
    }
  }

  const update = (state: State) => {
    if (!maybe(voxels)) throw Error('voxels not initialized')
    if (!maybe(fpsHelper)) throw Error('fpsHelper not initialized')

    if (isActive) io(state)

    if (!dirty) return

    const buffer = state.view.getBuffer()
    const { width, height } = buffer

    blitVoxels(buffer, voxels)

    dirty = false

    fpsHelper.update(state)
  }

  const quit = async (_state: State) => {
    isActive = false
    voxels = null
  }

  const setActive = (active: boolean) => {
    isActive = active
  }

  return { init, update, quit, setActive }
}

const generateVoxels = async (state: State) => {
  const buffer = state.view.getBuffer()
  const { width, height } = buffer

  // 100 ticks for hm generation
  // 1 tick for sculpting
  // 10 ticks for converting
  // 10 ticks for sorting

  const startHmTime = performance.now()

  let hm = generateHeightmap(mapW, mapH, mapW * mapH * 8 )

  hm = normalizeHeightmap(hm)

  const endHmTime = performance.now()

  console.log(`heightmap generation took ${endHmTime - startHmTime}ms`)

  // sculpt the heightmap

  const startSculptTime = performance.now()

  const raisedHeight = raiseRect(hm, 96, 80, 16, 12)

  // x0,z0,x1,z1,y0,h - 3d coordinate system of voxel space
  const rTopWall = createWall(97, 111, 110, 111, raisedHeight, 8)
  const rBottomWall = createWall(97, 101, 110, 101, raisedHeight, 8)
  const rLeftWall = createWall(97, 110, 97, 102, raisedHeight, 8)
  const rRightWall = createWall(110, 110, 110, 102, raisedHeight, 8)

  const rRoof = createPlane(97, raisedHeight + 8, 101, 14, 10)

  const rWalls = [
    ...rTopWall,
    ...rBottomWall,
    ...rLeftWall,
    ...rRightWall,
    ...rRoof
  ]

  const loweredHeight = lowerRect(hm, 32, 48, 12, 16)

  const flattenedHeight = flattenRect(hm, 64, 64, 16, 24)

  const endSculptTime = performance.now()

  console.log(`sculpting took ${endSculptTime - startSculptTime}ms`)

  // convert the buildings

  const startConvertTime = performance.now()

  const rWallsVox = rWalls.map(([x, y, z]) => {
    let fcolor = 0
    let tcolor = 0

    const d = mapH * 2
    const darken = 1 - z / d

    const v = randInt(32) - 16

    const grey = (v + 128 + y * 0.5) * darken
    const darkGrey = grey * 0.75

    fcolor = 0xff000000 | (grey << 16) | (grey << 8) | grey
    tcolor = 0xff000000 | (darkGrey << 16) | (darkGrey << 8) | darkGrey

    return [x, y, z, tcolor, fcolor] as Vox
  })

  // convert the hm

  const hmP3s = heightmapToPoint3(hm)

  const hmMin = minHeight(hm)
  const hmMax = maxHeight(hm)

  const hmDelta = hmMax - hmMin

  const greenRange = mapH

  const greenStep = greenRange / hmDelta

  const hmP3sVox = hmP3s.map(([x, y, z]) => {
    let hmTopColor = 0
    let hmFrontColor = 0

    // darken slightly as z increases
    // lower d numbers = more dark, higher = less dark
    const d = mapH * 2
    const darken = 1 - z / d

    // add a little randomness to the green color by using small red/blue values
    const red = (randInt(32) + 16) //* darken
    const darkRed = red * 0.75
    const blue = (randInt(32) + 16) //* darken
    const darkBlue = blue * 0.75

    // top should gets brighter as y increases
    // front should be top but darkened a bit
    //
    // make it a little random so it looks more interesting
    const g = randInt(32) - 16
    // then apply a gradient based on height
    const green = (g + 64 + y * greenStep) * darken
    const darkGreen = green * 0.75

    hmTopColor = 0xff000000 | (blue << 16) | (green << 8) | red
    hmFrontColor = 0xff000000 | (darkBlue << 16) | (darkGreen << 8) | darkRed

    return [x, y, z, hmTopColor, hmFrontColor] as Vox
  })

  const endConvertTime = performance.now()

  console.log(`converting took ${endConvertTime - startConvertTime}ms`)

  // create and sort voxels

  const startVoxTime = performance.now()

  const voxels: Vox[] = []

  voxels.push(...rWallsVox)
  voxels.push(...hmP3sVox)

  voxels.sort((a, b) => {
    // sort on z - bigger is further away
    const zDelta = b[2] - a[2]

    if (zDelta !== 0) {
      return zDelta
    }

    // tie break on y - we want to sort smaller y first
    // so that the "tops" of voxels overlay correctly
    return a[1] - b[1]
  })

  const endVoxTime = performance.now()

  console.log(`voxel creation took ${endVoxTime - startVoxTime}ms`)

  console.log(`total time: ${endVoxTime - startHmTime}ms`)
  console.log(`voxel count: ${voxels.length}`)

  return voxels
}