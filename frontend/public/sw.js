// Service worker: hanya menangani notifikasi push. Tidak menyimpan cache apa pun,
// jadi aplikasi selalu memuat versi terbaru.

const URL_AWAL = '/app/notifikasi';

// Hanya alamat di situs ini yang boleh dibuka dari notifikasi.
const alamatAman = (url) => {
  try {
    const u = new URL(url || URL_AWAL, self.location.origin);
    return u.origin === self.location.origin ? u.href : new URL(URL_AWAL, self.location.origin).href;
  } catch {
    return new URL(URL_AWAL, self.location.origin).href;
  }
};

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch { d = { isi: event.data ? event.data.text() : '' }; }
  event.waitUntil(self.registration.showNotification(d.judul || 'Lapor Pak Klebun', {
    body: d.isi || '',
    icon: '/icon-192.png',
    badge: '/favicon-32.png',
    tag: d.tag || undefined,
    data: { url: alamatAman(d.url) },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = alamatAman(event.notification.data && event.notification.data.url);
  event.waitUntil((async () => {
    const jendela = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const j of jendela) {
      if (new URL(j.url).origin === self.location.origin && 'focus' in j) {
        await j.focus();
        if ('navigate' in j) { try { await j.navigate(url); } catch { /* abaikan */ } }
        return undefined;
      }
    }
    return self.clients.openWindow(url);
  })());
});
