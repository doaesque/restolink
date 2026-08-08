// unified chef dashboard module interface
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ConciergeBell, Package, Home, Check, X, LogOut, User, AlertCircle, CheckCircle2 } from 'lucide-react';

interface DetailPesanan {
  idDetail: string;
  jumlahPesanan: number;
  menu: { namaMenu: string };
}

interface Pesanan {
  noNota: string;
  noMeja: number;
  statusPesanan: string;
  detailPesanan: DetailPesanan[];
}

interface BahanBaku {
  id: string;
  namaBahan: string;
  statusBahan: string;
}

// custom modal interface matching cashier
interface ModalState {
  isOpen: boolean;
  type: 'alert' | 'confirm' | 'success';
  message: string;
  onConfirm?: () => void;
}

export default function KokiPage() {
  const router = useRouter();
  const [view, setView] = useState<'welcome' | 'orders' | 'inventory'>('welcome');
  const [listPesanan, setListPesanan] = useState<Pesanan[]>([]);
  const [listBahan, setListBahan] = useState<BahanBaku[]>([]);
  const [itemReadyState, setItemReadyState] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<boolean>(true);

  // dynamic chef details state
  const [chefId, setChefId] = useState<string>('');
  const [chefName, setChefName] = useState<string>('');

  // custom modal state
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    type: 'alert',
    message: ''
  });

  useEffect(() => {
    // retrieve strictly logged in chef info from localstorage
    if (typeof window !== 'undefined') {
      const storedId = localStorage.getItem('idPegawai') || localStorage.getItem('pegawai_id') || '';
      const storedName = localStorage.getItem('namaPegawai') || localStorage.getItem('pegawai_nama') || 'Unknown Chef';

      setChefId(storedId);
      setChefName(storedName);
    }
  }, []);

  useEffect(() => {
    // auto-polling feature setup
    let interval: NodeJS.Timeout;
    if (view === 'orders') {
      fetchInventory(false).then(() => fetchOrders(true));
      interval = setInterval(() => { fetchInventory(false); fetchOrders(false); }, 5000);
    } else if (view === 'inventory') {
      fetchInventory(true);
    }

    return () => clearInterval(interval);
  }, [view]);

  async function fetchOrders(showLoading = true) {
    if (showLoading) setLoading(true);
    try {
      const res = await fetch('/api/pesanan');
      const data = await res.json();
      if (data.sukses || data.data) {
        const rawData = data.data || data;
        // only show orders that are not fully served, not ready, and not canceled
        setListPesanan(rawData.filter((p: Pesanan) => p.statusPesanan !== 'SELESAI' && p.statusPesanan !== 'SIAP' && p.statusPesanan !== 'DIBATALKAN'));
      }
    } catch (err) {
      console.error('failed to fetch orders:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  async function fetchInventory(showLoading = true) {
    if (showLoading) setLoading(true);
    try {
      const res = await fetch('/api/bahan-baku');
      const data = await res.json();
      if (data.sukses) setListBahan(data.data);
    } catch (err) {
      console.error('failed to fetch inventory:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  // helper to check if an order contains an item with missing ingredients
  const checkOrderAvailability = (pesanan: Pesanan) => {
    const outOfStock = listBahan.filter(b => b.statusBahan === 'HABIS').map(b => b.namaBahan.toLowerCase());
    const hasMissingIngredient = pesanan.detailPesanan.some(item =>
      outOfStock.some(bahan => item.menu.namaMenu.toLowerCase().includes(bahan))
    );
    return hasMissingIngredient;
  };

  // helper to show custom modal
  const showModal = (type: ModalState['type'], message: string, onConfirm?: () => void) => {
    setModal({ isOpen: true, type, message, onConfirm });
  };

  const closeModal = () => setModal((prev) => ({ ...prev, isOpen: false }));

  const toggleItemReady = (detailId: string) => {
    setItemReadyState((prev) => ({ ...prev, [detailId]: !prev[detailId] }));
  };

  const isOrderFullyReady = (pesanan: Pesanan) => {
    return pesanan.detailPesanan.every((item) => itemReadyState[item.idDetail]);
  };

  async function handleMarkOrderReady(noNota: string) {
    showModal('confirm', 'Are you sure you want to mark this entire order as ready to be served?', async () => {
      closeModal();
      try {
        const res = await fetch('/api/pesanan', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ noNota, statusPesanan: 'SIAP' }),
        });
        const data = await res.json();

        if (data.sukses) {
          showModal('success', 'Order has been successfully marked as ready.');
          fetchOrders(false);
        } else {
          showModal('alert', data.pesan || 'Failed to mark order as ready.');
        }
      } catch (err) {
        showModal('alert', 'A network error occurred while updating the order status.');
      }
    });
  }

  async function handleRejectOrder(noNota: string) {
    showModal('confirm', 'Are you sure you want to reject and cancel this order due to missing ingredients?', async () => {
      closeModal();
      try {
        const res = await fetch('/api/pesanan', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ noNota, statusPesanan: 'DIBATALKAN' }),
        });
        const data = await res.json();

        if (data.sukses) {
          showModal('success', 'Order has been rejected and canceled.');
          fetchOrders(false);
        } else {
          showModal('alert', data.pesan || 'Failed to cancel the order.');
        }
      } catch (err) {
        showModal('alert', 'A network error occurred while canceling the order.');
      }
    });
  }

  async function handleToggleBahanStatus(id: string, currentStatus: string) {
    const nextStatus = currentStatus === 'TERSEDIA' ? 'HABIS' : 'TERSEDIA';
    try {
      const res = await fetch('/api/bahan-baku', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, statusBahan: nextStatus }),
      });
      const data = await res.json();
      if (data.sukses) {
        fetchInventory(false);
      } else {
        showModal('alert', data.pesan || 'Failed to update inventory status.');
      }
    } catch (err) {
      showModal('alert', 'A network error occurred while updating the inventory status.');
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('pegawai_id');
      localStorage.removeItem('pegawai_nama');
      localStorage.removeItem('idPegawai');
      localStorage.removeItem('namaPegawai');
    }
    router.push('/employee/login');
  }

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

        <div className="flex flex-col items-center w-full max-w-[600px] px-4">
          <div className="flex flex-col items-center mb-8">
            <Image src="/logo_emas.png" alt="RestoLink Logo" width={110} height={110} className="object-contain drop-shadow-lg mb-2" priority />
            <h1 className="text-4xl font-extrabold text-white tracking-wider mt-2 drop-shadow-md">
              RESTO<span className="text-[#ffc55a]">LINK</span>
            </h1>
            <div className="bg-[#2c4e80] text-white text-xs font-bold tracking-widest mt-3 px-6 py-1.5 rounded-full shadow-md uppercase">
              Chef Portal
            </div>

            {/* active chef profile display */}
            <div className="mt-4 flex items-center bg-[#00215e]/80 border border-[#ffc55a]/30 px-4 py-2 rounded-xl text-white text-sm shadow-inner">
              <User className="w-4 h-4 text-[#ffc55a] mr-2" />
              <span className="text-gray-300 mr-1">Active Chef:</span>
              <span className="font-extrabold text-[#ffc55a]">{chefName}</span>
              <span className="text-xs text-gray-400 ml-1.5">({chefId || 'No ID'})</span>
            </div>
          </div>

          <div className="bg-[#2c4e80] w-full p-10 rounded-2xl shadow-2xl flex justify-center space-x-8 border border-[#ffc55a]/10">
            <button onClick={() => setView('orders')} className="bg-white text-[#00215e] p-6 rounded-xl flex flex-col items-center w-40 h-40 justify-center shadow-lg hover:bg-[#ffc55a] transition-all hover:-translate-y-1">
              <ConciergeBell className="w-14 h-14 mb-3" />
              <span className="font-extrabold text-lg text-center leading-tight">Incoming<br/>Order</span>
            </button>
            <button onClick={() => setView('inventory')} className="bg-white text-[#00215e] p-6 rounded-xl flex flex-col items-center w-40 h-40 justify-center shadow-lg hover:bg-[#ffc55a] transition-all hover:-translate-y-1">
              <Package className="w-14 h-14 mb-3" />
              <span className="font-extrabold text-lg">Inventory</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // 2. main chef interface (orders & inventory)
  // ---------------------------------------------------------
  return (
    <div className="w-screen h-screen flex bg-[#00215e] font-sans overflow-hidden">
      {renderModal()}

      {/* sidebar matching cashier */}
      <div className="w-[280px] bg-[#00215e] flex flex-col items-center py-10 shrink-0 border-r border-[#2c4e80]">
        <Image src="/logo_emas.png" alt="Logo" width={100} height={100} />
        <h2 className="text-white font-extrabold text-4xl mt-6 mb-3 tracking-wider">Kitchen</h2>

        {/* chef profile badge in sidebar */}
        <div className="mb-8 flex items-center bg-[#2c4e80]/60 border border-[#ffc55a]/20 px-3 py-1.5 rounded-lg text-xs text-white">
          <User className="w-3.5 h-3.5 text-[#ffc55a] mr-1.5 shrink-0" />
          <span className="font-semibold truncate">{chefName}</span>
        </div>

        <button
          onClick={() => setView('orders')}
          className={`w-3/4 py-4 rounded-xl font-extrabold text-lg mb-6 shadow-lg transition-colors flex flex-col items-center justify-center leading-tight ${view === 'orders' ? 'bg-[#ffc55a] text-[#00215e]' : 'bg-[#2c4e80] text-white hover:bg-[#ffc55a] hover:text-[#00215e]'}`}
        >
          <span>Incoming</span><span>Order</span>
        </button>
        <button
          onClick={() => setView('inventory')}
          className={`w-3/4 py-4 rounded-xl font-extrabold text-lg mb-6 shadow-lg transition-colors ${view === 'inventory' ? 'bg-[#ffc55a] text-[#00215e]' : 'bg-[#2c4e80] text-white hover:bg-[#ffc55a] hover:text-[#00215e]'}`}
        >
          Inventory
        </button>

        <div className="mt-auto w-full flex flex-col items-center">
           <button onClick={() => setView('welcome')} className="text-white font-bold text-xl flex items-center hover:text-[#ffc55a] transition-colors">
             <Home className="w-6 h-6 mr-3" /> Home
           </button>
        </div>
      </div>

      <div className="flex-1 bg-[#2c4e80] p-10 rounded-tl-[40px] shadow-[inset_10px_10px_20px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden">

         {view === 'orders' && (
           <div className="flex-1 flex flex-col overflow-hidden">
              <h3 className="text-white text-3xl font-extrabold tracking-wide mb-8 shrink-0">Kitchen Ticket View</h3>

              <div className="flex space-x-4 mb-4 pr-2">
                 <div className="bg-[#00215e] w-36 flex flex-col items-center justify-center rounded-xl text-white font-extrabold text-lg py-4 shadow-md shrink-0 uppercase tracking-wide leading-tight">
                    <span>Table</span><span>Number</span>
                 </div>
                 <div className="flex-1 bg-[#00215e] rounded-xl text-white font-extrabold text-lg flex items-center text-left pl-6 py-4 shadow-md uppercase tracking-wide">
                    Incoming Order Details
                 </div>
                 <div className="bg-[#00215e] w-64 rounded-xl text-white font-extrabold text-lg flex items-center justify-center shadow-md shrink-0 uppercase tracking-wide">
                    Actions
                 </div>
              </div>

              <div className="space-y-6 overflow-y-auto pr-2 pb-4 [scrollbar-width:thin]">
                {loading ? (
                   <p className="text-center text-white font-bold mt-10 text-xl">Loading kitchen tickets...</p>
                ) : listPesanan.length === 0 ? (
                   <p className="text-center text-white/70 font-bold mt-10 text-xl italic">No incoming orders in queue.</p>
                ) : (
                  listPesanan.map(pesanan => {
                    const isReady = isOrderFullyReady(pesanan);
                    const hasMissingIngredient = checkOrderAvailability(pesanan);

                    return (
                      <div key={pesanan.noNota} className="flex space-x-4">
                         <div className="bg-[#00215e] w-36 flex flex-col items-center justify-center rounded-xl text-[#ffc55a] shrink-0 shadow-md">
                            <span className="font-extrabold text-5xl">{pesanan.noMeja}</span>
                            {hasMissingIngredient && (
                              <span className="mt-2 text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full uppercase tracking-widest font-bold">Needs Cancel</span>
                            )}
                         </div>

                         <div className="flex-1 flex flex-col space-y-3">
                            {pesanan.detailPesanan.map(item => {
                              const isItemReady = itemReadyState[item.idDetail];
                              return (
                                <div key={item.idDetail} className="flex space-x-3">
                                   <div className="bg-white flex-1 p-5 rounded-xl text-[#00215e] font-extrabold text-xl shadow-sm flex items-center justify-between">
                                      <span>{item.menu.namaMenu}</span>
                                      <span className="text-[#fc4100] text-lg bg-gray-100 px-4 py-1 rounded-lg">x{item.jumlahPesanan}</span>
                                   </div>
                                   <button
                                      onClick={() => toggleItemReady(item.idDetail)}
                                      className={`p-5 rounded-xl w-24 flex items-center justify-center font-extrabold transition-colors shadow-sm shrink-0 ${isItemReady ? 'bg-[#ffc55a] text-[#00215e]' : 'bg-[#fc4100] text-white hover:opacity-90'}`}
                                   >
                                      {isItemReady ? <Check className="w-10 h-10" /> : <X className="w-10 h-10" />}
                                   </button>
                                </div>
                              );
                            })}
                         </div>

                         <div className="w-64 flex flex-col space-y-3 shrink-0">
                           <button
                              onClick={() => { if(isReady) handleMarkOrderReady(pesanan.noNota) }}
                              disabled={!isReady || hasMissingIngredient}
                              className={`flex-1 rounded-xl font-extrabold text-3xl flex items-center justify-center shadow-md transition-all uppercase tracking-widest ${isReady && !hasMissingIngredient ? 'bg-[#588157] text-white hover:opacity-90 cursor-pointer shadow-[0_0_15px_rgba(88,129,87,0.6)]' : 'bg-gray-400 text-gray-200 opacity-90 cursor-not-allowed'}`}
                           >
                              Ready
                           </button>
                           <button
                              onClick={() => handleRejectOrder(pesanan.noNota)}
                              className={`py-3 rounded-xl font-bold text-sm flex items-center justify-center shadow-md transition-all uppercase tracking-widest ${hasMissingIngredient ? 'bg-red-600 text-white hover:bg-red-700 animate-pulse' : 'bg-red-800 text-red-200 hover:bg-red-700'}`}
                           >
                              Reject (Out of Stock)
                           </button>
                         </div>
                      </div>
                    );
                  })
                )}
              </div>
           </div>
         )}

         {view === 'inventory' && (
           <div className="flex-1 flex flex-col overflow-hidden">
              <h3 className="text-white text-3xl font-extrabold tracking-wide mb-8 shrink-0">Raw Material Status</h3>

              <div className="space-y-4 overflow-y-auto pr-2 pb-4 [scrollbar-width:thin]">
                {loading ? (
                   <p className="text-center text-white font-bold mt-10 text-xl">Loading inventory data...</p>
                ) : (
                  listBahan.map(bahan => {
                    const isReady = bahan.statusBahan === 'TERSEDIA';
                    return (
                      <div key={bahan.id} className="flex space-x-4 items-center">
                         <div className="bg-white flex-1 p-6 rounded-xl text-[#00215e] font-extrabold text-2xl shadow-sm flex items-center border-l-8 border-[#00215e]">
                            {bahan.namaBahan}
                         </div>
                         <button
                            onClick={() => handleToggleBahanStatus(bahan.id, bahan.statusBahan)}
                            className={`w-72 p-6 rounded-xl font-extrabold text-3xl text-center shadow-md transition-colors shrink-0 uppercase tracking-widest ${isReady ? 'bg-[#588157] text-white hover:opacity-90' : 'bg-[#fc4100] text-white hover:opacity-90'}`}
                         >
                            {isReady ? 'Ready' : 'Empty'}
                         </button>
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
