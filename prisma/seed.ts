import { RolePegawai, StatusMeja } from '@prisma/client';
import prisma from '../src/lib/prisma'; // import the configured prisma client from your app

async function main() {
  console.log('menghapus data lama (jika ada)...');
  
  // cleanup existing data to prevent duplicates during multiple seeds
  await prisma.laporan.deleteMany();
  await prisma.detailPesanan.deleteMany();
  await prisma.pembayaran.deleteMany();
  await prisma.pesanan.deleteMany();
  await prisma.bahanBaku.deleteMany();
  await prisma.menu.deleteMany();
  await prisma.meja.deleteMany();
  await prisma.pegawai.deleteMany();
  await prisma.pemilik.deleteMany();
  await prisma.pelanggan.deleteMany();

  console.log('memasukkan data pemilik restoran...');

  // insert the restaurant owner
  await prisma.pemilik.create({
    data: {
      id: 'OWNER-001',
      namaPemilik: 'Bapak Resto (Owner RestoLink)',
    },
  });

  console.log('memasukkan data pegawai (team bandros)...');
  
  // insert employees using the project team members
  // these ids will be used for the login page!
  await prisma.pegawai.createMany({
    data: [
      { id: 'KASIR-001', namaPegawai: 'Serena Luthfiana (Kasir Utama)', jabatan: RolePegawai.KASIR },
      { id: 'KOKI-001', namaPegawai: 'Daisy Maria (Head Chef)', jabatan: RolePegawai.KOKI },
      { id: 'PLYN-001', namaPegawai: 'Najwa Nurul (Pelayan Senior)', jabatan: RolePegawai.PELAYAN },
      { id: 'PLYN-002', namaPegawai: 'Salsabila Khoirunnisa (Pelayan Area)', jabatan: RolePegawai.PELAYAN },
    ],
  });

  console.log('memasukkan data meja restoran...');
  
  // create 15 tables, setting two of them to occupied just for testing ui
  const mejaData = Array.from({ length: 15 }).map((_, i) => ({
    noMeja: i + 1,
    status: (i === 2 || i === 7) ? StatusMeja.OCCUPIED : StatusMeja.TERSEDIA,
  }));
  await prisma.meja.createMany({ data: mejaData });

  console.log('memasukkan data menu fancy fine dining...');
  
  // insert absurdly overpriced fine dining menu for ui testing
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
  
  // insert luxury raw materials
  await prisma.bahanBaku.createMany({
    data: [
      { id: 'BB-01', namaBahan: 'A5 Japanese Wagyu', statusBahan: 'tersedia' },
      { id: 'BB-02', namaBahan: 'Fresh Black Truffle', statusBahan: 'tersedia' },
      { id: 'BB-03', namaBahan: 'Beluga Sturgeon Caviar', statusBahan: 'tersedia' },
      { id: 'BB-04', namaBahan: 'Hokkaido Scallops', statusBahan: 'tersedia' },
      { id: 'BB-05', namaBahan: 'Edible 24K Gold Leaf', statusBahan: 'tersedia' },
      { id: 'BB-06', namaBahan: 'Grade A Foie Gras', statusBahan: 'tersedia' },
      { id: 'BB-07', namaBahan: 'Iranian Saffron Threads', statusBahan: 'habis' },
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
    // disconnect prisma client
    await prisma.$disconnect();
  });
