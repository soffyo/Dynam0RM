import { DeleteTableCommand } from "@aws-sdk/client-dynamodb"
import * as symbol from "../definitions/symbols"

export async function drop(constructor: any): Promise<string> {
    const TableName = constructor[symbol.tableName]
    const command = new DeleteTableCommand({ TableName })
    const { TableDescription } = await constructor[symbol.client].send(command)
    return `Table "${TableDescription?.TableName}" deleted.`
}