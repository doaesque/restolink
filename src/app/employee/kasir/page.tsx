// cashier module interface matching figma designs perfectly
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface DetailPesanan {
  idDetail: string;
  jumlahPesanan: number;
  subtotal: number;
  menu: { namaMenu: string };
}

interface Pesanan {
  noNota: string;
  noMeja: number;
  statusTagihan: string;
  tglPesanan: string;
  pelanggan: { namaPelanggan: string };
  detailPesanan: DetailPesanan[];
}

export default function KasirPage() {
  const router = useRouter();
  const [view, setView] = useState<'welcome' | 'cash' | 'cashless'>('welcome');
  const [listPesanan, setListPesanan] = useState<Pesanan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedOrder, setSelectedOrder] = useState<Pesanan | null>(null);

  useEffect(() => {
    if (view !== 'welcome') fetchOrders();
  }, [view]);

  async function fetchOrders() {
    setLoading(true);
    try {
      const res = await fetch('/api/pesanan');
      const data = await res.json();
      if (data.sukses) setListPesanan(data.data);
    } catch (err) {
      console.error('failed to fetch billing orders:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmPayment(pesanan: Pesanan) {
    if (pesanan.statusTagihan === 'PAID') return;
    const isConfirmed = confirm(`Confirm payment for Table ${pesanan.noMeja}?`);
    if (!isConfirmed) return;

    const totalBayar = pesanan.detailPesanan.reduce((acc, item) => acc + item.subtotal, 0);

    try {
      const res = await fetch('/api/pembayaran', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noNota: pesanan.noNota,
          totalBayar,
          metodePembayaran: view === 'cashless' ? 'QRIS' : 'TUNAI',
        }),
      });

      if ((await res.json()).sukses) {
        setSelectedOrder(null); // close detail view on success
        fetchOrders();
      } else {
        alert('failed to process payment.');
      }
    } catch (err) {
      console.error(err);
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
      <div className="w-screen h-screen bg-[#2B4B77] flex flex-col items-center justify-center relative">
        <div className="absolute top-6 right-6">
           <button onClick={handleLogout} className="bg-red-600/80 px-4 py-2 rounded font-bold hover:bg-red-600">Logout</button>
        </div>
        <Image src="/logo_emas.png" alt="Logo" width={150} height={150} className="drop-shadow-xl" />
        <h1 className="text-6xl font-bold mt-8 tracking-wide">Welcome...</h1>
        <h2 className="text-3xl font-bold mt-3 tracking-widest">-Cashier-</h2>
        
        <div className="bg-[#00215e] p-10 mt-12 rounded-2xl shadow-2xl flex space-x-8">
          <button onClick={() => setView('cash')} className="bg-[#d9d9d9] text-[#00215e] p-6 rounded-2xl flex flex-col items-center w-40 h-40 justify-center shadow-[0_10px_20px_rgba(0,0,0,0.5)] hover:bg-white transition-all hover:scale-105">
            <span className="text-6xl mb-3">💵</span>
            <span className="font-extrabold text-xl">Cash</span>
          </button>
          <button onClick={() => setView('cashless')} className="bg-[#d9d9d9] text-[#00215e] p-6 rounded-2xl flex flex-col items-center w-40 h-40 justify-center shadow-[0_10px_20px_rgba(0,0,0,0.5)] hover:bg-white transition-all hover:scale-105">
            <span className="text-6xl mb-3">📱</span>
            <span className="font-extrabold text-xl">Cashless</span>
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // 2. detail receipt view
  // ---------------------------------------------------------
  if (selectedOrder) {
    const isPaid = selectedOrder.statusTagihan === 'PAID';
    const subtotal = selectedOrder.detailPesanan.reduce((acc, item) => acc + item.subtotal, 0);
    const tax = subtotal * 0.1;
    const total = subtotal + tax;

    const orderDate = new Date(selectedOrder.tglPesanan).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    });

    return (
      <div className="w-screen h-screen flex bg-[#00215e]">
        {/* sidebar */}
        <div className="w-[280px] flex flex-col items-center py-10 shrink-0">
          <Image src="/logo_emas.png" alt="Logo" width={100} height={100} />
          <h2 className="text-white font-extrabold text-4xl mt-6 mb-12 tracking-wide">Cashier</h2>
          
          <button 
            onClick={() => { setView('cash'); setSelectedOrder(null); }} 
            className={`w-3/4 py-4 rounded-xl font-extrabold text-xl mb-6 shadow-lg transition-colors ${view === 'cash' ? 'bg-[#d9d9d9] text-black' : 'bg-[#335384] text-white hover:bg-[#4d6a9e]'}`}
          >
            Cash
          </button>
          <button 
            onClick={() => { setView('cashless'); setSelectedOrder(null); }} 
            className={`w-3/4 py-4 rounded-xl font-extrabold text-xl mb-6 shadow-lg transition-colors ${view === 'cashless' ? 'bg-[#d9d9d9] text-black' : 'bg-[#335384] text-white hover:bg-[#4d6a9e]'}`}
          >
            Cashless
          </button>
          
          <div className="mt-auto w-full flex flex-col items-center space-y-4">
             <button onClick={() => { setView('welcome'); setSelectedOrder(null); }} className="text-white font-extrabold text-2xl flex items-center hover:scale-110 transition-transform">
               <span className="mr-3 text-3xl">🏠</span> Home
             </button>
          </div>
        </div>

        <div className="flex-1 bg-[#A6C4E5] p-10 rounded-tl-[40px] shadow-[inset_10px_10px_20px_rgba(0,0,0,0.3)] flex relative">
          <button onClick={() => setSelectedOrder(null)} className="absolute bottom-8 right-12 text-white font-extrabold text-2xl hover:scale-110 transition-transform drop-shadow-md">
            Back
          </button>

          <div className="flex w-full space-x-10 h-full pb-16">
             {/* yellow receipt */}
             <div className="flex-1 bg-[#F5B853] p-10 rounded-xl relative shadow-xl text-black font-serif flex flex-col border border-yellow-600 overflow-hidden">
                {isPaid && (
                   <div className="absolute inset-0 flex items-center justify-center opacity-40 pointer-events-none -rotate-12 z-0">
                     <Image src="/cap_biru.png" alt="Done Stamp" width={350} height={350} />
                   </div>
                )}

                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex justify-center mb-6">
                    <Image src="/logo.png" alt="logo" width={80} height={80} className="object-contain" />
                  </div>
                  
                  <div className="flex justify-between text-base font-bold mb-4">
                    <div>
                      <p>Table #{selectedOrder.noMeja}</p>
                      <p>Date : {orderDate}</p>
                      <p>Serve : Cashier</p>
                    </div>
                    <div className="text-right flex items-end">
                      <p className="text-2xl tracking-widest">{view.toUpperCase()}</p>
                    </div>
                  </div>

                  <div className="border-t-2 border-b-2 border-black py-4 space-y-3 text-sm font-bold flex-1 overflow-y-auto">
                     {selectedOrder.detailPesanan.map(item => (
                        <div key={item.idDetail} className="flex justify-between items-start">
                          <span className="w-8">{item.jumlahPesanan}</span>
                          <span className="flex-1 pr-4 truncate">{item.menu.namaMenu}</span>
                          <span>Rp. {item.subtotal.toLocaleString('id-ID')}</span>
                        </div>
                     ))}
                  </div>

                  <div className="pt-4 text-sm font-bold w-full flex justify-end">
                    <div className="w-1/2 space-y-1">
                      <div className="flex justify-between"><span>Subtotal</span><span>Rp. {subtotal.toLocaleString('id-ID')}</span></div>
                      <div className="flex justify-between"><span>Tax (10%)</span><span>Rp. {tax.toLocaleString('id-ID')}</span></div>
                      <div className="flex justify-between"><span>Tip</span><span>Rp. 0</span></div>
                      <div className="flex justify-between text-lg mt-2 border-t-2 border-black pt-2">
                        <span>Total</span>
                        <span>Rp. {total.toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 text-center text-xs font-bold italic">
                    -Hope you Enjoy Your Dinner-
                  </div>
                </div>
             </div>

             {/* right side stats */}
             <div className="w-[350px] flex flex-col space-y-8">
               <div className="flex flex-col shadow-xl rounded-xl">
                 <div className="bg-[#00215e] text-white font-extrabold text-2xl text-center py-4 rounded-t-xl">Table Number</div>
                 <div className="bg-[#4D648D] text-white font-bold text-3xl text-center py-6 rounded-b-xl">{selectedOrder.noMeja}</div>
               </div>
               <div className="flex flex-col shadow-xl rounded-xl">
                 <div className="bg-[#00215e] text-white font-extrabold text-2xl text-center py-4 rounded-t-xl">Current Bill</div>
                 <div className="bg-[#4D648D] text-white font-bold text-3xl text-center py-6 rounded-b-xl">Rp. {total.toLocaleString('id-ID')}</div>
               </div>
               <div className="flex flex-col shadow-xl rounded-xl">
                 <div className="bg-[#00215e] text-white font-extrabold text-2xl text-center py-4 rounded-t-xl">Status</div>
                 <button 
                   onClick={() => handleConfirmPayment(selectedOrder)}
                   disabled={isPaid}
                   className={`font-bold text-4xl text-center py-6 rounded-b-xl transition-colors ${isPaid ? 'bg-[#588157] text-white cursor-default' : 'bg-[#993333] text-white hover:bg-red-800'}`}
                 >
                   {isPaid ? 'Paid' : 'Unpaid'}
                 </button>
               </div>
             </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // 3. main cashier table interface (3 columns)
  // ---------------------------------------------------------
  return (
    <div className="w-screen h-screen flex bg-[#00215e]">
      {/* sidebar */}
      <div className="w-[280px] flex flex-col items-center py-10 shrink-0">
        <Image src="/logo_emas.png" alt="Logo" width={100} height={100} />
        <h2 className="text-white font-extrabold text-4xl mt-6 mb-12 tracking-wide">Cashier</h2>
        
        <button 
          onClick={() => setView('cash')} 
          className={`w-3/4 py-4 rounded-xl font-extrabold text-xl mb-6 shadow-lg transition-colors ${view === 'cash' ? 'bg-[#d9d9d9] text-black' : 'bg-[#335384] text-white hover:bg-[#4d6a9e]'}`}
        >
          Cash
        </button>
        <button 
          onClick={() => setView('cashless')} 
          className={`w-3/4 py-4 rounded-xl font-extrabold text-xl mb-6 shadow-lg transition-colors ${view === 'cashless' ? 'bg-[#d9d9d9] text-black' : 'bg-[#335384] text-white hover:bg-[#4d6a9e]'}`}
        >
          Cashless
        </button>
        
        <div className="mt-auto w-full flex flex-col items-center space-y-4">
           <button onClick={() => setView('welcome')} className="text-white font-extrabold text-2xl flex items-center hover:scale-110 transition-transform">
             <span className="mr-3 text-3xl">🏠</span> Home
           </button>
        </div>
      </div>

      {/* main table content */}
      <div className="flex-1 bg-[#A6C4E5] p-10 rounded-tl-[40px] shadow-[inset_10px_10px_20px_rgba(0,0,0,0.3)] flex flex-col">
        <div className="flex-1 bg-[#A6C4E5] rounded-xl overflow-y-auto pr-4">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-[#00215e] text-white font-extrabold text-xl text-center py-4 rounded-xl shadow-md">Table Number</div>
            <div className="bg-[#00215e] text-white font-extrabold text-xl text-center py-4 rounded-xl shadow-md">Current Bill</div>
            <div className="bg-[#00215e] text-white font-extrabold text-xl text-center py-4 rounded-xl shadow-md">Status</div>
          </div>

          <div className="space-y-4">
            {loading ? (
              <p className="text-center text-[#00215e] font-bold mt-10">Loading bills...</p>
            ) : (
              listPesanan.map((pesanan) => {
                const isPaid = pesanan.statusTagihan === 'PAID';
                // strictly matching figma total format
                const subtotal = pesanan.detailPesanan.reduce((acc, item) => acc + item.subtotal, 0);
                const total = subtotal + (subtotal * 0.1);
                
                return (
                  <div 
                    key={pesanan.noNota} 
                    onClick={() => setSelectedOrder(pesanan)}
                    className="grid grid-cols-3 gap-4 items-center cursor-pointer hover:scale-[1.01] transition-transform"
                  >
                    <div className="bg-[#4D648D] text-white font-bold text-2xl text-center py-4 rounded-xl shadow-md">
                      {pesanan.noMeja}
                    </div>
                    <div className="bg-[#4D648D] text-white font-bold text-2xl text-center py-4 rounded-xl shadow-md">
                      Rp. {total.toLocaleString('id-ID')}
                    </div>
                    <div className={`font-extrabold text-2xl text-center py-4 rounded-xl shadow-md transition-all ${
                        isPaid ? 'bg-[#588157] text-white' : 'bg-[#993333] text-white'
                      }`}
                    >
                      {isPaid ? 'Paid' : 'Unpaid'}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
