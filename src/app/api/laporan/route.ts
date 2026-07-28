// api route for transaction history and owner financial summary
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // fetch completed transactions and unpaid receipts
    const riwayatTransaksi = await prisma.pesanan.findMany({
      include: {
        pelanggan: true,
        meja: true,
        detailPesanan: {
          include: {
            menu: true,
          },
        },
        pembayaran: true,
      },
      orderBy: {
        tglPesanan: 'desc',
      },
    });

    // compute total earnings from paid orders
    const totalPendapatan = riwayatTransaksi.reduce((acc, p) => {
      if (p.statusTagihan === 'PAID') {
        const totalPesanan = p.detailPesanan.reduce((sum, d) => sum + d.subtotal, 0);
        return acc + totalPesanan;
      }
      return acc;
    }, 0);

    return NextResponse.json({
      sukses: true,
      data: {
        totalPendapatan,
        totalTransaksi: riwayatTransaksi.length,
        riwayat: riwayatTransaksi,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { sukses: false, pesan: 'Gagal mengambil data riwayat laporan.' },
      { status: 500 }
    );
  }
}
