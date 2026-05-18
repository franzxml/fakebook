# AWS Deployment

Panduan ini menyiapkan backend untuk AWS Lambda container image dan frontend untuk AWS S3 static hosting.

## Backend: AWS Lambda

Backend menggunakan Bun, Elysia, dan Prisma client dengan runtime Bun. Karena itu target yang disiapkan adalah Lambda container image dengan AWS Lambda Web Adapter.

### Prasyarat

- AWS CLI sudah login ke akun target.
- Docker sudah berjalan.
- Repository ECR sudah dibuat.
- Lambda dibuat dari container image.
- Database production memakai libSQL/Turso atau database persisten lain. Jangan memakai `file:./prisma/dev.db` di Lambda.

### Environment Lambda

Set environment variable berikut di Lambda:

```bash
DATABASE_URL="libsql://your-database.turso.io"
DATABASE_AUTH_TOKEN="your-database-auth-token"
CORS_ORIGIN="https://your-frontend-domain.example"
PORT="3000"
AWS_LWA_PORT="3000"
AWS_LWA_READINESS_CHECK_PATH="/health"
```

### Build Image

```bash
bun run docker:build:api
```

### Push ke ECR

Ganti nilai account, region, dan repository sesuai AWS Anda.

```bash
export AWS_ACCOUNT_ID="123456789012"
export AWS_REGION="ap-southeast-1"
export AWS_ECR_REPOSITORY="ppwl-clone-facebook-api"

aws ecr get-login-password --region "$AWS_REGION" \
  | docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

docker tag ppwl-clone-facebook-api:lambda \
  "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$AWS_ECR_REPOSITORY:latest"

docker push "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$AWS_ECR_REPOSITORY:latest"
```

Set image Lambda ke tag ECR tersebut. Expose API memakai Lambda Function URL atau API Gateway. Setelah URL API tersedia, pakai URL itu untuk build frontend.

## Frontend: AWS S3

Frontend Vite menghasilkan static files di `apps/web/dist`.

### Build

```bash
VITE_API_URL="https://your-api-domain.example" bun run build:web:s3
```

### Upload ke S3

```bash
export AWS_S3_BUCKET="your-frontend-bucket"
bun run deploy:web:s3
```

Jika memakai CloudFront:

```bash
export AWS_CLOUDFRONT_DISTRIBUTION_ID="E1234567890"
bun run deploy:web:invalidate
```

Untuk SPA routing, konfigurasi S3/CloudFront agar fallback error document mengarah ke `index.html`.
