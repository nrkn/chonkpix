import { render } from '../lib/engine.js'
import { colorToRgb, createColor, createColor24 } from '../lib/image/color.js'
import { createImage } from '../lib/image/create.js'
import { fill } from '../lib/image/fill.js'
import { loadImage } from '../lib/image/load.js'
import { resize } from '../lib/image/resize.js'
import { Maybe, Scene, State, T2 } from '../lib/types.js'
import { maybe } from '../lib/util.js'

import {
  GeneratedPalette, generatePalette,
  indexOfClosestRgb
} from '../sandbox/generate-palette.js'

// experimenting with indexed palette
export const paletteSandboxScene = (): Scene => {
  let palette: Maybe<GeneratedPalette> = null
  let testImage: Maybe<ImageData> = null

  // these naive luts are slow to generate and take a lot of memory, but they
  // serve as a good reference implementation and baseline for performance
  // comparisons
  //
  // 16mb!
  let naiveLut: Maybe<Uint8Array> = null
  // 64mb!
  let naiveLut32: Maybe<Uint32Array> = null

  // testing an idea
  // also 16mb
  let naiveLut2: Maybe<Uint8Array> = null
  let pal2: Maybe<Uint32Array> = null
  let naive2Lut32: Maybe<Uint32Array> = null

  const createPalImage = (
    pal: GeneratedPalette, w: number, h: number
  ) => {
    const palImage = createImage(w, h)

    fill(palImage, createColor(0x00, 0xff, 0xff))

    for (let y = 0; y < h; y++) {
      const row = y * w
      for (let x = 0; x < w; x++) {
        const index = row + x
        const palIndex = index * 3

        if (palIndex >= pal.data.length) {
          break
        }

        const r = pal.data[palIndex]
        const g = pal.data[palIndex + 1]
        const b = pal.data[palIndex + 2]

        const imgIndex = index * 4

        palImage.data[imgIndex] = r
        palImage.data[imgIndex + 1] = g
        palImage.data[imgIndex + 2] = b
        palImage.data[imgIndex + 3] = 255
      }
    }

    return palImage
  }

  const createPal2Image = (
    pal: Uint32Array, w: number, h: number
  ) => {
    if (pal.length > w * h) {
      throw Error('Palette is too large for image')
    }
    const palImage = createImage(w, h)

    fill(palImage, createColor(0x00, 0xff, 0xff))

    pal = pal.map(color => color | 0xff000000)

    const view = new Uint32Array(palImage.data.buffer)

    view.set(pal)

    return palImage
  }

  const init = async (state: State) => {
    const buffer = state.view.getBuffer()

    fill(buffer, createColor(0x00, 0x00, 0x00))

    console.log('starting init')

    const { width, height } = buffer

    const progressBarWidth = Math.floor(width * 0.8)
    const progressBarX = Math.floor(width * 0.1)
    const progressBarY = Math.floor(height * 0.5)
    const progressBarHeight = 2

    const progress = (total: number) => {
      const step = progressBarWidth / total

      return (i: number) => {
        fill(
          buffer,
          createColor(0x66, 0x66, 0x66),
          [progressBarX, progressBarY, progressBarWidth, progressBarHeight]
        )

        const width = Math.round(step * i)

        fill(
          buffer,
          createColor(0x33, 0x99, 0xff),
          [progressBarX, progressBarY, width, progressBarHeight]
        )

        render()
      }
    }

    // reserve one color for eg transparent
    palette = generatePalette(255, 12, 4, 5)

    // just log the metadata
    const noEntries = {
      ...palette,
      data: undefined
    }

    console.log(noEntries)

    testImage = await loadImage('scenes/pal/colors.png')

    const palColors: T2[] = []

    for (let i = 0; i < palette.entryCount; i++) {
      const r = palette.data[i * 3]
      const g = palette.data[i * 3 + 1]
      const b = palette.data[i * 3 + 2]

      const color24 = createColor24(r, g, b)

      palColors.push([color24, i])
    }

    palColors.sort((a, b) => a[0] - b[0])

    console.log('palColors', palColors)

    const palMapNewToOld = Array<number>(palette.entryCount)
    const palMapOldToNew = Array<number>(palette.entryCount)

    for (let i = 0; i < palColors.length; i++) {
      const oldIndex = palColors[i][1]

      palMapNewToOld[i] = oldIndex
      palMapOldToNew[oldIndex] = i
    }

    pal2 = new Uint32Array(palette.entryCount)

    for (let i = 0; i < palette.entryCount; i++) {
      pal2[i] = palColors[i][0]
    }

    console.log('pal2', pal2)

    naive2Lut32 = new Uint32Array(palette.entryCount)

    for (let i = 0; i < palette.entryCount; i++) {
      const r = palette.data[i * 3]
      const g = palette.data[i * 3 + 1]
      const b = palette.data[i * 3 + 2]

      const color = createColor(r, g, b)

      naive2Lut32[i] = color
    }

    // 

    const numColors24 = 0xffffff

    const rValues = new Set<number>()
    const gValues = new Set<number>()
    const bValues = new Set<number>()
    const cValues = new Set<number>()

    const stepCount = 10

    const p = progress(stepCount)

    console.log('generated palette lookups')

    p(0)
    await render()

    const pstep = numColors24 / stepCount
    let cstep = pstep
    let pval = 0

    const nlutStart = performance.now()
    naiveLut = new Uint8Array(numColors24)
    naiveLut32 = new Uint32Array(numColors24)

    naiveLut2 = new Uint8Array(numColors24)

    for (let i = 0; i < 0xffffff; i++) {
      const [r, g, b] = colorToRgb(i)
      const index = indexOfClosestRgb(palette, [r, g, b])
      naiveLut[i] = index
      naiveLut2[i] = palMapOldToNew[index]

      const palR = palette.data[index * 3]
      const palG = palette.data[index * 3 + 1]
      const palB = palette.data[index * 3 + 2]

      rValues.add(palR)
      gValues.add(palG)
      bValues.add(palB)

      cValues.add(palR)
      cValues.add(palG)
      cValues.add(palB)

      const color = createColor(palR, palG, palB)

      naiveLut32[i] = color

      if (i >= cstep) {
        cstep += pstep
        pval++
        p(pval)

        await render()
      }
    }

    const nlutEnd = performance.now()

    console.log('Naive LUTs Time:', nlutEnd - nlutStart)

    console.log('Naive LUT', naiveLut)
    console.log('Naive LUT 2', naiveLut2)

    //

    const rArr = Array.from(rValues)
    const gArr = Array.from(gValues)
    const bArr = Array.from(bValues)
    const cArr = Array.from(cValues)

    rArr.sort((a, b) => a - b)
    gArr.sort((a, b) => a - b)
    bArr.sort((a, b) => a - b)
    cArr.sort((a, b) => a - b)

    console.log('rArr', rArr)
    console.log('gArr', gArr)
    console.log('bArr', bArr)
    console.log('cArr', cArr)

    //

    // naiveLut is a mapping where the index is the 24 bit rgb value and the
    // value is the index of the closest color in the palette
    //
    // consecutive 24 bit indices all point to the same palette index in runs
    // we could compress the structure like so:
    // 
    // we use a Uint32Array to store two fields:
    // 1. the 24 bit value that is the *end* of the row of consecutive indices
    // 2. the 8 bit palette index
    //
    // then, to map rgb to index, you search through each field to find the 
    // first end of row which is greater than or equal to the rgb value
    // and return the palette index
    // it will be a bit slower than eg naiveLut32 which is the fastest, but 
    // that structure is ~64mb

    let prev = -1
    let rowCount = 0

    for (let i = 0; i < numColors24; i++) {
      const value = naiveLut[i]

      if (value !== prev) {
        rowCount++
      }

      prev = value
    }

    // it will have rowCount rows

    console.log('rowcount:', rowCount, 'bytes:', rowCount * 4)

    //

    createNewLutThing(palette)
  }

  let isDisableUpdate = false

  const update = (state: State) => {
    if (!maybe(palette)) throw Error('Palette not generated')
    if (!maybe(testImage)) throw Error('Test image not loaded')
    if (!maybe(naiveLut)) throw Error('Naive LUT not generated')
    if (!maybe(naiveLut32)) throw Error('Naive LUT32 not generated')
    if (!maybe(naiveLut2)) throw Error('Naive LUT2 not generated')
    if (!maybe(pal2)) throw Error('Pal2 not generated')
    if (!maybe(naive2Lut32)) throw Error('Naive2 LUT32 not generated')

    // temp 
    if (isDisableUpdate) return

    const wheel = state.mouse.getWheel()
    const zoom = state.view.getZoom()

    if (wheel < 0) {
      state.view.setZoom( zoom + 1 )
    } else if (wheel > 0) {
      state.view.setZoom( zoom - 1 )
    }

    const buffer = state.view.getBuffer()

    fill(buffer, createColor(0x00, 0x00, 0x00))

    logOnce('bufferPixels', 'Buffer pixels:', buffer.width * buffer.height)

    // could optimize by doing this in init, but the scene easily hits 60fps
    // and it's just a sandbox

    // palette stuff

    const numPals = 2

    //

    const palWidth = palette.lightRange
    const palHeight = Math.ceil(palette.entryCount / palWidth)

    //

    const palImage = createPalImage(palette, palWidth, palHeight)

    const newHeight = buffer.height
    const scale = newHeight / palHeight
    const newWidth = Math.floor(palWidth * scale)

    resize(
      palImage, buffer,
      [0, 0, palWidth, palHeight], [0, 0, newWidth, newHeight]
    )

    //

    const pal2Image = createPal2Image(pal2, palWidth, palHeight)

    resize(
      pal2Image, buffer,
      [0, 0, palWidth, palHeight], [newWidth, 0, newWidth, newHeight]
    )

    //

    const palsWidth = newWidth * numPals

    //

    const remainingWidth = buffer.width - palsWidth

    //
    const imageCount = 5

    // make space for images side by side
    const imageWidths = Math.floor(remainingWidth / imageCount)

    // next we'll try converting an image to palette and show the original
    // and converted side by side, then we can start experimenting with
    // creating a LUT

    const newOrigWidth = imageWidths
    const scaleOrig = newOrigWidth / testImage.width
    const newOrigHeight = Math.floor(testImage.height * scaleOrig)

    resize(
      testImage, buffer,
      [0, 0, testImage.width, testImage.height],
      [palsWidth, 0, newOrigWidth, newOrigHeight]
    )

    const colorsOrig = countUniqueColors(testImage)

    logOnce('colorsOrig', 'Unique colors in original image:', colorsOrig)

    // slow indexed conversion, direct search

    const startConv0Time = performance.now()
    const indexed = toPalette(testImage, palette)
    const endConv0Time = performance.now()

    const colorsIndexed = countUniqueColors(indexed)

    logOnce(
      'conv0',
      'Conversion 0 time:', endConv0Time - startConv0Time,
      'Pixel count:', testImage.width * testImage.height,
      'Unique colors:', colorsIndexed
    )

    resize(
      indexed, buffer,
      [0, 0, indexed.width, indexed.height],
      [palsWidth + newOrigWidth, 0, newOrigWidth, newOrigHeight]
    )

    // LUT experiments

    const startConv1Time = performance.now()
    const indexedLut = toPaletteLut(testImage, palette, naiveLut)
    const endConv1Time = performance.now()

    const colorsLut = countUniqueColors(indexedLut)

    logOnce(
      'conv1',
      'Conversion 1 time:', endConv1Time - startConv1Time,
      'Pixel count:', testImage.width * testImage.height,
      'Unique colors:', colorsLut
    )

    resize(
      indexedLut, buffer,
      [0, 0, indexedLut.width, indexedLut.height],
      [palsWidth + newOrigWidth * 2, 0, newOrigWidth, newOrigHeight]
    )

    //

    const startConv2Time = performance.now()
    const indexedLut32 = toPaletteLut32(testImage, naiveLut32)
    const endConv2Time = performance.now()

    const colorsLut32 = countUniqueColors(indexedLut32)

    logOnce(
      'conv2',
      'Conversion 2 time:', endConv2Time - startConv2Time,
      'Pixel count:', testImage.width * testImage.height,
      'Unique colors:', colorsLut32
    )

    resize(
      indexedLut32, buffer,
      [0, 0, indexedLut32.width, indexedLut32.height],
      [palsWidth + newOrigWidth * 3, 0, newOrigWidth, newOrigHeight]
    )
    // 

    const startLut2Time = performance.now()
    const { chCount, channelLookup, table } = createNewLutThing(palette)
    const endLut2Time = performance.now()

    logOnce(
      'lut2',
      'LUT 2 time:', endLut2Time - startLut2Time,
      'Table size:', table.byteLength
    )

    const startConv3Time = performance.now()
    const indexedLookup2 = toPaletteLookup3(
      testImage, naive2Lut32,
      chCount, channelLookup, table
    )
    const endConv3Time = performance.now()

    const colorsLookup2 = countUniqueColors(indexedLookup2)

    logOnce(
      'conv3',
      'Conversion 3 time:', endConv3Time - startConv3Time,
      'Pixel count:', testImage.width * testImage.height,
      'Unique colors:', colorsLookup2
    )

    resize(
      indexedLookup2, buffer,
      [0, 0, indexedLookup2.width, indexedLookup2.height],
      [palsWidth + newOrigWidth * 4, 0, newOrigWidth, newOrigHeight]
    )
  }

  const quit = async (_state: State) => {
    palette = null
  }

  return { init, update, quit }
}

