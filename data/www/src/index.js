import { debugScene } from './scenes/debug-scene.js';
import { start } from './lib/engine.js';
import { textSandboxScene } from './scenes/text-sandbox-scene.js';
import { splitScene } from './scenes/split-scene.js';
import { paletteSandboxScene } from './scenes/palette-scene.js';
import { rangerScene } from './scenes/ranger-scene.js';
const debug = debugScene();
const text = textSandboxScene();
const split = splitScene(text, debug);
const pal = paletteSandboxScene();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLHlCQUF5QixDQUFBO0FBQ3BELE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQTtBQUN2QyxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSxnQ0FBZ0MsQ0FBQTtBQUVqRSxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0seUJBQXlCLENBQUE7QUFDcEQsT0FBTyxFQUFFLG1CQUFtQixFQUFFLE1BQU0sMkJBQTJCLENBQUE7QUFDL0QsT0FBTyxFQUFFLFdBQVcsRUFBRSxNQUFNLDBCQUEwQixDQUFBO0FBRXRELE1BQU0sS0FBSyxHQUFHLFVBQVUsRUFBRSxDQUFBO0FBQzFCLE1BQU0sSUFBSSxHQUFHLGdCQUFnQixFQUFFLENBQUE7QUFDL0IsTUFBTSxLQUFLLEdBQUcsVUFBVSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQTtBQUNyQyxNQUFNLEdBQUcsR0FBRyxtQkFBbUIsRUFBRSxDQUFBO0FBQ2pDLE1BQU0sTUFBTSxHQUFHLFdBQVcsRUFBRSxDQUFBO0FBRTVCLE1BQU0sRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLEdBQUcsS0FBSyxDQUFBO0FBQ2pDLE1BQU0sRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLEdBQUcsSUFBSSxDQUFBO0FBQy9CLE1BQU0sRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLEdBQUcsS0FBSyxDQUFBO0FBQ2pDLE1BQU0sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLEdBQUcsR0FBRyxDQUFBO0FBQzdCLE1BQU0sRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLEdBQUcsTUFBTSxDQUFBO0FBRW5DLCtEQUErRDtBQUMvRCxtQkFBbUI7QUFDbkIsc0JBQXNCO0FBQ3RCLDBCQUEwQjtBQUMxQixtQkFBbUI7QUFDbkIsYUFBYTtBQUViLG1DQUFtQztBQUNuQyxtQkFBbUI7QUFDbkIsdUJBQXVCO0FBQ3ZCLGFBQWE7QUFFYiw4QkFBOEI7QUFDOUIsTUFBTSxNQUFNLEdBQUc7SUFDYixDQUFDLE1BQU0sRUFBRSxVQUFVLENBQUM7SUFDcEIsZ0JBQWdCO0NBQ1IsQ0FBQTtBQUVWLElBQUksVUFBVSxHQUFHLENBQUMsQ0FBQTtBQUVsQixNQUFNLE1BQU0sR0FBRyxLQUFLLEVBQUUsS0FBWSxFQUFFLEVBQUU7SUFDcEMsSUFBSSxTQUFTLEdBQUcsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFBO0lBRWxDLE1BQU0sUUFBUSxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtJQUU3QixNQUFNLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQTtJQUVyQixVQUFVLEVBQUUsQ0FBQTtJQUVaLElBQUksVUFBVSxJQUFJLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNoQyxVQUFVLEdBQUcsQ0FBQyxDQUFBO0lBQ2hCLENBQUM7SUFFRCxTQUFTLEdBQUcsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFBO0lBRTlCLElBQUksTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztRQUN0QixPQUFPLENBQUMsR0FBRyxDQUFDLG9CQUFvQixFQUFFLFVBQVUsQ0FBQyxDQUFBO0lBQy9DLENBQUM7U0FBTSxDQUFDO1FBQ04sT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFBO0lBQ2pDLENBQUM7SUFHRCxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQTtBQUMxQyxDQUFDLENBQUE7QUFFRCx5REFBeUQ7QUFDekQsNERBQTREO0FBQzVELDREQUE0RDtBQUU1RCxxQkFBcUI7QUFDckIsb0JBQW9CO0FBQ3BCLHFCQUFxQjtBQUNyQixtQkFBbUI7QUFDbkIsTUFBTSxDQUFDLElBQUksR0FBRyxNQUFNLENBQUE7QUFFcEIsS0FBSyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBkZWJ1Z1NjZW5lIH0gZnJvbSAnLi9zY2VuZXMvZGVidWctc2NlbmUuanMnXHJcbmltcG9ydCB7IHN0YXJ0IH0gZnJvbSAnLi9saWIvZW5naW5lLmpzJ1xyXG5pbXBvcnQgeyB0ZXh0U2FuZGJveFNjZW5lIH0gZnJvbSAnLi9zY2VuZXMvdGV4dC1zYW5kYm94LXNjZW5lLmpzJ1xyXG5pbXBvcnQgeyBTdGF0ZSB9IGZyb20gJy4vbGliL3R5cGVzLmpzJ1xyXG5pbXBvcnQgeyBzcGxpdFNjZW5lIH0gZnJvbSAnLi9zY2VuZXMvc3BsaXQtc2NlbmUuanMnXHJcbmltcG9ydCB7IHBhbGV0dGVTYW5kYm94U2NlbmUgfSBmcm9tICcuL3NjZW5lcy9wYWxldHRlLXNjZW5lLmpzJ1xyXG5pbXBvcnQgeyByYW5nZXJTY2VuZSB9IGZyb20gJy4vc2NlbmVzL3Jhbmdlci1zY2VuZS5qcydcclxuXHJcbmNvbnN0IGRlYnVnID0gZGVidWdTY2VuZSgpXHJcbmNvbnN0IHRleHQgPSB0ZXh0U2FuZGJveFNjZW5lKClcclxuY29uc3Qgc3BsaXQgPSBzcGxpdFNjZW5lKHRleHQsIGRlYnVnKVxyXG5jb25zdCBwYWwgPSBwYWxldHRlU2FuZGJveFNjZW5lKClcclxuY29uc3QgcmFuZ2VyID0gcmFuZ2VyU2NlbmUoKVxyXG5cclxuY29uc3QgeyBxdWl0OiBkZWJ1Z1F1aXQgfSA9IGRlYnVnXHJcbmNvbnN0IHsgcXVpdDogdGV4dFF1aXQgfSA9IHRleHRcclxuY29uc3QgeyBxdWl0OiBzcGxpdFF1aXQgfSA9IHNwbGl0XHJcbmNvbnN0IHsgcXVpdDogcGFsUXVpdCB9ID0gcGFsXHJcbmNvbnN0IHsgcXVpdDogcmFuZ2VyUXVpdCB9ID0gcmFuZ2VyXHJcblxyXG4vLyB1c2UgdGhpcyBmb3Igc3dpdGNoaW5nIGJldHdlZW4gZnVsbCBzY3JlZW4gZXhjbHVzaXZlIHNjZW5lczpcclxuLy8gY29uc3Qgc2NlbmVzID0gW1xyXG4vLyAgIFt0ZXh0LCB0ZXh0UXVpdF0sXHJcbi8vICAgW2RlYnVnLCBkZWJ1Z1F1aXRdLCAgXHJcbi8vICAgW3BhbCwgcGFsUXVpdF1cclxuLy8gXSBhcyBjb25zdFxyXG5cclxuLy8gb3IgdGhpcyBmb3Igc3BsaXQgc2NyZWVuIHNjZW5lczpcclxuLy8gY29uc3Qgc2NlbmVzID0gW1xyXG4vLyAgIFtzcGxpdCwgc3BsaXRRdWl0XVxyXG4vLyBdIGFzIGNvbnN0XHJcblxyXG4vLyBvciB0aGlzIGZvciBhIHNpbmdsZSBzY2VuZTpcclxuY29uc3Qgc2NlbmVzID0gW1xyXG4gIFtyYW5nZXIsIHJhbmdlclF1aXRdXHJcbiAgLy9bcGFsLCBwYWxRdWl0XVxyXG5dIGFzIGNvbnN0XHJcblxyXG5sZXQgc2NlbmVJbmRleCA9IDBcclxuXHJcbmNvbnN0IG9uUXVpdCA9IGFzeW5jIChzdGF0ZTogU3RhdGUpID0+IHtcclxuICBsZXQgc2NlbmVEYXRhID0gc2NlbmVzW3NjZW5lSW5kZXhdXHJcblxyXG4gIGNvbnN0IGJhc2VRdWl0ID0gc2NlbmVEYXRhWzFdXHJcblxyXG4gIGF3YWl0IGJhc2VRdWl0KHN0YXRlKVxyXG5cclxuICBzY2VuZUluZGV4KytcclxuXHJcbiAgaWYgKHNjZW5lSW5kZXggPj0gc2NlbmVzLmxlbmd0aCkge1xyXG4gICAgc2NlbmVJbmRleCA9IDBcclxuICB9XHJcblxyXG4gIHNjZW5lRGF0YSA9IHNjZW5lc1tzY2VuZUluZGV4XVxyXG5cclxuICBpZiAoc2NlbmVzLmxlbmd0aCA+IDEpIHtcclxuICAgIGNvbnNvbGUubG9nKCdTd2l0Y2hpbmcgdG8gc2NlbmUnLCBzY2VuZUluZGV4KVxyXG4gIH0gZWxzZSB7XHJcbiAgICBjb25zb2xlLmxvZygnUmVzdGFydGluZyBzY2VuZScpXHJcbiAgfVxyXG5cclxuXHJcbiAgc3RhcnQoc2NlbmVEYXRhWzBdKS5jYXRjaChjb25zb2xlLmVycm9yKVxyXG59XHJcblxyXG4vLyB3aGVuIHVzaW5nIHNwbGl0LCBsZWF2ZSBhbGwgZXhjZXB0IHNwbGl0IGNvbW1lbnRlZCBvdXRcclxuLy8gd2hlbiB1c2luZyBhIHNpbmdsZSBzY2VuZSwgbGVhdmUgdGhlIG90aGVycyBjb21tZW50ZWQgb3V0XHJcbi8vIHdoZW4gc3dpdGNoaW5nIGJldHdlZW4gc2NlbmVzLCB1bmNvbW1lbnQgYWxsIHBhcnRpY2lwYW50c1xyXG5cclxuLy9kZWJ1Zy5xdWl0ID0gb25RdWl0XHJcbi8vdGV4dC5xdWl0ID0gb25RdWl0XHJcbi8vc3BsaXQucXVpdCA9IG9uUXVpdFxyXG4vL3BhbC5xdWl0ID0gb25RdWl0XHJcbnJhbmdlci5xdWl0ID0gb25RdWl0XHJcblxyXG5zdGFydChzY2VuZXNbc2NlbmVJbmRleF1bMF0pLmNhdGNoKGNvbnNvbGUuZXJyb3IpXHJcbiJdfQ==