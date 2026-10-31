import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { didukung, mandiri, perangkatApple, langgananSaatIni, aktifkanPush, nonaktifkanPush } from '../lib/push.js';

// Status notifikasi push untuk perangkat ini.
//   serverAktif : server sudah diberi kunci VAPID (null = belum diketahui)
//   perluPasang : iPhone/iPad yang belum memasang situs ke layar utama
export function usePush() {
  const [state, setState] = useState({ siap: false, serverAktif: null, kunci: null, aktif: false, izin: 'default' });
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState('');
  const [info, setInfo] = useState('');

  const muat = useCallback(async () => {
    let server = { aktif: false, key: null };
    try { server = await api('/push/key'); } catch { /* anggap mati */ }
    let aktif = false;
    try { aktif = Boolean(await langgananSaatIni()); } catch { /* abaikan */ }
    setState({
      siap: true, serverAktif: server.aktif, kunci: server.key, aktif,
      izin: typeof Notification !== 'undefined' ? Notification.permission : 'denied',
    });
  }, []);

  useEffect(() => { muat(); }, [muat]);

  const jalankan = async (fn) => {
    setSibuk(true); setGalat(''); setInfo('');
    try { await fn(); } catch (e) { setGalat(e.message || 'Terjadi kesalahan'); } finally { setSibuk(false); }
  };

  const aktifkan = () => jalankan(async () => { await aktifkanPush(state.kunci); await muat(); });
  const nonaktifkan = () => jalankan(async () => { await nonaktifkanPush(); await muat(); });
  const uji = () => jalankan(async () => {
    const h = await api('/push/test', { method: 'POST', body: {} });
    setInfo(h.terkirim > 0 ? 'Notifikasi percobaan dikirim. Cek perangkat Anda.' : 'Belum ada perangkat yang terdaftar. Coba aktifkan ulang.');
  });

  return {
    ...state, sibuk, galat, info, aktifkan, nonaktifkan, uji,
    didukung: didukung(),
    perluPasang: perangkatApple() && !mandiri(),
  };
}
