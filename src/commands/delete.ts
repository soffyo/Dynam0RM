import { DeleteCommand, DeleteCommandInput, DeleteCommandOutput } from "@aws-sdk/lib-dynamodb"
import { SimpleCommand } from "./command"
import { iterateConditions } from "src/iterators"
import { PrimaryKeys, Condition, Class } from "src/types"

export class Delete<T> extends SimpleCommand<DeleteCommandInput, DeleteCommandOutput, T> {
    protected command: DeleteCommand
    public constructor(target: Class, Key: PrimaryKeys<T>, condition?: Condition<T>) {
        super(target)
        let ExpressionAttributeNames, ExpressionAttributeValues, ConditionExpressions: string[] = []
        if (condition) {
            ExpressionAttributeNames = {}
            ExpressionAttributeValues = {}
            iterateConditions(condition, [], ExpressionAttributeNames, ExpressionAttributeValues, ConditionExpressions)
        }
        this.command = new DeleteCommand({
            Key,
            TableName: this.tableName,
            ReturnValues: 'ALL_OLD',
            ExpressionAttributeNames,
            ExpressionAttributeValues,
            ConditionExpression: ConditionExpressions.length ? ConditionExpressions.join(' AND ') : undefined
        })
    }
    public async exec() {
        try {
            const { Attributes } = await this.send()
            this.response.output = Attributes as T
            this.response.message = 'Item deleted successfully.'
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