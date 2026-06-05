import { DynamoDBClient, DeleteItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb'

const region = process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION ?? 'us-east-1'
const connectionsTable = process.env.WEBSOCKET_CONNECTIONS_TABLE

const dynamo = new DynamoDBClient({ region })

type WebsocketEvent = {
  requestContext: {
    routeKey: '$connect' | '$disconnect' | '$default' | string
    connectionId: string
    domainName?: string
    stage?: string
  }
  queryStringParameters?: Record<string, string | undefined> | null
}

function response(statusCode = 200, body = 'OK') {
  return { statusCode, body }
}

export async function handler(event: WebsocketEvent) {
  if (!connectionsTable) return response(500, 'WEBSOCKET_CONNECTIONS_TABLE missing')

  const { routeKey, connectionId, domainName, stage } = event.requestContext

  if (routeKey === '$connect') {
    const token = event.queryStringParameters?.token?.trim()

    if (!token) return response(401, 'Unauthorized')

    await dynamo.send(new PutItemCommand({
      TableName: connectionsTable,
      Item: {
        connectionId: { S: connectionId },
        userId: { S: 'connected' },
        domainName: { S: domainName ?? '' },
        stage: { S: stage ?? '' },
        ttl: { N: String(Math.floor(Date.now() / 1000) + 60 * 60 * 24) },
      },
    }))

    return response()
  }

  if (routeKey === '$disconnect') {
    await dynamo.send(new DeleteItemCommand({
      TableName: connectionsTable,
      Key: {
        connectionId: { S: connectionId },
      },
    }))

    return response()
  }

  return response()
}
