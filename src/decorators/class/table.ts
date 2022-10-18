import 'reflect-metadata'
import { DynamoDBClient, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { dynam0RXMixin } from 'src/mixin'
import { mainPM } from 'src/private'
import * as symbol from 'src/private/symbols'

export function table(input?: { dynamoDBConfig: DynamoDBClientConfig }, tableName?: string) {
    return function<T extends { new (...args: any[]): {} }>(constructor: T) {
        const dynamodb = new DynamoDBClient(input?.dynamoDBConfig ?? {})
        mainPM(constructor).set(symbol.tableName, tableName ?? constructor.name)
        mainPM(constructor).set(symbol.client, DynamoDBDocumentClient.from(dynamodb))
        mainPM(constructor).set(symbol.dynamodb, dynamodb)
        return dynam0RXMixin(constructor)
    }
}