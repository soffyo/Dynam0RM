import { PutCommand, BatchWriteCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb"
import { splitArray } from "../functions"
import { attributeNames } from "../generators"

export async function put<T extends { new (...args: any[]): {} }>(constructor: any, input: T|T[]): Promise<string> {
    const pk = constructor._dynam0rx_partitionKey
    const sk = constructor._dynam0rx_sortKey
    const TableName = constructor._dynam0rx_tableName
    const client: DynamoDBDocumentClient = constructor._dynam0rx_client
    const names = [pk.name, sk?.name]
    let ConditionExpression = `attribute_not_exists (#${pk.name})`
    if (sk) {
        ConditionExpression += ` AND attribute_not_exists (#${sk.name})`
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
        if (response && response.UnprocessedItems) {
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