// api route for processing order payments and releasing tables
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { noNota, totalBayar, metodePembayaran } = body;

    // validate input data
    if (!noNota || totalBayar === undefined || !metodePembayaran) {
      return NextResponse.json(
        { sukses: false, pesan: 'invalid payment data provided.' },
        { status: 400 }
      );
    }

    // fetch the order to identify the table
    const pesanan = await prisma.pesanan.findUnique({
      where: { noNota }
    });

    if (!pesanan) {
      return NextResponse.json(
        { sukses: false, pesan: 'order not found.' },
        { status: 404 }
      );
    }

    // execute transaction using 'any' to bypass strict prisma client typing issues on vercel
    const result = await prisma.$transaction(async (tx: any) => {
      // 1. insert payment record
      const pembayaran = await tx.pembayaran.create({
        data: {
          totalBayar: Number(totalBayar),
          metodePembayaran: metodePembayaran,
          noNota: noNota,
          idPegawai: 'CASH-001' // default cashier id
        }
      });

      // 2. update order status to paid
      await tx.pesanan.update({
        where: { noNota },
        data: { statusTagihan: 'PAID' }
      });

      // 3. update table status to available
      await tx.meja.update({
        where: { noMeja: pesanan.noMeja },
        data: { status: 'TERSEDIA' }
      });

      return pembayaran;
    });

    return NextResponse.json({
      sukses: true,
      pesan: 'payment processed successfully.',
      data: result
    });

  } catch (error: any) {
    return NextResponse.json(
      { sukses: false, pesan: 'server error occurred during payment processing.' },
      { status: 500 }
    );
  }
}
