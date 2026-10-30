// Klien API tunggal. Semua halaman memanggil api(...) dan menangkap Error.message untuk ditampilkan.

const KUNCI_TOKEN = 'token';

export const ambilToken = () => {
  try { return localStorage.getItem(KUNCI_TOKEN); } catch { return null; }
};
export const simpanToken = (t) => {
  try { t ? localStorage.setItem(KUNCI_TOKEN, t) : localStorage.removeItem(KUNCI_TOKEN); } catch { /* penyimpanan diblokir */ }
};

// Dipanggil ketika server menjawab 401 saat sudah memakai token (sesi habis / akun dinonaktifkan).
let saatSesiBerakhir = () => {};
export const aturSaatSesiBerakhir = (fn) => { saatSesiBerakhir = fn; };

// Ubah objek filter menjadi query string, membuang nilai kosong.
export const qs = (obj = {}) => {
  const p = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') p.set(k, v); });
  const s = p.toString();
  return s ? `?${s}` : '';
};

const kirim = async (path, { method = 'GET', body, tanpaToken } = {}) => {
  const headers = {};
  const token = tanpaToken ? null : ambilToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(`/api${path}`, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  } catch {
    throw new Error('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
  }
  if (res.status === 401 && token) saatSesiBerakhir();
  return res;
};

// Panggilan JSON biasa.
export async function api(path, opsi) {
  const res = await kirim(path, opsi);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Terjadi kesalahan pada server');
  return data;
}

// Unduh berkas (mis. CSV) dengan token, lalu picu penyimpanan di browser.
export async function unduh(path, namaBerkas) {
  const res = await kirim(path);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Gagal mengunduh berkas');
  }
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement('a');
  a.href = url;
  a.download = namaBerkas;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
