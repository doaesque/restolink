// customer interface strictly matched with figma design including full-screen welcome and custom scrollbar
'use client';

import { useState } from 'react';
import Image from 'next/image';

// dummy data based on the figma design
const MOCK_MENU = [
  { id: '1', name: 'WAGYU A5 FILLET MIGNON WITH TRUFFLE SHAVINGS', price: 2000000, img: '/menu/wagyu.png' },
  { id: '2', name: '45-DAY DRY-AGED T-BONE STEAK', price: 2800000, img: '/menu/tbone.png' },
  { id: '3', name: '24K GOLD LEAF TOMAHAWK RIBEYE', price: 5000000, img: '/menu/ribeye.png' },
  { id: '4', name: 'ARTESIAN CRYSTAL WATER', price: 120000, img: '/menu/water.png' },
  { id: '5', name: 'TRUFFLE-INFUSED SMOKY OLD FASHIONED', price: 300000, img: '/menu/oldfashioned.png' },
  { id: '6', name: '24K GOLD DUST ESPRESSO MARTINI', price: 450000, img: '/menu/martini.png' },
];

export default function CustomerOrderPage() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [cart, setCart] = useState<{ id: string; qty: number }[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [paymentType, setPaymentType] = useState<'CASH' | 'CASHLESS' | null>(null);

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
  const totalPrice = cart.reduce((sum, item) => {
    const menuItem = MOCK_MENU.find((m) => m.id === item.id);
    return sum + (menuItem?.price || 0) * item.qty;
  }, 0);

  // order checkout process
  const handleOrder = () => {
    if (cart.length > 0) setShowPaymentModal(true);
  };

  const handleSelectPayment = (type: 'CASH' | 'CASHLESS') => {
    setPaymentType(type);
    setShowPaymentModal(false);
    setShowReceipt(true);
  };

  // ---------------------------------------------------------
  // 1. welcome screen view (rendered without sidebar)
  // ---------------------------------------------------------
  if (showWelcome) {
    return (
      <div className="relative w-screen h-screen bg-black font-serif overflow-hidden flex items-center justify-center">
        {/* background image with warm overlay matching figma */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/background.png"
            alt="Restaurant Background"
            fill
            className="object-cover opacity-70"
            priority
          />
          {/* warm orange/brown tint overlay for welcome screen */}
          <div className="absolute inset-0 bg-[#A04000]/40 mix-blend-multiply"></div>
        </div>

        {/* centered welcome content without sidebar */}
        <div className="relative z-10 flex flex-col items-center justify-center space-y-12">
          <Image 
            src="/logo.png" 
            alt="RestoLink Logo" 
            width={350} 
            height={350} 
            className="drop-shadow-2xl object-contain"
            priority
          />
          {/* order button specifically positioned and styled like the figma mockup */}
          <button 
            onClick={() => setShowWelcome(false)}
            className="bg-[#0A192F] border-[3px] border-[#D4AF37] text-[#D4AF37] px-20 py-4 rounded-xl text-3xl font-bold tracking-widest hover:bg-[#D4AF37] hover:text-[#0A192F] transition-all shadow-2xl"
          >
            ORDER
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // 2. main order menu view (with sidebar)
  // ---------------------------------------------------------
  return (
    <div className="relative w-screen h-screen bg-black font-serif overflow-hidden flex">
      
      {/* sidebar - solid navy blue */}
      <aside className="w-[280px] bg-[#0A192F] border-r border-[#D4AF37]/30 flex flex-col pt-10 z-20 shadow-[15px_0_25px_rgba(0,0,0,0.7)] shrink-0">
        <div className="flex justify-center mb-16 px-4">
          <div className="bg-white/5 p-4 rounded-3xl shadow-inner">
            <Image src="/logo.png" alt="RestoLink Logo" width={110} height={110} className="object-contain" priority />
          </div>
        </div>

        <nav className="flex flex-col w-full text-[#D4AF37]">
          {/* food category */}
          <div className="w-full">
            <div className="py-5 px-8 border-y border-[#D4AF37]/30 text-xl font-bold uppercase tracking-widest flex items-center bg-[#D4AF37]/10 shadow-inner">
              <span className="mr-4 text-2xl">🍽️</span> FOOD
            </div>
            <div className="flex flex-col space-y-6 mt-6 mb-8 px-12 text-sm text-[#D4AF37]/80 font-bold tracking-wider">
              <span className="hover:text-[#D4AF37] hover:translate-x-1 cursor-pointer transition-all">Wagyu A5 Fillet</span>
              <span className="hover:text-[#D4AF37] hover:translate-x-1 cursor-pointer transition-all">45-Day T-Bone</span>
              <span className="hover:text-[#D4AF37] hover:translate-x-1 cursor-pointer transition-all">24K Gold RibEye</span>
            </div>
          </div>

          {/* drinks category */}
          <div className="w-full">
            <div className="py-5 px-8 border-y border-[#D4AF37]/30 text-xl font-bold uppercase tracking-widest flex items-center hover:bg-[#D4AF37]/5 cursor-pointer transition-colors">
              <span className="mr-4 text-2xl">🍸</span> DRINKS
            </div>
          </div>
        </nav>
      </aside>

      {/* main content area (background + dark overlay to ensure readability) */}
      <main className="flex-1 relative h-full flex">
        {/* main background */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/background.png"
            alt="Restaurant Background"
            fill
            className="object-cover"
          />
          {/* distinct dark overlay covering the entire middle section to ensure text readability */}
          <div className="absolute inset-0 bg-black/75 backdrop-blur-[3px]"></div>
        </div>

        {/* menu list section */}
        <div className="flex-1 relative z-10 p-8 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 gap-6 max-w-4xl mx-auto pb-10">
            {MOCK_MENU.map((menu) => (
              <div 
                key={menu.id} 
                onClick={() => addToCart(menu.id, 1)}
                className="bg-[#111111]/90 border border-[#D4AF37]/40 rounded-xl p-5 flex justify-between items-center shadow-2xl cursor-pointer hover:border-[#D4AF37] hover:bg-[#1A1A1A]/95 transition-all hover:scale-[1.02]"
              >
                 <div className="flex items-center space-x-6 w-full">
                   {/* item image */}
                   <div className="w-36 h-24 bg-[#1A1A1A] rounded-lg overflow-hidden border border-[#D4AF37]/30 flex items-center justify-center text-xs text-[#D4AF37]/40 shrink-0">
                     IMG
                   </div>
                   {/* item details */}
                   <div className="flex-1">
                     <h3 className="text-[#D4AF37] text-lg font-bold tracking-widest uppercase mb-2 leading-snug">{menu.name}</h3>
                     <p className="text-[#D4AF37]/80 text-base tracking-widest font-semibold">Rp. {menu.price.toLocaleString('id-ID')}</p>
                   </div>
                 </div>
              </div>
            ))}
          </div>
        </div>

        {/* cart right sidebar */}
        <div className="w-[420px] relative z-10 bg-[#080808]/95 border-l border-[#D4AF37]/40 backdrop-blur-md flex flex-col shrink-0 shadow-[-15px_0_30px_rgba(0,0,0,0.6)]">
          <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
            {/* cart header */}
            <div className="flex items-center justify-center space-x-4 mb-8 pb-5 border-b border-[#D4AF37]/40 text-[#D4AF37]">
              <span className="text-3xl">📋</span>
              <div>
                <h2 className="text-2xl font-bold tracking-widest uppercase">Order Menu</h2>
                <p className="text-sm opacity-80 mt-1 font-semibold tracking-wide">Table 10</p>
              </div>
            </div>

            {/* cart items */}
            <div className="space-y-4">
              {cart.length === 0 ? (
                <p className="text-base italic text-center text-[#D4AF37]/40 mt-20 tracking-wider">Silahkan Pilih Menu...</p>
              ) : (
                cart.map((cartItem) => {
                  const menu = MOCK_MENU.find((m) => m.id === cartItem.id)!;
                  return (
                    <div key={menu.id} className="bg-[#151515] border border-[#D4AF37]/30 rounded-xl p-4 flex justify-between items-center shadow-lg">
                      <div className="flex items-center space-x-4 w-[65%]">
                        <div className="w-16 h-12 bg-[#222222] rounded shrink-0 flex items-center justify-center text-[9px] text-[#D4AF37]/30">IMG</div>
                        <div className="overflow-hidden">
                          <h4 className="text-[12px] text-[#D4AF37] font-bold leading-snug uppercase truncate">{menu.name}</h4>
                          <p className="text-[11px] text-[#D4AF37]/70 mt-1 font-semibold tracking-wider">Rp. {menu.price.toLocaleString('id-ID')}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 text-[#D4AF37]">
                        <button onClick={() => addToCart(menu.id, -1)} className="w-7 h-7 border border-[#D4AF37]/60 rounded-md flex items-center justify-center hover:bg-[#D4AF37]/20 transition-colors font-bold">-</button>
                        <span className="text-base font-bold w-5 text-center">{cartItem.qty}</span>
                        <button onClick={() => addToCart(menu.id, 1)} className="w-7 h-7 border border-[#D4AF37]/60 rounded-md flex items-center justify-center hover:bg-[#D4AF37]/20 transition-colors font-bold">+</button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* checkout button area */}
          <div className="p-8 bg-[#080808]">
            <div className="bg-[#D4AF37] text-[#0A192F] p-6 rounded-2xl flex justify-between items-center shadow-[0_0_30px_rgba(212,175,55,0.2)]">
               <div>
                 <p className="text-sm font-bold tracking-widest">{totalItems} items</p>
                 <p className="text-2xl font-bold tracking-widest mt-1">Rp. {totalPrice.toLocaleString('id-ID')}</p>
               </div>
               <button 
                onClick={handleOrder}
                disabled={cart.length === 0}
                className="bg-[#0A192F] text-[#D4AF37] px-8 py-4 rounded-xl text-xl font-bold tracking-widest hover:bg-black transition-colors disabled:opacity-50 shadow-lg"
               >
                 Order
               </button>
            </div>
          </div>
        </div>
      </main>

      {/* ---------------------------------------------------------
          3. payment method modal
          --------------------------------------------------------- */}
      {showPaymentModal && (
        <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center backdrop-blur-md">
          <div className="bg-[#F3A150] text-[#0A192F] p-12 rounded-3xl w-[500px] relative shadow-2xl border-4 border-[#0A192F]/10">
            <button 
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-5 right-6 text-2xl font-bold text-[#0A192F] hover:scale-110 transition-transform bg-black/5 w-10 h-10 rounded-full flex items-center justify-center"
            >
              ✖
            </button>
            <h2 className="text-3xl font-bold text-center mb-10 font-serif tracking-wide">How would you like to pay?</h2>
            <div className="flex flex-col space-y-6">
              <button 
                onClick={() => handleSelectPayment('CASH')}
                className="bg-[#0A192F] text-[#F3A150] py-5 rounded-full font-bold tracking-widest text-2xl hover:opacity-90 shadow-xl border-2 border-[#0A192F] transition-opacity"
              >
                CASH
              </button>
              <button 
                onClick={() => handleSelectPayment('CASHLESS')}
                className="bg-[#0A192F] text-[#F3A150] py-5 rounded-full font-bold tracking-widest text-2xl hover:opacity-90 shadow-xl border-2 border-[#0A192F] transition-opacity"
              >
                CASHLESS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------
          4. receipt & qr modal
          --------------------------------------------------------- */}
      {showReceipt && (
        <div className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center backdrop-blur-md">
          <div className={`flex items-center space-x-16 ${paymentType === 'CASHLESS' ? 'w-[950px] justify-between' : ''}`}>
            
            {/* receipt card */}
            <div className="bg-[#F3A150] text-[#0A192F] p-10 rounded-2xl w-[450px] relative shadow-[0_0_50px_rgba(243,161,80,0.2)] border-2 border-[#0A192F]/20">
               {/* stamp watermark for cash */}
               {paymentType === 'CASH' && (
                 <div className="absolute inset-0 flex items-center justify-center opacity-40 pointer-events-none rotate-[-15deg] z-0">
                   <Image src="/cap_biru.png" alt="Done Stamp" width={300} height={300} />
                 </div>
               )}

               <div className="relative z-10 flex flex-col h-full">
                 <div className="flex justify-center mb-8 bg-white/20 mx-24 rounded-3xl p-3 shadow-inner">
                   <Image src="/logo.png" alt="logo" width={70} height={70} className="object-contain" />
                 </div>
                 
                 <div className="flex justify-between text-sm font-bold mb-6 tracking-wider">
                   <div className="space-y-1">
                     <p>Table #10</p>
                     <p>Date : 23 Nov 2026</p>
                     <p>Serve : Cashier</p>
                   </div>
                   <div className="text-right flex items-end">
                     <p className="text-3xl tracking-widest uppercase">{paymentType}</p>
                   </div>
                 </div>

                 <div className="border-t-[3px] border-b-[3px] border-[#0A192F] py-6 space-y-4 text-xs font-bold flex-1 tracking-wider custom-scrollbar overflow-y-auto max-h-[250px]">
                    {cart.map(item => {
                       const m = MOCK_MENU.find(x => x.id === item.id)!;
                       return (
                         <div key={item.id} className="flex justify-between items-center">
                           <span className="w-2/3 pr-4 leading-relaxed">{item.qty} &nbsp; {m.name}</span>
                           <span>Rp. {(m.price * item.qty).toLocaleString('id-ID')}</span>
                         </div>
                       )
                    })}
                 </div>

                 <div className="pt-6 text-sm font-bold space-y-2 w-4/5 ml-auto tracking-widest">
                   <div className="flex justify-between"><span>Subtotal</span><span>Rp. {totalPrice.toLocaleString('id-ID')}</span></div>
                   <div className="flex justify-between"><span>Tax (10%)</span><span>Rp. {(totalPrice * 0.1).toLocaleString('id-ID')}</span></div>
                   <div className="flex justify-between"><span>Tip</span><span>Rp. 0</span></div>
                   <div className="flex justify-between text-xl mt-3 border-t-[3px] border-[#0A192F] pt-3">
                     <span>Total</span>
                     <span>Rp. {(totalPrice * 1.1).toLocaleString('id-ID')}</span>
                   </div>
                 </div>

                 <div className="mt-12 text-center text-sm font-bold tracking-wide">
                   {paymentType === 'CASH' 
                     ? <p className="leading-relaxed">Please proceed to the cashier to complete your payment and show your receipt.</p>
                     : <p className="leading-relaxed">Scan the QR Code to complete payment.</p>
                   }
                   <p className="mt-6 text-xs italic opacity-80 tracking-widest">-Hope you Enjoy Your Dinner-</p>
                 </div>
               </div>
            </div>

            {/* qr code section (only for cashless) */}
            {paymentType === 'CASHLESS' && (
              <div className="text-[#F3A150] flex flex-col items-center">
                <h2 className="text-5xl font-serif tracking-widest mb-10 text-center leading-snug drop-shadow-lg">
                  Finish Your<br/>Payment Here
                </h2>
                <div className="bg-[#F3A150] p-6 rounded-2xl shadow-[0_0_60px_rgba(243,161,80,0.5)] border-4 border-[#F3A150]/50">
                  <Image src="/qr_code.png" alt="QR Code" width={320} height={320} className="rounded-xl" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
