// authentication api route for employee login
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { idPegawai, role } = body;

    if (!idPegawai || !role) {
      return NextResponse.json(
        { sukses: false, pesan: 'ID Pegawai dan Jabatan wajib diisi.' },
        { status: 400 }
      );
    }

    // verify employee existence in database
    const pegawai = await prisma.pegawai.findUnique({
      where: { id: idPegawai },
    });

    if (!pegawai) {
      return NextResponse.json(
        { sukses: false, pesan: 'ID Pegawai tidak ditemukan dalam sistem.' },
        { status: 404 }
      );
    }

    if (pegawai.jabatan !== role) {
      return NextResponse.json(
        { sukses: false, pesan: 'Jabatan pegawai tidak sesuai dengan akses yang dipilih.' },
        { status: 403 }
      );
    }

    // set http-only session cookie
    const response = NextResponse.json({
      sukses: true,
      pesan: 'Login berhasil.',
      data: pegawai,
    });

    response.cookies.set('employee_session', JSON.stringify({ id: pegawai.id, role: pegawai.jabatan }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 12, // 12 hours session
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
