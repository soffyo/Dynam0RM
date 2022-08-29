import { ScanCommand, ScanCommandOutput } from "@aws-sdk/lib-dynamodb"

export async function scan<T extends { new (...args: any[]): {} }>(constructor: any, limit?: number): Promise<T[]> {
    const TableName = constructor._dynam0rx_tableName
    const Limit = limit ? limit : undefined
    const command = new ScanCommand({
        TableName,
        Limit
    })
    const scan = await constructor._dynam0rx_client.send(command)
    return await scanAll(constructor, scan)
}

async function scanAll<T extends { new (...args: any[]): {} }>(constructor: any, result: ScanCommandOutput): Promise<T[]> {
    const TableName = constructor._dynam0rx_tableName
    let Items = result.Items
    if (result.LastEvaluatedKey) { 
        const command = new ScanCommand({
            TableName,
            ExclusiveStartKey: result.LastEvaluatedKey
        })
        const newscan: ScanCommandOutput = await constructor._dynam0rx_client.send(command)
        newscan.Items?.forEach(i => Items?.push(i))
        return await scanAll(constructor, newscan)
    }
    return Items as T[]
}