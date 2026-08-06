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

  // states for cash transaction
  const [moneyReceived, setMoneyReceived] = useState<string>('');
  const [tip, setTip] = useState<string>('');

  useEffect(() => {
    if (view !== 'welcome') fetchOrders();
  }, [view]);

  // reset form when order changes
  useEffect(() => {
    setMoneyReceived('');
    setTip('0');
  }, [selectedOrder]);

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
    
    const subtotal = pesanan.detailPesanan.reduce((acc, item) => acc + item.subtotal, 0);
    const totalBayar = subtotal + (subtotal * 0.1); // add 10% tax

    // strictly enforce cash logic if applicable
    if (view === 'cash') {
       const money = parseFloat(moneyReceived);
       if (isNaN(money) || money < totalBayar) {
         alert('Money received is insufficient!');
         return;
       }
    }

    const isConfirmed = confirm(`Confirm payment for Table ${pesanan.noMeja}?`);
    if (!isConfirmed) return;

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
        setSelectedOrder(null); 
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
      <div className="w-screen h-screen bg-[#2B4B77] flex flex-col items-center justify-center relative font-sans">
        <div className="absolute top-6 right-6">
           <button onClick={handleLogout} className="bg-red-600/80 px-4 py-2 rounded font-bold hover:bg-red-600 text-white">Logout</button>
        </div>
        <Image src="/logo_emas.png" alt="Logo" width={150} height={150} className="drop-shadow-xl" />
        <h1 className="text-6xl font-bold mt-8 tracking-wide text-white">Welcome...</h1>
        <h2 className="text-3xl font-bold mt-3 tracking-widest text-white">-Cashier-</h2>
        
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
    
    // safe number conversions for cash logic
    const safeMoney = parseFloat(moneyReceived) || 0;
    const safeTip = parseFloat(tip) || 0;
    const change = Math.max(0, safeMoney - total - safeTip);

    const orderDate = new Date(selectedOrder.tglPesanan).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    });

    return (
      <div className="w-screen h-screen flex bg-[#00215e] font-sans">
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

        {/* main content area */}
        <div className="flex-1 bg-[#A6C4E5] p-10 rounded-tl-[40px] shadow-[inset_10px_10px_20px_rgba(0,0,0,0.3)] flex flex-col relative">
          
          {/* dynamic top header row based on view type */}
          {view === 'cash' ? (
             // cash layout top row
             <div className="flex space-x-6 mb-6">
                <div className="flex flex-col w-48 shrink-0">
                  <div className="bg-[#00215e] text-white font-extrabold text-xl text-center py-3 rounded-t-xl">Table Number</div>
                  <div className="bg-[#4D648D] text-white font-bold text-3xl text-center py-5 rounded-b-xl shadow-md">{selectedOrder.noMeja}</div>
                </div>
                <div className="flex flex-col flex-1">
                  <div className="bg-[#00215e] text-white font-extrabold text-xl text-center py-3 rounded-t-xl">Current Bill</div>
                  <div className="bg-[#4D648D] text-white font-bold text-3xl text-center py-5 rounded-b-xl shadow-md">Rp. {total.toLocaleString('id-ID')}</div>
                </div>
                <div className="flex flex-col w-64 shrink-0">
                  <div className="bg-[#00215e] text-white font-extrabold text-xl text-center py-3 rounded-t-xl">Status</div>
                  <div className={`font-extrabold text-3xl text-white text-center py-5 rounded-b-xl shadow-md ${isPaid ? 'bg-[#588157]' : 'bg-[#993333]'}`}>
                    {isPaid ? 'Paid' : 'Unpaid'}
                  </div>
                </div>
             </div>
          ) : (
             // cashless layout right column replaces this below
             <div className="flex justify-end w-full absolute bottom-8 right-12 z-50">
               <button onClick={() => setSelectedOrder(null)} className="text-white font-extrabold text-3xl hover:scale-110 transition-transform drop-shadow-md">
                 Back
               </button>
             </div>
          )}

          {/* lower content section */}
          <div className="flex flex-1 space-x-8 pb-10">
             
             {/* receipt box (always visible) */}
             <div className={`${view === 'cash' ? 'w-[45%]' : 'flex-1'} bg-[#F5B853] p-8 rounded-xl relative shadow-xl text-black font-serif flex flex-col border border-yellow-600 overflow-hidden`}>
                {isPaid && (
                   <div className="absolute inset-0 flex items-center justify-center opacity-40 pointer-events-none -rotate-12 z-0">
                     <Image src="/cap_biru.png" alt="Done Stamp" width={400} height={400} />
                   </div>
                )}

                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex justify-center mb-4">
                    <Image src="/logo.png" alt="logo" width={70} height={70} className="object-contain" />
                  </div>
                  
                  <div className="flex justify-between text-sm font-bold mb-4">
                    <div>
                      <p>Table #{selectedOrder.noMeja}</p>
                      <p>Date : {orderDate}</p>
                      <p>Serve : Cashier</p>
                    </div>
                    <div className="text-right flex items-end">
                      <p className="text-xl tracking-widest">{view === 'cash' ? 'CASH' : 'QRIS'}</p>
                    </div>
                  </div>

                  <div className="border-t-2 border-b-2 border-black py-4 space-y-2 text-xs font-bold flex-1 overflow-y-auto">
                     {selectedOrder.detailPesanan.map(item => (
                        <div key={item.idDetail} className="flex justify-between items-start">
                          <span className="w-6">{item.jumlahPesanan}</span>
                          <span className="flex-1 pr-2 truncate">{item.menu.namaMenu}</span>
                          <span>Rp. {item.subtotal.toLocaleString('id-ID')}</span>
                        </div>
                     ))}
                  </div>

                  <div className="pt-4 text-xs font-bold w-full flex justify-end">
                    <div className="w-3/4 space-y-1">
                      <div className="flex justify-between"><span>Subtotal</span><span>Rp. {subtotal.toLocaleString('id-ID')}</span></div>
                      <div className="flex justify-between"><span>Tax (10%)</span><span>Rp. {tax.toLocaleString('id-ID')}</span></div>
                      <div className="flex justify-between"><span>Tip</span><span>Rp. {safeTip.toLocaleString('id-ID')}</span></div>
                      <div className="flex justify-between text-base mt-2 border-t-2 border-black pt-2">
                        <span>Total</span>
                        <span>Rp. {total.toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 text-center text-[10px] font-bold italic">
                    -Hope you Enjoy Your Dinner-
                  </div>
                </div>
             </div>

             {/* right side content dependent on view */}
             {view === 'cash' ? (
                // cash payment form matching figma
                <div className="flex-1 flex flex-col justify-between">
                   <div className="space-y-4">
                      <div className="flex flex-col">
                        <label className="text-[#00215e] font-extrabold text-2xl mb-2">Money Received</label>
                        <input 
                           type="number" 
                           value={moneyReceived}
                           onChange={(e) => setMoneyReceived(e.target.value)}
                           disabled={isPaid}
                           placeholder="0"
                           className="bg-[#d9d9d9] text-[#00215e] text-3xl p-4 font-extrabold rounded-lg focus:outline-none focus:ring-4 focus:ring-[#00215e]/30 shadow-inner w-full" 
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-[#00215e] font-extrabold text-2xl mb-2">Change</label>
                        <div className="bg-[#d9d9d9] text-[#00215e] text-3xl p-4 font-extrabold rounded-lg shadow-inner w-full">
                           Rp. {change.toLocaleString('id-ID')}
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <label className="text-[#00215e] font-extrabold text-2xl mb-2">Tip</label>
                        <input 
                           type="number" 
                           value={tip}
                           onChange={(e) => setTip(e.target.value)}
                           disabled={isPaid}
                           placeholder="0"
                           className="bg-[#d9d9d9] text-[#00215e] text-3xl p-4 font-extrabold rounded-lg focus:outline-none focus:ring-4 focus:ring-[#00215e]/30 shadow-inner w-full" 
                        />
                      </div>
                   </div>

                   <div className="flex justify-between items-end mt-4">
                      <button onClick={() => setSelectedOrder(null)} className="text-white font-extrabold text-2xl hover:scale-110 transition-transform drop-shadow-md pb-2">
                        Back
                      </button>
                      <button 
                         onClick={() => handleConfirmPayment(selectedOrder)}
                         disabled={isPaid}
                         className={`w-64 font-extrabold text-4xl text-center py-5 rounded-xl shadow-lg transition-colors ${isPaid ? 'bg-[#588157] text-white cursor-default' : 'bg-[#588157] text-white hover:bg-[#466a45]'}`}
                      >
                         Paid
                      </button>
                   </div>
                </div>
             ) : (
                // cashless stats boxes (matching Chasier Cashless belum bayar.png)
                <div className="w-[400px] flex flex-col space-y-6">
                  <div className="flex flex-col shadow-xl rounded-xl">
                    <div className="bg-[#00215e] text-white font-extrabold text-2xl text-center py-4 rounded-t-xl">Table Number</div>
                    <div className="bg-[#4D648D] text-white font-bold text-4xl text-center py-8 rounded-b-xl">{selectedOrder.noMeja}</div>
                  </div>
                  <div className="flex flex-col shadow-xl rounded-xl">
                    <div className="bg-[#00215e] text-white font-extrabold text-2xl text-center py-4 rounded-t-xl">Current Bill</div>
                    <div className="bg-[#4D648D] text-white font-bold text-4xl text-center py-8 rounded-b-xl">Rp. {total.toLocaleString('id-ID')}</div>
                  </div>
                  <div className="flex flex-col shadow-xl rounded-xl">
                    <div className="bg-[#00215e] text-white font-extrabold text-2xl text-center py-4 rounded-t-xl">Status</div>
                    <button 
                      onClick={() => handleConfirmPayment(selectedOrder)}
                      disabled={isPaid}
                      className={`font-extrabold text-4xl text-center py-8 rounded-b-xl transition-colors ${isPaid ? 'bg-[#588157] text-white cursor-default' : 'bg-[#993333] text-white hover:bg-[#7a2828]'}`}
                    >
                      {isPaid ? 'Paid' : 'Unpaid'}
                    </button>
                  </div>
                </div>
             )}
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // 3. main cashier table interface (3 columns)
  // ---------------------------------------------------------
  return (
    <div className="w-screen h-screen flex bg-[#00215e] font-sans">
      {/* sidebar */}
      <div className="w-[280px] flex flex-col items-center py-10 shrink-0">
        <Image src="/logo_emas.png" alt="Logo" width={100} height={100} />
        <h2 className="text-white font-extrabold text-4xl mt-6 mb-12 tracking-wide">Cashier</h2>
        
        <button 
          onClick={() => setView('cash')} 
          className={`w-3/4 py-4 rounded-xl font-extrabold text-xl mb-6 shadow-lg transition-colors ${view === 'cash' ? 'bg-[#d9d9d9] text-[#00215e]' : 'bg-[#335384] text-white hover:bg-[#4d6a9e]'}`}
        >
          Cash
        </button>
        <button 
          onClick={() => setView('cashless')} 
          className={`w-3/4 py-4 rounded-xl font-extrabold text-xl mb-6 shadow-lg transition-colors ${view === 'cashless' ? 'bg-[#d9d9d9] text-[#00215e]' : 'bg-[#335384] text-white hover:bg-[#4d6a9e]'}`}
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
        <div className="flex-1 overflow-y-auto pr-4">
          {/* custom header matching figma */}
          <div className="flex space-x-4 mb-4">
            <div className="bg-[#00215e] w-36 text-white font-extrabold text-xl text-center py-4 rounded-xl shadow-md shrink-0 flex flex-col justify-center leading-tight">
               <span>Table</span><span>Number</span>
            </div>
            <div className="flex-1 bg-[#00215e] text-white font-extrabold text-2xl text-center py-4 rounded-xl shadow-md flex items-center justify-center">Current Bill</div>
            <div className="bg-[#00215e] w-48 text-white font-extrabold text-2xl text-center py-4 rounded-xl shadow-md shrink-0 flex items-center justify-center">Status</div>
          </div>

          <div className="space-y-4">
            {loading ? (
              <p className="text-center text-[#00215e] font-bold mt-10">Loading bills...</p>
            ) : (
              listPesanan.map((pesanan) => {
                const isPaid = pesanan.statusTagihan === 'PAID';
                const subtotal = pesanan.detailPesanan.reduce((acc, item) => acc + item.subtotal, 0);
                const total = subtotal + (subtotal * 0.1); // include 10% tax
                
                return (
                  <div 
                    key={pesanan.noNota} 
                    onClick={() => setSelectedOrder(pesanan)}
                    className="flex space-x-4 items-center cursor-pointer hover:scale-[1.01] transition-transform"
                  >
                    <div className="bg-[#4D648D] w-36 text-white font-bold text-3xl text-center py-5 rounded-xl shadow-md shrink-0">
                      {pesanan.noMeja}
                    </div>
                    <div className="flex-1 bg-[#4D648D] text-white font-bold text-3xl text-center py-5 rounded-xl shadow-md">
                      Rp. {total.toLocaleString('id-ID')}
                    </div>
                    <div className={`w-48 font-extrabold text-3xl text-center py-5 rounded-xl shadow-md transition-all shrink-0 ${
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
