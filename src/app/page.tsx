import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="w-screen h-screen bg-[#00215e] flex flex-col items-center justify-center font-sans relative overflow-hidden">
      {/* decorative background blur */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#2c4e80] rounded-full mix-blend-screen filter blur-[80px] opacity-60"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#fc4100] rounded-full mix-blend-screen filter blur-[100px] opacity-20"></div>

      <div className="z-10 flex flex-col items-center">
        <Image 
          src="/logo_emas.png" 
          alt="RestoLink Logo" 
          width={180} 
          height={180} 
          className="drop-shadow-2xl mb-8 transform hover:scale-105 transition-transform duration-300" 
          priority
        />
        
        <h1 className="text-6xl md:text-7xl font-extrabold text-white tracking-widest drop-shadow-lg text-center">
          RESTO<span className="text-[#ffc55a]">LINK</span>
        </h1>
        
        <p className="text-[#ffc55a] mt-6 text-xl md:text-2xl font-bold tracking-widest uppercase">
          Restaurant Management System
        </p>

        <div className="mt-14">
          <Link 
            href="/employee/login" 
            className="bg-[#fc4100] hover:bg-[#ffc55a] text-white hover:text-[#00215e] px-10 py-5 rounded-2xl text-xl font-extrabold shadow-[0_10px_30px_rgba(252,65,0,0.4)] transition-all duration-300 uppercase tracking-widest hover:scale-105 inline-block"
          >
            Enter Staff Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
