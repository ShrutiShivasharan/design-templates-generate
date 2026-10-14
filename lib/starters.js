import { uid, newSlot } from './util';
const mk = (type, n, o) => ({ ...newSlot(type, n), ...o });
const tpl = (name, description, H, bg, slots) => ({ id: uid(), name, description, W: 1000, H, bg, ref: null, keepBase: false, slots, updated: Date.now() });
const q = { font: 'Caveat', fs: 44 };
export const starters = () => [
  tpl('Romantic Scrapbook', 'Three tilted photos with three quotes.', 1414, '#fffdfa', [
    mk('image', 1, { x: 8, y: 6, w: 40, h: 26, rot: -4, frame: true }), mk('text', 1, { ...q, x: 54, y: 9, w: 38, h: 18, sample: 'In all the world, there is no heart for me like yours.' }),
    mk('text', 2, { ...q, x: 8, y: 37, w: 38, h: 16, sample: 'Every moment with you is my favorite.' }), mk('image', 2, { x: 52, y: 36, w: 40, h: 26, rot: 3, frame: true }),
    mk('image', 3, { x: 8, y: 66, w: 40, h: 26, rot: -3, frame: true }), mk('text', 3, { ...q, x: 54, y: 72, w: 38, h: 14, sample: 'If I know what love is, it is because of you.' }),
  ]),
  tpl('Photo Duo Card', 'Two photos with a title and caption.', 1000, '#f4efe9', [
    mk('text', 1, { x: 10, y: 6, w: 80, h: 12, font: 'Playfair Display', fs: 64, sample: 'Our Day', color: '#2b2118' }),
    mk('image', 1, { x: 8, y: 22, w: 40, h: 56, br: 8, shadow: true }), mk('image', 2, { x: 52, y: 22, w: 40, h: 56, br: 8, shadow: true }),
    mk('text', 2, { x: 10, y: 82, w: 80, h: 10, font: 'Poppins', fs: 28, sample: 'A short caption about the day', color: '#2b2118' }),
  ]),
  tpl('Gallery Grid', 'Four photos in a grid with a heading.', 1000, '#ffffff', [
    mk('text', 1, { x: 10, y: 4, w: 80, h: 10, font: 'Dancing Script', fs: 56, sample: 'Memories', color: '#111111' }),
    mk('image', 1, { x: 8, y: 18, w: 41, h: 36, br: 4 }), mk('image', 2, { x: 51, y: 18, w: 41, h: 36, br: 4 }),
    mk('image', 3, { x: 8, y: 56, w: 41, h: 36, br: 4 }), mk('image', 4, { x: 51, y: 56, w: 41, h: 36, br: 4 }),
  ]),
];
