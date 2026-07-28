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

export default function KokiPage() {
  const [listPesanan, setListPesanan] = useState<Pesanan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // fetch active kitchen orders
  useEffect(() => {
    fetchOrders();
    // set poll interval every 10 seconds for real-time updates
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  async function fetchOrders() {
    try {
      const res = await fetch('/api/pesanan');
      const data = await res.json();
      if (data.sukses) {
        setListPesanan(data.data);
      }
    } catch (err) {
      console.error('failed to fetch kitchen orders:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-slate-400">Memuat layar dapur...</div>;
  }

  // filter active orders that need cooking
  const pesananDapur = listPesanan.filter((p) => p.statusPesanan !== 'SELESAI');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Layar Dapur (Kitchen Display System)</h2>
          <p className="text-sm text-slate-400">Daftar pesanan masuk yang perlu disiapkan oleh Koki.</p>
        </div>
        <button
          onClick={fetchOrders}
          className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 rounded-lg text-xs font-medium"
        >
          🔄 Refresh Antrean
        </button>
      </div>

      {pesananDapur.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 p-12 text-center rounded-xl space-y-2">
          <p className="text-3xl">👨‍🍳✨</p>
          <p className="text-white font-semibold">Tidak ada antrean pesanan!</p>
          <p className="text-xs text-slate-500">Semua pesanan makanan telah selesai dimasak.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pesananDapur.map((pesanan) => (
            <div
              key={pesanan.noNota}
              className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between"
            >
              {/* order header */}
              <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-xs text-amber-500 font-bold uppercase tracking-wider">
                    Meja {pesanan.noMeja}
                  </span>
                  <h3 className="text-base font-bold text-white">
                    {pesanan.pelanggan.namaPelanggan}
                  </h3>
                </div>
                <span className="text-[10px] px-2 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full font-semibold uppercase">
                  {pesanan.statusPesanan}
                </span>
              </div>

              {/* order items */}
              <div className="p-4 space-y-2 flex-1">
                <p className="text-xs font-semibold text-slate-400 mb-2">Daftar Menu:</p>
                {pesanan.detailPesanan.map((item) => (
                  <div
                    key={item.idDetail}
                    className="flex justify-between items-center text-sm py-1 border-b border-slate-800/50"
                  >
                    <span className="text-slate-200 font-medium">{item.menu.namaMenu}</span>
                    <span className="text-amber-500 font-extrabold px-2 py-0.5 bg-slate-950 rounded">
                      x{item.jumlahPesanan}
                    </span>
                  </div>
                ))}
              </div>

              {/* order status action button */}
              <div className="p-4 bg-slate-950 border-t border-slate-800">
                <button
                  onClick={() => console.log('mark completed:', pesanan.noNota)}
                  className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition-colors"
                >
                  Selesai Dimasak
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
