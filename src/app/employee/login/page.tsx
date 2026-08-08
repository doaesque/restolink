// employee login page with lucide react icons
'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { User, Lock, AlertTriangle } from 'lucide-react';

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
        // map username state to idpegawai as expected by the backend api
        body: JSON.stringify({ idPegawai: username.toUpperCase(), pin }),
      });

      const result = await response.json();

      if (result.sukses || result.data) {
        // save employee data to localstorage with various aliases to support all dashboards
        localStorage.setItem('idPegawai', result.data.id);
        localStorage.setItem('namaPegawai', result.data.namaPegawai);
        localStorage.setItem('employeeRole', result.data.jabatan);
        localStorage.setItem('employeeId', result.data.id);
        localStorage.setItem('employeeName', result.data.namaPegawai);
        localStorage.setItem('pegawai_id', result.data.id);
        localStorage.setItem('pegawai_nama', result.data.namaPegawai);
        localStorage.setItem('pegawai_role', result.data.jabatan);

        const role = result.data.jabatan;
        // auto redirect based on database role
        if (role === 'PELAYAN') router.push('/employee/pelayan');
        else if (role === 'KOKI') router.push('/employee/koki');
        else if (role === 'KASIR') router.push('/employee/kasir');
        else if (role === 'PEMILIK') router.push('/employee/owner');
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

  // enforce numeric input for pin
  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = e.target.value.replace(/\D/g, '');
    setPin(numericValue);
  };

  return (
    <div className="w-screen h-screen bg-gradient-to-br from-[#00215e] to-[#2c4e80] flex items-center justify-center font-sans">
      <div className="flex flex-col items-center w-full max-w-[400px] px-4">

        {/* logo and title representation */}
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/logo_emas.png"
            alt="RestoLink Logo"
            width={110}
            height={110}
            className="object-contain drop-shadow-lg mb-2"
            priority
          />
          <h1 className="text-4xl font-extrabold text-white tracking-wider mt-2 drop-shadow-md">
            RESTO<span className="text-[#ffc55a]">LINK</span>
          </h1>
          <div className="bg-[#2c4e80] text-white text-xs font-bold tracking-widest mt-3 px-6 py-1.5 rounded-full shadow-md uppercase">
            Staff Portal
          </div>
        </div>

        {/* clean login card */}
        <div className="bg-[#2c4e80] w-full p-8 rounded-2xl shadow-2xl flex flex-col items-center border border-[#ffc55a]/10">
          {pesanError && (
            <div className="w-full mb-6 p-3 bg-transparent border border-[#fc4100] text-[#ffc55a] text-sm rounded-lg flex items-center justify-center font-bold tracking-wide">
              <AlertTriangle className="w-5 h-5 mr-2 shrink-0" /> {pesanError}
            </div>
          )}

          <form onSubmit={handleLogin} className="w-full space-y-5 flex flex-col items-center">

            {/* username field */}
            <div className="w-full relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2c4e80]">
                <User className="w-5 h-5" />
              </span>
              <input
                type="text"
                placeholder="Employee ID"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-white text-[#00215e] pl-12 pr-4 py-3.5 rounded-xl text-sm font-bold placeholder-[#2c4e80]/60 focus:outline-none focus:ring-2 focus:ring-[#ffc55a] shadow-inner transition-all"
              />
            </div>

            {/* pin field */}
            <div className="w-full relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#ffc55a]">
                <Lock className="w-5 h-5" />
              </span>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="••••••"
                value={pin}
                onChange={handlePinChange}
                required
                className="w-full bg-white text-[#00215e] pl-12 pr-4 py-3.5 rounded-xl text-sm font-bold placeholder-[#2c4e80]/60 focus:outline-none focus:ring-2 focus:ring-[#ffc55a] shadow-inner transition-all tracking-widest"
              />
            </div>

            {/* login button */}
            <button
              type="submit"
              disabled={loading || pin.length < 4}
              className="w-full bg-[#fc4100] hover:bg-[#ffc55a] text-white hover:text-[#00215e] px-6 py-3.5 rounded-xl text-base font-extrabold shadow-md transition-colors duration-200 disabled:opacity-50 mt-4 tracking-wider uppercase flex justify-center items-center"
            >
              {loading ? 'Wait...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
