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

  // enforce numeric input for pin
  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = e.target.value.replace(/\D/g, '');
    setPin(numericValue);
  };

  return (
    <div className="w-screen h-screen bg-[#00215e] flex items-center justify-center relative overflow-hidden font-sans">
      {/* decorative background shapes using the palette */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#2c4e80] rounded-full mix-blend-screen filter blur-[80px] opacity-60 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#fc4100] rounded-full mix-blend-screen filter blur-[100px] opacity-40 animate-pulse delay-1000"></div>

      <div className="flex flex-col items-center z-10 w-full max-w-[380px] px-4">
        
        {/* elegant logo and title representation */}
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/logo_emas.png"
            alt="RestoLink Logo"
            width={120}
            height={120}
            className="object-contain drop-shadow-xl"
            priority
          />
          <h1 className="text-4xl font-extrabold text-white tracking-widest mt-4 drop-shadow-md">
            RESTO<span className="text-[#ffc55a]">LINK</span>
          </h1>
          <p className="bg-[#2c4e80] text-white text-xs font-bold tracking-[0.2em] mt-3 px-5 py-1.5 rounded-full shadow-md uppercase">
            Staff Portal
          </p>
        </div>

        {/* compact and clean login card */}
        <div className="bg-[#2c4e80] w-full p-8 rounded-3xl shadow-2xl flex flex-col items-center border border-[#ffc55a]/10">
          {pesanError && (
            <div className="w-full mb-6 p-3 bg-[#fc4100] text-white text-sm rounded-xl text-center font-bold tracking-wide shadow-md">
              {pesanError}
            </div>
          )}

          <form onSubmit={handleLogin} className="w-full space-y-5 flex flex-col items-center">
            <div className="w-full relative group">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[#2c4e80] text-xl transition-colors group-focus-within:text-[#fc4100]">👤</span>
              <input
                type="text"
                placeholder="Employee ID"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-white text-[#00215e] pl-14 pr-6 py-3.5 rounded-xl text-base font-bold placeholder-[#2c4e80]/60 focus:outline-none focus:ring-4 focus:ring-[#ffc55a] shadow-inner transition-all"
              />
            </div>

            <div className="w-full relative group">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[#2c4e80] text-xl transition-colors group-focus-within:text-[#fc4100]">🔒</span>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="•• •• ••"
                value={pin}
                onChange={handlePinChange}
                required
                className="w-full bg-white text-[#00215e] pl-14 pr-6 py-3.5 rounded-xl text-center text-xl font-bold placeholder-[#2c4e80]/60 focus:outline-none focus:ring-4 focus:ring-[#ffc55a] shadow-inner transition-all tracking-[0.5em]"
              />
            </div>

            <button
              type="submit"
              disabled={loading || pin.length < 4}
              className="w-full bg-[#fc4100] hover:bg-[#ffc55a] text-white hover:text-[#00215e] px-6 py-3.5 rounded-xl text-lg font-extrabold shadow-lg transition-colors duration-200 disabled:opacity-50 mt-4 tracking-widest uppercase"
            >
              {loading ? 'WAIT...' : 'SIGN IN'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
