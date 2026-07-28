// employee section shared layout component updated for light mode and clean logo rendering
'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* top navigation bar for employees */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center space-x-3">
          {/* clean logo display without awkward background box */}
          <div className="w-10 h-10 flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="RestoLink Logo"
              width={38}
              height={32}
              className="object-contain"
            />
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-resto-navy tracking-wide">RestoLink</h1>
            <p className="text-[10px] text-slate-500 font-medium">Sistem Operasional Karyawan</p>
          </div>
        </div>

        {/* navigation links */}
        <nav className="flex items-center space-x-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <Link
            href="/employee"
            className="px-3 py-1.5 text-xs font-semibold rounded-md transition-colors hover:bg-white text-slate-700"
          >
            Dashboard
          </Link>
          <Link
            href="/employee/pelayan"
            className="px-3 py-1.5 text-xs font-semibold rounded-md transition-colors hover:bg-white text-slate-700"
          >
            Pelayan
          </Link>
          <Link
            href="/employee/koki"
            className="px-3 py-1.5 text-xs font-semibold rounded-md transition-colors hover:bg-white text-slate-700"
          >
            Koki
          </Link>
          <Link
            href="/employee/kasir"
            className="px-3 py-1.5 text-xs font-semibold rounded-md transition-colors hover:bg-white text-slate-700"
          >
            Kasir
          </Link>
          <Link
            href="/employee/pemilik"
            className="px-3 py-1.5 text-xs font-semibold rounded-md transition-colors hover:bg-white text-slate-700"
          >
            Pemilik (Riwayat)
          </Link>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-semibold rounded-md transition-colors bg-resto-orange text-white hover:opacity-90 ml-2"
            >
              Keluar
            </button>
          </form>
        </nav>
      </header>

      {/* main content area */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
}
