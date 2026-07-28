import { RolePegawai, StatusMeja, StatusBahan } from '@prisma/client';
import prisma from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('menghapus data lama (jika ada)...');
  
  await prisma.laporan.deleteMany();
  await prisma.detailPesanan.deleteMany();
  await prisma.pembayaran.deleteMany();
  await prisma.pesanan.deleteMany();
  await prisma.bahanBaku.deleteMany();
  await prisma.menu.deleteMany();
  await prisma.meja.deleteMany();
  await prisma.pegawai.deleteMany();
  await prisma.pelanggan.deleteMany();

  console.log('memasukkan data pegawai (team bandros)...');
  
  const defaultPin = await bcrypt.hash('123456', 10);

  await prisma.pegawai.createMany({
    data: [
      { id: 'OWNER-001', pin: defaultPin, namaPegawai: 'Salsabila Khoirunnisa (Pemilik RestoLink)', jabatan: RolePegawai.PEMILIK },
      { id: 'KASIR-001', pin: defaultPin, namaPegawai: 'Serena Luthfiana (Kasir Utama)', jabatan: RolePegawai.KASIR },
      { id: 'KOKI-001', pin: defaultPin, namaPegawai: 'Daisy Maria (Head Chef)', jabatan: RolePegawai.KOKI },
      { id: 'PLYN-001', pin: defaultPin, namaPegawai: 'Najwa Nurul (Pelayan Senior)', jabatan: RolePegawai.PELAYAN },
    ],
  });

  console.log('memasukkan data meja restoran...');
  
  const mejaData = Array.from({ length: 15 }).map((_, i) => ({
    noMeja: i + 1,
    status: (i === 2 || i === 7) ? StatusMeja.OCCUPIED : StatusMeja.TERSEDIA,
  }));
  await prisma.meja.createMany({ data: mejaData });

  console.log('memasukkan data menu fancy fine dining...');
  
  await prisma.menu.createMany({
    data: [
      { namaMenu: 'A5 Wagyu Tomahawk with 24K Gold Leaf', harga: 4500000 },
      { namaMenu: 'Beluga Caviar Blini (50g)', harga: 3200000 },
      { namaMenu: 'Lobster Thermidor', harga: 1800000 },
      { namaMenu: 'Foie Gras & Black Truffle Risotto', harga: 1500000 },
      { namaMenu: 'Saffron Infused Bouillabaisse', harga: 1400000 },
      { namaMenu: 'Pan-Seared Hokkaido Scallops', harga: 1200000 },
      { namaMenu: 'White Truffle Mac & Cheese', harga: 1100000 },
      { namaMenu: 'Duck Confit with Cherry Reduction', harga: 950000 },
      { namaMenu: 'Escargot de Saint-Malo', harga: 850000 },
      { namaMenu: 'Valrhona Chocolate Soufflé', harga: 650000 },
    ],
  });

  console.log('memasukkan data inventaris bahan baku...');
  
  await prisma.bahanBaku.createMany({
    data: [
      { id: 'BB-01', namaBahan: 'A5 Japanese Wagyu', statusBahan: StatusBahan.TERSEDIA },
      { id: 'BB-02', namaBahan: 'Fresh Black Truffle', statusBahan: StatusBahan.TERSEDIA },
      { id: 'BB-03', namaBahan: 'Beluga Sturgeon Caviar', statusBahan: StatusBahan.TERSEDIA },
      { id: 'BB-04', namaBahan: 'Hokkaido Scallops', statusBahan: StatusBahan.TERSEDIA },
      { id: 'BB-05', namaBahan: 'Edible 24K Gold Leaf', statusBahan: StatusBahan.TERSEDIA },
      { id: 'BB-06', namaBahan: 'Grade A Foie Gras', statusBahan: StatusBahan.TERSEDIA },
      { id: 'BB-07', namaBahan: 'Iranian Saffron Threads', statusBahan: StatusBahan.HABIS },
    ],
  });

  console.log('seeding database selesai! 🍽️✨');
}

main()
  .catch((e) => {
    console.error('terjadi kesalahan saat seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
