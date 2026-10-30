import { Link } from 'react-router-dom';
import { LencanaStatus, LencanaUrgensi } from '../ui/Lencana.jsx';
import { KATEGORI_INFO } from '../../lib/constants.js';
import { IkonLokasi } from '../../lib/icons.js';
import { tglPendek } from '../../lib/format.js';

// Satu data, dua tampilan: tabel di layar md ke atas, kartu bertumpuk di HP.
// `buatLink(item)` menentukan alamat tujuan; `tampilPelapor` untuk area login.
export default function DaftarPengaduan({ data, buatLink, tampilPelapor = false }) {
  return (
    <>
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
              <th scope="col" className="px-4 py-3 font-semibold">Pengaduan</th>
              <th scope="col" className="px-4 py-3 font-semibold">Dusun</th>
              {tampilPelapor && <th scope="col" className="px-4 py-3 font-semibold">Pelapor</th>}
              <th scope="col" className="px-4 py-3 font-semibold">Status</th>
              <th scope="col" className="px-4 py-3 font-semibold">Tanggal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {data.map((c) => {
              const Ikon = KATEGORI_INFO[c.kategori]?.ikon;
              return (
                <tr key={c.kode} className="transition-colors hover:bg-surface2">
                  <td className="max-w-xs px-4 py-3.5">
                    <Link to={buatLink(c)} className="group flex items-start gap-3">
                      <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">{Ikon && <Ikon aria-hidden />}</span>
                      <span className="min-w-0">
                        <span className="block truncate font-semibold group-hover:text-brand">{c.judul}</span>
                        <span className="block text-xs text-muted">{c.kode} · {c.kategori}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3.5 text-muted">{c.dusun}</td>
                  {tampilPelapor && <td className="px-4 py-3.5 text-muted">{c.pelapor}</td>}
                  <td className="px-4 py-3.5"><div className="flex flex-wrap gap-1.5"><LencanaStatus status={c.status} />{c.urgensi === 'Tinggi' && <LencanaUrgensi urgensi={c.urgensi} />}</div></td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-muted">{tglPendek(c.created_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-line lg:hidden">
        {data.map((c) => {
          const Ikon = KATEGORI_INFO[c.kategori]?.ikon;
          return (
            <li key={c.kode}>
              <Link to={buatLink(c)} className="flex gap-3 px-4 py-4 hover:bg-surface2">
                <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">{Ikon && <Ikon aria-hidden />}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold leading-snug">{c.judul}</span>
                  <span className="mt-0.5 block text-xs text-muted">{c.kode} · {tglPendek(c.created_at)}</span>
                  <span className="mt-2 flex flex-wrap items-center gap-1.5">
                    <LencanaStatus status={c.status} />
                    {c.urgensi === 'Tinggi' && <LencanaUrgensi urgensi={c.urgensi} />}
                  </span>
                  <span className="mt-2 flex items-center gap-1 text-xs text-muted"><IkonLokasi className="size-3.5" aria-hidden />{c.dusun}{tampilPelapor && c.pelapor ? ` · ${c.pelapor}` : ''}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
