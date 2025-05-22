import { debugScene } from './scenes/sandbox/debug-scene.js'
import { start } from './lib/engine.js'
import { textSandboxScene } from './scenes/sandbox/text-sandbox-scene.js'
import { State } from './lib/types.js'
import { splitScene } from './scenes/sandbox/split-scene.js'
import { paletteSandboxScene } from './scenes/sandbox/palette-scene.js'
import { rangerScene } from './scenes/sandbox/ranger/scene.js'
import { voxelScene } from './scenes/sandbox/voxel-scene.js'
import { hslScene } from './scenes/sandbox/hsl-scene.js'
import { carScene } from './scenes/sandbox/car-scene.js'
import { dosScene } from './scenes/sandbox/dos/dos-scene.js'

const debug = debugScene()
const text = textSandboxScene()
const split = splitScene(text, debug)
const pal = paletteSandboxScene()
const ranger = rangerScene()
const voxel = voxelScene()
const hsl = hslScene()
const car = carScene()
const dos = dosScene()

const { quit: debugQuit } = debug
const { quit: textQuit } = text
const { quit: splitQuit } = split
const { quit: palQuit } = pal
const { quit: rangerQuit } = ranger
const { quit: voxelQuit } = voxel
const { quit: hslQuit } = hsl
const { quit: carQuit } = car
const { quit: dosQuit } = dos

// use this for switching between full screen exclusive scenes:
// const scenes = [
//   [text, textQuit],
//   [debug, debugQuit],  
//   [pal, palQuit]
// ] as const

// or this for split screen scenes:
// const scenes = [
//   [split, splitQuit]
// ] as const

// or this for a single scene:
const scenes = [
  //[ranger, rangerQuit]
  //[pal, palQuit]
  //[ voxel, voxelQuit ]
  //[hsl, hslQuit]
  //[car, carQuit]
   //[text, textQuit]
   [dos, dosQuit]
] as const

let sceneIndex = 0

const onQuit = async (state: State) => {
  let sceneData = scenes[sceneIndex]

  const baseQuit = sceneData[1]

  await baseQuit(state)

  sceneIndex++

  if (sceneIndex >= scenes.length) {
    sceneIndex = 0
  }

  sceneData = scenes[sceneIndex]

  if (scenes.length > 1) {
    console.log('Switching to scene', sceneIndex)
  } else {
    console.log('Restarting scene')
  }


  start(sceneData[0]).catch(console.error)
}

// when using split, leave all except split commented out
// when using a single scene, leave the others commented out
// when switching between scenes, uncomment all participants

//debug.quit = onQuit
//text.quit = onQuit
//split.quit = onQuit
//pal.quit = onQuit
//ranger.quit = onQuit
//voxel.quit = onQuit
//hsl.quit = onQuit
//car.quit = onQuit
dos.quit = onQuit

start(scenes[sceneIndex][0]).catch(console.error)
