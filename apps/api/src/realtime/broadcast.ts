import {
  ApiGatewayManagementApiClient,
  GoneException,
  PostToConnectionCommand,
} from '@aws-sdk/client-apigatewaymanagementapi'
import { DynamoDBClient, DeleteItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb'
import { config } from '../config'

const dynamo = new DynamoDBClient({ region: config.aws.region })

type RealtimePayload = {
  type: 'feed_changed' | 'notification'
  [key: string]: unknown
}

// Scan dipakai karena broadcast memang butuh semua koneksi dan partition key
// tabel saat ini adalah connectionId. Mengganti ke Query butuh redesign key
// schema tabel (infra change) — lihat catatan deployment.
async function getConnectionIds() {
  if (!config.aws.websocketConnectionsTable) return []

  const response = await dynamo.send(new ScanCommand({
    TableName: config.aws.websocketConnectionsTable,
    ProjectionExpression: 'connectionId',
  }))

  return response.Items
    ?.map((item) => item.connectionId?.S)
    .filter((connectionId): connectionId is string => Boolean(connectionId)) ?? []
}

async function deleteStaleConnection(connectionId: string) {
  if (!config.aws.websocketConnectionsTable) return

  try {
    await dynamo.send(new DeleteItemCommand({
      TableName: config.aws.websocketConnectionsTable,
      Key: {
        connectionId: { S: connectionId },
      },
    }))
  } catch (error) {
    console.error(`Gagal menghapus koneksi stale ${connectionId}:`, error)
  }
}

/**
 * Shorthand untuk broadcast perubahan feed ke semua koneksi aktif.
 * Dipakai di route posts dan comments.
 */
export function broadcastFeedChanged(reason: string, postId: string) {
  broadcastRealtime({ type: 'feed_changed', reason, postId }).catch((error) => {
    console.error('Gagal broadcast realtime feed:', error)
  })
}

async function broadcastRealtime(payload: RealtimePayload) {
  if (!config.aws.websocketConnectionsTable || !config.aws.websocketApiEndpoint) return

  const connectionIds = await getConnectionIds()
  if (connectionIds.length === 0) return

  const client = new ApiGatewayManagementApiClient({
    region: config.aws.region,
    endpoint: config.aws.websocketApiEndpoint,
  })
  const data = new TextEncoder().encode(JSON.stringify(payload))

  await Promise.all(
    connectionIds.map(async (connectionId) => {
      try {
        await client.send(new PostToConnectionCommand({ ConnectionId: connectionId, Data: data }))
      } catch (error) {
        // Koneksi sudah mati: bersihkan dari DynamoDB agar tidak
        // terus-menerus dikirimi pesan sampai TTL kedaluwarsa.
        if (error instanceof GoneException) {
          await deleteStaleConnection(connectionId)
          return
        }

        console.error(`Gagal kirim pesan realtime ke ${connectionId}:`, error)
      }
    }),
  )
}
