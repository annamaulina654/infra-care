// Membuat sepasang kunci VAPID untuk notifikasi push. Jalankan: npm run vapid
const webpush = require('web-push');
const k = webpush.generateVAPIDKeys();
console.log('Tempel tiga baris ini di backend/.env dan di Environment Variables Vercel:\n');
console.log(`VAPID_PUBLIC_KEY=${k.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${k.privateKey}`);
console.log('VAPID_SUBJECT=mailto:emailanda@contoh.id');
console.log('\nKunci privat bersifat rahasia: jangan di-commit. Ganti kunci = semua langganan lama harus mendaftar ulang.');
