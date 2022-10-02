import { CreateTableCommand } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb"
import { tableConfig } from "../types"
import * as symbol from "../definitions/symbols"

export async function initialize(constructor: any, config?: tableConfig): Promise<string> {
    const client: DynamoDBDocumentClient = constructor[symbol.client]
    const command = new CreateTableCommand({
        BillingMode: config?.throughput ? "PROVISIONED" : "PAY_PER_REQUEST", 
        TableClass: config?.infrequent ? "STANDARD_INFREQUENT_ACCESS" : "STANDARD",
        ProvisionedThroughput: config?.throughput ? { ReadCapacityUnits: config.throughput.read, WriteCapacityUnits: config.throughput.write } : undefined,
        TableName: constructor[symbol.tableName],
        KeySchema: constructor[symbol.keySchema],
        AttributeDefinitions: constructor[symbol.attributeDefinitions],
        LocalSecondaryIndexes: constructor[symbol.localIndexes] ?? undefined,
        GlobalSecondaryIndexes: constructor[symbol.globalIndexes] ?? undefined
    })
    const { TableDescription } = await client.send(command)
    return `Table "${TableDescription?.TableName}" created successfully`
}