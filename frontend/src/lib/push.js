// Pembantu Web Push di sisi browser. Semua fungsi aman dipanggil di browser yang tidak mendukung.
import { api } from './api.js';

export const didukung = () =>
  typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

export const mandiri = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;

// iPhone/iPad: push hanya jalan bila situs dipasang ke layar utama.
export const perangkatApple = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

// Kunci VAPID base64url → Uint8Array, sesuai syarat PushManager.subscribe.
export const kunciKeBiner = (b64) => {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const mentah = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(mentah, (c) => c.charCodeAt(0));
};

const daftarkan = async () => {
  await navigator.serviceWorker.register('/sw.js');
  return navigator.serviceWorker.ready;
};

export async function langgananSaatIni() {
  if (!didukung()) return null;
  const reg = await navigator.serviceWorker.getRegistration();
  return reg ? reg.pushManager.getSubscription() : null;
}

// Minta izin, berlangganan ke layanan push browser, lalu simpan di server.
export async function aktifkanPush(kunci) {
  const izin = await Notification.requestPermission();
  if (izin !== 'granted') throw new Error('Izin notifikasi tidak diberikan. Ubah lewat pengaturan situs di browser Anda.');
  const reg = await daftarkan();
  let sub = await reg.pushManager.getSubscription();
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: kunciKeBiner(kunci) });
  const json = sub.toJSON();
  await api('/push/subscribe', { method: 'POST', body: { endpoint: json.endpoint, keys: json.keys } });
  return sub;
}

// Lepas langganan di server lalu di browser. `tanpaServer` untuk kasus token sudah tidak berlaku.
export async function nonaktifkanPush() {
  const sub = await langgananSaatIni();
  if (!sub) return;
  await api('/push/unsubscribe', { method: 'POST', body: { endpoint: sub.endpoint } }).catch(() => {});
  await sub.unsubscribe().catch(() => {});
}
