'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Upload, Download, Package, X } from 'lucide-react';
import DesignCanvas from './DesignCanvas';
import { useToast } from './Providers';
import { dbGet } from '../lib/db';
import { readImage, validateFiles } from '../lib/imageUtils';
import { exportDesign } from '../lib/export';

export default function CreateDesign({ id }) {
  const toast = useToast();
  const [tpl, setTpl] = useState(null), [vals, setVals] = useState({}), [errs, setErrs] = useState([]), [fileErrs, setFileErrs] = useState([]), [busy, setBusy] = useState(''), [cw, setCw] = useState(500);
  const wrap = useRef(null), node = useRef(null), multi = useRef(null), single = useRef(null), target = useRef(null);

  useEffect(() => { dbGet(id).then((t) => setTpl(t || false)).catch(() => setTpl(false)); }, [id]);
  useEffect(() => { if (!wrap.current) return; const ro = new ResizeObserver(([e]) => setCw(e.contentRect.width)); ro.observe(wrap.current); return () => ro.disconnect(); }, [!!tpl]); // eslint-disable-line

  useEffect(() => { setErrs((e) => (e.length ? [] : e)); }, [vals]);

  if (tpl === null) return <p className="center muted">Loading…</p>;
  if (tpl === false) return <div className="empty"><h2>Template not found</h2><p>It may have been deleted.</p><Link className="btn primary" href="/create">Choose another template</Link></div>;

  const imgs = tpl.slots.filter((s) => s.type === 'image'), txts = tpl.slots.filter((s) => s.type === 'text');
  const patch = (sid, p) => setVals((v) => ({ ...v, [sid]: { ...(v[sid] || {}), ...p } }));
  const scale = Math.min(1, (cw - 4) / tpl.W, (typeof window !== 'undefined' ? window.innerHeight * 0.8 : 800) / tpl.H);

  async function addImages(files, slotId) {
    const { ok, errors } = validateFiles(files);
    const targets = slotId ? [slotId] : imgs.filter((s) => !vals[s.id]?.src).map((s) => s.id);
    if (ok.length > targets.length) errors.push(`Only ${targets.length} empty photo area${targets.length === 1 ? '' : 's'} available, so ${ok.length - targets.length} file(s) were skipped.`);
    for (const [i, f] of ok.slice(0, targets.length).entries()) {
      try { const im = await readImage(f); patch(targets[i], { src: im.src, nw: im.nw, nh: im.nh, zoom: 1, px: 0, py: 0 }); } catch (e) { errors.push(e.message); }
    }
    setFileErrs(errors);
  }
  function validate() {
    return tpl.slots.filter((s) => s.required && (s.type === 'image' ? !vals[s.id]?.src : !(vals[s.id] || '').trim())).map((s) => (s.type === 'image' ? `${s.label}: add a photo` : `${s.label}: enter some text`));
  }
  async function download(kind) {
    const e = validate(); setErrs(e);
    if (e.length) { toast(`Fix ${e.length} thing${e.length > 1 ? 's' : ''} first.`, 'error'); return; }
    setBusy(kind);
    try { await exportDesign(kind, tpl, vals, node.current, 2); toast(kind === 'zip' ? 'ZIP download started' : 'PNG download started'); }
    catch (err) { toast('Export failed: ' + err.message, 'error'); }
    setBusy('');
  }

  return (
    <div className="create">
      <section className="panel">
        <h1>{tpl.name}</h1>
        {tpl.description && <p className="muted">{tpl.description}</p>}
        <h2>Photos</h2>
        <button className="btn" onClick={() => multi.current.click()}><Upload size={16} /> Upload several photos at once</button>
        <input ref={multi} type="file" hidden multiple accept="image/jpeg,image/png,image/webp" onChange={(e) => { addImages([...e.target.files]); e.target.value = ''; }} />
        <input ref={single} type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={(e) => { addImages([...e.target.files], target.current); e.target.value = ''; }} />
        {fileErrs.map((m, i) => <em className="err" key={i} role="alert">{m}</em>)}
        {imgs.map((s) => { const v = vals[s.id]; return (
          <div className="slotbox" key={s.id}>
            <div className="row nowrap">
              <button className="th" aria-label={`Choose image for ${s.label}`} onClick={() => { target.current = s.id; single.current.click(); }}>{v?.src ? <img src={v.src} alt="" /> : <Upload size={18} />}</button>
              <div className="grow"><b>{s.label}{s.required && ' *'}</b><br /><small className="muted">{v?.src ? 'Click the thumbnail to replace' : 'Click to add a photo'}</small></div>
              {v?.src && <button className="ib" aria-label={`Remove ${s.label} photo`} onClick={() => setVals((x) => { const n = { ...x }; delete n[s.id]; return n; })}><X size={15} /></button>}
            </div>
            {v?.src && <div className="adj">
              <label>Zoom<input type="range" min={1} max={3} step={0.05} value={v.zoom} onChange={(e) => patch(s.id, { zoom: +e.target.value })} /></label>
              <label>Left / right<input type="range" min={-50} max={50} value={v.px} onChange={(e) => patch(s.id, { px: +e.target.value })} /></label>
              <label>Up / down<input type="range" min={-50} max={50} value={v.py} onChange={(e) => patch(s.id, { py: +e.target.value })} /></label>
            </div>}
          </div>); })}
        {!imgs.length && <p className="muted">This template has no photo areas.</p>}
        <h2>Text</h2>
        {txts.map((s) => (
          <label className="f" key={s.id}><span>{s.label}{s.required && ' *'}</span>
            <textarea className="inp" rows={s.h > 8 ? 3 : 1} placeholder={s.sample} value={vals[s.id] || ''} onChange={(e) => setVals((v) => ({ ...v, [s.id]: e.target.value }))} /></label>))}
        {!txts.length && <p className="muted">This template has no text areas.</p>}
        {errs.length > 0 && <ul className="errs" role="alert">{errs.map((m) => <li key={m}>{m}</li>)}</ul>}
      </section>
      <section className="stage" ref={wrap}>
        <div className="paper"><DesignCanvas ref={node} tpl={tpl} values={vals} scale={scale} /></div>
        <div className="row center">
          <button className="btn" disabled={!!busy} onClick={() => download('png')}><Download size={16} /> {busy === 'png' ? 'Rendering…' : 'Download PNG'}</button>
          <button className="btn primary" disabled={!!busy} onClick={() => download('zip')}><Package size={16} /> {busy === 'zip' ? 'Packing ZIP…' : 'Download ZIP'}</button>
        </div>
        <p className="muted center small">The ZIP holds your uploaded images, your text and the design preview. Fields marked * are required.</p>
      </section>
    </div>
  );
}
