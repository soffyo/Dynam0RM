import {DynamoDBClient, DynamoDBClientConfig} from '@aws-sdk/client-dynamodb'
import {DynamoDBDocumentClient} from '@aws-sdk/lib-dynamodb'
import {TablesWM} from 'src/private'
import {Class} from 'src/types'
import * as symbol from 'src/private/symbols'

export function Connection(input?: {dynamoDBConfig?: DynamoDBClientConfig, tableName?: string}) {
    return function<T extends Class>(ctx: T) {
        const dynamodb = new DynamoDBClient({ ...input?.dynamoDBConfig })
        const tableName = input?.tableName?.replace(/[^a-zA-Z0-9\-._]/g, '')
        TablesWM(ctx).set(symbol.tableName, tableName ?? ctx.name)
        TablesWM(ctx).set(symbol.client, DynamoDBDocumentClient.from(dynamodb, {marshallOptions: {convertClassInstanceToMap: true}}))
        TablesWM(ctx).set(symbol.dynamodb, dynamodb)
    }
}