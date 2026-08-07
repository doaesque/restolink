// customer interface matched with figma design, using dynamic database menu and categories
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { X, ChevronDown, CheckCircle, ShoppingBag, Receipt, ArrowRight } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface MenuData {
  id: string;
  namaMenu: string;
  kategori?: string;
  subKategori?: string;
  harga: number;
  image?: string | null;
}

interface TableData {
  noMeja: number;
  status: string;
}

interface ActiveOrderItem {
  namaMenu: string;
  qty: number;
  subtotal: number;
}

function CustomerOrderContent() {
  const searchParams = useSearchParams();
  // get table number from url query (e.g. ?table=5), default to 1
  const tableParam = searchParams?.get('table');

  const [showWelcome, setShowWelcome] = useState(true);
  const [menus, setMenus] = useState<MenuData[]>([]);
  const [tables, setTables] = useState<TableData[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [cart, setCart] = useState<{ id: string; qty: number }[]>([]);
  
  // session state for table orders
  const [activeOrders, setActiveOrders] = useState<ActiveOrderItem[]>([]);
  const [currentNota, setCurrentNota] = useState<string | null>(null);

  // modal and view states
  const [expandedCategory, setExpandedCategory] = useState<'FOOD' | 'DRINKS' | null>(null);
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  const [modalState, setModalState] = useState<'NONE' | 'WHEN' | 'METHOD'>('NONE');
  const [receiptType, setReceiptType] = useState<'CASH' | 'CASHLESS' | null>(null);
  const [cashlessStep, setCashlessStep] = useState<'RECEIPT' | 'QRIS'>('RECEIPT');
  const [isPaid, setIsPaid] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<'UNPAID' | 'CASH' | 'CASHLESS' | null>(null);
  const [isOrdering, setIsOrdering] = useState(false);

  // fetch tables from database safely
  useEffect(() => {
    async function fetchTables() {
      try {
        const res = await fetch(`/api/meja?t=${new Date().getTime()}`, { cache: 'no-store' });
        const data = await res.json();
        if (Array.isArray(data)) {
          setTables(data);
        } else if (data && data.data) {
          setTables(data.data);
        }
      } catch (err) {
        console.error('failed to fetch tables:', err);
      }
    }
    fetchTables();
  }, []);

  // initialize selected table from url if exists
  useEffect(() => {
    if (tableParam) {
      setSelectedTable(tableParam);
    }
  }, [tableParam]);

  // fetch menu from database safely and bypass cache
  useEffect(() => {
    async function fetchMenu() {
      try {
        const res = await fetch(`/api/menu?t=${new Date().getTime()}`, { cache: 'no-store' });
        const data = await res.json();
        
        if (Array.isArray(data)) {
          setMenus(data);
        } else if (data && data.data) {
          setMenus(data.data);
        }
      } catch (err) {
        console.error('failed to fetch menu:', err);
      }
    }
    fetchMenu();
  }, []);

  // extract dynamic subcategories from fetched menu data
  const dynamicSubcategories = {
    FOOD: Array.from(new Set(menus.filter(m => m.kategori === 'FOOD' && m.subKategori).map(m => m.subKategori as string))),
    DRINKS: Array.from(new Set(menus.filter(m => m.kategori === 'DRINKS' && m.subKategori).map(m => m.subKategori as string)))
  };

  // auto-select subcategory when menus load or category expands
  useEffect(() => {
    if (expandedCategory && menus.length > 0) {
      const availableSubs = Array.from(new Set(menus.filter(m => m.kategori === expandedCategory && m.subKategori).map(m => m.subKategori as string)));
      
      setActiveSubcategory((prev) => {
        if (!prev || !availableSubs.includes(prev)) {
          return availableSubs.length > 0 ? availableSubs[0] : null;
        }
        return prev;
      });
    }
  }, [expandedCategory, menus]);

  // handle add to cart
  const addToCart = (id: string, change: number) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === id);
      if (existing) {
        const newQty = existing.qty + change;
        if (newQty <= 0) return prev.filter((item) => item.id !== id);
        return prev.map((item) => (item.id === id ? { ...item, qty: newQty } : item));
      }
      if (change > 0) return [...prev, { id, qty: 1 }];
      return prev;
    });
  };

  // calculate totals for current cart
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = cart.reduce((sum, item) => {
    const menuItem = menus.find((m) => m.id === item.id);
    return sum + (menuItem?.harga || 0) * item.qty;
  }, 0);
  const tax = subtotal * 0.1; 
  const totalPrice = subtotal + tax;

  // unique random qr code value generator per transaction
  const qrPaymentData = `restolink-qr-${currentNota || Date.now()}-tbl${selectedTable}-amt${totalPrice}`;

  // order checkout process saving to database
  const handleOrder = async (statusTagihan: 'PAID' | 'UNPAID', paymentMethod?: 'CASH' | 'CASHLESS') => {
    setIsOrdering(true);

    try {
      const payload = {
        idPelanggan: 'Guest', 
        idPegawai: 'KASIR-001', 
        jumlahOrang: 2,
        noMeja: parseInt(selectedTable, 10) || 1,
        items: cart.map(item => {
          const m = menus.find(x => x.id === item.id)!;
          return {
            idMenu: item.id,
            jumlahPesanan: item.qty,
            subtotal: m.harga * item.qty
          };
        })
      };

      const res = await fetch('/api/pesanan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      const generatedNota = result.noNota || result.id || `NOTA-${Date.now()}`;
      setCurrentNota(generatedNota);

      if (result.sukses || result.id || result.noNota) { 
        // accumulate items to active table session
        const newItems: ActiveOrderItem[] = cart.map(item => {
          const m = menus.find(x => x.id === item.id)!;
          return {
            namaMenu: m.namaMenu,
            qty: item.qty,
            subtotal: m.harga * item.qty
          };
        });
        setActiveOrders(prev => [...prev, ...newItems]);

        if (statusTagihan === 'UNPAID') {
           setModalState('NONE');
           setOrderSuccess('UNPAID');
           setCart([]); // clear cart for new selections in same session
        } else if (paymentMethod) {
           setModalState('NONE');
           setReceiptType(paymentMethod);
           setCashlessStep('RECEIPT'); // always show yellow receipt first
           setIsPaid(false);
        }
      } else {
        alert(result.pesan || 'Failed to process order. Please try again.');
      }
    } catch (err) {
      console.error('order submission error:', err);
      alert('System error. Please try again.');
    } finally {
      setIsOrdering(false);
    }
  };

  // handle finish payment flow (shows stamp then opens success modal)
  const completePayment = (method: 'CASH' | 'CASHLESS') => {
    setIsPaid(true);
    // timeout adjusted to clearly show the large stamp before proceeding
    setTimeout(() => {
      setOrderSuccess(method);
    }, 2500);
  };

  const resetFlow = () => {
    setCart([]);
    setActiveOrders([]);
    setCurrentNota(null);
    setExpandedCategory(null);
    setActiveSubcategory(null);
    setModalState('NONE');
    setReceiptType(null);
    setCashlessStep('RECEIPT');
    setIsPaid(false);
    setOrderSuccess(null);
    setShowWelcome(true);
  };

  const continueOrderingSession = () => {
    setOrderSuccess(null);
    setReceiptType(null);
    setCashlessStep('RECEIPT');
    setModalState('NONE');
    setCart([]); // ready for next order in active session
  };

  const handleCategoryClick = (category: 'FOOD' | 'DRINKS') => {
    if (expandedCategory === category) {
      setExpandedCategory(null);
      setActiveSubcategory(null);
    } else {
      setExpandedCategory(category);
      if (dynamicSubcategories[category] && dynamicSubcategories[category].length > 0) {
        setActiveSubcategory(dynamicSubcategories[category][0]);
      }
    }
  };

  const orderDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const displayedMenus = menus.filter(
    m => m.kategori === expandedCategory && (!activeSubcategory || m.subKategori === activeSubcategory)
  );

  // ---------------------------------------------------------
  // view rendering logic
  // ---------------------------------------------------------
  let viewContent;

  if (showWelcome) {
    viewContent = (
      <div className="relative w-screen h-screen bg-black font-serif overflow-hidden flex items-center justify-center">
        {/* background image with reddish overlay */}
        <div className="absolute inset-0 z-0">
          <Image src="/background.png" alt="Restaurant Background" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-[#fc4100]/25 mix-blend-multiply pointer-events-none"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center space-y-12">
          <Image src="/logo_emas.png" alt="RestoLink Logo" width={320} height={320} className="drop-shadow-2xl object-contain" priority />
          
          {/* beautified dynamic table selection */}
          <div className="flex flex-col items-center space-y-5 w-80">
            <div className="relative w-full group">
              <select 
                value={selectedTable} 
                onChange={(e) => setSelectedTable(e.target.value)}
                className="w-full bg-[#00215e]/90 text-[#ffc55a] border-2 border-[#ffc55a] p-4 rounded-xl font-bold tracking-widest text-center appearance-none focus:outline-none shadow-[0_0_15px_rgba(255,197,90,0.15)] group-hover:shadow-[0_0_25px_rgba(255,197,90,0.3)] transition-all cursor-pointer text-lg"
              >
                <option value="" disabled>SELECT TABLE</option>
                {tables.map(t => (
                  <option key={t.noMeja} value={t.noMeja} className="bg-[#00215e] text-[#ffc55a]">Table {t.noMeja}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-[#ffc55a] pointer-events-none w-6 h-6" />
            </div>

            <button 
              onClick={() => setShowWelcome(false)}
              disabled={!selectedTable}
              className="w-full bg-[#00215e] border-2 border-[#ffc55a] text-[#ffc55a] px-8 py-4 rounded-xl text-3xl font-bold tracking-widest hover:bg-[#ffc55a] hover:text-[#00215e] transition-all shadow-2xl uppercase disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ORDER
            </button>
          </div>
        </div>
      </div>
    );
  } else if (receiptType) {
    viewContent = (
      <div className="relative w-screen h-screen bg-black font-serif overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <Image src="/background.png" alt="Restaurant Background" fill className="object-cover opacity-30" />
          <div className="absolute inset-0 bg-[#fc4100]/20 mix-blend-multiply pointer-events-none"></div>
        </div>

        {/* yellow centered receipt for cash and step 1 of cashless */}
        {(receiptType === 'CASH' || (receiptType === 'CASHLESS' && cashlessStep === 'RECEIPT')) && (
          <div className="relative z-10 bg-[#ffc55a] text-[#00215e] w-[450px] p-8 rounded-xl shadow-2xl border-4 border-[#00215e]/10 animate-in fade-in zoom-in duration-300">
            {/* huge stamp image overlay when paid */}
            {isPaid && receiptType === 'CASH' && (
              <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none overflow-visible">
                <Image src="/cap_biru.png" alt="Paid Stamp" width={350} height={350} className="transform -rotate-12 opacity-90 drop-shadow-xl animate-in zoom-in-50 duration-200" />
              </div>
            )}

            <div className="flex justify-center mb-6">
              <Image src="/logo.png" alt="RestoLink Logo" width={80} height={80} className="object-contain drop-shadow-md" />
            </div>
            
            <div className="flex justify-between text-sm font-bold mb-4 tracking-wide">
              <div>
                <p>Table #{selectedTable}</p>
                <p>Date : {orderDate}</p>
                <p>Serve : Cashier</p>
              </div>
              <div className="flex items-end">
                <p className="text-xl tracking-widest uppercase">{receiptType}</p>
              </div>
            </div>

            <div className="border-t-[3px] border-b-[3px] border-[#00215e] py-4 space-y-2 text-xs font-bold tracking-wider mb-4">
              {cart.map(item => {
                const m = menus.find(x => x.id === item.id);
                if (!m) return null;
                return (
                  <div key={item.id} className="flex justify-between">
                    <span className="w-8">{item.qty}</span>
                    <span className="flex-1 uppercase truncate">{m.namaMenu}</span>
                    <span>Rp. {(m.harga * item.qty).toLocaleString('id-ID')}</span>
                  </div>
                );
              })}
            </div>

            <div className="w-4/5 ml-auto space-y-1 text-xs font-bold tracking-widest">
               <div className="flex justify-between"><span>Subtotal</span><span>Rp. {subtotal.toLocaleString('id-ID')}</span></div>
               <div className="flex justify-between"><span>Tax (10%)</span><span>Rp. {tax.toLocaleString('id-ID')}</span></div>
               <div className="flex justify-between"><span>Tip</span><span>Rp. 0</span></div>
               <div className="flex justify-between text-lg mt-2 border-t-[3px] border-[#00215e] pt-2">
                 <span>Total</span>
                 <span>Rp. {totalPrice.toLocaleString('id-ID')}</span>
               </div>
            </div>

            <div className="mt-8 text-center font-bold">
               {receiptType === 'CASH' ? (
                 <p className="text-sm tracking-wide">Please proceed to the cashier to complete your payment and show your receipt.</p>
               ) : (
                 <p className="text-sm tracking-wide">Please proceed to the next step to complete your payment.</p>
               )}
               <p className="text-[10px] italic mt-3 opacity-80">-Hope you Enjoy Your Dinner-</p>
            </div>

            {receiptType === 'CASH' ? (
              <button onClick={() => completePayment('CASH')} className="mt-6 w-full bg-[#00215e] text-[#ffc55a] py-3 rounded-lg font-bold tracking-widest hover:opacity-90 transition-opacity relative z-40">
                FINISH
              </button>
            ) : (
              <button onClick={() => setCashlessStep('QRIS')} className="mt-6 w-full bg-[#00215e] text-[#ffc55a] py-3 rounded-lg font-bold tracking-widest hover:opacity-90 transition-opacity relative z-40 flex items-center justify-center space-x-2">
                <span>ORDER NOW</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* cashless split screen (step 2: dark receipt + qris box) */}
        {receiptType === 'CASHLESS' && cashlessStep === 'QRIS' && (
          <div className="relative z-10 flex items-center space-x-10 animate-in fade-in slide-in-from-bottom-8 duration-300">
            
            {/* dark receipt for cashless on the left */}
            <div className="relative bg-[#111111]/90 text-[#ffc55a] w-[450px] p-8 rounded-2xl shadow-2xl border-2 border-[#ffc55a]/40 backdrop-blur-md">
              {/* huge white stamp image overlay when paid */}
              {isPaid && (
                <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none overflow-visible">
                  <Image src="/cap_putih.png" alt="Paid Stamp" width={350} height={350} className="transform -rotate-12 opacity-90 drop-shadow-2xl animate-in zoom-in-50 duration-200" />
                </div>
              )}

              <div className="flex justify-between text-lg font-bold mb-6 tracking-wide">
                <div className="space-y-1">
                  <p className="text-base">Table #{selectedTable}</p>
                  <p className="text-sm">Date : {orderDate}</p>
                  <p className="text-sm">Serve : Cashier</p>
                </div>
                <div>
                  <p className="text-xl tracking-widest uppercase">CASHLESS</p>
                </div>
              </div>

              <div className="border-t-2 border-b-2 border-[#ffc55a]/60 py-4 space-y-3 text-xs font-bold tracking-wider mb-6">
                {cart.map(item => {
                  const m = menus.find(x => x.id === item.id);
                  if (!m) return null;
                  return (
                    <div key={item.id} className="flex justify-between">
                      <span className="w-8">{item.qty}</span>
                      <span className="flex-1 uppercase truncate">{m.namaMenu}</span>
                      <span>Rp. {(m.harga * item.qty).toLocaleString('id-ID')}</span>
                    </div>
                  );
                })}
              </div>

              <div className="w-3/4 ml-auto space-y-2 text-sm font-bold tracking-widest">
                 <div className="flex justify-between"><span>Subtotal</span><span>Rp. {subtotal.toLocaleString('id-ID')}</span></div>
                 <div className="flex justify-between"><span>Tax (10%)</span><span>Rp. {tax.toLocaleString('id-ID')}</span></div>
                 <div className="flex justify-between"><span>Tip</span><span>Rp. 0</span></div>
                 <div className="flex justify-between text-xl mt-3 border-t-2 border-[#ffc55a]/60 pt-3">
                   <span>Total</span>
                   <span>Rp. {totalPrice.toLocaleString('id-ID')}</span>
                 </div>
              </div>
            </div>

            {/* dynamic qris box on the right */}
            <div className="flex flex-col items-center">
               <h2 className="text-[#ffc55a] text-3xl font-bold tracking-widest mb-6 text-center drop-shadow-md">
                 Finish Your Payment Here
               </h2>
               <div className="bg-[#ffc55a] p-5 rounded-2xl shadow-[0_0_50px_rgba(255,197,90,0.4)] border-4 border-[#00215e]/20">
                 <QRCodeSVG 
                   value={qrPaymentData} 
                   size={220} 
                   bgColor="#ffc55a" 
                   fgColor="#00215e" 
                   level="H" 
                 />
               </div>
               <p className="text-[#ffc55a]/80 italic mt-6 text-xs tracking-widest">-Hope you Enjoy Your Dinner-</p>
               <button 
                 onClick={() => completePayment('CASHLESS')} 
                 className="mt-6 bg-[#ffc55a] text-[#00215e] px-12 py-3 rounded-xl font-bold tracking-widest hover:opacity-90 transition-opacity shadow-lg relative z-40"
               >
                 DONE
               </button>
            </div>
          </div>
        )}
      </div>
    );
  } else {
    viewContent = (
      <div className="relative w-screen h-screen bg-black font-serif overflow-hidden flex">
        
        {/* modal overlays */}
        {modalState !== 'NONE' && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
            
            {modalState === 'WHEN' && (
              <div className="bg-[#ffc55a] text-[#00215e] p-8 rounded-2xl w-[400px] relative shadow-2xl animate-in zoom-in-95 duration-200">
                <button onClick={() => setModalState('NONE')} className="absolute top-4 right-4 bg-[#00215e] text-[#ffc55a] rounded-full p-1 hover:scale-110 transition-transform"><X className="w-5 h-5"/></button>
                <h2 className="text-2xl font-extrabold text-center mb-6 tracking-wide">Proceed to payment</h2>
                <div className="flex flex-col space-y-4">
                  <button onClick={() => setModalState('METHOD')} className="bg-[#00215e] text-[#ffc55a] py-3 rounded-xl font-bold text-lg tracking-widest hover:opacity-90 shadow-md transition-opacity">PAY NOW</button>
                  <button onClick={() => handleOrder('UNPAID')} disabled={isOrdering} className="bg-[#00215e] text-[#ffc55a] py-3 rounded-xl font-bold text-lg tracking-widest hover:opacity-90 shadow-md transition-opacity">
                    {isOrdering ? 'WAIT...' : 'PAY LATER'}
                  </button>
                </div>
              </div>
            )}

            {modalState === 'METHOD' && (
              <div className="bg-[#ffc55a] text-[#00215e] p-8 rounded-2xl w-[400px] relative shadow-2xl animate-in zoom-in-95 duration-200">
                <button onClick={() => setModalState('NONE')} className="absolute top-4 right-4 bg-[#00215e] text-[#ffc55a] rounded-full p-1 hover:scale-110 transition-transform"><X className="w-5 h-5"/></button>
                <h2 className="text-2xl font-extrabold text-center mb-6 tracking-wide">How would you like to pay?</h2>
                <div className="flex flex-col space-y-4">
                  <button onClick={() => handleOrder('PAID', 'CASH')} disabled={isOrdering} className="bg-[#00215e] text-[#ffc55a] py-3 rounded-xl font-bold text-lg tracking-widest hover:opacity-90 shadow-md transition-opacity">CASH</button>
                  <button onClick={() => handleOrder('PAID', 'CASHLESS')} disabled={isOrdering} className="bg-[#00215e] text-[#ffc55a] py-3 rounded-xl font-bold text-lg tracking-widest hover:opacity-90 shadow-md transition-opacity">CASHLESS</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* background image with reddish overlay tint */}
        <div className="absolute inset-0 z-0">
          <Image src="/background.png" alt="Background" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-[#fc4100]/25 mix-blend-multiply pointer-events-none"></div>
        </div>

        {/* sidebar - translucent navy blue */}
        <aside className="w-[180px] bg-[#00215e]/50 backdrop-blur-md border-r border-[#ffc55a]/30 flex flex-col pt-8 z-20 shadow-[15px_0_25px_rgba(0,0,0,0.4)] shrink-0 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="flex justify-center mb-8 border-b border-[#ffc55a]/30 pb-8 shrink-0">
            <Image src="/logo_emas.png" alt="RestoLink Logo" width={80} height={80} className="object-contain cursor-pointer hover:scale-105 transition-transform drop-shadow-lg" onClick={() => setShowWelcome(true)} priority />
          </div>

          <nav className="flex flex-col w-full text-[#ffc55a]">
            
            {/* food category accordion */}
            <div className="w-full">
              <button 
                onClick={() => handleCategoryClick('FOOD')}
                className={`w-full py-4 px-4 text-base font-bold uppercase tracking-widest flex justify-between items-center transition-all ${
                  expandedCategory === 'FOOD' 
                    ? 'bg-[#ffc55a]/20 border-l-4 border-l-[#ffc55a] border-t border-[#ffc55a]/30 text-[#ffc55a] shadow-md' 
                    : 'hover:bg-[#ffc55a]/10 opacity-80 hover:opacity-100'
                }`}
              >
                <div className="flex items-center">
                  <Image src="/daging.svg" alt="food" width={18} height={18} className="mr-3" /> FOOD
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expandedCategory === 'FOOD' ? 'rotate-180 text-[#ffc55a]' : 'opacity-50'}`} />
              </button>
              
              {/* dynamic food subcategories */}
              {expandedCategory === 'FOOD' && dynamicSubcategories.FOOD && (
                <div className="flex flex-col bg-[#2c4e80]/40 border-b border-[#ffc55a]/30">
                  {dynamicSubcategories.FOOD.map((sub) => (
                    <button 
                      key={sub}
                      onClick={() => setActiveSubcategory(sub)}
                      className={`text-left pl-12 py-3 text-[11px] font-bold tracking-widest uppercase transition-all ${
                        activeSubcategory === sub 
                          ? 'text-[#ffc55a] bg-[#ffc55a]/20 border-l-2 border-l-[#ffc55a]' 
                          : 'text-[#ffc55a]/70 hover:text-[#ffc55a] hover:bg-[#ffc55a]/10'
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* drinks category accordion */}
            <div className="w-full">
              <button 
                onClick={() => handleCategoryClick('DRINKS')}
                className={`w-full py-4 px-4 text-base font-bold uppercase tracking-widest flex justify-between items-center transition-all ${
                  expandedCategory === 'DRINKS' 
                    ? 'bg-[#ffc55a]/20 border-l-4 border-l-[#ffc55a] border-y border-[#ffc55a]/30 text-[#ffc55a] shadow-md' 
                    : 'hover:bg-[#ffc55a]/10 opacity-80 hover:opacity-100'
                }`}
              >
                <div className="flex items-center">
                  <Image src="/minum.svg" alt="drinks" width={18} height={18} className="mr-3" /> DRINKS
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expandedCategory === 'DRINKS' ? 'rotate-180 text-[#ffc55a]' : 'opacity-50'}`} />
              </button>

              {/* dynamic drinks subcategories */}
              {expandedCategory === 'DRINKS' && dynamicSubcategories.DRINKS && (
                <div className="flex flex-col bg-[#2c4e80]/40 border-b border-[#ffc55a]/30">
                  {dynamicSubcategories.DRINKS.map((sub) => (
                    <button 
                      key={sub}
                      onClick={() => setActiveSubcategory(sub)}
                      className={`text-left pl-12 py-3 text-[11px] font-bold tracking-widest uppercase transition-all ${
                        activeSubcategory === sub 
                          ? 'text-[#ffc55a] bg-[#ffc55a]/20 border-l-2 border-l-[#ffc55a]' 
                          : 'text-[#ffc55a]/70 hover:text-[#ffc55a] hover:bg-[#ffc55a]/10'
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </nav>
        </aside>

        {/* main content area */}
        <main className="flex-1 relative h-full flex">
          {/* menu items grid */}
          <div className="flex-1 relative z-10 p-6 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {/* active table session banner if there are existing orders on this table */}
            {activeOrders.length > 0 && (
              <div className="mb-4 bg-[#ffc55a]/15 border border-[#ffc55a]/40 rounded-xl p-3 backdrop-blur-md flex justify-between items-center text-[#ffc55a]">
                <div className="flex items-center space-x-3">
                  <Receipt className="w-5 h-5 text-[#ffc55a]" />
                  <div>
                    <p className="text-xs font-bold tracking-wider uppercase">Active Session Order (Table {selectedTable})</p>
                    <p className="text-[10px] opacity-80">{activeOrders.length} items ordered previously. You can add more items below!</p>
                  </div>
                </div>
              </div>
            )}

            {!expandedCategory ? (
               <div className="w-full h-full flex items-center justify-center opacity-60 pointer-events-none">
                 <Image src="/logo_emas.png" alt="Logo Watermark" width={300} height={300} className="drop-shadow-[0_0_50px_rgba(255,197,90,0.3)] object-contain" />
               </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 pb-10">
                {displayedMenus.length === 0 ? (
                  <div className="col-span-2 text-center text-[#ffc55a]/50 mt-10 text-sm tracking-widest italic">
                    No menus available in this category.
                  </div>
                ) : (
                  displayedMenus.map((menu) => (
                    <div 
                      key={menu.id} 
                      onClick={() => addToCart(menu.id, 1)}
                      className="bg-[#1a1a1a]/90 border border-[#ffc55a]/40 rounded-xl p-3 flex justify-between items-center shadow-xl cursor-pointer hover:border-[#ffc55a] transition-all hover:scale-[1.02] backdrop-blur-sm"
                    >
                      <div className="flex items-center space-x-4 w-full">
                        {/* render image box only if menu.image exists in database */}
                        {menu.image && (
                          <div className="w-20 h-20 flex items-center justify-center shrink-0">
                             <Image src={menu.image} alt={menu.namaMenu} width={80} height={80} className="object-contain drop-shadow-md" />
                          </div>
                        )}
                        <div className="flex-1 pr-2">
                          <h3 className="text-[#ffc55a] text-sm font-bold tracking-widest uppercase mb-1 leading-snug">{menu.namaMenu}</h3>
                          <p className="text-[#ffc55a]/70 text-xs tracking-widest font-semibold">Rp. {menu.harga.toLocaleString('id-ID')}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* right sidebar cart */}
          <div className="w-[350px] relative z-10 bg-black/50 border-l border-[#ffc55a]/30 backdrop-blur-md flex flex-col shrink-0 shadow-[-15px_0_30px_rgba(0,0,0,0.5)]">
            <div className="flex-1 p-6 flex flex-col overflow-hidden">
              
              <div className="flex items-center space-x-3 mb-5 pb-4 border-b border-[#ffc55a]/30 text-[#ffc55a]">
                {/* custom menu icon */}
                <div className="w-8 h-8 flex items-center justify-center shrink-0">
                  <Image src="/menu.svg" alt="Order Menu" width={32} height={32} className="object-contain drop-shadow-md" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-widest uppercase">Order Menu</h2>
                  <p className="text-xs opacity-80 mt-1 font-semibold tracking-wide">Table {selectedTable}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {cart.length === 0 ? (
                  <div className="text-center text-[#ffc55a]/50 mt-16 space-y-2">
                    <ShoppingBag className="w-10 h-10 mx-auto opacity-30" />
                    <p className="text-xs italic tracking-wider">Please select a menu to add items...</p>
                  </div>
                ) : (
                  cart.map((cartItem) => {
                    const menu = menus.find((m) => m.id === cartItem.id);
                    if (!menu) return null;
                    return (
                      <div key={menu.id} className="bg-[#1a1a1a]/90 border border-[#ffc55a]/30 rounded-xl p-2.5 flex justify-between items-center shadow-lg backdrop-blur-sm">
                        <div className="flex items-center space-x-2 w-[70%]">
                          {/* render thumbnail only if image exists in database */}
                          {menu.image && (
                            <div className="w-10 h-10 flex items-center justify-center shrink-0">
                              <Image src={menu.image} alt={menu.namaMenu} width={40} height={40} className="object-contain drop-shadow-sm" />
                            </div>
                          )}
                          <div className="overflow-hidden flex-1">
                            <h4 className="text-[10px] text-[#ffc55a] font-bold leading-snug uppercase truncate">{menu.namaMenu}</h4>
                            <p className="text-[10px] text-[#ffc55a]/70 mt-0.5 font-semibold tracking-wider">Rp. {(menu.harga * cartItem.qty).toLocaleString('id-ID')}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 text-[#ffc55a] pr-1">
                          <button onClick={() => addToCart(menu.id, -1)} className="w-5 h-5 border border-[#ffc55a]/60 rounded flex items-center justify-center hover:bg-[#ffc55a]/20 transition-colors font-bold text-xs">-</button>
                          <span className="text-xs font-bold w-4 text-center">{cartItem.qty}</span>
                          <button onClick={() => addToCart(menu.id, 1)} className="w-5 h-5 border border-[#ffc55a]/60 rounded flex items-center justify-center hover:bg-[#ffc55a]/20 transition-colors font-bold text-xs">+</button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="p-6 pt-0">
              <div className="bg-[#ffc55a] text-[#00215e] p-5 rounded-xl flex justify-between items-center shadow-[0_0_30px_rgba(255,197,90,0.2)]">
                 <div>
                   <p className="text-[10px] font-bold tracking-widest">{totalItems} items</p>
                   <p className="text-base font-bold tracking-widest mt-1">Rp. {totalPrice.toLocaleString('id-ID')}</p>
                 </div>
                 <button 
                  onClick={() => setModalState('WHEN')}
                  disabled={cart.length === 0}
                  className="bg-[#00215e] text-[#ffc55a] px-6 py-2 rounded-lg text-sm font-bold tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg"
                 >
                   Order
                 </button>
              </div>
            </div>
          </div>
        </main>

      </div>
    );
  }

  // ---------------------------------------------------------
  // global return returning the active view and success modal
  // ---------------------------------------------------------
  return (
    <>
      {viewContent}
      
      {/* global success popup overlay */}
      {orderSuccess && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center font-serif animate-in fade-in duration-200">
          <div className="bg-[#ffc55a] text-[#00215e] p-10 rounded-3xl w-[450px] shadow-2xl flex flex-col items-center transform transition-all animate-in zoom-in-95 duration-300">
            <div className="w-24 h-24 bg-[#00215e] rounded-full flex items-center justify-center mb-6 shadow-inner">
              <CheckCircle className="w-12 h-12 text-[#ffc55a]" />
            </div>
            <h2 className="text-3xl font-extrabold tracking-widest mb-4">SUCCESS!</h2>
            <p className="text-center font-bold tracking-wide text-sm opacity-90 mb-8">
              {orderSuccess === 'UNPAID' && `Order placed for Table ${selectedTable}! You can add more items to your table session anytime.`}
              {orderSuccess === 'CASH' && 'Payment request confirmed! Please proceed to the cashier to complete payment.'}
              {orderSuccess === 'CASHLESS' && 'Payment complete! Your order is now being processed. Enjoy your meal.'}
            </p>
            
            {orderSuccess === 'UNPAID' ? (
              <button 
                onClick={continueOrderingSession} 
                className="w-full bg-[#00215e] text-[#ffc55a] py-4 rounded-xl font-bold tracking-widest hover:opacity-90 shadow-lg transition-opacity flex items-center justify-center space-x-2"
              >
                <span>ADD MORE ITEMS</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button 
                onClick={resetFlow} 
                className="w-full bg-[#00215e] text-[#ffc55a] py-4 rounded-xl font-bold tracking-widest hover:opacity-90 shadow-lg transition-opacity"
              >
                BACK TO HOME
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// export the wrapper component which provides suspense boundary for useSearchParams
export default function CustomerOrderPage() {
  return (
    <Suspense fallback={<div className="w-screen h-screen bg-black flex items-center justify-center text-[#ffc55a] font-serif tracking-widest">LOADING...</div>}>
      <CustomerOrderContent />
    </Suspense>
  );
}
