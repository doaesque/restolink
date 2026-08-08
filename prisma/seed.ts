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
      { id: 'KASIR-001', pin: defaultPin, namaPegawai: 'Serena Luthfiana (Kasir Utama)', jabatan: 'KASIR' },
      { id: 'KOKI-001', pin: defaultPin, namaPegawai: 'Daisy Maria (Head Chef)', jabatan: 'KOKI' },
      { id: 'PLYN-001', pin: defaultPin, namaPegawai: 'Najwa Nurul (Pelayan Senior)', jabatan: 'PELAYAN' },
    ],
  });

  console.log('inserting restaurant table data...');
  
  const mejaData = Array.from({ length: 15 }).map((_, i) => ({
    noMeja: i + 1,
    status: (i === 2 || i === 7) ? 'OCCUPIED' : 'TERSEDIA',
  }));
  await prisma.meja.createMany({ data: mejaData });

  console.log('inserting expanded fancy fine dining menu data with categories...');
  
  await prisma.menu.createMany({
    data: [
      // food items - daging
      { namaMenu: 'WAGYU A5 FILLET MIGNON WITH TRUFFLE SHAVINGS', kategori: 'FOOD', subKategori: 'Daging', harga: 2000000, image: '/makanan_wagyu.png' },
      { namaMenu: '45-DAY DRY-AGED T-BONE STEAK', kategori: 'FOOD', subKategori: 'Daging', harga: 2800000, image: '/makanan_steak.png' },
      { namaMenu: '24K GOLD LEAF TOMAHAWK RIBEYE', kategori: 'FOOD', subKategori: 'Daging', harga: 5000000, image: '/makanan_ribeye.png' },
      
      // food items - seafood
      { namaMenu: 'PAN-SEARED HOKKAIDO SCALLOPS WITH CAVIAR', kategori: 'FOOD', subKategori: 'Seafood', harga: 1500000, image: null },
      { namaMenu: 'GRILLED BLACK COD WITH MISO GLAZE', kategori: 'FOOD', subKategori: 'Seafood', harga: 1800000, image: null },
      { namaMenu: 'LOBSTER THERMIDOR WITH SAFFRON BUTTER', kategori: 'FOOD', subKategori: 'Seafood', harga: 3200000, image: null },
      
      // food items - pasta/mie
      { namaMenu: 'TRUFFLE RISOTTO WITH PARMESAN CRISP', kategori: 'FOOD', subKategori: 'Pasta', harga: 850000, image: null },

      // drink items - other
      { namaMenu: 'ARTESIAN CRYSTAL WATER', kategori: 'DRINKS', subKategori: 'Other', harga: 120000, image: '/minuman_crystal_water.png' },
      { namaMenu: 'TRUFFLE-INFUSED SMOKY OLD FASHIONED', kategori: 'DRINKS', subKategori: 'Other', harga: 300000, image: '/minuman_bourbon.png' },
      { namaMenu: 'VINTAGE DOM PÉRIGNON CHAMPAGNE', kategori: 'DRINKS', subKategori: 'Other', harga: 7500000, image: null },

      // drink items - coffee
      { namaMenu: '24K GOLD DUST ESPRESSO MARTINI', kategori: 'DRINKS', subKategori: 'Coffee', harga: 450000, image: '/minuman_martini.png' },
      { namaMenu: 'BLUE MOUNTAIN HAND-POURED COFFEE', kategori: 'DRINKS', subKategori: 'Coffee', harga: 250000, image: null },
      
      // drink items - tea
      { namaMenu: 'EARL GREY IMPERIAL TEA', kategori: 'DRINKS', subKategori: 'Tea', harga: 180000, image: null },
    ],
  });

  console.log('inserting raw material inventory data...');
  
  await prisma.bahanBaku.createMany({
    data: [
      { id: 'BB-01', namaBahan: 'A5 Japanese Wagyu', statusBahan: 'TERSEDIA' },
      { id: 'BB-02', namaBahan: 'Fresh Black Truffle', statusBahan: 'TERSEDIA' },
      { id: 'BB-03', namaBahan: 'Beluga Sturgeon Caviar', statusBahan: 'TERSEDIA' },
      { id: 'BB-04', namaBahan: 'Hokkaido Scallops', statusBahan: 'TERSEDIA' },
      { id: 'BB-05', namaBahan: 'Edible 24K Gold Leaf', statusBahan: 'TERSEDIA' },
      { id: 'BB-06', namaBahan: 'Grade A Foie Gras', statusBahan: 'TERSEDIA' },
      { id: 'BB-07', namaBahan: 'Iranian Saffron Threads', statusBahan: 'HABIS' },
    ],
  });

  console.log('inserting dummy orders...');
  
  // fetching back some menus to create relational order data
  const allMenus = await prisma.menu.findMany();
  
  if (allMenus.length >= 2) {
    const menu1 = allMenus[0];
    const menu2 = allMenus[1];

    // dummy order 1: completed and paid (cashless)
    const subtotal1 = (menu1.harga * 2) + (menu2.harga * 1);
    const tax1 = subtotal1 * 0.1;
    const total1 = subtotal1 + tax1;

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
    const menu3 = allMenus[allMenus.length - 1]; // pick a drink
    await prisma.pesanan.create({
      data: {
        jumlahOrang: 4,
        noMeja: 8,
        idPelanggan: 'CUST-001', // using the new customer here
        statusPesanan: 'MENUNGGU',
        statusTagihan: 'UNPAID',
        detailPesanan: {
          create: [
            { idMenu: menu1.id, jumlahPesanan: 4, subtotal: menu1.harga * 4 },
            { idMenu: menu3.id, jumlahPesanan: 4, subtotal: menu3.harga * 4 }
          ]
        }
      }
    });
  }

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
