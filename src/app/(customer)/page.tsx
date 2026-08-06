'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Utensils, Wine, ClipboardList, Plus, Minus, X } from 'lucide-react';

const MENU_ITEMS = {
  FOOD: [
    { id: 'f1', name: 'WAGYU A5 FILLET MIGNON WITH TRUFFLE SHAVINGS', price: 2000000, img: '/makanan_wagyu.png', shortName: 'Wagyu A5 Fillet' },
    { id: 'f2', name: '45-DAY DRY-AGED T-BONE STEAK', price: 2800000, img: '/makanan_steak.png', shortName: '45-Day T-Bone' },
    { id: 'f3', name: '24K GOLD LEAF TOMAHAWK RIBEYE', price: 5000000, img: '/makanan_ribeye.png', shortName: '24K Gold RibEye' },
  ],
  DRINKS: [
    { id: 'd1', name: 'ARTESIAN CRYSTAL WATER', price: 120000, img: '/minuman_crystal_water.png', shortName: 'Artesian Water' },
    { id: 'd2', name: 'TRUFFLE-INFUSED SMOKY OLD FASHIONED', price: 300000, img: '/minuman_bourbon.png', shortName: 'Smoky Old Fashioned' },
    { id: 'd3', name: '24K GOLD DUST ESPRESSO MARTINI', price: 450000, img: '/minuman_martini.png', shortName: 'Espresso Martini' },
  ]
};

interface CartItem {
  id: string;
  name: string;
  price: number;
  img: string;
  qty: number;
}

