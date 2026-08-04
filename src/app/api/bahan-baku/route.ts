// api route for managing kitchen raw materials stock status
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// fetch all raw materials
export async function GET() {
  try {
    const bahanBaku = await prisma.bahanBaku.findMany({
      orderBy: {
        namaBahan: 'asc',
      },
    });
    return NextResponse.json({ sukses: true, data: bahanBaku });
  } catch (error) {
    return NextResponse.json(
      { sukses: false, pesan: 'Failed to fetch raw material data.' },
      { status: 500 }
    );
  }
}

// update raw material availability status
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, statusBahan } = body;

    if (!id || !statusBahan) {
      return NextResponse.json(
        { sukses: false, pesan: 'Raw material ID and status are required.' },
        { status: 400 }
      );
    }

    const updatedBahan = await prisma.bahanBaku.update({
      where: { id },
      data: { statusBahan },
    });

    return NextResponse.json({ sukses: true, data: updatedBahan });
  } catch (error) {
    return NextResponse.json(
      { sukses: false, pesan: 'Failed to update raw material status.' },
      { status: 500 }
    );
  }
}
