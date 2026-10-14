'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import DesignCanvas from '../components/DesignCanvas';
import { starters } from '../lib/starters';

const STEPS = [
  ['Upload a design', 'Drop in any design image. The app finds the photo and text areas and turns them into fields. Drag the boxes to fix anything it missed.'],
  ['Fill in your details', 'Pick a template, add your photos and type your text. The design builds itself as you go.'],
  ['Download when ready', 'Get a ZIP with your images, your text and the design preview, or just the PNG.'],
];
export default function Home() {
  const demo = useMemo(() => starters()[0], []);
  return (
    <div className="wrap">
      <section className="hero">
        <div>
          <h1>Turn any design into a reusable template</h1>
          <p className="lead">Upload a design image once. After that, anyone can drop in photos and text and get a finished design in seconds.</p>
          <div className="row"><Link className="btn primary" href="/templates/new">Create a template</Link><Link className="btn" href="/create">Use a template</Link></div>
        </div>
        <div className="demo"><DesignCanvas tpl={demo} scale={0.3} /></div>
      </section>
      <section className="steps">
        {STEPS.map(([t, d], i) => <div className="card" key={t}><span className="num">{i + 1}</span><h3>{t}</h3><p>{d}</p></div>)}
      </section>
      <footer className="foot">Everything runs in your browser. Templates are saved on this device and nothing is uploaded.
     <p>@shruti098 || 2026</p>
     </footer>
    </div>
  );
}
