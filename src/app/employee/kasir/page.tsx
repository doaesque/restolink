// cashier module interface using lucide icons
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Banknote, Smartphone, Home } from 'lucide-react';

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

  const [moneyReceived, setMoneyReceived] = useState<string>('');
  const [tip, setTip] = useState<string>('');

  useEffect(() => {
    if (view !== 'welcome') fetchOrders();
  }, [view]);

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
    const totalBayar = subtotal + (subtotal * 0.1);

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
      <div className="w-screen h-screen bg-[#00215e] flex flex-col items-center justify-center relative font-sans">
        <div className="absolute top-6 right-6">
           <button onClick={handleLogout} className="bg-[#fc4100] px-5 py-2 rounded-xl font-extrabold hover:opacity-90 text-white shadow-lg tracking-wider">Logout</button>
        </div>
        <Image src="/logo_emas.png" alt="Logo" width={150} height={150} className="drop-shadow-xl" />
        <h1 className="text-6xl font-bold mt-8 tracking-wide text-white">Welcome...</h1>
        <h2 className="text-3xl font-bold mt-3 tracking-widest text-white">-Cashier-</h2>
        
        <div className="bg-[#2c4e80] p-10 mt-12 rounded-3xl shadow-2xl flex space-x-8">
          <button onClick={() => setView('cash')} className="bg-white text-[#00215e] p-6 rounded-2xl flex flex-col items-center w-40 h-40 justify-center shadow-xl hover:bg-[#ffc55a] transition-all hover:scale-105">
            <Banknote className="w-16 h-16 mb-3" />
            <span className="font-extrabold text-xl">Cash</span>
          </button>
          <button onClick={() => setView('cashless')} className="bg-white text-[#00215e] p-6 rounded-2xl flex flex-col items-center w-40 h-40 justify-center shadow-xl hover:bg-[#ffc55a] transition-all hover:scale-105">
            <Smartphone className="w-16 h-16 mb-3" />
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
    
    const safeMoney = parseFloat(moneyReceived) || 0;
    const safeTip = parseFloat(tip) || 0;
    const change = Math.max(0, safeMoney - total - safeTip);

    const orderDate = new Date(selectedOrder.tglPesanan).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    });

    return (
      <div className="w-screen h-screen flex bg-[#00215e] font-sans">
        <div className="w-[280px] bg-[#00215e] flex flex-col items-center py-10 shrink-0">
          <Image src="/logo_emas.png" alt="Logo" width={90} height={90} />
          <h2 className="text-white font-extrabold text-4xl mt-6 mb-12 tracking-wide">Cashier</h2>
          
          <button 
            onClick={() => { setView('cash'); setSelectedOrder(null); }} 
            className={`w-3/4 py-4 rounded-xl font-extrabold text-xl mb-6 shadow-lg transition-colors ${view === 'cash' ? 'bg-[#ffc55a] text-[#00215e]' : 'bg-[#2c4e80] text-white hover:bg-[#ffc55a] hover:text-[#00215e]'}`}
          >
            Cash
          </button>
          <button 
            onClick={() => { setView('cashless'); setSelectedOrder(null); }} 
            className={`w-3/4 py-4 rounded-xl font-extrabold text-xl mb-6 shadow-lg transition-colors ${view === 'cashless' ? 'bg-[#ffc55a] text-[#00215e]' : 'bg-[#2c4e80] text-white hover:bg-[#ffc55a] hover:text-[#00215e]'}`}
          >
            Cashless
          </button>
          
          <div className="mt-auto w-full flex flex-col items-center space-y-4">
             <button onClick={() => { setView('welcome'); setSelectedOrder(null); }} className="text-white font-extrabold text-2xl flex items-center hover:text-[#ffc55a] transition-colors">
               <Home className="w-8 h-8 mr-3" /> Home
             </button>
          </div>
        </div>

        <div className="flex-1 bg-[#2c4e80] p-10 rounded-tl-[40px] shadow-[inset_10px_10px_20px_rgba(0,0,0,0.4)] flex relative">
          <button onClick={() => setSelectedOrder(null)} className="absolute bottom-8 right-12 text-white font-extrabold text-2xl hover:text-[#ffc55a] transition-colors drop-shadow-md">
            Back
          </button>

          <div className="flex w-full space-x-10 h-full pb-16">
             <div className={`flex-1 bg-[#ffc55a] p-10 rounded-2xl relative shadow-2xl text-[#00215e] font-serif flex flex-col overflow-hidden`}>
                {isPaid && (
                   <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none -rotate-12 z-0">
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

                  <div className="border-t-2 border-b-2 border-[#00215e] py-4 space-y-2 text-xs font-bold flex-1 overflow-y-auto">
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
                      <div className="flex justify-between text-base mt-2 border-t-2 border-[#00215e] pt-2">
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

             <div className="w-[400px] flex flex-col justify-between">
                {view === 'cash' ? (
                   <div className="space-y-4">
                      <div className="flex flex-col">
                        <label className="text-white font-extrabold text-2xl mb-2">Money Received</label>
                        <input 
                           type="number" 
                           value={moneyReceived}
                           onChange={(e) => setMoneyReceived(e.target.value)}
                           disabled={isPaid}
                           placeholder="0"
                           className="bg-white text-[#00215e] text-3xl p-5 font-extrabold rounded-xl focus:outline-none focus:ring-4 focus:ring-[#ffc55a] shadow-inner w-full" 
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-white font-extrabold text-2xl mb-2">Change</label>
                        <div className="bg-white text-[#00215e] text-3xl p-5 font-extrabold rounded-xl shadow-inner w-full">
                           Rp. {change.toLocaleString('id-ID')}
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <label className="text-white font-extrabold text-2xl mb-2">Tip</label>
                        <input 
                           type="number" 
                           value={tip}
                           onChange={(e) => setTip(e.target.value)}
                           disabled={isPaid}
                           placeholder="0"
                           className="bg-white text-[#00215e] text-3xl p-5 font-extrabold rounded-xl focus:outline-none focus:ring-4 focus:ring-[#ffc55a] shadow-inner w-full" 
                        />
                      </div>
                   </div>
                ) : (
                   <div className="flex flex-col space-y-6">
                     <div className="flex flex-col shadow-2xl rounded-2xl overflow-hidden">
                       <div className="bg-[#00215e] text-white font-extrabold text-2xl text-center py-5">Table Number</div>
                       <div className="bg-white text-[#00215e] font-extrabold text-4xl text-center py-8">{selectedOrder.noMeja}</div>
                     </div>
                     <div className="flex flex-col shadow-2xl rounded-2xl overflow-hidden">
                       <div className="bg-[#00215e] text-white font-extrabold text-2xl text-center py-5">Current Bill</div>
                       <div className="bg-white text-[#00215e] font-extrabold text-4xl text-center py-8">Rp. {total.toLocaleString('id-ID')}</div>
                     </div>
                   </div>
                )}

                <div className="flex justify-end mt-4">
                   <button 
                      onClick={() => handleConfirmPayment(selectedOrder)}
                      disabled={isPaid}
                      className={`w-full font-extrabold text-4xl text-center py-6 rounded-2xl shadow-xl transition-all ${isPaid ? 'bg-[#ffc55a] text-[#00215e] cursor-default' : 'bg-[#fc4100] text-white hover:opacity-90'}`}
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
  // 3. main cashier table interface
  // ---------------------------------------------------------
  return (
    <div className="w-screen h-screen flex bg-[#00215e] font-sans">
      <div className="w-[280px] bg-[#00215e] flex flex-col items-center py-10 shrink-0">
        <Image src="/logo_emas.png" alt="Logo" width={90} height={90} />
        <h2 className="text-white font-extrabold text-4xl mt-6 mb-12 tracking-wide">Cashier</h2>
        
        <button 
          onClick={() => setView('cash')} 
          className={`w-3/4 py-4 rounded-xl font-extrabold text-xl mb-6 shadow-lg transition-colors ${view === 'cash' ? 'bg-[#ffc55a] text-[#00215e]' : 'bg-[#2c4e80] text-white hover:bg-[#ffc55a] hover:text-[#00215e]'}`}
        >
          Cash
        </button>
        <button 
          onClick={() => setView('cashless')} 
          className={`w-3/4 py-4 rounded-xl font-extrabold text-xl mb-6 shadow-lg transition-colors ${view === 'cashless' ? 'bg-[#ffc55a] text-[#00215e]' : 'bg-[#2c4e80] text-white hover:bg-[#ffc55a] hover:text-[#00215e]'}`}
        >
          Cashless
        </button>
        
        <div className="mt-auto w-full flex flex-col items-center space-y-4">
           <button onClick={() => setView('welcome')} className="text-white font-extrabold text-2xl flex items-center hover:text-[#ffc55a] transition-colors">
             <Home className="w-8 h-8 mr-3" /> Home
           </button>
        </div>
      </div>

      <div className="flex-1 bg-[#2c4e80] p-10 rounded-tl-[40px] shadow-[inset_10px_10px_20px_rgba(0,0,0,0.4)] flex flex-col">
        <div className="flex-1 overflow-y-auto pr-4">
          <div className="flex space-x-4 mb-4">
            <div className="bg-[#00215e] w-36 text-white font-extrabold text-xl text-center py-4 rounded-xl shadow-md shrink-0 flex flex-col justify-center leading-tight">
               <span>Table</span><span>Number</span>
            </div>
            <div className="flex-1 bg-[#00215e] text-white font-extrabold text-2xl text-center py-4 rounded-xl shadow-md flex items-center justify-center">Current Bill</div>
            <div className="bg-[#00215e] w-48 text-white font-extrabold text-2xl text-center py-4 rounded-xl shadow-md shrink-0 flex items-center justify-center">Status</div>
          </div>

          <div className="space-y-4">
            {loading ? (
              <p className="text-center text-white font-bold mt-10">Loading bills...</p>
            ) : (
              listPesanan.map((pesanan) => {
                const isPaid = pesanan.statusTagihan === 'PAID';
                const subtotal = pesanan.detailPesanan.reduce((acc, item) => acc + item.subtotal, 0);
                const total = subtotal + (subtotal * 0.1); 
                
                return (
                  <div 
                    key={pesanan.noNota} 
                    onClick={() => setSelectedOrder(pesanan)}
                    className="flex space-x-4 items-center cursor-pointer hover:scale-[1.02] transition-transform"
                  >
                    <div className="bg-[#00215e] w-36 text-white font-bold text-3xl text-center py-5 rounded-xl shadow-md shrink-0">
                      {pesanan.noMeja}
                    </div>
                    <div className="flex-1 bg-[#00215e] text-white font-bold text-3xl text-center py-5 rounded-xl shadow-md">
                      Rp. {total.toLocaleString('id-ID')}
                    </div>
                    <div className={`w-48 font-extrabold text-3xl text-center py-5 rounded-xl shadow-md transition-all shrink-0 ${
                        isPaid ? 'bg-[#ffc55a] text-[#00215e]' : 'bg-[#fc4100] text-white'
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
