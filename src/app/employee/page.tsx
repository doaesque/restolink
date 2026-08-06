// main owner portal with unified login-style aesthetics
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { UserRoundCog, ChefHat, Users, Home, ChevronLeft, LogOut } from 'lucide-react';

interface Pegawai {
  id: string;
  namaPegawai: string;
  jabatan: string;
}

export default function EmployeePortalPage() {
  const router = useRouter();
  const [view, setView] = useState<'welcome' | 'monitoring' | 'staff_KASIR' | 'staff_KOKI' | 'staff_PELAYAN'>('welcome');
  const [staffList, setStaffList] = useState<Pegawai[]>([]);
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (view.startsWith('staff')) {
      fetchStaff();
    }
  }, [view]);

  async function fetchStaff() {
    try {
      const res = await fetch('/api/pegawai');
      const data = await res.json();
      if (data.sukses) {
        setStaffList(data.data);
        setAttendance(prev => {
          const newAtt = { ...prev };
          data.data.forEach((p: Pegawai) => {
            if (newAtt[p.id] === undefined) newAtt[p.id] = true;
          });
          return newAtt;
        });
      }
    } catch (err) {
      console.error('failed to fetch staff data:', err);
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/employee/login');
  }

  const toggleAttendance = (id: string) => {
    setAttendance(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // ---------------------------------------------------------
  // 1. owner welcome view
  // ---------------------------------------------------------
  if (view === 'welcome') {
    return (
      <div className="w-screen h-screen bg-gradient-to-br from-[#00215e] to-[#2c4e80] flex items-center justify-center font-sans relative">
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
              Boss Portal
            </div>
          </div>

          <div className="bg-[#2c4e80] w-full p-10 rounded-2xl shadow-2xl flex justify-center space-x-8 border border-[#ffc55a]/10">
            <button onClick={() => router.push('/employee/kasir')} className="bg-white text-[#00215e] p-6 rounded-xl flex flex-col items-center w-40 h-40 justify-center shadow-lg hover:bg-[#ffc55a] transition-all hover:-translate-y-1">
              <UserRoundCog className="w-14 h-14 mb-3" />
              <span className="font-extrabold text-lg">Cashier</span>
            </button>
            <button onClick={() => router.push('/employee/koki')} className="bg-white text-[#00215e] p-6 rounded-xl flex flex-col items-center w-40 h-40 justify-center shadow-lg hover:bg-[#ffc55a] transition-all hover:-translate-y-1">
              <ChefHat className="w-14 h-14 mb-3" />
              <span className="font-extrabold text-lg">Chef</span>
            </button>
            <button onClick={() => setView('monitoring')} className="bg-white text-[#00215e] p-6 rounded-xl flex flex-col items-center w-40 h-40 justify-center shadow-lg hover:bg-[#ffc55a] transition-all hover:-translate-y-1">
              <Users className="w-14 h-14 mb-3" />
              <span className="font-extrabold text-lg">Staff</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // 2. monitoring overview view
  // ---------------------------------------------------------
  if (view === 'monitoring') {
    return (
      <div className="w-screen h-screen bg-gradient-to-br from-[#00215e] to-[#2c4e80] flex items-center justify-center font-sans relative">
        <div className="absolute top-6 left-6">
           <button onClick={() => setView('welcome')} className="text-white font-extrabold text-lg flex items-center hover:text-[#ffc55a] transition-colors">
             <ChevronLeft className="w-6 h-6 mr-1" /> Back
           </button>
        </div>

        <div className="flex flex-col items-center w-full max-w-[700px] px-4">
          <div className="flex flex-col items-center mb-8">
            <Image src="/logo_emas.png" alt="RestoLink Logo" width={110} height={110} className="object-contain drop-shadow-lg mb-2" priority />
            <h1 className="text-4xl font-extrabold text-white tracking-wider mt-2 drop-shadow-md">
              RESTO<span className="text-[#ffc55a]">LINK</span>
            </h1>
            <div className="bg-[#2c4e80] text-white text-xs font-bold tracking-widest mt-3 px-6 py-1.5 rounded-full shadow-md uppercase">
              Staff Monitoring
            </div>
          </div>

          <div className="bg-[#2c4e80] w-full p-10 rounded-2xl shadow-2xl flex justify-center space-x-8 border border-[#ffc55a]/10">
            <button onClick={() => setView('staff_KASIR')} className="bg-white text-[#00215e] p-6 rounded-xl flex flex-col items-center w-40 h-40 justify-center shadow-lg hover:bg-[#ffc55a] transition-all hover:-translate-y-1">
              <UserRoundCog className="w-14 h-14 mb-3" />
              <span className="font-extrabold text-lg">Cashier</span>
            </button>
            <button onClick={() => setView('staff_KOKI')} className="bg-white text-[#00215e] p-6 rounded-xl flex flex-col items-center w-40 h-40 justify-center shadow-lg hover:bg-[#ffc55a] transition-all hover:-translate-y-1">
              <ChefHat className="w-14 h-14 mb-3" />
              <span className="font-extrabold text-lg">Chef</span>
            </button>
            <button onClick={() => setView('staff_PELAYAN')} className="bg-white text-[#00215e] p-6 rounded-xl flex flex-col items-center w-40 h-40 justify-center shadow-lg hover:bg-[#ffc55a] transition-all hover:-translate-y-1">
              <Users className="w-14 h-14 mb-3" />
              <span className="font-extrabold text-lg">Waiter</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // 3. specific staff list view
  // ---------------------------------------------------------
  if (view.startsWith('staff')) {
    const currentRole = view.replace('staff_', '');
    const filteredStaff = staffList.filter(p => p.jabatan === currentRole);

    return (
      <div className="w-screen h-screen flex bg-[#00215e] font-sans">
        <div className="w-[280px] bg-[#00215e] flex flex-col items-center py-10 shrink-0">
          <Image src="/logo_emas.png" alt="Logo" width={90} height={90} />
          <h2 className="text-white font-extrabold text-4xl mt-6 mb-12 tracking-wide">Staff</h2>
          
          <button 
            onClick={() => setView('staff_KASIR')} 
            className={`w-3/4 py-4 rounded-xl font-extrabold text-xl mb-6 shadow-lg transition-colors ${view === 'staff_KASIR' ? 'bg-[#ffc55a] text-[#00215e]' : 'bg-[#2c4e80] text-white hover:bg-[#ffc55a] hover:text-[#00215e]'}`}
          >
            Cashier
          </button>
          <button 
            onClick={() => setView('staff_KOKI')} 
            className={`w-3/4 py-4 rounded-xl font-extrabold text-xl mb-6 shadow-lg transition-colors ${view === 'staff_KOKI' ? 'bg-[#ffc55a] text-[#00215e]' : 'bg-[#2c4e80] text-white hover:bg-[#ffc55a] hover:text-[#00215e]'}`}
          >
            Chef
          </button>
          <button 
            onClick={() => setView('staff_PELAYAN')} 
            className={`w-3/4 py-4 rounded-xl font-extrabold text-xl mb-6 shadow-lg transition-colors ${view === 'staff_PELAYAN' ? 'bg-[#ffc55a] text-[#00215e]' : 'bg-[#2c4e80] text-white hover:bg-[#ffc55a] hover:text-[#00215e]'}`}
          >
            Waiter
          </button>
          
          <div className="mt-auto w-full flex flex-col items-center space-y-4">
             <button onClick={() => setView('monitoring')} className="text-white font-extrabold text-2xl flex items-center hover:text-[#ffc55a] transition-colors">
               <Home className="w-8 h-8 mr-3" /> Home
             </button>
          </div>
        </div>

        <div className="flex-1 bg-[#2c4e80] p-10 rounded-tl-[40px] shadow-[inset_10px_10px_20px_rgba(0,0,0,0.4)] flex flex-col">
          <div className="flex-1 overflow-y-auto pr-4">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="col-span-2 bg-[#00215e] text-white font-extrabold text-xl text-center py-4 rounded-xl shadow-md">Name</div>
              <div className="bg-[#00215e] text-white font-extrabold text-xl text-center py-4 rounded-xl shadow-md">Status</div>
            </div>

            <div className="space-y-4">
              {filteredStaff.length === 0 ? (
                <p className="text-center text-white font-bold mt-10">No staff found for this role.</p>
              ) : (
                filteredStaff.map((staff) => {
                  const isPresent = attendance[staff.id];
                  return (
                    <div key={staff.id} className="grid grid-cols-3 gap-4 items-center">
                      <div className="col-span-2 bg-[#00215e] text-white font-bold text-2xl px-8 py-5 rounded-xl shadow-md truncate">
                        {staff.namaPegawai.split(' ')[0]}
                      </div>
                      <button 
                        onClick={() => toggleAttendance(staff.id)}
                        className={`font-extrabold text-2xl text-center py-5 rounded-xl shadow-md transition-all ${
                          isPresent ? 'bg-[#ffc55a] text-[#00215e] hover:opacity-90' : 'bg-[#fc4100] text-white hover:opacity-90'
                        }`}
                      >
                        {isPresent ? 'Present' : 'Absent'}
                      </button>
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

  return null;
}
