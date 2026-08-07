// src/app/api/menu/route.ts
import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma'; 

// force next.js to bypass cache and dynamically fetch the latest db data
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const menus = await prisma.menu.findMany();
    return NextResponse.json({ sukses: true, data: menus });
  } catch (error) {
    return NextResponse.json(
      { sukses: false, pesan: 'gagal mengambil data menu' }, 
      { status: 500 }
    );
  }
}