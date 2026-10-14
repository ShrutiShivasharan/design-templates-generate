'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Plus, Pencil, Copy, Trash2, Sparkles, ArrowRight, Type } from 'lucide-react';
import DesignCanvas from './DesignCanvas';
import Modal from './Modal';
import { useToast } from './Providers';
import useTemplates from '../lib/useTemplates';
import { dbPut, dbDel } from '../lib/db';
import { starters } from '../lib/starters';
import { uid } from '../lib/util';

// mode "manage" = full CRUD list, mode "pick" = choose a template to create a design from
export default function TemplatesPage({ mode }) {
  const { list, refresh } = useTemplates(), toast = useToast(), [modal, setModal] = useState(null);
  const manage = mode === 'manage';
  const run = async (fn, ok) => { try { await fn(); await refresh(); toast(ok); } catch (e) { toast('Something went wrong: ' + e.message, 'error'); } };
  const counts = (t) => [t.slots.filter((s) => s.type === 'image').length, t.slots.filter((s) => s.type === 'text').length];

  if (list === null) return <p className="center muted">Loading templates…</p>;
  return (
    <div className="wrap">
      <div className="head">
        <div><h1>{manage ? 'Templates' : 'Choose a template'}</h1><p className="muted">{manage ? 'Create, edit, duplicate and delete your templates. They are stored in this browser only.' : 'Pick a template, then add your photos and text.'}</p></div>
        <div className="row">
          {manage && <button className="btn" onClick={() => run(async () => { for (const t of starters()) await dbPut(t); }, 'Starter templates added')}><Sparkles size={16} /> Add starter templates</button>}
          <Link className="btn primary" href="/templates/new"><Plus size={16} /> New template</Link>
        </div>
      </div>
      {!list.length ? (
        <div className="empty">
          <h2>No templates yet</h2><p>Upload a design image and we'll find its photo and text areas, or start with a ready-made template.</p>
          <div className="row center"><Link className="btn primary" href="/templates/new">Create from a design image</Link><button className="btn" onClick={() => run(async () => { for (const t of starters()) await dbPut(t); }, 'Starter templates added')}>Add starter templates</button></div>
        </div>
      ) : (
        <div className="grid">
          {list.map((t) => { const [ni, nt] = counts(t); return (
            <article className="tcard" key={t.id}>
              <Link href={`/create/${t.id}`} className="thumb" aria-label={`Use ${t.name}`}><DesignCanvas tpl={t} scale={Math.min(0.26, 340 / t.H)} /></Link>
              <h3>{t.name}</h3>
              <small className="muted">{ni} photo{ni !== 1 && 's'} · {nt} text field{nt !== 1 && 's'}</small>
              <div className="acts">
                <Link className="btn primary sm" href={`/create/${t.id}`}>Use <ArrowRight size={14} /></Link>
                {manage && <>
                  <Link className="ib" href={`/templates/${t.id}`} title="Edit" aria-label="Edit"><Pencil size={15} /></Link>
                  <button className="ib" title="Duplicate" aria-label="Duplicate" onClick={() => run(() => dbPut({ ...structuredClone(t), id: uid(), name: t.name + ' (copy)', updated: Date.now() }), 'Template duplicated')}><Copy size={15} /></button>
                  <button className="ib" title="Rename" aria-label="Rename" onClick={() => setModal({ kind: 'rename', t, name: t.name })}><Type size={15} /></button>
                  <button className="ib danger" title="Delete" aria-label="Delete" onClick={() => setModal({ kind: 'delete', t })}><Trash2 size={15} /></button>
                </>}
              </div>
            </article>); })}
        </div>
      )}
      {modal?.kind === 'rename' && (
        <Modal title="Rename template" onClose={() => setModal(null)}>
          <input autoFocus className="inp" value={modal.name} onChange={(e) => setModal({ ...modal, name: e.target.value })} aria-label="Template name" />
          <div className="row"><button className="btn" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn primary" disabled={!modal.name.trim()} onClick={() => { const m = modal; setModal(null); run(() => dbPut({ ...m.t, name: m.name.trim(), updated: Date.now() }), 'Template renamed'); }}>Save</button></div>
        </Modal>)}
      {modal?.kind === 'delete' && (
        <Modal title={`Delete "${modal.t.name}"?`} onClose={() => setModal(null)}>
          <p className="muted">This removes the template from this browser. It can't be undone.</p>
          <div className="row"><button className="btn" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn danger" onClick={() => { const m = modal; setModal(null); run(() => dbDel(m.t.id), 'Template deleted'); }}>Delete</button></div>
        </Modal>)}
    </div>
  );
}
