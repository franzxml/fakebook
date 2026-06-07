export const config = {
  port: Number(process.env.PORT ?? 3000),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  isAwsLambda: Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME),
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
  },
  aws: {
    region: process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION ?? 'us-east-1',
    uploadsBucket: process.env.UPLOADS_BUCKET,
    uploadsPublicBaseUrl: process.env.UPLOADS_PUBLIC_BASE_URL,
    websocketConnectionsTable: process.env.WEBSOCKET_CONNECTIONS_TABLE,
    websocketApiEndpoint: process.env.WEBSOCKET_API_ENDPOINT,
  },
  db: {
    url: process.env.DATABASE_URL ?? 'file:./prisma/dev.db',
    authToken: process.env.DATABASE_AUTH_TOKEN,
    pgUrl: process.env.DATABASE_PG_URL,
  },
}
