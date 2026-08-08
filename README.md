# RestoLink 🍽️

> **RestoLink** — Sistem Manajemen Pelayanan dan Kasir Restoran berbasis Website untuk mendigitalkan dan mengotomatisasi alur operasional Restoran Pak Resto UNIKOM.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?style=for-the-badge&logo=postgresql)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css)
![Deployment](https://img.shields.io/badge/Vercel-Hosted-000000?style=for-the-badge&logo=vercel)

---

## 📌 Deskripsi Singkat

RestoLink dikembangkan untuk mengatasi permasalahan operasional restoran yang sebelumnya menggunakan pencatatan manual berbasis kertas. Sistem ini menghubungkan setiap pemangku kepentingan secara *real-time* mulai dari Pelanggan, Pelayan, Koki, Kasir, hingga Pemilik Restoran dalam satu platform terpadu.

* **Live Demo Website:** [restolink.vercel.app](https://restolink.vercel.app)
* **Video Demonstrasi:** [User Manual di YouTube](https://youtube.com)

---

## 🛠️ Teknologi & Tools

* **Frontend & Backend Framework:** Next.js (App Router, React 19)
* **Database & ORM:** PostgreSQL (Supabase) & Prisma ORM
* **Styling:** Tailwind CSS
* **Hosting / Deployment:** Vercel

---

## 👥 Tim Pengembang (Kelompok Baros / IF-4 UNIKOM)

| NIM | Nama Lengkap | Role / Kontribusi Utama |
| :---: | :--- | :--- |
| **10124158** | Najwa Nurul Aziz | Product Manager, DFD, Desain UI Figma, Video Demo |
| **10124164** | Daisy Maria M. Atok | Process Business Doc, Software Requirement, Diagram Konteks |
| **10124463** | Serena Luthfiana W. | Fullstack Software Engineer, Dokumen Perancangan, Video Demo |
| **10124465** | Salsabila Khoirunnisa | Software Requirement, Analysis Requirement (ERD & DFD), Info Doc |

---

## ✨ Fitur Utama Berdasarkan Peran (Role)

1. **Pelanggan (Customer):**
   * Pemesanan menu digital via tablet di meja restoran.
   * Katalog interaktif dengan status ketersediaan bahan otomatis (*Out of Stock*).
   * Fitur keranjang dan konfirmasi pesanan langsung ke dapur.

2. **Dapur (Kitchen Display System / KDS):**
   * Antrean tiket pesanan masuk secara *real-time*.
   * Pembaruan status masakan (*Selesai*).
   * Pengelolaan status ketersediaan bahan baku secara instan.

3. **Pelayan (Waiter Dashboard):**
   * Visualisasi status meja (*Occupied* / *Vacant*).
   * Fitur input pesanan manual jika dibutuhkan pelanggan.

4. **Kasir (Cashier / POS):**
   * Validasi pembayaran (*CASH*, *QRIS*, *DEBIT*).
   * Penambahan stempel *PAID* dan pencetakan nota fisik transaksi.

5. **Pemilik (Owner Dashboard):**
   * Monitoring operasional staf secara *Read-Only*.
   * Pengelolaan akun akses pegawai (*Add Staff*).
   * Laporan riwayat transaksi dan pendapatan restoran.

---

## 🚀 Cara Menjalankan Proyek Secara Lokal

1. **Clone Repositori:**

```bash
git clone [https://github.com/username/restolink.git](https://github.com/username/restolink.git)
cd restolink

```

2. **Install Dependensi:**

```bash
npm install

```

3. **Konfigurasi Environment Variables (`.env`):**

Buat file `.env` dan tambahkan koneksi database PostgreSQL kamu:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/restolink?schema=public"

```

4. **Migrasi & Seed Database:**

```bash
npx prisma db push
npx prisma db seed

```

5. **Jalankan Development Server:**

```bash
npm run dev

```

Buka `http://localhost:3000` di browser kamu.

---

*Tugas Besar Rekayasa Perangkat Lunak I — Universitas Komputer Indonesia (UNIKOM) 2026*
