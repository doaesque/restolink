// waiter module interface
'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Home } from 'lucide-react';

export default function PelayanPage() {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/employee/login');
  }

  return (
    <div className="w-screen h-screen flex bg-[#00215e] font-sans">
      <div className="w-[280px] bg-[#00215e] flex flex-col items-center py-10 shrink-0">
        <Image src="/logo_emas.png" alt="Logo" width={90} height={90} />
        <h2 className="text-white font-extrabold text-4xl mt-6 mb-12 tracking-wide">Waiter</h2>
        
        <button 
          className="w-3/4 py-4 rounded-xl font-extrabold text-xl mb-6 shadow-lg transition-colors bg-[#ffc55a] text-[#00215e]"
        >
          Create Order
        </button>
        
        <div className="mt-auto w-full flex flex-col items-center space-y-4">
           <button onClick={handleLogout} className="text-white font-extrabold text-2xl flex items-center hover:text-[#fc4100] transition-colors">
             <Home className="w-8 h-8 mr-3" /> Logout
           </button>
        </div>
      </div>

      <div className="flex-1 bg-[#2c4e80] p-10 rounded-tl-[40px] shadow-[inset_10px_10px_20px_rgba(0,0,0,0.4)] flex flex-col items-center justify-center">
         <h1 className="text-5xl font-extrabold text-white mb-6 tracking-wide drop-shadow-md">
           Waiter Area
         </h1>
         <div className="bg-[#00215e] w-full max-w-2xl p-12 rounded-3xl shadow-2xl text-[#ffc55a] font-bold text-2xl text-center border border-[#ffc55a]/10">
             System active. UI functionality development pending for Waiter...
         </div>
      </div>
    </div>
  );
}
