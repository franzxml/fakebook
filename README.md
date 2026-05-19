## Laporan
Laporan progress tugas besar cloning Facebook dapat diakses melalui tautan berikut:

[Laporan Progress Tugas Besar Cloning Facebook](https://docs.google.com/document/d/1OwPiXkDV1Hle0Uq3St45m89hIQwYwXTj3xJ8fGbesxo/edit?tab=t.9hq5o51i0w7p)

## Deskripsi
PPWL Clone Facebook merupakan aplikasi media sosial berbasis web yang dibuat sebagai proyek cloning Facebook. Aplikasi ini menyediakan pengalaman dasar seperti autentikasi, beranda feed, pembuatan postingan, upload gambar, like, komentar, notifikasi, serta pengelolaan profil pengguna.

Proyek ini menggunakan struktur monorepo agar frontend, backend, dan tipe data bersama dapat dikelola dalam satu repositori. Frontend dibangun dengan React dan Vite, backend menggunakan Elysia di atas Bun, sedangkan akses database menggunakan Prisma dengan adapter libSQL/Turso. Aplikasi juga sudah disiapkan untuk deployment frontend ke AWS S3 + CloudFront dan backend ke AWS Lambda Function URL.

## Fitur
* Login dan registrasi akun manual
* Login menggunakan OAuth Google
* Proteksi route untuk halaman privat
* Beranda dengan tampilan menyerupai Facebook
* Feed postingan dari database
* Membuat postingan baru
* Upload gambar pada postingan
* Edit dan hapus postingan milik sendiri
* Like dan unlike postingan
* Detail postingan
* Tambah, edit, dan hapus komentar
* Notifikasi untuk like dan komentar
* Status notifikasi terbaca dan belum terbaca
* Dropdown notifikasi di beranda
* Edit profil pengguna
* Ubah avatar, nama, email, dan password
* Logout dari beranda
* Reset password berbasis token
* Struktur frontend yang modular

## Teknologi
* Bun
* React 19
* Vite 8
* TypeScript
* Tailwind CSS 4
* Lucide React
* Elysia
* Prisma 7
* libSQL / Turso
* AWS S3
* AWS CloudFront
* AWS Lambda Function URL
* Docker untuk build image Lambda API
* ESLint

## Struktur Folder
    ppwl-clone-facebook/
    │── apps/
    │   ├── api/
    │   │   ├── prisma/
    │   │   │   ├── migrations/
    │   │   │   ├── schema.prisma
    │   │   │   └── seed-home-feed.sql
    │   │   ├── src/
    │   │   │   ├── db/
    │   │   │   │   └── prisma.ts
    │   │   │   ├── http/
    │   │   │   │   ├── auth.ts
    │   │   │   │   └── errors.ts
    │   │   │   ├── routes/
    │   │   │   │   ├── auth/
    │   │   │   │   ├── comments/
    │   │   │   │   ├── notifications/
    │   │   │   │   ├── posts/
    │   │   │   │   ├── profile/
    │   │   │   │   └── users/
    │   │   │   └── index.ts
    │   │   ├── Dockerfile.lambda
    │   │   ├── package.json
    │   │   └── prisma.config.ts
    │   └── web/
    │       ├── public/
    │       │   └── favicon.svg
    │       ├── src/
    │       │   ├── components/
    │       │   │   └── ui/
    │       │   ├── layouts/
    │       │   │   └── AppLayout.tsx
    │       │   ├── lib/
    │       │   │   ├── navigation.ts
    │       │   │   └── utils.ts
    │       │   ├── routes/
    │       │   │   ├── auth/
    │       │   │   ├── home/
    │       │   │   │   ├── components/
    │       │   │   │   ├── data/
    │       │   │   │   └── HomePage.tsx
    │       │   │   ├── notifications/
    │       │   │   ├── posts/
    │       │   │   ├── profile/
    │       │   │   └── users/
    │       │   ├── services/
    │       │   │   └── api.ts
    │       │   ├── types/
    │       │   │   └── social.ts
    │       │   ├── App.tsx
    │       │   ├── index.css
    │       │   └── main.tsx
    │       ├── index.html
    │       └── package.json
    │── packages/
    │   └── shared/
    │       ├── src/
    │       │   └── index.ts
    │       └── package.json
    │── docs/
    │   └── pembagian-tugas-file-projek.pdf
    │── scripts/
    │   └── generate-task-files-pdf.mjs
    │── .gitignore
    │── bun.lock
    │── package.json
    │── README.md
    └── tsconfig.base.json

## Cara Menjalankan
1. **Persiapan Lingkungan:** Pastikan komputer sudah terinstal **Bun**, **Git**, dan **Docker** jika ingin build image backend untuk Lambda.

2. **Clone Repositori:** Clone repositori dari GitHub.
   ```bash
   git clone git@github.com:franzxml/ppwl-clone-facebook.git
   ```

   Jika menggunakan HTTPS:
   ```bash
   git clone https://github.com/franzxml/ppwl-clone-facebook.git
   ```

3. **Masuk ke Folder Proyek:**
   ```bash
   cd ppwl-clone-facebook
   ```

4. **Install Dependensi:**
   ```bash
   bun install
   ```

5. **Siapkan Environment Frontend:** Buat file environment frontend dari contoh.
   ```bash
   cp apps/web/.env.example apps/web/.env
   ```

   Contoh nilai yang digunakan:
   ```bash
   VITE_API_URL=http://localhost:3001
   ```

6. **Siapkan Environment Backend:** Buat file environment backend dari contoh.
   ```bash
   cp apps/api/.env.example apps/api/.env
   ```

   Isi konfigurasi database dan secret sesuai kebutuhan lokal. Contoh variabel yang umum digunakan:
   ```bash
   DATABASE_URL=file:./dev.db
   JWT_SECRET=your-secret-key
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

7. **Generate Prisma Client:**
   ```bash
   bun run prisma:generate
   ```

8. **Jalankan Migrasi Database Lokal:**
   ```bash
   bun run prisma:migrate
   ```

9. **Jalankan Frontend dan Backend Bersamaan:**
   ```bash
   bun run dev
   ```

10. **Akses Aplikasi Lokal:** Buka browser dan kunjungi:
    ```bash
    http://localhost:5173
    ```

    Backend lokal berjalan di:
    ```bash
    http://localhost:3001
    ```

## Script
* `bun run dev` untuk menjalankan frontend dan backend secara bersamaan.
* `bun run dev:web` untuk menjalankan frontend Vite.
* `bun run dev:api` untuk menjalankan backend Elysia dengan watch mode.
* `bun run build` untuk build shared package, backend, dan frontend.
* `bun run build:shared` untuk build tipe package shared.
* `bun run build:api` untuk build backend.
* `bun run build:web` untuk build frontend.
* `bun run build:web:s3` untuk build frontend sebelum deployment S3.
* `bun run typecheck` untuk menjalankan typecheck semua workspace.
* `bun run typecheck:shared` untuk typecheck package shared.
* `bun run typecheck:api` untuk typecheck backend.
* `bun run typecheck:web` untuk typecheck frontend.
* `bun run lint` untuk menjalankan ESLint pada frontend.
* `bun run prisma:generate` untuk generate Prisma Client.
* `bun run prisma:migrate` untuk menjalankan migrasi database lokal.
* `bun run docker:build:api` untuk build Docker image backend Lambda.
* `bun run deploy:web:s3` untuk upload hasil build frontend ke AWS S3.
* `bun run deploy:web:invalidate` untuk membuat invalidation CloudFront.

## Domain
Frontend production dapat diakses melalui:

[https://d3b2jcy5w87rzf.cloudfront.net/](https://d3b2jcy5w87rzf.cloudfront.net/)

Backend production dapat diakses melalui:

[https://2gtrnedjhmootg6bu5e24kwdmq0oyuns.lambda-url.us-east-1.on.aws/](https://2gtrnedjhmootg6bu5e24kwdmq0oyuns.lambda-url.us-east-1.on.aws/)

Resource AWS yang digunakan:

* Frontend CDN: AWS CloudFront
* CloudFront Distribution ID: `E3PHP2PBFP7CIC`
* Frontend Storage: AWS S3
* S3 Bucket: `s3-monorepo-frontend-prod-2026`
* Backend Runtime: AWS Lambda
* Lambda Function: `ppwl-clone-facebook-api`
* Lambda Region: `us-east-1`
* Lambda Function URL: `https://2gtrnedjhmootg6bu5e24kwdmq0oyuns.lambda-url.us-east-1.on.aws/`

---

Dikembangkan oleh:

* @franzxml
* @h1101241039-cmd
* @ghinaaa09
* arifquuu
* isanctuarry
