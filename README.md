## Fitur

- Login dan registrasi akun manual
- Login menggunakan OAuth Google
- Splash screen setelah login manual dan Google
- Reset password berbasis token
- Proteksi halaman privat agar hanya user login yang bisa masuk
- Feed postingan dari database
- Membuat, mengedit, dan menghapus postingan milik sendiri
- Edit postingan termasuk ganti gambar langsung dari menu tiga titik postingan
- Upload gambar postingan melalui presigned URL S3 (maksimal 1 gambar)
- Like dan unlike postingan
- Status like tetap tersimpan setelah refresh
- Detail postingan (modal dan deep link `/posts/:id`)
- Tambah, edit, dan hapus komentar
- Dialog konfirmasi hapus komentar (custom, bukan dialog browser default)
- Balas komentar
- Notifikasi untuk like, komentar, dan balasan komentar
- Dropdown notifikasi dengan close otomatis saat klik di luar
- Halaman notifikasi
- Realtime update untuk notifikasi dan perubahan feed
- Realtime refresh untuk angka like dan komentar
- Daftar semua pengguna
- Profil publik pengguna dari halaman feed dan halaman pengguna
- Username dan bio pengguna
- Nama tampil mengikuti username jika sudah diset, jika belum memakai nama asli
- Edit profil pengguna
- Upload avatar pengguna melalui presigned URL S3
- Ubah nama, username, bio, email, avatar, dan password
- Logout
- State management frontend menggunakan Zustand dan TanStack Query
- Struktur frontend modular per fitur

## Teknologi

- **Runtime:** Bun
- **Frontend:** React 19, Vite 8, TypeScript, Tailwind CSS 4, Lucide React
- **State Management:** Zustand, TanStack Query
- **Backend:** Elysia, Prisma 7
- **Database:** libSQL / Turso (lokal & fallback production), PostgreSQL / AWS RDS (production primary)
- **Cloud:** AWS S3, AWS CloudFront, AWS Lambda Function URL, AWS API Gateway WebSocket, AWS DynamoDB
- **Build:** Docker
- **Linting:** ESLint

## Struktur Folder

