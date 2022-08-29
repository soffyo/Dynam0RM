import { DeleteTableCommand } from "@aws-sdk/client-dynamodb"

export async function drop<T extends { new (...args: any[]): {} }>(constructor: any): Promise<string> {
    const TableName = constructor._dynam0rx_tableName
    const command = new DeleteTableCommand({ TableName })
    const { TableDescription } = await constructor._dynam0rx_client.send(command)
    return `Table "${TableDescription?.TableName}" deleted.`
}