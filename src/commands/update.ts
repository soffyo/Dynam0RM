import {UpdateCommand, UpdateCommandOutput} from '@aws-sdk/lib-dynamodb'
import {Command, Response} from 'src/commands/command'
import {iterateConditionsArray, iterateUpdates} from 'src/iterators'
import {PrimaryKey, Condition, Update as TUpdate, Class} from 'src/types'
import {Dynam0RMTable} from "src/table";
import {Dynam0RMError} from "src/validation/error";

export class Update<T extends Dynam0RMTable> extends Command<UpdateCommandOutput> {
    protected readonly commands: UpdateCommand[] = []
    protected  readonly response = new Response<UpdateCommandOutput>()
    private readonly ConditionAttributeNames = {}
    private readonly ConditionAttributeValues = {}
    private readonly ConditionExpressions: string[][] = [[]]

    public constructor(target: Class<T>, Key: PrimaryKey<T>, update: TUpdate<T>, conditions?: Condition<T>[]) {
        super(target)
        for (const key in Key) {
            if (key === this.keySchema[0]?.AttributeName || key === this.keySchema[1]?.AttributeName) {
                Object.defineProperty(this.ConditionAttributeNames, `#${key}`, {
                    value: key,
                    enumerable: true
                })
                this.ConditionExpressions[0].push(`attribute_exists(#${key})`)
            }
        }
        if (conditions) iterateConditionsArray(conditions, [], this.ConditionAttributeNames, this.ConditionAttributeValues, this.ConditionExpressions)
        iterateUpdates(update, [], Key, this.tableName, this.commands)
        this.commands.reverse()
    }

    public async send() {
        try {
            let responses: UpdateCommandOutput[] = []
            let index = 0
            for (const command of this.commands) {
                if (index === 0) {
                    const AND = this.ConditionExpressions.length > 1 ? 'AND' : ''
                    command.input.ExpressionAttributeNames = {...command.input.ExpressionAttributeNames, ...this.ConditionAttributeNames}
                    command.input.ExpressionAttributeValues = {...command.input.ExpressionAttributeValues, ...this.ConditionAttributeValues}
                    command.input.ConditionExpression =
                    `(${this.ConditionExpressions[0].join(' AND ')}) ${AND} ${this.ConditionExpressions.filter((_, i) => i > 0).map(block => `(${block.join(' AND ')})`).join(' OR ')}`
                }
                responses.push(await this.dynamoDBDocumentClient.send(command))
                index++
            }
            if (responses.length) {
                this.response.output = responses[responses.length - 1]
                this.response.ok = true
            }
        } catch (error: any) {
            this.response.ok = false
            this.response.error = error
            this.logError(error)
        }
        return this.response
    }
}