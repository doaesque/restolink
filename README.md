# 🍽️ RestoLink — Restaurant Operations & POS Ecosystem

[![Next.js](https://img.shields.io/badge/Next.js-15+-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

RestoLink is a unified restaurant operations platform built to eliminate paper-based coordination bottlenecks between front-of-house service and kitchen fulfillment.

Developed for the **Software Engineering I** (*Tugas Besar Rekayasa Perangkat Lunak I*) curriculum, Informatics Engineering, Universitas Komputer Indonesia (UNIKOM).

---

## 🏛️ System Architecture

RestoLink models an end-to-end commercial restaurant pipeline through segregated Role-Based Access Control (RBAC):


```

[ Table Customer ] ---> (Place Order) ---> [ Waiter Dispatch ]
|
(Auto-Routing)
v
[ Executive Owner ] <--- [ Cashier POS ] <--- [ Kitchen (KDS) ]
(Audit / BI)          (Settlement)         (Batch Cooking)

```

### Module Breakdown
* **Self-Service Customer Portal (`/(customer)`):** Tablet-oriented digital menu with dynamic out-of-stock guards and direct cart dispatch.
* **Kitchen Display System (`/employee/koki`):** Real-time ticket pipeline displaying order states (`QUEUED` $\to$ `COOKING` $\to$ `READY`) and bulk inventory stock controls.
* **Floor Service Operations (`/employee/pelayan`):** Dynamic table map state machine (`VACANT` vs. `OCCUPIED`) and floor-side manual order overrides.
* **Cashier Terminal (`/employee/kasir`):** Split billing, payment gateway simulation (Cash, QRIS, Debit), and invoice generation.
* **Executive Dashboard (`/employee/owner`):** Read-only financial audits, daily revenue recapitulation, and staff credential provisioning.

---

## 🛠️ Stack

* **Application Framework:** Next.js (App Router, Server Components & Route Handlers)
* **Type System:** TypeScript
* **Database & Persistence:** PostgreSQL via Supabase
* **ORM & Migrations:** Prisma ORM
* **Styling:** Tailwind CSS

---

## 👥 Team & Roles (Kelompok Baros / IF-4)

* Serena: Lead Fullstack Engineer (Database Architecture, Route Handlers, State Sync)
* Najwa: Product Management, DFD Design, UI/UX Mockups
* Daisy: Business Logic Specifications, Context Diagramming
* Salsabila: Software Requirements Engineering, ERD/DFD Validation

---

## 🚀 Local Deployment

```bash
# Clone and install
git clone https://github.com/doaesque/restolink.git
cd restolink
npm install

# Configure environment
cp .env.example .env
# Set DATABASE_URL="postgresql://user:password@localhost:5432/restolink"

# Sync schema & run seed
npx prisma db push
npx prisma db seed

# Run local development instance
npm run dev

```
