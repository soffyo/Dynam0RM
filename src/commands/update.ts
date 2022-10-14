import { UpdateCommand, UpdateCommandInput, UpdateCommandOutput } from '@aws-sdk/lib-dynamodb'
import { BatchCommand } from 'src/commands/command'
import { isObject } from 'src/utils'
import { handleConditions } from 'src/generators'
import { PrimaryKeys, Condition } from 'src/types'
import * as symbol from '../definitions/symbols'

export class Update<T> extends BatchCommand<T, UpdateCommandInput, UpdateCommandOutput> {
    protected readonly commands: UpdateCommand[] = []

    private readonly ConditionAttributeNames = {}
    private readonly ConditionAttributeValues = {}
    private readonly ConditionExpressions: string[] = []

    public constructor(target: object, Key: PrimaryKeys<T>, update: Partial<T>, conditions?: Condition<T>) {
        super(target)
        for (const key in Key) {
            if (key === this.keySchema[0].AttributeName || key === this.keySchema[1].AttributeName) {
                Object.defineProperty(this.ConditionAttributeNames, `#${key}_dynam0rx_primaryKeys`, { 
                    value: key, 
                    enumerable: true 
                })
                this.ConditionExpressions.push(`(attribute_exists(#${key}_dynam0rx_primaryKeys))`)
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
                } else if (typeof key === 'symbol' && symbol.symbols.includes(key)) {
                    handleConditions(key, value, path, this.ConditionAttributeValues, this.ConditionExpressions)
                }
            }
        }
        const iterate_updates = (target: {[k:string]: any}, paths: string[]) => {
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
                    UpdateExpressions.push(`#${path.join('.#')} = :${key}`)// <-- add this for cumulative update
                }
                //UpdateExpressions.push(`#${path.join('.#')} = :${key}`) // <-- remove this for cumulative update
            }
            const command = UpdateExpressions.length > 0 ? new UpdateCommand({
                TableName: this.tableName,
                Key,
                ExpressionAttributeNames,
                ExpressionAttributeValues,
                UpdateExpression: 'SET ' + UpdateExpressions.join(', '),
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
            const { Attributes } = responses[responses.length - 1]
            if (Attributes) this.response.content = Attributes as T
            this.response.message = 'Item updated succesfully.'
            this.response.ok = true
        } catch (error: any) {
            this.response.ok = false
            this.response.message = error.message
            this.response.error = error
        } finally {
            return this.response
        }
    }
}