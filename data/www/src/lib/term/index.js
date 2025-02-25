// we will start off simple and have it be an append only terminal, no wrapping
// scrolling etc, no cursor, and we will add more features as we go
export const createTerminal = () => {
    let lineBuffer = [''];
    const clear = () => {
        lineBuffer = [''];
    };
    const append = (value) => {
        const lines = value.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            lineBuffer[lineBuffer.length - 1] += line;
            if (i !== lines.length - 1) {
                lineBuffer.push('');
            }
        }
    };
    const appendLine = (value = '') => {
        append(value + '\n');
    };
    const backspace = () => {
        lineBuffer[lineBuffer.length - 1] = lineBuffer[lineBuffer.length - 1].slice(0, -1);
    };
    const view = (cols, rows) => {
        const lines = (lineBuffer.length > rows ?
            lineBuffer.slice(lineBuffer.length - rows) :
            lineBuffer).map(l => {
            if (l.length > cols) {
                return l.slice(0, cols);
            }
            return l;
        });
        return lines;
    };
    const term = {
        get bufferHeight() {
            return lineBuffer.length;
        },
        clear,
        backspace,
        append,
        appendLine,
        view
    };
    return term;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvbGliL3Rlcm0vaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsK0VBQStFO0FBQy9FLG1FQUFtRTtBQUNuRSxNQUFNLENBQUMsTUFBTSxjQUFjLEdBQUcsR0FBRyxFQUFFO0lBQ2pDLElBQUksVUFBVSxHQUFhLENBQUMsRUFBRSxDQUFDLENBQUE7SUFFL0IsTUFBTSxLQUFLLEdBQUcsR0FBRyxFQUFFO1FBQ2pCLFVBQVUsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFBO0lBQ25CLENBQUMsQ0FBQTtJQUVELE1BQU0sTUFBTSxHQUFHLENBQUMsS0FBYSxFQUFFLEVBQUU7UUFDL0IsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUUvQixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ3RDLE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQTtZQUVyQixVQUFVLENBQUMsVUFBVSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUE7WUFFekMsSUFBSSxDQUFDLEtBQUssS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDM0IsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQTtZQUNyQixDQUFDO1FBQ0gsQ0FBQztJQUNILENBQUMsQ0FBQTtJQUVELE1BQU0sVUFBVSxHQUFHLENBQUMsS0FBSyxHQUFHLEVBQUUsRUFBRSxFQUFFO1FBQ2hDLE1BQU0sQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLENBQUE7SUFDdEIsQ0FBQyxDQUFBO0lBRUQsTUFBTSxTQUFTLEdBQUcsR0FBRyxFQUFFO1FBQ3JCLFVBQVUsQ0FBQyxVQUFVLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxVQUFVLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQTtJQUNwRixDQUFDLENBQUE7SUFFRCxNQUFNLElBQUksR0FBRyxDQUFDLElBQVksRUFBRSxJQUFZLEVBQUUsRUFBRTtRQUMxQyxNQUFNLEtBQUssR0FBRyxDQUNaLFVBQVUsQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLENBQUM7WUFDeEIsVUFBVSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDNUMsVUFBVSxDQUNiLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFO1lBQ1IsSUFBSSxDQUFDLENBQUMsTUFBTSxHQUFHLElBQUksRUFBRSxDQUFDO2dCQUNwQixPQUFPLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFBO1lBQ3pCLENBQUM7WUFFRCxPQUFPLENBQUMsQ0FBQTtRQUNWLENBQUMsQ0FBQyxDQUFBO1FBRUYsT0FBTyxLQUFLLENBQUE7SUFDZCxDQUFDLENBQUE7SUFFRCxNQUFNLElBQUksR0FBYTtRQUNyQixJQUFJLFlBQVk7WUFDZCxPQUFPLFVBQVUsQ0FBQyxNQUFNLENBQUE7UUFDMUIsQ0FBQztRQUVELEtBQUs7UUFDTCxTQUFTO1FBQ1QsTUFBTTtRQUNOLFVBQVU7UUFDVixJQUFJO0tBQ0wsQ0FBQTtJQUVELE9BQU8sSUFBSSxDQUFBO0FBQ2IsQ0FBQyxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiLy8gd2Ugd2lsbCBzdGFydCBvZmYgc2ltcGxlIGFuZCBoYXZlIGl0IGJlIGFuIGFwcGVuZCBvbmx5IHRlcm1pbmFsLCBubyB3cmFwcGluZ1xyXG4vLyBzY3JvbGxpbmcgZXRjLCBubyBjdXJzb3IsIGFuZCB3ZSB3aWxsIGFkZCBtb3JlIGZlYXR1cmVzIGFzIHdlIGdvXHJcbmV4cG9ydCBjb25zdCBjcmVhdGVUZXJtaW5hbCA9ICgpID0+IHtcclxuICBsZXQgbGluZUJ1ZmZlcjogc3RyaW5nW10gPSBbJyddXHJcblxyXG4gIGNvbnN0IGNsZWFyID0gKCkgPT4ge1xyXG4gICAgbGluZUJ1ZmZlciA9IFsnJ11cclxuICB9XHJcblxyXG4gIGNvbnN0IGFwcGVuZCA9ICh2YWx1ZTogc3RyaW5nKSA9PiB7XHJcbiAgICBjb25zdCBsaW5lcyA9IHZhbHVlLnNwbGl0KCdcXG4nKVxyXG5cclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGluZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgY29uc3QgbGluZSA9IGxpbmVzW2ldXHJcblxyXG4gICAgICBsaW5lQnVmZmVyW2xpbmVCdWZmZXIubGVuZ3RoIC0gMV0gKz0gbGluZVxyXG5cclxuICAgICAgaWYgKGkgIT09IGxpbmVzLmxlbmd0aCAtIDEpIHtcclxuICAgICAgICBsaW5lQnVmZmVyLnB1c2goJycpXHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIGNvbnN0IGFwcGVuZExpbmUgPSAodmFsdWUgPSAnJykgPT4ge1xyXG4gICAgYXBwZW5kKHZhbHVlICsgJ1xcbicpXHJcbiAgfVxyXG5cclxuICBjb25zdCBiYWNrc3BhY2UgPSAoKSA9PiB7XHJcbiAgICBsaW5lQnVmZmVyW2xpbmVCdWZmZXIubGVuZ3RoIC0gMV0gPSBsaW5lQnVmZmVyW2xpbmVCdWZmZXIubGVuZ3RoIC0gMV0uc2xpY2UoMCwgLTEpXHJcbiAgfVxyXG5cclxuICBjb25zdCB2aWV3ID0gKGNvbHM6IG51bWJlciwgcm93czogbnVtYmVyKSA9PiB7XHJcbiAgICBjb25zdCBsaW5lcyA9IChcclxuICAgICAgbGluZUJ1ZmZlci5sZW5ndGggPiByb3dzID9cclxuICAgICAgICBsaW5lQnVmZmVyLnNsaWNlKGxpbmVCdWZmZXIubGVuZ3RoIC0gcm93cykgOlxyXG4gICAgICAgIGxpbmVCdWZmZXJcclxuICAgICkubWFwKGwgPT4ge1xyXG4gICAgICBpZiAobC5sZW5ndGggPiBjb2xzKSB7XHJcbiAgICAgICAgcmV0dXJuIGwuc2xpY2UoMCwgY29scylcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIGxcclxuICAgIH0pXHJcblxyXG4gICAgcmV0dXJuIGxpbmVzXHJcbiAgfVxyXG5cclxuICBjb25zdCB0ZXJtOiBUZXJtaW5hbCA9IHtcclxuICAgIGdldCBidWZmZXJIZWlnaHQoKSB7XHJcbiAgICAgIHJldHVybiBsaW5lQnVmZmVyLmxlbmd0aFxyXG4gICAgfSxcclxuXHJcbiAgICBjbGVhcixcclxuICAgIGJhY2tzcGFjZSxcclxuICAgIGFwcGVuZCxcclxuICAgIGFwcGVuZExpbmUsXHJcbiAgICB2aWV3XHJcbiAgfVxyXG5cclxuICByZXR1cm4gdGVybVxyXG59XHJcblxyXG5leHBvcnQgdHlwZSBUZXJtaW5hbCA9IHtcclxuICByZWFkb25seSBidWZmZXJIZWlnaHQ6IG51bWJlclxyXG4gIGNsZWFyOiAoKSA9PiB2b2lkXHJcbiAgYmFja3NwYWNlOiAoKSA9PiB2b2lkXHJcbiAgYXBwZW5kOiAodmFsdWU6IHN0cmluZykgPT4gdm9pZFxyXG4gIGFwcGVuZExpbmU6ICh2YWx1ZT86IHN0cmluZykgPT4gdm9pZFxyXG4gIHZpZXc6IChjb2xzOiBudW1iZXIsIHJvd3M6IG51bWJlcikgPT4gc3RyaW5nW11cclxufSJdfQ==