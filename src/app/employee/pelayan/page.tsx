// unified waiter dashboard module interface
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, PlusCircle, Home, LogOut, User, AlertCircle, CheckCircle2, Minus, Plus, ShoppingBag, ClipboardList, PenTool, Utensils } from 'lucide-react';

interface Meja {
  noMeja: number;
  status: string;
}

interface Menu {
  id: string;
  namaMenu: string;
  harga: number;
}

interface BahanBaku {
  id: string;
  namaBahan: string;
  statusBahan: string;
}

interface CartItem {
  idMenu: string;
  namaMenu: string;
  harga: number;
  jumlahPesanan: number;
  subtotal: number;
  catatan?: string;
}

interface Pesanan {
  noNota: string;
  noMeja: number;
  statusPesanan: string;
  pelanggan: { namaPelanggan: string };
  detailPesanan: { menu: { namaMenu: string }; jumlahPesanan: number; catatan?: string }[];
}

// custom modal interface matching cashier
interface ModalState {
  isOpen: boolean;
  type: 'alert' | 'confirm' | 'success';
  message: string;
  onConfirm?: () => void;
}

export default function PelayanPage() {
  const router = useRouter();
  const [view, setView] = useState<'welcome' | 'dashboard' | 'new_order' | 'active_orders'>('welcome');
  const [listMeja, setListMeja] = useState<Meja[]>([]);
  const [listMenu, setListMenu] = useState<Menu[]>([]);
  const [listBahan, setListBahan] = useState<BahanBaku[]>([]);
  const [listPesanan, setListPesanan] = useState<Pesanan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // order creation state
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState<string>('');
  const [guestCount, setGuestCount] = useState<string>('1');
  const [cart, setCart] = useState<CartItem[]>([]);

  // dynamic waiter details state
  const [waiterId, setWaiterId] = useState<string>('');
  const [waiterName, setWaiterName] = useState<string>('');

  // custom modal state
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    type: 'alert',
    message: ''
  });

  useEffect(() => {
    // retrieve strictly logged in waiter info and enforce role security
    if (typeof window !== 'undefined') {
      const storedRole = localStorage.getItem('employeeRole') || localStorage.getItem('pegawai_role') || '';

      if (storedRole !== 'PELAYAN' && storedRole !== 'PEMILIK') {
        router.push('/employee/login');
        return;
      }

      const storedId = localStorage.getItem('idPegawai') || localStorage.getItem('pegawai_id') || localStorage.getItem('employeeId') || '';
      const storedName = localStorage.getItem('namaPegawai') || localStorage.getItem('pegawai_nama') || localStorage.getItem('employeeName') || 'Unknown Waiter';

      setWaiterId(storedId);
      setWaiterName(storedName);
    }
  }, [router]);

  useEffect(() => {
    if (view === 'dashboard' || view === 'new_order' || view === 'active_orders') {
      fetchTables(view === 'dashboard');
    }
    if (view === 'new_order') {
      fetchMenu();
      fetchInventory();
    }
    if (view === 'active_orders' || view === 'dashboard') {
      fetchActiveOrders(view === 'active_orders');
      // auto poll order status
      const interval = setInterval(() => fetchActiveOrders(false), 5000);
      return () => clearInterval(interval);
    }
  }, [view]);

  async function fetchTables(showLoading = true) {
    if (showLoading) setLoading(true);
    try {
      const res = await fetch('/api/meja');
      const data = await res.json();
      if (data.sukses || Array.isArray(data)) setListMeja(Array.isArray(data) ? data : data.data);
    } catch (err) {
      console.error('failed to fetch tables:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  async function fetchMenu() {
    try {
      const res = await fetch('/api/menu');
      const data = await res.json();
      if (data.sukses || Array.isArray(data)) setListMenu(Array.isArray(data) ? data : data.data);
    } catch (err) {
      console.error('failed to fetch menu:', err);
    }
  }

  async function fetchInventory() {
    try {
      const res = await fetch('/api/bahan-baku');
      const data = await res.json();
      if (data.sukses || Array.isArray(data)) setListBahan(Array.isArray(data) ? data : data.data);
    } catch (err) {
      console.error('failed to fetch inventory:', err);
    }
  }

  async function fetchActiveOrders(showLoading = true) {
    if (showLoading && view === 'active_orders') setLoading(true);
    try {
      const res = await fetch('/api/pesanan');
      const data = await res.json();
      if (data.sukses || Array.isArray(data)) {
        const payload = Array.isArray(data) ? data : data.data;
        // only show orders that are not fully completed or canceled
        const active = payload.filter((p: Pesanan) => p.statusPesanan !== 'SELESAI' && p.statusPesanan !== 'DIBATALKAN');
        setListPesanan(active);
      }
    } catch (err) {
      console.error('failed to fetch active orders:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  // helper to check if menu is available based on raw material keywords
  const isMenuAvailable = (menuName: string) => {
    const outOfStock = listBahan.filter(b => b.statusBahan === 'HABIS').map(b => b.namaBahan.toLowerCase());
    return !outOfStock.some(bahan => menuName.toLowerCase().includes(bahan));
  };

  // helper to show custom modal
  const showModal = (type: ModalState['type'], message: string, onConfirm?: () => void) => {
    setModal({ isOpen: true, type, message, onConfirm });
  };

  const closeModal = () => setModal((prev) => ({ ...prev, isOpen: false }));

  // cart operations
  const updateCart = (menu: Menu, delta: number) => {
    if (!isMenuAvailable(menu.namaMenu)) {
      return showModal('alert', 'This item is currently out of stock based on kitchen inventory.');
    }

    setCart(prev => {
      const existing = prev.find(item => item.idMenu === menu.id);
      if (existing) {
        const newCount = existing.jumlahPesanan + delta;
        if (newCount <= 0) return prev.filter(item => item.idMenu !== menu.id);
        return prev.map(item => item.idMenu === menu.id
          ? { ...item, jumlahPesanan: newCount, subtotal: newCount * menu.harga }
          : item
        );
      } else if (delta > 0) {
        return [...prev, { idMenu: menu.id, namaMenu: menu.namaMenu, harga: menu.harga, jumlahPesanan: 1, subtotal: menu.harga, catatan: '' }];
      }
      return prev;
    });
  };

  const updateCartNote = (idMenu: string, text: string) => {
    setCart(prev => prev.map(item => item.idMenu === idMenu ? { ...item, catatan: text } : item));
  };

  async function handleCreateOrder() {
    if (!selectedTable) return showModal('alert', 'Please select a table number first.');
    if (!customerName || customerName.trim() === '') return showModal('alert', 'Customer Name is mandatory.');
    if (cart.length === 0) return showModal('alert', 'Cannot create an order with an empty cart.');

    showModal('confirm', `Are you sure you want to place this order for Table ${selectedTable}?`, async () => {
      closeModal();
      try {
        const res = await fetch('/api/pesanan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            namaPelanggan: customerName.trim(),
            idPegawai: waiterId,
            jumlahOrang: parseInt(guestCount) || 1,
            noMeja: selectedTable,
            items: cart.map(item => ({ idMenu: item.idMenu, jumlahPesanan: item.jumlahPesanan, subtotal: item.subtotal, catatan: item.catatan })),
            statusTagihan: 'UNPAID'
          }),
        });

        const data = await res.json();

        if (data.sukses || data.id) {
          // reset form
          setSelectedTable(null);
          setCustomerName('');
          setGuestCount('1');
          setCart([]);
          showModal('success', 'Order has been successfully routed to the kitchen.');
          setView('active_orders');
        } else {
          showModal('alert', data.pesan || 'Failed to create the order.');
        }
      } catch (err) {
        showModal('alert', 'A network error occurred while placing the order.');
      }
    });
  }

  async function handleServeOrder(noNota: string) {
    showModal('confirm', 'Has this order been served to the customer?', async () => {
      closeModal();
      try {
        const res = await fetch('/api/pesanan', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ noNota, statusPesanan: 'SELESAI' }),
        });
        const data = await res.json();

        if (data.sukses || data.noNota) {
          showModal('success', 'Order successfully marked as served.');
          fetchActiveOrders(false);
          setSelectedTable(null);
        } else {
          showModal('alert', data.pesan || 'Failed to update order status.');
        }
      } catch (err) {
        showModal('alert', 'Network error while updating the order status.');
      }
    });
  }

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

  // get active order for a specific table
  const getTableOrder = (tableNo: number) => {
    return listPesanan.find(o => o.noMeja === tableNo);
  };

  const activeOrder = selectedTable ? getTableOrder(selectedTable) : null;

  // ---------------------------------------------------------
  // 0. custom modal component
  // ---------------------------------------------------------
  const renderModal = () => {
    if (!modal.isOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300">
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
        {renderModal()}
        <div className="absolute top-6 right-6">
           <button onClick={handleLogout} className="bg-[#fc4100] px-5 py-2.5 rounded-xl font-extrabold hover:bg-[#ffc55a] hover:text-[#00215e] transition-colors text-white shadow-md tracking-wider flex items-center">
             <LogOut className="w-5 h-5 mr-2" /> Logout
           </button>
        </div>

        <div className="flex flex-col items-center w-full max-w-[700px] px-4">
          <div className="flex flex-col items-center mb-8">
            <Image src="/logo_emas.png" alt="RestoLink Logo" width={110} height={110} className="object-contain drop-shadow-lg mb-2" priority />
            <h1 className="text-4xl font-extrabold text-white tracking-wider mt-2 drop-shadow-md">
              RESTO<span className="text-[#ffc55a]">LINK</span>
            </h1>
            <div className="bg-[#2c4e80] text-white text-xs font-bold tracking-widest mt-3 px-6 py-1.5 rounded-full shadow-md uppercase">
              Waiter Portal
            </div>

            {/* active waiter profile display */}
            <div className="mt-4 flex items-center bg-[#00215e]/80 border border-[#ffc55a]/30 px-4 py-2 rounded-xl text-white text-sm shadow-inner">
              <User className="w-4 h-4 text-[#ffc55a] mr-2" />
              <span className="text-gray-300 mr-1">Active Waiter:</span>
              <span className="font-extrabold text-[#ffc55a]">{waiterName}</span>
              <span className="text-xs text-gray-400 ml-1.5">({waiterId || 'No ID'})</span>
            </div>
          </div>

          <div className="bg-[#2c4e80] w-full p-10 rounded-2xl shadow-2xl flex justify-center space-x-6 border border-[#ffc55a]/10">
            <button onClick={() => setView('dashboard')} className="bg-white text-[#00215e] p-6 rounded-xl flex flex-col items-center w-40 h-40 justify-center shadow-lg hover:bg-[#ffc55a] transition-all hover:-translate-y-1">
              <LayoutDashboard className="w-14 h-14 mb-3" />
              <span className="font-extrabold text-lg text-center leading-tight">Table<br/>Status</span>
            </button>
            <button onClick={() => setView('new_order')} className="bg-white text-[#00215e] p-6 rounded-xl flex flex-col items-center w-40 h-40 justify-center shadow-lg hover:bg-[#ffc55a] transition-all hover:-translate-y-1">
              <PlusCircle className="w-14 h-14 mb-3" />
              <span className="font-extrabold text-lg text-center leading-tight">Create<br/>Order</span>
            </button>
            <button onClick={() => setView('active_orders')} className="bg-white text-[#00215e] p-6 rounded-xl flex flex-col items-center w-40 h-40 justify-center shadow-lg hover:bg-[#ffc55a] transition-all hover:-translate-y-1">
              <ClipboardList className="w-14 h-14 mb-3" />
              <span className="font-extrabold text-lg text-center leading-tight">Active<br/>Orders</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // 2. main waiter interface
  // ---------------------------------------------------------
  return (
    <div className="w-screen h-screen flex bg-[#00215e] font-sans overflow-hidden">
      {renderModal()}

      {/* sidebar matching cashier */}
      <div className="w-[280px] bg-[#00215e] flex flex-col items-center py-10 shrink-0 border-r border-[#2c4e80] z-30 shadow-[10px_0_20px_rgba(0,0,0,0.5)]">
        <Image src="/logo_emas.png" alt="Logo" width={100} height={100} />
        <h2 className="text-white font-extrabold text-4xl mt-6 mb-3 tracking-wider">Waiter</h2>

        {/* waiter profile badge in sidebar */}
        <div className="mb-8 flex items-center bg-[#2c4e80]/60 border border-[#ffc55a]/20 px-3 py-1.5 rounded-lg text-xs text-white">
          <User className="w-3.5 h-3.5 text-[#ffc55a] mr-1.5 shrink-0" />
          <span className="font-semibold truncate">{waiterName}</span>
        </div>

        <button
          onClick={() => { setView('dashboard'); setSelectedTable(null); }}
          className={`w-3/4 py-4 rounded-xl font-extrabold text-lg mb-4 shadow-lg transition-colors flex items-center justify-center ${view === 'dashboard' ? 'bg-[#ffc55a] text-[#00215e]' : 'bg-[#2c4e80] text-white hover:bg-[#ffc55a] hover:text-[#00215e]'}`}
        >
          <LayoutDashboard className="w-5 h-5 mr-2" /> Floor Map
        </button>
        <button
          onClick={() => { setView('new_order'); setSelectedTable(null); }}
          className={`w-3/4 py-4 rounded-xl font-extrabold text-lg mb-4 shadow-lg transition-colors flex items-center justify-center ${view === 'new_order' ? 'bg-[#ffc55a] text-[#00215e]' : 'bg-[#2c4e80] text-white hover:bg-[#ffc55a] hover:text-[#00215e]'}`}
        >
          <PlusCircle className="w-5 h-5 mr-2" /> New Order
        </button>
        <button
          onClick={() => { setView('active_orders'); setSelectedTable(null); }}
          className={`w-3/4 py-4 rounded-xl font-extrabold text-lg mb-6 shadow-lg transition-colors flex items-center justify-center ${view === 'active_orders' ? 'bg-[#ffc55a] text-[#00215e]' : 'bg-[#2c4e80] text-white hover:bg-[#ffc55a] hover:text-[#00215e]'}`}
        >
          <ClipboardList className="w-5 h-5 mr-2" /> Order Status
        </button>

        <div className="mt-auto w-full flex flex-col items-center">
           <button onClick={() => setView('welcome')} className="text-white font-bold text-xl flex items-center hover:text-[#ffc55a] transition-colors">
             <Home className="w-6 h-6 mr-3" /> Home
           </button>
        </div>
      </div>

      <div className="flex-1 bg-[#2c4e80] p-10 rounded-tl-[40px] shadow-[inset_10px_10px_20px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden relative">

         {/* dashboard / table view (sci-fi movie map layout) */}
         {view === 'dashboard' && (
           <div className="absolute inset-0 flex">
              <div className="absolute inset-0 bg-[url('/background.png')] bg-cover bg-center opacity-10 pointer-events-none mix-blend-screen"></div>

              {/* left map area */}
              <div className="flex-1 flex flex-col p-10 relative z-10">
                <div className="flex justify-between items-center mb-6 shrink-0">
                  <h3 className="text-white text-3xl font-extrabold tracking-wide uppercase">Restaurant Map Monitor</h3>
                  <div className="flex items-center space-x-4">
                     <div className="flex items-center text-[10px] uppercase font-bold tracking-widest text-white">
                        <span className="w-3 h-3 rounded bg-[#2c4e80] border border-white mr-2"></span> Available
                        <span className="w-3 h-3 rounded bg-red-500/20 border border-red-500 ml-4 mr-2"></span> Occupied
                        <span className="w-3 h-3 rounded bg-green-500/20 border border-green-500 ml-4 mr-2 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></span> Ready
                     </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto [scrollbar-width:none] flex items-center justify-center bg-[#00215e]/30 rounded-3xl border-2 border-[#ffc55a]/10 backdrop-blur-sm p-8 shadow-inner">
                  {loading ? (
                     <p className="text-center text-white font-bold text-xl animate-pulse">Scanning Floor Plan...</p>
                  ) : (
                    <div className="grid grid-cols-5 gap-6 max-w-5xl w-full">
                      {listMeja.map((meja) => {
                        const order = getTableOrder(meja.noMeja);
                        let isAvailable = meja.status === 'TERSEDIA' && !order;

                        let bgClass = isAvailable ? 'bg-[#2c4e80]/80 border-white/20' : 'bg-red-500/10 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]';
                        let textClass = isAvailable ? 'text-white' : 'text-red-400';
                        let animationClass = '';
                        let badge = null;

                        if (order) {
                          if (order.statusPesanan === 'SELESAI') {
                             bgClass = 'bg-green-500/20 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]';
                             textClass = 'text-green-400';
                             animationClass = 'animate-pulse';
                             badge = <span className="absolute -top-3 -right-3 bg-green-500 text-[#00215e] text-[10px] font-black px-2 py-1 rounded-lg shadow-lg">SERVE</span>;
                          } else if (order.statusPesanan === 'DIPROSES') {
                             bgClass = 'bg-[#ffc55a]/10 border-[#ffc55a]/50 shadow-[0_0_15px_rgba(255,197,90,0.2)]';
                             textClass = 'text-[#ffc55a]';
                             badge = <span className="absolute -top-3 -right-3 bg-[#ffc55a] text-[#00215e] text-[9px] font-black px-2 py-1 rounded-lg">COOKING</span>;
                          }
                        }

                        const isSelected = selectedTable === meja.noMeja;

                        return (
                          <div
                            key={meja.noMeja}
                            onClick={() => setSelectedTable(meja.noMeja)}
                            className={`relative aspect-square border-2 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 backdrop-blur-md ${bgClass} ${isSelected ? 'ring-4 ring-white/50 scale-105 z-20' : 'z-10'} ${animationClass}`}
                          >
                            {badge}
                            <span className={`text-4xl font-black mb-1 ${textClass}`}>{meja.noMeja}</span>
                            <span className={`text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded opacity-80 ${isAvailable ? 'bg-white/10' : 'bg-red-500/20'}`}>
                              {order ? 'Occupied' : 'Free'}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* right detail panel */}
              <div className="w-[420px] bg-[#00215e]/80 backdrop-blur-xl border-l border-[#ffc55a]/20 flex flex-col shrink-0 shadow-[-20px_0_30px_rgba(0,0,0,0.3)] relative z-20">
                {!selectedTable ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 opacity-40 text-center">
                    <Utensils className="w-20 h-20 mb-6 text-white" />
                    <p className="text-xl text-white font-black tracking-widest uppercase">Target a Table on the Map</p>
                  </div>
                ) : (
                  <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-8 duration-300">
                    <div className="p-8 border-b border-[#ffc55a]/20 bg-black/20 shrink-0">
                      <div className="flex justify-between items-start mb-2">
                        <h2 className="text-5xl text-white font-black tracking-widest">T-{selectedTable}</h2>
                        {activeOrder && (
                          <span className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest ${
                            activeOrder.statusPesanan === 'SELESAI' ? 'bg-green-500 text-[#00215e]' :
                            activeOrder.statusPesanan === 'DIPROSES' ? 'bg-[#ffc55a] text-[#00215e]' :
                            'bg-red-500 text-white'
                          }`}>
                            {activeOrder.statusPesanan}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-300 font-semibold tracking-wide uppercase">
                        {activeOrder ? `Guest: ${activeOrder.pelanggan?.namaPelanggan || 'Unknown'}` : 'No Active Order'}
                      </p>
                    </div>

                    <div className="flex-1 p-8 overflow-y-auto [scrollbar-width:thin]">
                      {!activeOrder ? (
                        <div className="text-center text-sm text-gray-400 font-bold italic mt-10">This table is clean.</div>
                      ) : (
                        <div className="space-y-6">
                          <div className="bg-white/5 border border-white/10 p-5 rounded-2xl shadow-lg">
                            <h3 className="text-[10px] text-gray-400 font-bold tracking-widest uppercase border-b border-white/10 pb-3 mb-4">Order Items List</h3>
                            <div className="space-y-4">
                              {activeOrder.detailPesanan.map((item, idx) => (
                                <div key={idx} className="flex flex-col text-white">
                                  <div className="flex items-start">
                                    <span className="font-black bg-white/10 text-white px-2 py-0.5 rounded text-xs h-fit mr-3 shrink-0">{item.jumlahPesanan}x</span>
                                    <span className="font-extrabold text-sm leading-snug uppercase tracking-wide">{item.menu.namaMenu}</span>
                                  </div>
                                  {item.catatan && <span className="text-xs text-[#ffc55a] italic ml-10 mt-1 flex items-center"><PenTool className="w-3 h-3 mr-1"/> {item.catatan}</span>}
                                </div>
                              ))}
                            </div>
                          </div>

                          {activeOrder.statusPesanan === 'SELESAI' && (
                            <div className="bg-green-500/10 border border-green-500/40 p-5 rounded-2xl flex items-center space-x-4 relative overflow-hidden group cursor-pointer" onClick={() => handleServeOrder(activeOrder.noNota)}>
                              <div className="absolute inset-0 bg-green-500/20 group-hover:bg-green-500/30 transition-colors"></div>
                              <CheckCircle2 className="w-10 h-10 text-green-400 shrink-0 relative z-10" />
                              <div className="relative z-10">
                                <h4 className="text-green-400 font-black tracking-widest uppercase text-base mb-1">Deliver Order</h4>
                                <p className="text-[10px] text-green-200/80 font-bold leading-tight">Kitchen preparation complete. Click this card to mark as served.</p>
                              </div>
                            </div>
                          )}

                          {activeOrder.statusPesanan === 'MENUNGGU' && (
                            <div className="bg-red-500/10 border border-red-500/40 p-5 rounded-2xl flex items-center space-x-4">
                              <AlertCircle className="w-10 h-10 text-red-500 shrink-0" />
                              <div>
                                <h4 className="text-red-500 font-black tracking-widest uppercase text-sm mb-1">Queueing</h4>
                                <p className="text-[10px] text-red-200/80 font-bold">Order transmitted to kitchen. Awaiting processing.</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {!activeOrder && (
                       <div className="p-8 border-t border-[#ffc55a]/20 bg-black/20 shrink-0">
                         <button
                           onClick={() => setView('new_order')}
                           className="w-full py-4 rounded-xl font-extrabold text-[#00215e] text-lg uppercase tracking-widest bg-[#ffc55a] hover:bg-yellow-400 transition-colors shadow-lg flex justify-center items-center"
                         >
                           <PlusCircle className="w-5 h-5 mr-2"/> Take Order
                         </button>
                       </div>
                    )}
                  </div>
                )}
              </div>
           </div>
         )}

         {/* new order entry view */}
         {view === 'new_order' && (
           <div className="flex h-full space-x-6">

             {/* menu catalog (left side) */}
             <div className="flex-1 flex flex-col h-full overflow-hidden bg-white/5 p-6 rounded-2xl border border-white/10 relative z-10">
               <h3 className="text-white text-2xl font-extrabold tracking-wide mb-4 shrink-0">Menu Catalog</h3>
               <div className="flex-1 overflow-y-auto [scrollbar-width:thin] pr-2">
                 <div className="grid grid-cols-2 gap-4">
                   {listMenu.map(menu => {
                     const isAvail = isMenuAvailable(menu.namaMenu);
                     const countInCart = cart.find(c => c.idMenu === menu.id)?.jumlahPesanan || 0;
                     return (
                       <div key={menu.id} className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col justify-between ${!isAvail ? 'opacity-60 grayscale' : ''}`}>
                         <div>
                           <div className="flex justify-between items-start">
                             <h4 className="font-extrabold text-[#00215e] text-lg leading-tight mb-1 pr-2">{menu.namaMenu}</h4>
                             {!isAvail && (
                               <span className="text-[10px] bg-red-100 text-red-600 font-bold px-2 py-1 rounded uppercase tracking-wider shrink-0">Out of Stock</span>
                             )}
                           </div>
                           <p className="text-[#fc4100] font-bold">Rp. {menu.harga.toLocaleString('id-ID')}</p>
                         </div>
                         <div className="mt-4 flex items-center justify-between">
                           <button onClick={() => updateCart(menu, -1)} disabled={countInCart === 0} className="w-10 h-10 rounded-full bg-gray-100 text-[#00215e] flex items-center justify-center font-bold hover:bg-gray-200 disabled:opacity-30 transition-colors">
                             <Minus className="w-5 h-5" />
                           </button>
                           <span className="font-extrabold text-xl text-[#00215e] w-8 text-center">{countInCart}</span>
                           <button onClick={() => updateCart(menu, 1)} disabled={!isAvail} className="w-10 h-10 rounded-full bg-[#ffc55a] text-[#00215e] flex items-center justify-center font-bold hover:bg-yellow-400 disabled:opacity-30 transition-colors">
                             <Plus className="w-5 h-5" />
                           </button>
                         </div>
                       </div>
                     )
                   })}
                 </div>
               </div>
             </div>

             {/* order details & cart summary (right side) */}
             <div className="w-[420px] bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden shrink-0 relative z-10">
               <div className="bg-[#00215e] p-5 text-white">
                 <h3 className="text-xl font-extrabold flex items-center"><ShoppingBag className="w-5 h-5 mr-2" /> Order Details</h3>
               </div>

               <div className="p-5 border-b border-gray-200 space-y-4 shrink-0">
                 <div className="flex space-x-3">
                   <div className="flex-1 flex flex-col">
                     <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Table No.</label>
                     <select
                       value={selectedTable || ''}
                       onChange={(e) => setSelectedTable(parseInt(e.target.value))}
                       className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 font-extrabold text-[#00215e] focus:outline-none focus:ring-2 focus:ring-[#ffc55a]"
                     >
                       <option value="" disabled>Select</option>
                       {listMeja.map(m => (
                         <option key={m.noMeja} value={m.noMeja}>{m.noMeja} {m.status !== 'TERSEDIA' ? '(Occupied)' : ''}</option>
                       ))}
                     </select>
                   </div>
                   <div className="w-1/3 flex flex-col">
                     <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Guests</label>
                     <input
                       type="number" min="1"
                       value={guestCount}
                       onChange={(e) => setGuestCount(e.target.value)}
                       className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 font-extrabold text-[#00215e] text-center focus:outline-none focus:ring-2 focus:ring-[#ffc55a]"
                     />
                   </div>
                 </div>
                 <div className="flex flex-col">
                   <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 flex justify-between">
                     <span>Customer Name</span>
                     <span className="text-red-500">*Required</span>
                   </label>
                   <input
                     type="text"
                     value={customerName}
                     onChange={(e) => setCustomerName(e.target.value)}
                     placeholder="e.g. John Doe"
                     required
                     className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 font-bold text-[#00215e] focus:outline-none focus:ring-2 focus:ring-[#ffc55a]"
                   />
                 </div>
               </div>

               <div className="flex-1 overflow-y-auto p-5 [scrollbar-width:thin] bg-gray-50/50">
                 {cart.length === 0 ? (
                   <div className="h-full flex items-center justify-center text-gray-400 font-bold italic text-sm">
                     Cart is empty
                   </div>
                 ) : (
                   <div className="space-y-4">
                     {cart.map(item => (
                       <div key={item.idMenu} className="flex flex-col text-sm border-b border-gray-200 pb-3 last:border-0">
                         <div className="flex justify-between items-start mb-2">
                           <div className="flex-1 pr-2">
                             <p className="font-extrabold text-[#00215e] leading-tight">{item.namaMenu}</p>
                             <p className="text-gray-500 font-bold text-xs">x{item.jumlahPesanan}</p>
                           </div>
                           <span className="font-bold text-[#00215e]">{(item.subtotal).toLocaleString('id-ID')}</span>
                         </div>
                         {/* order notes section */}
                         <div className="relative mt-1">
                           <PenTool className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                           <input
                             type="text"
                             placeholder="Add notes (e.g., No onions, extra spicy)..."
                             value={item.catatan || ''}
                             onChange={(e) => updateCartNote(item.idMenu, e.target.value)}
                             className="w-full bg-white border border-gray-200 rounded text-xs py-1.5 pl-8 pr-2 focus:outline-none focus:border-[#ffc55a]"
                           />
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
               </div>

               <div className="p-5 border-t border-gray-200 bg-white shrink-0">
                 <div className="flex justify-between items-center mb-4 text-[#00215e]">
                   <span className="font-extrabold uppercase tracking-wide">Subtotal</span>
                   <span className="text-xl font-extrabold">Rp. {cart.reduce((sum, item) => sum + item.subtotal, 0).toLocaleString('id-ID')}</span>
                 </div>
                 <button
                   onClick={handleCreateOrder}
                   disabled={cart.length === 0 || !selectedTable || !customerName.trim()}
                   className="w-full py-4 rounded-xl font-extrabold text-white text-lg uppercase tracking-widest bg-[#fc4100] hover:bg-[#e03a00] transition-colors disabled:opacity-50 shadow-lg"
                 >
                   Send to Kitchen
                 </button>
               </div>
             </div>
           </div>
         )}

         {/* active orders status view */}
         {view === 'active_orders' && (
           <div className="flex-1 flex flex-col overflow-hidden relative z-10">
             <h3 className="text-white text-3xl font-extrabold tracking-wide mb-8 shrink-0">Active Table Orders</h3>

             <div className="space-y-4 overflow-y-auto pr-2 pb-4 [scrollbar-width:thin]">
               {loading ? (
                 <p className="text-center text-white font-bold mt-10 text-xl">Loading active orders...</p>
               ) : listPesanan.length === 0 ? (
                 <p className="text-center text-white/70 font-bold mt-10 text-xl italic">No active orders currently.</p>
               ) : (
                 listPesanan.map(pesanan => {
                   const isReady = pesanan.statusPesanan === 'SELESAI';
                   const isCooking = pesanan.statusPesanan === 'DIPROSES';
                   return (
                     <div key={pesanan.noNota} className="flex space-x-4">
                       <div className="bg-[#00215e] w-36 flex flex-col items-center justify-center rounded-xl text-white font-extrabold shadow-md py-4">
                         <span className="text-sm uppercase tracking-widest text-[#ffc55a] mb-1">Table</span>
                         <span className="text-5xl">{pesanan.noMeja}</span>
                       </div>

                       <div className="flex-1 bg-white p-5 rounded-xl text-[#00215e] shadow-sm flex flex-col justify-center">
                         <div className="flex justify-between items-center mb-3">
                           <span className="font-extrabold text-xl">{pesanan.pelanggan?.namaPelanggan || 'Guest'}</span>
                           <span className="text-xs bg-gray-100 px-3 py-1 rounded-md font-bold text-gray-500">ID: {pesanan.noNota}</span>
                         </div>
                         <div className="flex flex-wrap gap-2">
                           {pesanan.detailPesanan.map((item, idx) => (
                             <div key={idx} className="bg-gray-100 px-3 py-1.5 rounded-lg text-sm flex flex-col">
                               <span className="font-bold">{item.jumlahPesanan}x {item.menu.namaMenu}</span>
                               {item.catatan && <span className="text-xs text-gray-500 italic flex items-center mt-0.5"><PenTool className="w-3 h-3 mr-1"/> {item.catatan}</span>}
                             </div>
                           ))}
                         </div>
                       </div>

                       <div className="w-56 flex flex-col justify-center space-y-2 shrink-0">
                         {isReady ? (
                           <button
                             onClick={() => handleServeOrder(pesanan.noNota)}
                             className="w-full h-full rounded-xl font-extrabold text-2xl flex items-center justify-center shadow-md transition-all uppercase tracking-widest bg-[#588157] text-white hover:opacity-90 shadow-[0_0_15px_rgba(88,129,87,0.6)] animate-pulse"
                           >
                             Serve to Table
                           </button>
                         ) : (
                           <div className="w-full h-full rounded-xl font-extrabold text-xl flex flex-col items-center justify-center shadow-md uppercase tracking-widest bg-gray-200 text-gray-500 border-2 border-dashed border-gray-400">
                             <span>{isCooking ? 'Cooking...' : 'Waiting'}</span>
                           </div>
                         )}
                       </div>
                     </div>
                   );
                 })
               )}
             </div>
           </div>
         )}
      </div>
    </div>
  );
}
