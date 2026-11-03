import { useDesa } from '../../context/DesaContext.jsx';
import { tgl, tglPendek } from '../../lib/format.js';

// Bukti pengaduan yang tampil di layar dan dipakai saat mencetak / menyimpan PDF.
// Foto pengaduan dan blok tanda tangan kepala desa + sekretaris desa ikut dicetak.
export default function BuktiPengaduan({ c }) {
  const { desa, kontak } = useDesa();
  const ttd = c.ttd || {};
  const kades = ttd.kades || {};
  const sekdes = ttd.sekdes || {};

  const rincian = [
    ['Kode pengaduan', c.kode],
    ['Judul', c.judul],
    ['Kategori', c.kategori],
    ['Dusun', c.dusun],
    ['Lokasi', c.lokasi],
    ['Urgensi', c.urgensi],
    ['Status', c.status],
    ['Pelapor', c.pelapor],
    ['Perkiraan', c.perkiraan],
    ['Dilaporkan', tgl(c.created_at)],
  ];
  if (c.instansi) rincian.push(['Diteruskan ke', c.instansi]);

  return (
    <article className="card bukti-pengaduan p-6 sm:p-8">
      <header className="border-b-2 border-slate-800 pb-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Pemerintah {desa || 'Desa'}</p>
        <h1 className="mt-1 text-xl font-extrabold uppercase tracking-wide">Bukti Pengaduan Warga</h1>
        {kontak?.alamat && <p className="mt-1 text-xs text-muted">{kontak.alamat}</p>}
        {kontak?.telepon && <p className="text-xs text-muted">Telp. {kontak.telepon}</p>}
      </header>

      <table className="bukti-tabel mt-5 w-full text-sm">
        <tbody>
          {rincian.map(([label, nilai]) => (
            <tr key={label} className="border-b border-line">
              <th className="w-40 py-1.5 pr-3 text-left align-top font-semibold">{label}</th>
              <td className="py-1.5 align-top">{nilai || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {c.deskripsi && (
        <section className="mt-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Uraian</h2>
          <p className="mt-1 whitespace-pre-line text-sm leading-relaxed">{c.deskripsi}</p>
        </section>
      )}

      {c.foto && (
        <figure className="mt-5 break-inside-avoid">
          <img src={c.foto} alt={`Foto ${c.judul}`} className="bukti-foto mx-auto block max-h-80 w-auto max-w-full rounded-lg border border-line object-contain" />
          <figcaption className="mt-1 text-center text-xs text-muted">Foto pengaduan</figcaption>
        </figure>
      )}

      <div className="bukti-ttd mt-8 grid grid-cols-2 gap-8 break-inside-avoid text-center text-sm">
        <div>
          <p>{desa ? `${desa}, ` : ''}{tglPendek(c.created_at)}</p>
          <p className="mt-1 font-semibold">Kepala Desa</p>
          <div className="bukti-ruang-ttd flex h-24 items-center justify-center">
            {kades.gambar && <img src={kades.gambar} alt="Tanda tangan Kepala Desa" className="max-h-20 max-w-52 object-contain" />}
          </div>
          <p className="font-semibold underline decoration-1 underline-offset-4">{kades.nama || '................................'}</p>
        </div>
        <div>
          <p>&nbsp;</p>
          <p className="mt-1 font-semibold">Sekretaris Desa</p>
          <div className="bukti-ruang-ttd flex h-24 items-center justify-center">
            {sekdes.gambar && <img src={sekdes.gambar} alt="Tanda tangan Sekretaris Desa" className="max-h-20 max-w-52 object-contain" />}
          </div>
          <p className="font-semibold underline decoration-1 underline-offset-4">{sekdes.nama || '................................'}</p>
        </div>
      </div>

      <p className="mt-6 text-xs text-muted">
        Dicetak pada {tgl(new Date().toISOString())}. Simpan bukti ini dan bawa kodenya saat menghubungi kantor desa.
      </p>
    </article>
  );
}
