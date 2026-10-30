import { useEffect, useState } from 'react';
import { APP_NAME } from '../config.js';

// Tunda perubahan nilai (mis. ketikan pencarian) agar tidak memanggil server di setiap huruf.
export function useDebounce(nilai, ms = 350) {
  const [tertunda, setTertunda] = useState(nilai);
  useEffect(() => {
    const t = setTimeout(() => setTertunda(nilai), ms);
    return () => clearTimeout(t);
  }, [nilai, ms]);
  return tertunda;
}

// Judul tab browser: "Dashboard · Lapor Pak Klebun".
export function useJudul(judul) {
  useEffect(() => {
    document.title = judul ? `${judul} · ${APP_NAME}` : APP_NAME;
  }, [judul]);
}
