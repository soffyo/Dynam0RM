import { QueryCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb"
import { handleConditions } from "../generators"
import { isObject } from "../functions"
import { Query } from "../types"

export async function query<T>(constructor: any, query: any, limit?: number): Promise<{[k:string]: any}[]|undefined> {
    const pk = constructor._dynam0rx_partitionKey.name
    const sk = constructor._dynam0rx_sortKey.name
    const TableName = constructor._dynam0rx_tableName
    const client: DynamoDBDocumentClient =  constructor._dynam0rx_client
    const ExpressionAttributeNames = {}
    const ExpressionAttributeValues = {}
    const KeyConditionExpressions: string[] = []
    for (const [key, value] of Object.entries(query)) {
        if (key === pk) {
            Object.defineProperty(ExpressionAttributeNames, `#${key}`, { value: key, enumerable: true })
            Object.defineProperty(ExpressionAttributeValues, `:${key}`, { value, enumerable: true })
            KeyConditionExpressions.push(`(#${key} = :${key})`)
        }
        if (key === sk) {
            Object.defineProperty(ExpressionAttributeNames, `#${key}`, { value: key, enumerable: true })
            if (isObject(value)) {
                for (const symbol of Object.getOwnPropertySymbols(value)) {
                    handleConditions(symbol, (value as any)[symbol], [key], ExpressionAttributeValues, KeyConditionExpressions)
                }
            }
        }
    }
    const command = new QueryCommand({
        TableName,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
        KeyConditionExpression: KeyConditionExpressions.join(" AND "),
        Limit: limit ?? undefined
    })
    return (await client.send(command)).Items
}