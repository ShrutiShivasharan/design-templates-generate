import { toPng } from 'html-to-image';
import { slug } from './util';

function save(blob, name) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
export async function renderPng(node, tpl, ratio = 2) {
  if (!node) throw new Error('The design is not ready yet.');
  await document.fonts?.ready;
  const opt = { pixelRatio: ratio, width: tpl.W, height: tpl.H, filter: (n) => !(n.dataset && n.dataset.ph), style: { transform: 'none', transformOrigin: 'top left' } };
  try { return await toPng(node, opt); } catch { return await toPng(node, { ...opt, skipFonts: true }); }
}
// ZIP = your uploaded images + your text (details.json) + the rendered design preview.
async function buildZip(tpl, vals, png) {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip(), root = zip.folder(slug(tpl.name)), imgs = root.folder('images');
  const fields = {}, images = {};
  tpl.slots.forEach((s) => {
    const v = vals[s.id];
    if (s.type === 'text') fields[s.label] = v || '';
    else if (v?.src) { const f = `${slug(s.label)}.jpg`; imgs.file(f, v.src.split(',')[1], { base64: true }); images[s.label] = 'images/' + f; }
  });
  root.file('details.json', JSON.stringify({ template: tpl.name, created: new Date().toISOString(), text: fields, images }, null, 2));
  root.file('design-preview.png', png.split(',')[1], { base64: true });
  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
}
export async function exportDesign(kind, tpl, vals, node, ratio = 2) {
  const png = await renderPng(node, tpl, ratio), base = slug(tpl.name);
  if (kind === 'png') return save(await (await fetch(png)).blob(), base + '.png');
  return save(await buildZip(tpl, vals, png), base + '.zip');
}
