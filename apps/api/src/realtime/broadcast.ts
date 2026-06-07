import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi'
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb'
import { config } from '../config'

const dynamo = new DynamoDBClient({ region: config.aws.region })

type RealtimePayload = {
  type: 'feed_changed' | 'notification'
  [key: string]: unknown
}

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

  await Promise.allSettled(
    connectionIds.map((ConnectionId) => (
      client.send(new PostToConnectionCommand({ ConnectionId, Data: data }))
    )),
  )
}