const seen = new Set<string>()
const logOnce = (id: string, ...args: any[]) => {
  if (seen.has(id)) return
  seen.add(id)
  console.log(...args)
}

const toPalette = (image: ImageData, palette: GeneratedPalette): ImageData => {
  const newImage = createImage(image.width, image.height)

  //

  for (let y = 0; y < image.height; y++) {
    const row = y * image.width
    for (let x = 0; x < image.width; x++) {
      const index = row + x
      const dataIndex = index * 4

      const or = image.data[dataIndex]
      const og = image.data[dataIndex + 1]
      const ob = image.data[dataIndex + 2]

      const palIndex = indexOfClosestRgb(palette, [or, og, ob])

      const pr = palette.data[palIndex * 3]
      const pg = palette.data[palIndex * 3 + 1]
      const pb = palette.data[palIndex * 3 + 2]

      newImage.data[dataIndex] = pr
      newImage.data[dataIndex + 1] = pg
      newImage.data[dataIndex + 2] = pb
      newImage.data[dataIndex + 3] = 255
    }
  }

  //

  return newImage
}

const toPaletteLut = (
  image: ImageData, palette: GeneratedPalette, lut: Uint8Array
): ImageData => {
  const newImage = createImage(image.width, image.height)

  //

  for (let y = 0; y < image.height; y++) {
    const row = y * image.width
    for (let x = 0; x < image.width; x++) {
      const index = row + x
      const dataIndex = index * 4

      const or = image.data[dataIndex]
      const og = image.data[dataIndex + 1]
      const ob = image.data[dataIndex + 2]

      const lutIndex = createColor24(or, og, ob)
      const palIndex = lut[lutIndex]

      const pr = palette.data[palIndex * 3]
      const pg = palette.data[palIndex * 3 + 1]
      const pb = palette.data[palIndex * 3 + 2]

      newImage.data[dataIndex] = pr
      newImage.data[dataIndex + 1] = pg
      newImage.data[dataIndex + 2] = pb
      newImage.data[dataIndex + 3] = 255
    }
  }

  //

  return newImage
}

