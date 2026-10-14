'use client';
import { useEffect } from 'react';
export default function Modal({ title, children, onClose }) {
  useEffect(() => { const k = (e) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [onClose]);
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <div className="box" onClick={(e) => e.stopPropagation()}><h3>{title}</h3>{children}</div>
    </div>
  );
}
