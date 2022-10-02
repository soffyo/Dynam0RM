import { GetCommand, BatchGetCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb"
import { splitArray } from "../functions"
import { PrimaryKeys } from "../types"
import * as symbol from "../definitions/symbols"

export async function get<T extends Record<string,any>>(constructor: T & {[k:string|symbol]: any}, keys: PrimaryKeys<T>|PrimaryKeys<T>[]): Promise<T|T[]> {
    const client: DynamoDBDocumentClient = constructor[symbol.client]
    const TableName = constructor[symbol.tableName]
    if (Array.isArray(keys)) {
        const Response = []
        const inputs = splitArray(keys, 25)
        for (const item of inputs) {
            const command = new BatchGetCommand({
                RequestItems: {
                    [TableName]: {
                        Keys: item as []
                    }
                }
            })
            const { Responses } = await client.send(command)
            Response.push(Responses[TableName])
        }
        return Response.flat() as T[]
    } else { 
        const command = new GetCommand({ 
            TableName, 
            Key: keys
        })
        return (await client.send(command)).Item as T
    }
}