const toPaletteLut32 = (
  src: ImageData, lut: Uint32Array
): ImageData => {
  const newImage = createImage(src.width, src.height)

  const size = src.width * src.height

  const srcView = new Uint32Array(src.data.buffer)
  const destView = new Uint32Array(newImage.data.buffer)

  //

  for (let i = 0; i < size; i++) {
    const rgba = srcView[i]
    const rgb = rgba & 0x00ffffff

    destView[i] = lut[rgb]
  }

  //

  return newImage
}

const toPaletteLookup3 = (
  src: ImageData, colors: Uint32Array,
  chCount: number, channelLookup: Uint8Array, table: Uint8Array
): ImageData => {
  const dest = createImage(src.width, src.height)

  const destView = new Uint32Array(dest.data.buffer)

  //

  const rOffsetSize = chCount * chCount

  for (let y = 0; y < src.height; y++) {
    const row = y * src.width
    for (let x = 0; x < src.width; x++) {
      const index = row + x
      const dataIndex = index * 4

      const or = src.data[dataIndex]
      const og = src.data[dataIndex + 1]
      const ob = src.data[dataIndex + 2]

      const ri = channelLookup[or]
      const gi = channelLookup[og]
      const bi = channelLookup[ob]

      const riOffset = ri * rOffsetSize
      const giOffset = gi * chCount
      const lookup = bi + giOffset + riOffset

      const closest = table[lookup]

      destView[index] = colors[closest] | 0xff000000
    }
  }

  //

  return dest
}

