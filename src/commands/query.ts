import { QueryCommand, DynamoDBDocumentClient, paginateQuery } from "@aws-sdk/lib-dynamodb"
import { handleConditions } from "../generators"
import { isObject } from "../functions"
import * as symbol from "../definitions/symbols"
import { GlobalSecondaryIndex, KeySchemaElement, LocalSecondaryIndex } from "@aws-sdk/client-dynamodb"

export async function query<T>(constructor: any, query: any, limit?: number): Promise<{[k:string]: any}[]> {
    const primaryKey: KeySchemaElement[] = constructor[symbol.keySchema]
    const localIndexes: LocalSecondaryIndex[] = constructor[symbol.localIndexes]
    const globalIndexes: GlobalSecondaryIndex[] = constructor[symbol.globalIndexes]
    const TableName: string = constructor[symbol.tableName]
    const client: DynamoDBDocumentClient =  constructor[symbol.client]
    const ExpressionAttributeNames = {}
    const ExpressionAttributeValues = {}
    const KeyConditionExpressions: string[] = []
    let IndexName = undefined
    function addPartitionKey(key: string, value: any) {
        Object.defineProperty(ExpressionAttributeNames, `#${key}`, { value: key, enumerable: true })
        Object.defineProperty(ExpressionAttributeValues, `:${key}`, { value, enumerable: true })
        KeyConditionExpressions.push(`(#${key} = :${key})`)
    }
    function addSortKey(key: string, value: any) {
        Object.defineProperty(ExpressionAttributeNames, `#${key}`, { value: key, enumerable: true })
        if (isObject(value)) {
            for (const symbol of Object.getOwnPropertySymbols(value)) {
                handleConditions(symbol, (value as any)[symbol], [key], ExpressionAttributeValues, KeyConditionExpressions)
            }
        }
    }
    function searchKeys(index?: LocalSecondaryIndex[]|GlobalSecondaryIndex[], local?: boolean) {
        const [k0, k1] = [Object.keys(query)[0], Object.keys(query)[1]]
        const [v0, v1] = [query[k0], query[k1]]
        const PK = primaryKey[0].AttributeName
        const SK = primaryKey[1].AttributeName
        function addKeys(pk: string, sk: string, name?: string) {
            if (k0 === pk && (local ? k0 === PK : true) && (k1 === sk || !k1)) {
                addPartitionKey(k0, v0)
                IndexName = name ?? undefined
                if (k1) {
                    addSortKey(k1, v1)
                }
            } else if (k1 === pk && (local ? k1 === PK : true) && (k0 === sk || !k0)) {
                addPartitionKey(k1, v1)
                IndexName = name ?? undefined
                if (k0) {
                    addSortKey(k0, v0)
                }
            }
        }
        if (index) {
            for (const item of index) {
                const indexPK = item.KeySchema[0].AttributeName
                const indexSK = item.KeySchema[1].AttributeName
                const indexName = item.IndexName
                addKeys(indexPK, indexSK, indexName)
            }
        } else {
            addKeys(PK, SK)
        }
    }
    searchKeys()
    localIndexes && searchKeys(localIndexes, true)
    globalIndexes && searchKeys(globalIndexes, false)

    const command = new QueryCommand({
        TableName,
        IndexName,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
        KeyConditionExpression: [...new Set(KeyConditionExpressions)].join(" AND "),
        Limit: limit ?? undefined
    })
    const paginator = paginateQuery({ client }, command.input)
    const response: any[] = []
    for await (const page of paginator) {
        response.push(...page.Items)
    }
    //return (await client.send(command)).Items
    return response
}