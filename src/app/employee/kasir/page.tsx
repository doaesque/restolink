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
  const [processing, setProcessing] = useState<boolean>(false);
  const [pesanNotif, setPesanNotif] = useState<{ tipe: 'sukses' | 'error'; teks: string } | null>(null);

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

  // process payment confirmation
  async function handleConfirmPayment() {
    if (!selectedPesanan) return;

    setProcessing(true);
    setPesanNotif(null);

    const totalBayar = selectedPesanan.detailPesanan.reduce(
      (acc, item) => acc + item.subtotal,
      0
    );

    try {
      const res = await fetch('/api/pembayaran', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noNota: selectedPesanan.noNota,
          totalBayar,
          metodePembayaran,
        }),
      });

      const result = await res.json();

      if (result.sukses) {
        setPesanNotif({
          tipe: 'sukses',
          teks: `Pembayaran Nota ${selectedPesanan.noNota} berhasil dikonfirmasi. Meja ${selectedPesanan.noMeja} telah dikosongkan.`,
        });
        setSelectedPesanan(null);
        fetchOrders();
      } else {
        setPesanNotif({
          tipe: 'error',
          teks: result.pesan || 'Gagal memproses pembayaran.',
        });
      }
    } catch (err) {
      console.error('failed to process cashier payment:', err);
      setPesanNotif({
        tipe: 'error',
        teks: 'Terjadi kesalahan sistem saat memproses pembayaran.',
      });
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-slate-500">Memuat modul kasir...</div>;
  }

  const pesananUnpaid = listPesanan.filter((p) => p.statusTagihan === 'UNPAID');

  return (
    <div className="space-y-6 text-slate-800">
      <div>
        <h2 className="text-2xl font-bold text-resto-navy">Modul Kasir & Pembayaran</h2>
        <p className="text-sm text-slate-500">Validasi pembayaran pelanggan dan proses cetak kwitansi nota.</p>
      </div>

      {pesanNotif && (
        <div
          className={`p-4 rounded-lg text-sm border font-medium ${
            pesanNotif.tipe === 'sukses'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {pesanNotif.teks}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* unpaid order list */}
        <div className="lg:col-span-2 bg-white border border-slate-200 p-5 rounded-xl space-y-4 shadow-sm">
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Daftar Tagihan Belum Dibayar (Unpaid)
          </h3>

          {pesananUnpaid.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-8 text-center">
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
                        ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-resto-orange">
                          Meja {pesanan.noMeja}
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs font-bold text-slate-800">
                          {pesanan.pelanggan.namaPelanggan}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">ID Nota: {pesanan.noNota}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-extrabold text-emerald-700">
                        Rp {totalBayar.toLocaleString('id-ID')}
                      </p>
                      <span className="text-[10px] px-2 py-0.5 bg-rose-100 text-rose-700 border border-rose-200 rounded-full font-bold">
                        UNPAID
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* payment settlement breakdown */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-4 shadow-sm">
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Rincian Pembayaran
          </h3>

          {!selectedPesanan ? (
            <p className="text-xs text-slate-400 italic py-8 text-center">
              Pilih tagihan dari daftar di samping untuk diproses.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                <p className="text-slate-500">
                  Pelanggan: <span className="text-slate-800 font-bold">{selectedPesanan.pelanggan.namaPelanggan}</span>
                </p>
                <p className="text-slate-500">
                  Meja: <span className="text-resto-orange font-bold">{selectedPesanan.noMeja}</span>
                </p>
              </div>

              {/* itemized list */}
              <div className="space-y-2 border-t border-slate-200 pt-3">
                <p className="text-xs font-bold text-slate-600">Rincian Item:</p>
                {selectedPesanan.detailPesanan.map((item) => (
                  <div key={item.idDetail} className="flex justify-between text-xs text-slate-700">
                    <span className="font-medium">
                      {item.menu.namaMenu} (x{item.jumlahPesanan})
                    </span>
                    <span className="font-semibold">Rp {item.subtotal.toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>

              {/* payment method selection */}
              <div className="border-t border-slate-200 pt-3 space-y-2">
                <label className="block text-xs font-semibold text-slate-500">Metode Pembayaran</label>
                <select
                  value={metodePembayaran}
                  onChange={(e) => setMetodePembayaran(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-resto-navy"
                >
                  <option value="TUNAI">Tunai / Cash</option>
                  <option value="QRIS">QRIS</option>
                  <option value="DEBIT">Kartu Debit</option>
                </select>
              </div>

              {/* total calculation */}
              <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500">Total Tagihan:</span>
                <span className="text-lg font-extrabold text-emerald-700">
                  Rp{' '}
                  {selectedPesanan.detailPesanan
                    .reduce((acc, item) => acc + item.subtotal, 0)
                    .toLocaleString('id-ID')}
                </span>
              </div>

              {/* process payment button */}
              <button
                onClick={handleConfirmPayment}
                disabled={processing}
                className="w-full py-2.5 bg-resto-navy hover:opacity-90 text-white font-bold rounded-lg text-sm transition-colors shadow-sm disabled:opacity-50"
              >
                {processing ? 'Memproses Pembayaran...' : 'Konfirmasi Pembayaran Lunas'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}