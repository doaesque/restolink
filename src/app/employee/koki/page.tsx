// chef module interface matching figma designs perfectly
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface DetailPesanan {
  idDetail: string;
  jumlahPesanan: number;
  menu: { namaMenu: string };
}

interface Pesanan {
  noNota: string;
  noMeja: number;
  statusPesanan: string;
  detailPesanan: DetailPesanan[];
}

interface BahanBaku {
  id: string;
  namaBahan: string;
  statusBahan: string;
}

export default function KokiPage() {
  const router = useRouter();
  const [view, setView] = useState<'welcome' | 'orders' | 'inventory'>('welcome');
  const [listPesanan, setListPesanan] = useState<Pesanan[]>([]);
  const [listBahan, setListBahan] = useState<BahanBaku[]>([]);
  const [itemReadyState, setItemReadyState] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (view === 'orders') fetchOrders();
    if (view === 'inventory') fetchInventory();
  }, [view]);

  async function fetchOrders() {
    try {
      const res = await fetch('/api/pesanan');
      const data = await res.json();
      if (data.sukses) {
        setListPesanan(data.data.filter((p: Pesanan) => p.statusPesanan !== 'SELESAI'));
      }
    } catch (err) {
      console.error('failed to fetch orders:', err);
    }
  }

  async function fetchInventory() {
    try {
      const res = await fetch('/api/bahan-baku');
      const data = await res.json();
      if (data.sukses) setListBahan(data.data);
    } catch (err) {
      console.error('failed to fetch inventory:', err);
    }
  }

  const toggleItemReady = (detailId: string) => {
    setItemReadyState((prev) => ({ ...prev, [detailId]: !prev[detailId] }));
  };

  const isOrderFullyReady = (pesanan: Pesanan) => {
    return pesanan.detailPesanan.every((item) => itemReadyState[item.idDetail]);
  };

  async function handleMarkOrderComplete(noNota: string) {
    try {
      const res = await fetch('/api/pesanan', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noNota, statusPesanan: 'SELESAI' }),
      });
      if ((await res.json()).sukses) fetchOrders();
    } catch (err) {
      console.error('failed to mark order complete:', err);
    }
  }

  async function handleToggleBahanStatus(id: string, currentStatus: string) {
    const nextStatus = currentStatus === 'TERSEDIA' ? 'HABIS' : 'TERSEDIA';
    try {
      const res = await fetch('/api/bahan-baku', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, statusBahan: nextStatus }),
      });
      if ((await res.json()).sukses) fetchInventory();
    } catch (err) {
      console.error('failed to update inventory status:', err);
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/employee/login');
  }

  // ---------------------------------------------------------
  // 1. welcome screen view
  // ---------------------------------------------------------
  if (view === 'welcome') {
    return (
      <div className="w-screen h-screen bg-[#2B4B77] flex flex-col items-center justify-center relative font-sans">
        <div className="absolute top-6 right-6">
           <button onClick={handleLogout} className="bg-red-600/80 px-4 py-2 rounded font-bold hover:bg-red-600 text-white">Logout</button>
        </div>
        <Image src="/logo_emas.png" alt="Logo" width={150} height={150} className="drop-shadow-xl" />
        <h1 className="text-6xl font-bold mt-8 tracking-wide text-white">Welcome...</h1>
        <h2 className="text-3xl font-bold mt-3 tracking-widest text-white">-Chef-</h2>
        
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
    <div className="w-screen h-screen flex bg-[#00215e] font-sans">
      {/* sidebar */}
      <div className="w-[280px] flex flex-col items-center py-10 shrink-0">
        <Image src="/logo_emas.png" alt="Logo" width={100} height={100} />
        <h2 className="text-white font-extrabold text-3xl mt-6 mb-12 tracking-wide">Kitchen</h2>
        
        <button 
          onClick={() => setView('orders')} 
          className={`w-3/4 py-4 rounded-xl font-extrabold text-lg mb-6 shadow-lg transition-colors flex flex-col items-center justify-center leading-tight ${view === 'orders' ? 'bg-[#d9d9d9] text-black' : 'bg-[#335384] text-white hover:bg-[#4d6a9e]'}`}
        >
          <span>Incoming</span><span>Order</span>
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

      {/* main content area */}
      <div className="flex-1 bg-[#A6C4E5] p-8 rounded-tl-[40px] shadow-[inset_10px_10px_20px_rgba(0,0,0,0.3)] flex flex-col overflow-y-auto">
         
         {/* orders view */}
         {view === 'orders' && (
           <div className="space-y-6">
              {/* table headers matching figma */}
              <div className="flex space-x-4 mb-2">
                 <div className="bg-[#00215e] w-36 flex flex-col items-center justify-center rounded-xl text-white font-bold text-xl py-3 shadow-md shrink-0 leading-tight">
                    <span>Table</span><span>Number</span>
                 </div>
                 <div className="flex-1 bg-[#00215e] rounded-xl text-white font-bold text-2xl flex items-center justify-center shadow-md">
                    Incoming Order
                 </div>
                 <div className="bg-[#00215e] w-48 rounded-xl text-white font-bold text-2xl flex items-center justify-center shadow-md shrink-0">
                    Status
                 </div>
              </div>

              {listPesanan.length === 0 ? (
                 <p className="text-center text-[#00215e] font-bold text-2xl mt-20">No incoming orders.</p>
              ) : (
                listPesanan.map(pesanan => {
                  const isReady = isOrderFullyReady(pesanan);
                  return (
                    <div key={pesanan.noNota} className="flex space-x-4">
                       <div className="bg-[#4D648D] w-36 flex items-center justify-center rounded-xl text-white font-bold text-4xl shrink-0 shadow-md">
                          {pesanan.noMeja}
                       </div>
                       
                       <div className="flex-1 flex flex-col space-y-3">
                          {pesanan.detailPesanan.map(item => {
                            const isItemReady = itemReadyState[item.idDetail];
                            return (
                              <div key={item.idDetail} className="flex space-x-3">
                                 <div className="bg-[#4D648D] flex-1 p-5 rounded-xl text-white font-bold text-lg shadow-sm flex items-center">
                                    {item.menu.namaMenu}
                                 </div>
                                 <button 
                                    onClick={() => toggleItemReady(item.idDetail)}
                                    className={`p-5 rounded-xl w-20 flex items-center justify-center text-4xl font-extrabold text-white transition-colors shadow-sm shrink-0 ${isItemReady ? 'bg-[#588157] hover:bg-[#466a45]' : 'bg-[#993333] hover:bg-[#7a2828]'}`}
                                 >
                                    {isItemReady ? '✓' : '✕'}
                                 </button>
                              </div>
                            );
                          })}
                       </div>

                       <button 
                          onClick={() => { if(isReady) handleMarkOrderComplete(pesanan.noNota) }}
                          disabled={!isReady}
                          className={`w-48 rounded-xl text-white font-bold text-3xl flex items-center justify-center shrink-0 shadow-md transition-all ${isReady ? 'bg-[#588157] hover:scale-105 cursor-pointer' : 'bg-[#993333] opacity-90 cursor-not-allowed'}`}
                       >
                          {isReady ? 'Ready' : 'Not Ready'}
                       </button>
                    </div>
                  );
                })
              )}
           </div>
         )}

         {/* inventory view */}
         {view === 'inventory' && (
           <div className="space-y-4">
              {listBahan.map(bahan => {
                const isReady = bahan.statusBahan === 'TERSEDIA';
                return (
                  <div key={bahan.id} className="flex space-x-4">
                     <div className="bg-[#4D648D] flex-1 p-5 rounded-xl text-white font-bold text-2xl shadow-sm flex items-center">
                        {bahan.namaBahan}
                     </div>
                     <button 
                        onClick={() => handleToggleBahanStatus(bahan.id, bahan.statusBahan)}
                        className={`w-64 p-5 rounded-xl text-white font-bold text-2xl text-center shadow-md transition-colors shrink-0 ${isReady ? 'bg-[#588157] hover:bg-[#466a45]' : 'bg-[#993333] hover:bg-[#7a2828]'}`}
                     >
                        {isReady ? 'Ready Stock' : 'Out of Stock'}
                     </button>
                  </div>
                );
              })}
           </div>
         )}
      </div>
    </div>
  );
}