```
fakebook/
├── apps/
│   ├── api/
│   │   ├── prisma/
│   │   │   ├── migrations/
│   │   │   ├── schema.prisma          SQLite (lokal dev)
│   │   │   ├── schema-pg.prisma       PostgreSQL (production)
│   │   │   └── seed-home-feed.sql
│   │   ├── scripts/
│   │   │   └── backfill-usernames.mjs
│   │   ├── src/
│   │   │   ├── db/
│   │   │   │   ├── index.ts           unified client (RDS → Turso fallback)
│   │   │   │   ├── db.ts              libSQL/Turso client
│   │   │   │   └── db-postgres.ts     PostgreSQL RDS client
│   │   │   ├── generated/             hasil Prisma generate (tidak diedit)
│   │   │   ├── http/
│   │   │   │   ├── auth.ts
│   │   │   │   └── errors.ts
│   │   │   ├── lib/
│   │   │   │   ├── prisma-errors.ts   helper deteksi error Prisma (P2002)
│   │   │   │   ├── prisma-selects.ts  shared Prisma select/include constants
│   │   │   │   └── user-utils.ts      username normalization & generation
│   │   │   ├── realtime/
│   │   │   │   └── broadcast.ts
│   │   │   ├── routes/
│   │   │   │   ├── auth/
│   │   │   │   ├── comments/
│   │   │   │   ├── notifications/
│   │   │   │   ├── posts/
│   │   │   │   ├── profile/
│   │   │   │   ├── uploads/
│   │   │   │   └── users/
│   │   │   ├── services/
│   │   │   │   ├── auth-service.ts
│   │   │   │   ├── comment-service.ts
│   │   │   │   ├── google-auth-service.ts
│   │   │   │   ├── like-service.ts
│   │   │   │   ├── notification-service.ts
│   │   │   │   ├── post-service.ts
│   │   │   │   ├── profile-service.ts
│   │   │   │   └── user-service.ts
│   │   │   ├── index.ts               entry point HTTP Lambda
│   │   │   └── ws-handler.ts          entry point WebSocket Lambda
│   │   ├── Dockerfile.lambda
│   │   ├── eslint.config.js
│   │   ├── package.json
│   │   ├── prisma.config.ts
│   │   └── tsconfig.json
│   └── web/
│       ├── public/
│       │   ├── images/
│       │   │   └── auth/
│       │   └── favicon.svg
│       ├── src/
│       │   ├── components/
│       │   │   └── avatar.tsx          shared avatar component lintas route
│       │   ├── hooks/
│       │   │   ├── use-notification-sync.ts
│       │   │   └── use-notifications.ts
│       │   ├── layouts/
│       │   │   └── app-layout.tsx
│       │   ├── lib/
│       │   │   ├── navigation.ts
│       │   │   ├── notification-display.tsx
│       │   │   ├── notification-utils.ts
│       │   │   ├── query-client.ts
│       │   │   ├── realtime-socket.ts  manajemen koneksi WebSocket + reconnect
│       │   │   ├── user-display.ts
│       │   │   └── validate-image-file.ts
│       │   ├── routes/
│       │   │   ├── auth/
│       │   │   │   ├── components/
│       │   │   │   ├── hooks/
│       │   │   │   ├── forgot-password-page.tsx
│       │   │   │   ├── login-page.tsx
│       │   │   │   └── register-page.tsx
│       │   │   ├── home/
│       │   │   │   ├── components/
│       │   │   │   └── home-page.tsx
│       │   │   ├── notifications/
│       │   │   │   └── notifications-page.tsx
│       │   │   ├── posts/
│       │   │   │   ├── components/
│       │   │   │   ├── hooks/
│       │   │   │   ├── utils/
│       │   │   │   ├── post-detail-page.tsx
│       │   │   │   └── post-detail-route.tsx   halaman deep link /posts/:id
│       │   │   ├── profile/
│       │   │   │   ├── hooks/
│       │   │   │   └── profile-page.tsx
│       │   │   └── users/
│       │   │       ├── public-user-profile-page.tsx
│       │   │       └── users-page.tsx
│       │   ├── services/
│       │   │   └── api.ts
│       │   ├── stores/
│       │   │   ├── auth-store.ts
│       │   │   ├── index.ts
│       │   │   ├── realtime-store.ts
│       │   │   └── ui-store.ts
│       │   ├── types/
│       │   │   └── social.ts
│       │   ├── app.tsx
│       │   ├── index.css
│       │   └── main.tsx
│       ├── eslint.config.js
│       ├── index.html
│       ├── package.json
│       ├── tsconfig.app.json
│       ├── tsconfig.json
│       ├── tsconfig.node.json
│       └── vite.config.ts
├── packages/
│   └── shared/
│       ├── src/
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
├── bun.lock
├── package.json
└── tsconfig.base.json
```

## Cara Menjalankan

**Prasyarat:** Bun, Git, Docker (opsional, hanya untuk build image Lambda).

1. Clone repositori:

   ```bash
   git clone git@github.com:franzxml/fakebook.git
   cd fakebook
   ```

   Atau via HTTPS:

   ```bash
   git clone https://github.com/franzxml/fakebook.git
   cd fakebook
   ```

2. Install dependensi:

   ```bash
   bun install
   ```

3. Siapkan environment frontend:

   ```bash
   cp apps/web/.env.example apps/web/.env
   ```

   Isi `apps/web/.env`:

   ```
   VITE_API_URL="http://localhost:3000"
   VITE_GOOGLE_CLIENT_ID="your-google-oauth-client-id.apps.googleusercontent.com"
   VITE_WEBSOCKET_URL="wss://your-api-gateway-websocket-url"
   ```

