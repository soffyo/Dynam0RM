import { UpdateCommand } from "@aws-sdk/lib-dynamodb"
import { isObject } from 'src/utils'
import { handleUpdates } from "src/generators"
import { JSObject, PrimaryKeys } from "src/types"
import * as symbols from 'src/private/symbols'

export function iterateUpdates(target: JSObject, paths: string[], Key: PrimaryKeys<any>, TableName: string, Commands: UpdateCommand[]) {
    const ExpressionAttributeValues = {}
    const ExpressionAttributeNames = {}
    const UpdateExpressions: {[K in ('add'|'delete'|'remove'|'update')]: string[]} = {
        add: [], delete: [], remove: [], update: [],
    }
    for (const [key, value] of Object.entries(target)) {
        Object.defineProperty(ExpressionAttributeNames, `#${key}`, { value: key, enumerable: true })
        let path = [key]
        if (paths.length) {
            path = [...paths, key]
            for (const k of paths) {
                Object.defineProperty(ExpressionAttributeNames, `#${k}`, { value: k, enumerable: true })
            }
        }
        if (isObject(value)) {
            if (Reflect.ownKeys(value).every(k => typeof k === 'symbol')) {
                handleUpdates(value, path, ExpressionAttributeValues, UpdateExpressions )
            } else {
                Object.defineProperty(ExpressionAttributeValues, `:${key}`, { value: {}, enumerable: true })
                UpdateExpressions.update.push(`#${key} = if_not_exists(#${key}, :${key})`)
                iterateUpdates(value, path, Key, TableName, Commands)
            }
        } else {
            if (value === symbols.remove) {
                UpdateExpressions.remove.push(`#${path.join('.#')}`)
            } else {
                Object.defineProperty(ExpressionAttributeValues, `:${key}`, { value, enumerable: true })
                UpdateExpressions.update.push(`#${path.join('.#')} = :${key}`)
            }
        }
    }
    const extract = (arr: string[]) => arr.length ? arr.join(', ') : ''
    const remove = extract(UpdateExpressions.remove)
    const add = extract(UpdateExpressions.add)
    const update = extract(UpdateExpressions.update)
    const _delete = extract(UpdateExpressions.delete)
    const command = Object.keys(UpdateExpressions).some(k => UpdateExpressions[k as keyof typeof UpdateExpressions].length) ? new UpdateCommand({
        TableName,
        Key,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
        UpdateExpression: `${update && "SET " + update}${add && " ADD " + add}${_delete && " DELETE " + _delete}${remove && " REMOVE " + remove}`,
        ReturnValues: 'ALL_NEW'
    }) : undefined
    return command && Commands.push(command)
}