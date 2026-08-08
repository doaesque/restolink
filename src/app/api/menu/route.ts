// api route for fetching menu catalog and determining stock via ingredient relations
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// strictly force next.js to bypass cache and dynamically fetch the latest data from database
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET() {
  try {
    const menus = await prisma.menu.findMany({
      include: {
        komposisi: {
          include: {
            bahanBaku: true,
          },
        },
      },
    });

    const formattedMenus = menus.map((menu) => {
      // logic: if ANY ingredient connected to this menu is 'HABIS', mark the menu as out of stock.
      // note: if a menu has 0 ingredients in the database, it will always be true (available).
      const isOutOfStock = menu.komposisi.some(
        (k) => k.bahanBaku.statusBahan === 'HABIS'
      );

      return {
        id: menu.id,
        namaMenu: menu.namaMenu,
        kategori: menu.kategori,
        subKategori: menu.subKategori,
        harga: menu.harga,
        image: menu.image,
        isAvailable: !isOutOfStock, // returns false if out of stock
      };
    });

    return NextResponse.json({ data: formattedMenus });
  } catch (error) {
    console.error('failed to fetch menu api:', error);
    return NextResponse.json(
      { error: 'internal server error while fetching menus' },
      { status: 500 }
    );
  }
}
