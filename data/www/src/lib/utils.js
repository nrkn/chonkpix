export const t2 = (value) => (a = value, b = a) => [a, b];
export const t3 = (value) => (a = value, b = a, c = a) => [a, b, c];
export const t4 = (value) => (a = value, b = a, c = a, d = a) => [a, b, c, d];
export const t5 = (value) => (a = value, b = a, c = a, d = a, e = a) => [a, b, c, d, e];
export const t2N = t2(0);
export const t3N = t3(0);
export const t4N = t4(0);
export const t5N = t5(0);
// for debugging - inside a raf - we only want first few logs
const maxLogs = 10;
let logs = 0;
export const log = (...args) => {
    if (logs === maxLogs) {
        return;
    }
    console.log(logs, ...args);
    logs++;
};
//# sourceMappingURL=utils.js.map