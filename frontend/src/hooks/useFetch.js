import { useCallback, useEffect, useRef, useState } from 'react';

// Ambil data saat komponen tampil dan setiap kali `deps` berubah.
//   const { data, loading, error, reload } = useFetch(() => api('/stats'), []);
// Permintaan lama dibuang bila deps berubah sebelum selesai, jadi data tidak tertukar.
export function useFetch(ambil, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: '' });
  const [versi, setVersi] = useState(0);
  const ambilTerbaru = useRef(ambil);
  ambilTerbaru.current = ambil;

  useEffect(() => {
    let batal = false;
    setState((s) => ({ ...s, loading: true, error: '' }));
    Promise.resolve()
      .then(() => ambilTerbaru.current())
      .then((data) => { if (!batal) setState({ data, loading: false, error: '' }); })
      .catch((e) => { if (!batal) setState({ data: null, loading: false, error: e.message }); });
    return () => { batal = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, versi]);

  const reload = useCallback(() => setVersi((v) => v + 1), []);
  return { ...state, reload };
}
