// waiter module interface
'use client';

import { useRouter } from 'next/navigation';

export default function PelayanPage() {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/employee/login');
  }

  return (
    <div className="min-h-screen bg-[#2B4B77] p-8 text-white relative">
      <div className="absolute top-6 right-6">
         <button onClick={handleLogout} className="bg-red-600/80 px-5 py-2 rounded-lg font-bold hover:bg-red-600 transition-colors shadow-lg">Logout</button>
      </div>

      <div className="mb-10 text-center">
        <h2 className="text-4xl font-extrabold tracking-wide">Waiter Area</h2>
        <p className="text-lg text-blue-200 mt-2">Table management functionality goes here.</p>
      </div>
      
      <div className="bg-[#00215e] p-10 rounded-2xl shadow-2xl flex justify-center">
          <p className="text-2xl font-bold text-gray-300">Waiter module active.</p>
      </div>
    </div>
  );
}
