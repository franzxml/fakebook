import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi'
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb'

const region = process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION ?? 'us-east-1'
const connectionsTable = process.env.WEBSOCKET_CONNECTIONS_TABLE
const websocketEndpoint = process.env.WEBSOCKET_API_ENDPOINT

const dynamo = new DynamoDBClient({ region })

type RealtimePayload = {
  type: 'feed_changed' | 'notification'
  [key: string]: unknown
}

async function getConnectionIds() {
  if (!connectionsTable) return []

  const response = await dynamo.send(new ScanCommand({
    TableName: connectionsTable,
    ProjectionExpression: 'connectionId',
  }))

  return response.Items
    ?.map((item) => item.connectionId?.S)
    .filter((connectionId): connectionId is string => Boolean(connectionId)) ?? []
}

export async function broadcastRealtime(payload: RealtimePayload) {
  if (!connectionsTable || !websocketEndpoint) return

  const connectionIds = await getConnectionIds()
  if (connectionIds.length === 0) return

  const client = new ApiGatewayManagementApiClient({
    region,
    endpoint: websocketEndpoint,
  })
  const data = new TextEncoder().encode(JSON.stringify(payload))

  await Promise.allSettled(
    connectionIds.map((ConnectionId) => (
      client.send(new PostToConnectionCommand({ ConnectionId, Data: data }))
    )),
  )
}
