import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

// force next.js to bypass cache and dynamically fetch the latest db data
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const pesanan = await prisma.pesanan.findMany({
      include: {
        pelanggan: true,
        meja: true,
        detailPesanan: {
          include: { menu: true }
        },
        pembayaran: true
      },
      orderBy: { tglPesanan: 'desc' }
    });
    return NextResponse.json({ sukses: true, data: pesanan });
  } catch (error) {
    return NextResponse.json({ sukses: false, pesan: 'gagal mengambil data pesanan' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { namaPelanggan, idPegawai, jumlahOrang, noMeja, items, statusTagihan, metodePembayaran } = body;

    // 1. catat atau buat data pelanggan baru
    const pelanggan = await prisma.pelanggan.create({
      data: {
        namaPelanggan: namaPelanggan || 'Guest',
      }
    });

    // hitung total harga dan pajak
    const totalSubtotal = items.reduce((sum: number, item: any) => sum + item.subtotal, 0);
    const tax = totalSubtotal * 0.1;
    const totalPajak = totalSubtotal + tax;

    // 2. buat pesanan baru
    const newPesanan = await prisma.pesanan.create({
      data: {
        jumlahOrang: jumlahOrang || 1,
        // jika langsung paid (cashless), status dapur langsung diproses
        statusPesanan: statusTagihan === 'PAID' ? 'DIPROSES' : 'MENUNGGU',
        statusTagihan: statusTagihan || 'UNPAID',
        idPelanggan: pelanggan.id,
        idPegawai: idPegawai || 'KASIR-001',
        noMeja: noMeja || 1,
        detailPesanan: {
          create: items.map((item: any) => ({
            jumlahPesanan: item.jumlahPesanan,
            subtotal: item.subtotal,
            idMenu: item.idMenu
          }))
        }
      }
    });

    // 3. jika metode bayar langsung cashless (PAID), buat record pembayaran
    if (statusTagihan === 'PAID' && metodePembayaran) {
      await prisma.pembayaran.create({
        data: {
          totalBayar: totalPajak,
          metodePembayaran: metodePembayaran,
          noNota: newPesanan.noNota,
          idPegawai: idPegawai || 'KASIR-001'
        }
      });
    }

    return NextResponse.json({ sukses: true, noNota: newPesanan.noNota });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ sukses: false, pesan: 'gagal membuat pesanan baru' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { noNota, statusPesanan, statusTagihan, metodePembayaran, idPegawai } = body;

    const updateData: any = {};
    if (statusPesanan) updateData.statusPesanan = statusPesanan;
    if (statusTagihan) updateData.statusTagihan = statusTagihan;

    // update pesanan (contohnya update dari kasir atau koki)
    const pesanan = await prisma.pesanan.update({
      where: { noNota },
      data: updateData,
      include: { detailPesanan: true }
    });

    // jika di kasir status diubah jadi PAID (bayar tunai/qris di tempat), catat ke db pembayaran
    if (statusTagihan === 'PAID' && metodePembayaran) {
      const existingPayment = await prisma.pembayaran.findUnique({ where: { noNota } });
      if (!existingPayment) {
        const totalSubtotal = pesanan.detailPesanan.reduce((sum, d) => sum + d.subtotal, 0);
        const totalBayar = totalSubtotal + (totalSubtotal * 0.1);
        await prisma.pembayaran.create({
          data: {
            totalBayar,
            metodePembayaran,
            noNota,
            idPegawai: idPegawai || 'KASIR-001'
          }
        });
      }
    }

    return NextResponse.json({ sukses: true, data: pesanan });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ sukses: false, pesan: 'gagal mengupdate pesanan' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { noNota, statusTagihan } = body;

    if (!noNota || !statusTagihan) {
      return NextResponse.json({ sukses: false, pesan: 'incomplete data payload' }, { status: 400 });
    }

    const updatedOrder = await prisma.pesanan.update({
      where: { noNota },
      data: { statusTagihan }
    });

    return NextResponse.json({ sukses: true, data: updatedOrder });
  } catch (error: any) {
    console.error('api pesanan update error:', error);
    return NextResponse.json({ sukses: false, pesan: error.message }, { status: 500 });
  }
}