// api route for fetching menu catalog and determining stock via strict ingredient relations
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
      // condition 1: is the menu explicitly marked as 'tersedia' in the menu table?
      // @ts-ignore - bypassing ts error in case prisma client is old
      const currentMenuStatus = menu.status ? String(menu.status).trim().toUpperCase() : 'TERSEDIA';
      const isMenuAvailable = currentMenuStatus === 'TERSEDIA';

      // condition 2: the menu MUST have at least one ingredient mapped to it in the database
      const hasIngredients = menu.komposisi.length > 0;

      // condition 3: EVERY SINGLE ingredient connected to it must be 'tersedia'
      const allIngredientsAvailable = hasIngredients && menu.komposisi.every((k) => {
        if (!k.bahanBaku) return false;
        const status = (k.bahanBaku.statusBahan || '').trim().toUpperCase();
        return status === 'TERSEDIA';
      });

      // compile ingredient names into a string for ui display
      const komposisiString = menu.komposisi
        .map((k) => k.bahanBaku?.namaBahan)
        .filter(Boolean)
        .join(', ');

      return {
        id: menu.id,
        namaMenu: menu.namaMenu,
        kategori: menu.kategori,
        subKategori: menu.subKategori,
        harga: menu.harga,
        image: menu.image,
        komposisiString: komposisiString,
        // strict availability: must be active menu + must have ingredients + all ingredients must be in stock
        isAvailable: isMenuAvailable && hasIngredients && allIngredientsAvailable, 
      };
    });

    // explicitly return the array directly so other modules (like pelayan/koki) don't crash expecting an object
    return NextResponse.json(formattedMenus);
  } catch (error) {
    console.error('failed to fetch menu api:', error);
    return NextResponse.json(
      { error: 'internal server error while fetching menus' },
      { status: 500 }
    );
  }
}