4. Siapkan environment backend:

   ```bash
   cp apps/api/.env.example apps/api/.env
   ```

   Isi `apps/api/.env`:

   ```
   DATABASE_URL="file:./prisma/dev.db"
   PORT="3000"
   CORS_ORIGIN="http://localhost:5173"
   GOOGLE_CLIENT_ID="your-google-oauth-client-id.apps.googleusercontent.com"
   UPLOADS_BUCKET="fakebook-user-content-example"
   UPLOADS_PUBLIC_BASE_URL="https://fakebook-user-content-example.s3.us-east-1.amazonaws.com"
   WEBSOCKET_CONNECTIONS_TABLE="fakebook-websocket-connections"
   WEBSOCKET_API_ENDPOINT="https://your-websocket-api.execute-api.us-east-1.amazonaws.com/prod"
   ```

5. Generate Prisma Client:

   ```bash
   bun run prisma:generate
   ```

6. Jalankan migrasi database lokal:

   ```bash
   bun run prisma:migrate
   ```

7. Jalankan frontend dan backend bersamaan:

   ```bash
   bun run dev
   ```

8. Buka di browser:
   - Frontend: `http://localhost:5173`
   - Backend: `http://localhost:3000`

## Scripts

| Perintah | Keterangan |
|---|---|
| `bun run dev` | Jalankan frontend dan backend bersamaan |
| `bun run dev:web` | Jalankan frontend Vite |
| `bun run dev:api` | Jalankan backend Elysia dengan watch mode |
| `bun run build` | Build shared package, backend, dan frontend |
| `bun run build:shared` | Build package shared |
| `bun run build:api` | Build backend |
| `bun run build:web` | Build frontend |
| `bun run build:web:s3` | Build frontend untuk deployment S3 |
| `bun run typecheck` | Typecheck semua workspace |
| `bun run typecheck:shared` | Typecheck package shared |
| `bun run typecheck:api` | Typecheck backend |
| `bun run typecheck:web` | Typecheck frontend |
| `bun run lint` | Periksa kode backend dan frontend dengan ESLint |
| `bun run lint:api` | Periksa kode backend dengan ESLint |
| `bun run lint:web` | Periksa kode frontend dengan ESLint |
| `bun run prisma:generate` | Generate Prisma Client dari schema SQLite (lokal) |
| `bun run prisma:generate:pg` | Generate Prisma Client dari schema PostgreSQL (production) |
| `bun run prisma:migrate` | Jalankan migrasi database lokal |
| `bun run prisma:migrate:pg` | Jalankan migrasi database PostgreSQL production |
| `bun run docker:build:api` | Build Docker image backend Lambda lokal |
| `bun run deploy:web:s3` | Upload hasil build frontend ke S3 (butuh `AWS_S3_BUCKET`) |
| `bun run deploy:web:invalidate` | Buat invalidation CloudFront (butuh `AWS_CLOUDFRONT_DISTRIBUTION_ID`) |

## Deployment

### Frontend

Build lalu upload ke S3 dan invalidate CloudFront:

```bash
bun run build:web:s3
AWS_S3_BUCKET=s3-monorepo-frontend-prod-2026 bun run deploy:web:s3
AWS_CLOUDFRONT_DISTRIBUTION_ID=E3PHP2PBFP7CIC bun run deploy:web:invalidate
```

URL production: https://d3b2jcy5w87rzf.cloudfront.net

### Backend

Build container image, push ke ECR, update Lambda:

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

URL production: https://2gtrnedjhmootg6bu5e24kwdmq0oyuns.lambda-url.us-east-1.on.aws

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

WebSocket production: `wss://8z4wlfa9cd.execute-api.us-east-1.amazonaws.com/prod`

## Pengembang

- [franzxml](https://github.com/franzxml)
- [h1101241039-cmd](https://github.com/h1101241039-cmd)
- [ghinaaa09](https://github.com/ghinaaa09)
- [arifquuu](https://github.com/arifquuu)
- [isanctuarry](https://github.com/isanctuarry)
