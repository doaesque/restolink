// api route to fetch all staff for owner monitoring
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const pegawai = await prisma.pegawai.findMany({
      select: {
        id: true,
        namaPegawai: true,
        jabatan: true,
      }
    });
    return NextResponse.json({ sukses: true, data: pegawai });
  } catch (error) {
    return NextResponse.json(
      { sukses: false, pesan: 'failed to fetch staff data.' },
      { status: 500 }
    );
  }
}
