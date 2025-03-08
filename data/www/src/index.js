import { debugScene } from './scenes/debug-scene.js';
import { start } from './lib/engine.js';
import { textSandboxScene } from './scenes/text-sandbox-scene.js';
import { splitScene } from './scenes/split-scene.js';
import { paletteSandboxScene } from './scenes/palette-scene.js';
import { rangerScene } from './scenes/ranger/scene.js';
const debug = debugScene();
const text = textSandboxScene();
const split = splitScene(text, debug);
const pal = paletteSandboxScene();
//const ranger = rangerScene()
const ranger = rangerScene();
const { quit: debugQuit } = debug;
const { quit: textQuit } = text;
const { quit: splitQuit } = split;
const { quit: palQuit } = pal;
const { quit: rangerQuit } = ranger;
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
];
let sceneIndex = 0;
const onQuit = async (state) => {
    let sceneData = scenes[sceneIndex];
    const baseQuit = sceneData[1];
    await baseQuit(state);
    sceneIndex++;
    if (sceneIndex >= scenes.length) {
        sceneIndex = 0;
    }
    sceneData = scenes[sceneIndex];
    if (scenes.length > 1) {
        console.log('Switching to scene', sceneIndex);
    }
    else {
        console.log('Restarting scene');
    }
    start(sceneData[0]).catch(console.error);
};
// when using split, leave all except split commented out
// when using a single scene, leave the others commented out
// when switching between scenes, uncomment all participants
//debug.quit = onQuit
//text.quit = onQuit
//split.quit = onQuit
//pal.quit = onQuit
ranger.quit = onQuit;
start(scenes[sceneIndex][0]).catch(console.error);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLHlCQUF5QixDQUFBO0FBQ3BELE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQTtBQUN2QyxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSxnQ0FBZ0MsQ0FBQTtBQUVqRSxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0seUJBQXlCLENBQUE7QUFDcEQsT0FBTyxFQUFFLG1CQUFtQixFQUFFLE1BQU0sMkJBQTJCLENBQUE7QUFDL0QsT0FBTyxFQUFFLFdBQVcsRUFBRSxNQUFNLDBCQUEwQixDQUFBO0FBRXRELE1BQU0sS0FBSyxHQUFHLFVBQVUsRUFBRSxDQUFBO0FBQzFCLE1BQU0sSUFBSSxHQUFHLGdCQUFnQixFQUFFLENBQUE7QUFDL0IsTUFBTSxLQUFLLEdBQUcsVUFBVSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQTtBQUNyQyxNQUFNLEdBQUcsR0FBRyxtQkFBbUIsRUFBRSxDQUFBO0FBQ2pDLDhCQUE4QjtBQUM5QixNQUFNLE1BQU0sR0FBRyxXQUFXLEVBQUUsQ0FBQTtBQUU1QixNQUFNLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxHQUFHLEtBQUssQ0FBQTtBQUNqQyxNQUFNLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxHQUFHLElBQUksQ0FBQTtBQUMvQixNQUFNLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxHQUFHLEtBQUssQ0FBQTtBQUNqQyxNQUFNLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxHQUFHLEdBQUcsQ0FBQTtBQUM3QixNQUFNLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxHQUFHLE1BQU0sQ0FBQTtBQUVuQywrREFBK0Q7QUFDL0QsbUJBQW1CO0FBQ25CLHNCQUFzQjtBQUN0QiwwQkFBMEI7QUFDMUIsbUJBQW1CO0FBQ25CLGFBQWE7QUFFYixtQ0FBbUM7QUFDbkMsbUJBQW1CO0FBQ25CLHVCQUF1QjtBQUN2QixhQUFhO0FBRWIsOEJBQThCO0FBQzlCLE1BQU0sTUFBTSxHQUFHO0lBQ2IsQ0FBQyxNQUFNLEVBQUUsVUFBVSxDQUFDO0lBQ3BCLGdCQUFnQjtDQUNSLENBQUE7QUFFVixJQUFJLFVBQVUsR0FBRyxDQUFDLENBQUE7QUFFbEIsTUFBTSxNQUFNLEdBQUcsS0FBSyxFQUFFLEtBQVksRUFBRSxFQUFFO0lBQ3BDLElBQUksU0FBUyxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQTtJQUVsQyxNQUFNLFFBQVEsR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUE7SUFFN0IsTUFBTSxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUE7SUFFckIsVUFBVSxFQUFFLENBQUE7SUFFWixJQUFJLFVBQVUsSUFBSSxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDaEMsVUFBVSxHQUFHLENBQUMsQ0FBQTtJQUNoQixDQUFDO0lBRUQsU0FBUyxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQTtJQUU5QixJQUFJLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7UUFDdEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsRUFBRSxVQUFVLENBQUMsQ0FBQTtJQUMvQyxDQUFDO1NBQU0sQ0FBQztRQUNOLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQWtCLENBQUMsQ0FBQTtJQUNqQyxDQUFDO0lBR0QsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUE7QUFDMUMsQ0FBQyxDQUFBO0FBRUQseURBQXlEO0FBQ3pELDREQUE0RDtBQUM1RCw0REFBNEQ7QUFFNUQscUJBQXFCO0FBQ3JCLG9CQUFvQjtBQUNwQixxQkFBcUI7QUFDckIsbUJBQW1CO0FBQ25CLE1BQU0sQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFBO0FBRXBCLEtBQUssQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZGVidWdTY2VuZSB9IGZyb20gJy4vc2NlbmVzL2RlYnVnLXNjZW5lLmpzJ1xyXG5pbXBvcnQgeyBzdGFydCB9IGZyb20gJy4vbGliL2VuZ2luZS5qcydcclxuaW1wb3J0IHsgdGV4dFNhbmRib3hTY2VuZSB9IGZyb20gJy4vc2NlbmVzL3RleHQtc2FuZGJveC1zY2VuZS5qcydcclxuaW1wb3J0IHsgU3RhdGUgfSBmcm9tICcuL2xpYi90eXBlcy5qcydcclxuaW1wb3J0IHsgc3BsaXRTY2VuZSB9IGZyb20gJy4vc2NlbmVzL3NwbGl0LXNjZW5lLmpzJ1xyXG5pbXBvcnQgeyBwYWxldHRlU2FuZGJveFNjZW5lIH0gZnJvbSAnLi9zY2VuZXMvcGFsZXR0ZS1zY2VuZS5qcydcclxuaW1wb3J0IHsgcmFuZ2VyU2NlbmUgfSBmcm9tICcuL3NjZW5lcy9yYW5nZXIvc2NlbmUuanMnXHJcblxyXG5jb25zdCBkZWJ1ZyA9IGRlYnVnU2NlbmUoKVxyXG5jb25zdCB0ZXh0ID0gdGV4dFNhbmRib3hTY2VuZSgpXHJcbmNvbnN0IHNwbGl0ID0gc3BsaXRTY2VuZSh0ZXh0LCBkZWJ1ZylcclxuY29uc3QgcGFsID0gcGFsZXR0ZVNhbmRib3hTY2VuZSgpXHJcbi8vY29uc3QgcmFuZ2VyID0gcmFuZ2VyU2NlbmUoKVxyXG5jb25zdCByYW5nZXIgPSByYW5nZXJTY2VuZSgpXHJcblxyXG5jb25zdCB7IHF1aXQ6IGRlYnVnUXVpdCB9ID0gZGVidWdcclxuY29uc3QgeyBxdWl0OiB0ZXh0UXVpdCB9ID0gdGV4dFxyXG5jb25zdCB7IHF1aXQ6IHNwbGl0UXVpdCB9ID0gc3BsaXRcclxuY29uc3QgeyBxdWl0OiBwYWxRdWl0IH0gPSBwYWxcclxuY29uc3QgeyBxdWl0OiByYW5nZXJRdWl0IH0gPSByYW5nZXJcclxuXHJcbi8vIHVzZSB0aGlzIGZvciBzd2l0Y2hpbmcgYmV0d2VlbiBmdWxsIHNjcmVlbiBleGNsdXNpdmUgc2NlbmVzOlxyXG4vLyBjb25zdCBzY2VuZXMgPSBbXHJcbi8vICAgW3RleHQsIHRleHRRdWl0XSxcclxuLy8gICBbZGVidWcsIGRlYnVnUXVpdF0sICBcclxuLy8gICBbcGFsLCBwYWxRdWl0XVxyXG4vLyBdIGFzIGNvbnN0XHJcblxyXG4vLyBvciB0aGlzIGZvciBzcGxpdCBzY3JlZW4gc2NlbmVzOlxyXG4vLyBjb25zdCBzY2VuZXMgPSBbXHJcbi8vICAgW3NwbGl0LCBzcGxpdFF1aXRdXHJcbi8vIF0gYXMgY29uc3RcclxuXHJcbi8vIG9yIHRoaXMgZm9yIGEgc2luZ2xlIHNjZW5lOlxyXG5jb25zdCBzY2VuZXMgPSBbXHJcbiAgW3JhbmdlciwgcmFuZ2VyUXVpdF1cclxuICAvL1twYWwsIHBhbFF1aXRdXHJcbl0gYXMgY29uc3RcclxuXHJcbmxldCBzY2VuZUluZGV4ID0gMFxyXG5cclxuY29uc3Qgb25RdWl0ID0gYXN5bmMgKHN0YXRlOiBTdGF0ZSkgPT4ge1xyXG4gIGxldCBzY2VuZURhdGEgPSBzY2VuZXNbc2NlbmVJbmRleF1cclxuXHJcbiAgY29uc3QgYmFzZVF1aXQgPSBzY2VuZURhdGFbMV1cclxuXHJcbiAgYXdhaXQgYmFzZVF1aXQoc3RhdGUpXHJcblxyXG4gIHNjZW5lSW5kZXgrK1xyXG5cclxuICBpZiAoc2NlbmVJbmRleCA+PSBzY2VuZXMubGVuZ3RoKSB7XHJcbiAgICBzY2VuZUluZGV4ID0gMFxyXG4gIH1cclxuXHJcbiAgc2NlbmVEYXRhID0gc2NlbmVzW3NjZW5lSW5kZXhdXHJcblxyXG4gIGlmIChzY2VuZXMubGVuZ3RoID4gMSkge1xyXG4gICAgY29uc29sZS5sb2coJ1N3aXRjaGluZyB0byBzY2VuZScsIHNjZW5lSW5kZXgpXHJcbiAgfSBlbHNlIHtcclxuICAgIGNvbnNvbGUubG9nKCdSZXN0YXJ0aW5nIHNjZW5lJylcclxuICB9XHJcblxyXG5cclxuICBzdGFydChzY2VuZURhdGFbMF0pLmNhdGNoKGNvbnNvbGUuZXJyb3IpXHJcbn1cclxuXHJcbi8vIHdoZW4gdXNpbmcgc3BsaXQsIGxlYXZlIGFsbCBleGNlcHQgc3BsaXQgY29tbWVudGVkIG91dFxyXG4vLyB3aGVuIHVzaW5nIGEgc2luZ2xlIHNjZW5lLCBsZWF2ZSB0aGUgb3RoZXJzIGNvbW1lbnRlZCBvdXRcclxuLy8gd2hlbiBzd2l0Y2hpbmcgYmV0d2VlbiBzY2VuZXMsIHVuY29tbWVudCBhbGwgcGFydGljaXBhbnRzXHJcblxyXG4vL2RlYnVnLnF1aXQgPSBvblF1aXRcclxuLy90ZXh0LnF1aXQgPSBvblF1aXRcclxuLy9zcGxpdC5xdWl0ID0gb25RdWl0XHJcbi8vcGFsLnF1aXQgPSBvblF1aXRcclxucmFuZ2VyLnF1aXQgPSBvblF1aXRcclxuXHJcbnN0YXJ0KHNjZW5lc1tzY2VuZUluZGV4XVswXSkuY2F0Y2goY29uc29sZS5lcnJvcilcclxuIl19