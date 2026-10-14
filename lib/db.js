// All templates live in this browser's IndexedDB. No server, no database service.
const open = () => new Promise((res, rej) => { const r = indexedDB.open('design-templates', 1); r.onupgradeneeded = () => r.result.createObjectStore('templates', { keyPath: 'id' }); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
const tx = async (mode, fn) => { const db = await open(); return new Promise((res, rej) => { const t = db.transaction('templates', mode); const rq = fn(t.objectStore('templates')); t.oncomplete = () => { db.close(); res(rq.result); }; t.onerror = t.onabort = () => rej(t.error); }); };
export const dbAll = () => tx('readonly', (s) => s.getAll());
export const dbGet = (id) => tx('readonly', (s) => s.get(id));
export const dbPut = (t) => tx('readwrite', (s) => s.put(t));
export const dbDel = (id) => tx('readwrite', (s) => s.delete(id));
