export const bres3 = (x1, y1, z1, x2, y2, z2) => {
    x1 |= 0;
    y1 |= 0;
    z1 |= 0;
    x2 |= 0;
    y2 |= 0;
    z2 |= 0;
    const pts = [];
    pts.push([x1, y1, z1]);
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const dz = Math.abs(z2 - z1);
    const sx = x2 > x1 ? 1 : -1;
    const sy = y2 > y1 ? 1 : -1;
    const sz = z2 > z1 ? 1 : -1;
    // driving axis is x
    if (dx >= dy && dx >= dz) {
        let p1 = 2 * dy - dx;
        let p2 = 2 * dz - dx;
        while (x1 != x2) {
            x1 += sx;
            if (p1 >= 0) {
                y1 += sy;
                p1 -= 2 * dx;
            }
            if (p2 >= 0) {
                z1 += sz;
                p2 -= 2 * dx;
            }
            p1 += 2 * dy;
            p2 += 2 * dz;
            pts.push([x1, y1, z1]);
        }
        // driving axis is y
    }
    else if (dy >= dx && dy >= dz) {
        let p1 = 2 * dx - dy;
        let p2 = 2 * dz - dy;
        while (y1 != y2) {
            y1 += sy;
            if (p1 >= 0) {
                x1 += sx;
                p1 -= 2 * dy;
            }
            if (p2 >= 0) {
                z1 += sz;
                p2 -= 2 * dy;
            }
            p1 += 2 * dx;
            p2 += 2 * dz;
            pts.push([x1, y1, z1]);
        }
        // driving axis is z
    }
    else {
        let p1 = 2 * dy - dz;
        let p2 = 2 * dx - dz;
        while (z1 != z2) {
            z1 += sz;
            if (p1 >= 0) {
                y1 += sy;
                p1 -= 2 * dz;
            }
            if (p2 >= 0) {
                x1 += sx;
                p2 -= 2 * dz;
            }
            p1 += 2 * dy;
            p2 += 2 * dx;
            pts.push([x1, y1, z1]);
        }
    }
    return pts;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJlc2VuaGFtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL2xpYi92b3hlbC9icmVzZW5oYW0udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBRUEsTUFBTSxDQUFDLE1BQU0sS0FBSyxHQUFHLENBQ25CLEVBQVUsRUFBRSxFQUFVLEVBQUUsRUFBVSxFQUFFLEVBQVUsRUFBRSxFQUFVLEVBQUUsRUFBVSxFQUNoRSxFQUFFO0lBQ1IsRUFBRSxJQUFJLENBQUMsQ0FBQTtJQUNQLEVBQUUsSUFBSSxDQUFDLENBQUE7SUFDUCxFQUFFLElBQUksQ0FBQyxDQUFBO0lBQ1AsRUFBRSxJQUFJLENBQUMsQ0FBQTtJQUNQLEVBQUUsSUFBSSxDQUFDLENBQUE7SUFDUCxFQUFFLElBQUksQ0FBQyxDQUFBO0lBRVAsTUFBTSxHQUFHLEdBQVMsRUFBRSxDQUFBO0lBRXBCLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUE7SUFFdEIsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUE7SUFDNUIsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUE7SUFDNUIsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUE7SUFFNUIsTUFBTSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtJQUMzQixNQUFNLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO0lBQzNCLE1BQU0sRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7SUFFM0Isb0JBQW9CO0lBQ3BCLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxFQUFFLENBQUM7UUFDekIsSUFBSSxFQUFFLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUE7UUFDcEIsSUFBSSxFQUFFLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUE7UUFFcEIsT0FBTyxFQUFFLElBQUksRUFBRSxFQUFFLENBQUM7WUFDaEIsRUFBRSxJQUFJLEVBQUUsQ0FBQTtZQUNSLElBQUksRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUNaLEVBQUUsSUFBSSxFQUFFLENBQUE7Z0JBQ1IsRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUE7WUFDZCxDQUFDO1lBQ0QsSUFBSSxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQ1osRUFBRSxJQUFJLEVBQUUsQ0FBQTtnQkFDUixFQUFFLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQTtZQUNkLENBQUM7WUFDRCxFQUFFLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQTtZQUNaLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFBO1lBQ1osR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQTtRQUN4QixDQUFDO1FBRUQsb0JBQW9CO0lBQ3RCLENBQUM7U0FBTSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUFDO1FBQ2hDLElBQUksRUFBRSxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFBO1FBQ3BCLElBQUksRUFBRSxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFBO1FBQ3BCLE9BQU8sRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUFDO1lBQ2hCLEVBQUUsSUFBSSxFQUFFLENBQUE7WUFDUixJQUFJLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDWixFQUFFLElBQUksRUFBRSxDQUFBO2dCQUNSLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFBO1lBQ2QsQ0FBQztZQUNELElBQUksRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUNaLEVBQUUsSUFBSSxFQUFFLENBQUE7Z0JBQ1IsRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUE7WUFDZCxDQUFDO1lBQ0QsRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUE7WUFDWixFQUFFLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQTtZQUNaLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUE7UUFDeEIsQ0FBQztRQUVELG9CQUFvQjtJQUN0QixDQUFDO1NBQU0sQ0FBQztRQUNOLElBQUksRUFBRSxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFBO1FBQ3BCLElBQUksRUFBRSxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFBO1FBQ3BCLE9BQU8sRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUFDO1lBQ2hCLEVBQUUsSUFBSSxFQUFFLENBQUE7WUFDUixJQUFJLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDWixFQUFFLElBQUksRUFBRSxDQUFBO2dCQUNSLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFBO1lBQ2QsQ0FBQztZQUNELElBQUksRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUNaLEVBQUUsSUFBSSxFQUFFLENBQUE7Z0JBQ1IsRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUE7WUFDZCxDQUFDO1lBQ0QsRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUE7WUFDWixFQUFFLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQTtZQUNaLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUE7UUFDeEIsQ0FBQztJQUNILENBQUM7SUFFRCxPQUFPLEdBQUcsQ0FBQTtBQUNaLENBQUMsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFQzIH0gZnJvbSAnLi4vdHlwZXMuanMnXHJcblxyXG5leHBvcnQgY29uc3QgYnJlczMgPSAoXHJcbiAgeDE6IG51bWJlciwgeTE6IG51bWJlciwgejE6IG51bWJlciwgeDI6IG51bWJlciwgeTI6IG51bWJlciwgejI6IG51bWJlclxyXG4pOiBUM1tdID0+IHtcclxuICB4MSB8PSAwXHJcbiAgeTEgfD0gMFxyXG4gIHoxIHw9IDBcclxuICB4MiB8PSAwXHJcbiAgeTIgfD0gMFxyXG4gIHoyIHw9IDBcclxuXHJcbiAgY29uc3QgcHRzOiBUM1tdID0gW11cclxuXHJcbiAgcHRzLnB1c2goW3gxLCB5MSwgejFdKVxyXG5cclxuICBjb25zdCBkeCA9IE1hdGguYWJzKHgyIC0geDEpXHJcbiAgY29uc3QgZHkgPSBNYXRoLmFicyh5MiAtIHkxKVxyXG4gIGNvbnN0IGR6ID0gTWF0aC5hYnMoejIgLSB6MSlcclxuXHJcbiAgY29uc3Qgc3ggPSB4MiA+IHgxID8gMSA6IC0xXHJcbiAgY29uc3Qgc3kgPSB5MiA+IHkxID8gMSA6IC0xXHJcbiAgY29uc3Qgc3ogPSB6MiA+IHoxID8gMSA6IC0xXHJcblxyXG4gIC8vIGRyaXZpbmcgYXhpcyBpcyB4XHJcbiAgaWYgKGR4ID49IGR5ICYmIGR4ID49IGR6KSB7XHJcbiAgICBsZXQgcDEgPSAyICogZHkgLSBkeFxyXG4gICAgbGV0IHAyID0gMiAqIGR6IC0gZHhcclxuXHJcbiAgICB3aGlsZSAoeDEgIT0geDIpIHtcclxuICAgICAgeDEgKz0gc3hcclxuICAgICAgaWYgKHAxID49IDApIHtcclxuICAgICAgICB5MSArPSBzeVxyXG4gICAgICAgIHAxIC09IDIgKiBkeFxyXG4gICAgICB9XHJcbiAgICAgIGlmIChwMiA+PSAwKSB7XHJcbiAgICAgICAgejEgKz0gc3pcclxuICAgICAgICBwMiAtPSAyICogZHhcclxuICAgICAgfVxyXG4gICAgICBwMSArPSAyICogZHlcclxuICAgICAgcDIgKz0gMiAqIGR6XHJcbiAgICAgIHB0cy5wdXNoKFt4MSwgeTEsIHoxXSlcclxuICAgIH1cclxuXHJcbiAgICAvLyBkcml2aW5nIGF4aXMgaXMgeVxyXG4gIH0gZWxzZSBpZiAoZHkgPj0gZHggJiYgZHkgPj0gZHopIHtcclxuICAgIGxldCBwMSA9IDIgKiBkeCAtIGR5XHJcbiAgICBsZXQgcDIgPSAyICogZHogLSBkeVxyXG4gICAgd2hpbGUgKHkxICE9IHkyKSB7XHJcbiAgICAgIHkxICs9IHN5XHJcbiAgICAgIGlmIChwMSA+PSAwKSB7XHJcbiAgICAgICAgeDEgKz0gc3hcclxuICAgICAgICBwMSAtPSAyICogZHlcclxuICAgICAgfVxyXG4gICAgICBpZiAocDIgPj0gMCkge1xyXG4gICAgICAgIHoxICs9IHN6XHJcbiAgICAgICAgcDIgLT0gMiAqIGR5XHJcbiAgICAgIH1cclxuICAgICAgcDEgKz0gMiAqIGR4XHJcbiAgICAgIHAyICs9IDIgKiBkelxyXG4gICAgICBwdHMucHVzaChbeDEsIHkxLCB6MV0pXHJcbiAgICB9XHJcblxyXG4gICAgLy8gZHJpdmluZyBheGlzIGlzIHpcclxuICB9IGVsc2Uge1xyXG4gICAgbGV0IHAxID0gMiAqIGR5IC0gZHpcclxuICAgIGxldCBwMiA9IDIgKiBkeCAtIGR6XHJcbiAgICB3aGlsZSAoejEgIT0gejIpIHtcclxuICAgICAgejEgKz0gc3pcclxuICAgICAgaWYgKHAxID49IDApIHtcclxuICAgICAgICB5MSArPSBzeVxyXG4gICAgICAgIHAxIC09IDIgKiBkelxyXG4gICAgICB9XHJcbiAgICAgIGlmIChwMiA+PSAwKSB7XHJcbiAgICAgICAgeDEgKz0gc3hcclxuICAgICAgICBwMiAtPSAyICogZHpcclxuICAgICAgfVxyXG4gICAgICBwMSArPSAyICogZHlcclxuICAgICAgcDIgKz0gMiAqIGR4XHJcbiAgICAgIHB0cy5wdXNoKFt4MSwgeTEsIHoxXSlcclxuICAgIH1cclxuICB9XHJcbiAgXHJcbiAgcmV0dXJuIHB0c1xyXG59Il19