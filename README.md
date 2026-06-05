## Laporan

Laporan progress dapat diakses melalui tautan berikut:

[Laporan Progress Fakebook](https://docs.google.com/document/d/1OwPiXkDV1Hle0Uq3St45m89hIQwYwXTj3xJ8fGbesxo/edit?tab=t.9hq5o51i0w7p)

## Fitur

* Login dan registrasi akun manual
* Login menggunakan OAuth Google
* Splash screen setelah login manual dan Google
* Reset password berbasis token
* Proteksi halaman privat agar hanya user login yang bisa masuk
* Feed postingan dari database
* Membuat, mengedit, dan menghapus postingan milik sendiri
* Edit postingan termasuk ganti gambar langsung dari menu tiga titik postingan
* Upload gambar postingan melalui presigned URL S3 (maksimal 1 gambar)
* Like dan unlike postingan
* Status like tetap tersimpan setelah refresh
* Detail postingan
* Tambah, edit, dan hapus komentar
* Dialog konfirmasi hapus komentar (custom, bukan dialog browser default)
* Balas komentar
* Notifikasi untuk like, komentar, dan balasan komentar
* Dropdown notifikasi dengan close otomatis saat klik di luar
* Halaman notifikasi
* Realtime update untuk notifikasi dan perubahan feed
* Realtime refresh untuk angka like dan komentar
* Daftar semua pengguna
* Profil publik pengguna dari halaman feed dan halaman pengguna
* Username dan bio pengguna
* Nama tampil mengikuti username jika sudah diset, jika belum memakai nama asli
* Edit profil pengguna
* Upload avatar pengguna melalui presigned URL S3
* Ubah nama, username, bio, email, avatar, dan password
* Logout
* State management frontend menggunakan Zustand
* Struktur frontend modular per fitur

## Teknologi

* Bun
* React 19
* Vite 8
* TypeScript
* Tailwind CSS 4
* Lucide React
* Zustand
* Elysia
* Prisma 7
* libSQL / Turso (lokal & fallback production)
* PostgreSQL / AWS RDS (production primary)
* AWS S3
* AWS CloudFront
* AWS Lambda Function URL
* AWS API Gateway WebSocket
* AWS DynamoDB untuk koneksi WebSocket
* Docker untuk build image Lambda API
* ESLint

## Struktur Folder

```text
fakebook/
|-- apps/
|   |-- api/
|   |   |-- prisma/
|   |   |   |-- migrations/
|   |   |   |-- schema.prisma        ← SQLite (lokal dev)
|   |   |   |-- schema-pg.prisma     ← PostgreSQL (production)
|   |   |   `-- seed-home-feed.sql
|   |   |-- scripts/
|   |   |   `-- backfill-usernames.mjs
|   |   |-- src/
|   |   |   |-- db/
|   |   |   |   |-- index.ts         ← unified client (RDS → Turso fallback)
|   |   |   |   |-- db.ts            ← libSQL/Turso client
|   |   |   |   `-- dbPostgres.ts    ← PostgreSQL RDS client
|   |   |   |-- generated/           ← hasil Prisma generate (tidak diedit)
|   |   |   |-- http/
|   |   |   |   |-- auth.ts
|   |   |   |   `-- errors.ts
|   |   |   |-- lib/
|   |   |   |   |-- prismaSelects.ts ← shared Prisma select/include constants
|   |   |   |   `-- userUtils.ts     ← username normalization & generation
|   |   |   |-- realtime/
|   |   |   |   `-- broadcast.ts
|   |   |   |-- routes/
|   |   |   |   |-- auth/
|   |   |   |   |-- comments/
|   |   |   |   |-- notifications/
|   |   |   |   |-- posts/
|   |   |   |   |-- profile/
|   |   |   |   |-- uploads/
|   |   |   |   `-- users/
|   |   |   |-- services/
|   |   |   |   |-- commentService.ts
|   |   |   |   |-- googleAuthService.ts
|   |   |   |   `-- profileService.ts
|   |   |   |-- index.ts             ← entry point HTTP Lambda
|   |   |   `-- wsHandler.ts         ← entry point WebSocket Lambda
|   |   |-- Dockerfile.lambda
|   |   |-- package.json
|   |   |-- prisma.config.ts
|   |   `-- tsconfig.json
|   `-- web/
|       |-- public/
|       |   |-- images/
|       |   |   `-- auth/
|       |   `-- favicon.svg
|       |-- src/
|       |   |-- components/
|       |   |   `-- Avatar.tsx        ← shared avatar component lintas route
|       |   |-- hooks/
|       |   |   `-- useNotificationSync.ts
|       |   |-- layouts/
|       |   |   `-- AppLayout.tsx
|       |   |-- lib/
|       |   |   |-- navigation.ts
|       |   |   |-- notificationDisplay.tsx
|       |   |   |-- notificationUtils.ts
|       |   |   |-- userDisplay.ts
|       |   |   `-- validateImageFile.ts
|       |   |-- routes/
|       |   |   |-- auth/
|       |   |   |   |-- components/
|       |   |   |   |-- hooks/
|       |   |   |   |-- ForgotPasswordPage.tsx
|       |   |   |   |-- LoginPage.tsx
|       |   |   |   `-- RegisterPage.tsx
|       |   |   |-- home/
|       |   |   |   |-- components/
|       |   |   |   `-- HomePage.tsx
|       |   |   |-- notifications/
|       |   |   |   `-- NotificationsPage.tsx
|       |   |   |-- posts/
|       |   |   |   |-- components/
|       |   |   |   |-- hooks/
|       |   |   |   |-- utils/
|       |   |   |   `-- PostDetailPage.tsx
|       |   |   |-- profile/
|       |   |   |   |-- hooks/
|       |   |   |   `-- ProfilePage.tsx
|       |   |   `-- users/
|       |   |       |-- PublicUserProfilePage.tsx
|       |   |       `-- UsersPage.tsx
|       |   |-- services/
|       |   |   `-- api.ts
|       |   |-- stores/
|       |   |   |-- authStore.ts
|       |   |   |-- feedStore.ts
|       |   |   |-- index.ts
|       |   |   |-- notificationStore.ts
|       |   |   |-- realtimeStore.ts
|       |   |   `-- uiStore.ts
|       |   |-- types/
|       |   |   `-- social.ts
|       |   |-- App.tsx
|       |   |-- index.css
|       |   `-- main.tsx
|       |-- eslint.config.js
|       |-- index.html
|       |-- package.json
|       |-- tsconfig.app.json
|       |-- tsconfig.json
|       |-- tsconfig.node.json
|       `-- vite.config.ts
|-- packages/
|   `-- shared/
|       |-- src/
|       |   `-- index.ts
|       |-- package.json
|       `-- tsconfig.json
|-- bun.lock
|-- package.json
|-- README.md
`-- tsconfig.base.json
```

## Cara Menjalankan Lokal

1. Pastikan komputer sudah memiliki **Bun**, **Git**, dan **Docker** jika ingin build image backend untuk Lambda.

2. Clone repositori.

   ```bash
   git clone git@github.com:franzxml/fakebook.git
   cd fakebook
   ```

   Jika menggunakan HTTPS:

   ```bash
   git clone https://github.com/franzxml/fakebook.git
   cd fakebook
   ```

3. Install dependensi.

   ```bash
   bun install
   ```

4. Siapkan environment frontend.

   ```bash
   cp apps/web/.env.example apps/web/.env
   ```

   Contoh konfigurasi lokal:

   ```bash
   VITE_API_URL="http://localhost:3000"
   VITE_GOOGLE_CLIENT_ID="your-google-oauth-client-id.apps.googleusercontent.com"
   VITE_WEBSOCKET_URL="wss://your-api-gateway-websocket-url"
   ```

5. Siapkan environment backend.

   ```bash
   cp apps/api/.env.example apps/api/.env
   ```

   Contoh konfigurasi lokal:

   ```bash
   DATABASE_URL="file:./prisma/dev.db"
   PORT="3000"
   CORS_ORIGIN="http://localhost:5173"
   ADMIN_USERS_KEY="your-secret-key"
   GOOGLE_CLIENT_ID="your-google-oauth-client-id.apps.googleusercontent.com"
   UPLOADS_BUCKET="fakebook-user-content-example"
   UPLOADS_PUBLIC_BASE_URL="https://fakebook-user-content-example.s3.us-east-1.amazonaws.com"
   WEBSOCKET_CONNECTIONS_TABLE="fakebook-websocket-connections"
   WEBSOCKET_API_ENDPOINT="https://your-websocket-api.execute-api.us-east-1.amazonaws.com/prod"
   ```

6. Generate Prisma Client.

   ```bash
   bun run prisma:generate
   ```

7. Jalankan migrasi database lokal.

   ```bash
   bun run prisma:migrate
   ```

8. Jalankan frontend dan backend bersamaan.

   ```bash
   bun run dev
   ```

9. Buka aplikasi lokal.

   ```bash
   http://localhost:5173
   ```

   Backend lokal berjalan di:

   ```bash
   http://localhost:3000
   ```

## Script

* `bun run dev` menjalankan frontend dan backend secara bersamaan.
* `bun run dev:web` menjalankan frontend Vite.
* `bun run dev:api` menjalankan backend Elysia dengan watch mode.
* `bun run build` build shared package, backend, dan frontend.
* `bun run build:shared` build package shared.
* `bun run build:api` build backend.
* `bun run build:web` build frontend.
* `bun run build:web:s3` build frontend sebelum deployment S3.
* `bun run typecheck` menjalankan typecheck semua workspace.
* `bun run typecheck:shared` typecheck package shared.
* `bun run typecheck:api` typecheck backend.
* `bun run typecheck:web` typecheck frontend.
* `bun run lint` menjalankan ESLint pada frontend.
* `bun run prisma:generate` generate Prisma Client dari schema SQLite (lokal).
* `bun run prisma:generate:pg` generate Prisma Client dari schema PostgreSQL (production).
* `bun run prisma:migrate` menjalankan migrasi database lokal.
* `bun run prisma:migrate:pg` menjalankan migrasi database PostgreSQL production.
* `bun run docker:build:api` build Docker image backend Lambda lokal.
* `bun run deploy:web:s3` upload hasil build frontend ke AWS S3. Variabel `AWS_S3_BUCKET` harus tersedia.
* `bun run deploy:web:invalidate` membuat invalidation CloudFront. Variabel `AWS_CLOUDFRONT_DISTRIBUTION_ID` harus tersedia.

## Deployment

### Frontend

Frontend production di-build dari `apps/web` lalu di-upload ke S3 dan disajikan lewat CloudFront.

```bash
bun run build:web:s3
AWS_S3_BUCKET=s3-monorepo-frontend-prod-2026 bun run deploy:web:s3
AWS_CLOUDFRONT_DISTRIBUTION_ID=E3PHP2PBFP7CIC bun run deploy:web:invalidate
```

### Backend

Backend production berjalan sebagai container image di AWS Lambda. Image dibangun dari `apps/api/Dockerfile.lambda`, dipush ke ECR, lalu Lambda di-update menggunakan image terbaru.

```bash
docker buildx build \
  --platform linux/arm64 \
  --provenance=false \
  -f apps/api/Dockerfile.lambda \
  -t 722765871100.dkr.ecr.us-east-1.amazonaws.com/ppwl-clone-facebook-api:<tag> \
  --push .

aws lambda update-function-code \
  --function-name ppwl-clone-facebook-api \
  --region us-east-1 \
  --image-uri 722765871100.dkr.ecr.us-east-1.amazonaws.com/ppwl-clone-facebook-api:<tag>
```

### Database Production

Database production menggunakan dua layer:

1. **PostgreSQL RDS (primary)** — set `DATABASE_PG_URL` di Lambda environment.
2. **Turso (fallback)** — set `DATABASE_URL` + `DATABASE_AUTH_TOKEN`. Aktif otomatis jika RDS tidak responsif dalam 3 detik.

Generate Prisma Client PostgreSQL sebelum build Docker:

```bash
bun run prisma:generate:pg
```

Jalankan migrasi ke PostgreSQL RDS:

```bash
DATABASE_PG_URL="postgresql://..." bun run prisma:migrate:pg
```

## Domain Production

Frontend production:

[https://d3b2jcy5w87rzf.cloudfront.net/](https://d3b2jcy5w87rzf.cloudfront.net/)

Backend production:

[https://2gtrnedjhmootg6bu5e24kwdmq0oyuns.lambda-url.us-east-1.on.aws/](https://2gtrnedjhmootg6bu5e24kwdmq0oyuns.lambda-url.us-east-1.on.aws/)

WebSocket production:

```text
wss://8z4wlfa9cd.execute-api.us-east-1.amazonaws.com/prod
```

## Resource AWS

* Frontend CDN: AWS CloudFront
* CloudFront Distribution ID: `E3PHP2PBFP7CIC`
* Frontend Storage: AWS S3
* S3 Bucket: `s3-monorepo-frontend-prod-2026`
* Backend Runtime: AWS Lambda
* Lambda Function: `ppwl-clone-facebook-api`
* Lambda Region: `us-east-1`
* Lambda Function URL: `https://2gtrnedjhmootg6bu5e24kwdmq0oyuns.lambda-url.us-east-1.on.aws/`
* Backend ECR: `722765871100.dkr.ecr.us-east-1.amazonaws.com/ppwl-clone-facebook-api`
* Upload Bucket: `fakebook-user-content-722765871100-us-east-1`
* WebSocket API: `wss://8z4wlfa9cd.execute-api.us-east-1.amazonaws.com/prod`
* WebSocket Connections Table: `fakebook-websocket-connections`

## Catatan Struktur

* Folder `apps/web/src/routes` mengikuti domain halaman atau fitur.
* Folder `components`, `hooks`, dan `utils` di dalam route dipakai untuk kode yang spesifik pada route tersebut.
* Folder `apps/web/src/components` berisi komponen shared yang dipakai lintas route (misal `Avatar`).
* Folder `apps/web/src/lib` berisi utility functions dan helpers yang dipakai lintas route.
* Folder `apps/web/src/stores` berisi Zustand store dengan penamaan camelCase dan diekspor lewat `stores/index.ts`.
* Folder `apps/web/public/images` digunakan untuk asset statis publik.
* Folder `apps/api/src/routes` mengikuti resource API (resource-based routing).
* Folder `apps/api/src/services` berisi business logic yang diekstrak dari route handlers.
* Folder `apps/api/src/lib` berisi shared utility dipakai lintas route dan service.
* Folder `apps/api/src/db` adalah database module — `index.ts` mengekspos unified client dengan fallback otomatis.
* Folder `apps/api/src/generated` adalah hasil generate Prisma dan tidak diedit manual.
* Folder `apps/api/prisma/migrations` mengikuti struktur Prisma dan tidak di-rename manual.

---

Dikembangkan oleh:

* @franzxml
* @h1101241039-cmd
* @ghinaaa09
* @arifquuu
* @isanctuarry
