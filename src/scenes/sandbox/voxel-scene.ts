import { debugTextSceneHelper } from '../../lib/scene/debug-text.js'
import { exitOnEscape, zoomOnWheel } from '../../lib/scene/io.js'
import { Maybe, Scene, State } from '../../lib/types.js'
import { maybe } from '../../lib/util.js'
import { blitVoxels } from '../../lib/voxel/blit.js'
import { Vox } from '../../lib/voxel/types.js'

const mapW = 192
const mapH = 192

const mapCx = mapW / 2
const mapCy = mapH / 2

// todo - set up some guide lines so we can try to sample some of the 3d voxels 
// and drawing into a fixed rect on the buffer
// try using the center of the dest rect as the point to normalize the heightmap
// to, eg if it's height 64, we want that point drawn at the exact center of
// the fixed rect, not 64 pixels up

export const voxelScene = (): Scene => {
  let isActive = false
  let voxels: Maybe<Vox[]>
  let dirty = true
  let debugHelper: Maybe<Scene>
  let debugText: string[] = []

  const init = async (state: State) => {
    voxels = []
    debugHelper = debugTextSceneHelper(() => debugText)

    await debugHelper.init(state)

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
    if (!maybe(debugHelper)) throw Error('debugHelper not initialized')

    if (isActive) io(state)

    if (!dirty) return

    const buffer = state.view.getBuffer()
    const { width, height } = buffer

    blitVoxels(buffer, voxels)

    dirty = false

    const frameTime = state.time.getFrameTime()
    const fps = Math.round(1000 / frameTime)
    const fpsText = `${fps} fps (${frameTime.toFixed(1)}ms)`

    debugText = [fpsText]

    debugHelper.update(state)
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
