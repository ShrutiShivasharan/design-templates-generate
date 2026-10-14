'use client';
import { createContext, useCallback, useContext, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layers } from 'lucide-react';

const Ctx = createContext(() => {});
export const useToast = () => useContext(Ctx);

export default function Providers({ children }) {
  const [m, setM] = useState(null), t = useRef(), path = usePathname();
  const toast = useCallback((text, type = 'ok') => { setM({ text, type }); clearTimeout(t.current); t.current = setTimeout(() => setM(null), 4500); }, []);
  const links = [['/', 'Home'], ['/templates', 'Templates'], ['/create', 'Create design']];
  return (
    <Ctx.Provider value={toast}>
      <header className="nav">
        <Link href="/" className="brand"><Layers size={20} />Design Template Studio</Link>
        <nav>{links.map(([h, l]) => <Link key={h} href={h} className={(h === '/' ? path === '/' : path.startsWith(h)) ? 'on' : ''}>{l}</Link>)}</nav>
      </header>
      <main>{children}</main>
      {m && <div className={'toast ' + m.type} role="status">{m.text}</div>}
    </Ctx.Provider>
  );
}
