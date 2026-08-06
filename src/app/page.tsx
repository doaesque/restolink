// customer-facing landing page
import Image from 'next/image';
import Link from 'next/link';
import { Utensils } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#00215e] flex flex-col font-sans relative overflow-hidden">
      {/* decorative background blur */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#2c4e80] rounded-full mix-blend-screen filter blur-[80px] opacity-60 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#fc4100] rounded-full mix-blend-screen filter blur-[100px] opacity-20 pointer-events-none"></div>

      {/* customer navigation bar */}
      <nav className="w-full p-6 flex justify-between items-center z-10 relative">
        <div className="flex items-center space-x-3">
          <Image src="/logo_emas.png" alt="RestoLink Logo" width={50} height={50} className="object-contain" />
          <span className="text-2xl font-extrabold text-white tracking-widest">
            RESTO<span className="text-[#ffc55a]">LINK</span>
          </span>
        </div>
        <div className="space-x-8 text-white font-bold hidden md:block">
          <Link href="#" className="hover:text-[#ffc55a] transition-colors uppercase tracking-wider text-sm">Home</Link>
          <Link href="#" className="hover:text-[#ffc55a] transition-colors uppercase tracking-wider text-sm">Menu</Link>
          <Link href="#" className="hover:text-[#ffc55a] transition-colors uppercase tracking-wider text-sm">Reservations</Link>
        </div>
      </nav>

      {/* hero section */}
      <div className="flex-1 flex flex-col items-center justify-center z-10 px-4 text-center">
        <div className="bg-[#ffc55a]/10 p-5 rounded-full mb-8 border border-[#ffc55a]/30 shadow-[0_0_30px_rgba(255,197,90,0.2)]">
          <Utensils className="w-12 h-12 text-[#ffc55a]" />
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-wider drop-shadow-lg max-w-4xl leading-tight">
          Experience Culinary <br/><span className="text-[#ffc55a]">Excellence</span>
        </h1>
        
        <p className="text-[#A6C4E5] mt-6 text-lg md:text-2xl font-medium max-w-2xl">
          Savor the finest ingredients crafted into unforgettable dishes. Book a table or explore our menu today.
        </p>

        <div className="mt-12 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
          <button className="bg-[#fc4100] hover:bg-[#ffc55a] text-white hover:text-[#00215e] px-10 py-4 rounded-full text-lg font-extrabold shadow-lg transition-all duration-300 tracking-wider hover:scale-105 uppercase">
            View Menu
          </button>
          <button className="bg-transparent border-2 border-[#ffc55a] text-[#ffc55a] hover:bg-[#ffc55a] hover:text-[#00215e] px-10 py-4 rounded-full text-lg font-extrabold shadow-lg transition-all duration-300 tracking-wider hover:scale-105 uppercase">
            Book a Table
          </button>
        </div>
      </div>

      {/* subtle footer with staff portal link */}
      <footer className="w-full p-6 text-center z-10 relative mt-auto border-t border-white/10 bg-[#00215e]/50 backdrop-blur-sm">
        <p className="text-sm text-[#A6C4E5] font-medium">
          &copy; {new Date().getFullYear()} RestoLink. All rights reserved. 
          <span className="mx-3 text-[#ffc55a]">|</span> 
          <Link href="/employee/login" className="hover:text-white transition-colors underline decoration-dotted underline-offset-4">
            Staff Portal
          </Link>
        </p>
      </footer>
    </div>
  );
}
