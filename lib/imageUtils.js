const TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export function validateFiles(files, maxMb = 12) {
  const ok = [], errors = [];
  if (!files.length) return { ok, errors: ['Choose an image first.'] };
  for (const f of files) {
    if (!TYPES.includes(f.type)) errors.push(`${f.name}: unsupported format. Use JPG, PNG or WebP.`);
    else if (f.size > maxMb * 1048576) errors.push(`${f.name}: larger than ${maxMb} MB.`);
    else ok.push(f);
  }
  return { ok, errors };
}
export async function readImage(file, max = 2000) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error(`Could not read ${file.name}.`)); i.src = url; });
    const s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * s); c.height = Math.round(img.naturalHeight * s);
    const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height);
    return { src: c.toDataURL('image/jpeg', 0.92), nw: c.width, nh: c.height };
  } finally { URL.revokeObjectURL(url); }
}
