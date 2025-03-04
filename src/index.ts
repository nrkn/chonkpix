import { debugScene } from './scenes/debug-scene.js'
import { start } from './lib/engine.js'
import { textSandboxScene } from './scenes/text-sandbox-scene.js'
import { State } from './lib/types.js'
import { splitScene } from './scenes/split-scene.js'
import { paletteSandboxScene } from './scenes/palette-scene.js'
import { rangerScene } from './scenes/ranger/scene.js'

const debug = debugScene()
const text = textSandboxScene()
const split = splitScene(text, debug)
const pal = paletteSandboxScene()
//const ranger = rangerScene()
const ranger = rangerScene()

const { quit: debugQuit } = debug
const { quit: textQuit } = text
const { quit: splitQuit } = split
const { quit: palQuit } = pal
const { quit: rangerQuit } = ranger

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
  [ranger, rangerQuit]
  //[pal, palQuit]
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
ranger.quit = onQuit

start(scenes[sceneIndex][0]).catch(console.error)
