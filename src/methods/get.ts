import { GetCommand, BatchGetCommand } from "@aws-sdk/lib-dynamodb"
import { splitArray } from "../functions"
import { PrimaryKeys } from "../types"

export async function get<T extends { new (...args: any[]): {} }>(constructor: T & {[k:string]: any}, keys: PrimaryKeys<T>|PrimaryKeys<T>[]): Promise<T|T[]> {
    const TableName = constructor._dynam0rx_tableName
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
            const { Responses } = await constructor._dynam0rx_client.send(command)
            Response.push(Responses[TableName])
        }
        return Response.flat()
    } else { 
        const command = new GetCommand({ 
            TableName, 
            Key: keys
        })
        return (await constructor._dynam0rx_client.send(command)).Item
    }
}