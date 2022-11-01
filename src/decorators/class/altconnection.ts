import {DynamoDBClient, DynamoDBClientConfig} from '@aws-sdk/client-dynamodb'
import {DynamoDBDocumentClient} from '@aws-sdk/lib-dynamodb'
import {TablesWM} from 'src/private'
import {Class} from 'src/types'
import * as symbol from 'src/private/symbols'

interface IConnection {
    client?: DynamoDBClient
    documentClient: DynamoDBDocumentClient
    tableName?: string
}

export function Connection({client, documentClient, tableName}: IConnection) {
    return function<T extends Class>(ctx: T) {
        tableName = tableName?.replace(/[^a-zA-Z0-9\-._]/g, '')
        TablesWM(ctx).set(symbol.tableName, tableName ?? ctx.name)
        TablesWM(ctx).set(symbol.dynamodb, client)
        TablesWM(ctx).set(symbol.client, documentClient)
    }
}