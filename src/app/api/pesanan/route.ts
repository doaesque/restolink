// api route for handling active orders
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// force next.js to bypass cache and dynamically fetch the latest db data
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const pesanan = await prisma.pesanan.findMany({
      include: {
        pelanggan: true,
        meja: true,
        detailPesanan: {
          include: {
            menu: {
              // memanggil relasi komposisi agar frontend koki tau bahan baku aslinya
              include: {
                komposisi: {
                  include: { bahanBaku: true }
                }
              }
            }
          }
        },
        pembayaran: true
      },
      orderBy: { tglPesanan: 'desc' }
    });
    return NextResponse.json({ sukses: true, data: pesanan });
  } catch (error) {
    return NextResponse.json(
      { sukses: false, pesan: 'Failed to fetch order data.' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { namaPelanggan, idPegawai, jumlahOrang, noMeja, items, statusTagihan, metodePembayaran } = body;

    // validate pegawai id or fallback to existing pegawai in db to prevent foreign key failure
    let assignedPegawaiId = idPegawai;
    if (assignedPegawaiId) {
      const existingPegawai = await prisma.pegawai.findUnique({
        where: { id: assignedPegawaiId }
      });
      if (!existingPegawai) {
        assignedPegawaiId = null;
      }
    }

    if (!assignedPegawaiId) {
      const firstPegawai = await prisma.pegawai.findFirst();
      assignedPegawaiId = firstPegawai ? firstPegawai.id : 'KASIR-001';
    }

    // 1. record or create new customer data
    const pelanggan = await prisma.pelanggan.create({
      data: {
        namaPelanggan: namaPelanggan || 'Guest',
      }
    });

    // calculate total price and tax
    const totalSubtotal = (items || []).reduce((sum: number, item: any) => sum + (item.subtotal || 0), 0);
    const tax = totalSubtotal * 0.1;
    const totalPajak = totalSubtotal + tax;

    const parsedNoMeja = parseInt(noMeja) || 1;

    // 2. create new order record (removed catatan mapped item to match prisma schema)
    const newPesanan = await prisma.pesanan.create({
      data: {
        jumlahOrang: parseInt(jumlahOrang) || 1,
        // if immediately paid (cashless), kitchen status goes to processing directly
        statusPesanan: statusTagihan === 'PAID' ? 'DIPROSES' : 'MENUNGGU',
        statusTagihan: statusTagihan || 'UNPAID',
        idPelanggan: pelanggan.id,
        idPegawai: assignedPegawaiId,
        noMeja: parsedNoMeja,
        detailPesanan: {
          create: (items || []).map((item: any) => ({
            jumlahPesanan: parseInt(item.jumlahPesanan) || 1,
            subtotal: parseFloat(item.subtotal) || 0,
            idMenu: item.idMenu
          }))
        }
      }
    });

    // 3. update table status to occupied (terisi) since an order is placed
    try {
      await prisma.meja.update({
        where: { noMeja: parsedNoMeja },
        data: { status: 'TERISI' }
      });
    } catch (e) {
      console.warn('table status update bypassed:', e);
    }

    // 4. if payment method is direct cashless (paid), generate payment record
    if (statusTagihan === 'PAID' && metodePembayaran) {
      // map generic payment methods to database-friendly enum values
      const mappedMetode = metodePembayaran === 'CASHLESS' ? 'QRIS' : (metodePembayaran === 'CASH' ? 'TUNAI' : metodePembayaran);
      await prisma.pembayaran.create({
        data: {
          totalBayar: totalPajak,
          metodePembayaran: mappedMetode,
          noNota: newPesanan.noNota,
          idPegawai: assignedPegawaiId
        }
      });
    }

    return NextResponse.json({ sukses: true, noNota: newPesanan.noNota });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { sukses: false, pesan: 'Failed to create new order.' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { noNota, statusPesanan, statusTagihan, metodePembayaran, idPegawai } = body;

    const updateData: any = {};
    if (statusPesanan) updateData.statusPesanan = statusPesanan;
    if (statusTagihan) updateData.statusTagihan = statusTagihan;

    // update order status (e.g., from cashier or kitchen dashboard)
    const pesanan = await prisma.pesanan.update({
      where: { noNota },
      data: updateData,
      include: { detailPesanan: true }
    });

    // if order is marked as done, check and release table if no other active orders exist
    if (statusTagihan === 'DONE') {
      try {
        const activeOrdersCount = await prisma.pesanan.count({
          where: {
            noMeja: pesanan.noMeja,
            statusTagihan: { not: 'DONE' }
          }
        });
        if (activeOrdersCount === 0) {
          await prisma.meja.update({
            where: { noMeja: pesanan.noMeja },
            data: { status: 'TERSEDIA' }
          });
        }
      } catch (e) {
        console.warn('table release update bypassed:', e);
      }
    }

    // if status changed to paid at cashier, record it into payment db
    if (statusTagihan === 'PAID' && metodePembayaran) {
      const existingPayment = await prisma.pembayaran.findUnique({ where: { noNota } });
      if (!existingPayment) {
        const totalSubtotal = pesanan.detailPesanan.reduce((sum: number, d: any) => sum + d.subtotal, 0);
        const totalBayar = totalSubtotal + (totalSubtotal * 0.1);
        const mappedMetode = metodePembayaran === 'CASHLESS' ? 'QRIS' : (metodePembayaran === 'CASH' ? 'TUNAI' : metodePembayaran);
        await prisma.pembayaran.create({
          data: {
            totalBayar,
            metodePembayaran: mappedMetode,
            noNota,
            idPegawai: idPegawai || 'KASIR-001'
          }
        });
      }
    }

    return NextResponse.json({ sukses: true, data: pesanan });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { sukses: false, pesan: 'Failed to update order.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { noNota, statusTagihan, statusPesanan } = body;

    const updateData: any = {};
    if (statusTagihan) updateData.statusTagihan = statusTagihan;
    if (statusPesanan) updateData.statusPesanan = statusPesanan;

    if (!noNota || Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { sukses: false, pesan: 'Incomplete data payload.' },
        { status: 400 }
      );
    }

    const updatedOrder = await prisma.pesanan.update({
      where: { noNota },
      data: updateData
    });

    // if order is marked as done, check and release table if no other active orders exist
    if (statusTagihan === 'DONE') {
      try {
        const activeOrdersCount = await prisma.pesanan.count({
          where: {
            noMeja: updatedOrder.noMeja,
            statusTagihan: { not: 'DONE' }
          }
        });
        if (activeOrdersCount === 0) {
          await prisma.meja.update({
            where: { noMeja: updatedOrder.noMeja },
            data: { status: 'TERSEDIA' }
          });
        }
      } catch (e) {
        console.warn('table release update bypassed:', e);
      }
    }

    return NextResponse.json({ sukses: true, data: updatedOrder });
  } catch (error: any) {
    console.error('api pesanan update error:', error);
    return NextResponse.json(
      { sukses: false, pesan: error.message },
      { status: 500 }
    );
  }
}
