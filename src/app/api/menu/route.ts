// api route for fetching menu items from the database
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const menu = await prisma.menu.findMany({
      orderBy: { namaMenu: 'asc' },
    });
    return NextResponse.json({ sukses: true, data: menu });
  } catch (error) {
    return NextResponse.json(
      { sukses: false, pesan: 'Failed to fetch menu data.' },
      { status: 500 }
    );
  }
}
