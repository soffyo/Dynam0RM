import { UpdateCommand, UpdateCommandInput, UpdateCommandOutput } from '@aws-sdk/lib-dynamodb'
import { BatchCommand } from 'src/commands/command'
import { isObject } from 'src/utils'
import { handleConditions, handleUpdates } from 'src/generators'
import { PrimaryKeys, Condition, Update as TUpdate } from 'src/types'
import * as symbols from '../private/symbols'

export class Update <T> extends BatchCommand<UpdateCommandInput, UpdateCommandOutput, T> {
    protected readonly commands: UpdateCommand[] = []

    private readonly ConditionAttributeNames = {}
    private readonly ConditionAttributeValues = {}
    private readonly ConditionExpressions: string[] = []

    public constructor(target: { new (...args: any[]): {} }, Key: PrimaryKeys<T>, update: TUpdate<T>, conditions?: Condition<T>) {
        super(target)
        for (const key in Key) {
            if (key === this.keySchema[0].AttributeName || key === this.keySchema[1].AttributeName) {
                Object.defineProperty(this.ConditionAttributeNames, `#${key}`, {
                    value: key, 
                    enumerable: true 
                })
                this.ConditionExpressions.push(`(attribute_exists(#${key}))`)
            }
        }
        const iterate_conditions = (target: {[k:string|symbol]: any}, paths: string[]) => {
            for (const key of Reflect.ownKeys(target)) {
                const value = target[key]
                let path = paths
                if (typeof key === 'string') {
                    Object.defineProperty(this.ConditionAttributeNames, `#${key}`, { value: key, enumerable: true })
                    path = paths.length > 0 ? [...paths, key] : [key]
                    if (isObject(value)) {
                        iterate_conditions(value, path)
                    }
                } else if (typeof key === 'symbol') {
                    handleConditions(key, value, path, this.ConditionAttributeValues, this.ConditionExpressions)
                }
            }
        }
        const iterate_updates = (target: {[k:string]: any}, paths: string[]) => {
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
                        iterate_updates(value, path)
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
                TableName: this.tableName,
                Key,
                ExpressionAttributeNames,
                ExpressionAttributeValues,
                UpdateExpression: `${update && "SET " + update}${add && " ADD " + add}${_delete && " DELETE " + _delete}${remove && " REMOVE " + remove}`,
                ReturnValues: 'ALL_NEW'
            }) : undefined
            return command && this.commands.push(command)
        }
        if (conditions) iterate_conditions(conditions, [])
        iterate_updates(update, [])
        this.commands.reverse()
    }
    protected async send() {
        const responses: UpdateCommandOutput[] = []
        let index = 0
        for (const command of this.commands) {
            if (index === 0 ) {
                command.input.ExpressionAttributeNames = { ...command.input.ExpressionAttributeNames, ...this.ConditionAttributeNames }
                command.input.ExpressionAttributeValues = { ...command.input.ExpressionAttributeValues, ...this.ConditionAttributeValues }
                command.input.ConditionExpression = this.ConditionExpressions.join(' AND ')
            }
            index++
            responses.push(await this.dynamoDBDocumentClient.send(command))
        }
        return responses
    }
    public async exec() {
        try {
            const responses = await this.send()
            const { Attributes } = responses[responses.length - 1] ?? { Attributes: undefined }
            if (Attributes) this.response.output = Attributes as T
            this.response.message = 'Item updated succesfully.'
            this.response.ok = true
        } catch (error: any) {
            this.response.ok = false
            this.response.message = error.message
            this.response.error = error.name
        } finally {
            return this.response
        }
    }
}