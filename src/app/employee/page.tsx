// main portal page for employees
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Meja {
  noMeja: number;
  status: string;
}

interface Pesanan {
  noNota: string;
  statusPesanan: string;
  statusTagihan: string;
}

export default function EmployeePortalPage() {
  const [totalMeja, setTotalMeja] = useState<number>(0);
  const [mejaTerisi, setMejaTerisi] = useState<number>(0);
  const [pesananAktif, setPesananAktif] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // fetch quick dashboard statistics from api
  useEffect(() => {
    async function fetchStats() {
      try {
        const resMeja = await fetch('/api/meja');
        const dataMeja = await resMeja.json();
        if (dataMeja.sukses) {
          const listMeja: Meja[] = dataMeja.data;
          setTotalMeja(listMeja.length);
          setMejaTerisi(listMeja.filter((m) => m.status === 'OCCUPIED').length);
        }

        const resPesanan = await fetch('/api/pesanan');
        const dataPesanan = await resPesanan.json();
        if (dataPesanan.sukses) {
          const listPesanan: Pesanan[] = dataPesanan.data;
          setPesananAktif(
            listPesanan.filter(
              (p) => p.statusPesanan !== 'SELESAI' || p.statusTagihan === 'UNPAID'
            ).length
          );
        }
      } catch (err) {
        console.error('failed to fetch portal statistics:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
      {/* header title section */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Selamat Datang di Portal Operasional</h2>
        <p className="text-sm text-slate-400 mt-1">
          Pilih modul kerja sesuai dengan peran pekerjaan Anda untuk mulai bertugas.
        </p>
      </div>

      {/* summary stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Meja</p>
          <p className="text-3xl font-extrabold text-amber-500 mt-2">{loading ? '...' : totalMeja}</p>
          <p className="text-xs text-slate-500 mt-1">Kapasitas meja yang terdaftar</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Meja Terisi (Occupied)</p>
          <p className="text-3xl font-extrabold text-rose-500 mt-2">{loading ? '...' : mejaTerisi}</p>
          <p className="text-xs text-slate-500 mt-1">Meja yang saat ini digunakan</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pesanan Aktif</p>
          <p className="text-3xl font-extrabold text-emerald-500 mt-2">{loading ? '...' : pesananAktif}</p>
          <p className="text-xs text-slate-500 mt-1">Pesanan sedang dimasak / belum bayar</p>
        </div>
      </div>

      {/* module selection grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* waiter module card */}
        <Link
          href="/employee/pelayan"
          className="group bg-slate-900 border border-slate-800 hover:border-amber-500/50 p-6 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/10 flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-lg flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
              🪑
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-amber-500 transition-colors">
              Modul Pelayan
            </h3>
            <p className="text-sm text-slate-400 mt-2">
              Kelola status keterisian meja restoran dan buat pesanan baru langsung untuk pelanggan.
            </p>
          </div>
          <div className="mt-6 flex items-center text-xs font-semibold text-amber-500">
            <span>Buka Modul Pelayan</span>
            <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </Link>

        {/* chef module card */}
        <Link
          href="/employee/koki"
          className="group bg-slate-900 border border-slate-800 hover:border-emerald-500/50 p-6 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/10 flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-lg flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
              👨‍🍳
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-emerald-500 transition-colors">
              Layar Dapur (Koki)
            </h3>
            <p className="text-sm text-slate-400 mt-2">
              Pantau antrean pesanan yang masuk secara real-time dan perbarui status hidangan jika sudah selesai.
            </p>
          </div>
          <div className="mt-6 flex items-center text-xs font-semibold text-emerald-500">
            <span>Buka Layar Dapur</span>
            <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </Link>

        {/* cashier module card */}
        <Link
          href="/employee/kasir"
          className="group bg-slate-900 border border-slate-800 hover:border-blue-500/50 p-6 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/10 flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 text-blue-500 rounded-lg flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
              💳
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-blue-500 transition-colors">
              Modul Kasir
            </h3>
            <p className="text-sm text-slate-400 mt-2">
              Proses validasi pembayaran tagihan pelanggan, cetak nota, dan otomatis selesaikan status meja.
            </p>
          </div>
          <div className="mt-6 flex items-center text-xs font-semibold text-blue-500">
            <span>Buka Modul Kasir</span>
            <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
