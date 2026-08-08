import prisma from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('removing old data (if any)...');

  // delete data starting from child relations to avoid foreign key constraints
  await prisma.laporan.deleteMany();
  await prisma.detailPesanan.deleteMany();
  await prisma.pembayaran.deleteMany();
  await prisma.komposisi.deleteMany();
  await prisma.pesanan.deleteMany();
  await prisma.bahanBaku.deleteMany();
  await prisma.menu.deleteMany();
  await prisma.meja.deleteMany();
  await prisma.pegawai.deleteMany();
  await prisma.pelanggan.deleteMany();

  console.log('inserting customer data...');
  await prisma.pelanggan.createMany({
    data: [
      { id: 'Guest', namaPelanggan: 'Walk-in Guest' },
      { id: 'CUST-001', namaPelanggan: 'Budi Santoso' },
      { id: 'CUST-002', namaPelanggan: 'Jonathan Lie' },
      { id: 'CUST-003', namaPelanggan: 'Amanda Widjaja' },
      { id: 'CUST-004', namaPelanggan: 'Kevin Sanjaya' }
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
    status: (i === 2 || i === 4 || i === 7 || i === 11) ? 'OCCUPIED' : 'TERSEDIA',
  }));
  await prisma.meja.createMany({ data: mejaData });

  console.log('inserting expanded fancy fine dining menu data with varied subcategories...');
  await prisma.menu.createMany({
    data: [
      // food items - daging
      { namaMenu: 'WAGYU A5 FILLET MIGNON WITH TRUFFLE SHAVINGS', kategori: 'FOOD', subKategori: 'Daging', harga: 2000000, image: '/makanan_wagyu.png' },
      { namaMenu: '45-DAY DRY-AGED T-BONE STEAK', kategori: 'FOOD', subKategori: 'Daging', harga: 2800000, image: '/makanan_steak.png' },
      { namaMenu: '24K GOLD LEAF TOMAHAWK RIBEYE', kategori: 'FOOD', subKategori: 'Daging', harga: 5000000, image: '/makanan_ribeye.png' },
      { namaMenu: 'HERB-CRUSTED NEW ZEALAND LAMB RACK', kategori: 'FOOD', subKategori: 'Daging', harga: 1200000, image: null },
      { namaMenu: 'PAN-ROASTED DUCK BREAST WITH CHERRY GLAZE', kategori: 'FOOD', subKategori: 'Daging', harga: 950000, image: null },

      // food items - seafood
      { namaMenu: 'LOBSTER THERMIDOR WITH SAFFRON BUTTER', kategori: 'FOOD', subKategori: 'Seafood', harga: 3200000, image: null },
      { namaMenu: 'PAN-SEARED HOKKAIDO SCALLOPS WITH CAVIAR', kategori: 'FOOD', subKategori: 'Seafood', harga: 1500000, image: null },
      { namaMenu: 'GRILLED BLACK COD WITH MISO GLAZE', kategori: 'FOOD', subKategori: 'Seafood', harga: 1800000, image: null },
      { namaMenu: 'BUTTER-POACHED ALASKAN KING CRAB LEGS', kategori: 'FOOD', subKategori: 'Seafood', harga: 2500000, image: null },

      // food items - pasta
      { namaMenu: 'TRUFFLE RISOTTO WITH PARMESAN CRISP', kategori: 'FOOD', subKategori: 'Pasta', harga: 850000, image: null },
      { namaMenu: 'LOBSTER LINGUINE WITH UNI BUTTER', kategori: 'FOOD', subKategori: 'Pasta', harga: 1100000, image: null },
      { namaMenu: 'HAND-ROLLED GNOCCHI WITH WHITE TRUFFLE', kategori: 'FOOD', subKategori: 'Pasta', harga: 900000, image: null },

      // food items - dessert
      { namaMenu: 'MADAGASCAR VANILLA CRÈME BRÛLÉE', kategori: 'FOOD', subKategori: 'Dessert', harga: 250000, image: null },
      { namaMenu: '24K GOLD LEAF CHOCOLATE SPHERE', kategori: 'FOOD', subKategori: 'Dessert', harga: 450000, image: null },
      { namaMenu: 'CLASSIC ITALIAN TIRAMISU WITH KAHLUA', kategori: 'FOOD', subKategori: 'Dessert', harga: 300000, image: null },

      // drink items - coffee
      { namaMenu: '24K GOLD DUST ESPRESSO MARTINI', kategori: 'DRINKS', subKategori: 'Coffee', harga: 450000, image: '/minuman_martini.png' },
      { namaMenu: 'BLUE MOUNTAIN HAND-POURED DRIP COFFEE', kategori: 'DRINKS', subKategori: 'Coffee', harga: 250000, image: null },
      { namaMenu: 'NITRO COLD BREW WITH SWEET FOAM', kategori: 'DRINKS', subKategori: 'Coffee', harga: 180000, image: null },

      // drink items - tea
      { namaMenu: 'EARL GREY IMPERIAL FULL LEAF TEA', kategori: 'DRINKS', subKategori: 'Tea', harga: 180000, image: null },
      { namaMenu: 'JAPANESE MATCHA CEREMONY SET', kategori: 'DRINKS', subKategori: 'Tea', harga: 220000, image: null },

      // drink items - mocktail
      { namaMenu: 'SMOKED ROSEMARY BERRY SMASH', kategori: 'DRINKS', subKategori: 'Mocktail', harga: 150000, image: null },
      { namaMenu: 'CITRUS BASIL SPARKLING MOCKTAIL', kategori: 'DRINKS', subKategori: 'Mocktail', harga: 120000, image: null },

      // drink items - cocktail
      { namaMenu: 'TRUFFLE-INFUSED SMOKY OLD FASHIONED', kategori: 'DRINKS', subKategori: 'Cocktail', harga: 300000, image: '/minuman_bourbon.png' },
      { namaMenu: 'VINTAGE DOM PÉRIGNON CHAMPAGNE', kategori: 'DRINKS', subKategori: 'Cocktail', harga: 7500000, image: null },

      // drink items - other
      { namaMenu: 'ARTESIAN CRYSTAL WATER', kategori: 'DRINKS', subKategori: 'Other', harga: 120000, image: '/minuman_crystal_water.png' },
      { namaMenu: 'SPARKLING SAN PELLEGRINO MINERAL WATER', kategori: 'DRINKS', subKategori: 'Other', harga: 150000, image: null }
    ],
  });

  console.log('inserting raw material inventory data...');
  await prisma.bahanBaku.createMany({
    data: [
      { id: 'BB-01', namaBahan: 'A5 Japanese Wagyu', statusBahan: 'TERSEDIA' },
      { id: 'BB-02', namaBahan: 'Fresh Black Truffle', statusBahan: 'TERSEDIA' },
      { id: 'BB-03', namaBahan: 'Iranian Saffron Threads', statusBahan: 'HABIS' }, // example of out of stock
      { id: 'BB-04', namaBahan: 'Artesian Water', statusBahan: 'TERSEDIA' },
      { id: 'BB-05', namaBahan: 'Alaskan King Crab', statusBahan: 'TERSEDIA' },
      { id: 'BB-06', namaBahan: 'Edible 24K Gold Leaf', statusBahan: 'TERSEDIA' }
    ],
  });

  console.log('linking menu with ingredients (komposisi)...');
  const menus = await prisma.menu.findMany();
  const wagyu = menus.find(m => m.namaMenu.includes('WAGYU'));
  const lobster = menus.find(m => m.namaMenu.includes('LOBSTER'));
  const water = menus.find(m => m.namaMenu.includes('WATER'));
  const champagne = menus.find(m => m.namaMenu.includes('CHAMPAGNE'));

  // linking "Iranian Saffron Threads" (BB-03, HABIS) to Lobster so it triggers Out of Stock
  if (wagyu && lobster && water) {
    await prisma.komposisi.createMany({
      data: [
        { idMenu: wagyu.id, idBahan: 'BB-01' },
        { idMenu: wagyu.id, idBahan: 'BB-02' },
        { idMenu: lobster.id, idBahan: 'BB-03' },
        { idMenu: water.id, idBahan: 'BB-04' }
      ]
    });
  }

  console.log('inserting dummy orders...');
  if (wagyu && lobster && water && champagne) {
    // dummy order 1: completed and paid (cashless)
    const subtotal1 = (wagyu.harga * 2) + (water.harga * 2);
    await prisma.pesanan.create({
      data: {
        jumlahOrang: 2,
        statusPesanan: 'SELESAI',
        statusTagihan: 'PAID',
        meja: { connect: { noMeja: 3 } },
        pelanggan: { connect: { id: 'Guest' } },
        pegawai: { connect: { id: 'KASIR-001' } },
        detailPesanan: {
          create: [
            { menu: { connect: { id: wagyu.id } }, jumlahPesanan: 2, subtotal: wagyu.harga * 2 },
            { menu: { connect: { id: water.id } }, jumlahPesanan: 2, subtotal: water.harga * 2 }
          ]
        },
        pembayaran: {
          create: {
            totalBayar: subtotal1 + (subtotal1 * 0.1),
            metodePembayaran: 'CASHLESS',
            kasir: { connect: { id: 'KASIR-001' } }
          }
        }
      }
    });

    // dummy order 2: waiting to be cooked, currently unpaid
    await prisma.pesanan.create({
      data: {
        jumlahOrang: 4,
        statusPesanan: 'MENUNGGU',
        statusTagihan: 'UNPAID',
        meja: { connect: { noMeja: 8 } },
        pelanggan: { connect: { id: 'CUST-001' } },
        pegawai: { connect: { id: 'PLYN-001' } },
        detailPesanan: {
          create: [
            { menu: { connect: { id: lobster.id } }, jumlahPesanan: 4, subtotal: lobster.harga * 4 },
            { menu: { connect: { id: champagne.id } }, jumlahPesanan: 1, subtotal: champagne.harga * 1 }
          ]
        }
      }
    });

    // dummy order 3: in process (diproses) by chef, unpaid
    await prisma.pesanan.create({
      data: {
        jumlahOrang: 2,
        statusPesanan: 'DIPROSES',
        statusTagihan: 'UNPAID',
        meja: { connect: { noMeja: 5 } },
        pelanggan: { connect: { id: 'CUST-002' } },
        pegawai: { connect: { id: 'PLYN-001' } },
        detailPesanan: {
          create: [
            { menu: { connect: { id: water.id } }, jumlahPesanan: 2, subtotal: water.harga * 2 }
          ]
        }
      }
    });
  }

  console.log('database seeding completed successfully! 🍽️✨');
}

main()
  .catch((e) => {
    console.error('an error occurred during the seeding process:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
