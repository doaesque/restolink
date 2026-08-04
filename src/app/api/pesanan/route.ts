// api route for managing orders with english response messages
import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';

// handle get request to fetch all active orders
export async function GET() {
  try {
    const pesanan = await prisma.pesanan.findMany({
      include: {
        pelanggan: true,
        meja: true,
        detailPesanan: {
          include: {
            menu: true,
          },
        },
      },
      orderBy: {
        tglPesanan: 'desc',
      },
    });
    return NextResponse.json({ sukses: true, data: pesanan });
  } catch (error) {
    return NextResponse.json(
      { sukses: false, pesan: 'Failed to fetch order data.' },
      { status: 500 }
    );
  }
}

// handle post request to create a new order with multi-table support
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { namaPelanggan, jumlahOrang, noMeja, detailPesanan } = body;

    // input validation
    const daftarMeja = Array.isArray(noMeja) ? noMeja : [noMeja];

    if (!namaPelanggan || !jumlahOrang || daftarMeja.length === 0 || !detailPesanan || detailPesanan.length === 0) {
      return NextResponse.json(
        { sukses: false, pesan: 'Incomplete order data.' },
        { status: 400 }
      );
    }

    // create customer, order, order details, and update all selected tables in a transaction
    const pesananBaru = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const pelanggan = await tx.pelanggan.create({
        data: {
          namaPelanggan,
        },
      });

      const primaryMeja = parseInt(daftarMeja[0].toString());

      const pesanan = await tx.pesanan.create({
        data: {
          jumlahOrang: parseInt(jumlahOrang.toString()),
          idPelanggan: pelanggan.id,
          noMeja: primaryMeja,
          detailPesanan: {
            create: detailPesanan.map((item: { idMenu: string; jumlahPesanan: number; subtotal: number }) => ({
              idMenu: item.idMenu,
              jumlahPesanan: parseInt(item.jumlahPesanan.toString()),
              subtotal: parseFloat(item.subtotal.toString()),
            })),
          },
        },
        include: {
          detailPesanan: true,
        },
      });

      for (const m of daftarMeja) {
        await tx.meja.update({
          where: { noMeja: parseInt(m.toString()) },
          data: { status: 'OCCUPIED' },
        });
      }

      return pesanan;
    });

    return NextResponse.json({ sukses: true, data: pesananBaru }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { sukses: false, pesan: 'Failed to create new order. Ensure table numbers are valid and unoccupied.' },
      { status: 500 }
    );
  }
}

// handle patch request to update order cooking status (used by chefs)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { noNota, statusPesanan } = body;

    if (!noNota || !statusPesanan) {
      return NextResponse.json(
        { sukses: false, pesan: 'Receipt ID and order status are required.' },
        { status: 400 }
      );
    }

    const updatedPesanan = await prisma.pesanan.update({
      where: { noNota },
      data: { statusPesanan },
    });

    return NextResponse.json({ sukses: true, data: updatedPesanan });
  } catch (error) {
    return NextResponse.json(
      { sukses: false, pesan: 'Failed to update order status.' },
      { status: 500 }
    );
  }
}
