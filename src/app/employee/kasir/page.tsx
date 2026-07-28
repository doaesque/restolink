// cashier module interface for processing billing and receipt validation
'use client';

import { useEffect, useState } from 'react';

interface DetailPesanan {
  idDetail: string;
  jumlahPesanan: number;
  subtotal: number;
  menu: {
    namaMenu: string;
    harga: number;
  };
}

interface Pesanan {
  noNota: string;
  tglPesanan: string;
  noMeja: number;
  statusTagihan: 'UNPAID' | 'PAID';
  statusPesanan: string;
  pelanggan: {
    namaPelanggan: string;
  };
  detailPesanan: DetailPesanan[];
}

export default function KasirPage() {
  const [listPesanan, setListPesanan] = useState<Pesanan[]>([]);
  const [selectedPesanan, setSelectedPesanan] = useState<Pesanan | null>(null);
  const [metodePembayaran, setMetodePembayaran] = useState<string>('TUNAI');
  const [loading, setLoading] = useState<boolean>(true);

  // fetch active orders for billing
  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    setLoading(true);
    try {
      const res = await fetch('/api/pesanan');
      const data = await res.json();
      if (data.sukses) {
        setListPesanan(data.data);
      }
    } catch (err) {
      console.error('failed to fetch billing orders:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-slate-400">Memuat modul kasir...</div>;
  }

  // filter orders with unpaid status
  const pesananUnpaid = listPesanan.filter((p) => p.statusTagihan === 'UNPAID');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Modul Kasir & Pembayaran</h2>
        <p className="text-sm text-slate-400">Validasi pembayaran pelanggan dan proses cetak kwitansi nota.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* unpaid order list */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
            Daftar Tagihan Belum Dibayar (Unpaid)
          </h3>

          {pesananUnpaid.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-6 text-center">
              Tidak ada tagihan yang belum dibayar.
            </p>
          ) : (
            <div className="space-y-3">
              {pesananUnpaid.map((pesanan) => {
                const totalBayar = pesanan.detailPesanan.reduce(
                  (acc, item) => acc + item.subtotal,
                  0
                );

                return (
                  <div
                    key={pesanan.noNota}
                    onClick={() => setSelectedPesanan(pesanan)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      selectedPesanan?.noNota === pesanan.noNota
                        ? 'bg-blue-500/10 border-blue-500 text-blue-300'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-amber-500">
                          Meja {pesanan.noMeja}
                        </span>
                        <span className="text-xs text-slate-500">•</span>
                        <span className="text-xs font-semibold text-white">
                          {pesanan.pelanggan.namaPelanggan}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">Nota ID: {pesanan.noNota}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-400">
                        Rp {totalBayar.toLocaleString('id-ID')}
                      </p>
                      <span className="text-[10px] px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full font-semibold">
                        UNPAID
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* payment settlement view */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
            Rincian Pembayaran
          </h3>

          {!selectedPesanan ? (
            <p className="text-xs text-slate-500 italic py-6 text-center">
              Pilih tagihan dari daftar di samping untuk diproses.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs space-y-1">
                <p className="text-slate-400">
                  Pelanggan: <span className="text-white font-semibold">{selectedPesanan.pelanggan.namaPelanggan}</span>
                </p>
                <p className="text-slate-400">
                  Meja: <span className="text-amber-500 font-semibold">{selectedPesanan.noMeja}</span>
                </p>
              </div>

              {/* itemized breakdown */}
              <div className="space-y-2 border-t border-slate-800 pt-3">
                <p className="text-xs font-semibold text-slate-400">Rincian Item:</p>
                {selectedPesanan.detailPesanan.map((item) => (
                  <div key={item.idDetail} className="flex justify-between text-xs text-slate-300">
                    <span>
                      {item.menu.namaMenu} (x{item.jumlahPesanan})
                    </span>
                    <span>Rp {item.subtotal.toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>

              {/* payment method selection */}
              <div className="border-t border-slate-800 pt-3 space-y-2">
                <label className="block text-xs text-slate-400">Metode Pembayaran</label>
                <select
                  value={metodePembayaran}
                  onChange={(e) => setMetodePembayaran(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="TUNAI">Tunai / Cash</option>
                  <option value="QRIS">QRIS</option>
                  <option value="DEBIT">Kartu Debit</option>
                </select>
              </div>

              {/* total amount */}
              <div className="border-t border-slate-800 pt-3 flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-400">Total Tagihan:</span>
                <span className="text-lg font-bold text-emerald-400">
                  Rp{' '}
                  {selectedPesanan.detailPesanan
                    .reduce((acc, item) => acc + item.subtotal, 0)
                    .toLocaleString('id-ID')}
                </span>
              </div>

              {/* process button */}
              <button
                onClick={() => console.log('process payment for:', selectedPesanan.noNota)}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-sm transition-colors"
              >
                Konfirmasi Pembayaran Lunas
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
