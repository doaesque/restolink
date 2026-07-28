// pure wrapper layout to prevent rendering conflicts
export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-screen h-screen m-0 p-0 overflow-hidden bg-black">
      {children}
    </div>
  );
}