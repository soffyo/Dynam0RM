import { BatchWriteCommand, DeleteCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb"
import { symbols } from "../definitions"
import { splitArray, isObject } from "../functions"
import { handleConditions } from "../generators"
import { PrimaryKeys, Condition } from "../types"

export async function Delete<T extends { new (...args: any[]): {} }>(constructor: any, keys: PrimaryKeys<T>|PrimaryKeys<T>[], condition?: Condition<T>) {
    const TableName = constructor._dynam0rx_tableName
    const client: DynamoDBDocumentClient = constructor._dynam0rx_client 
    if (Array.isArray(keys)) {
        const inputs = splitArray(keys, 25)
        let response: any = null
        for (const item of inputs) {
            const command = new BatchWriteCommand({
                RequestItems: {
                    [TableName]: item.map(Key => ({
                        DeleteRequest: { Key }
                    }))
                }
            })
            response = await client.send(command)
        }
        if (response && response.UnprocessedItems) {
            if (Object.keys(response.UnprocessedItems).length > 0) {
                return "Some items may have not been deleted."
            } else {
                return `All ${keys.length} items have been deleted.`
            }
        } 
    } else {
        const ExpressionAttributeNames = {}
        const ExpressionAttributeValues = {}
        const Expressions: string[] = []
        condition && void (function iterate(target: {[k:string|symbol]: any}, paths: string[]) {
            for (const key of Reflect.ownKeys(target)) {
                const value = target[key]
                let path = paths
                if (typeof key === "string") {
                    Object.defineProperty(ExpressionAttributeNames, `#${key}`, { value: key, enumerable: true })
                    path = paths.length > 0 ? [...paths, key] : [key]
                    if (isObject(value)) {
                        iterate(value, path)
                    }
                } else if (typeof key === "symbol" && symbols.includes(key)) {
                    handleConditions(key, value, path, ExpressionAttributeValues, Expressions)
                }
            }
        })(condition, [])
        const command = new DeleteCommand({
            TableName,
            Key: keys,
            ExpressionAttributeNames: Object.keys(ExpressionAttributeNames).length > 0 ? ExpressionAttributeNames : undefined,
            ExpressionAttributeValues: Object.keys(ExpressionAttributeValues).length > 0 ? ExpressionAttributeValues : undefined,
            ConditionExpression: Expressions.length > 0 ? Expressions.join(" AND ") : undefined
        })
        await client.send(command)
        return "The item has been deleted"
    }
    throw Error("no input")
}