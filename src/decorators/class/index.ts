import 'reflect-metadata'
import { DynamoDBClient, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import * as symbol from '../../definitions'
import { Dynam0RXMixin } from './mixin'

let targetConstructor: { new (...args: any[]): {} }

export function Schema(input?: { dynamoDBConfig: DynamoDBClientConfig }, tableName?: string) {
    return function<T extends { new (...args: any[]): {} }>(constructor: T) {
        Object.defineProperties(constructor, {
            [symbol.client]: {
                value: DynamoDBDocumentClient.from(new DynamoDBClient(input?.dynamoDBConfig ?? {}))
            },
            [symbol.tableName]: {
                value: tableName ?? constructor.name
            }
        })
        targetConstructor = constructor
        return Dynam0RXMixin(constructor)
    }
}

export { targetConstructor }