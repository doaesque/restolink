// api route for processing order payments and releasing tables
import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { noNota, totalBayar, metodePembayaran, idPegawai } = body;

    if (!noNota || totalBayar === undefined) {
      return NextResponse.json(
        { sukses: false, pesan: 'Receipt number and total payment are required.' },
        { status: 400 }
      );
    }

    // fallback idPegawai if not passed
    const cashierId = idPegawai || 'KASIR-001';

    const hasilPembayaran = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // fetch target order
      const pesanan = await tx.pesanan.findUnique({
        where: { noNota },
      });

      if (!pesanan) {
        throw new Error('Order not found.');
      }

      if (pesanan.statusTagihan === 'PAID') {
        throw new Error('This order has already been paid.');
      }

      // create payment transaction entry
      const pembayaran = await tx.pembayaran.create({
        data: {
          noNota,
          totalBayar: parseFloat(totalBayar.toString()),
          idPegawai: cashierId,
        },
      });

      // update order billing status and payment method
      await tx.pesanan.update({
        where: { noNota },
        data: {
          statusTagihan: 'PAID',
          metodePembayaran: metodePembayaran || 'TUNAI',
        },
      });

      // release associated table back to available status
      await tx.meja.update({
        where: { noMeja: pesanan.noMeja },
        data: { status: 'TERSEDIA' },
      });

      return pembayaran;
    });

    return NextResponse.json({ sukses: true, data: hasilPembayaran }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { sukses: false, pesan: error.message || 'Failed to process payment.' },
      { status: 500 }
    );
  }
}
