// database seeder with composition mapping
import prisma from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('removing old data (if any)...');

  await prisma.komposisi.deleteMany();
  await prisma.laporan.deleteMany();
  await prisma.detailPesanan.deleteMany();
  await prisma.pembayaran.deleteMany();
  await prisma.pesanan.deleteMany();
  await prisma.bahanBaku.deleteMany();
  await prisma.menu.deleteMany();
  await prisma.meja.deleteMany();
  await prisma.pegawai.deleteMany();
  await prisma.pelanggan.deleteMany();

  console.log('inserting customer data...');
  // creating a generic guest customer for walk-in orders
  await prisma.pelanggan.createMany({
    data: [
      { id: 'Guest', namaPelanggan: 'Walk-in Guest' },
      { id: 'CUST-001', namaPelanggan: 'Budi Santoso' } // added new customer for testing
    ]
  });

  console.log('inserting employee data (team bandros)...');

  const defaultPin = await bcrypt.hash('123456', 10);

  await prisma.pegawai.createMany({
    data: [
      { id: 'OWNER-001', pin: defaultPin, namaPegawai: 'Salsabila Khoirunnisa (Pemilik RestoLink)', jabatan: 'PEMILIK' },
      { id: 'KASIR-001', pin: defaultPin, namaPegawai: 'Najwa Nurul Aziz', jabatan: 'KASIR' },
      { id: 'KOKI-001', pin: defaultPin, namaPegawai: 'Daisy Maria M Atok', jabatan: 'KOKI' },
      { id: 'PLAYN-001', pin: defaultPin, namaPegawai: 'Serena Luthfiana W', jabatan: 'PELAYAN' }
    ]
  });

  console.log('inserting table data...');
  const mejaData = Array.from({ length: 12 }, (_, i) => ({
    noMeja: i + 1,
    status: 'TERSEDIA'
  }));
  await prisma.meja.createMany({ data: mejaData });

  console.log('inserting raw material data (bahan baku)...');
  // named identically to menu keywords so frontend string matching works perfectly
  await prisma.bahanBaku.createMany({
    data: [
      { id: 'BB-001', namaBahan: 'Steak', statusBahan: 'TERSEDIA', idPegawai: 'OWNER-001' },
      { id: 'BB-002', namaBahan: 'Ayam', statusBahan: 'TERSEDIA', idPegawai: 'OWNER-001' },
      { id: 'BB-003', namaBahan: 'Nasi', statusBahan: 'TERSEDIA', idPegawai: 'OWNER-001' },
      { id: 'BB-004', namaBahan: 'Kopi', statusBahan: 'TERSEDIA', idPegawai: 'OWNER-001' },
      { id: 'BB-005', namaBahan: 'Teh', statusBahan: 'TERSEDIA', idPegawai: 'OWNER-001' },
      { id: 'BB-006', namaBahan: 'Mineral', statusBahan: 'TERSEDIA', idPegawai: 'OWNER-001' },
    ]
  });

  console.log('inserting menu data...');
  const menus = [
    { id: 'MN-001', namaMenu: 'Steak Ribeye', kategori: 'food', subKategori: 'daging', harga: 150000, image: '/makanan_ribeye.png' },
    { id: 'MN-002', namaMenu: 'Steak Wagyu', kategori: 'food', subKategori: 'daging', harga: 250000, image: '/makanan_wagyu.png' },
    { id: 'MN-003', namaMenu: 'Ayam Bakar', kategori: 'food', subKategori: 'ayam', harga: 45000, image: '/makanan_steak.png' },
    { id: 'MN-004', namaMenu: 'Nasi Goreng', kategori: 'food', subKategori: 'nasi', harga: 35000, image: '/makanan_steak.png' },
    { id: 'MN-005', namaMenu: 'Kopi Susu', kategori: 'drinks', subKategori: 'coffee', harga: 25000, image: '/minuman_bourbon.png' },
    { id: 'MN-006', namaMenu: 'Es Teh Manis', kategori: 'drinks', subKategori: 'tea', harga: 15000, image: '/minuman_martini.png' },
    { id: 'MN-007', namaMenu: 'Air Mineral', kategori: 'drinks', subKategori: 'water', harga: 10000, image: '/minuman_crystal_water.png' },
  ];

  await prisma.menu.createMany({ data: menus });

  console.log('inserting composition data (komposisi)...');
  await prisma.komposisi.createMany({
    data: [
      { idMenu: 'MN-001', idBahanBaku: 'BB-001' },
      { idMenu: 'MN-002', idBahanBaku: 'BB-001' },
      { idMenu: 'MN-003', idBahanBaku: 'BB-002' },
      { idMenu: 'MN-004', idBahanBaku: 'BB-003' },
      { idMenu: 'MN-005', idBahanBaku: 'BB-004' },
      { idMenu: 'MN-006', idBahanBaku: 'BB-005' },
      { idMenu: 'MN-007', idBahanBaku: 'BB-006' },
    ]
  });

  console.log('inserting dummy order data...');

  // dummy order 1: completed and paid
  const menu1 = menus[0];
  const menu2 = menus[4];
  const total1 = (menu1.harga * 2) + (menu2.harga * 1);

  await prisma.pesanan.create({
    data: {
      jumlahOrang: 2,
      noMeja: 3,
      idPelanggan: 'Guest',
      idPegawai: 'KASIR-001',
      statusPesanan: 'SELESAI',
      statusTagihan: 'PAID',
      detailPesanan: {
        create: [
          { idMenu: menu1.id, jumlahPesanan: 2, subtotal: menu1.harga * 2 },
          { idMenu: menu2.id, jumlahPesanan: 1, subtotal: menu2.harga * 1 }
        ]
      },
      pembayaran: {
        create: {
          totalBayar: total1,
          metodePembayaran: 'CASHLESS',
          idPegawai: 'KASIR-001'
        }
      }
    }
  });

  // dummy order 2: waiting to be cooked, currently unpaid
  const menu3 = menus[1];
  const menu4 = menus[5];
  await prisma.pesanan.create({
    data: {
      jumlahOrang: 4,
      noMeja: 8,
      idPelanggan: 'CUST-001',
      idPegawai: 'KASIR-001', // fix: missing idPegawai field error resolved
      statusPesanan: 'MENUNGGU',
      statusTagihan: 'UNPAID',
      detailPesanan: {
        create: [
          { idMenu: menu3.id, jumlahPesanan: 1, subtotal: menu3.harga * 1 },
          { idMenu: menu4.id, jumlahPesanan: 4, subtotal: menu4.harga * 4 }
        ]
      }
    }
  });

  console.log('database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
