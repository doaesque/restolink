// employee login page component updated for full english translation
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
        setPesanError(result.pesan || 'Failed to login to the system.');
      }
    } catch (err) {
      setPesanError('System connection error occurred.');
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
            <p className="text-xs text-slate-500 mt-1">Employee Operational Login Portal</p>
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
              Position / Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 px-3 py-2.5 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-resto-navy"
            >
              {/* values remain strictly in indonesian to preserve database enum integrity */}
              <option value="PELAYAN">Waiter (Table Area)</option>
              <option value="KOKI">Chef (Kitchen & Raw Materials)</option>
              <option value="KASIR">Cashier (Payments & Receipts)</option>
              <option value="PEMILIK">Owner (Dashboard & Reports)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Employee / Owner ID
            </label>
            <input
              type="text"
              placeholder="Example: KASIR-001"
              value={idPegawai}
              onChange={(e) => setIdPegawai(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-300 px-3 py-2.5 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-resto-navy"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Access PIN
            </label>
            <input
              type="password"
              placeholder="Enter your PIN"
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
            {loading ? 'Validating...' : 'Login to Employee Portal'}
          </button>
        </form>
      </div>
    </div>
  );
}
