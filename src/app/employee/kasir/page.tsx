// unified cashier dashboard module interface
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, LogOut, Home, Banknote, QrCode } from 'lucide-react';

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
  const [view, setView] = useState<'welcome' | 'dashboard'>('welcome');
  const [listPesanan, setListPesanan] = useState<Pesanan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedOrder, setSelectedOrder] = useState<Pesanan | null>(null);

  // states for payment processing
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QRIS'>('CASH');
  const [moneyReceived, setMoneyReceived] = useState<string>('');
  const [tip, setTip] = useState<string>('');

  useEffect(() => {
    if (view !== 'welcome') fetchOrders();
  }, [view]);

  // reset form when order changes
  useEffect(() => {
    setMoneyReceived('');
    setTip('0');
    setPaymentMethod('CASH');
  }, [selectedOrder]);

  async function fetchOrders() {
    setLoading(true);
    try {
      const res = await fetch('/api/pesanan');
      const data = await res.json();
      if (data.sukses) setListPesanan(data.data);
    } catch (err) {
      console.error('Failed to fetch billing orders:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmPayment(pesanan: Pesanan) {
    if (pesanan.statusTagihan === 'PAID') return;
    
    const subtotal = pesanan.detailPesanan.reduce((acc, item) => acc + item.subtotal, 0);
    const totalBayar = subtotal + (subtotal * 0.1);

    if (paymentMethod === 'CASH') {
       const money = parseFloat(moneyReceived);
       if (isNaN(money) || money < totalBayar) {
         alert('Money received is insufficient to cover the total bill.');
         return;
       }
    }

    const isConfirmed = confirm(`Confirm ${paymentMethod} payment for Table ${pesanan.noMeja}?`);
    if (!isConfirmed) return;

    try {
      const res = await fetch('/api/pembayaran', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noNota: pesanan.noNota,
          totalBayar,
          metodePembayaran: paymentMethod === 'CASH' ? 'TUNAI' : 'QRIS',
        }),
      });

      const responseData = await res.json();
      if (responseData.sukses) {
        setSelectedOrder(null); 
        fetchOrders();
      } else {
        alert(responseData.pesan || 'Failed to process payment.');
      }
    } catch (err) {
      console.error('Payment Error:', err);
      alert('A system error occurred while processing the payment.');
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
           <button onClick={handleLogout} className="bg-[#fc4100] px-6 py-2.5 rounded-xl font-extrabold hover:bg-[#e63a00] transition-colors text-white shadow-lg tracking-wider flex items-center">
             <LogOut className="w-5 h-5 mr-2" /> Logout
           </button>
        </div>
        <Image src="/logo_emas.png" alt="Logo" width={160} height={160} className="drop-shadow-xl" />
        <h1 className="text-6xl font-bold mt-8 tracking-wide text-white">Welcome...</h1>
        <h2 className="text-3xl font-bold mt-3 tracking-widest text-[#ffc55a]">-Cashier-</h2>
        
        <div className="mt-14">
          <button 
            onClick={() => setView('dashboard')} 
            className="bg-white text-[#00215e] px-10 py-6 rounded-2xl flex items-center justify-center shadow-2xl hover:bg-[#ffc55a] transition-all hover:scale-105 group"
          >
            <LayoutDashboard className="w-10 h-10 mr-4 text-[#fc4100] group-hover:text-[#00215e] transition-colors" />
            <span className="font-extrabold text-3xl tracking-wide uppercase">Open Dashboard</span>
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // 2. detail receipt & payment view
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
        {/* sidebar */}
        <div className="w-[280px] bg-[#00215e] flex flex-col items-center py-10 shrink-0 border-r border-[#2c4e80]">
          <Image src="/logo_emas.png" alt="Logo" width={100} height={100} />
          <h2 className="text-white font-extrabold text-4xl mt-6 mb-12 tracking-wider">Cashier</h2>
          
          <button 
            onClick={() => { setView('dashboard'); setSelectedOrder(null); }} 
            className="w-3/4 py-4 rounded-xl font-extrabold text-xl mb-6 shadow-lg bg-[#ffc55a] text-[#00215e] flex items-center justify-center transition-transform hover:scale-105"
          >
            <LayoutDashboard className="w-6 h-6 mr-3" /> Dashboard
          </button>
          
          <div className="mt-auto w-full flex flex-col items-center space-y-4">
             <button onClick={() => { setView('welcome'); setSelectedOrder(null); }} className="text-white font-bold text-xl flex items-center hover:text-[#ffc55a] transition-colors">
               <Home className="w-6 h-6 mr-3" /> Home
             </button>
          </div>
        </div>

        {/* main content area */}
        <div className="flex-1 bg-[#2c4e80] p-10 rounded-tl-[40px] shadow-[inset_10px_10px_20px_rgba(0,0,0,0.4)] flex flex-col relative">
          
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-white text-3xl font-extrabold tracking-wide">Order Processing</h3>
            <button onClick={() => setSelectedOrder(null)} className="text-white bg-[#00215e] px-6 py-2 rounded-lg font-bold hover:text-[#ffc55a] transition-colors shadow-md">
              Return to Dashboard
            </button>
          </div>

          <div className="flex flex-1 space-x-10 h-full pb-8">
             {/* receipt box */}
             <div className="flex-1 bg-[#ffc55a] p-10 rounded-2xl relative shadow-2xl text-[#00215e] font-serif flex flex-col overflow-hidden">
                {isPaid && (
                   <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none -rotate-12 z-0">
                     <Image src="/cap_biru.png" alt="Done Stamp" width={400} height={400} />
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
                      <p className="text-2xl tracking-widest font-extrabold">{isPaid ? selectedOrder.statusTagihan : paymentMethod}</p>
                    </div>
                  </div>

                  <div className="border-t-[3px] border-b-[3px] border-[#00215e] py-6 space-y-3 text-sm font-bold flex-1 overflow-y-auto">
                     {selectedOrder.detailPesanan.map(item => (
                        <div key={item.idDetail} className="flex justify-between items-start">
                          <span className="w-8">{item.jumlahPesanan}</span>
                          <span className="flex-1 pr-4">{item.menu.namaMenu}</span>
                          <span>Rp. {item.subtotal.toLocaleString('id-ID')}</span>
                        </div>
                     ))}
                  </div>

                  <div className="pt-6 text-sm font-bold w-full flex justify-end">
                    <div className="w-3/4 space-y-2">
                      <div className="flex justify-between"><span>Subtotal</span><span>Rp. {subtotal.toLocaleString('id-ID')}</span></div>
                      <div className="flex justify-between"><span>Tax (10%)</span><span>Rp. {tax.toLocaleString('id-ID')}</span></div>
                      <div className="flex justify-between"><span>Tip</span><span>Rp. {safeTip.toLocaleString('id-ID')}</span></div>
                      <div className="flex justify-between text-xl font-extrabold mt-3 border-t-[3px] border-[#00215e] pt-3">
                        <span>Total</span>
                        <span>Rp. {total.toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 text-center text-xs font-bold italic tracking-wide">
                    - Hope you enjoy your dining experience -
                  </div>
                </div>
             </div>

             {/* dynamic payment panel */}
             <div className="w-[450px] flex flex-col h-full bg-white rounded-2xl shadow-2xl p-8">
                
                {/* payment method toggle */}
                <div className="mb-8">
                  <label className="text-[#00215e] font-extrabold text-lg mb-3 block uppercase tracking-wider">Payment Method</label>
                  <div className="flex space-x-4">
                    <button 
                      onClick={() => setPaymentMethod('CASH')}
                      disabled={isPaid}
                      className={`flex-1 py-4 rounded-xl flex items-center justify-center font-bold text-lg border-2 transition-all ${paymentMethod === 'CASH' ? 'border-[#00215e] bg-[#00215e] text-white' : 'border-[#2c4e80]/30 text-[#2c4e80] hover:border-[#00215e]'}`}
                    >
                      <Banknote className="w-5 h-5 mr-2" /> Cash
                    </button>
                    <button 
                      onClick={() => setPaymentMethod('QRIS')}
                      disabled={isPaid}
                      className={`flex-1 py-4 rounded-xl flex items-center justify-center font-bold text-lg border-2 transition-all ${paymentMethod === 'QRIS' ? 'border-[#00215e] bg-[#00215e] text-white' : 'border-[#2c4e80]/30 text-[#2c4e80] hover:border-[#00215e]'}`}
                    >
                      <QrCode className="w-5 h-5 mr-2" /> QRIS
                    </button>
                  </div>
                </div>

                {/* conditional inputs based on selected method */}
                <div className="flex-1 space-y-6">
                  {paymentMethod === 'CASH' ? (
                     <>
                        <div className="flex flex-col">
                          <label className="text-[#2c4e80] font-bold text-sm mb-2 uppercase tracking-wide">Money Received</label>
                          <input 
                             type="number" 
                             value={moneyReceived}
                             onChange={(e) => setMoneyReceived(e.target.value)}
                             disabled={isPaid}
                             placeholder="0"
                             className="bg-gray-100 text-[#00215e] text-3xl p-5 font-extrabold rounded-xl focus:outline-none focus:ring-2 focus:ring-[#fc4100] transition-all w-full" 
                          />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-[#2c4e80] font-bold text-sm mb-2 uppercase tracking-wide">Tip Amount</label>
                          <input 
                             type="number" 
                             value={tip}
                             onChange={(e) => setTip(e.target.value)}
                             disabled={isPaid}
                             placeholder="0"
                             className="bg-gray-100 text-[#00215e] text-3xl p-5 font-extrabold rounded-xl focus:outline-none focus:ring-2 focus:ring-[#fc4100] transition-all w-full" 
                          />
                        </div>
                        <div className="flex flex-col mt-4 pt-4 border-t border-gray-200">
                          <label className="text-[#2c4e80] font-bold text-sm mb-2 uppercase tracking-wide">Change Due</label>
                          <div className="text-[#00215e] text-4xl font-extrabold">
                             Rp. {change.toLocaleString('id-ID')}
                          </div>
                        </div>
                     </>
                  ) : (
                     <div className="flex flex-col items-center justify-center h-full space-y-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                        <QrCode className="w-32 h-32 text-[#2c4e80] opacity-50" />
                        <p className="text-[#2c4e80] font-bold text-center px-6">
                           {isPaid ? "Payment has been captured." : "Please generate QR code on EDC terminal for the customer to scan."}
                        </p>
                     </div>
                  )}
                </div>

                <div className="mt-8">
                   <button 
                      onClick={() => handleConfirmPayment(selectedOrder)}
                      disabled={isPaid}
                      className={`w-full font-extrabold text-2xl uppercase tracking-widest text-center py-5 rounded-xl shadow-lg transition-all ${isPaid ? 'bg-[#588157] text-white cursor-default' : 'bg-[#fc4100] text-white hover:opacity-90 hover:scale-[1.02]'}`}
                   >
                      {isPaid ? 'Payment Complete' : 'Process Payment'}
                   </button>
                </div>

             </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // 3. unified cashier dashboard interface
  // ---------------------------------------------------------
  return (
    <div className="w-screen h-screen flex bg-[#00215e] font-sans">
      <div className="w-[280px] bg-[#00215e] flex flex-col items-center py-10 shrink-0 border-r border-[#2c4e80]">
        <Image src="/logo_emas.png" alt="Logo" width={100} height={100} />
        <h2 className="text-white font-extrabold text-4xl mt-6 mb-12 tracking-wider">Cashier</h2>
        
        <div className="w-3/4 py-4 rounded-xl font-extrabold text-xl mb-6 shadow-lg bg-[#ffc55a] text-[#00215e] flex items-center justify-center">
          <LayoutDashboard className="w-6 h-6 mr-3" /> Dashboard
        </div>
        
        <div className="mt-auto w-full flex flex-col items-center space-y-4">
           <button onClick={() => setView('welcome')} className="text-white font-bold text-xl flex items-center hover:text-[#ffc55a] transition-colors">
             <Home className="w-6 h-6 mr-3" /> Home
           </button>
        </div>
      </div>

      <div className="flex-1 bg-[#2c4e80] p-10 rounded-tl-[40px] shadow-[inset_10px_10px_20px_rgba(0,0,0,0.4)] flex flex-col">
        <h3 className="text-white text-3xl font-extrabold tracking-wide mb-8">Active Orders Overview</h3>
        
        <div className="flex-1 overflow-y-auto pr-4">
          <div className="flex space-x-4 mb-4">
            <div className="bg-[#00215e] w-40 text-white font-extrabold text-xl text-center py-4 rounded-xl shadow-md shrink-0 uppercase tracking-wide">
               Table
            </div>
            <div className="flex-1 bg-[#00215e] text-white font-extrabold text-xl text-left pl-10 py-4 rounded-xl shadow-md uppercase tracking-wide">
               Total Bill Amount
            </div>
            <div className="bg-[#00215e] w-56 text-white font-extrabold text-xl text-center py-4 rounded-xl shadow-md shrink-0 uppercase tracking-wide">
               Status
            </div>
          </div>

          <div className="space-y-4">
            {loading ? (
              <p className="text-center text-white font-bold mt-10 text-xl">Loading incoming orders...</p>
            ) : (
              listPesanan.map((pesanan) => {
                const isPaid = pesanan.statusTagihan === 'PAID';
                const subtotal = pesanan.detailPesanan.reduce((acc, item) => acc + item.subtotal, 0);
                const total = subtotal + (subtotal * 0.1); 
                
                return (
                  <div 
                    key={pesanan.noNota} 
                    onClick={() => setSelectedOrder(pesanan)}
                    className="flex space-x-4 items-center cursor-pointer hover:translate-x-2 transition-transform duration-300"
                  >
                    <div className="bg-[#00215e] w-40 text-[#ffc55a] font-extrabold text-4xl text-center py-6 rounded-xl shadow-md shrink-0">
                      {pesanan.noMeja}
                    </div>
                    <div className="flex-1 bg-white text-[#00215e] font-extrabold text-3xl text-left pl-10 py-6 rounded-xl shadow-md">
                      Rp. {total.toLocaleString('id-ID')}
                    </div>
                    <div className={`w-56 font-extrabold text-2xl text-center py-6 rounded-xl shadow-md uppercase tracking-widest shrink-0 ${
                        isPaid ? 'bg-[#588157] text-white' : 'bg-[#fc4100] text-white'
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
