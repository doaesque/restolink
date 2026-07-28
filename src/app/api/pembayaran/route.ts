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
        { sukses: false, pesan: 'Nomor nota dan total bayar wajib diisi.' },
        { status: 400 }
      );
    }

    // fallback idPegawai if not passed
    const cashierId = idPegawai || 'KASIR-001';

    const hasilPembayaran = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. fetch target order
      const pesanan = await tx.pesanan.findUnique({
        where: { noNota },
      });

      if (!pesanan) {
        throw new Error('Pesanan tidak ditemukan.');
      }

      if (pesanan.statusTagihan === 'PAID') {
        throw new Error('Pesanan ini sudah dibayar sebelumnya.');
      }

      // 2. create payment transaction entry
      const pembayaran = await tx.pembayaran.create({
        data: {
          noNota,
          totalBayar: parseFloat(totalBayar.toString()),
          idPegawai: cashierId,
        },
      });

      // 3. update order billing status and payment method
      await tx.pesanan.update({
        where: { noNota },
        data: {
          statusTagihan: 'PAID',
          metodePembayaran: metodePembayaran || 'TUNAI',
        },
      });

      // 4. release associated table back to available status
      await tx.meja.update({
        where: { noMeja: pesanan.noMeja },
        data: { status: 'TERSEDIA' },
      });

      return pembayaran;
    });

    return NextResponse.json({ sukses: true, data: hasilPembayaran }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { sukses: false, pesan: error.message || 'Gagal memproses pembayaran.' },
      { status: 500 }
    );
  }
}
