// api route for managing menu
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// handle get request to fetch all menu items
export async function GET() {
  try {
    const menus = await prisma.menu.findMany();
    return NextResponse.json({ sukses: true, data: menus });
  } catch (error) {
    return NextResponse.json(
      { sukses: false, pesan: 'Gagal mengambil data menu.' },
      { status: 500 }
    );
  }
}

// handle post request to create a new menu item
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { namaMenu, harga } = body;

    // validate input
    if (!namaMenu || harga === undefined) {
      return NextResponse.json(
        { sukses: false, pesan: 'Nama menu dan harga wajib diisi.' },
        { status: 400 }
      );
    }

    const newMenu = await prisma.menu.create({
      data: {
        namaMenu,
        harga: parseFloat(harga),
      },
    });

    return NextResponse.json({ sukses: true, data: newMenu }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { sukses: false, pesan: 'Gagal menambahkan menu baru.' },
      { status: 500 }
    );
  }
}
