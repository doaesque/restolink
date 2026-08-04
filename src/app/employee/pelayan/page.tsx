// waiter module interface for managing tables and creating new orders
'use client';

import { useEffect, useState } from 'react';

interface Meja {
  noMeja: number;
  status: 'TERSEDIA' | 'OCCUPIED';
}

interface Menu {
  id: string;
  namaMenu: string;
  harga: number;
}

interface OrderCartItem {
  menu: Menu;
  jumlahPesanan: number;
}

export default function PelayanPage() {
  const [listMeja, setListMeja] = useState<Meja[]>([]);
  const [listMenu, setListMenu] = useState<Menu[]>([]);
  const [selectedMeja, setSelectedMeja] = useState<number | null>(null);
  const [namaPelanggan, setNamaPelanggan] = useState<string>('');
  const [jumlahOrang, setJumlahOrang] = useState<number>(1);
  const [cart, setCart] = useState<OrderCartItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [pesan, setPesan] = useState<{ tipe: 'sukses' | 'error'; teks: string } | null>(null);

  // load tables and menu data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [resMeja, resMenu] = await Promise.all([
        fetch('/api/meja'),
        fetch('/api/menu'),
      ]);

      const dataMeja = await resMeja.json();
      const dataMenu = await resMenu.json();

      if (dataMeja.sukses) setListMeja(dataMeja.data);
      if (dataMenu.sukses) setListMenu(dataMenu.data);
    } catch (err) {
      console.error('error loading waiter data:', err);
      setPesan({ tipe: 'error', teks: 'An error occurred while loading data.' });
    } finally {
      setLoading(false);
    }
  }

  // add menu item to order cart
  function addToCart(menu: Menu) {
    setCart((prev) => {
      const existing = prev.find((item) => item.menu.id === menu.id);
      if (existing) {
        return prev.map((item) =>
          item.menu.id === menu.id
            ? { ...item, jumlahPesanan: item.jumlahPesanan + 1 }
            : item
        );
      }
      return [...prev, { menu, jumlahPesanan: 1 }];
    });
  }

  // update cart item quantity
  function updateQuantity(idMenu: string, change: number) {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.menu.id === idMenu) {
            const newQty = item.jumlahPesanan + change;
            return newQty > 0 ? { ...item, jumlahPesanan: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as OrderCartItem[]
    );
  }

  // compute total price
  const totalSubtotal = cart.reduce(
    (acc, item) => acc + item.menu.harga * item.jumlahPesanan,
    0
  );

  // handle order submission
  async function handleSubmitOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMeja) {
      setPesan({ tipe: 'error', teks: 'Please select a table number first.' });
      return;
    }
    if (!namaPelanggan.trim()) {
      setPesan({ tipe: 'error', teks: "Please enter the customer's name." });
      return;
    }
    if (cart.length === 0) {
      setPesan({ tipe: 'error', teks: 'Select at least one menu to order.' });
      return;
    }

    setSubmitting(true);
    setPesan(null);

    try {
      const payload = {
        namaPelanggan,
        jumlahOrang,
        noMeja: selectedMeja,
        detailPesanan: cart.map((item) => ({
          idMenu: item.menu.id,
          jumlahPesanan: item.jumlahPesanan,
          subtotal: item.menu.harga * item.jumlahPesanan,
        })),
      };

      const response = await fetch('/api/pesanan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.sukses) {
        setPesan({ tipe: 'sukses', teks: 'Order successfully created and forwarded to the Chef!' });
        setCart([]);
        setNamaPelanggan('');
        setSelectedMeja(null);
        setJumlahOrang(1);
        fetchData();
      } else {
        setPesan({ tipe: 'error', teks: result.pesan || 'Failed to create order.' });
      }
    } catch (err) {
      console.error('error submitting order:', err);
      setPesan({ tipe: 'error', teks: 'A system error occurred while submitting the order.' });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-slate-400">Loading waiter module data...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Waiter Module & Table Management</h2>
        <p className="text-sm text-slate-400">Select a table and create a new order for incoming customers.</p>
      </div>

      {pesan && (
        <div
          className={`p-4 rounded-lg text-sm border ${
            pesan.tipe === 'sukses'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          {pesan.teks}
        </div>
      )}

      {/* table selection grid */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
          Table Availability Status
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {listMeja.map((meja) => {
            const isOccupied = meja.status === 'OCCUPIED';
            const isSelected = selectedMeja === meja.noMeja;

            return (
              <button
                key={meja.noMeja}
                disabled={isOccupied}
                onClick={() => setSelectedMeja(meja.noMeja)}
                className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all ${
                  isOccupied
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 cursor-not-allowed opacity-60'
                    : isSelected
                    ? 'bg-amber-500 border-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-500/20'
                    : 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700'
                }`}
              >
                <span className="text-xs uppercase font-medium">Table</span>
                <span className="text-xl font-extrabold">{meja.noMeja}</span>
                <span className="text-[10px] uppercase tracking-wider mt-1">
                  {isOccupied ? 'Occupied' : isSelected ? 'Selected' : 'Available'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* order creation layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* menu selection list */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
            Restaurant Menu Catalog
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {listMenu.map((menu) => (
              <div
                key={menu.id}
                className="bg-slate-950 border border-slate-800 p-4 rounded-lg flex items-center justify-between hover:border-slate-700 transition-colors"
              >
                <div>
                  <p className="font-semibold text-white text-sm">{menu.namaMenu}</p>
                  <p className="text-xs text-amber-500 mt-0.5">
                    Rp {menu.harga.toLocaleString('id-ID')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => addToCart(menu)}
                  className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500 hover:text-slate-950 rounded-lg text-xs font-semibold transition-all"
                >
                  + Add
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* order checkout form */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
            New Order Details
          </h3>

          <form onSubmit={handleSubmitOrder} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Table Number</label>
              <input
                type="text"
                readOnly
                value={selectedMeja ? `Table ${selectedMeja}` : 'Not Selected'}
                className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-sm text-slate-300 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Customer Name</label>
              <input
                type="text"
                placeholder="Enter customer name"
                value={namaPelanggan}
                onChange={(e) => setNamaPelanggan(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Number of Guests</label>
              <input
                type="number"
                min="1"
                value={jumlahOrang}
                onChange={(e) => setJumlahOrang(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* cart items list */}
            <div className="border-t border-slate-800 pt-3 space-y-2">
              <p className="text-xs font-semibold text-slate-400">Order Summary:</p>
              {cart.length === 0 ? (
                <p className="text-xs text-slate-600 italic">No items selected yet.</p>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.menu.id}
                    className="flex items-center justify-between text-xs py-1 text-slate-300"
                  >
                    <span className="truncate max-w-[120px]">{item.menu.namaMenu}</span>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.menu.id, -1)}
                        className="px-1.5 bg-slate-800 rounded text-slate-300 hover:bg-slate-700"
                      >
                        -
                      </button>
                      <span>{item.jumlahPesanan}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.menu.id, 1)}
                        className="px-1.5 bg-slate-800 rounded text-slate-300 hover:bg-slate-700"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* total and submit button */}
            <div className="border-t border-slate-800 pt-3 flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-400">Total Price:</span>
              <span className="text-base font-bold text-amber-500">
                Rp {totalSubtotal.toLocaleString('id-ID')}
              </span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Send Order to Kitchen'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
