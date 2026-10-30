// Status login untuk seluruh aplikasi. Token disimpan di localStorage; data pengguna selalu
// dibaca ulang dari server (/auth/me) saat aplikasi dibuka, jadi perubahan peran atau
// penonaktifan akun oleh admin langsung berlaku.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ambilToken, simpanToken, aturSaatSesiBerakhir } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [siap, setSiap] = useState(false); // false selama token awal masih diperiksa

  useEffect(() => {
    if (!ambilToken()) { setSiap(true); return; }
    api('/auth/me')
      .then(setUser)
      .catch(() => simpanToken(null))
      .finally(() => setSiap(true));
  }, []);

  // Server menjawab 401 (token kedaluwarsa atau akun dinonaktifkan): kembali ke halaman masuk.
  useEffect(() => {
    aturSaatSesiBerakhir(() => {
      simpanToken(null);
      setUser(null);
      navigate('/login?sesi=berakhir', { replace: true });
    });
  }, [navigate]);

  const mulaiSesi = useCallback(({ token, user: u }) => {
    simpanToken(token);
    setUser(u);
    return u;
  }, []);

  const masuk = useCallback(async (email, password) =>
    mulaiSesi(await api('/auth/login', { method: 'POST', body: { email, password }, tanpaToken: true })), [mulaiSesi]);

  const daftar = useCallback(async (data) =>
    mulaiSesi(await api('/auth/register', { method: 'POST', body: data, tanpaToken: true })), [mulaiSesi]);

  const keluar = useCallback(() => {
    simpanToken(null);
    setUser(null);
    navigate('/');
  }, [navigate]);

  const nilai = useMemo(() => ({ user, siap, masuk, daftar, keluar, perbarui: setUser }), [user, siap, masuk, daftar, keluar]);
  return <AuthContext.Provider value={nilai}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
