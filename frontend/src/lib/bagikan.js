// Pembantu berbagi dan mencetak bukti pengaduan. Semuanya berjalan di browser,
// tanpa perlu pustaka tambahan.

// Menyalin teks. Dipakai "Salin kode" dan sebagai cadangan bila Web Share tidak tersedia.
export async function salinTeks(teks) {
  try {
    await navigator.clipboard.writeText(teks);
    return true;
  } catch {
    // Clipboard API bisa ditolak (mis. halaman non-HTTPS), jadi pakai cara lama.
    try {
      const area = document.createElement('textarea');
      area.value = teks;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand('copy');
      area.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

// Membagikan tautan pelacakan. Di perangkat yang mendukung (HP) akan membuka menu berbagi;
// bila tidak, tautan disalin ke clipboard.
export async function bagikanPengaduan(kode) {
  const url = `${window.location.origin}/lacak/${encodeURIComponent(kode)}`;
  const data = { title: `Pengaduan ${kode}`, text: `Lacak pengaduan ${kode} di ${url}`, url };
  if (navigator.share) {
    try {
      await navigator.share(data);
      return 'dibagikan';
    } catch (e) {
      if (e?.name === 'AbortError') return 'batal';
    }
  }
  return (await salinTeks(url)) ? 'disalin' : 'gagal';
}

// Bukti/tanda terima dicetak memakai dialog cetak browser (bisa disimpan sebagai PDF).
export const cetakBukti = () => window.print();
