// api route for managing orders with english response messages
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// handle get request to fetch all active orders
export async function GET() {
  try {
    const pesanan = await prisma.pesanan.findMany({
      include: {
        pelanggan: true,
        detailPesanan: {
          include: {
            menu: true
          }
        }
      },
      orderBy: {
        tglPesanan: 'desc'
      }
    });
    
    return NextResponse.json({ sukses: true, data: pesanan });
  } catch (error) {
    return NextResponse.json(
      { sukses: false, pesan: 'failed to fetch orders.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { idPelanggan, idPegawai, noMeja, jumlahOrang, items } = body;

    if (!idPelanggan || !noMeja || !jumlahOrang || !items || items.length === 0) {
      return NextResponse.json(
        { sukses: false, pesan: 'incomplete order data provided.' },
        { status: 400 }
      );
    }

    // execute transaction using 'any' to bypass strict prisma client typing issues on vercel
    const newOrder = await prisma.$transaction(async (tx: any) => {
      // create the main order record
      const pesanan = await tx.pesanan.create({
        data: {
          idPelanggan,
          idPegawai,
          noMeja,
          jumlahOrang,
          statusPesanan: 'MENUNGGU',
          statusTagihan: 'UNPAID'
        }
      });

      // iterate through items to calculate subtotals and create order details
      for (const item of items) {
        const menu = await tx.menu.findUnique({ where: { id: item.idMenu } });
        
        if (menu) {
          await tx.detailPesanan.create({
            data: {
              noNota: pesanan.noNota,
              idMenu: item.idMenu,
              jumlahPesanan: item.jumlahPesanan,
              subtotal: menu.harga * item.jumlahPesanan
            }
          });
        }
      }

      // update table status to occupied
      await tx.meja.update({
        where: { noMeja },
        data: { status: 'OCCUPIED' }
      });

      return pesanan;
    });

    return NextResponse.json({
      sukses: true,
      pesan: 'order successfully created.',
      data: newOrder
    });
  } catch (error) {
    return NextResponse.json(
      { sukses: false, pesan: 'failed to create order.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { noNota, statusPesanan } = body;

    if (!noNota || !statusPesanan) {
      return NextResponse.json(
        { sukses: false, pesan: 'order id and status are required.' },
        { status: 400 }
      );
    }

    // update the kitchen preparation status of the order
    const updatedOrder = await prisma.pesanan.update({
      where: { noNota },
      data: { statusPesanan }
    });

    return NextResponse.json({
      sukses: true,
      pesan: 'order status updated successfully.',
      data: updatedOrder
    });
  } catch (error) {
    return NextResponse.json(
      { sukses: false, pesan: 'failed to update order status.' },
      { status: 500 }
    );
  }
}