export default function CustomerOrderPage() {
  const [category, setCategory] = useState<'FOOD' | 'DRINKS' | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [modalState, setModalState] = useState<'NONE' | 'PROCEED_PAYMENT' | 'PAYMENT_METHOD'>('NONE');

  const handleAddToCart = (item: any) => {
    setCart(prev => {
      const existing = prev.find(p => p.id === item.id);
      if (existing) {
        return prev.map(p => p.id === item.id ? { ...p, qty: p.qty + 1 } : p);
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const handleRemoveFromCart = (id: string) => {
    setCart(prev => {
      const existing = prev.find(p => p.id === id);
      if (existing && existing.qty > 1) {
        return prev.map(p => p.id === id ? { ...p, qty: p.qty - 1 } : p);
      }
      return prev.filter(p => p.id !== id);
    });
  };

  const totalItems = cart.reduce((acc, item) => acc + item.qty, 0);
  const totalPrice = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);

  const processOrder = (method: string) => {
    alert(`order processed successfully via ${method}!`);
    setCart([]);
    setModalState('NONE');
    setCategory(null);
  };

  return (
    <div className="w-screen h-screen flex relative overflow-hidden bg-black font-sans">
      
      {/* background image taking full space behind overlays */}
      <div className="absolute inset-0 z-0">
         <Image src="/background.png" alt="Restaurant Background" fill className="object-cover opacity-80" priority />
      </div>

      {/* dark overlay when modal is open */}
      {modalState !== 'NONE' && (
         <div className="absolute inset-0 bg-black/70 z-40 transition-opacity"></div>
      )}

      {/* left sidebar */}
      <div className="w-[280px] h-full bg-[#00215e] z-10 flex flex-col border-r border-[#ffc55a]/20 shadow-2xl shrink-0">
        <div className="p-8 flex justify-center border-b border-[#ffc55a]/20">
          <Image src="/logo_emas.png" alt="Logo" width={100} height={100} className="drop-shadow-lg" />
        </div>
        
        <div className="flex-1 py-8 flex flex-col space-y-6">
          
          {/* food navigation */}
          <div className="px-8">
            <button 
              onClick={() => setCategory('FOOD')} 
              className={`flex items-center space-x-3 w-full text-left transition-colors ${category === 'FOOD' ? 'text-[#ffc55a]' : 'text-[#ffc55a]/50 hover:text-[#ffc55a]/80'}`}
            >
              <Utensils className="w-8 h-8 shrink-0" />
              <span className="text-2xl font-serif tracking-widest uppercase">Food</span>
            </button>
            <div className={`mt-4 ml-11 flex flex-col space-y-4 overflow-hidden transition-all duration-300 ${category === 'FOOD' ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
              {MENU_ITEMS.FOOD.map(item => (
                <span key={item.id} className="text-[#ffc55a]/70 text-sm font-serif tracking-wider hover:text-[#ffc55a] cursor-pointer" onClick={() => handleAddToCart(item)}>
                  {item.shortName}
                </span>
              ))}
            </div>
          </div>

          {/* drinks navigation */}
          <div className="px-8">
            <button 
              onClick={() => setCategory('DRINKS')} 
              className={`flex items-center space-x-3 w-full text-left transition-colors ${category === 'DRINKS' ? 'text-[#ffc55a]' : 'text-[#ffc55a]/50 hover:text-[#ffc55a]/80'}`}
            >
              <Wine className="w-8 h-8 shrink-0" />
              <span className="text-2xl font-serif tracking-widest uppercase">Drinks</span>
            </button>
            <div className={`mt-4 ml-11 flex flex-col space-y-4 overflow-hidden transition-all duration-300 ${category === 'DRINKS' ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
              {MENU_ITEMS.DRINKS.map(item => (
                <span key={item.id} className="text-[#ffc55a]/70 text-sm font-serif tracking-wider hover:text-[#ffc55a] cursor-pointer" onClick={() => handleAddToCart(item)}>
                  {item.shortName}
                </span>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* middle menu content area */}
      <div className="flex-1 relative z-10">
         {/* center dark gradient overlay to make cards readable */}
         <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent pointer-events-none"></div>
         
         {category === null ? (
            // idle state large logo
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
               <div className="w-[400px] h-[400px] opacity-80">
                  <Image src="/logo_emas.png" alt="Big Logo" width={400} height={400} className="object-contain drop-shadow-[0_0_50px_rgba(255,197,90,0.3)]" />
               </div>
            </div>
         ) : (
            // active menu list
            <div className="absolute left-8 top-12 bottom-12 w-[480px] overflow-y-auto space-y-5 pr-4 scrollbar-hide">
               {MENU_ITEMS[category].map(item => (
                 <div 
                   key={item.id} 
                   onClick={() => handleAddToCart(item)}
                   className="bg-[#18181b]/90 border border-gray-700/50 p-3 rounded-xl flex items-center space-x-5 cursor-pointer hover:border-[#ffc55a]/50 hover:bg-[#27272a]/90 transition-all shadow-xl"
                 >
                    <Image src={item.img} alt={item.name} width={130} height={80} className="rounded-lg object-cover h-[80px] bg-black shrink-0" />
                    <div className="flex-1 py-1">
                      <h4 className="text-[#ffc55a] font-serif text-sm tracking-widest uppercase leading-snug">{item.name}</h4>
                      <p className="text-[#ffc55a]/70 font-serif text-sm mt-2 tracking-wider">Rp. {item.price.toLocaleString('id-ID')}</p>
                    </div>
                 </div>
               ))}
            </div>
         )}
      </div>

      {/* right cart sidebar */}
      <div className="w-[400px] h-full z-10 flex flex-col pt-10 pb-8 px-8 shrink-0 border-l border-white/10 bg-black/20 backdrop-blur-sm">
         
         <div className="flex items-center space-x-4 mb-8 border-b border-[#ffc55a]/30 pb-4">
           <ClipboardList className="w-10 h-10 text-[#ffc55a]" />
           <div>
              <h3 className="text-[#ffc55a] text-3xl font-serif font-bold tracking-widest">Order Menu</h3>
              <p className="text-gray-400 text-sm font-serif tracking-wider">Table 10</p>
           </div>
         </div>

         <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide">
            {cart.length === 0 ? (
               <div className="h-full flex items-center justify-center">
                  <p className="text-[#ffc55a]/50 font-serif text-lg tracking-widest italic">Silahkan Pilih Menu...</p>
               </div>
            ) : (
               cart.map(item => (
                 <div key={item.id} className="bg-[#18181b]/90 border border-gray-700/50 p-3 rounded-xl flex items-center space-x-4 shadow-lg">
                    <Image src={item.img} alt={item.name} width={90} height={60} className="rounded-md object-cover h-[60px] bg-black shrink-0" />
                    <div className="flex-1">
                       <h4 className="text-[#ffc55a] font-serif text-[10px] uppercase leading-tight tracking-wider">{item.name}</h4>
                       <p className="text-[#ffc55a]/70 font-serif text-xs mt-1 tracking-wider">Rp. {(item.price * item.qty).toLocaleString('id-ID')}</p>
                    </div>
                    <div className="flex items-center space-x-3 bg-black/50 rounded-lg p-1.5 border border-gray-700">
                       <button onClick={() => handleRemoveFromCart(item.id)} className="text-[#ffc55a] p-1 hover:bg-white/10 rounded"><Minus className="w-3 h-3"/></button>
                       <span className="text-gray-300 text-xs font-bold w-3 text-center">{item.qty}</span>
                       <button onClick={() => handleAddToCart(item)} className="text-[#ffc55a] p-1 hover:bg-white/10 rounded"><Plus className="w-3 h-3"/></button>
                    </div>
                 </div>
               ))
            )}
         </div>

         {/* cart footer */}
         <div className="bg-[#cca762] rounded-3xl p-6 flex justify-between items-center mt-6 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
            <div className="flex flex-col justify-center">
               <p className="text-[#1a1a1a] font-serif text-sm tracking-wider font-bold mb-1">{totalItems} items</p>
               <p className="text-[#1a1a1a] font-serif font-extrabold text-2xl tracking-widest">Rp. {totalPrice.toLocaleString('id-ID')}</p>
            </div>
            <button 
               onClick={() => setModalState('PROCEED_PAYMENT')} 
               disabled={totalItems === 0} 
               className="bg-[#1a1a1a] text-[#cca762] px-8 py-4 rounded-2xl font-serif font-bold text-2xl tracking-widest hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-xl"
            >
               Order
            </button>
         </div>
      </div>

      {/* dynamic modals */}
      {modalState === 'PROCEED_PAYMENT' && (
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#ffb74d] rounded-2xl w-[450px] p-10 z-50 shadow-2xl flex flex-col items-center">
            <button onClick={() => setModalState('NONE')} className="absolute top-3 right-3 text-white bg-[#1a1a1a] rounded-full p-1.5 hover:scale-110 transition-transform">
               <X className="w-5 h-5"/>
            </button>
            <h2 className="text-[#1a1a1a] font-serif font-extrabold text-4xl mb-10 tracking-wide text-center mt-4">Proceed to payment</h2>
            <div className="w-full flex flex-col space-y-5">
               <button onClick={() => setModalState('PAYMENT_METHOD')} className="w-full bg-[#1a1a1a] text-[#ffb74d] py-5 rounded-2xl font-serif font-bold text-2xl tracking-widest hover:bg-black transition-colors shadow-lg">PAY NOW</button>
               <button onClick={() => processOrder('PAY LATER')} className="w-full bg-[#1a1a1a] text-[#ffb74d] py-5 rounded-2xl font-serif font-bold text-2xl tracking-widest hover:bg-black transition-colors shadow-lg">PAY LATER</button>
            </div>
         </div>
      )}

      {modalState === 'PAYMENT_METHOD' && (
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#ffb74d] rounded-2xl w-[450px] p-10 z-50 shadow-2xl flex flex-col items-center">
            <button onClick={() => setModalState('NONE')} className="absolute top-3 right-3 text-white bg-[#1a1a1a] rounded-full p-1.5 hover:scale-110 transition-transform">
               <X className="w-5 h-5"/>
            </button>
            <h2 className="text-[#1a1a1a] font-serif font-extrabold text-4xl mb-10 tracking-wide text-center mt-4 leading-tight">How would you like to pay?</h2>
            <div className="w-full flex flex-col space-y-5">
               <button onClick={() => processOrder('CASH')} className="w-full bg-[#1a1a1a] text-[#ffb74d] py-5 rounded-2xl font-serif font-bold text-2xl tracking-widest hover:bg-black transition-colors shadow-lg">CASH</button>
               <button onClick={() => processOrder('CASHLESS')} className="w-full bg-[#1a1a1a] text-[#ffb74d] py-5 rounded-2xl font-serif font-bold text-2xl tracking-widest hover:bg-black transition-colors shadow-lg">CASHLESS</button>
            </div>
         </div>
      )}

    </div>
  );
}
