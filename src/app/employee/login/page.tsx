'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function EmployeeLoginPage() {
  const router = useRouter();
  const [idPegawai, setIdPegawai] = useState<string>('');
  const [pin, setPin] = useState<string>('');
  const [role, setRole] = useState<string>('PELAYAN');
  const [loading, setLoading] = useState<boolean>(false);
  const [pesanError, setPesanError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setPesanError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idPegawai, pin, role }),
      });

      const result = await response.json();

      if (result.sukses) {
        if (role === 'PELAYAN') router.push('/employee/pelayan');
        else if (role === 'KOKI') router.push('/employee/koki');
        else if (role === 'KASIR') router.push('/employee/kasir');
        else if (role === 'PEMILIK') router.push('/employee/pemilik');
        else router.push('/employee');
      } else {
        setPesanError(result.pesan || 'Gagal masuk ke sistem.');
      }
    } catch (err) {
      setPesanError('Terjadi kesalahan koneksi sistem.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans text-slate-800">
      <div className="bg-white border border-slate-200 w-full max-w-md p-8 rounded-2xl shadow-xl space-y-6">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-20 h-20 flex items-center justify-center p-1">
            <Image
              src="/logo.png"
              alt="RestoLink Logo"
              width={80}
              height={80}
              className="object-contain"
              priority
            />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-resto-navy tracking-wide">RestoLink</h1>
            <p className="text-xs text-slate-500 mt-1">Portal Masuk Operasional Karyawan</p>
          </div>
        </div>

        {pesanError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg text-center font-medium">
            {pesanError}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Jabatan / Peran
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 px-3 py-2.5 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-resto-navy"
            >
              <option value="PELAYAN">Pelayan (Area Meja)</option>
              <option value="KOKI">Koki (Layar Dapur & Bahan Baku)</option>
              <option value="KASIR">Kasir (Pembayaran & Nota)</option>
              <option value="PEMILIK">Pemilik Restoran (Dashboard & Laporan)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              ID Karyawan / Pemilik
            </label>
            <input
              type="text"
              placeholder="Contoh: KASIR-001"
              value={idPegawai}
              onChange={(e) => setIdPegawai(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-300 px-3 py-2.5 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-resto-navy"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              PIN Akses
            </label>
            <input
              type="password"
              placeholder="Masukkan PIN Anda"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-300 px-3 py-2.5 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-resto-navy"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-resto-orange hover:opacity-90 text-white font-bold rounded-lg text-sm transition-all shadow-md disabled:opacity-50 mt-2"
          >
            {loading ? 'Memvalidasi...' : 'Masuk ke Portal Karyawan'}
          </button>
        </form>
      </div>
    </div>
  );
}
