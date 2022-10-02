import { ScanCommand, ScanCommandOutput, paginateScan, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb"
import * as symbol from "../definitions/symbols"

export async function scan<T>(constructor: any, limit?: number, indexName?: string): Promise<T[]> {
    const TableName = constructor[symbol.tableName]
    const Limit = limit ? limit : undefined
    const client: DynamoDBDocumentClient = constructor[symbol.client]
    const command = new ScanCommand({
        TableName,
        Limit,
        IndexName: indexName ?? undefined
    })
    const paginator = paginateScan({ client }, command.input)
    const result: any = []
    for await (const page of paginator) {
        result.push(...page.Items)
    }
    return result
}