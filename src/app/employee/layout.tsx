// employee section shared layout component
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/employee/login';

  // hide top navigation bar completely on login page
  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* top navigation bar for employees */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center space-x-3">
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

        {/* top navigation actions restricted per security rules */}
        <div className="flex items-center space-x-3">
          <Link
            href="/employee"
            className="px-3 py-1.5 text-xs font-semibold rounded-md transition-colors bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
          >
            Portal Utama
          </Link>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-semibold rounded-md transition-colors bg-resto-orange text-white hover:opacity-90 shadow-sm"
            >
              Keluar
            </button>
          </form>
        </div>
      </header>

      {/* main content area */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
}
