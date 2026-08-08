// api route for processing order payments and releasing tables
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // FIX: ekstrak idPegawai dari body request agar tidak undefined saat disimpan
    const { noNota, totalBayar, metodePembayaran, idPegawai } = body;

    // validate input data
    if (!noNota || totalBayar === undefined || !metodePembayaran || !idPegawai) {
      return NextResponse.json(
        { sukses: false, pesan: 'Incomplete payment data provided. (noNota, totalBayar, metodePembayaran, idPegawai are required)' },
        { status: 400 }
      );
    }

    // execute database transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // 1. check if the order exists
      const pesanan = await tx.pesanan.findUnique({
        where: { noNota }
      });

      if (!pesanan) {
        throw new Error('Order not found.');
      }

      if (pesanan.statusTagihan === 'PAID') {
        throw new Error('Order has already been paid.');
      }

      // 2. create the payment record
      const pembayaran = await tx.pembayaran.create({
        data: {
          noNota,
          totalBayar,
          metodePembayaran,
          idPegawai // ini sekarang tidak akan undefined
        }
      });

      // 3. update order status to PAID
      await tx.pesanan.update({
        where: { noNota },
        data: { statusTagihan: 'PAID' }
      });

      // 4. release the table by setting its status back to TERSEDIA
      await tx.meja.update({
        where: { noMeja: pesanan.noMeja },
        data: { status: 'TERSEDIA' }
      });

      return pembayaran;
    });

    return NextResponse.json({ sukses: true, data: result });
  } catch (error: any) {
    console.error('payment processing error:', error);
    return NextResponse.json(
      { sukses: false, pesan: error.message || 'Internal server error during payment processing.' },
      { status: 500 }
    );
  }
}
