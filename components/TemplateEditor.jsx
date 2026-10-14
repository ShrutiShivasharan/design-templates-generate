'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Upload, Plus, Trash2, Copy, Wand2, ImageIcon, Type } from 'lucide-react';
import DesignCanvas from './DesignCanvas';
import { useToast } from './Providers';
import { dbGet, dbPut } from '../lib/db';
import { detectSlots } from '../lib/detect';
import { readImage, validateFiles } from '../lib/imageUtils';
import { FONTS, SIZES, uid, clamp, blankTemplate, newSlot } from '../lib/util';

const Field = ({ label, children }) => <label className="f"><span>{label}</span>{children}</label>;
const Num = ({ label, v, min, max, on, step = 1 }) => (
  <label className="f"><span>{label}</span><div className="row nowrap"><input type="range" min={min} max={max} step={step} value={v} onChange={(e) => on(+e.target.value)} /><input type="number" className="n" step={step} value={v} onChange={(e) => on(+e.target.value)} /></div></label>
);

export default function TemplateEditor({ id }) {
  const router = useRouter(), toast = useToast();
  const [tpl, setTpl] = useState(null), [sel, setSel] = useState(null), [busy, setBusy] = useState(false), [err, setErr] = useState(''), [drag, setDrag] = useState(false), [cw, setCw] = useState(600);
  const wrap = useRef(null), ov = useRef(null), file = useRef(null);

  useEffect(() => { if (id === 'new') setTpl(blankTemplate()); else dbGet(id).then((t) => setTpl(t || false)).catch(() => setTpl(false)); }, [id]);
  useEffect(() => {
    if (!wrap.current) return; const ro = new ResizeObserver(([e]) => setCw(e.contentRect.width)); ro.observe(wrap.current); return () => ro.disconnect();
  }, [!!tpl]); // eslint-disable-line

  if (tpl === null) return <p className="center muted">Loading…</p>;
  if (tpl === false) return <div className="empty"><h2>Template not found</h2><Link className="btn primary" href="/templates">Back to templates</Link></div>;

  const upd = (sid, patch) => setTpl((t) => ({ ...t, slots: t.slots.map((s) => (s.id === sid ? { ...s, ...patch } : s)) }));
  const set = (patch) => setTpl((t) => ({ ...t, ...patch }));
  const S = tpl.slots.find((s) => s.id === sel);
  const sp = (patch) => upd(S.id, patch);
  const scale = Math.min(1, (cw - 4) / tpl.W, (typeof window !== 'undefined' ? window.innerHeight * 0.78 : 800) / tpl.H);

  async function onRef(f) {
    if (!f) return;
    const { ok, errors } = validateFiles([f]); if (!ok.length) { setErr(errors[0]); return; }
    setBusy(true); setErr('');
    try {
      const im = await readImage(f, 1600), det = await detectSlots(im.src, im.nw, im.nh);
      setTpl((t) => ({ ...t, ref: im.src, W: 1000, H: det.H, bg: det.bg, keepBase: true, slots: det.slots, name: t.name === 'Untitled template' ? f.name.replace(/\.[^.]+$/, '') : t.name }));
      setSel(det.slots[0]?.id);
      toast(det.found ? `Found ${det.photos} photo and ${det.texts} text areas. Drag any box that looks off.` : 'No clear areas found, so starter boxes were added. Drag them into place.', det.found ? 'ok' : 'error');
    } catch (e) { setErr(e.message); }
    setBusy(false);
  }
  function add(type) { const n = tpl.slots.filter((s) => s.type === type).length + 1, s = newSlot(type, n); set({ slots: [...tpl.slots, s] }); setSel(s.id); }
  function dup() { const s = { ...S, id: uid(), label: S.label + ' copy', x: clamp(S.x + 3, 0, 100 - S.w), y: clamp(S.y + 3, 0, 100 - S.h) }; set({ slots: [...tpl.slots, s] }); setSel(s.id); }
  function del() { set({ slots: tpl.slots.filter((s) => s.id !== sel) }); setSel(null); }
  function startDrag(e, sid, mode) {
    e.preventDefault(); setSel(sid);
    const box = ov.current.getBoundingClientRect(), o = tpl.slots.find((s) => s.id === sid), sx = e.clientX, sy = e.clientY;
    const mv = (ev) => {
      const dx = ((ev.clientX - sx) / box.width) * 100, dy = ((ev.clientY - sy) / box.height) * 100, r = (v) => +v.toFixed(1);
      upd(sid, mode === 'move' ? { x: r(clamp(o.x + dx, 0, 100 - o.w)), y: r(clamp(o.y + dy, 0, 100 - o.h)) } : { w: r(clamp(o.w + dx, 2, 100 - o.x)), h: r(clamp(o.h + dy, 1.5, 100 - o.y)) });
    };
    const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
  }
  async function save() {
    if (!tpl.name.trim()) { setErr('Give the template a name before saving.'); return; }
    if (!tpl.slots.length) { setErr('Add at least one photo or text area.'); return; }
    try { await dbPut({ ...tpl, name: tpl.name.trim(), updated: Date.now() }); toast('Template saved'); router.push('/templates'); }
    catch (e) { setErr('Could not save in this browser: ' + e.message); }
  }

  return (
    <div className="editor">
      <aside className="panel">
        <h2>{id === 'new' ? 'New template' : 'Edit template'}</h2>
        <Field label="Template name"><input className="inp" value={tpl.name} onChange={(e) => set({ name: e.target.value })} /></Field>
        <Field label="Description"><textarea className="inp" rows={2} value={tpl.description} onChange={(e) => set({ description: e.target.value })} /></Field>
        <div className={'drop' + (drag ? ' on' : '')} role="button" tabIndex={0} onClick={() => file.current.click()} onKeyDown={(e) => e.key === 'Enter' && file.current.click()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); onRef(e.dataTransfer.files[0]); }}>
          <Upload size={22} /><b>{busy ? 'Reading design…' : tpl.ref ? 'Replace design image' : 'Upload a design image'}</b><small>JPG, PNG or WebP. Photo and text areas are detected automatically.</small>
        </div>
        <input ref={file} type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={(e) => { onRef(e.target.files[0]); e.target.value = ''; }} />
        {err && <em className="err" role="alert">{err}</em>}
        {tpl.ref ? <>
          <label className="chk"><input type="checkbox" checked={tpl.keepBase} onChange={(e) => set({ keepBase: e.target.checked })} /> Keep decorations from the design image</label>
          <Field label="Page color"><input type="color" value={tpl.bg} onChange={(e) => set({ bg: e.target.value })} /></Field>
          <button className="btn sm" onClick={() => set({ ref: null, slots: [] })}>Remove design image</button>
        </> : <>
          <Field label="Canvas size"><select className="inp" value={Object.keys(SIZES).find((k) => SIZES[k][1] === tpl.H) || 'A4 portrait'} onChange={(e) => set({ W: SIZES[e.target.value][0], H: SIZES[e.target.value][1] })}>{Object.keys(SIZES).map((k) => <option key={k}>{k}</option>)}</select></Field>
          <Field label="Background color"><input type="color" value={tpl.bg} onChange={(e) => set({ bg: e.target.value })} /></Field>
        </>}
        <hr />
        <div className="row"><button className="btn sm" onClick={() => add('image')}><ImageIcon size={15} /> Add photo area</button><button className="btn sm" onClick={() => add('text')}><Type size={15} /> Add text area</button></div>
        <ul className="slots">{tpl.slots.map((s) => <li key={s.id}><button className={s.id === sel ? 'on' : ''} onClick={() => setSel(s.id)}>{s.type === 'image' ? <ImageIcon size={14} /> : <Type size={14} />} {s.label}</button></li>)}</ul>
        {!tpl.slots.length && <p className="muted">No areas yet. Upload a design image or add areas by hand.</p>}
        <div className="row"><button className="btn primary" onClick={save}>Save template</button><Link className="btn" href="/templates">Cancel</Link></div>
      </aside>

      <section className="stage" ref={wrap}>
        <p className="muted hint"><Wand2 size={14} /> Drag a box to move it and the corner handle to resize it.</p>
        <div className="paper">
          <DesignCanvas tpl={tpl} scale={scale}>
            <div ref={ov} className="ovl" onPointerDown={(e) => e.target === e.currentTarget && setSel(null)}>
              {tpl.slots.map((s) => (
                <div key={s.id} className={'ov ' + s.type + (s.id === sel ? ' on' : '')} style={{ left: s.x + '%', top: s.y + '%', width: s.w + '%', height: s.h + '%' }} onPointerDown={(e) => startDrag(e, s.id, 'move')}>
                  <span className="tag">{s.label}</span><i className="rs" onPointerDown={(e) => { e.stopPropagation(); startDrag(e, s.id, 'size'); }} />
                </div>))}
            </div>
          </DesignCanvas>
        </div>
      </section>

      <aside className="panel">
        {!S ? <><h2>Area settings</h2><p className="muted">Select a box on the design or from the list to edit it.</p></> : <>
          <h2>{S.type === 'image' ? 'Photo area' : 'Text area'}</h2>
          <Field label="Label"><input className="inp" value={S.label} onChange={(e) => sp({ label: e.target.value })} /></Field>
          <label className="chk"><input type="checkbox" checked={S.required} onChange={(e) => sp({ required: e.target.checked })} /> Required when creating a design</label>
          <Num label="Left %" v={S.x} min={0} max={100} step={0.1} on={(v) => sp({ x: clamp(v, 0, 100) })} />
          <Num label="Top %" v={S.y} min={0} max={100} step={0.1} on={(v) => sp({ y: clamp(v, 0, 100) })} />
          <Num label="Width %" v={S.w} min={2} max={100} step={0.1} on={(v) => sp({ w: clamp(v, 1, 100) })} />
          <Num label="Height %" v={S.h} min={1.5} max={100} step={0.1} on={(v) => sp({ h: clamp(v, 1, 100) })} />
          {S.type === 'image' ? <>
            <Num label="Rotation °" v={S.rot} min={-30} max={30} on={(v) => sp({ rot: v })} />
            <Num label="Corner radius" v={S.br} min={0} max={300} on={(v) => sp({ br: v })} />
            <Num label="Border width" v={S.bw} min={0} max={40} on={(v) => sp({ bw: v })} />
            <Field label="Border color"><input type="color" value={S.bc} onChange={(e) => sp({ bc: e.target.value })} /></Field>
            <label className="chk"><input type="checkbox" checked={S.shadow} onChange={(e) => sp({ shadow: e.target.checked })} /> Drop shadow</label>
            <label className="chk"><input type="checkbox" checked={S.frame} onChange={(e) => sp({ frame: e.target.checked })} /> Outline frame behind photo</label>
            {S.frame && <><Field label="Frame color"><input type="color" value={S.fc} onChange={(e) => sp({ fc: e.target.value })} /></Field><Num label="Frame offset" v={S.fo} min={-40} max={60} on={(v) => sp({ fo: v })} /></>}
          </> : <>
            <Field label="Sample text"><textarea className="inp" rows={2} value={S.sample} onChange={(e) => sp({ sample: e.target.value })} /></Field>
            <Field label="Font"><select className="inp" value={S.font} onChange={(e) => sp({ font: e.target.value })}>{FONTS.map((f) => <option key={f}>{f}</option>)}</select></Field>
            <Field label="Text color"><input type="color" value={S.color} onChange={(e) => sp({ color: e.target.value })} /></Field>
            <Num label={S.auto ? 'Largest font size' : 'Font size'} v={S.fs} min={10} max={200} on={(v) => sp({ fs: v })} />
            <label className="chk"><input type="checkbox" checked={S.auto} onChange={(e) => sp({ auto: e.target.checked })} /> Shrink text to fit the box</label>
            <Num label="Line height" v={S.lh} min={1} max={2} step={0.05} on={(v) => sp({ lh: v })} />
            <div className="row nowrap">
              <Field label="Align"><select className="inp" value={S.align} onChange={(e) => sp({ align: e.target.value })}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></Field>
              <Field label="Vertical"><select className="inp" value={S.valign} onChange={(e) => sp({ valign: e.target.value })}><option value="top">Top</option><option value="middle">Middle</option><option value="bottom">Bottom</option></select></Field>
              <Field label="Weight"><select className="inp" value={S.weight} onChange={(e) => sp({ weight: +e.target.value })}>{[400, 500, 600, 700].map((w) => <option key={w}>{w}</option>)}</select></Field>
            </div>
          </>}
          {tpl.ref && tpl.keepBase && <>
            <label className="chk"><input type="checkbox" checked={S.cover} onChange={(e) => sp({ cover: e.target.checked })} /> Erase the original content here</label>
            <Num label="Erase margin px" v={S.pad} min={0} max={60} on={(v) => sp({ pad: v })} />
          </>}
          <div className="row"><button className="btn sm" onClick={dup}><Copy size={14} /> Duplicate</button><button className="btn sm danger" onClick={del}><Trash2 size={14} /> Delete</button></div>
        </>}
      </aside>
    </div>
  );
}
