// chef module interface using lucide icons
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ConciergeBell, Package, Home, Check, X } from 'lucide-react';

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
      <div className="w-screen h-screen bg-[#00215e] flex flex-col items-center justify-center relative font-sans">
        <div className="absolute top-6 right-6">
           <button onClick={handleLogout} className="bg-[#fc4100] px-5 py-2 rounded-xl font-extrabold hover:opacity-90 text-white shadow-lg tracking-wider">Logout</button>
        </div>
        <Image src="/logo_emas.png" alt="Logo" width={150} height={150} className="drop-shadow-xl" />
        <h1 className="text-6xl font-bold mt-8 tracking-wide text-white">Welcome...</h1>
        <h2 className="text-3xl font-bold mt-3 tracking-widest text-white">-Chef-</h2>
        
        <div className="bg-[#2c4e80] p-10 mt-12 rounded-3xl shadow-2xl flex space-x-8">
          <button onClick={() => setView('orders')} className="bg-white text-[#00215e] p-6 rounded-2xl flex flex-col items-center w-48 h-40 justify-center shadow-xl hover:bg-[#ffc55a] transition-all hover:scale-105">
            <ConciergeBell className="w-16 h-16 mb-3" />
            <span className="font-extrabold text-xl text-center leading-tight">Incoming Order</span>
          </button>
          <button onClick={() => setView('inventory')} className="bg-white text-[#00215e] p-6 rounded-2xl flex flex-col items-center w-48 h-40 justify-center shadow-xl hover:bg-[#ffc55a] transition-all hover:scale-105">
            <Package className="w-16 h-16 mb-3" />
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
      <div className="w-[280px] bg-[#00215e] flex flex-col items-center py-10 shrink-0">
        <Image src="/logo_emas.png" alt="Logo" width={90} height={90} />
        <h2 className="text-white font-extrabold text-3xl mt-6 mb-12 tracking-wide">Kitchen</h2>
        
        <button 
          onClick={() => setView('orders')} 
          className={`w-3/4 py-4 rounded-xl font-extrabold text-lg mb-6 shadow-lg transition-colors flex flex-col items-center justify-center leading-tight ${view === 'orders' ? 'bg-[#ffc55a] text-[#00215e]' : 'bg-[#2c4e80] text-white hover:bg-[#ffc55a] hover:text-[#00215e]'}`}
        >
          <span>Incoming</span><span>Order</span>
        </button>
        <button 
          onClick={() => setView('inventory')} 
          className={`w-3/4 py-4 rounded-xl font-extrabold text-lg mb-6 shadow-lg transition-colors ${view === 'inventory' ? 'bg-[#ffc55a] text-[#00215e]' : 'bg-[#2c4e80] text-white hover:bg-[#ffc55a] hover:text-[#00215e]'}`}
        >
          Inventory
        </button>
        
        <div className="mt-auto w-full flex flex-col items-center">
           <button onClick={() => setView('welcome')} className="text-white font-extrabold text-2xl flex items-center hover:text-[#ffc55a] transition-colors">
             <Home className="w-8 h-8 mr-3" /> Home
           </button>
        </div>
      </div>

      <div className="flex-1 bg-[#2c4e80] p-10 rounded-tl-[40px] shadow-[inset_10px_10px_20px_rgba(0,0,0,0.4)] flex flex-col overflow-y-auto">
         
         {view === 'orders' && (
           <div className="space-y-6">
              <div className="flex space-x-4 mb-2">
                 <div className="bg-[#00215e] w-36 flex flex-col items-center justify-center rounded-xl text-white font-bold text-xl py-3 shadow-md shrink-0 leading-tight">
                    <span>Table</span><span>Number</span>
                 </div>
                 <div className="flex-1 bg-[#00215e] rounded-xl text-white font-bold text-2xl flex items-center justify-center shadow-md">
                    Incoming Order
                 </div>
                 <div className="bg-[#00215e] w-56 rounded-xl text-white font-bold text-2xl flex items-center justify-center shadow-md shrink-0">
                    Status
                 </div>
              </div>

              {listPesanan.length === 0 ? (
                 <p className="text-center text-white font-bold text-2xl mt-20">No incoming orders.</p>
              ) : (
                listPesanan.map(pesanan => {
                  const isReady = isOrderFullyReady(pesanan);
                  return (
                    <div key={pesanan.noNota} className="flex space-x-4">
                       <div className="bg-[#00215e] w-36 flex items-center justify-center rounded-xl text-white font-bold text-5xl shrink-0 shadow-md">
                          {pesanan.noMeja}
                       </div>
                       
                       <div className="flex-1 flex flex-col space-y-3">
                          {pesanan.detailPesanan.map(item => {
                            const isItemReady = itemReadyState[item.idDetail];
                            return (
                              <div key={item.idDetail} className="flex space-x-3">
                                 <div className="bg-[#00215e] flex-1 p-5 rounded-xl text-white font-bold text-xl shadow-sm flex items-center">
                                    {item.menu.namaMenu}
                                 </div>
                                 <button 
                                    onClick={() => toggleItemReady(item.idDetail)}
                                    className={`p-5 rounded-xl w-24 flex items-center justify-center font-extrabold transition-colors shadow-sm shrink-0 ${isItemReady ? 'bg-[#ffc55a] text-[#00215e]' : 'bg-[#fc4100] text-white'}`}
                                 >
                                    {isItemReady ? <Check className="w-10 h-10" /> : <X className="w-10 h-10" />}
                                 </button>
                              </div>
                            );
                          })}
                       </div>

                       <button 
                          onClick={() => { if(isReady) handleMarkOrderComplete(pesanan.noNota) }}
                          disabled={!isReady}
                          className={`w-56 rounded-xl font-extrabold text-4xl flex items-center justify-center shrink-0 shadow-md transition-all ${isReady ? 'bg-[#ffc55a] text-[#00215e] hover:opacity-90 cursor-pointer' : 'bg-[#fc4100] text-white opacity-90 cursor-not-allowed'}`}
                       >
                          {isReady ? 'Ready' : 'Not Ready'}
                       </button>
                    </div>
                  );
                })
              )}
           </div>
         )}

         {view === 'inventory' && (
           <div className="space-y-4">
              {listBahan.map(bahan => {
                const isReady = bahan.statusBahan === 'TERSEDIA';
                return (
                  <div key={bahan.id} className="flex space-x-4">
                     <div className="bg-[#00215e] flex-1 p-6 rounded-xl text-white font-bold text-2xl shadow-sm flex items-center">
                        {bahan.namaBahan}
                     </div>
                     <button 
                        onClick={() => handleToggleBahanStatus(bahan.id, bahan.statusBahan)}
                        className={`w-72 p-6 rounded-xl font-extrabold text-3xl text-center shadow-md transition-colors shrink-0 ${isReady ? 'bg-[#ffc55a] text-[#00215e] hover:opacity-90' : 'bg-[#fc4100] text-white hover:opacity-90'}`}
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
