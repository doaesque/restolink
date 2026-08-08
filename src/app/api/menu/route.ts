// api route for fetching menu catalog and determining stock via ingredient relations
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// force next.js to bypass cache and dynamically fetch the latest db data
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET() {
  try {
    // fetch menus with their ingredient composition to check stock status accurately
    const menus = await prisma.menu.findMany({
      include: {
        komposisi: {
          include: {
            bahanBaku: true
          }
        }
      }
    });

    // map menus to include availability status based strictly on relational ingredients
    const data = menus.map((menu) => {
      // robust check: if any linked ingredient is out of stock (habis/kosong)
      const isOutOfStock = menu.komposisi.some((k) => {
        const status = k.bahanBaku.statusBahan.toUpperCase();
        return status.includes('HABIS') || status.includes('KOSONG') || status === 'OUT_OF_STOCK';
      });

      return {
        id: menu.id,
        namaMenu: menu.namaMenu,
        // convert categories to uppercase to ensure frontend consistency
        kategori: menu.kategori.toUpperCase(),
        subKategori: menu.subKategori ? menu.subKategori.toUpperCase() : null,
        harga: menu.harga,
        image: menu.image,
        // if no ingredients are linked (empty array), it assumes available. run seed to fix missing links.
        isAvailable: !isOutOfStock
      };
    });

    // explicitly disable caching on the response header level as well
    const response = NextResponse.json({ sukses: true, data });
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    return response;
  } catch (error) {
    console.error('menu fetch error:', error);
    return NextResponse.json(
      { sukses: false, pesan: 'Failed to fetch menu data.' },
      { status: 500 }
    );
  }
}
