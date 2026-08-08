// api route for employee login authentication
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // support both username and idPegawai keys for backward compatibility
    const idPegawai = (body.idPegawai || body.username || '').toUpperCase();
    const pin = body.pin;

    if (!idPegawai || !pin) {
      return NextResponse.json(
        { sukses: false, pesan: 'Employee ID and PIN are required.' },
        { status: 400 }
      );
    }

    const pegawai = await prisma.pegawai.findUnique({
      where: { id: idPegawai }
    });

    if (!pegawai) {
      return NextResponse.json(
        { sukses: false, pesan: 'Invalid Employee ID or PIN.' },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(pin, pegawai.pin);

    if (!isMatch) {
      return NextResponse.json(
        { sukses: false, pesan: 'Invalid Employee ID or PIN.' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      sukses: true,
      data: {
        id: pegawai.id,
        namaPegawai: pegawai.namaPegawai,
        jabatan: pegawai.jabatan
      }
    });
  } catch (error) {
    console.error('login error:', error);
    return NextResponse.json(
      { sukses: false, pesan: 'Internal server error during authentication.' },
      { status: 500 }
    );
  }
}
