import { forwardRef } from 'react';

// Approximate auto-fit: largest font size (<= max) whose wrapped text fits the box.
export function fitFont(text, wpx, hpx, max, lh) {
  const t = (text || '').trim(); if (!t) return max;
  for (let s = Math.round(max); s >= 8; s--) {
    const cpl = Math.max(1, Math.floor(wpx / (s * 0.55)));
    const lines = t.split('\n').reduce((n, p) => n + Math.max(1, Math.ceil(p.length / cpl)), 0);
    if (lines * s * lh <= hpx) return s;
  }
  return 8;
}
const rect = (s) => ({ position: 'absolute', left: `${s.x}%`, top: `${s.y}%`, width: `${s.w}%`, height: `${s.h}%` });
const PH = { background: 'repeating-linear-gradient(45deg,#fbe3ea,#fbe3ea 10px,#f8d2de 10px,#f8d2de 20px)', color: '#a8325a', display: 'grid', placeItems: 'center', fontFamily: 'Poppins,sans-serif', fontSize: 22, textAlign: 'center' };

function ImageSlot({ s, v, showPh }) {
  return (
    <div style={{ ...rect(s), transform: `rotate(${s.rot || 0}deg)` }}>
      {s.frame && <div style={{ position: 'absolute', inset: 0, transform: `translate(${s.fo}px,${s.fo}px) rotate(-1.5deg)`, border: `3px solid ${s.fc}` }} />}
      <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', boxSizing: 'border-box', borderRadius: s.br, border: s.bw ? `${s.bw}px solid ${s.bc}` : 'none', boxShadow: s.shadow ? '0 10px 28px rgba(0,0,0,.28)' : 'none' }}>
        {v?.src
          ? <img src={v.src} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transform: `translate(${v.px || 0}%,${v.py || 0}%) scale(${v.zoom || 1})` }} />
          : showPh && <div data-ph="1" style={{ ...PH, width: '100%', height: '100%' }}>{s.label}</div>}
      </div>
    </div>
  );
}
function TextSlot({ s, v, showPh, W, H }) {
  const empty = !(v || '').trim(), text = empty ? (showPh ? s.sample : '') : v;
  if (!text) return null;
  const size = s.auto === false ? s.fs : fitFont(text, (s.w / 100) * W, (s.h / 100) * H, s.fs, s.lh);
  return (
    <div data-ph={empty ? '1' : undefined} style={{ ...rect(s), display: 'flex', alignItems: { top: 'flex-start', middle: 'center', bottom: 'flex-end' }[s.valign] }}>
      <div style={{ width: '100%', textAlign: s.align, fontFamily: `'${s.font}', cursive`, fontSize: size, fontWeight: s.weight, color: s.color, lineHeight: s.lh, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', opacity: empty ? 0.4 : 1 }}>{text}</div>
    </div>
  );
}
// Renders a template filled with `values` ({slotId: text} or {slotId: {src, zoom, px, py}}). The ref points at the exportable node.
const DesignCanvas = forwardRef(function DesignCanvas({ tpl, values = {}, scale = 1, showPh = true, children }, ref) {
  const base = tpl.ref && tpl.keepBase;
  return (
    <div style={{ position: 'relative', width: tpl.W * scale, height: tpl.H * scale, flex: 'none' }}>
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <div ref={ref} style={{ width: tpl.W, height: tpl.H, transform: `scale(${scale})`, transformOrigin: 'top left', position: 'relative', overflow: 'hidden', background: tpl.bg }}>
          {base && <img src={tpl.ref} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />}
          {base && tpl.slots.filter((s) => s.cover !== false).map((s) => (
            <div key={'c' + s.id} style={{ position: 'absolute', background: tpl.bg, left: `calc(${s.x}% - ${s.pad}px)`, top: `calc(${s.y}% - ${s.pad}px)`, width: `calc(${s.w}% + ${2 * s.pad}px)`, height: `calc(${s.h}% + ${2 * s.pad}px)` }} />
          ))}
          {tpl.slots.map((s) => (s.type === 'image'
            ? <ImageSlot key={s.id} s={s} v={values[s.id]} showPh={showPh} />
            : <TextSlot key={s.id} s={s} v={values[s.id]} showPh={showPh} W={tpl.W} H={tpl.H} />))}
        </div>
      </div>
      {children}
    </div>
  );
});
export default DesignCanvas;
