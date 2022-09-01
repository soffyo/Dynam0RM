import { UpdateCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb"
import { isObject } from "../functions"

export async function save<T extends { new (...args: any[]): {} }>(constructor: any, keys: any, update: Record<string,any>) {
    const TableName = constructor._dynam0rx_tableName
    const client: DynamoDBDocumentClient = constructor._dynam0rx_client 
    const commands: UpdateCommand[] = []
    void (function iterate(target, paths: string[] = []): any {
        const ExpressionAttributeValues = {}
        const ExpressionAttributeNames = {}
        const UpdateExpressions: string[] = []
        for (const [key, value] of Object.entries(target)) {
            Object.defineProperty(ExpressionAttributeNames, `#${key}`, { value: key, enumerable: true })
            let path = [key]
            if (paths.length > 0 ) {
                path = [...paths, key]
                for (const k of paths) {
                    Object.defineProperty(ExpressionAttributeNames, `#${k}`, { value: k, enumerable: true })
                }
            }
            const $path = path.join(".#")
            UpdateExpressions.push(`#${$path} = :${key}`)
            if (isObject(value)) {
                Object.defineProperty(ExpressionAttributeValues, `:${key}`, { value: {}, enumerable: true })
                iterate(value, path)
            } else {
                Object.defineProperty(ExpressionAttributeValues, `:${key}`, { value, enumerable: true })
            }
        }
        const command = UpdateExpressions.length > 0 ? new UpdateCommand({
            TableName,
            Key: keys,
            ExpressionAttributeNames,
            ExpressionAttributeValues,
            UpdateExpression: "SET " + UpdateExpressions.join(", ")
        }) : undefined
        return command && commands.push(command)
    })(update)
    try {
        for (const command of commands.reverse()) {
            await client.send(command)
        }
        return "update successful"
    } catch (error: any) {
        return "update unsuccessful"
    }
}