import { UpdateCommand, UpdateCommandInput, UpdateCommandOutput } from '@aws-sdk/lib-dynamodb'
import { BatchCommand } from 'src/commands/command'
import { iterateConditions, iterateUpdates } from 'src/iterators'
import { PrimaryKeys, Condition, Update as TUpdate, Class } from 'src/types'

export class Update <T> extends BatchCommand<UpdateCommandInput, UpdateCommandOutput, T> {
    protected readonly commands: UpdateCommand[] = []

    private readonly ConditionAttributeNames = {}
    private readonly ConditionAttributeValues = {}
    private readonly ConditionExpressions: string[] = []

    public constructor(target: Class, Key: PrimaryKeys<T>, update: TUpdate<T>, conditions?: Condition<T>) {
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
        if (conditions) iterateConditions(conditions, [], this.ConditionAttributeNames, this.ConditionAttributeValues, this.ConditionExpressions)
        iterateUpdates(update, [], Key, this.tableName, this.commands)
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
            responses.push(await this.dynamoDBDocumentClient.send(command))
            index++
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
            this.logError(error)
        } finally {
            return this.response
        }
    }
}