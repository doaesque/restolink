// customer interface matched with figma design, using dynamic database menu
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Utensils, GlassWater, ClipboardList, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface MenuData {
  id: string;
  namaMenu: string;
  harga: number;
}

export default function CustomerOrderPage() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [menus, setMenus] = useState<MenuData[]>([]);
  const [cart, setCart] = useState<{ id: string; qty: number }[]>([]);
  
  // modal and view states
  const [activeCategory, setActiveCategory] = useState<'FOOD' | 'DRINKS' | null>(null);
  const [modalState, setModalState] = useState<'NONE' | 'WHEN' | 'METHOD'>('NONE');
  const [receiptType, setReceiptType] = useState<'CASH' | 'CASHLESS' | null>(null);
  const [isOrdering, setIsOrdering] = useState(false);

  // fetch menu from database
  useEffect(() => {
    async function fetchMenu() {
      try {
        const res = await fetch('/api/menu');
        const data = await res.json();
        if (data.sukses) {
          setMenus(data.data);
        }
      } catch (err) {
        console.error('failed to fetch menu:', err);
      }
    }
    fetchMenu();
  }, []);

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

  // calculate totals
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = cart.reduce((sum, item) => {
    const menuItem = menus.find((m) => m.id === item.id);
    return sum + (menuItem?.harga || 0) * item.qty;
  }, 0);
  const tax = subtotal * 0.1; 
  const totalPrice = subtotal + tax;

  // order checkout process saving to database
  const handleOrder = async (statusTagihan: 'PAID' | 'UNPAID', paymentMethod?: 'CASH' | 'CASHLESS') => {
    setIsOrdering(true);

    try {
      // create payload to send to pesanan api
      const payload = {
        idPelanggan: 'Guest', 
        idPegawai: 'CASH-001', 
        jumlahOrang: 2,
        noMeja: 10,
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
      if (result.sukses) {
        if (statusTagihan === 'UNPAID') {
           alert('Order placed successfully! You can pay later.');
           resetFlow();
        } else if (paymentMethod) {
           setModalState('NONE');
           setReceiptType(paymentMethod);
        }
      } else {
        alert(result.pesan || 'Failed to process order.');
      }
    } catch (err) {
      console.error('order submission error:', err);
      alert('System error. Please try again.');
    } finally {
      setIsOrdering(false);
    }
  };

  const resetFlow = () => {
    setCart([]);
    setActiveCategory(null);
    setModalState('NONE');
    setReceiptType(null);
    setShowWelcome(true);
  };

  const orderDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  // ---------------------------------------------------------
  // 1. welcome screen view
  // ---------------------------------------------------------
  if (showWelcome) {
    return (
      <div className="relative w-screen h-screen bg-black font-serif overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <Image src="/background.png" alt="Restaurant Background" fill className="object-cover opacity-80" priority />
          <div className="absolute inset-0 bg-[#fc4100]/30 mix-blend-multiply"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center space-y-10">
          <Image src="/logo_emas.png" alt="RestoLink Logo" width={300} height={300} className="drop-shadow-2xl object-contain" priority />
          <button 
            onClick={() => setShowWelcome(false)}
            className="bg-[#00215e] border-2 border-[#ffc55a] text-[#ffc55a] px-24 py-4 rounded-xl text-3xl font-bold tracking-widest hover:bg-[#ffc55a] hover:text-[#00215e] transition-all shadow-2xl uppercase"
          >
            ORDER
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // 2. receipt overlays (cash / cashless)
  // ---------------------------------------------------------
  if (receiptType) {
    // generate mockup payment string for qr code
    const qrPaymentData = `restolink-payment://table-10/amount-${totalPrice}`;

    return (
      <div className="relative w-screen h-screen bg-black font-serif overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <Image src="/background.png" alt="Restaurant Background" fill className="object-cover opacity-30" />
        </div>

        {receiptType === 'CASH' && (
          <div className="relative z-10 bg-[#ffc55a] text-[#00215e] w-[500px] p-10 rounded-xl shadow-2xl border-4 border-[#00215e]/10">
            <div className="flex justify-center mb-6">
              <Image src="/logo_emas.png" alt="Logo" width={80} height={80} className="object-contain drop-shadow-md" />
            </div>
            
            <div className="flex justify-between text-sm font-bold mb-4 tracking-wide">
              <div>
                <p>Table #10</p>
                <p>Date : {orderDate}</p>
                <p>Serve : Cashier</p>
              </div>
              <div className="flex items-end">
                <p className="text-xl tracking-widest">CASH</p>
              </div>
            </div>

            <div className="border-t-[3px] border-b-[3px] border-[#00215e] py-6 space-y-3 text-xs font-bold tracking-wider mb-4">
              {cart.map(item => {
                const m = menus.find(x => x.id === item.id);
                if (!m) return null;
                return (
                  <div key={item.id} className="flex justify-between">
                    <span className="w-8">{item.qty}</span>
                    <span className="flex-1 uppercase">{m.namaMenu}</span>
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

            <div className="mt-10 text-center font-bold">
               <p className="text-sm tracking-wide">Please proceed to the cashier to complete your payment and show your receipt.</p>
               <p className="text-[10px] italic mt-4 opacity-80">-Hope you Enjoy Your Dinner-</p>
            </div>

            <button onClick={resetFlow} className="mt-8 w-full bg-[#00215e] text-[#ffc55a] py-4 rounded-lg font-bold tracking-widest hover:opacity-90">FINISH</button>
          </div>
        )}

        {receiptType === 'CASHLESS' && (
          <div className="relative z-10 flex items-center space-x-12">
            
            {/* dark receipt for cashless */}
            <div className="bg-[#111111]/90 text-[#ffc55a] w-[500px] p-10 rounded-2xl shadow-2xl border-2 border-[#ffc55a]/40 backdrop-blur-md">
              <div className="flex justify-between text-lg font-bold mb-6 tracking-wide">
                <div className="space-y-1">
                  <p>Table #10</p>
                  <p>Date : {orderDate}</p>
                  <p>Serve : Cashier</p>
                </div>
                <div>
                  <p className="text-2xl tracking-widest uppercase">CASHLESS</p>
                </div>
              </div>

              <div className="border-t-2 border-b-2 border-[#ffc55a]/60 py-6 space-y-4 text-sm font-bold tracking-wider mb-6">
                {cart.map(item => {
                  const m = menus.find(x => x.id === item.id);
                  if (!m) return null;
                  return (
                    <div key={item.id} className="flex justify-between">
                      <span className="w-8">{item.qty}</span>
                      <span className="flex-1 uppercase">{m.namaMenu}</span>
                      <span>Rp. {(m.harga * item.qty).toLocaleString('id-ID')}</span>
                    </div>
                  );
                })}
              </div>

              <div className="w-3/4 ml-auto space-y-2 text-sm font-bold tracking-widest">
                 <div className="flex justify-between"><span>Subtotal</span><span>Rp. {subtotal.toLocaleString('id-ID')}</span></div>
                 <div className="flex justify-between"><span>Tax (10%)</span><span>Rp. {tax.toLocaleString('id-ID')}</span></div>
                 <div className="flex justify-between"><span>Tip</span><span>Rp. 0</span></div>
                 <div className="flex justify-between text-2xl mt-3 border-t-2 border-[#ffc55a]/60 pt-3">
                   <span>Total</span>
                   <span>Rp. {totalPrice.toLocaleString('id-ID')}</span>
                 </div>
              </div>
            </div>

            {/* dynamic qr code section */}
            <div className="flex flex-col items-center">
               <h2 className="text-[#ffc55a] text-4xl font-bold tracking-widest mb-8 text-center drop-shadow-md">
                 Finish Your Payment Here
               </h2>
               <div className="bg-[#ffc55a] p-5 rounded-xl shadow-[0_0_50px_rgba(255,197,90,0.4)]">
                 <QRCodeSVG 
                   value={qrPaymentData} 
                   size={240} 
                   bgColor="#ffc55a" 
                   fgColor="#00215e" 
                   level="H" 
                 />
               </div>
               <p className="text-[#ffc55a]/80 italic mt-8 text-sm tracking-widest">-Hope you Enjoy Your Dinner-</p>
               <button onClick={resetFlow} className="mt-8 bg-[#ffc55a] text-[#00215e] px-12 py-3 rounded-lg font-bold tracking-widest hover:opacity-90">DONE</button>
            </div>

          </div>
        )}

      </div>
    );
  }

  // ---------------------------------------------------------
  // 3. main order menu view
  // ---------------------------------------------------------
  return (
    <div className="relative w-screen h-screen bg-black font-serif overflow-hidden flex">
      
      {/* modal overlays */}
      {modalState !== 'NONE' && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
          
          {modalState === 'WHEN' && (
            <div className="bg-[#ffc55a] text-[#00215e] p-10 rounded-2xl w-[450px] relative shadow-2xl">
              <button onClick={() => setModalState('NONE')} className="absolute top-4 right-4 bg-[#00215e] text-[#ffc55a] rounded-full p-1 hover:scale-110 transition-transform"><X className="w-5 h-5"/></button>
              <h2 className="text-3xl font-extrabold text-center mb-8 tracking-wide">Proceed to payment</h2>
              <div className="flex flex-col space-y-4">
                <button onClick={() => setModalState('METHOD')} className="bg-[#00215e] text-[#ffc55a] py-4 rounded-xl font-bold text-xl tracking-widest hover:opacity-90 shadow-md">PAY NOW</button>
                <button onClick={() => handleOrder('UNPAID')} disabled={isOrdering} className="bg-[#00215e] text-[#ffc55a] py-4 rounded-xl font-bold text-xl tracking-widest hover:opacity-90 shadow-md">
                  {isOrdering ? 'WAIT...' : 'PAY LATER'}
                </button>
              </div>
            </div>
          )}

          {modalState === 'METHOD' && (
            <div className="bg-[#ffc55a] text-[#00215e] p-10 rounded-2xl w-[450px] relative shadow-2xl">
              <button onClick={() => setModalState('NONE')} className="absolute top-4 right-4 bg-[#00215e] text-[#ffc55a] rounded-full p-1 hover:scale-110 transition-transform"><X className="w-5 h-5"/></button>
              <h2 className="text-3xl font-extrabold text-center mb-8 tracking-wide">How would you like to pay?</h2>
              <div className="flex flex-col space-y-4">
                <button onClick={() => handleOrder('PAID', 'CASH')} disabled={isOrdering} className="bg-[#00215e] text-[#ffc55a] py-4 rounded-xl font-bold text-xl tracking-widest hover:opacity-90 shadow-md">CASH</button>
                <button onClick={() => handleOrder('PAID', 'CASHLESS')} disabled={isOrdering} className="bg-[#00215e] text-[#ffc55a] py-4 rounded-xl font-bold text-xl tracking-widest hover:opacity-90 shadow-md">CASHLESS</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* sidebar - navy blue */}
      <aside className="w-[280px] bg-[#00215e] border-r border-[#ffc55a]/30 flex flex-col pt-10 z-20 shadow-[15px_0_25px_rgba(0,0,0,0.5)] shrink-0">
        <div className="flex justify-center mb-10 border-b border-[#ffc55a]/30 pb-10">
          <Image src="/logo_emas.png" alt="RestoLink Logo" width={110} height={110} className="object-contain cursor-pointer hover:scale-105 transition-transform" onClick={() => setShowWelcome(true)} priority />
        </div>

        <nav className="flex flex-col w-full text-[#ffc55a]">
          <div className="w-full">
            <button 
              onClick={() => setActiveCategory('FOOD')}
              className={`w-full py-5 px-8 text-xl font-bold uppercase tracking-widest flex items-center transition-colors ${activeCategory === 'FOOD' ? 'bg-[#ffc55a]/10 border-y border-[#ffc55a]/30 shadow-inner' : 'hover:bg-[#ffc55a]/5'}`}
            >
              <Utensils className="w-6 h-6 mr-4" /> FOOD
            </button>
          </div>
          <div className="w-full">
            <button 
              onClick={() => setActiveCategory('DRINKS')}
              className={`w-full py-5 px-8 text-xl font-bold uppercase tracking-widest flex items-center transition-colors ${activeCategory === 'DRINKS' ? 'bg-[#ffc55a]/10 border-y border-[#ffc55a]/30 shadow-inner' : 'hover:bg-[#ffc55a]/5'}`}
            >
              <GlassWater className="w-6 h-6 mr-4" /> DRINKS
            </button>
          </div>
        </nav>
      </aside>

      {/* main content area */}
      <main className="flex-1 relative h-full flex">
        <div className="absolute inset-0 z-0">
          <Image src="/background.png" alt="Background" fill className="object-cover" />
          <div className="absolute inset-0 bg-black/60"></div>
          <div className="absolute inset-0 bg-[#fc4100]/20 mix-blend-multiply"></div>
        </div>

        {/* menu items grid */}
        <div className="flex-1 relative z-10 p-10 overflow-y-auto scrollbar-hide">
          {!activeCategory ? (
             <div className="w-full h-full flex items-center justify-center opacity-60 pointer-events-none">
               <Image src="/logo_emas.png" alt="Logo Watermark" width={400} height={400} className="drop-shadow-[0_0_50px_rgba(255,197,90,0.3)]" />
             </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 max-w-3xl pb-10">
              {menus.map((menu) => (
                <div 
                  key={menu.id} 
                  onClick={() => addToCart(menu.id, 1)}
                  className="bg-[#1a1a1a]/95 border border-[#ffc55a]/40 rounded-xl p-4 flex justify-between items-center shadow-2xl cursor-pointer hover:border-[#ffc55a] transition-all hover:scale-[1.02]"
                >
                  <div className="flex items-center space-x-6 w-full">
                    {/* decorative image placeholder */}
                    <div className="w-32 h-20 bg-black rounded-lg border border-[#ffc55a]/20 flex items-center justify-center text-xs text-[#ffc55a]/30 shrink-0 overflow-hidden">
                       <Image src={activeCategory === 'FOOD' ? '/makanan_steak.png' : '/minuman_martini.png'} alt="menu" width={128} height={80} className="object-cover opacity-80" />
                    </div>
                    <div className="flex-1 pr-4">
                      <h3 className="text-[#ffc55a] text-lg font-bold tracking-widest uppercase mb-1 leading-snug">{menu.namaMenu}</h3>
                      <p className="text-[#ffc55a]/70 text-sm tracking-widest font-semibold">Rp. {menu.harga.toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* right sidebar cart */}
        <div className="w-[420px] relative z-10 bg-black/60 border-l border-[#ffc55a]/30 backdrop-blur-md flex flex-col shrink-0 shadow-[-15px_0_30px_rgba(0,0,0,0.5)]">
          <div className="flex-1 p-8 flex flex-col overflow-hidden">
            
            <div className="flex items-center space-x-4 mb-6 pb-4 border-b border-[#ffc55a]/30 text-[#ffc55a]">
              <ClipboardList className="w-10 h-10" />
              <div>
                <h2 className="text-2xl font-bold tracking-widest uppercase">Order Menu</h2>
                <p className="text-sm opacity-80 mt-1 font-semibold tracking-wide">Table 10</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide">
              {cart.length === 0 ? (
                <p className="text-sm italic text-center text-[#ffc55a]/50 mt-20 tracking-wider">Silahkan Pilih Menu...</p>
              ) : (
                cart.map((cartItem) => {
                  const menu = menus.find((m) => m.id === cartItem.id);
                  if (!menu) return null;
                  return (
                    <div key={menu.id} className="bg-[#1a1a1a]/90 border border-[#ffc55a]/30 rounded-xl p-3 flex justify-between items-center shadow-lg">
                      <div className="flex items-center space-x-3 w-[70%]">
                        <div className="w-14 h-10 bg-black rounded shrink-0 overflow-hidden border border-[#ffc55a]/20">
                          <Image src={menu.harga > 500000 ? '/makanan_steak.png' : '/minuman_martini.png'} alt="menu" width={56} height={40} className="object-cover opacity-80" />
                        </div>
                        <div className="overflow-hidden">
                          <h4 className="text-[10px] text-[#ffc55a] font-bold leading-snug uppercase truncate">{menu.namaMenu}</h4>
                          <p className="text-[10px] text-[#ffc55a]/70 mt-1 font-semibold tracking-wider">Rp. {(menu.harga * cartItem.qty).toLocaleString('id-ID')}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 text-[#ffc55a]">
                        <button onClick={() => addToCart(menu.id, -1)} className="w-6 h-6 border border-[#ffc55a]/60 rounded flex items-center justify-center hover:bg-[#ffc55a]/20 transition-colors font-bold text-xs">-</button>
                        <span className="text-xs font-bold w-4 text-center">{cartItem.qty}</span>
                        <button onClick={() => addToCart(menu.id, 1)} className="w-6 h-6 border border-[#ffc55a]/60 rounded flex items-center justify-center hover:bg-[#ffc55a]/20 transition-colors font-bold text-xs">+</button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="p-8">
            <div className="bg-[#ffc55a] text-[#00215e] p-6 rounded-2xl flex justify-between items-center shadow-[0_0_30px_rgba(255,197,90,0.2)]">
               <div>
                 <p className="text-xs font-bold tracking-widest">{totalItems} items</p>
                 <p className="text-xl font-bold tracking-widest mt-1">Rp. {totalPrice.toLocaleString('id-ID')}</p>
               </div>
               <button 
                onClick={() => setModalState('WHEN')}
                disabled={cart.length === 0}
                className="bg-[#00215e] text-[#ffc55a] px-8 py-3 rounded-xl text-lg font-bold tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg"
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
