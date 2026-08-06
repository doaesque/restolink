// authentication api route using pin for login
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, pin } = body;

    // input validation
    if (!username || !pin) {
      return NextResponse.json(
        { sukses: false, pesan: 'username and pin are required.' },
        { status: 400 }
      );
    }

    // fetch employee record using username (mapped to id in database)
    const pegawai = await prisma.pegawai.findUnique({
      where: { id: username },
    });

    if (!pegawai) {
      return NextResponse.json(
        { sukses: false, pesan: 'employee not found.' },
        { status: 401 }
      );
    }

    // verify hashed pin
    const isPinValid = await bcrypt.compare(pin, pegawai.pin);

    if (!isPinValid) {
      return NextResponse.json(
        { sukses: false, pesan: 'incorrect pin.' },
        { status: 401 }
      );
    }

    // generate success response
    const response = NextResponse.json({
      sukses: true,
      pesan: 'login successful.',
      data: { id: pegawai.id, namaPegawai: pegawai.namaPegawai, jabatan: pegawai.jabatan },
    });

    // set secure http-only session cookie
    response.cookies.set('employee_session', JSON.stringify({ id: pegawai.id, role: pegawai.jabatan }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 12,
      path: '/',
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { sukses: false, pesan: 'server error occurred during authentication.' },
      { status: 500 }
    );
  }
}
