// unified owner management dashboard module
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, LogOut, Home, ShieldCheck, DollarSign, Users, ClipboardList, CheckCircle2, AlertCircle, Tv, Search, ChefHat, GlassWater, ReceiptText } from 'lucide-react';

interface DetailPesanan {
  idDetail: string;
  jumlahPesanan: number;
  subtotal: number;
  menu: { namaMenu: string };
}

interface Transaksi {
  noNota: string;
  tglPesanan: string;
  jumlahOrang: number;
  statusPesanan: string;
  statusTagihan: string;
  noMeja: number;
  pelanggan: { namaPelanggan: string };
  pegawai?: { namaPegawai: string };
  detailPesanan: DetailPesanan[];
}

interface Staff {
  id: string;
  namaPegawai: string;
  jabatan: string;
}

interface Meja {
  noMeja: number;
  status: string;
}

interface BahanBaku {
  id: string;
  namaBahan: string;
  statusBahan: string;
}

// custom modal interface matching other employee modules
interface ModalState {
  isOpen: boolean;
  type: 'alert' | 'success';
  message: string;
}

export default function OwnerPage() {
  const router = useRouter();
  const [view, setView] = useState<'welcome' | 'dashboard'>('welcome');
  const [activeTab, setActiveTab] = useState<'transactions' | 'staff' | 'monitor'>('transactions');
  const [monitorSubTab, setMonitorSubTab] = useState<'kasir' | 'pelayan' | 'koki'>('kasir');
  const [selectedMonitorTable, setSelectedMonitorTable] = useState<number | null>(null);

  const [listTransaksi, setListTransaksi] = useState<Transaksi[]>([]);
  const [listStaff, setListStaff] = useState<Staff[]>([]);
  const [listMeja, setListMeja] = useState<Meja[]>([]);
  const [listBahan, setListBahan] = useState<BahanBaku[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // staff directory filter states
  const [searchTermStaff, setSearchTermStaff] = useState('');
  const [roleFilterStaff, setRoleFilterStaff] = useState<string>('ALL');

  // owner profile state
  const [ownerId, setOwnerId] = useState<string>('');
  const [ownerName, setOwnerName] = useState<string>('');

  // custom modal state
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    type: 'alert',
    message: ''
  });

  // custom scrollbar class for elegant UI
  const customScrollbar = "[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#ffc55a]/50 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#ffc55a]";

  useEffect(() => {
    // enforce strict role security check for owner dashboard
    if (typeof window !== 'undefined') {
      const storedRole = localStorage.getItem('employeeRole') || localStorage.getItem('pegawai_role') || '';

      if (storedRole !== 'PEMILIK') {
        router.push('/employee/login');
        return;
      }

      const storedId = localStorage.getItem('pegawai_id') || localStorage.getItem('idPegawai') || localStorage.getItem('employeeId') || '';
      const storedName = localStorage.getItem('pegawai_nama') || localStorage.getItem('namaPegawai') || localStorage.getItem('employeeName') || 'Restaurant Owner';

      setOwnerId(storedId);
      setOwnerName(storedName);
    }
  }, [router]);

  useEffect(() => {
    if (view === 'dashboard') {
      fetchOwnerData();
    }
  }, [view]);

  async function fetchOwnerData() {
    setLoading(true);
    try {
      // fetch transaction history, staff, table, and raw material data concurrently for 100% real db monitoring
      const [resPesanan, resStaff, resMeja, resBahan] = await Promise.all([
        fetch('/api/pesanan'),
        fetch('/api/pegawai'),
        fetch('/api/meja'),
        fetch('/api/bahan-baku')
      ]);

      const dataPesanan = await resPesanan.json();
      const dataStaff = await resStaff.json();
      const dataMeja = await resMeja.json();
      const dataBahan = await resBahan.json();

      if (dataPesanan.sukses || dataPesanan.data || Array.isArray(dataPesanan)) {
        setListTransaksi(dataPesanan.data || (Array.isArray(dataPesanan) ? dataPesanan : []));
      }

      if (dataStaff.sukses || dataStaff.data || Array.isArray(dataStaff)) {
        setListStaff(dataStaff.data || (Array.isArray(dataStaff) ? dataStaff : []));
      }

      if (dataMeja.sukses || dataMeja.data || Array.isArray(dataMeja)) {
        setListMeja(dataMeja.data || (Array.isArray(dataMeja) ? dataMeja : []));
      }

      if (dataBahan.sukses || dataBahan.data || Array.isArray(dataBahan)) {
        setListBahan(dataBahan.data || (Array.isArray(dataBahan) ? dataBahan : []));
      }
    } catch (err) {
      console.error('failed to fetch owner monitoring data:', err);
      showModal('alert', 'Failed to load monitoring data from the server.');
    } finally {
      setLoading(false);
    }
  }

  // helper to show custom modal
  const showModal = (type: ModalState['type'], message: string) => {
    setModal({ isOpen: true, type, message });
  };

  const closeModal = () => setModal(prev => ({ ...prev, isOpen: false }));

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

  // compute total revenue from paid or completed orders
  const totalRevenue = listTransaksi
    .filter(t => t.statusTagihan === 'PAID' || t.statusPesanan === 'SELESAI')
    .reduce((sum, t) => {
      const sub = t.detailPesanan.reduce((acc, item) => acc + item.subtotal, 0);
      return sum + sub + (sub * 0.1);
    }, 0);

  // filtering logic for staff directory tab
  const filteredStaffList = listStaff.filter(staff => {
    const nameMatch = staff.namaPegawai.toLowerCase().includes(searchTermStaff.toLowerCase());
    const roleMatch = roleFilterStaff === 'ALL' || staff.jabatan === roleFilterStaff;
    return nameMatch && roleMatch;
  });

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

            <h3 className="text-white text-xl font-bold mb-2">
              {modal.type === 'success' ? 'Success' : 'Attention'}
            </h3>
            <p className="text-gray-200 mb-8">{modal.message}</p>

            <button onClick={closeModal} className="w-full py-3 rounded-xl font-bold text-[#00215e] bg-[#ffc55a] hover:bg-yellow-400 transition-colors">
              Close
            </button>
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
              Owner Management Portal
            </div>

            {/* active owner profile display */}
            <div className="mt-4 flex items-center bg-[#00215e]/80 border border-[#ffc55a]/30 px-4 py-2 rounded-xl text-white text-sm shadow-inner">
              <ShieldCheck className="w-4 h-4 text-[#ffc55a] mr-2" />
              <span className="text-gray-300 mr-1">Owner:</span>
              <span className="font-extrabold text-[#ffc55a]">{ownerName}</span>
              <span className="text-xs text-gray-400 ml-1.5">({ownerId || 'No ID'})</span>
            </div>
          </div>

          <div className="bg-[#2c4e80] w-full p-8 rounded-2xl shadow-2xl flex justify-center space-x-6 border border-[#ffc55a]/10">
            <button onClick={() => { setView('dashboard'); setActiveTab('transactions'); }} className="bg-white text-[#00215e] p-6 rounded-xl flex flex-col items-center w-40 h-40 justify-center shadow-lg hover:bg-[#ffc55a] transition-all hover:-translate-y-1">
              <ClipboardList className="w-12 h-12 mb-3" />
              <span className="font-extrabold text-base text-center leading-tight">Transaction<br/>History</span>
            </button>
            <button onClick={() => { setView('dashboard'); setActiveTab('staff'); }} className="bg-white text-[#00215e] p-6 rounded-xl flex flex-col items-center w-40 h-40 justify-center shadow-lg hover:bg-[#ffc55a] transition-all hover:-translate-y-1">
              <Users className="w-12 h-12 mb-3" />
              <span className="font-extrabold text-base text-center leading-tight">Staff<br/>Directory</span>
            </button>
            <button onClick={() => { setView('dashboard'); setActiveTab('monitor'); }} className="bg-white text-[#00215e] p-6 rounded-xl flex flex-col items-center w-40 h-40 justify-center shadow-lg hover:bg-[#ffc55a] transition-all hover:-translate-y-1">
              <Tv className="w-12 h-12 mb-3" />
              <span className="font-extrabold text-base text-center leading-tight">Monitor<br/>Staff</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // 2. main owner monitoring dashboard view
  // ---------------------------------------------------------
  return (
    <div className="w-screen h-screen flex bg-[#00215e] font-sans overflow-hidden">
      {renderModal()}

      {/* sidebar matching other employee portals aesthetic */}
      <div className="w-[280px] bg-[#00215e] flex flex-col items-center py-10 shrink-0 border-r border-[#2c4e80] z-30 shadow-[10px_0_20px_rgba(0,0,0,0.5)]">
        <Image src="/logo_emas.png" alt="Logo" width={100} height={100} />
        <h2 className="text-white font-extrabold text-4xl mt-6 mb-3 tracking-wider">Owner</h2>

        {/* owner profile badge in sidebar */}
        <div className="mb-8 flex items-center bg-[#2c4e80]/60 border border-[#ffc55a]/20 px-3 py-1.5 rounded-lg text-xs text-white">
          <ShieldCheck className="w-3.5 h-3.5 text-[#ffc55a] mr-1.5 shrink-0" />
          <span className="font-semibold truncate">{ownerName}</span>
        </div>

        <button
          onClick={() => setActiveTab('transactions')}
          className={`w-3/4 py-4 rounded-xl font-extrabold text-lg mb-4 shadow-lg transition-colors flex items-center justify-center ${activeTab === 'transactions' ? 'bg-[#ffc55a] text-[#00215e]' : 'bg-[#2c4e80] text-white hover:bg-[#ffc55a] hover:text-[#00215e]'}`}
        >
          <ClipboardList className="w-5 h-5 mr-2" /> Transactions
        </button>
        <button
          onClick={() => setActiveTab('staff')}
          className={`w-3/4 py-4 rounded-xl font-extrabold text-lg mb-4 shadow-lg transition-colors flex items-center justify-center ${activeTab === 'staff' ? 'bg-[#ffc55a] text-[#00215e]' : 'bg-[#2c4e80] text-white hover:bg-[#ffc55a] hover:text-[#00215e]'}`}
        >
          <Users className="w-5 h-5 mr-2" /> Staff Data
        </button>
        <button
          onClick={() => setActiveTab('monitor')}
          className={`w-3/4 py-4 rounded-xl font-extrabold text-lg mb-6 shadow-lg transition-colors flex items-center justify-center ${activeTab === 'monitor' ? 'bg-[#ffc55a] text-[#00215e]' : 'bg-[#2c4e80] text-white hover:bg-[#ffc55a] hover:text-[#00215e]'}`}
        >
          <Tv className="w-5 h-5 mr-2" /> Monitor Staff
        </button>

        <div className="mt-auto w-full flex flex-col items-center space-y-4">
           <button onClick={() => setView('welcome')} className="text-white font-bold text-xl flex items-center hover:text-[#ffc55a] transition-colors">
             <Home className="w-6 h-6 mr-3" /> Home
           </button>
        </div>
      </div>

      <div className="flex-1 bg-[#2c4e80] p-10 rounded-tl-[40px] shadow-[inset_10px_10px_20px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden relative">

         {/* top summary statistics bar */}
         <div className="grid grid-cols-2 gap-6 mb-8 shrink-0">
           <div className="bg-[#00215e] p-6 rounded-2xl shadow-md border border-[#ffc55a]/20 flex items-center justify-between">
             <div>
               <p className="text-gray-300 text-xs font-bold uppercase tracking-widest mb-1">Total Revenue Monitor</p>
               <h3 className="text-3xl font-black text-[#ffc55a]">Rp. {totalRevenue.toLocaleString('id-ID')}</h3>
             </div>
             <div className="w-12 h-12 bg-[#ffc55a]/20 rounded-xl flex items-center justify-center">
               <DollarSign className="w-7 h-7 text-[#ffc55a]" />
             </div>
           </div>

           <div className="bg-[#00215e] p-6 rounded-2xl shadow-md border border-[#ffc55a]/20 flex items-center justify-between">
             <div>
               <p className="text-gray-300 text-xs font-bold uppercase tracking-widest mb-1">Total Registered Staff</p>
               <h3 className="text-3xl font-black text-white">{listStaff.length} Members</h3>
             </div>
             <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
               <Users className="w-7 h-7 text-white" />
             </div>
           </div>
         </div>

         {/* main data viewing area */}
         <div className="flex-1 flex flex-col overflow-hidden bg-[#00215e]/40 p-6 rounded-2xl border border-white/10 backdrop-blur-sm relative z-10">
           <div className="flex justify-between items-center mb-6 shrink-0">
             <h3 className="text-white text-2xl font-extrabold tracking-wide uppercase">
               {activeTab === 'transactions' ? 'Transaction History Record' : activeTab === 'staff' ? 'Staff Directory Record' : 'Staff Screen Monitor'}
             </h3>
             <span className="text-xs text-gray-300 font-bold tracking-wider bg-white/10 px-3 py-1 rounded-lg uppercase">
               Read-Only Access
             </span>
           </div>

           {/* loading state */}
           {loading ? (
             <div className="flex-1 flex items-center justify-center">
               <p className="text-center text-white font-bold text-xl animate-pulse">Loading secure records...</p>
             </div>
           ) : (
             <div className="flex-1 flex flex-col overflow-hidden">

               {/* tab 1: transactions history list */}
               {activeTab === 'transactions' && (
                 <div className={`space-y-4 overflow-y-auto pr-2 ${customScrollbar}`}>
                   {listTransaksi.length === 0 ? (
                     <p className="text-center text-white/70 font-bold mt-10 italic">No transaction records found.</p>
                   ) : (
                     listTransaksi.map((trx) => {
                       const subtotal = trx.detailPesanan.reduce((acc, item) => acc + item.subtotal, 0);
                       const total = subtotal + (subtotal * 0.1);
                       const trxDate = new Date(trx.tglPesanan).toLocaleString('en-GB', {
                         day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                       });

                       return (
                         <div key={trx.noNota} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
                           <div className="space-y-1">
                             <div className="flex items-center space-x-3">
                               <span className="bg-[#00215e] text-[#ffc55a] px-3 py-1 rounded-lg text-xs font-black tracking-wider uppercase">Table #{trx.noMeja}</span>
                               <span className="font-extrabold text-[#00215e] text-lg">{trx.pelanggan?.namaPelanggan || 'Guest'}</span>
                             </div>
                             <p className="text-xs text-gray-500 font-bold">Nota ID: {trx.noNota} • {trxDate}</p>
                             <div className="flex flex-wrap gap-2 pt-2">
                               {trx.detailPesanan.map((item, idx) => (
                                 <span key={idx} className="bg-gray-100 text-[#00215e] px-2 py-0.5 rounded text-xs font-bold">
                                   {item.jumlahPesanan}x {item.menu.namaMenu}
                                 </span>
                               ))}
                             </div>
                           </div>
                           <div className="text-right shrink-0">
                             <p className="text-xl font-black text-[#00215e]">Rp. {total.toLocaleString('id-ID')}</p>
                             <span className={`inline-block mt-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                               trx.statusTagihan === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                             }`}>
                               {trx.statusTagihan}
                             </span>
                           </div>
                         </div>
                       );
                     })
                   )}
                 </div>
               )}

               {/* tab 2: staff data directory */}
               {activeTab === 'staff' && (
                 <div className="flex flex-col h-full overflow-hidden">
                   {/* staff directory filter bar */}
                   <div className="bg-[#00215e] p-4 rounded-xl mb-6 border border-[#ffc55a]/20 grid grid-cols-[1fr,auto] gap-4 shrink-0">
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search staff by name..."
                          value={searchTermStaff}
                          onChange={(e) => setSearchTermStaff(e.target.value)}
                          className="w-full bg-[#2c4e80] border border-white/10 rounded-lg py-3 pl-12 pr-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#ffc55a]"
                        />
                      </div>
                      <select value={roleFilterStaff} onChange={(e) => setRoleFilterStaff(e.target.value)} className="bg-[#2c4e80] border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#ffc55a]">
                         <option value="ALL">All Roles</option>
                         <option value="KASIR">Kasir</option>
                         <option value="PELAYAN">Pelayan</option>
                         <option value="KOKI">Koki</option>
                         <option value="PEMILIK">Pemilik</option>
                      </select>
                   </div>

                   <div className={`grid grid-cols-2 gap-4 overflow-y-auto pr-2 ${customScrollbar}`}>
                     {filteredStaffList.length === 0 ? (
                       <p className="col-span-2 text-center text-white/70 font-bold mt-10 italic">No staff records found.</p>
                     ) : (
                       filteredStaffList.map((staff) => (
                         <div key={staff.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
                           <div className="flex items-center space-x-4">
                             <div className="w-12 h-12 bg-[#00215e] text-[#ffc55a] rounded-xl flex items-center justify-center font-black text-lg shrink-0">
                               {staff.namaPegawai.charAt(0)}
                             </div>
                             <div>
                               <h4 className="font-extrabold text-[#00215e] text-base">{staff.namaPegawai}</h4>
                               <p className="text-xs text-gray-500 font-bold">ID: {staff.id}</p>
                             </div>
                           </div>
                           <span className="bg-[#ffc55a]/20 text-[#00215e] px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider shrink-0">
                             {staff.jabatan}
                           </span>
                         </div>
                       ))
                     )}
                   </div>
                 </div>
               )}

               {/* tab 3: monitor staff screens (read-only views copied directly from kasir, pelayan, and koki) */}
               {activeTab === 'monitor' && (
                 <div className="flex flex-col h-full overflow-hidden">
                   {/* monitor role selector bar */}
                   <div className="flex space-x-3 mb-6 shrink-0 bg-[#00215e] p-2 rounded-xl border border-[#ffc55a]/20">
                     <button
                       onClick={() => setMonitorSubTab('kasir')}
                       className={`flex-1 py-3 px-4 rounded-lg font-extrabold text-sm uppercase tracking-wider flex items-center justify-center transition-all ${
                         monitorSubTab === 'kasir' ? 'bg-[#ffc55a] text-[#00215e] shadow-md' : 'text-gray-300 hover:bg-white/10'
                       }`}
                     >
                       <ReceiptText className="w-4 h-4 mr-2" /> Kasir Monitor
                     </button>
                     <button
                       onClick={() => setMonitorSubTab('pelayan')}
                       className={`flex-1 py-3 px-4 rounded-lg font-extrabold text-sm uppercase tracking-wider flex items-center justify-center transition-all ${
                         monitorSubTab === 'pelayan' ? 'bg-[#ffc55a] text-[#00215e] shadow-md' : 'text-gray-300 hover:bg-white/10'
                       }`}
                     >
                       <GlassWater className="w-4 h-4 mr-2" /> Pelayan Monitor
                     </button>
                     <button
                       onClick={() => setMonitorSubTab('koki')}
                       className={`flex-1 py-3 px-4 rounded-lg font-extrabold text-sm uppercase tracking-wider flex items-center justify-center transition-all ${
                         monitorSubTab === 'koki' ? 'bg-[#ffc55a] text-[#00215e] shadow-md' : 'text-gray-300 hover:bg-white/10'
                       }`}
                     >
                       <ChefHat className="w-4 h-4 mr-2" /> Koki Monitor
                     </button>
                   </div>

                   {/* sub-view 1: kasir screen monitor */}
                   {monitorSubTab === 'kasir' && (
                     <div className="flex-1 flex flex-col overflow-hidden">
                       <div className="flex justify-between items-center mb-4 shrink-0">
                         <h4 className="text-white text-xl font-extrabold tracking-wide uppercase flex items-center">
                           <ReceiptText className="w-5 h-5 mr-2 text-[#ffc55a]" /> Active Cashier Orders (Read-Only)
                         </h4>
                         <span className="text-xs bg-red-500/20 text-red-200 border border-red-500/50 px-3 py-1 rounded-lg font-bold">
                           Read-Only Monitor Mode
                         </span>
                       </div>

                       <div className="flex space-x-4 mb-3 pr-2">
                         <div className="bg-[#00215e] w-28 text-white font-extrabold text-sm text-center py-3 rounded-xl shadow-md shrink-0 uppercase tracking-wide">
                           Table
                         </div>
                         <div className="bg-[#00215e] w-56 text-white font-extrabold text-sm text-left pl-4 py-3 rounded-xl shadow-md shrink-0 uppercase tracking-wide">
                           Customer
                         </div>
                         <div className="flex-1 bg-[#00215e] text-white font-extrabold text-sm text-left pl-4 py-3 rounded-xl shadow-md uppercase tracking-wide">
                           Total Bill Amount
                         </div>
                         <div className="bg-[#00215e] w-40 text-white font-extrabold text-sm text-center py-3 rounded-xl shadow-md shrink-0 uppercase tracking-wide">
                           Status
                         </div>
                       </div>

                       <div className={`space-y-3 overflow-y-auto pr-2 pb-4 ${customScrollbar}`}>
                         {listTransaksi.filter(t => t.statusTagihan !== 'DONE').length === 0 ? (
                           <p className="text-center text-white/70 font-bold mt-10 italic">No active cashier transactions.</p>
                         ) : (
                           listTransaksi.filter(t => t.statusTagihan !== 'DONE').map((trx) => {
                             const isPaid = trx.statusTagihan === 'PAID';
                             const subtotal = trx.detailPesanan.reduce((acc, item) => acc + item.subtotal, 0);
                             const total = subtotal + (subtotal * 0.1);

                             return (
                               <div
                                 key={trx.noNota}
                                 className="flex space-x-4 items-stretch bg-white/5 border border-white/10 rounded-xl p-2"
                               >
                                 <div className="bg-[#00215e] w-28 text-[#ffc55a] font-extrabold text-2xl flex items-center justify-center py-3 rounded-xl shadow-md shrink-0">
                                   {trx.noMeja}
                                 </div>
                                 <div className="bg-white w-56 text-[#00215e] font-extrabold text-base flex items-center text-left pl-4 py-3 rounded-xl shadow-md shrink-0 truncate">
                                   {trx.pelanggan?.namaPelanggan || 'Guest'}
                                 </div>
                                 <div className="flex-1 bg-white text-[#00215e] font-extrabold text-xl flex items-center justify-between px-4 py-3 rounded-xl shadow-md">
                                   <span>Rp. {total.toLocaleString('id-ID')}</span>
                                   <span className="text-xs text-gray-500 font-bold">Nota: {trx.noNota}</span>
                                 </div>
                                 <div className={`w-40 font-extrabold text-base flex items-center justify-center py-3 rounded-xl shadow-md uppercase tracking-widest shrink-0 ${
                                   isPaid ? 'bg-[#588157] text-white' : 'bg-[#fc4100] text-white'
                                 }`}>
                                   {isPaid ? 'Paid' : 'Unpaid'}
                                 </div>
                               </div>
                             );
                           })
                         )}
                       </div>
                     </div>
                   )}

                   {/* sub-view 2: pelayan screen monitor */}
                   {monitorSubTab === 'pelayan' && (
                     <div className="flex-1 flex overflow-hidden space-x-6 relative">
                       {/* left map area */}
                       <div className="flex-1 flex flex-col overflow-hidden">
                         <div className="flex justify-between items-center mb-4 shrink-0">
                           <h4 className="text-white text-xl font-extrabold tracking-wide uppercase flex items-center">
                             <GlassWater className="w-5 h-5 mr-2 text-[#ffc55a]" /> Waiter Floor Map Monitor (Read-Only)
                           </h4>
                           <div className="flex items-center text-[10px] uppercase font-bold tracking-widest text-white">
                             <span className="w-3 h-3 rounded bg-[#2c4e80] border border-white mr-1.5"></span> Free
                             <span className="w-3 h-3 rounded bg-red-500/20 border border-red-500 ml-3 mr-1.5"></span> Occupied
                             <span className="w-3 h-3 rounded bg-green-500/20 border border-green-500 ml-3 mr-1.5"></span> Ready
                           </div>
                         </div>

                         <div className={`flex-1 overflow-y-auto ${customScrollbar} bg-[#00215e]/30 rounded-2xl border border-white/10 p-6`}>
                           {listMeja.length === 0 ? (
                             <p className="text-center text-white font-bold text-xl animate-pulse">Loading Floor Plan...</p>
                           ) : (
                             <div className="grid grid-cols-4 gap-4">
                               {listMeja.map((meja) => {
                                 const order = listTransaksi.find(t => t.noMeja === meja.noMeja && t.statusPesanan !== 'SELESAI' && t.statusPesanan !== 'DIBATALKAN');
                                 const isAvailable = !order;

                                 let bgClass = isAvailable ? 'bg-[#2c4e80]/80 border-white/20' : 'bg-red-500/10 border-red-500/50';
                                 let textClass = isAvailable ? 'text-white' : 'text-red-400';
                                 let badge = null;

                                 if (order) {
                                   if (order.statusPesanan === 'SELESAI') {
                                     bgClass = 'bg-green-500/20 border-green-500';
                                     textClass = 'text-green-400';
                                     badge = <span className="absolute -top-2 -right-2 bg-green-500 text-[#00215e] text-[9px] font-black px-2 py-0.5 rounded shadow">SERVE</span>;
                                   } else if (order.statusPesanan === 'DIPROSES') {
                                     bgClass = 'bg-[#ffc55a]/10 border-[#ffc55a]/50';
                                     textClass = 'text-[#ffc55a]';
                                     badge = <span className="absolute -top-2 -right-2 bg-[#ffc55a] text-[#00215e] text-[8px] font-black px-1.5 py-0.5 rounded">COOKING</span>;
                                   }
                                 }

                                 const isSelected = selectedMonitorTable === meja.noMeja;

                                 return (
                                   <div
                                     key={meja.noMeja}
                                     onClick={() => setSelectedMonitorTable(meja.noMeja)}
                                     className={`relative aspect-square border-2 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 backdrop-blur-md ${bgClass} ${isSelected ? 'ring-4 ring-white/50 scale-105 z-20' : 'z-10'}`}
                                   >
                                     {badge}
                                     <span className={`text-3xl font-black mb-1 ${textClass}`}>{meja.noMeja}</span>
                                     <span className={`text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded opacity-80 ${isAvailable ? 'bg-white/10' : 'bg-red-500/20'}`}>
                                       {order ? 'Occupied' : 'Free'}
                                     </span>
                                   </div>
                                 );
                               })}
                             </div>
                           )}
                         </div>
                       </div>

                       {/* right detail panel */}
                       <div className="w-[320px] bg-[#00215e]/90 backdrop-blur-xl border border-[#ffc55a]/20 rounded-2xl flex flex-col shrink-0 overflow-hidden">
                         {!selectedMonitorTable ? (
                           <div className="flex-1 flex flex-col items-center justify-center p-6 text-center opacity-40">
                             <p className="text-sm text-white font-extrabold uppercase tracking-widest">Select a table on map to view order details</p>
                           </div>
                         ) : (
                           <div className="flex flex-col h-full">
                             <div className="p-5 border-b border-[#ffc55a]/20 bg-black/20">
                               <div className="flex justify-between items-center mb-1">
                                 <h5 className="text-3xl text-white font-black">T-{selectedMonitorTable}</h5>
                                 {(() => {
                                   const order = listTransaksi.find(t => t.noMeja === selectedMonitorTable && t.statusPesanan !== 'SELESAI' && t.statusPesanan !== 'DIBATALKAN');
                                   return order ? (
                                     <span className="px-2.5 py-1 rounded text-[10px] font-black uppercase bg-[#ffc55a] text-[#00215e]">
                                       {order.statusPesanan}
                                     </span>
                                   ) : null;
                                 })()}
                               </div>
                               <p className="text-xs text-gray-300 font-bold">
                                 {(() => {
                                   const order = listTransaksi.find(t => t.noMeja === selectedMonitorTable && t.statusPesanan !== 'SELESAI' && t.statusPesanan !== 'DIBATALKAN');
                                   return order ? `Guest: ${order.pelanggan?.namaPelanggan || 'Guest'}` : 'No Active Order';
                                 })()}
                               </p>
                             </div>

                             <div className={`flex-1 p-5 overflow-y-auto ${customScrollbar}`}>
                               {(() => {
                                 const order = listTransaksi.find(t => t.noMeja === selectedMonitorTable && t.statusPesanan !== 'SELESAI' && t.statusPesanan !== 'DIBATALKAN');
                                 if (!order) return <p className="text-xs text-gray-400 font-bold italic text-center mt-10">Table is empty.</p>;

                                 return (
                                   <div className="space-y-3">
                                     <p className="text-[10px] text-gray-300 font-bold uppercase tracking-wider">Ordered Items</p>
                                     {order.detailPesanan.map((item, idx) => (
                                       <div key={idx} className="bg-white/10 p-3 rounded-xl text-white flex justify-between items-start text-xs">
                                         <div>
                                           <p className="font-extrabold">{item.menu.namaMenu}</p>
                                         </div>
                                         <span className="bg-[#ffc55a] text-[#00215e] font-black px-2 py-0.5 rounded text-[10px]">x{item.jumlahPesanan}</span>
                                       </div>
                                     ))}
                                   </div>
                                 );
                               })()}
                             </div>

                             <div className="p-4 border-t border-white/10 bg-black/20 text-center">
                               <span className="text-[10px] text-red-300 font-bold uppercase tracking-wider">
                                 Read-Only Waiter View
                               </span>
                             </div>
                           </div>
                         )}
                       </div>
                     </div>
                   )}

                   {/* sub-view 3: koki screen monitor */}
                   {monitorSubTab === 'koki' && (
                     <div className="flex-1 flex space-x-6 overflow-hidden">
                       {/* left: kitchen ticket view */}
                       <div className="flex-1 flex flex-col overflow-hidden">
                         <div className="flex justify-between items-center mb-4 shrink-0">
                           <h4 className="text-white text-xl font-extrabold tracking-wide uppercase flex items-center">
                             <ChefHat className="w-5 h-5 mr-2 text-[#ffc55a]" /> Kitchen Tickets (Read-Only)
                           </h4>
                         </div>

                         <div className={`space-y-4 overflow-y-auto pr-2 pb-4 ${customScrollbar}`}>
                           {listTransaksi.filter(t => t.statusPesanan !== 'SELESAI' && t.statusPesanan !== 'SIAP' && t.statusPesanan !== 'DIBATALKAN').length === 0 ? (
                             <p className="text-center text-white/70 font-bold mt-10 italic">No incoming kitchen orders in queue.</p>
                           ) : (
                             listTransaksi.filter(t => t.statusPesanan !== 'SELESAI' && t.statusPesanan !== 'SIAP' && t.statusPesanan !== 'DIBATALKAN').map(pesanan => (
                               <div key={pesanan.noNota} className="flex space-x-3 bg-white/5 border border-white/10 p-3 rounded-xl">
                                 <div className="bg-[#00215e] w-28 flex flex-col items-center justify-center rounded-xl text-[#ffc55a] shrink-0 shadow-md p-3">
                                   <span className="text-[10px] text-gray-300 uppercase font-bold">Table</span>
                                   <span className="font-extrabold text-3xl">{pesanan.noMeja}</span>
                                 </div>

                                 <div className="flex-1 space-y-2">
                                   {pesanan.detailPesanan.map(item => (
                                     <div key={item.idDetail} className="bg-white p-3 rounded-lg text-[#00215e] font-extrabold text-sm flex items-center justify-between shadow-sm">
                                       <span>{item.menu.namaMenu}</span>
                                       <span className="text-[#fc4100] text-xs bg-gray-100 px-3 py-1 rounded-md">x{item.jumlahPesanan}</span>
                                     </div>
                                   ))}
                                 </div>

                                 <div className="w-36 flex flex-col justify-center items-center bg-[#00215e] rounded-xl p-3 text-center shrink-0">
                                   <span className="text-[10px] text-gray-300 font-bold uppercase mb-1">Status</span>
                                   <span className="bg-[#ffc55a] text-[#00215e] text-xs font-black px-2.5 py-1 rounded uppercase">
                                     {pesanan.statusPesanan}
                                   </span>
                                 </div>
                               </div>
                             ))
                           )}
                         </div>
                       </div>

                       {/* right: raw material inventory view */}
                       <div className="w-[320px] bg-[#00215e]/80 border border-[#ffc55a]/20 p-5 rounded-2xl flex flex-col shrink-0 overflow-hidden">
                         <h5 className="text-white text-base font-extrabold uppercase mb-4 tracking-wider flex items-center">
                           Raw Material Inventory
                         </h5>
                         <div className={`space-y-3 overflow-y-auto pr-1 flex-1 ${customScrollbar}`}>
                           {listBahan.length === 0 ? (
                             <p className="text-xs text-gray-400 font-bold italic text-center mt-6">No inventory data.</p>
                           ) : (
                             listBahan.map(bahan => {
                               const isReady = bahan.statusBahan === 'TERSEDIA';
                               return (
                                 <div key={bahan.id} className="bg-white rounded-lg p-3 text-[#00215e] font-extrabold text-xs flex items-center justify-between shadow-sm">
                                   <span className="truncate pr-2">{bahan.namaBahan}</span>
                                   <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase shrink-0 ${
                                     isReady ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                   }`}>
                                     {isReady ? 'Ready' : 'Empty'}
                                   </span>
                                 </div>
                               );
                             })
                           )}
                         </div>
                         <div className="mt-3 pt-3 border-t border-white/10 text-center">
                           <span className="text-[10px] text-red-300 font-bold uppercase tracking-wider">
                             Read-Only Inventory View
                           </span>
                         </div>
                       </div>
                     </div>
                   )}
                 </div>
               )}
             </div>
           )}
         </div>

         {/* strict data constraint warning overlay for dashboards */}
         <div className="absolute inset-0 z-0 pointer-events-none opacity-20 flex items-center justify-center overflow-hidden">
             <span className="text-white text-[18vw] font-black uppercase tracking-widest -rotate-12">DATA_VIEW_ONLY</span>
         </div>
      </div>
    </div>
  );
}
