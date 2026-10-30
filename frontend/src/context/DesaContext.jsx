// Data desa (nama, kontak, daftar dusun) dari /api/public/info. Dipakai di halaman depan,
// formulir pendaftaran, dan formulir pengaduan.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api.js';
import { DESA_CADANGAN } from '../config.js';

const DesaContext = createContext(DESA_CADANGAN);

export function DesaProvider({ children }) {
  const [info, setInfo] = useState(DESA_CADANGAN);
  const [siap, setSiap] = useState(false);

  const muat = useCallback(() =>
    api('/public/info', { tanpaToken: true })
      .then(setInfo)
      .catch(() => {})        // pakai data cadangan bila server belum bisa dijangkau
      .finally(() => setSiap(true)), []);

  useEffect(() => { muat(); }, [muat]);

  const nilai = useMemo(() => ({ ...info, siap, muat }), [info, siap, muat]);
  return <DesaContext.Provider value={nilai}>{children}</DesaContext.Provider>;
}

export const useDesa = () => useContext(DesaContext);
