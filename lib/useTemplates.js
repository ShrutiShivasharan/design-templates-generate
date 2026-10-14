import { useCallback, useEffect, useState } from 'react';
import { dbAll } from './db';
export default function useTemplates() {
  const [list, setList] = useState(null);
  const refresh = useCallback(() => dbAll().then((l) => setList(l.sort((a, b) => b.updated - a.updated))).catch(() => setList([])), []);
  useEffect(() => { refresh(); }, [refresh]);
  return { list, refresh };
}
