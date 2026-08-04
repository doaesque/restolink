// api route for managing tables
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// handle get request to fetch all tables and their status
export async function GET() {
  try {
    const meja = await prisma.meja.findMany({
      orderBy: {
        noMeja: 'asc',
      },
    });
    return NextResponse.json({ sukses: true, data: meja });
  } catch (error) {
    return NextResponse.json(
      { sukses: false, pesan: 'Failed to fetch table data.' },
      { status: 500 }
    );
  }
}

// handle post request to initialize a new table
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { noMeja } = body;

    // validate input
    if (!noMeja) {
      return NextResponse.json(
        { sukses: false, pesan: 'Table number is required.' },
        { status: 400 }
      );
    }

    const mejaBaru = await prisma.meja.create({
      data: {
        noMeja: parseInt(noMeja),
      },
    });

    return NextResponse.json({ sukses: true, data: mejaBaru }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { sukses: false, pesan: 'Failed to add new table. The table number might already be registered.' },
      { status: 500 }
    );
  }
}
