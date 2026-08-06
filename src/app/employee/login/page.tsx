// employee login page with beautiful custom color palette
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
    <div className="w-screen h-screen bg-[#00215e] flex items-center justify-center relative overflow-hidden font-sans">
      {/* decorative background shapes using the palette */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#2c4e80] rounded-full mix-blend-screen filter blur-[80px] opacity-60 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#fc4100] rounded-full mix-blend-screen filter blur-[100px] opacity-40 animate-pulse delay-1000"></div>

      <div className="flex flex-col items-center space-y-8 z-10 w-full max-w-[450px]">
        {/* logo and title */}
        <div className="flex flex-col items-center">
          <div className="bg-[#ffc55a] p-4 rounded-3xl shadow-[0_0_40px_rgba(255,197,90,0.4)] mb-6 transform hover:scale-105 transition-transform duration-300">
            <Image
              src="/logo.png"
              alt="RestoLink Logo"
              width={100}
              height={100}
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-5xl font-extrabold text-white tracking-widest drop-shadow-lg">
            RESTO<span className="text-[#ffc55a]">LINK</span>
          </h1>
          <p className="text-[#2c4e80] text-lg font-bold tracking-widest mt-2 uppercase bg-white px-4 py-1 rounded-full shadow-md">
            Staff Portal
          </p>
        </div>

        {/* modern login card */}
        <div className="bg-[#2c4e80]/80 backdrop-blur-xl border border-[#ffc55a]/30 w-full px-10 py-12 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col items-center space-y-6">
          {pesanError && (
            <div className="w-full p-4 bg-[#fc4100]/20 border border-[#fc4100] text-[#ffc55a] text-sm rounded-xl text-center font-bold tracking-wide">
              ⚠ {pesanError}
            </div>
          )}

          <form onSubmit={handleLogin} className="w-full space-y-6 flex flex-col items-center">
            <div className="w-full relative group">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[#2c4e80] text-xl transition-colors group-focus-within:text-[#fc4100]">👤</span>
              <input
                type="text"
                placeholder="Employee ID"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-white text-[#00215e] pl-14 pr-6 py-4 rounded-2xl text-lg font-bold placeholder-[#2c4e80]/50 focus:outline-none focus:ring-4 focus:ring-[#fc4100]/50 shadow-inner transition-all"
              />
            </div>

            <div className="w-full relative group">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[#2c4e80] text-xl transition-colors group-focus-within:text-[#fc4100]">🔒</span>
              <input
                type="password"
                placeholder="Secret PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                required
                className="w-full bg-white text-[#00215e] pl-14 pr-6 py-4 rounded-2xl text-lg font-bold placeholder-[#2c4e80]/50 focus:outline-none focus:ring-4 focus:ring-[#fc4100]/50 shadow-inner transition-all tracking-[0.3em]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#fc4100] to-[#e63a00] hover:from-[#ffc55a] hover:to-[#f5b338] text-white hover:text-[#00215e] px-8 py-4 rounded-2xl text-2xl font-extrabold shadow-[0_10px_30px_rgba(252,65,0,0.4)] transition-all duration-300 disabled:opacity-50 mt-6 tracking-widest hover:scale-[1.02] uppercase"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
