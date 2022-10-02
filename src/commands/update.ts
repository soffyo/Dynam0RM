import { UpdateCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb"
import { isObject } from "../functions"
import { handleConditions } from "../generators"
import { PrimaryKeys, Condition } from "../types"
import * as symbol from "../definitions/symbols"

export async function update<T extends { new (...args: any[]): {} }>(constructor: any, keys: PrimaryKeys<T>, update: Partial<T>, conditions?: Condition<T>) {
    const TableName = constructor[symbol.tableName]
    const client: DynamoDBDocumentClient = constructor[symbol.client]
    const ConditionAttributeNames = {}
    const ConditionAttributeValues = {}
    const ConditionExpressions: string[] = []
    const commands: UpdateCommand[] = []
    for (const key in keys) {
        if (key === constructor[symbol.primaryKeys][symbol.partitionKey] || key === constructor[symbol.primaryKeys][symbol.sortKey]) {
            Object.defineProperty(ConditionAttributeNames, `#${key}_dynam0rx_primaryKeys`, { value: key, enumerable: true })
            ConditionExpressions.push(`(attribute_exists(#${key}_dynam0rx_primaryKeys))`)
        }
    }
    conditions && void (function iterate_conditions(target: {[k:string|symbol]: any}, paths: string[]) {
        for (const key of Reflect.ownKeys(target)) {
            const value = target[key]
            let path = paths
            if (typeof key === "string") {
                Object.defineProperty(ConditionAttributeNames, `#${key}`, { value: key, enumerable: true })
                path = paths.length > 0 ? [...paths, key] : [key]
                if (isObject(value)) {
                    iterate_conditions(value, path)
                }
            } else if (typeof key === "symbol" && symbol.symbols.includes(key)) {
                handleConditions(key, value, path, ConditionAttributeValues, ConditionExpressions)
            }
        }
    })(conditions, [])
    void (function iterate_updates(target: {[k:string]: any}, paths: string[]): any {
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
            if (isObject(value)) {
                Object.defineProperty(ExpressionAttributeValues, `:${key}`, { value: {}, enumerable: true })
                UpdateExpressions.push(`#${key} = if_not_exists(#${key}, :${key})`) // <-- add this for cumulative update
                iterate_updates(value, path)
            } else {
                Object.defineProperty(ExpressionAttributeValues, `:${key}`, { value, enumerable: true })
                UpdateExpressions.push(`#${path.join(".#")} = :${key}`)// <-- add this for cumulative update
            }
            //UpdateExpressions.push(`#${path.join(".#")} = :${key}`) // <-- remove this for cumulative update
        }
        const command = UpdateExpressions.length > 0 ? new UpdateCommand({
            TableName,
            Key: keys,
            ExpressionAttributeNames,
            ExpressionAttributeValues,
            UpdateExpression: "SET " + UpdateExpressions.join(", "),
        }) : undefined
        return command && commands.push(command)
    })(update, [])
    let index = 0
    for (const command of commands.reverse()) {
        if (index === 0 ) {
            command.input.ExpressionAttributeNames = { ...command.input.ExpressionAttributeNames, ...ConditionAttributeNames }
            command.input.ExpressionAttributeValues = { ...command.input.ExpressionAttributeValues, ...ConditionAttributeValues }
            command.input.ConditionExpression = ConditionExpressions.join(" AND ")
        }   
        index++
        await client.send(command)
    }
    return "update successful"
}