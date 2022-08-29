import { BillingMode, CreateTableCommand } from "@aws-sdk/client-dynamodb"

export async function initialize<T extends { new (...args: any[]): {} }>(constructor: any, BillingMode: BillingMode = "PAY_PER_REQUEST"): Promise<string> {
    const pk = constructor._dynam0rx_partitionKey
    const sk = constructor._dynam0rx_sortKey
    const TableName = constructor._dynam0rx_tableName
    const KeySchema = [{
        AttributeName: pk.name,
        KeyType: "HASH"
    }]
    const AttributeDefinitions = [{
        AttributeName: pk.name,
        AttributeType: pk.type === "string" ? "S" : pk.type === "number" ? "N" : undefined
    }]
    if (sk) {
        KeySchema.push({
            AttributeName: sk.name,
            KeyType: "RANGE"
        })
        AttributeDefinitions.push({
            AttributeName: sk.name,
            AttributeType: sk.type === "string" ? "S" : sk.type === "number" ? "N" : undefined
        })
    }
    const command = new CreateTableCommand({
        BillingMode, 
        TableName,
        KeySchema,
        AttributeDefinitions
    })
    const { TableDescription } = await constructor._dynam0rx_client.send(command)
    return `Table "${TableDescription?.TableName}" created successfully`
}