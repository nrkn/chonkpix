import { debugScene } from './scenes/debug-scene.js'
import { start } from './lib/engine.js'
import { textSandboxScene } from './scenes/text-sandbox-scene.js'
import { State } from './lib/types.js'
import { splitScene } from './scenes/split-scene.js'

let isSwitchBetweenScenes = false

const debug = debugScene()
const text = textSandboxScene()
const split = splitScene(text,debug)

const { quit: debugQuit } = debug
const { quit: textQuit } = text
const { quit: splitQuit } = split

// use this for switching between full screen exclusive scenes:
// const scenes = [
//   [debug, debugQuit],
//   [text, textQuit]
// ] as const

// or this for split screen scenes:
const scenes = [
  [split, splitQuit]
] as const

let sceneIndex = 0

const onQuit = async (state: State) => {
  let sceneData = scenes[sceneIndex]

  const baseQuit = sceneData[1]

  await baseQuit(state)

  if( isSwitchBetweenScenes ){
    sceneIndex++

    if (sceneIndex >= scenes.length) {
      sceneIndex = 0
    }
  
    sceneData = scenes[sceneIndex]

    console.log( 'Switching to scene', sceneIndex )
  } else {
    console.log( 'Restarting current scene')
  }

  start(sceneData[0]).catch(console.error)
}

//debug.quit = onQuit
//text.quit = onQuit
split.quit = onQuit

start(scenes[sceneIndex][0]).catch(console.error)
