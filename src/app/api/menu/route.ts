// api route for fetching menu catalog
import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

// force next.js to bypass cache and dynamically fetch the latest db data
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // fetch menus with their ingredient composition to check stock status
    const menus = await prisma.menu.findMany({
      include: {
        komposisi: {
          include: {
            bahanBaku: true
          }
        }
      }
    });

    // map menus to include availability status based on ingredients
    const data = menus.map((menu) => {
      const isOutOfStock = menu.komposisi.some(
        (k) => k.bahanBaku.statusBahan.toUpperCase() === 'HABIS'
      );

      return {
        id: menu.id,
        namaMenu: menu.namaMenu,
        // FIX: ubah kategori dan subkategori menjadi UPPERCASE agar cocok dengan page.tsx
        kategori: menu.kategori.toUpperCase(),
        subKategori: menu.subKategori ? menu.subKategori.toUpperCase() : null,
        harga: menu.harga,
        image: menu.image,
        isAvailable: !isOutOfStock
      };
    });

    return NextResponse.json({ sukses: true, data });
  } catch (error) {
    return NextResponse.json(
      { sukses: false, pesan: 'Failed to fetch menu data.' },
      { status: 500 }
    );
  }
}
