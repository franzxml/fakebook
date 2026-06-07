import { DynamoDBClient, DeleteItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb'
import { config } from './config'
import { prisma } from './db'

const dynamo = new DynamoDBClient({ region: config.aws.region })

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
  if (!config.aws.websocketConnectionsTable) return response(500, 'WEBSOCKET_CONNECTIONS_TABLE missing')

  const { routeKey, connectionId, domainName, stage } = event.requestContext

  if (routeKey === '$connect') {
    const token = event.queryStringParameters?.token?.trim()

    if (!token) return response(401, 'Unauthorized')

    const session = await prisma.session.findUnique({
      where: { token },
      select: { userId: true, expiresAt: true },
    })

    if (!session || session.expiresAt <= new Date()) {
      return response(401, 'Unauthorized')
    }

    await dynamo.send(new PutItemCommand({
      TableName: config.aws.websocketConnectionsTable,
      Item: {
        connectionId: { S: connectionId },
        userId: { S: session.userId },
        domainName: { S: domainName ?? '' },
        stage: { S: stage ?? '' },
        ttl: { N: String(Math.floor(Date.now() / 1000) + 60 * 60 * 24) },
      },
    }))

    return response()
  }

  if (routeKey === '$disconnect') {
    await dynamo.send(new DeleteItemCommand({
      TableName: config.aws.websocketConnectionsTable,
      Key: {
        connectionId: { S: connectionId },
      },
    }))

    return response()
  }

  return response()
}
