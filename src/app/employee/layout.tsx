// employee section shared layout simplified to respect custom figma designs per page
'use client';

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // removed the global white navigation bar to allow full-screen figma designs
  return (
    <div className="min-h-screen bg-[#2B4B77] text-white font-sans flex flex-col overflow-hidden">
      {children}
    </div>
  );
}
