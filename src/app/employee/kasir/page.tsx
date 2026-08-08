// unified cashier dashboard module interface
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, LogOut, Home, Banknote, QrCode, AlertCircle, CheckCircle2, Printer, Filter, User, CheckSquare, CreditCard } from 'lucide-react';

interface DetailPesanan {
  idDetail: string;
  jumlahPesanan: number;
  subtotal: number;
  catatan?: string;
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

// custom modal interface
interface ModalState {
  isOpen: boolean;
  type: 'alert' | 'confirm' | 'success';
  message: string;
  onConfirm?: () => void;
}

export default function KasirPage() {
  const router = useRouter();
  const [view, setView] = useState<'welcome' | 'dashboard'>('welcome');
  const [listPesanan, setListPesanan] = useState<Pesanan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedOrder, setSelectedOrder] = useState<Pesanan | null>(null);

  // added DEBIT to payment method state
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QRIS' | 'DEBIT'>('CASH');
  const [moneyReceived, setMoneyReceived] = useState<string>('');
  const [tip, setTip] = useState<string>('');

  // order filter state
  const [orderFilter, setOrderFilter] = useState<'ALL' | 'UNPAID' | 'PAID'>('ALL');

  // dynamic cashier details state (strict no mockup)
  const [cashierId, setCashierId] = useState<string>('');
  const [cashierName, setCashierName] = useState<string>('');

  // animation state for stamp
  const [showStamp, setShowStamp] = useState(false);

  // print log tracker per nota
  const [printLogs, setPrintLogs] = useState<Record<string, { count: number; lastPrinted: string }>>({});

