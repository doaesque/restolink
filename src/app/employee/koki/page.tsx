// chef module interface matching figma welcome design
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function KokiPage() {
  const router = useRouter();
  const [view, setView] = useState<'welcome' | 'orders' | 'inventory'>('welcome');

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/employee/login');
  }

  // ---------------------------------------------------------
  // 1. welcome screen view
  // ---------------------------------------------------------
  if (view === 'welcome') {
    return (
      <div className="w-screen h-screen bg-[#2B4B77] flex flex-col items-center justify-center relative">
        <div className="absolute top-6 right-6">
           <button onClick={handleLogout} className="bg-red-600/80 px-4 py-2 rounded font-bold hover:bg-red-600">Logout</button>
        </div>
        <Image src="/logo_emas.png" alt="Logo" width={150} height={150} className="drop-shadow-xl" />
        <h1 className="text-6xl font-bold mt-8 tracking-wide">Welcome...</h1>
        <h2 className="text-3xl font-bold mt-3 tracking-widest">-Chef-</h2>
        
        <div className="bg-[#00215e] p-10 mt-12 rounded-2xl shadow-2xl flex space-x-8">
          <button onClick={() => setView('orders')} className="bg-[#d9d9d9] text-[#00215e] p-6 rounded-2xl flex flex-col items-center w-48 h-40 justify-center shadow-[0_10px_20px_rgba(0,0,0,0.5)] hover:bg-white transition-all hover:scale-105">
            <span className="text-6xl mb-3">🍽️</span>
            <span className="font-extrabold text-xl">Incoming Order</span>
          </button>
          <button onClick={() => setView('inventory')} className="bg-[#d9d9d9] text-[#00215e] p-6 rounded-2xl flex flex-col items-center w-48 h-40 justify-center shadow-[0_10px_20px_rgba(0,0,0,0.5)] hover:bg-white transition-all hover:scale-105">
            <span className="text-6xl mb-3">📦</span>
            <span className="font-extrabold text-xl">Inventory</span>
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // 2. main chef interface
  // ---------------------------------------------------------
  return (
    <div className="w-screen h-screen flex bg-[#00215e]">
      {/* sidebar */}
      <div className="w-[280px] flex flex-col items-center py-10 shrink-0">
        <Image src="/logo_emas.png" alt="Logo" width={100} height={100} />
        <h2 className="text-white font-extrabold text-4xl mt-6 mb-12 tracking-wide">Chef</h2>
        
        <button 
          onClick={() => setView('orders')} 
          className={`w-3/4 py-4 rounded-xl font-extrabold text-lg mb-6 shadow-lg transition-colors ${view === 'orders' ? 'bg-[#d9d9d9] text-black' : 'bg-[#335384] text-white hover:bg-[#4d6a9e]'}`}
        >
          Orders
        </button>
        <button 
          onClick={() => setView('inventory')} 
          className={`w-3/4 py-4 rounded-xl font-extrabold text-lg mb-6 shadow-lg transition-colors ${view === 'inventory' ? 'bg-[#d9d9d9] text-black' : 'bg-[#335384] text-white hover:bg-[#4d6a9e]'}`}
        >
          Inventory
        </button>
        
        <div className="mt-auto w-full flex flex-col items-center">
           <button onClick={() => setView('welcome')} className="text-white font-extrabold text-2xl flex items-center hover:scale-110 transition-transform">
             <span className="mr-3 text-3xl">🏠</span> Home
           </button>
        </div>
      </div>

      {/* main content placeholder */}
      <div className="flex-1 bg-[#A6C4E5] p-10 rounded-tl-[40px] shadow-[inset_10px_10px_20px_rgba(0,0,0,0.3)] flex flex-col overflow-y-auto">
         <h1 className="text-3xl font-extrabold text-[#00215e] mb-6">
           {view === 'orders' ? 'Live Kitchen Display' : 'Raw Materials Stock'}
         </h1>
         <div className="bg-[#4D648D] w-full p-8 rounded-2xl shadow-md text-white font-bold text-center">
             System active. Awaiting new data...
         </div>
      </div>
    </div>
  );
}
