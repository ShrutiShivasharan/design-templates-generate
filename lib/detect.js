import { newSlot, clamp } from './util';
const load = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('Could not read the design image.')); i.src = src; });
const hex = (r, g, b) => '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
function dilate(g, w, h, r) {
  const t = new Uint8Array(w * h), o = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (g[y * w + x]) for (let k = -r; k <= r; k++) { const xx = x + k; if (xx >= 0 && xx < w) t[y * w + xx] = 1; }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (t[y * w + x]) for (let k = -r; k <= r; k++) { const yy = y + k; if (yy >= 0 && yy < h) o[yy * w + x] = 1; }
  return o;
}
// Finds the page colour, then groups "ink" pixels into blobs. Colourful, dense blobs become photo areas;
// sparse, short blobs become text areas. Everything stays adjustable in the editor.
export async function detectSlots(src, nw, nh) {
  const img = await load(src);
  const s = Math.min(1, 300 / Math.max(img.width, img.height)), w = Math.max(8, Math.round(img.width * s)), h = Math.max(8, Math.round(img.height * s));
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true }); ctx.drawImage(img, 0, 0, w, h);
  const d = ctx.getImageData(0, 0, w, h).data;
  const bins = new Map(), add = (x, y) => { const i = (y * w + x) * 4, k = ((d[i] >> 4) << 8) | ((d[i + 1] >> 4) << 4) | (d[i + 2] >> 4); const b = bins.get(k) || { n: 0, r: 0, g: 0, b: 0 }; b.n++; b.r += d[i]; b.g += d[i + 1]; b.b += d[i + 2]; bins.set(k, b); };
  for (let x = 0; x < w; x++) { add(x, 0); add(x, h - 1); } for (let y = 0; y < h; y++) { add(0, y); add(w - 1, y); }
  const bb = [...bins.values()].sort((a, b) => b.n - a.n)[0], bg = [bb.r / bb.n, bb.g / bb.n, bb.b / bb.n];
  const dist = (i) => Math.abs(d[i] - bg[0]) + Math.abs(d[i + 1] - bg[1]) + Math.abs(d[i + 2] - bg[2]);
  const ink = new Uint8Array(w * h); for (let p = 0; p < w * h; p++) ink[p] = dist(p * 4) > 70 ? 1 : 0;
  const dl = dilate(ink, w, h, 2), lab = new Int32Array(w * h), st = []; let n = 0;
  for (let i = 0; i < w * h; i++) {
    if (!dl[i] || lab[i]) continue; lab[i] = ++n; st.push(i);
    while (st.length) { const q = st.pop(), x = q % w, y = (q / w) | 0; for (const nb of [x > 0 ? q - 1 : -1, x < w - 1 ? q + 1 : -1, y > 0 ? q - w : -1, y < h - 1 ? q + w : -1]) if (nb >= 0 && dl[nb] && !lab[nb]) { lab[nb] = n; st.push(nb); } }
  }
  const S = Array.from({ length: n + 1 }, () => ({ x0: 1e9, x1: -1, y0: 1e9, y1: -1, ink: 0, cols: new Set(), px: [] }));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const p = y * w + x; if (!ink[p] || !lab[p]) continue; const o = S[lab[p]], i = p * 4;
    o.x0 = Math.min(o.x0, x); o.x1 = Math.max(o.x1, x); o.y0 = Math.min(o.y0, y); o.y1 = Math.max(o.y1, y); o.ink++;
    o.cols.add(((d[i] >> 5) << 6) | ((d[i + 1] >> 5) << 3) | (d[i + 2] >> 5)); o.px.push([dist(i), d[i], d[i + 1], d[i + 2]]);
  }
  const H = Math.round((1000 * nh) / nw), imgs = [], txts = [];
  for (let k = 1; k <= n; k++) {
    const o = S[k], bw = o.x1 - o.x0 + 1, bh = o.y1 - o.y0 + 1, fill = o.ink / (bw * bh), rel = (bw * bh) / (w * h);
    if (o.ink < 12) continue;
    const box = { x: (o.x0 / w) * 100, y: (o.y0 / h) * 100, w: (bw / w) * 100, h: (bh / h) * 100 };
    if (rel >= 0.012 && bw >= 0.1 * w && bh >= 0.06 * h && fill >= 0.5 && o.cols.size >= 6) imgs.push(box);
    else if (fill < 0.5 && bh <= 0.3 * h && bh >= 2 && bw >= 4) {
      const top = o.px.sort((a, b) => b[0] - a[0]).slice(0, Math.max(1, Math.round(o.px.length * 0.3)));
      const m = top.reduce((a, p) => [a[0] + p[1], a[1] + p[2], a[2] + p[3]], [0, 0, 0]).map((v) => v / top.length);
      txts.push({ ...box, color: hex(...m) });
    }
  }
  const order = (a, b) => (Math.abs(a.y - b.y) > 5 ? a.y - b.y : a.x - b.x);
  imgs.sort(order); txts.sort(order);
  const slots = [
    ...imgs.slice(0, 12).map((b, i) => ({ ...newSlot('image', i + 1), ...b, x: +b.x.toFixed(1), y: +b.y.toFixed(1), w: +b.w.toFixed(1), h: +b.h.toFixed(1) })),
    ...txts.slice(0, 12).map((b, i) => {
      const hp = (b.h * H) / 100, big = b.h > 8;
      const x = clamp(b.x - 1, 0, 100), y = clamp(b.y - 0.5, 0, 100);
      return { ...newSlot('text', i + 1), x: +x.toFixed(1), y: +y.toFixed(1), w: +clamp(b.w + 2, 2, 100 - x).toFixed(1), h: +clamp(b.h + 1, 1, 100 - y).toFixed(1), color: b.color, fs: clamp(Math.round(hp * 0.9), 16, 120), sample: big ? 'Write your message here. It can run to a few lines.' : 'Your text' };
    }),
  ];
  const found = slots.length > 0;
  if (!found) slots.push({ ...newSlot('image', 1), x: 10, y: 8, w: 80, h: 50 }, { ...newSlot('text', 1), x: 10, y: 65, w: 80, h: 15 });
  return { bg: hex(...bg), slots, found, H, photos: imgs.length, texts: txts.length };
}
