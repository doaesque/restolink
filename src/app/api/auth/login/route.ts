// authentication api route for employee and owner login translated to english messages
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { idPegawai, pin, role } = body;

    // input validation
    if (!idPegawai || !pin || !role) {
      return NextResponse.json(
        { sukses: false, pesan: 'Employee/Owner ID, PIN, and Position are required.' },
        { status: 400 }
      );
    }

    // fetch employee record
    const pegawai = await prisma.pegawai.findUnique({
      where: { id: idPegawai },
    });

    if (!pegawai || pegawai.jabatan !== role) {
      return NextResponse.json(
        { sukses: false, pesan: 'Credentials or role not found.' },
        { status: 401 }
      );
    }

    // verify hashed pin
    const isPinValid = await bcrypt.compare(pin, pegawai.pin);

    if (!isPinValid) {
      return NextResponse.json(
        { sukses: false, pesan: 'Incorrect PIN entered.' },
        { status: 401 }
      );
    }

    // generate success response
    const response = NextResponse.json({
      sukses: true,
      pesan: 'Login successful.',
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
      { sukses: false, pesan: 'Server error occurred during authentication.' },
      { status: 500 }
    );
  }
}