/*
  ok new strategy

  1. generate a palette
  2. for every color, get the three channels and add their values to a set
  3. at the end, you have a set of values for every possible channel value
     eg for our 12/4/5 hue generated palette of 255 colors, there are 38 unique
     values for every channel
  4. create a lookup table with 0..255 indices, and the nearest match from our
     set
  5. experiment - one we reconstruct a color from an unindexed image, is every
     value present in our palette?

  In our example with 38 unique values, there are 38**3 (54,872) possible 
  colors, a lot less than our 16 million colorspace   

  First, convert raw r, g, b into range 0..37 matching to index of closest value 
  in the set

  So you can make a lookup table which is a Uint8Array of 38**3 entries

  You can index into it by:

  r [0..37]
  g [0..37]
  b [0..37]

  const index = ( r * 38 * 38 ) + ( g * 38 ) + b

  with each index pointing to a palette index
*/

const nearestMatch = (values: number[], value: number) => {
  let closest = values[0]
  let closestDist = Math.abs(value - closest)

  for (let i = 1; i < values.length; i++) {
    const dist = Math.abs(value - values[i])

    if (dist < closestDist) {
      closest = values[i]
      closestDist = dist
    }
  }

  return closest
}

const createNewLutThing = (palette: GeneratedPalette) => {
  const channelSet = new Set<number>()

  for (let i = 0; i < palette.entryCount; i++) {
    channelSet.add(palette.data[i * 3])
    channelSet.add(palette.data[i * 3 + 1])
    channelSet.add(palette.data[i * 3 + 2])
  }

  const values = Array.from(channelSet).sort((a, b) => a - b)

  const chCount = values.length

  const channelLookup = new Uint8Array(256)

  for (let i = 0; i < 256; i++) {
    const closest = nearestMatch(values, i)

    channelLookup[i] = values.indexOf(closest)
  }

  const tableSize = chCount ** 3

  const table = new Uint8Array(tableSize)

  const rSize = chCount * chCount

  for (let ri = 0; ri < chCount; ri++) {
    const riOffset = ri * rSize
    for (let gi = 0; gi < chCount; gi++) {
      const giOffset = gi * chCount + riOffset
      for (let bi = 0; bi < chCount; bi++) {
        const index = bi + giOffset

        const r = values[ri]
        const g = values[gi]
        const b = values[bi]

        const closest = indexOfClosestRgb(palette, [r, g, b])

        table[index] = closest
      }
    }
  }

  return { chCount, channelLookup, table }
}

const countUniqueColors = (image: ImageData): number => {
  const set = new Set<number>()

  const imageView = new Uint32Array(image.data.buffer)

  for (let i = 0; i < imageView.length; i++) {
    set.add(imageView[i])
  }

  return set.size
}
