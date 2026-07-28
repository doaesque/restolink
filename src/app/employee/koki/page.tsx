// kitchen display system interface for chefs
'use client';

import { useEffect, useState } from 'react';

interface DetailPesanan {
  idDetail: string;
  jumlahPesanan: number;
  menu: {
    namaMenu: string;
  };
}

interface Pesanan {
  noNota: string;
  tglPesanan: string;
  noMeja: number;
  statusPesanan: 'MENUNGGU' | 'DIPROSES' | 'SELESAI';
  pelanggan: {
    namaPelanggan: string;
  };
  detailPesanan: DetailPesanan[];
}

interface BahanBaku {
  id: string;
  namaBahan: string;
  statusBahan: string;
}

export default function KokiPage() {
  const [listPesanan, setListPesanan] = useState<Pesanan[]>([]);
  const [listBahan, setListBahan] = useState<BahanBaku[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingBahanId, setUpdatingBahanId] = useState<string | null>(null);
  const [updatingNotaId, setUpdatingNotaId] = useState<string | null>(null);

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 10000);
    return () => clearInterval(interval);
  }, []);

  async function fetchAllData() {
    try {
      const [resPesanan, resBahan] = await Promise.all([
        fetch('/api/pesanan'),
        fetch('/api/bahan-baku'),
      ]);

      const dataPesanan = await resPesanan.json();
      const dataBahan = await resBahan.json();

      if (dataPesanan.sukses) setListPesanan(dataPesanan.data);
      if (dataBahan.sukses) setListBahan(dataBahan.data);
    } catch (err) {
      console.error('failed to fetch chef kitchen data:', err);
    } finally {
      setLoading(false);
    }
  }

  // update order status to completed
  async function handleMarkOrderComplete(noNota: string) {
    setUpdatingNotaId(noNota);
    try {
      const res = await fetch('/api/pesanan', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noNota, statusPesanan: 'SELESAI' }),
      });

      const data = await res.json();
      if (data.sukses) {
        fetchAllData();
      }
    } catch (err) {
      console.error('failed to mark order as completed:', err);
    } finally {
      setUpdatingNotaId(null);
    }
  }

  // toggle raw material availability status
  async function handleToggleBahanStatus(id: string, currentStatus: string) {
    const nextStatus = currentStatus === 'tersedia' ? 'habis' : 'tersedia';
    setUpdatingBahanId(id);

    try {
      const res = await fetch('/api/bahan-baku', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, statusBahan: nextStatus }),
      });

      const data = await res.json();
      if (data.sukses) {
        setListBahan((prev) =>
          prev.map((b) => (b.id === id ? { ...b, statusBahan: nextStatus } : b))
        );
      }
    } catch (err) {
      console.error('failed to update raw material status:', err);
    } finally {
      setUpdatingBahanId(null);
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-slate-500">Memuat layar dapur...</div>;
  }

  const pesananDapur = listPesanan.filter((p) => p.statusPesanan !== 'SELESAI');

  return (
    <div className="space-y-8 text-slate-800">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-resto-navy">Layar Dapur & Kontrol Stok Bahan</h2>
          <p className="text-sm text-slate-500">Pantau antrean pesanan masuk dan kelola status ketersediaan bahan baku dapur.</p>
        </div>
        <button
          onClick={fetchAllData}
          className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold shadow-sm"
        >
          🔄 Refresh Antrean
        </button>
      </div>

      {/* kitchen active order queue section */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
          Antrean Pesanan Makanan Active
        </h3>

        {pesananDapur.length === 0 ? (
          <div className="bg-white border border-slate-200 p-10 text-center rounded-xl space-y-2 shadow-sm">
            <p className="text-3xl">👨‍🍳✨</p>
            <p className="text-slate-800 font-bold">Tidak ada antrean pesanan!</p>
            <p className="text-xs text-slate-500">Semua pesanan makanan telah selesai dimasak.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pesananDapur.map((pesanan) => (
              <div
                key={pesanan.noNota}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between"
              >
                {/* order header */}
                <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
                  <div>
                    <span className="text-xs text-resto-orange font-bold uppercase tracking-wider">
                      Meja {pesanan.noMeja}
                    </span>
                    <h3 className="text-base font-extrabold text-slate-800">
                      {pesanan.pelanggan.namaPelanggan}
                    </h3>
                  </div>
                  <span className="text-[10px] px-2.5 py-1 bg-amber-100 border border-amber-300 text-amber-800 rounded-full font-bold uppercase">
                    {pesanan.statusPesanan}
                  </span>
                </div>

                {/* order items */}
                <div className="p-4 space-y-2 flex-1">
                  <p className="text-xs font-bold text-slate-500 mb-2">Daftar Menu Dipesan:</p>
                  {pesanan.detailPesanan.map((item) => (
                    <div
                      key={item.idDetail}
                      className="flex justify-between items-center text-sm py-1.5 border-b border-slate-100"
                    >
                      <span className="text-slate-700 font-semibold">{item.menu.namaMenu}</span>
                      <span className="text-resto-navy font-extrabold px-2 py-0.5 bg-slate-100 rounded border border-slate-200">
                        x{item.jumlahPesanan}
                      </span>
                    </div>
                  ))}
                </div>

                {/* completion button */}
                <div className="p-4 bg-slate-50 border-t border-slate-200">
                  <button
                    onClick={() => handleMarkOrderComplete(pesanan.noNota)}
                    disabled={updatingNotaId === pesanan.noNota}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-colors shadow-sm disabled:opacity-50"
                  >
                    {updatingNotaId === pesanan.noNota ? 'Memproses...' : 'Selesai Dimasak'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* raw materials stock management section */}
      <div className="bg-white border border-slate-200 p-6 rounded-xl space-y-4 shadow-sm">
        <div>
          <h3 className="text-base font-bold text-resto-navy">Manajemen Ketersediaan Bahan Baku</h3>
          <p className="text-xs text-slate-500">Perbarui status bahan baku dapur. Pelayan tidak dapat memproses pesanan jika bahan baku bernilai 'Habis'.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {listBahan.map((bahan) => {
            const isTersedia = bahan.statusBahan === 'tersedia';

            return (
              <div
                key={bahan.id}
                className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-slate-800">{bahan.namaBahan}</p>
                  <span
                    className={`text-[10px] font-bold uppercase ${
                      isTersedia ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    • {bahan.statusBahan}
                  </span>
                </div>

                <button
                  onClick={() => handleToggleBahanStatus(bahan.id, bahan.statusBahan)}
                  disabled={updatingBahanId === bahan.id}
                  className={`px-3 py-1 rounded text-xs font-bold border transition-all ${
                    isTersedia
                      ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  {updatingBahanId === bahan.id ? '...' : isTersedia ? 'Set Habis' : 'Set Tersedia'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
