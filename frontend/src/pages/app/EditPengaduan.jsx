import { useParams } from 'react-router-dom';
import Tombol from '../../components/ui/Tombol.jsx';
import { Memuat, Galat, Pesan } from '../../components/ui/Status.jsx';
import FormPengaduan from './FormPengaduan.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { useJudul } from '../../hooks/useMisc.js';
import { api } from '../../lib/api.js';
import { IkonKiri } from '../../lib/icons.js';

export default function EditPengaduan() {
  const { kode } = useParams();
  useJudul(`Edit ${kode}`);
  const { user } = useAuth();
  const { data: c, loading, error, reload } = useFetch(() => api(`/complaints/${encodeURIComponent(kode)}`), [kode]);

  if (loading && !c) return <Memuat />;
  if (error) return <Galat pesan={error} ulangi={reload} />;
  if (!c) return null;

  const boleh = user.role === 'admin' || c.user_id === user.id;
  if (!boleh) {
    return (
      <div className="mx-auto max-w-lg">
        <Pesan jenis="galat">Anda tidak diizinkan mengedit pengaduan ini.</Pesan>
        <Tombol ke={`/app/pengaduan/${kode}`} varian="garis" className="mt-4" ikon={IkonKiri}>Kembali ke detail</Tombol>
      </div>
    );
  }

  return <FormPengaduan key={c.id} mode="edit" awal={c} kode={kode} />;
}
