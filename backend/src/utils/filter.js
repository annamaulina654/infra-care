// Perakit klausa WHERE berparameter. Menulis "?" di SQL, nomor $1, $2, ... diisi otomatis,
// jadi nilai dari pengguna tidak pernah disambung langsung ke teks SQL.
const buatFilter = () => {
  const kondisi = [];
  const params = [];
  return {
    params,
    // tambah('c.status = ?', 'Selesai')  |  tambah('(c.dusun = ? or c.user_id = ?)', dusun, id)
    tambah(sql, ...nilai) {
      let i = 0;
      kondisi.push(sql.replace(/\?/g, () => { params.push(nilai[i++]); return `$${params.length}`; }));
      return this;
    },
    where: () => (kondisi.length ? kondisi.join(' and ') : 'true'),
  };
};

// Pola pencarian ilike yang aman: karakter khusus LIKE (% _ \) diperlakukan sebagai teks biasa.
const polaCari = (kata) => `%${String(kata).replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

module.exports = { buatFilter, polaCari };
