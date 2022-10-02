import { PutCommand, BatchWriteCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb"
import { splitArray } from "../functions"
import { attributeNames } from "../generators"
import * as symbol from "../definitions/symbols"

export async function put<T extends { new (...args: any[]): {} }>(constructor: any, input: T|T[]): Promise<string> {
    const pk = constructor[symbol.primaryKeys][symbol.partitionKey]
    const sk = constructor[symbol.primaryKeys][symbol.sortKey]
    const TableName = constructor[symbol.tableName]
    const client: DynamoDBDocumentClient = constructor[symbol.client]
    const names = [pk, sk]
    let ConditionExpression = `attribute_not_exists (#${pk})`
    if (sk) {
        ConditionExpression += ` AND attribute_not_exists (#${sk})`
    }
    if (Array.isArray(input)) {
        input = input.map(i => ({ ...i }))
        const inputs = splitArray(input, 25)
        let response: any = null
        for (const item of inputs) {
            const command = new BatchWriteCommand({ 
                RequestItems: {
                    [TableName]: item.map((Item: T) => ({ 
                        PutRequest: { Item } 
                    }))
                }
            })
            response = await client.send(command)
        }
        if (response) {
            if (Object.keys(response.UnprocessedItems).length > 0) {
                return "some items unprocessed"
            } else {
                return `${input.length} items added to the database`
            }
        } 
    } else {
        input = { ...input }
        const command = new PutCommand({
            TableName,
            ExpressionAttributeNames: attributeNames(names),
            ConditionExpression,
            Item: input
        })
        await client.send(command)  
        return "item has been put"
    }
    throw Error("no item passed")  
}