import {UpdateCommand, UpdateCommandInput, UpdateCommandOutput} from '@aws-sdk/lib-dynamodb'
import {Class, JSObject, PrimaryKey} from 'src/types'
import {SimpleCommand} from './command'
import {Dynam0RMTable} from 'src/table'

export class Save<T extends Dynam0RMTable> extends SimpleCommand<UpdateCommandInput, UpdateCommandOutput> {
    protected readonly command: UpdateCommand

    public constructor(target: Class<T>, Key: PrimaryKey<T>, attributes: JSObject) {
        super(target)
        let ExpressionAttributeNames, ExpressionAttributeValues, UpdateExpressions: string[] | undefined
        if (this.ignore) for (const key in attributes) if (this.ignore.includes(key)) delete attributes[key]
        if (Object.keys(attributes).length) {
            ExpressionAttributeNames = {}
            ExpressionAttributeValues = {}
            UpdateExpressions = []
            for (const [key, value] of Object.entries(attributes)) {
                Object.defineProperty(ExpressionAttributeNames, `#${key}`, {value: key, enumerable: true})
                Object.defineProperty(ExpressionAttributeValues, `:${key}`, {value, enumerable: true})
                UpdateExpressions.push(`#${key} = :${key}`)
            }
        }
        this.command = new UpdateCommand({
            TableName: this.tableName,
            Key,
            ExpressionAttributeNames,
            ExpressionAttributeValues,
            UpdateExpression: UpdateExpressions && 'SET ' + UpdateExpressions.join(', '),
            ReturnValues: 'ALL_NEW'
        })
    }
}