  // custom modal state
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    type: 'alert',
    message: ''
  });

  useEffect(() => {
    // retrieve strictly logged in cashier info from localstorage (covering old and new keys to prevent null constraint errors)
    // enforce role security to prevent unauthorized access
    if (typeof window !== 'undefined') {
      const storedRole = localStorage.getItem('employeeRole') || localStorage.getItem('pegawai_role') || '';

      if (storedRole !== 'KASIR' && storedRole !== 'PEMILIK') {
        router.push('/employee/login');
        return;
      }

      const storedId = localStorage.getItem('pegawai_id') || localStorage.getItem('idPegawai') || localStorage.getItem('employeeId') || '';
      const storedName = localStorage.getItem('pegawai_nama') || localStorage.getItem('namaPegawai') || localStorage.getItem('employeeName') || 'Unknown Cashier';

      setCashierId(storedId);
      setCashierName(storedName);
    }
  }, [router]);

  useEffect(() => {
    // auto-polling feature setup
    let interval: NodeJS.Timeout;
    if (view === 'dashboard') {
      fetchOrders(true); // initial fetch with loading state

      // refresh active orders every 5 seconds seamlessly
      interval = setInterval(() => {
        fetchOrders(false);
      }, 5000);
    }

    return () => clearInterval(interval);
  }, [view]);

  // reset form and stamp animation when selecting a new order
  useEffect(() => {
    setMoneyReceived('');
    setTip('0');
    setPaymentMethod('CASH');

    if (selectedOrder?.statusTagihan === 'PAID') {
      // delay slightly for animation effect on load
      const timer = setTimeout(() => setShowStamp(true), 100);
      return () => clearTimeout(timer);
    } else {
      setShowStamp(false);
    }
  }, [selectedOrder]);

  // quick action hotkeys handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA';

      if (e.code === 'Space' && !isInput) {
        // prevent page scrolling on space press
        e.preventDefault();
        if (selectedOrder && selectedOrder.statusTagihan !== 'PAID' && selectedOrder.statusTagihan !== 'DONE' && !modal.isOpen) {
          handleConfirmPayment(selectedOrder);
        }
      } else if (e.key === 'Enter') {
        if (modal.isOpen && modal.type === 'confirm' && modal.onConfirm) {
          e.preventDefault();
          modal.onConfirm();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedOrder, modal, paymentMethod, moneyReceived, tip, cashierId]);

  async function fetchOrders(showLoading = true) {
    if (showLoading) setLoading(true);
    try {
      const res = await fetch('/api/pesanan');
      const data = await res.json();
      if (data.sukses || data.data) {
        setListPesanan(data.data || data);
      }
    } catch (err) {
      console.error('failed to fetch billing orders:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  // helper to show custom modal
  const showModal = (type: ModalState['type'], message: string, onConfirm?: () => void) => {
    setModal({ isOpen: true, type, message, onConfirm });
  };

  const closeModal = () => setModal((prev) => ({ ...prev, isOpen: false }));

  async function handleConfirmPayment(pesanan: Pesanan) {
    if (!cashierId) {
      showModal('alert', 'Cashier session not found. Please logout and login again.');
      return;
    }

    if (pesanan.statusTagihan === 'PAID' || pesanan.statusTagihan === 'DONE') return;

    const subtotal = pesanan.detailPesanan.reduce((acc, item) => acc + item.subtotal, 0);
    const totalBayar = subtotal + (subtotal * 0.1);

    if (paymentMethod === 'CASH') {
       const money = parseFloat(moneyReceived);
       if (isNaN(money) || money < totalBayar) {
         showModal('alert', 'Money received is insufficient to cover the total bill.');
         return;
       }
    }

    // show confirmation modal instead of native confirm
    showModal('confirm', `Confirm ${paymentMethod} payment for Table ${pesanan.noMeja}?`, async () => {
      closeModal();
      try {
        const res = await fetch('/api/pembayaran', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            noNota: pesanan.noNota,
            totalBayar,
            // correctly translate state to database matching strings
            metodePembayaran: paymentMethod === 'CASH' ? 'TUNAI' : paymentMethod,
            idPegawai: cashierId
          }),
        });

        let responseData = null;
        try {
          responseData = await res.json();
        } catch {
          responseData = null;
        }

        if (res.ok && (responseData?.sukses || responseData?.success || !responseData?.error)) {
          // trigger local update to show paid animation instantly
          setSelectedOrder((prev) => (prev ? { ...prev, statusTagihan: 'PAID' } : null));
          showModal('success', 'Payment processed successfully!');
          fetchOrders(false);
        } else {
          const errorMsg = responseData?.pesan || responseData?.error || responseData?.message || `Server error (${res.status}). Verify the database relations.`;
          showModal('alert', errorMsg);
        }
      } catch (err) {
        console.error('payment error:', err);
        showModal('alert', 'A network or system error occurred while processing the payment.');
      }
    });
  }

  async function handleMarkAsDone(pesanan: Pesanan) {
    showModal('confirm', 'Mark this order as done? It will be completely cleared from the active overview.', async () => {
      closeModal();
      try {
        const res = await fetch('/api/pesanan', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ noNota: pesanan.noNota, statusTagihan: 'DONE' })
        });

        if (res.ok) {
          setSelectedOrder(null);
          fetchOrders(false);
        } else {
          showModal('alert', 'Failed to update order status to done.');
        }
      } catch (err) {
        console.error('error updating status:', err);
        showModal('alert', 'A network error occurred while updating the status.');
      }
    });
  }

  const handlePrintReceipt = (noNota: string) => {
    const now = new Date().toLocaleString('en-GB');
    setPrintLogs(prev => {
      const currentCount = prev[noNota]?.count || 0;
      return {
        ...prev,
        [noNota]: { count: currentCount + 1, lastPrinted: now }
      };
    });

    setTimeout(() => {
      window.print();
    }, 100);
  };

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('pegawai_id');
      localStorage.removeItem('pegawai_nama');
      localStorage.removeItem('idPegawai');
      localStorage.removeItem('namaPegawai');
      localStorage.removeItem('employeeId');
      localStorage.removeItem('employeeName');
      localStorage.removeItem('employeeRole');
    }
    router.push('/employee/login');
  }

  // apply filter to orders and completely remove DONE status from active list
  const filteredOrders = listPesanan.filter((pesanan) => {
    if (pesanan.statusTagihan === 'DONE') return false;

    if (orderFilter === 'ALL') return true;
    if (orderFilter === 'PAID') return pesanan.statusTagihan === 'PAID';
    if (orderFilter === 'UNPAID') return pesanan.statusTagihan !== 'PAID';
    return true;
  });

  // ---------------------------------------------------------
  // 0. custom modal component
  // ---------------------------------------------------------
  const renderModal = () => {
    if (!modal.isOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300 print:hidden">
        <div className="bg-[#2c4e80] rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl border border-[#ffc55a]/20 animate-in zoom-in-95 duration-200">
          <div className="flex flex-col items-center text-center">
            {modal.type === 'success' && <CheckCircle2 className="w-16 h-16 text-green-400 mb-4" />}
            {modal.type === 'alert' && <AlertCircle className="w-16 h-16 text-[#fc4100] mb-4" />}
            {modal.type === 'confirm' && <AlertCircle className="w-16 h-16 text-[#ffc55a] mb-4" />}

            <h3 className="text-white text-xl font-bold mb-2">
              {modal.type === 'success' ? 'Success' : modal.type === 'confirm' ? 'Confirmation' : 'Attention'}
            </h3>
            <p className="text-gray-200 mb-8">{modal.message}</p>

            <div className="flex space-x-3 w-full">
              {modal.type === 'confirm' ? (
                <>
                  <button onClick={closeModal} className="flex-1 py-3 rounded-xl font-bold text-[#00215e] bg-gray-200 hover:bg-gray-300 transition-colors">
                    Cancel
                  </button>
                  <button onClick={modal.onConfirm} className="flex-1 py-3 rounded-xl font-bold text-white bg-[#fc4100] hover:bg-red-600 transition-colors">
                    Confirm
                  </button>
                </>
              ) : (
                <button onClick={closeModal} className="w-full py-3 rounded-xl font-bold text-[#00215e] bg-[#ffc55a] hover:bg-yellow-400 transition-colors">
                  Close
                </button>
              )}
            </div>

            {modal.type === 'confirm' && (
              <p className="text-center text-[10px] text-[#ffc55a]/80 mt-4 font-bold uppercase tracking-widest">
                Hotkey: Press <span className="bg-black/30 px-1 rounded">Enter</span> to confirm
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------
  // 1. welcome screen view
  // ---------------------------------------------------------
  if (view === 'welcome') {
    return (
      <div className="w-screen h-screen bg-gradient-to-br from-[#00215e] to-[#2c4e80] flex items-center justify-center font-sans relative">
        <div className="absolute top-6 right-6">
           <button onClick={handleLogout} className="bg-[#fc4100] px-5 py-2.5 rounded-xl font-extrabold hover:bg-[#ffc55a] hover:text-[#00215e] transition-colors text-white shadow-md tracking-wider flex items-center">
             <LogOut className="w-5 h-5 mr-2" /> Logout
           </button>
        </div>

        <div className="flex flex-col items-center w-full max-w-[500px] px-4">
          <div className="flex flex-col items-center mb-6">
            <Image src="/logo_emas.png" alt="RestoLink Logo" width={110} height={110} className="object-contain drop-shadow-lg mb-2" priority />
            <h1 className="text-4xl font-extrabold text-white tracking-wider mt-2 drop-shadow-md">
              RESTO<span className="text-[#ffc55a]">LINK</span>
            </h1>
            <div className="bg-[#2c4e80] text-white text-xs font-bold tracking-widest mt-3 px-6 py-1.5 rounded-full shadow-md uppercase">
              Cashier Portal
            </div>
            {/* active cashier profile display */}
            <div className="mt-4 flex items-center bg-[#00215e]/80 border border-[#ffc55a]/30 px-4 py-2 rounded-xl text-white text-sm shadow-inner">
              <User className="w-4 h-4 text-[#ffc55a] mr-2" />
              <span className="text-gray-300 mr-1">Active Cashier:</span>
              <span className="font-extrabold text-[#ffc55a]">{cashierName}</span>
              <span className="text-xs text-gray-400 ml-1.5">({cashierId || 'No ID'})</span>
            </div>
          </div>

          <div className="bg-[#2c4e80] w-full p-10 rounded-2xl shadow-2xl flex justify-center border border-[#ffc55a]/10">
            <button onClick={() => setView('dashboard')} className="bg-white text-[#00215e] p-6 rounded-xl flex flex-col items-center w-48 h-40 justify-center shadow-lg hover:bg-[#ffc55a] transition-all hover:-translate-y-1">
              <LayoutDashboard className="w-14 h-14 mb-3" />
              <span className="font-extrabold text-lg text-center leading-tight">Open<br />Dashboard</span>
            </button>
          </div>
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
      <div className="w-screen h-screen flex bg-[#00215e] font-sans overflow-hidden print:bg-white print:h-auto print:overflow-visible">
        {renderModal()}

        <div className="w-[280px] bg-[#00215e] flex flex-col items-center py-10 shrink-0 border-r border-[#2c4e80] print:hidden">
          <Image src="/logo_emas.png" alt="Logo" width={100} height={100} />
          <h2 className="text-white font-extrabold text-4xl mt-6 mb-3 tracking-wider">Cashier</h2>

          {/* cashier profile badge in sidebar */}
          <div className="mb-8 flex items-center bg-[#2c4e80]/60 border border-[#ffc55a]/20 px-3 py-1.5 rounded-lg text-xs text-white">
            <User className="w-3.5 h-3.5 text-[#ffc55a] mr-1.5 shrink-0" />
            <span className="font-semibold truncate">{cashierName}</span>
          </div>

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

        <div className="flex-1 bg-[#2c4e80] p-8 rounded-tl-[40px] shadow-[inset_10px_10px_20px_rgba(0,0,0,0.4)] flex flex-col relative h-full print:p-0 print:bg-transparent print:shadow-none print:rounded-none">
          <div className="flex justify-between items-center mb-6 print:hidden">
            <h3 className="text-white text-3xl font-extrabold tracking-wide">Order Processing</h3>
            <button onClick={() => setSelectedOrder(null)} className="text-white bg-[#00215e] px-6 py-2 rounded-lg font-bold hover:text-[#ffc55a] transition-colors shadow-md">
              Return to Dashboard
            </button>
          </div>

          <div className="flex flex-1 space-x-8 pb-4 h-[calc(100%-80px)] print:space-x-0 print:block">
             <div className="flex-1 bg-[#ffc55a] p-6 rounded-2xl relative shadow-2xl text-[#00215e] font-serif flex flex-col overflow-hidden print:shadow-none print:bg-white print:border-none print:text-black">
                {/* stamp animation logic */}
                {isPaid && (
                   <div className={`absolute inset-0 flex items-center justify-center pointer-events-none -rotate-12 z-0 transition-all duration-500 ease-out transform ${showStamp ? 'scale-100 opacity-30' : 'scale-150 opacity-0'} print:opacity-40`}>
                     <Image src="/cap_biru.png" alt="Done Stamp" width={400} height={400} />
                   </div>
                )}

                <div className="relative z-10 flex flex-col h-full print:h-auto">
                  <div className="flex justify-center mb-4">
                    <Image src="/logo.png" alt="logo" width={60} height={60} className="object-contain" />
                  </div>

                  <div className="flex justify-between text-sm font-bold mb-3">
                    <div>
                      <p>Table #{selectedOrder.noMeja}</p>
                      <p>Customer: {selectedOrder.pelanggan?.namaPelanggan || 'Guest'}</p>
                      <p>Date : {orderDate}</p>
                      <p>Serve : {cashierName} ({cashierId || '-'})</p>
                    </div>
                    <div className="text-right flex items-end">
                      <p className="text-xl tracking-widest font-extrabold">{isPaid ? selectedOrder.statusTagihan : paymentMethod}</p>
                    </div>
                  </div>

                  <div className="border-t-[3px] border-b-[3px] border-[#00215e] print:border-black py-3 space-y-2 text-sm font-bold flex-1 overflow-y-auto [scrollbar-width:thin] print:overflow-visible">
                     {selectedOrder.detailPesanan.map((item) => (
                        <div key={item.idDetail} className="flex justify-between items-start">
                          <span className="w-8">{item.jumlahPesanan}</span>
                          <span className="flex-1 pr-4">
                            {item.menu.namaMenu}
                            {/* display optional note for clarity on receipt */}
                            {item.catatan && <span className="block text-xs font-normal text-[#00215e]/70 italic mt-0.5 print:text-gray-700">- {item.catatan}</span>}
                          </span>
                          <span>Rp. {item.subtotal.toLocaleString('id-ID')}</span>
                        </div>
                     ))}
                  </div>

                  <div className="pt-4 text-sm font-bold w-full flex justify-end shrink-0">
                    <div className="w-3/4 space-y-1.5">
                      <div className="flex justify-between"><span>Subtotal</span><span>Rp. {subtotal.toLocaleString('id-ID')}</span></div>
                      <div className="flex justify-between"><span>Tax (10%)</span><span>Rp. {tax.toLocaleString('id-ID')}</span></div>
                      {isPaid && paymentMethod === 'CASH' && (
                        <div className="flex justify-between"><span>Tip</span><span>Rp. {safeTip.toLocaleString('id-ID')}</span></div>
                      )}
                      <div className="flex justify-between text-lg font-extrabold mt-2 border-t-[3px] border-[#00215e] print:border-black pt-2">
                        <span>Total</span>
                        <span>Rp. {total.toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  </div>

                  {/* receipt log info to avoid dual print fraud */}
                  {isPaid && printLogs[selectedOrder.noNota] && (
                    <div className="mt-4 text-center text-xs text-[#00215e]/70 print:text-black font-bold border-t border-dashed border-[#00215e]/30 pt-2 shrink-0">
                      Print Log: {printLogs[selectedOrder.noNota].count}x (Last: {printLogs[selectedOrder.noNota].lastPrinted})
                    </div>
                  )}

                  <div className="mt-4 text-center text-xs font-bold italic tracking-wide shrink-0">
                    - Hope you enjoy your dining experience -
                  </div>

                  {/* print receipt button, hidden on actual print via css */}
                  {isPaid && (
                    <button
                      onClick={() => handlePrintReceipt(selectedOrder.noNota)}
                      className="mt-6 mx-auto w-3/4 py-3 rounded-xl font-bold text-white bg-[#00215e] hover:bg-[#1a3863] transition-colors flex items-center justify-center print:hidden shadow-lg z-20 relative"
                    >
                      <Printer className="w-5 h-5 mr-2" /> Print Receipt
                    </button>
                  )}
                </div>
             </div>

             {/* payment panel, fully hidden during print */}
             <div className="w-[420px] flex flex-col h-full bg-white rounded-2xl shadow-2xl p-6 relative print:hidden">
                <div className="mb-4 shrink-0">
                  <label className="text-[#00215e] font-extrabold text-base mb-2 block uppercase tracking-wider">Payment Method</label>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setPaymentMethod('CASH')}
                      disabled={isPaid}
                      className={`flex-1 py-3 rounded-xl flex items-center justify-center font-bold text-sm border-2 transition-all ${paymentMethod === 'CASH' ? 'border-[#00215e] bg-[#00215e] text-white' : 'border-[#2c4e80]/30 text-[#2c4e80] hover:border-[#00215e]'}`}
                    >
                      <Banknote className="w-4 h-4 mr-1.5" /> Cash
                    </button>
                    <button
                      onClick={() => setPaymentMethod('QRIS')}
                      disabled={isPaid}
                      className={`flex-1 py-3 rounded-xl flex items-center justify-center font-bold text-sm border-2 transition-all ${paymentMethod === 'QRIS' ? 'border-[#00215e] bg-[#00215e] text-white' : 'border-[#2c4e80]/30 text-[#2c4e80] hover:border-[#00215e]'}`}
                    >
                      <QrCode className="w-4 h-4 mr-1.5" /> QRIS
                    </button>
                    <button
                      onClick={() => setPaymentMethod('DEBIT')}
                      disabled={isPaid}
                      className={`flex-1 py-3 rounded-xl flex items-center justify-center font-bold text-sm border-2 transition-all ${paymentMethod === 'DEBIT' ? 'border-[#00215e] bg-[#00215e] text-white' : 'border-[#2c4e80]/30 text-[#2c4e80] hover:border-[#00215e]'}`}
                    >
                      <CreditCard className="w-4 h-4 mr-1.5" /> Debit
                    </button>
                  </div>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto [scrollbar-width:thin]">
                  {paymentMethod === 'CASH' ? (
                     <>
                        <div className="flex flex-col">
                          <label className="text-[#2c4e80] font-bold text-xs mb-1 uppercase tracking-wide">Money Received</label>
                          <input
                             type="number"
                             value={moneyReceived}
                             onChange={(e) => setMoneyReceived(e.target.value)}
                             disabled={isPaid}
                             placeholder="0"
                             className="bg-gray-100 text-[#00215e] text-2xl p-3 font-extrabold rounded-xl focus:outline-none focus:ring-2 focus:ring-[#fc4100] transition-all w-full"
                          />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-[#2c4e80] font-bold text-xs mb-1 uppercase tracking-wide">Tip Amount</label>
                          <input
                             type="number"
                             value={tip}
                             onChange={(e) => setTip(e.target.value)}
                             disabled={isPaid}
                             placeholder="0"
                             className="bg-gray-100 text-[#00215e] text-2xl p-3 font-extrabold rounded-xl focus:outline-none focus:ring-2 focus:ring-[#fc4100] transition-all w-full"
                          />
                        </div>
                        <div className="flex flex-col mt-2 pt-3 border-t border-gray-200">
                          <label className="text-[#2c4e80] font-bold text-xs mb-1 uppercase tracking-wide">Change Due</label>
                          <div className="text-[#00215e] text-3xl font-extrabold truncate">
                             Rp. {change.toLocaleString('id-ID')}
                          </div>
                        </div>
                     </>
                  ) : paymentMethod === 'QRIS' ? (
                     <div className="flex flex-col items-center justify-center h-full space-y-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 py-6">
                        <QrCode className="w-24 h-24 text-[#2c4e80] opacity-50" />
                        <p className="text-[#2c4e80] font-bold text-center px-4 text-sm">
                           {isPaid ? "Payment has been captured." : "Please generate QR code on EDC terminal for the customer to scan."}
                        </p>
                     </div>
                  ) : (
                     <div className="flex flex-col items-center justify-center h-full space-y-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 py-6">
                        <CreditCard className="w-24 h-24 text-[#2c4e80] opacity-50" />
                        <p className="text-[#2c4e80] font-bold text-center px-4 text-sm">
                           {isPaid ? "Payment has been captured." : "Please swipe or insert Debit Card into the EDC terminal."}
                        </p>
                     </div>
                  )}
                </div>

                <div className="mt-4 shrink-0 flex flex-col space-y-2">
                   {!isPaid ? (
                     <>
                       <button
                          onClick={() => handleConfirmPayment(selectedOrder)}
                          className="w-full font-extrabold text-lg uppercase tracking-widest text-center py-4 rounded-xl shadow-lg transition-all bg-[#fc4100] text-white hover:opacity-90 hover:scale-[1.02]"
                       >
                          Process Payment
                       </button>
                       <p className="text-center text-[10px] text-[#00215e] font-bold tracking-widest uppercase">
                         Hotkey: Press <span className="bg-[#fc4100]/20 px-1 rounded">Space</span> to pay
                       </p>
                     </>
                   ) : (
                     <button
                        onClick={() => handleMarkAsDone(selectedOrder)}
                        className="w-full font-extrabold text-lg uppercase tracking-widest text-center py-4 rounded-xl shadow-lg transition-all bg-[#588157] text-white hover:opacity-90 hover:scale-[1.02] flex items-center justify-center"
                     >
                        <CheckSquare className="w-5 h-5 mr-2" /> Mark as Done
                     </button>
                   )}
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
    <div className="w-screen h-screen flex bg-[#00215e] font-sans overflow-hidden">
      <div className="w-[280px] bg-[#00215e] flex flex-col items-center py-10 shrink-0 border-r border-[#2c4e80]">
        <Image src="/logo_emas.png" alt="Logo" width={100} height={100} />
        <h2 className="text-white font-extrabold text-4xl mt-6 mb-3 tracking-wider">Cashier</h2>

        {/* cashier profile badge in sidebar */}
        <div className="mb-8 flex items-center bg-[#2c4e80]/60 border border-[#ffc55a]/20 px-3 py-1.5 rounded-lg text-xs text-white">
          <User className="w-3.5 h-3.5 text-[#ffc55a] mr-1.5 shrink-0" />
          <span className="font-semibold truncate">{cashierName}</span>
        </div>

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
        <div className="flex justify-between items-center mb-8 shrink-0">
          <h3 className="text-white text-3xl font-extrabold tracking-wide">Active Orders Overview</h3>

          {/* status filter buttons */}
          <div className="flex space-x-2 bg-[#00215e] p-1.5 rounded-xl shadow-md border border-[#ffc55a]/20">
            <button
              onClick={() => setOrderFilter('ALL')}
              className={`px-5 py-2 rounded-lg font-bold text-sm transition-all flex items-center ${orderFilter === 'ALL' ? 'bg-[#ffc55a] text-[#00215e] shadow-sm' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}
            >
              <Filter className="w-4 h-4 mr-2" /> Show All
            </button>
            <button
              onClick={() => setOrderFilter('UNPAID')}
              className={`px-5 py-2 rounded-lg font-bold text-sm transition-all ${orderFilter === 'UNPAID' ? 'bg-[#fc4100] text-white shadow-sm' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}
            >
              Unpaid
            </button>
            <button
              onClick={() => setOrderFilter('PAID')}
              className={`px-5 py-2 rounded-lg font-bold text-sm transition-all ${orderFilter === 'PAID' ? 'bg-[#588157] text-white shadow-sm' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}
            >
              Paid
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex space-x-4 mb-4 pr-2">
            <div className="bg-[#00215e] w-32 text-white font-extrabold text-lg text-center py-4 rounded-xl shadow-md shrink-0 uppercase tracking-wide">
               Table
            </div>
            <div className="bg-[#00215e] w-64 text-white font-extrabold text-lg text-left pl-6 py-4 rounded-xl shadow-md shrink-0 uppercase tracking-wide">
               Customer
            </div>
            <div className="flex-1 bg-[#00215e] text-white font-extrabold text-lg text-left pl-6 py-4 rounded-xl shadow-md uppercase tracking-wide">
               Total Bill Amount
            </div>
            <div className="bg-[#00215e] w-48 text-white font-extrabold text-lg text-center py-4 rounded-xl shadow-md shrink-0 uppercase tracking-wide">
               Status
            </div>
          </div>

          <div className="space-y-4 overflow-y-auto pr-2 pb-4 [scrollbar-width:thin]">
            {loading ? (
              <p className="text-center text-white font-bold mt-10 text-xl">Loading incoming orders...</p>
            ) : filteredOrders.length === 0 ? (
              <p className="text-center text-white/70 font-bold mt-10 text-xl italic">No active orders found.</p>
            ) : (
              filteredOrders.map((pesanan) => {
                const isPaid = pesanan.statusTagihan === 'PAID';
                const subtotal = pesanan.detailPesanan.reduce((acc, item) => acc + item.subtotal, 0);
                const total = subtotal + (subtotal * 0.1);

                return (
                  <div
                    key={pesanan.noNota}
                    onClick={() => setSelectedOrder(pesanan)}
                    className="flex space-x-4 items-stretch cursor-pointer hover:translate-x-2 transition-transform duration-300"
                  >
                    <div className="bg-[#00215e] w-32 text-[#ffc55a] font-extrabold text-3xl flex items-center justify-center py-4 rounded-xl shadow-md shrink-0">
                      {pesanan.noMeja}
                    </div>
                    <div className="bg-white w-64 text-[#00215e] font-extrabold text-xl flex items-center text-left pl-6 py-4 rounded-xl shadow-md shrink-0 truncate">
                      {pesanan.pelanggan?.namaPelanggan || 'Guest'}
                    </div>
                    <div className="flex-1 bg-white text-[#00215e] font-extrabold text-2xl flex items-center text-left pl-6 py-4 rounded-xl shadow-md">
                      Rp. {total.toLocaleString('id-ID')}
                    </div>
                    <div className={`w-48 font-extrabold text-xl flex items-center justify-center py-4 rounded-xl shadow-md uppercase tracking-widest shrink-0 ${
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
