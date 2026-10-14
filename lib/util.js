export const uid = () => Math.random().toString(36).slice(2, 10);
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const slug = (s) => (s || 'design').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'design';
export const FONTS = ['Caveat', 'Dancing Script', 'Great Vibes', 'Playfair Display', 'Poppins'];
export const SIZES = { 'A4 portrait': [1000, 1414], 'A4 landscape': [1000, 707], Square: [1000, 1000], Story: [1000, 1778] };
export const newSlot = (type, n) => type === 'image'
  ? { id: uid(), type, label: `Photo ${n}`, x: 30, y: 30, w: 30, h: 25, rot: 0, required: true, cover: true, pad: 6, br: 0, bw: 0, bc: '#ffffff', frame: false, fc: '#111111', fo: 12, shadow: false }
  : { id: uid(), type, label: `Text ${n}`, x: 25, y: 30, w: 50, h: 10, required: true, cover: true, pad: 6, sample: 'Your text here', font: 'Caveat', color: '#111111', align: 'center', valign: 'middle', weight: 400, fs: 40, lh: 1.25, auto: true };
export const blankTemplate = () => ({ id: uid(), name: 'Untitled template', description: '', W: 1000, H: 1414, bg: '#ffffff', ref: null, keepBase: true, slots: [] });
