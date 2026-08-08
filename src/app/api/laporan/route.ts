// laporan api route handling report generation and calculations
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const riwayatTransaksi = await prisma.pesanan.findMany({
      include: {
        detailPesanan: true,
      }
    });

    // compute total earnings from paid orders with strict typescript typing
    const totalPendapatan = riwayatTransaksi.reduce((acc: number, p: any) => {
      if (p.statusTagihan === 'PAID') {
        const totalPesanan = p.detailPesanan.reduce((sum: number, d: any) => sum + d.subtotal, 0);
        return acc + totalPesanan;
      }
      return acc;
    }, 0);

    // fetch existing reports
    const laporan = await prisma.laporan.findMany({
      include: {
        pegawai: {
          select: { namaPegawai: true }
        }
      },
      orderBy: { tglLaporan: 'desc' }
    });

    return NextResponse.json({
      sukses: true,
      kalkulasiSaatIni: totalPendapatan,
      data: laporan
    });
  } catch (error) {
    return NextResponse.json(
      { sukses: false, pesan: 'Failed to fetch report data.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { periode, idPegawai } = body;

    if (!idPegawai) {
      return NextResponse.json(
        { sukses: false, pesan: 'Employee ID is required to generate a report.' },
        { status: 400 }
      );
    }

    const riwayatTransaksi = await prisma.pesanan.findMany({
      include: {
        detailPesanan: true,
      }
    });

    // compute total earnings from paid orders with strict typescript typing
    const totalPendapatan = riwayatTransaksi.reduce((acc: number, p: any) => {
      if (p.statusTagihan === 'PAID') {
        const totalPesanan = p.detailPesanan.reduce((sum: number, d: any) => sum + d.subtotal, 0);
        return acc + totalPesanan;
      }
      return acc;
    }, 0);

    // generate new report record
    const laporanBaru = await prisma.laporan.create({
      data: {
        periode: periode || 'harian',
        totalPendapatan: totalPendapatan,
        idPegawai: idPegawai,
      }
    });

    return NextResponse.json({
      sukses: true,
      pesan: 'Report successfully generated.',
      data: laporanBaru
    });
  } catch (error) {
    return NextResponse.json(
      { sukses: false, pesan: 'Server error occurred while generating report.' },
      { status: 500 }
    );
  }
}
