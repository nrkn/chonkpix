import { fontImageToPoints, layoutTextLine, textLayoutToIndices } from '../bmpfont/layout.js';
import { loadFontMono } from '../bmpfont/load.js';
import { createColor } from '../image/color.js';
import { fill, fillIndices } from '../image/fill.js';
import { maybe } from '../util.js';
export const debugTextSceneHelper = (getCurrentText) => {
    let isActive = false;
    let font;
    let fontPts = {};
    const init = async (_state) => {
        font = await loadFontMono('EverexME_5x8');
        fontPts = fontImageToPoints(font);
        isActive = true;
    };
    const update = (state) => {
        if (!maybe(font))
            throw Error('Expected font');
        if (!maybe(fontPts))
            throw Error('Expected fontPts');
        const text = getCurrentText();
        if (text.length === 0)
            return;
        const buffer = state.view.getBuffer();
        const { width } = buffer;
        const padding = 2;
        let longest = 0;
        for (let i = 0; i < text.length; i++) {
            const len = text[i].length;
            if (len > longest)
                longest = len;
        }
        const textW = font.width * longest + padding * 2;
        const textH = font.height * text.length + padding * 2;
        const textX = width - textW - padding;
        const textY = padding;
        const textBg = createColor(0x00, 0x78, 0xd4);
        const textFg = createColor(0xff, 0xd7, 0x00);
        fill(buffer, textBg, [textX, textY, textW, textH]);
        for (let i = 0; i < text.length; i++) {
            const textLayout = layoutTextLine(font, text[i]);
            const textIndices = textLayoutToIndices(buffer, textX + padding, textY + padding + i * font.height, fontPts, textLayout);
            fillIndices(textIndices, buffer, textFg);
        }
    };
    const quit = async (_state) => {
        font = null;
        fontPts = {};
        isActive = false;
    };
    const setActive = (active) => {
        isActive = active;
    };
    return { init, update, quit, setActive };
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWctdGV4dC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9saWIvc2NlbmUvZGVidWctdGV4dC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsaUJBQWlCLEVBQUUsY0FBYyxFQUFFLG1CQUFtQixFQUFFLE1BQU0sc0JBQXNCLENBQUE7QUFDN0YsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLG9CQUFvQixDQUFBO0FBRWpELE9BQU8sRUFBRSxXQUFXLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQTtBQUMvQyxPQUFPLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxNQUFNLGtCQUFrQixDQUFBO0FBRXBELE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxZQUFZLENBQUE7QUFFbEMsTUFBTSxDQUFDLE1BQU0sb0JBQW9CLEdBQUcsQ0FDbEMsY0FBOEIsRUFDdkIsRUFBRTtJQUNULElBQUksUUFBUSxHQUFHLEtBQUssQ0FBQTtJQUNwQixJQUFJLElBQXFCLENBQUE7SUFDekIsSUFBSSxPQUFPLEdBQWdDLEVBQUUsQ0FBQTtJQUU3QyxNQUFNLElBQUksR0FBRyxLQUFLLEVBQUUsTUFBYSxFQUFFLEVBQUU7UUFDbkMsSUFBSSxHQUFHLE1BQU0sWUFBWSxDQUFDLGNBQWMsQ0FBQyxDQUFBO1FBQ3pDLE9BQU8sR0FBRyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUVqQyxRQUFRLEdBQUcsSUFBSSxDQUFBO0lBQ2pCLENBQUMsQ0FBQTtJQUVELE1BQU0sTUFBTSxHQUFHLENBQUMsS0FBWSxFQUFFLEVBQUU7UUFDOUIsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUM7WUFBRSxNQUFNLEtBQUssQ0FBQyxlQUFlLENBQUMsQ0FBQTtRQUM5QyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQztZQUFFLE1BQU0sS0FBSyxDQUFDLGtCQUFrQixDQUFDLENBQUE7UUFFcEQsTUFBTSxJQUFJLEdBQUcsY0FBYyxFQUFFLENBQUE7UUFFN0IsSUFBSSxJQUFJLENBQUMsTUFBTSxLQUFLLENBQUM7WUFBRSxPQUFNO1FBRTdCLE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUE7UUFDckMsTUFBTSxFQUFFLEtBQUssRUFBRSxHQUFHLE1BQU0sQ0FBQTtRQUV4QixNQUFNLE9BQU8sR0FBRyxDQUFDLENBQUE7UUFFakIsSUFBSSxPQUFPLEdBQUcsQ0FBQyxDQUFBO1FBRWYsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUNyQyxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFBO1lBRTFCLElBQUksR0FBRyxHQUFHLE9BQU87Z0JBQUUsT0FBTyxHQUFHLEdBQUcsQ0FBQTtRQUNsQyxDQUFDO1FBRUQsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssR0FBRyxPQUFPLEdBQUcsT0FBTyxHQUFHLENBQUMsQ0FBQTtRQUNoRCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLEdBQUcsT0FBTyxHQUFHLENBQUMsQ0FBQTtRQUNyRCxNQUFNLEtBQUssR0FBRyxLQUFLLEdBQUcsS0FBSyxHQUFHLE9BQU8sQ0FBQTtRQUNyQyxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUE7UUFFckIsTUFBTSxNQUFNLEdBQUcsV0FBVyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUE7UUFDNUMsTUFBTSxNQUFNLEdBQUcsV0FBVyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUE7UUFFNUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFBO1FBRWxELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDckMsTUFBTSxVQUFVLEdBQUcsY0FBYyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtZQUVoRCxNQUFNLFdBQVcsR0FBRyxtQkFBbUIsQ0FDckMsTUFBTSxFQUNOLEtBQUssR0FBRyxPQUFPLEVBQUUsS0FBSyxHQUFHLE9BQU8sR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFDbEQsT0FBTyxFQUFFLFVBQVUsQ0FDcEIsQ0FBQTtZQUVELFdBQVcsQ0FBQyxXQUFXLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFBO1FBQzFDLENBQUM7SUFDSCxDQUFDLENBQUE7SUFFRCxNQUFNLElBQUksR0FBRyxLQUFLLEVBQUUsTUFBYSxFQUFFLEVBQUU7UUFDbkMsSUFBSSxHQUFHLElBQUksQ0FBQTtRQUNYLE9BQU8sR0FBRyxFQUFFLENBQUE7UUFFWixRQUFRLEdBQUcsS0FBSyxDQUFBO0lBQ2xCLENBQUMsQ0FBQTtJQUVELE1BQU0sU0FBUyxHQUFHLENBQUMsTUFBZSxFQUFFLEVBQUU7UUFDcEMsUUFBUSxHQUFHLE1BQU0sQ0FBQTtJQUNuQixDQUFDLENBQUE7SUFFRCxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLENBQUE7QUFDMUMsQ0FBQyxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZm9udEltYWdlVG9Qb2ludHMsIGxheW91dFRleHRMaW5lLCB0ZXh0TGF5b3V0VG9JbmRpY2VzIH0gZnJvbSAnLi4vYm1wZm9udC9sYXlvdXQuanMnXG5pbXBvcnQgeyBsb2FkRm9udE1vbm8gfSBmcm9tICcuLi9ibXBmb250L2xvYWQuanMnXG5pbXBvcnQgeyBCbXBGb250TSB9IGZyb20gJy4uL2JtcGZvbnQvdHlwZXMuanMnXG5pbXBvcnQgeyBjcmVhdGVDb2xvciB9IGZyb20gJy4uL2ltYWdlL2NvbG9yLmpzJ1xuaW1wb3J0IHsgZmlsbCwgZmlsbEluZGljZXMgfSBmcm9tICcuLi9pbWFnZS9maWxsLmpzJ1xuaW1wb3J0IHsgTWF5YmUsIFNjZW5lLCBTdGF0ZSwgVDIgfSBmcm9tICcuLi90eXBlcy5qcydcbmltcG9ydCB7IG1heWJlIH0gZnJvbSAnLi4vdXRpbC5qcydcblxuZXhwb3J0IGNvbnN0IGRlYnVnVGV4dFNjZW5lSGVscGVyID0gKFxuICBnZXRDdXJyZW50VGV4dDogKCkgPT4gc3RyaW5nW11cbik6IFNjZW5lID0+IHtcbiAgbGV0IGlzQWN0aXZlID0gZmFsc2VcbiAgbGV0IGZvbnQ6IE1heWJlPEJtcEZvbnRNPlxuICBsZXQgZm9udFB0czogUmVjb3JkPG51bWJlciwgTWF5YmU8VDJbXT4+ID0ge31cblxuICBjb25zdCBpbml0ID0gYXN5bmMgKF9zdGF0ZTogU3RhdGUpID0+IHtcbiAgICBmb250ID0gYXdhaXQgbG9hZEZvbnRNb25vKCdFdmVyZXhNRV81eDgnKVxuICAgIGZvbnRQdHMgPSBmb250SW1hZ2VUb1BvaW50cyhmb250KVxuXG4gICAgaXNBY3RpdmUgPSB0cnVlXG4gIH1cblxuICBjb25zdCB1cGRhdGUgPSAoc3RhdGU6IFN0YXRlKSA9PiB7XG4gICAgaWYgKCFtYXliZShmb250KSkgdGhyb3cgRXJyb3IoJ0V4cGVjdGVkIGZvbnQnKVxuICAgIGlmICghbWF5YmUoZm9udFB0cykpIHRocm93IEVycm9yKCdFeHBlY3RlZCBmb250UHRzJylcblxuICAgIGNvbnN0IHRleHQgPSBnZXRDdXJyZW50VGV4dCgpXG5cbiAgICBpZiAodGV4dC5sZW5ndGggPT09IDApIHJldHVyblxuXG4gICAgY29uc3QgYnVmZmVyID0gc3RhdGUudmlldy5nZXRCdWZmZXIoKVxuICAgIGNvbnN0IHsgd2lkdGggfSA9IGJ1ZmZlclxuXG4gICAgY29uc3QgcGFkZGluZyA9IDJcblxuICAgIGxldCBsb25nZXN0ID0gMFxuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0ZXh0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBsZW4gPSB0ZXh0W2ldLmxlbmd0aFxuXG4gICAgICBpZiAobGVuID4gbG9uZ2VzdCkgbG9uZ2VzdCA9IGxlblxuICAgIH1cblxuICAgIGNvbnN0IHRleHRXID0gZm9udC53aWR0aCAqIGxvbmdlc3QgKyBwYWRkaW5nICogMlxuICAgIGNvbnN0IHRleHRIID0gZm9udC5oZWlnaHQgKiB0ZXh0Lmxlbmd0aCArIHBhZGRpbmcgKiAyXG4gICAgY29uc3QgdGV4dFggPSB3aWR0aCAtIHRleHRXIC0gcGFkZGluZ1xuICAgIGNvbnN0IHRleHRZID0gcGFkZGluZ1xuXG4gICAgY29uc3QgdGV4dEJnID0gY3JlYXRlQ29sb3IoMHgwMCwgMHg3OCwgMHhkNClcbiAgICBjb25zdCB0ZXh0RmcgPSBjcmVhdGVDb2xvcigweGZmLCAweGQ3LCAweDAwKVxuXG4gICAgZmlsbChidWZmZXIsIHRleHRCZywgW3RleHRYLCB0ZXh0WSwgdGV4dFcsIHRleHRIXSlcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGV4dC5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgdGV4dExheW91dCA9IGxheW91dFRleHRMaW5lKGZvbnQsIHRleHRbaV0pXG5cbiAgICAgIGNvbnN0IHRleHRJbmRpY2VzID0gdGV4dExheW91dFRvSW5kaWNlcyhcbiAgICAgICAgYnVmZmVyLFxuICAgICAgICB0ZXh0WCArIHBhZGRpbmcsIHRleHRZICsgcGFkZGluZyArIGkgKiBmb250LmhlaWdodCxcbiAgICAgICAgZm9udFB0cywgdGV4dExheW91dFxuICAgICAgKVxuXG4gICAgICBmaWxsSW5kaWNlcyh0ZXh0SW5kaWNlcywgYnVmZmVyLCB0ZXh0RmcpXG4gICAgfVxuICB9XG5cbiAgY29uc3QgcXVpdCA9IGFzeW5jIChfc3RhdGU6IFN0YXRlKSA9PiB7XG4gICAgZm9udCA9IG51bGxcbiAgICBmb250UHRzID0ge31cblxuICAgIGlzQWN0aXZlID0gZmFsc2VcbiAgfVxuXG4gIGNvbnN0IHNldEFjdGl2ZSA9IChhY3RpdmU6IGJvb2xlYW4pID0+IHtcbiAgICBpc0FjdGl2ZSA9IGFjdGl2ZVxuICB9XG5cbiAgcmV0dXJuIHsgaW5pdCwgdXBkYXRlLCBxdWl0LCBzZXRBY3RpdmUgfVxufSJdfQ==