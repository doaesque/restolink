import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { idPegawai, pin, role } = body;

    if (!idPegawai || !pin || !role) {
      return NextResponse.json(
        { sukses: false, pesan: 'ID, PIN, dan Jabatan wajib diisi.' },
        { status: 400 }
      );
    }

    const pegawai = await prisma.pegawai.findUnique({
      where: { id: idPegawai },
    });

    if (!pegawai || pegawai.jabatan !== role) {
      return NextResponse.json(
        { sukses: false, pesan: 'Kredensial atau peran tidak ditemukan.' },
        { status: 401 }
      );
    }

    const isPinValid = await bcrypt.compare(pin, pegawai.pin);

    if (!isPinValid) {
      return NextResponse.json(
        { sukses: false, pesan: 'PIN yang dimasukkan salah.' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      sukses: true,
      pesan: 'Login berhasil.',
      data: { id: pegawai.id, namaPegawai: pegawai.namaPegawai, jabatan: pegawai.jabatan },
    });

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
      { sukses: false, pesan: 'Terjadi kesalahan server saat autentikasi.' },
      { status: 500 }
    );
  }
}
