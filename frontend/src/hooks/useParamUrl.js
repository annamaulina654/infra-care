import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

// Simpan filter dan nomor halaman di URL (?status=Selesai&page=2) agar tombol Kembali
// dan tautan yang dibagikan tetap membawa filter yang sama.
export function useParamUrl(kunci) {
  const [params, setParams] = useSearchParams();

  const nilai = useMemo(() => {
    const o = {};
    kunci.forEach((k) => { o[k] = params.get(k) || ''; });
    o.page = Math.max(1, Number(params.get('page')) || 1);
    return o;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  // Mengubah filter selalu mengembalikan ke halaman 1; mengubah `page` saja tidak.
  const ubah = useCallback((patch) => {
    setParams((lama) => {
      const baru = new URLSearchParams(lama);
      Object.entries(patch).forEach(([k, v]) => { v ? baru.set(k, v) : baru.delete(k); });
      if (!('page' in patch)) baru.delete('page');
      if (baru.get('page') === '1') baru.delete('page');
      return baru;
    }, { replace: true });
  }, [setParams]);

  return [nilai, ubah];
}
