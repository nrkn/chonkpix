export const bresenhamLine = (x0, y0, x1, y1) => {
    x0 |= 0;
    y0 |= 0;
    x1 |= 0;
    y1 |= 0;
    const dx = Math.abs(x1 - x0);
    const sx = x0 < x1 ? 1 : -1;
    const dy = -Math.abs(y1 - y0);
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    const points = [];
    while (true) {
        points.push([x0, y0]);
        if (x0 === x1 && y0 === y1) {
            break;
        }
        const e2 = 2 * err;
        if (e2 >= dy) {
            err += dy;
            x0 += sx;
        }
        if (e2 <= dx) {
            err += dx;
            y0 += sy;
        }
    }
    return points;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJlc2VuaGFtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL2xpYi9pbWFnZS9icmVzZW5oYW0udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBRUEsTUFBTSxDQUFDLE1BQU0sYUFBYSxHQUFHLENBQzNCLEVBQVUsRUFBRSxFQUFVLEVBQUUsRUFBVSxFQUFFLEVBQVUsRUFDeEMsRUFBRTtJQUNSLEVBQUUsSUFBSSxDQUFDLENBQUE7SUFDUCxFQUFFLElBQUksQ0FBQyxDQUFBO0lBQ1AsRUFBRSxJQUFJLENBQUMsQ0FBQTtJQUNQLEVBQUUsSUFBSSxDQUFDLENBQUE7SUFFUCxNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQTtJQUM1QixNQUFNLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO0lBRTNCLE1BQU0sRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUE7SUFDN0IsTUFBTSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtJQUUzQixJQUFJLEdBQUcsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFBO0lBRWpCLE1BQU0sTUFBTSxHQUFTLEVBQUUsQ0FBQTtJQUV2QixPQUFPLElBQUksRUFBRSxDQUFDO1FBQ1osTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFBO1FBRXJCLElBQUksRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxFQUFFLENBQUM7WUFDM0IsTUFBSztRQUNQLENBQUM7UUFFRCxNQUFNLEVBQUUsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFBO1FBRWxCLElBQUksRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUFDO1lBQ2IsR0FBRyxJQUFJLEVBQUUsQ0FBQTtZQUNULEVBQUUsSUFBSSxFQUFFLENBQUE7UUFDVixDQUFDO1FBRUQsSUFBSSxFQUFFLElBQUksRUFBRSxFQUFFLENBQUM7WUFDYixHQUFHLElBQUksRUFBRSxDQUFBO1lBQ1QsRUFBRSxJQUFJLEVBQUUsQ0FBQTtRQUNWLENBQUM7SUFDSCxDQUFDO0lBRUQsT0FBTyxNQUFNLENBQUE7QUFDZixDQUFDLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBUMiB9IGZyb20gJy4uL3R5cGVzLmpzJ1xuXG5leHBvcnQgY29uc3QgYnJlc2VuaGFtTGluZSA9IChcbiAgeDA6IG51bWJlciwgeTA6IG51bWJlciwgeDE6IG51bWJlciwgeTE6IG51bWJlclxuKTogVDJbXSA9PiB7XG4gIHgwIHw9IDBcbiAgeTAgfD0gMFxuICB4MSB8PSAwXG4gIHkxIHw9IDBcblxuICBjb25zdCBkeCA9IE1hdGguYWJzKHgxIC0geDApXG4gIGNvbnN0IHN4ID0geDAgPCB4MSA/IDEgOiAtMVxuXG4gIGNvbnN0IGR5ID0gLU1hdGguYWJzKHkxIC0geTApXG4gIGNvbnN0IHN5ID0geTAgPCB5MSA/IDEgOiAtMVxuXG4gIGxldCBlcnIgPSBkeCArIGR5XG5cbiAgY29uc3QgcG9pbnRzOiBUMltdID0gW11cblxuICB3aGlsZSAodHJ1ZSkge1xuICAgIHBvaW50cy5wdXNoKFt4MCwgeTBdKVxuXG4gICAgaWYgKHgwID09PSB4MSAmJiB5MCA9PT0geTEpIHtcbiAgICAgIGJyZWFrXG4gICAgfVxuXG4gICAgY29uc3QgZTIgPSAyICogZXJyXG5cbiAgICBpZiAoZTIgPj0gZHkpIHtcbiAgICAgIGVyciArPSBkeVxuICAgICAgeDAgKz0gc3hcbiAgICB9XG5cbiAgICBpZiAoZTIgPD0gZHgpIHtcbiAgICAgIGVyciArPSBkeFxuICAgICAgeTAgKz0gc3lcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcG9pbnRzXG59Il19