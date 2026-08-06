// employee login page strictly matching the dark blue figma design
'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function EmployeeLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState<string>('');
  const [pin, setPin] = useState<string>('');
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
        body: JSON.stringify({ username, pin }),
      });

      const result = await response.json();

      if (result.sukses) {
        const role = result.data.jabatan;
        // auto redirect based on database role
        if (role === 'PELAYAN') router.push('/employee/pelayan');
        else if (role === 'KOKI') router.push('/employee/koki');
        else if (role === 'KASIR') router.push('/employee/kasir');
        else if (role === 'PEMILIK') router.push('/employee');
        else router.push('/employee');
      } else {
        setPesanError(result.pesan || 'failed to login to the system.');
      }
    } catch (err) {
      setPesanError('system connection error occurred.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-screen h-screen bg-[#2B4B77] flex items-center justify-center p-4 relative">
      <div className="flex flex-col items-center space-y-10 z-10 w-full max-w-[500px]">
        
        {/* golden logo */}
        <div className="drop-shadow-2xl">
          <Image
            src="/logo_emas.png"
            alt="RestoLink Logo"
            width={160}
            height={160}
            className="object-contain"
            priority
          />
        </div>

        {/* login box matching figma */}
        <div className="bg-[#00215e] w-full px-12 py-14 rounded-2xl shadow-2xl flex flex-col items-center space-y-6">
          {pesanError && (
            <div className="w-full p-3 bg-red-500/20 border border-red-500/50 text-red-200 text-sm rounded-lg text-center font-bold">
              {pesanError}
            </div>
          )}

          <form onSubmit={handleLogin} className="w-full space-y-8 flex flex-col items-center">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full bg-[#d9d9d9] text-black px-6 py-4 rounded-lg text-xl font-bold placeholder-gray-600 focus:outline-none focus:ring-4 focus:ring-amber-500/50 shadow-inner"
            />

            <input
              type="password"
              placeholder="Password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              required
              className="w-full bg-[#d9d9d9] text-black px-6 py-4 rounded-lg text-xl font-bold placeholder-gray-600 focus:outline-none focus:ring-4 focus:ring-amber-500/50 shadow-inner"
            />

            <button
              type="submit"
              disabled={loading}
              className="bg-[#d9d9d9] hover:bg-white text-black px-14 py-3 rounded-xl text-2xl font-extrabold shadow-[0_4px_15px_rgba(0,0,0,0.5)] transition-all disabled:opacity-50 mt-4 tracking-widest"
            >
              {loading ? 'WAIT...' : 'LOGIN'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
