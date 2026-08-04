// prisma/seed.ts
import { RolePegawai, StatusMeja, StatusBahan } from '@prisma/client';
import prisma from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('removing old data (if any)...');
  
  await prisma.laporan.deleteMany();
  await prisma.detailPesanan.deleteMany();
  await prisma.pembayaran.deleteMany();
  await prisma.pesanan.deleteMany();
  await prisma.bahanBaku.deleteMany();
  await prisma.menu.deleteMany();
  await prisma.meja.deleteMany();
  await prisma.pegawai.deleteMany();
  await prisma.pelanggan.deleteMany();

  console.log('inserting employee data (team bandros)...');
  
  const defaultPin = await bcrypt.hash('123456', 10);

  await prisma.pegawai.createMany({
    data: [
      { id: 'OWNER-001', pin: defaultPin, namaPegawai: 'Salsabila Khoirunnisa (Owner)', jabatan: RolePegawai.PEMILIK },
      { id: 'KASIR-001', pin: defaultPin, namaPegawai: 'Serena Luthfiana (Cashier)', jabatan: RolePegawai.KASIR },
      { id: 'KOKI-001', pin: defaultPin, namaPegawai: 'Daisy Maria (Head Chef)', jabatan: RolePegawai.KOKI },
      { id: 'PLYN-001', pin: defaultPin, namaPegawai: 'Najwa Nurul (Senior Waiter)', jabatan: RolePegawai.PELAYAN },
    ],
  });

  console.log('inserting restaurant table data...');
  
  const mejaData = Array.from({ length: 15 }).map((_, i) => ({
    noMeja: i + 1,
    status: (i === 2 || i === 7) ? StatusMeja.OCCUPIED : StatusMeja.TERSEDIA,
  }));
  await prisma.meja.createMany({ data: mejaData });

  console.log('inserting mockup menu data...');
  
  await prisma.menu.createMany({
    data: [
      { namaMenu: 'WAGYU A5 FILLET MIGNON WITH TRUFFLE SHAVINGS', harga: 2000000 },
      { namaMenu: '45-DAY DRY-AGED T-BONE STEAK', harga: 2800000 },
      { namaMenu: '24K GOLD LEAF TOMAHAWK RIBEYE', harga: 5000000 },
      { namaMenu: 'ARTESIAN CRYSTAL WATER', harga: 120000 },
      { namaMenu: 'TRUFFLE-INFUSED SMOKY OLD FASHIONED', harga: 300000 },
      { namaMenu: '24K GOLD DUST ESPRESSO MARTINI', harga: 450000 },
    ],
  });

  console.log('inserting raw material inventory data...');
  
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

  console.log('database seeding completed! 🍽️✨');
}

main()
  .catch((e) => {
    console.error('error occurred during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
  